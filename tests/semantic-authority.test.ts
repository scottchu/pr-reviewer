import {test} from "node:test";
import assert from "node:assert/strict";
import {rmSync} from "node:fs";
import {semanticFixture} from "./semantic-fixture.ts";
import {createStore} from "../src/storage/public.ts";
import {acquirePreparedContext,acquirePreparedSnapshot} from "../src/source-preparation/public.ts";
import {createNodeEffects} from "../src/source-acquisition/public.ts";
import {providerFixture} from "./provider-fixture.ts";
for(const kind of ["analysis","import"] as const)test(`replaced store epoch fences every old ${kind} effect callback without freeing unknown ownership`,()=>{
 const f=semanticFixture();let replacement:ReturnType<typeof createStore>|undefined;try{
  if(kind==="analysis"){
   f.store.analysis.command(f.token,f.request);const owner=f.store.analysis.beginOwner(),claim=f.store.analysis.claim(owner);assert.ok(claim);replacement=createStore(f.filename);
   for(const operation of [()=>f.store.analysis.launchLimit(claim.grant),()=>f.store.analysis.cancelled(claim.grant),()=>f.store.analysis.contextInput(claim.grant),()=>f.store.analysis.recordProcess(claim.grant,{ordinal:1,executable:"git",state:"requested"}),()=>f.store.analysis.beginOwner()])assert.throws(operation,/stale_execution_owner/);
   const newOwner=replacement.analysis.beginOwner();assert.equal(replacement.analysis.unknown(newOwner).length,1);replacement.imports.command(f.token,{type:"RequestImport",commandId:"blocked-import",path:f.root});assert.equal(replacement.imports.claim(replacement.imports.beginOwner()),null);
  }else{
   f.store.imports.command(f.token,{type:"RequestImport",commandId:"import",path:f.root});const owner=f.store.imports.beginOwner(),claim=f.store.imports.claim(owner);assert.ok(claim);replacement=createStore(f.filename);
   for(const operation of [()=>f.store.imports.launchLimit(claim.grant),()=>f.store.imports.cancelled(claim.grant),()=>f.store.imports.recordProcess(claim.grant,{ordinal:1,executable:"git",state:"requested"}),()=>f.store.imports.beginOwner()])assert.throws(operation,/stale_execution_owner/);
   const newOwner=replacement.imports.beginOwner();assert.equal(replacement.imports.unknown(newOwner).length,1);replacement.analysis.command(f.token,f.request);assert.equal(replacement.analysis.claim(replacement.analysis.beginOwner()),null);
  }
 }finally{replacement?.close();f.cleanup();}
});
test("unadmitted import cannot provide an implicit analysis locator; admitted exact snapshot may",async()=>{
 const f=providerFixture({kind:"zero"}),fixture=semanticFixture();try{
  const prepared=await acquirePreparedSnapshot({jobId:"setup",reviewId:"provider",worktree:f.root,candidate:f.candidate},f.effects);assert.equal(prepared.kind,"prepared");if(prepared.kind!=="prepared")throw new Error("fixture");fixture.store.prepare("provider",prepared.snapshot);
  fixture.store.imports.command(fixture.token,{type:"RequestImport",commandId:"import",path:f.root,target:{reviewId:"provider",expectedCurrentSnapshotId:prepared.snapshot.snapshotId}});const owner=fixture.store.imports.beginOwner(),discovery=fixture.store.imports.claim(owner)!;fixture.store.imports.finishDiscovery(discovery.grant,{kind:"unique",canonicalWorktree:f.root,candidates:[f.candidate]});
  const request={type:"RequestAnalysis" as const,commandId:"premature-locator",reviewId:"provider",snapshotId:prepared.snapshot.snapshotId,expectedAnalysisGeneration:0};assert.equal(fixture.store.analysis.command(fixture.token,request).error,"source_locator_required");
  const claim=fixture.store.imports.claim(owner)!,admitted=await acquirePreparedSnapshot({jobId:claim.job.jobId,reviewId:"provider",worktree:f.root,candidate:f.candidate},f.effects);if(admitted.kind!=="prepared")throw new Error("fixture");fixture.store.imports.finishResult(claim.grant,{artifactId:"owner-fixture",jobId:claim.job.jobId,invocationId:claim.job.invocations.at(-1)!.invocationId,schema:"import-result-v1",bytes:1,digest:"a".repeat(64)});assert.equal(fixture.store.imports.admit(owner,claim.job.jobId,admitted.snapshot,admitted.witness).state,"applied");assert.equal(fixture.store.analysis.command(fixture.token,{...request,commandId:"admitted-locator"}).state,"applied");
  const candidate={...f.candidate,sourceProject:"fork/repo"},updated=await acquirePreparedSnapshot({jobId:"followup",reviewId:"provider",worktree:f.root,candidate},{run:async command=>command.executable!=="git"&&(command.args.at(-1)??"").includes("/pulls/")?{kind:"ok",stdout:Buffer.from(JSON.stringify({number:1,html_url:candidate.url,title:candidate.title,state:candidate.state,head:{ref:candidate.sourceBranch,sha:candidate.headSha,repo:{full_name:candidate.sourceProject}},base:{ref:candidate.targetBranch,sha:candidate.targetTipSha,repo:{full_name:candidate.targetProject}}}))}:f.effectsFor(candidate).run(command)});if(updated.kind!=="prepared")throw new Error("fixture_updated");assert.notEqual(updated.snapshot.snapshotId,prepared.snapshot.snapshotId);assert.equal(fixture.store.command({kind:"user",actorId:"local-user"},{type:"AddSnapshot",commandId:"followup-snapshot",reviewId:"provider",expectedCurrentSnapshotId:prepared.snapshot.snapshotId,identityScheme:"acquisition_v1",snapshot:updated.snapshot},updated.witness).state,"applied");
  assert.equal(fixture.store.analysis.command(fixture.token,{...request,commandId:"different-candidate-locator",snapshotId:updated.snapshot.snapshotId}).error,"source_locator_required");
 }finally{rmSync(f.root,{recursive:true,force:true});fixture.cleanup();}
});
test("trusted context witness rejects removed or fabricated loader issues before retention",async()=>{
 const f=semanticFixture();try{
  f.store.analysis.command(f.token,f.request);const owner=f.store.analysis.beginOwner(),claim=f.store.analysis.claim(owner)!;const result=await acquirePreparedContext(f.store.analysis.contextInput(claim.grant),createNodeEffects());if(result.kind!=="prepared")throw new Error("fixture");
  assert.throws(()=>f.store.analysis.finishContext(claim.grant,{corpus:result.corpus,issues:[{reason:"inventory_limit"}]},result.witness),/source_identity_conflict/);assert.equal(f.store.analysis.query(f.token,{reviewId:"r",snapshotId:f.snapshot.snapshotId}).preparation?.corpus,null);f.store.analysis.finishContext(claim.grant,{corpus:result.corpus,issues:result.issues},result.witness);
 }finally{f.cleanup();}
});
