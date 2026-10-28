import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestFixture} from './head-test-fixture.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';
import {prepareHeadTestInputs,inspectHeadTestPreparation,createHeadTestConfiguration,readHeadTestConfiguration,observeHeadTestQuiescence} from '../src/test-jobs/public.ts';
import type {HeadTestConfiguration,HeadTestPreparationWitness} from '../src/test-jobs/public.ts';
test('B01/B02 real isolated preparation makes only explicit exact-head configuration eligible and preserves one lease',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),claim=f.store.tests.claim(owner)!;
  const witness=await prepareHeadTestInputs({store:f.store,grant:claim.grant,executionRoot:input.executionRoot,fixtureInputs:input});
  const account=inspectHeadTestPreparation(witness);assert.equal(account.account.account.files.length,4);assert.equal(f.store.tests.journal(claim.grant).invocation.processes!.length,5);
  await assert.rejects(createHeadTestConfiguration({} as HeadTestPreparationWitness,{kind:'trusted-local-head',headSha:input.headSha,sourceAccountId:account.account.sourceAccountId}),/qualification_required/);
  const configuration=await createHeadTestConfiguration(witness,{kind:'trusted-local-head',headSha:input.headSha,sourceAccountId:account.account.sourceAccountId});assert.ok(readHeadTestConfiguration(configuration));
  assert.throws(()=>f.store.tests.prepared(claim.grant,{} as HeadTestPreparationWitness),/invalid_test_witness/);
  const prepared=f.store.tests.prepared(claim.grant,witness);assert.equal(prepared.state,'preparing');assert.equal(prepared.invocations[0]!.phase,'execute');assert.equal(prepared.invocations[0]!.invocationId,claim.job.invocations[0]!.invocationId);
  f.store.imports.command(f.token,{type:'RequestImport',commandId:'blocked',path:'/never-run'});assert.equal(f.store.imports.claim(f.store.imports.beginOwner()),null);
  const production=headTestFixture({testOptions:{configuration}},{headSha:input.headSha});try{assert.equal(production.store.tests.targets(production.token,{reviewId:'review',snapshotId:'head-snapshot'}).targets[0]!.availability,'available');const receipt=production.store.tests.command(production.token,production.request);assert.equal(production.store.tests.query(production.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!.provenance,'qualified_local_configuration');assert.ok(production.store.tests.claim(production.store.tests.beginOwner()));}finally{production.cleanup();}
  const foreign=headTestFixture({testOptions:{configuration}});try{assert.throws(()=>foreign.store.tests.command(foreign.token,foreign.request),/qualification_required/);}finally{foreign.cleanup();}
  assert.throws(()=>headTestFixture({testOptions:{configuration:{} as HeadTestConfiguration}}),/invalid_test_configuration/);
 }finally{f.cleanup();await input.cleanup();}
});
test('B02 preparation failure retains registered root and unknown barrier without a fabricated complete witness',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{await writeFile(join(input.donor,'bun.lock'),'incompatible');f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  await assert.rejects(prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input}),/environment_unavailable/);
  f.store.tests.markUnknown(grant,'preparation_failed');const journal=f.store.tests.unknown(owner)[0]!;assert.equal(journal.invocation.filesystemRoots!.length,1);assert.equal(observeHeadTestQuiescence(journal),null);
 }finally{f.cleanup();await input.cleanup();}
});
