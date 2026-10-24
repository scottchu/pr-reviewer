import {createHash} from "node:crypto";
import {test} from "node:test";
import assert from "node:assert/strict";
import {writeFileSync,rmSync} from "node:fs";
import {join} from "node:path";
import {providerFixture} from "./provider-fixture.ts";
import {acquirePreparedSnapshot,acquirePreparedContext,isPreparedContextWitness,contextAnalysisInput} from "../src/source-preparation/public.ts";
import {analysisCommandSchema,createImportedReview,canonical} from "../src/domain/public.ts";
import {createNodeEffects} from "../src/source-acquisition/public.ts";

test("context witness binds exact retained snapshot/job and mapping preserves unchanged source without changing snapshot",async()=>{
 const f=providerFixture();try{
  writeFileSync(join(f.root,"callee.ts"),'export const callee = () => 1;\n');writeFileSync(join(f.root,"caller.ts"),'import {callee} from "./callee"; export const caller=()=>callee();\n');f.git("add",".");f.git("commit","-qm","TypeScript base");const baseSha=f.git("rev-parse","HEAD");writeFileSync(join(f.root,"callee.ts"),'export const callee = () => 2;\n');f.git("add",".");f.git("commit","-qm","TypeScript head");const headSha=f.git("rev-parse","HEAD");
  const prepared={kind:"prepared" as const,snapshot:{snapshotId:"a".repeat(64),repository:"team/repo",prUrl:f.candidate.url,prNumber:1,baseSha,headSha,candidate:{...f.candidate,baseSha,headSha,targetTipSha:baseSha},sources:(["base","head"] as const).map(side=>{const content=`export const callee = () => ${side==="base"?1:2};\n`;return {side,path:"callee.ts",content,hash:createHash("sha256").update(content).digest("hex"),lineCount:1};})}};
  const review=createImportedReview("review",prepared.snapshot),before=canonical(review);
  const result=await acquirePreparedContext({jobId:"analysis",review,snapshotId:prepared.snapshot.snapshotId,worktree:f.root,priorityPaths:{base:["callee.ts"],head:["callee.ts"]}},createNodeEffects());assert.equal(result.kind,"prepared");if(result.kind!=="prepared")return;
  assert.equal(isPreparedContextWitness(result.witness,"analysis","review",prepared.snapshot,result.corpus),true);
  assert.equal(isPreparedContextWitness(JSON.parse(JSON.stringify(result.witness)),"analysis","review",prepared.snapshot,result.corpus),false);
  assert.equal(isPreparedContextWitness(result.witness,"other","review",prepared.snapshot,result.corpus),false);
  assert.equal(isPreparedContextWitness(result.witness,"analysis","review",prepared.snapshot,{...result.corpus,corpusId:"f".repeat(64)}),false);
  const input=contextAnalysisInput(result.corpus);assert.ok(input.sources.some(source=>source.path==="caller.ts"&&source.role==="context"&&source.source));assert.equal(input.corpus.base.inventory,"repository-enumeration");assert.equal(canonical(review),before);
  const conflicting={...review,snapshots:[{...prepared.snapshot,sources:prepared.snapshot.sources.map(source=>({...source,content:"conflicting"}))}]};
  await assert.rejects(acquirePreparedContext({jobId:"bad",review:conflicting,snapshotId:prepared.snapshot.snapshotId,worktree:f.root},createNodeEffects()),/source_identity_conflict/);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test("semantic commands reject unknown edits, traversal, excess priorities and synthetic seeds",()=>{
 const request={type:"RequestAnalysis",commandId:"request",reviewId:"review",snapshotId:"snapshot",expectedAnalysisGeneration:0};assert.equal(analysisCommandSchema.safeParse(request).success,true);
 for(const invalid of [{...request,edges:[]},{...request,priorityPaths:{base:["../outside"]}},{...request,priorityPaths:{base:Array.from({length:40},(_,i)=>`a${i}`),head:Array.from({length:40},(_,i)=>`b${i}`)}},{type:"SelectAnalysisDeclarations",commandId:"select",jobId:"job",expectedJobRevision:0,corpusId:"a".repeat(64),inventoryId:"b".repeat(64),declarationIds:["seed"],seeds:[]}])assert.equal(analysisCommandSchema.safeParse(invalid).success,false);
});
