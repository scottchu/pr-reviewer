import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {semanticFixture} from "./semantic-fixture.ts";
import {loadSourceContext,createNodeEffects} from "../src/source-acquisition/public.ts";
import {contextAnalysisInput,acquirePreparedContext} from "../src/source-preparation/public.ts";
import {runAnalysisWorker} from "../src/analysis-jobs/public.ts";
import type {DeclarationInventoryInput} from "../src/source-analysis/public.ts";
const inventory=(input:DeclarationInventoryInput,invocationId:string)=>runAnalysisWorker({protocol:"analysis-worker-v1",invocationId,phase:"inventory",input},{recordProcess:()=>{},cancelled:()=>false});
const context=async(f:ReturnType<typeof semanticFixture>,commit:string)=>{
 const result=await loadSourceContext({worktree:f.root,snapshotId:"mapping-fixture",identity:{provider:"github",host:"github.com",targetProject:"scottchu/pr-reviewer",sourceProject:"scottchu/pr-reviewer",number:1},commits:{base:commit,head:commit},priorityPaths:{base:["callee.ts"],head:["callee.ts"]}},createNodeEffects());assert.equal(result.kind,"prepared");if(result.kind!=="prepared")throw new Error("fixture_context");return result.corpus;
};
test("real 129th prepared-source boundary retains every excluded path through mapping and worker inventory",async()=>{
 const f=semanticFixture();try{
  for(let index=0;index<127;index++)writeFileSync(join(f.root,`extra-${String(index).padStart(3,"0")}.ts`),`export const extra${index}=()=>${index};\n`);f.git("add",".");f.git("commit","-qm","prepared source boundary");const corpus=await context(f,f.git("rev-parse","HEAD"));assert.equal(corpus.accounts.base.knownSourcePaths,130);assert.equal(corpus.accounts.base.preparedSources,128);assert.equal(corpus.accounts.base.excludedSources,2);const projected=contextAnalysisInput(corpus);assert.equal(projected.sources.length,260);assert.equal(projected.sources.filter(source=>source.side==="base"&&source.source).length,128);assert.equal(projected.sources.filter(source=>source.side==="base"&&source.exclusion==="excluded").length,2);
  const result=(await inventory(projected,"prepared-boundary")).envelope.result;assert.equal(result.status,"available");assert.equal(result.coverage.length,260);assert.equal(result.coverage.filter(source=>source.side==="base"&&source.status==="excluded").length,2);
 }finally{f.cleanup();}
});
test("real directory-heavy 4096 traversal cap preserves boundary rows and unknown descendants without fake parser files",async()=>{
 const f=semanticFixture();try{
  for(let index=0;index<220;index++){const directory=join(f.root,`directory-${String(index).padStart(4,"0")}`);mkdirSync(directory);for(let file=0;file<20;file++)writeFileSync(join(directory,`entry-${file}.txt`),"non-TypeScript traversal entry\n");}f.git("add",".");f.git("update-index","--add","--cacheinfo",`160000,${f.snapshot.headSha},a-boundary`);f.git("commit","-qm","directory-heavy cap");const commit=f.git("rev-parse","HEAD"),retained=f.snapshot.sources.find(source=>source.side==="head")!,snapshot={...f.snapshot,snapshotId:"directory-limit",baseSha:commit,headSha:commit,sources:(["base","head"] as const).map(side=>({...retained,side}))};f.store.prepare("bounded",snapshot);f.store.analysis.command(f.token,{...f.request,commandId:"bounded-context",reviewId:"bounded",snapshotId:snapshot.snapshotId});const owner=f.store.analysis.beginOwner(),claim=f.store.analysis.claim(owner)!;const prepared=await acquirePreparedContext(f.store.analysis.contextInput(claim.grant),createNodeEffects());assert.equal(prepared.kind,"prepared");if(prepared.kind!=="prepared")throw new Error("fixture_context");const corpus=prepared.corpus;assert.ok(prepared.issues.some(issue=>issue.reason==="inventory_limit"));assert.throws(()=>f.store.analysis.finishContext(claim.grant,{corpus,issues:[]},prepared.witness),/source_identity_conflict/);f.store.analysis.finishContext(claim.grant,{corpus,issues:prepared.issues},prepared.witness);assert.deepEqual(f.store.analysis.query(f.token,{reviewId:"bounded",snapshotId:snapshot.snapshotId}).preparation?.corpus?.issues,prepared.issues);assert.equal(corpus.accounts.base.enumeration,"incomplete");assert.equal(corpus.accounts.base.unvisitedPaths,null);assert.equal(corpus.accounts.base.observedTreeEntries,4096);assert.ok(corpus.ledger.some(row=>row.kind==="submodule"));const projected=contextAnalysisInput(corpus);assert.equal(projected.sources.length,corpus.ledger.filter(row=>row.kind==="source").length);assert.equal(projected.corpus.base.inventory,"selected-context");const result=(await inventory(projected,"directory-boundary")).envelope.result;assert.equal(result.status,"available");assert.equal(result.coverage.length,projected.sources.length);assert.ok(projected.sources.every(source=>!source.path.endsWith("/")));
 }finally{f.cleanup();}
});
test("analyzer known-path and projected metadata limits remain independently revalidated without ledger truncation",async()=>{
 const f=semanticFixture();try{
  const corpus=await context(f,f.git("rev-parse","HEAD")),projected=contextAnalysisInput(corpus),baseline=(await inventory(projected,"metadata-baseline")).envelope.result;
  const metadata=(await inventory({...projected,budgets:{...projected.budgets,inventoryBytes:baseline.observed.inventoryBytes-1}},"metadata-limit")).envelope.result;assert.equal(metadata.status,"unavailable");if(metadata.status==="unavailable")assert.equal(metadata.limit,"inventoryBytes");assert.equal(metadata.coverage.length,projected.sources.length);
  const sources=Array.from({length:4097},(_,index)=>({side:"base" as const,path:`known-${index}.ts`,commit:projected.commits.base,role:"context" as const,selected:false,exclusion:"excluded" as const}));const paths=(await inventory({...projected,sources},"known-path-limit")).envelope.result;assert.equal(paths.status,"unavailable");if(paths.status==="unavailable")assert.equal(paths.limit,"inventoryPathsPerSide");assert.equal(paths.coverage.length,4097);
 }finally{f.cleanup();}
});
