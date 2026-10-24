import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";
import { posix } from "node:path";
import { createStore } from "../src/storage/public.ts";
import { canonical } from "../src/domain/public.ts";
import { dataRoot, files, writePrivate } from "./local.ts";
import type { Snapshot, Source, ChangedFile, DocumentReference } from "../src/domain/public.ts";
const inputSchema = z
  .object({
    prNumber: z.number().int().positive(),
    prUrl: z.url(),
    baseSha: z.string().regex(/^[a-f0-9]{40}$/),
    headSha: z.string().regex(/^[a-f0-9]{40}$/),
    path: z.string().min(1).max(1024).optional(),
    paths: z.array(z.string().min(1).max(1024)).min(1).max(64).optional(),
    title: z.string().trim().min(1).max(200).optional(),
  })
  .strict().refine(value => Boolean(value.path) !== Boolean(value.paths), "choose path or paths")
  .refine(value => (value.paths ?? [value.path!]).every(path => !path.startsWith("/") && !path.split("/").includes("..") && !path.includes("\0")), "invalid repository path");
const bootstrap: z.infer<typeof inputSchema> = {
  prNumber: 14,
  prUrl: "https://github.com/scottchu/pr-reviewer/pull/14",
  baseSha: "a6d63c1e46424cb979ee912aa993ad964835c287",
  headSha: "fd6c5fb26a325c8318087c0f058de247a55e6c07",
  path: "docs/README.md",
};
const readGit = (args: string[]): Buffer => {
  try {
    return execFileSync("git", args, {
      maxBuffer: 1048576,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("source_unavailable: pinned Git object cannot be read");
  }
};
export const buildSnapshot = (input: unknown): Snapshot => {
  const spec=inputSchema.parse(input), {baseSha,headSha}=spec;
  for(const sha of [baseSha,headSha]) if(readGit(["cat-file","-t",sha]).toString("utf8").trim()!=="commit") throw new Error("source_unavailable: pinned object must be a commit");
  const readSource=(path:string,side:"base"|"head"):Source => {
    const object=`${side==="base"?baseSha:headSha}:${path}`;
    if(readGit(["cat-file","-t",object]).toString("utf8").trim()!=="blob")throw new Error("source_unavailable: selected path must be a blob");
    const bytes=readGit(["cat-file","blob",object]);
    let content:string;
    try {content=new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes);} catch {throw new Error("source_unavailable: selected blob is not valid UTF-8");}
    if(content.includes("\0"))throw new Error("source_unavailable: binary content");
    const lineCount=content.endsWith("\n")?content.split("\n").length-1:content.split("\n").length;
    if(!content||lineCount<1)throw new Error("source_unavailable: empty content");
    return {path,side,content,lineCount,hash:createHash("sha256").update(content,"utf8").digest("hex")};
  };
  let sources:Source[]=[], changedFiles:ChangedFile[]|undefined, documentReferences:DocumentReference[]|undefined;
  if(spec.path) sources=(["base","head"] as const).map(side=>readSource(spec.path!,side));
  else {
    const selected=new Set(spec.paths), fields=readGit(["diff","--name-status","--no-renames","-z",baseSha,headSha,"--"]).toString("utf8").split("\0");
    changedFiles=[];
    for(let i=0;i<fields.length-1;i+=2){
      const status=fields[i]!,path=fields[i+1]!;
      if(!["M","A","D","T"].includes(status))throw new Error("source_unavailable: unsupported change status");
      const entry:ChangedFile={status:status==="A"?"added":status==="D"?"deleted":status==="T"?"type_changed":"modified",oldPath:status==="A"?null:path,newPath:status==="D"?null:path,dispositions:[]};
      for(const side of ["base","head"] as const){
        if((status==="A"&&side==="base")||(status==="D"&&side==="head"))continue;
        if(!selected.has(path)){entry.dispositions.push({side,path,state:"unprepared",reason:"outside explicit prepared paths"});continue;}
        try {const source=readSource(path,side);sources.push(source);entry.dispositions.push({side,path,state:"prepared",reason:"verified Git blob"});}
        catch(error){entry.dispositions.push({side,path,state:"unsupported",reason:error instanceof Error?error.message:"source_unavailable"});}
      }
      changedFiles.push(entry);
    }
    if([...selected].some(path=>!changedFiles!.some(f=>f.oldPath===path||f.newPath===path)))throw new Error("invalid_request: prepared paths must occur in changed inventory");
    if(!sources.length)throw new Error("source_unavailable: no selectable prepared text");
    documentReferences=[];
    const origins=[...sources];let count=0;
    for(const source of origins){
      if(!source.path.endsWith(".md"))continue;
      let fence=false;
      for(const [index,line] of source.content.split("\n").entries()){
        if(/^\s*(```|~~~)/.test(line)){fence=!fence;continue;}if(fence)continue;
        for(const match of line.matchAll(/(?<!!)\[[^\]]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)){
          if(count++>=120)break;
          const destination=match[1]!;
          const reference:DocumentReference={destination,source:{snapshotId:"pending",side:source.side,path:source.path,startLine:index+1,endLine:index+1},target:null,method:"inline_markdown_link",reason:null};
          try {
            if(/^[a-z][a-z0-9+.-]*:/i.test(destination)||destination.startsWith("//"))throw new Error("external destination");
            const decoded=decodeURIComponent(destination),[relative,fragment]=decoded.split("#");
            const path=posix.normalize(posix.join(posix.dirname(source.path),relative||posix.basename(source.path)));
            if(decoded.startsWith("/")||path===".."||path.startsWith("../")||path.includes("\0")||path.includes("?"))throw new Error("unsupported or outside repository destination");
            let target=sources.find(s=>s.path===path&&s.side===source.side);
            if(!target){if(sources.length>=128)throw new Error("context source budget exhausted");target=readSource(path,source.side);sources.push(target);}
            let targetLine=1;
            if(fragment){const headings=target.content.split("\n");const found=headings.findIndex(line=>/^#{1,6} /.test(line)&&line.replace(/^#+ /,"").toLowerCase().replace(/[^\p{L}\p{N} _-]/gu,"").replace(/ /g,"-")===fragment);if(found<0)throw new Error("heading fragment unresolved");targetLine=found+1;}
            reference.target={snapshotId:"pending",side:source.side,path,startLine:targetLine,endLine:targetLine};
          } catch(error){reference.reason=error instanceof Error?error.message:"target unavailable";}
          documentReferences.push(reference);
        }
      }
    }
  }
  if(changedFiles)changedFiles=changedFiles.map(file=>({...file,dispositions:file.dispositions.map(disposition=>sources.some(source=>source.side===disposition.side&&source.path===disposition.path)?{...disposition,state:"prepared" as const,reason:disposition.state==="prepared"?disposition.reason:"verified referenced Git blob"}:disposition)}));
  // Legacy identity is retained byte-for-byte. New multi-file identity excludes the
  // as-yet-derived snapshot IDs in reference anchors to avoid a circular hash.
  const identity={baseSha,headSha,sources,...(changedFiles?{changedFiles,documentReferences:documentReferences??[]}: {})};
  const snapshotId=createHash("sha256").update(JSON.stringify(identity)).digest("hex");
  if(documentReferences)documentReferences=documentReferences.map(r=>({...r,source:{...r.source,snapshotId},target:r.target?{...r.target,snapshotId}:null}));
  return {snapshotId,repository:"scottchu/pr-reviewer",prUrl:spec.prUrl,prNumber:spec.prNumber,baseSha,headSha,sources,...(spec.title?{title:spec.title}:{}),...(changedFiles?{changedFiles,documentReferences:documentReferences??[]}: {})};
};
export const prepareSource = (root: string) => {
  const paths = files(root);
  let retained: z.infer<typeof inputSchema> | null = null;
  if (existsSync(paths.input))
    retained = inputSchema.parse(JSON.parse(readFileSync(paths.input, "utf8")));
  else if (existsSync(paths.database)) {
    const persisted = createStore(paths.database);
    try {
      const owner = { kind: "user" as const, actorId: "local-user" };
      const reviews = persisted.list(owner);
      if (reviews.length > 1)
        throw new Error(
          "command_conflict: data root has multiple prepared targets",
        );
      if (reviews[0]) {
        const snapshot = persisted.review(owner, reviews[0].reviewId).snapshot;
        retained = inputSchema.parse({
          prNumber: snapshot.prNumber,
          prUrl: snapshot.prUrl,
          baseSha: snapshot.baseSha,
          headSha: snapshot.headSha,
          path: snapshot.sources[0]?.path,
          ...(snapshot.title ? { title: snapshot.title } : {}),
        });
      }
    } finally {
      persisted.close();
    }
  }
  const spec = process.env.REVIEW_SOURCE_SPEC
    ? inputSchema.parse(
        JSON.parse(readFileSync(process.env.REVIEW_SOURCE_SPEC, "utf8")),
      )
    : (retained ?? bootstrap);
  if (
    spec.prUrl !==
    `https://github.com/scottchu/pr-reviewer/pull/${spec.prNumber}`
  )
    throw new Error(
      "invalid_request: only explicitly selected real project PRs",
    );
  if (retained && canonical(retained) !== canonical(spec))
    throw new Error(
      "command_conflict: use a fresh data root for another prepared target",
    );
  const snapshot = buildSnapshot(spec);
  const reviewId = `pr-${spec.prNumber}`;
  const store = createStore(paths.database);
  try {
    const existing = store.list({ kind: "user", actorId: "local-user" });
    if (existing.some((review) => review.reviewId !== reviewId))
      throw new Error("command_conflict: different target already prepared");
    store.prepare(reviewId, snapshot);
  } finally {
    store.close();
  }
  writePrivate(paths.input, spec);
  writePrivate(paths.snapshot, snapshot);
  return snapshot;
};
if (process.argv[1]?.endsWith("/prepare.ts")) {
  const snapshot = prepareSource(dataRoot());
  console.log(
    JSON.stringify(
      {
        reviewId: `pr-${snapshot.prNumber}`,
        snapshotId: snapshot.snapshotId,
        sources: snapshot.sources.map(({ path, side, hash, lineCount }) => ({
          path,
          side,
          hash,
          lineCount,
        })),
      },
      null,
      2,
    ),
  );
}
