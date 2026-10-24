import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestFixture} from './head-test-fixture.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';
import {prepareHeadTestInputs,executePreparedHeadTest,observeHeadTestOutcome} from '../src/test-jobs/public.ts';
import type {HeadTestOutcomeWitness} from '../src/test-jobs/public.ts';
test('B04 actual fixed fixture result atomically releases lease with replayable receipt and authorized plain artifact',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);
  const receipt=f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  const prepared=await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.prepared(grant,prepared);await executePreparedHeadTest({store:f.store,grant,witness:prepared});
  const witness=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(witness);
  assert.throws(()=>f.store.tests.complete(grant,{} as HeadTestOutcomeWitness),/invalid_test_witness/);
  const admitted=f.store.tests.complete(grant,witness);assert.deepEqual(f.store.tests.complete(grant,witness),admitted);
  const job=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!;
  assert.equal(job.state,'passed');assert.equal(job.result!.coverage,'prepared_execution');assert.equal(job.result!.execution!.collectionObserved,true);assert.equal(job.invocations[0]!.quiescence,'confirmed');assert.equal(JSON.stringify(job).includes(input.executionRoot),false);
  const output=job.result!.artifacts.find(item=>item.label==='test_root.stderr')!;
  const query={reviewId:'review',snapshotId:'head-snapshot',jobId:job.jobId,artifactId:output.artifactId};
  const artifact=await f.store.tests.artifact(f.token,query);assert.match(artifact.text,/4 pass/);assert.equal(artifact.complete,true);
  await assert.rejects(f.store.tests.artifact('invalid',query),/unauthorized/);await assert.rejects(f.store.tests.artifact(f.token,{...query,snapshotId:'wrong'}));
  f.store.imports.command(f.token,{type:'RequestImport',commandId:'after-result',path:'/never-run'});assert.ok(f.store.imports.claim(f.store.imports.beginOwner()));
 }finally{f.cleanup();await input.cleanup();}
});
test('B04 early copy failure settles partial preparation without invented complete source or exit evidence',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);await writeFile(join(input.donor,'bun.lock'),'changed');
  f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  await assert.rejects(prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input}),/environment_unavailable/);
  const witness=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(witness);const receipt=f.store.tests.complete(grant,witness);
  const result=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!.result!;
  assert.equal(result.state,'unavailable');assert.equal(result.coverage,'partial_preparation');assert.equal(result.preparation,null);assert.equal(result.execution,null);assert.equal(result.executionAbsence,'not_started');
 }finally{f.cleanup();await input.cleanup();}
});
test('B04 cancellation after observation invalidates success witness then settles cancellation with same invocation',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  const prepared=await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.prepared(grant,prepared);await executePreparedHeadTest({store:f.store,grant,witness:prepared});
  const success=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(success);const current=f.store.tests.input(grant).job;
  f.store.tests.command(f.token,{type:'CancelTest',commandId:'late-cancel',jobId:current.jobId,expectedJobRevision:current.jobRevision});assert.throws(()=>f.store.tests.complete(grant,success),/invalid_test_witness/);
  const cancelled=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(cancelled);f.store.tests.complete(grant,cancelled);
  assert.equal(f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:current.jobId}).selectedJob!.state,'cancelled');
 }finally{f.cleanup();await input.cleanup();}
});
test('B04 cancelled before preparation settles no-process evidence without fabricating identities',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;const job=f.store.tests.input(grant).job;
  f.store.tests.command(f.token,{type:'CancelTest',commandId:'before-prepare',jobId:job.jobId,expectedJobRevision:job.jobRevision});
  await assert.rejects(prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input}),/test_cancelled/);
  const witness=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(witness);f.store.tests.complete(grant,witness);
  const result=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:job.jobId}).selectedJob!.result!;
  assert.equal(result.coverage,'no_process_execution');assert.equal(result.state,'cancelled');assert.equal(result.evidence.treeId,null);assert.equal(result.evidence.closureManifestId,null);assert.equal(result.processes.length,0);
 }finally{f.cleanup();await input.cleanup();}
});
test('B04 corrupted artifact preserves committed result while bounded read reports integrity failure',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  const prepared=await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.prepared(grant,prepared);await executePreparedHeadTest({store:f.store,grant,witness:prepared});
  const witness=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(witness);const receipt=f.store.tests.complete(grant,witness);
  const result=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!.result!,artifact=result.artifacts.find(item=>item.label==='test_root.stderr')!;
  const {readdir}=await import('node:fs/promises'),publication=(await readdir(artifactRoot))[0]!;await writeFile(join(artifactRoot,publication,artifact.artifactId),'changed');
  await assert.rejects(f.store.tests.artifact(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId,artifactId:artifact.artifactId}),/^Error: artifact_integrity_error$/);
  assert.equal(f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!.result!.resultId,result.resultId);
 }finally{f.cleanup();await input.cleanup();}
});
