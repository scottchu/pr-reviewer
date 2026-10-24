import { createHash } from "node:crypto";
import type { AcquisitionEffects, ContextAccount, ContextBudgets, ContextCorpus, ContextIdentity, ContextInput, ContextIssue, ContextLedgerEntry, ContextReason, ContextResult, ContextSide, ContextSource } from "./public.ts";

export const DEFAULT_CONTEXT_BUDGETS:ContextBudgets=Object.freeze({filesPerSide:128,fileBytes:256*1024,totalBytes:4*1024*1024,inventoryEntriesPerSide:4096,inventoryMetadataBytes:2*1024*1024,treeObjectsPerSide:256,treeBytesPerSide:1024*1024,timeoutMs:15_000});
const sides=["base","head"] as const;
const order=(a:string,b:string)=>a < b ? -1 : a > b ? 1 : 0;
const decode=(bytes:Buffer)=>new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);
const digest=(value:Buffer|string)=>createHash("sha256").update(value).digest("hex");
const objectHash=(type:string,bytes:Buffer,oid:string)=>createHash(oid.length === 64 ? "sha256" : "sha1").update(`${type} ${bytes.length}\0`).update(bytes).digest("hex");
const sha=(value:unknown):value is string=>typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
const validPath=(path:unknown):path is string=>typeof path === "string" && path.length > 0 && Buffer.byteLength(path,"utf8") <= 1024 && !path.startsWith("/") && !path.includes("\0") && !path.includes("\\") && !path.split("/").some(p=>p === "." || p === ".." || !p) && Buffer.from(path,"utf8").toString("utf8") === path;
const sourcePath=(path:string)=>/\.tsx?$/.test(path);
const validProject=(value:unknown):value is string=>typeof value === "string" && value.length <= 1024 && /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(value) && !value.split("/").some(p=>p === "." || p === ".." || p.startsWith("-"));
const freeze=<T>(value:T):T=>{if(value && typeof value === "object"){Object.freeze(value);for(const child of Object.values(value)) freeze(child);}return value;};
type MutableAccount={-readonly [K in keyof ContextAccount]:ContextAccount[K]};
type MutableRow={-readonly [K in keyof ContextLedgerEntry]:ContextLedgerEntry[K]};
type ObjectResult={kind:"read";bytes:Buffer}|{kind:"unavailable";reason:ContextReason};
type TreeEntry={mode:string;name:string;objectId:string};
const parseTree=(bytes:Buffer,oidBytes:number):TreeEntry[]=>{
  const entries:TreeEntry[]=[];
  for(let offset=0;offset < bytes.length;) {
    const space=bytes.indexOf(0x20,offset),zero=bytes.indexOf(0,space+1);
    if(space < offset || zero < space || zero+1+oidBytes > bytes.length) throw new Error("invalid tree");
    const mode=bytes.subarray(offset,space).toString("ascii").padStart(6,"0");
    const name=decode(bytes.subarray(space+1,zero));
    if(!/^[0-7]{6}$/.test(mode) || !validPath(name) || name.includes("/")) throw new Error("invalid tree entry");
    entries.push({mode,name,objectId:bytes.subarray(zero+1,zero+1+oidBytes).toString("hex")});
    offset=zero+1+oidBytes;
  }
  if(new Set(entries.map(e=>e.name)).size !== entries.length) throw new Error("duplicate tree entry");
  return entries.sort((a,b)=>order(a.name,b.name));
};

export const loadSourceContext=async(input:ContextInput,effects:AcquisitionEffects):Promise<ContextResult>=>{
  const invalid=():ContextResult=>freeze({kind:"unavailable",corpus:null,issues:[{reason:"invalid_input"}]} as ContextResult);
  if(!input || typeof input.worktree !== "string" || !input.worktree || input.worktree.includes("\0") || typeof input.snapshotId !== "string" || !input.snapshotId || input.snapshotId.length > 200) return invalid();
  const worktree=input.worktree,snapshotId=input.snapshotId;
  const id=input.identity;
  if(!id || !["github","gitlab"].includes(id.provider) || typeof id.host !== "string" || id.host.length > 253 || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::[1-9][0-9]{0,4})?$/.test(id.host) || id.host.includes("..") || !validProject(id.sourceProject) || !validProject(id.targetProject) || !Number.isSafeInteger(id.number) || id.number < 1 || !input.commits || !sha(input.commits.base) || !sha(input.commits.head) || input.commits.base.length !== input.commits.head.length) return invalid();
  const identity:ContextIdentity={provider:id.provider,host:id.host,sourceProject:id.sourceProject,targetProject:id.targetProject,number:id.number};
  const commits={base:input.commits.base,head:input.commits.head};
  const budgets={...DEFAULT_CONTEXT_BUDGETS,...input.budgets};
  if(Object.keys(budgets).some(key=>!(key in DEFAULT_CONTEXT_BUDGETS)) || Object.entries(budgets).some(([key,n])=>!Number.isSafeInteger(n) || n < 1 || n > DEFAULT_CONTEXT_BUDGETS[key as keyof ContextBudgets])) return invalid();
  const priorities:Record<ContextSide,string[]>={base:[],head:[]};
  for(const side of sides) {
    const values=input.priorityPaths?.[side] ?? [];
    if(!Array.isArray(values) || values.length > 4096 || values.some(p=>!validPath(p) || !sourcePath(p))) return invalid();
    priorities[side]=[...new Set(values)].sort(order);
    if(priorities[side].length > budgets.filesPerSide) return invalid();
  }
  const issues:ContextIssue[]=[];
  const ledger:MutableRow[]=[];
  const sources:ContextSource[]=[];
  const accounts={} as Record<ContextSide,MutableAccount>;
  for(const side of sides) accounts[side]={commit:commits[side],inventory:"selected-context",enumeration:"not_started",knownSourcePaths:0,knownBoundaryPaths:0,observedTreeEntries:0,treeObjectsRead:0,treeBytesRead:0,unvisitedPaths:null,preparedSources:0,excludedSources:0,missingSources:0,unsupportedSources:0};
  const git=(args:readonly string[],maxBytes:number)=>effects.run({executable:"git",args:["--no-optional-locks","--no-lazy-fetch","--literal-pathspecs","-c","core.fsmonitor=false","-c","core.hooksPath=/dev/null",...args],cwd:worktree,maxBytes,timeoutMs:budgets.timeoutMs});
  const readObject=async(oid:string,type:"commit"|"tree"|"blob",cap:number):Promise<ObjectResult>=>{
    const kind=await git(["cat-file","-t",oid],128);
    if(kind.kind !== "ok") return {kind:"unavailable",reason:"missing_object"};
    if(kind.stdout.toString().trim() !== type) return {kind:"unavailable",reason:"object_type"};
    const size=await git(["cat-file","-s",oid],128);
    if(size.kind !== "ok" || !/^\d+\n$/.test(size.stdout.toString())) return {kind:"unavailable",reason:"missing_object"};
    const bytes=Number(size.stdout.toString().trim());
    if(!Number.isSafeInteger(bytes) || bytes > cap) return {kind:"unavailable",reason:"file_limit"};
    const object=await git(["cat-file",type,oid],Math.max(bytes+1,128));
    if(object.kind !== "ok" || object.stdout.length !== bytes) return {kind:"unavailable",reason:"missing_object"};
    if(objectHash(type,object.stdout,oid) !== oid) return {kind:"unavailable",reason:"hash_mismatch"};
    return {kind:"read",bytes:object.stdout};
  };
  let reservedMetadataBytes=2;
  // Reserve the longest possible coverage status now, before recording a path. The exact final
  // ledger bytes are reported separately; preparation cannot overflow the metadata cap later.
  const addRow=(row:MutableRow)=>{
    const maximum={...row,role:"declaration-only",change:"unchanged",priority:false,selected:false,preparation:"unsupported",reason:"inventory_metadata_limit"};
    const reserved=Buffer.byteLength(JSON.stringify(maximum),"utf8")+1;
    if(reservedMetadataBytes+reserved > budgets.inventoryMetadataBytes) return false;
    reservedMetadataBytes+=reserved;ledger.push(row);return true;
  };
  let commitFailure=false;
  for(const side of sides) {
    const account=accounts[side];account.enumeration="incomplete";
    const commit=await readObject(commits[side],"commit",1024*1024);
    if(commit.kind !== "read") {issues.push({reason:commit.reason,side});commitFailure=true;continue;}
    const firstLine=commit.bytes.subarray(0,commit.bytes.indexOf(0x0a)).toString("ascii");
    const root=/^tree ([a-f0-9]+)$/.exec(firstLine)?.[1];
    if(!root || !sha(root) || root.length !== commits[side].length) {issues.push({reason:"invalid_tree",side});commitFailure=true;continue;}
    const boundary=(path:string,oid:string,reason:ContextReason)=>{
      if(path) addRow({side,path,commit:commits[side],objectId:oid,mode:"040000",kind:"tree",role:"context",change:"unknown",priority:false,selected:false,preparation:reason === "missing_object" ? "missing" : "unsupported",reason});
    };
    const visit=async(oid:string,prefix:string):Promise<boolean>=>{
      if(account.treeObjectsRead >= budgets.treeObjectsPerSide) {boundary(prefix,oid,"tree_limit");issues.push({reason:"tree_limit",side,...(prefix ? {path:prefix} : {}),limit:"treeObjectsPerSide"});return false;}
      const tree=await readObject(oid,"tree",budgets.treeBytesPerSide-account.treeBytesRead);
      if(tree.kind !== "read") {const reason=tree.reason === "file_limit" ? "tree_byte_limit" : tree.reason;boundary(prefix,oid,reason);issues.push({reason,side,...(prefix ? {path:prefix} : {}),...(reason === "tree_byte_limit" ? {limit:"treeBytesPerSide" as const} : {})});return false;}
      account.treeObjectsRead++;account.treeBytesRead+=tree.bytes.length;
      let entries:TreeEntry[];
      try {entries=parseTree(tree.bytes,commits[side].length/2);} catch {boundary(prefix,oid,"invalid_tree");issues.push({reason:"invalid_tree",side,...(prefix ? {path:prefix} : {})});return false;}
      for(const entry of entries) {
        const path=prefix ? `${prefix}/${entry.name}` : entry.name;
        if(!validPath(path)) {issues.push({reason:"invalid_tree",side,path:prefix || entry.name});return false;}
        if(account.observedTreeEntries >= budgets.inventoryEntriesPerSide) {issues.push({reason:"inventory_limit",side,path,limit:"inventoryEntriesPerSide"});return false;}
        account.observedTreeEntries++;
        if(entry.mode === "040000") {if(!await visit(entry.objectId,path)) return false;continue;}
        const submodule=entry.mode === "160000";
        if(!sourcePath(path) && !submodule) continue;
        const row:MutableRow={side,path,commit:commits[side],objectId:entry.objectId,mode:entry.mode,kind:submodule ? "submodule" : "source",role:/\.d\.ts$/.test(path) ? "declaration-only" : "context",change:"unknown",priority:priorities[side].includes(path),selected:false,preparation:submodule || entry.mode === "120000" ? "unsupported" : "excluded",reason:submodule ? "submodule" : entry.mode === "120000" ? "symlink" : "not_selected"};
        if(!addRow(row)) {issues.push({reason:"inventory_metadata_limit",side,path,limit:"inventoryMetadataBytes"});return false;}
      }
      return true;
    };
    if(await visit(root,"")) {account.enumeration="complete";account.unvisitedPaths=0;account.inventory="repository-enumeration";}
  }
  ledger.sort((a,b)=>order(a.side,b.side) || order(a.path,b.path));
  for(const row of ledger.filter(row=>row.kind === "source")) {
    const other=ledger.find(e=>e.side !== row.side && e.path === row.path && e.kind === "source");
    row.change=other ? other.objectId === row.objectId && other.mode === row.mode ? "unchanged" : "changed" : accounts[row.side === "base" ? "head" : "base"].enumeration === "complete" ? "changed" : "unknown";
    if(row.role !== "declaration-only") row.role=row.change === "changed" ? "changed" : "context";
  }
  let sourceBytes=0;
  const candidates=ledger.filter(row=>row.kind === "source").sort((a,b)=>Number(b.priority)-Number(a.priority) || order(a.side,b.side) || order(a.path,b.path));
  for(const row of candidates) {
    if(row.preparation === "unsupported") {row.selected=row.priority;continue;}
    if(accounts[row.side].preparedSources >= budgets.filesPerSide) {row.reason="source_limit";continue;}
    row.selected=true;
    const blob=await readObject(row.objectId,"blob",budgets.fileBytes);
    if(blob.kind !== "read") {row.preparation=blob.reason === "missing_object" ? "missing" : "unsupported";row.reason=blob.reason;continue;}
    if(sourceBytes+blob.bytes.length > budgets.totalBytes) {row.preparation="excluded";row.reason="total_byte_limit";continue;}
    let content:string;
    try {content=decode(blob.bytes);} catch {row.preparation="unsupported";row.reason="invalid_utf8";continue;}
    if(content.includes("\0")) {row.preparation="unsupported";row.reason="binary";continue;}
    row.preparation="prepared";row.reason=content.length ? "text" : "empty";
    accounts[row.side].preparedSources++;sourceBytes+=blob.bytes.length;
    sources.push({side:row.side,path:row.path,commit:row.commit,role:row.role,selected:true,content,contentHash:digest(blob.bytes),objectId:row.objectId,lineCount:content.length ? content.split("\n").length-(content.endsWith("\n") ? 1 : 0) : 0});
  }
  let requiredFailure=false;
  for(const side of sides) {
    for(const path of priorities[side]) if(!sources.some(s=>s.side === side && s.path === path)) {issues.push({reason:"required_source_unavailable",side,path});requiredFailure=true;}
    const rows=ledger.filter(e=>e.side === side);
    const sourceRows=rows.filter(e=>e.kind === "source");
    accounts[side].knownSourcePaths=sourceRows.length;accounts[side].knownBoundaryPaths=rows.length-sourceRows.length;
    accounts[side].excludedSources=sourceRows.filter(e=>e.preparation === "excluded").length;
    accounts[side].missingSources=sourceRows.filter(e=>e.preparation === "missing").length;
    accounts[side].unsupportedSources=sourceRows.filter(e=>e.preparation === "unsupported").length;
  }
  sources.sort((a,b)=>order(a.side,b.side) || order(a.path,b.path));
  issues.sort((a,b)=>order(a.side ?? "",b.side ?? "") || order(a.path ?? "",b.path ?? "") || order(a.reason,b.reason));
  const ledgerMetadataBytes=Buffer.byteLength(JSON.stringify(ledger),"utf8");
  const data={contract:"pinned-typescript-context-v1" as const,profile:"pinned-typescript-context-v1" as const,provenance:"declared-provider-verified-git" as const,snapshotId,identity,commits,budgets,priorityPaths:priorities,accounts,ledger,sources,observed:{sourceBytes,ledgerMetadataBytes}};
  const corpusId=digest(JSON.stringify({...data,sources:sources.map(({content,...metadata})=>metadata)}));
  const corpus:ContextCorpus={...data,corpusId};
  return freeze({kind:commitFailure || requiredFailure ? "unavailable" : "prepared",corpus,issues} as ContextResult);
};
