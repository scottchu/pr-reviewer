import { createHash } from "node:crypto";
import { lookupChange } from "./provider.ts";
import type { AcquisitionEffects, Budgets, Candidate, ChangedPath, Disposition, Hunk, ImportResult, SourceText } from "./public.ts";
export const defaultBudgets: Budgets = Object.freeze({maxFiles:512,maxBlobBytes:1_048_576,maxTotalBytes:8_388_608,maxHunks:4096,maxInventoryBytes:1_048_576,timeoutMs:15_000});
const digest = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const decode = (bytes: Buffer) => new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);
const objectHash = (kind: "blob" | "commit", bytes: Buffer, oid: string) => createHash(oid.length === 64 ? "sha256" : "sha1").update(`${kind} ${bytes.length}\0`).update(bytes).digest("hex");
const validPath = (path:string) => !!path && !path.startsWith("/") && !path.split("/").some(p => p === ".." || p === ".") && !path.includes("\0");
const oidPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
type RawEntry = {status:ChangedPath["status"];oldPath:string|null;newPath:string|null;oldMode:string;newMode:string;oldOid:string;newOid:string};
const inventory = (bytes: Buffer): RawEntry[] => {
  const fields = decode(bytes).split("\0");
  if (fields.at(-1) !== "") throw new Error("truncated inventory");
  fields.pop();
  const entries:RawEntry[]=[];
  for (let i=0;i<fields.length;) {
    const header=fields[i++];
    const match=header && /^:([0-7]{6}) ([0-7]{6}) ([a-f0-9]{40,64}) ([a-f0-9]{40,64}) ([AMDTRC])([0-9]*)$/.exec(header);
    if (!match) throw new Error("invalid inventory");
    const [,oldMode="",newMode="",oldOid="",newOid="",code] = match;
    const first=fields[i++];
    const second=code === "R" || code === "C" ? fields[i++] : first;
    if (!first || !second || !validPath(first) || !validPath(second) || !oidPattern.test(oldOid) || !oidPattern.test(newOid)) throw new Error("invalid path");
    const statuses:Record<string,ChangedPath["status"]>={A:"added",D:"deleted",M:"modified",T:"type_changed",R:"renamed",C:"copied"};
    const status=code ? statuses[code] : undefined;
    if (!status) throw new Error("unsupported raw status");
    entries.push({status,oldPath:code === "A" ? null : first,newPath:code === "D" ? null : second,oldMode,newMode,oldOid,newOid});
  }
  return entries;
};
const freeze = <T>(value:T):T => {
  if (value && typeof value === "object") {Object.freeze(value);for (const child of Object.values(value)) freeze(child);}
  return value;
};

export const importChange = async (input: Readonly<{worktree:string;candidate:Candidate;budgets?:Partial<Budgets>}>, effects:AcquisitionEffects):Promise<ImportResult> => {
  const budgets={...defaultBudgets,...input.budgets};
  if (!input.worktree || input.worktree.includes("\0") || Object.values(budgets).some(n => !Number.isSafeInteger(n) || n < 1) || Object.entries(budgets).some(([key,n]) => n > defaultBudgets[key as keyof Budgets])) return {kind:"unavailable",issues:[{reason:"invalid_input"}]};
  // Refresh provider provenance; accepting stale metadata would silently review a different change.
  const lookup = await lookupChange(input.candidate,effects,input.worktree);
  if (lookup.kind === "unavailable") return lookup;
  const candidate = lookup.candidate;
  if (["provider","host","targetProject","sourceProject","number","baseSha","headSha","targetTipSha","sourceBranch","targetBranch","baselineMethod","url"].some(k => candidate[k as keyof Candidate] !== input.candidate[k as keyof Candidate])) return {kind:"unavailable",issues:[{reason:"stale_candidate"}]};
  const git = (args:readonly string[],maxBytes:number) => effects.run({executable:"git",args:["--no-optional-locks","-c","core.fsmonitor=false","-c","core.hooksPath=/dev/null",...args],cwd:input.worktree,maxBytes,timeoutMs:budgets.timeoutMs});
  for (const oid of [candidate.baseSha,candidate.headSha]) {
    const type=await git(["cat-file","-t",oid],128);
    if (type.kind !== "ok" || type.stdout.toString().trim() !== "commit") return {kind:"unavailable",issues:[{reason:"missing_object"}]};
    const object=await git(["cat-file","commit",oid],1_048_576);
    if (object.kind !== "ok" || objectHash("commit",object.stdout,oid) !== oid) return {kind:"unavailable",issues:[{reason:"missing_object"}]};
  }
  const raw=await git(["diff-tree","-r","--no-commit-id","--raw","--no-abbrev","-z","--no-ext-diff","--no-textconv","-M","-C",candidate.baseSha,candidate.headSha,"--"],budgets.maxInventoryBytes);
  if (raw.kind !== "ok") return {kind:"unavailable",issues:[{reason:raw.reason}]};
  let entries:RawEntry[];
  try {entries=inventory(raw.stdout);} catch {return {kind:"unavailable",issues:[{reason:"invalid_metadata"}]};}
  if (entries.length > budgets.maxFiles) return {kind:"unavailable",issues:[{reason:"inventory_limit"}]};
  const sources:SourceText[]=[];const changedFiles:ChangedPath[]=[];
  let bytes=0,hunkCount=0;
  for (const entry of entries) {
    const dispositions:Disposition[]=[];
    const fileSources:SourceText[]=[];
    for (const side of ["base","head"] as const) {
      const path=side === "base" ? entry.oldPath : entry.newPath;
      if (path === null) continue;
      const objectId=side === "base" ? entry.oldOid : entry.newOid;
      const mode=side === "base" ? entry.oldMode : entry.newMode;
      const add=(state:Disposition["state"],reason:Disposition["reason"]) => dispositions.push({side,path,state,reason,objectId});
      if (mode === "160000") {add("unsupported","submodule");continue;}
      if (mode === "120000") {add("unsupported","symlink");continue;}
      if (!["100644","100755"].includes(mode)) {add("unsupported","object_type");continue;}
      const type=await git(["cat-file","-t",objectId],128);
      if (type.kind !== "ok") {add("missing","missing_object");continue;}
      if (type.stdout.toString().trim() !== "blob") {add("unsupported","object_type");continue;}
      const size=await git(["cat-file","-s",objectId],128);
      if (size.kind !== "ok" || !/^\d+\n$/.test(size.stdout.toString())) {add("missing","missing_object");continue;}
      const length=Number(size.stdout.toString().trim());
      if (!Number.isSafeInteger(length) || length > budgets.maxBlobBytes) {add("unsupported","blob_limit");continue;}
      if (bytes+length > budgets.maxTotalBytes) {add("unsupported","total_byte_limit");continue;}
      const blob=await git(["cat-file","blob",objectId],Math.max(length+1,128));
      if (blob.kind !== "ok" || blob.stdout.length !== length || objectHash("blob",blob.stdout,objectId) !== objectId) {add("missing","missing_object");continue;}
      bytes+=length;
      let content:string;
      try {content=decode(blob.stdout);} catch {add("unsupported","invalid_utf8");continue;}
      if (content.includes("\0")) {add("unsupported","binary");continue;}
      const lineCount=content.length === 0 ? 0 : content.split("\n").length-(content.endsWith("\n") ? 1 : 0);
      fileSources.push({side,path,content,hash:digest(blob.stdout),objectId,lineCount});
      add("prepared",content.length ? "text" : "empty");
    }
    let hunks:Hunk[]=[];
    let coverage:ChangedPath["coverage"]=dispositions.every(d => d.state === "prepared") ? "text" : "unsupported";
    if (coverage === "text") {
      const patch=await git(["diff","--no-ext-diff","--no-textconv","--no-color","--no-renames","--unified=0",...(entry.oldPath && entry.newPath ? [entry.oldOid,entry.newOid,"--"] : [candidate.baseSha,candidate.headSha,"--",...new Set([entry.oldPath,entry.newPath].filter((p):p is string => p !== null))])],Math.min(budgets.maxTotalBytes,2*budgets.maxBlobBytes+65536));
      let failure:Disposition["reason"]|null=null;
      if (patch.kind !== "ok") failure="patch_unavailable";
      else {
        let text:string;
        try {text=decode(patch.stdout);} catch {text="";failure="patch_unavailable";}
          for (const match of text.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)) {
            const oldStart=Number(match[1]),oldLines=Number(match[2] ?? 1),newStart=Number(match[3]),newLines=Number(match[4] ?? 1);
            hunks.push({id:digest(`${entry.oldPath}\0${entry.newPath}\0${match[0]}`),oldStart,oldLines,newStart,newLines});
          }
        if (hunkCount+hunks.length > budgets.maxHunks) failure="hunk_limit";
      }
      if (failure) {
        coverage="unsupported";hunks=[];
        for (let i=0;i<dispositions.length;i++) {const d=dispositions[i]!;dispositions[i]={...d,state:"unsupported",reason:failure};}
      }
    }
    // Unsupported patch coverage cannot create selectable source pretending to have complete hunks.
    if (coverage === "text") sources.push(...fileSources);
    else for (const source of fileSources) {
      if (dispositions.some(d => d.side === source.side && d.state === "prepared")) sources.push(source);
    }
    hunkCount+=hunks.length;
    changedFiles.push({status:entry.status,oldPath:entry.oldPath,newPath:entry.newPath,oldMode:entry.oldMode,newMode:entry.newMode,dispositions,hunks,coverage});
  }
  const counts={changedPaths:changedFiles.length,preparedSides:changedFiles.flatMap(f => f.dispositions).filter(d => d.state === "prepared").length,unsupportedSides:changedFiles.flatMap(f => f.dispositions).filter(d => d.state === "unsupported").length,missingSides:changedFiles.flatMap(f => f.dispositions).filter(d => d.state === "missing").length,hunks:hunkCount,bytes};
  const identity={provider:candidate.provider,host:candidate.host,targetProject:candidate.targetProject,sourceProject:candidate.sourceProject,number:candidate.number,baseSha:candidate.baseSha,headSha:candidate.headSha,sources,changedFiles};
  return freeze({kind:"imported",value:{snapshotId:digest(JSON.stringify(identity)),candidate,sources,changedFiles,counts}});
};
