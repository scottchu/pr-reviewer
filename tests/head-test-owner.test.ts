import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {headTestFixture} from './head-test-fixture.ts';
import {observeHeadTestQuiescence,observeHeadTestProcessQuiescence} from '../src/test-jobs/public.ts';
import type {HeadTestOwner,HeadTestGrant} from '../src/storage/public.ts';
const scope={reviewId:'review',snapshotId:'head-snapshot'};
const fixture=()=>headTestFixture({testOptions:{testOnlyExecution:true}});
const request={ordinal:1,role:'git_prepare' as const,state:'requested' as const,intentDigest:'a'.repeat(64),inputCount:0,inputBytes:0};

test('B01 fixture provenance is permanent; owner handles fence older generations and copies',()=>{
 const f=fixture();try{
  const receipt=f.store.tests.command(f.token,f.request),owner=f.store.tests.beginOwner();
  const claim=f.store.tests.claim(owner)!;assert.equal(claim.job.jobId,receipt.jobId);
  assert.equal(claim.job.provenance,'test_only_execution');assert.equal(claim.job.state,'preparing');
  assert.throws(()=>f.store.tests.claim({} as HeadTestOwner),/stale_test_owner/);
  assert.throws(()=>f.store.tests.control({} as HeadTestGrant),/stale_test_owner/);
  const next=f.store.tests.beginOwner();assert.throws(()=>f.store.tests.control(claim.grant),/stale_test_owner/);
  assert.equal(f.store.tests.claim(next),null);assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.state,'unknown');
  assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.invocations[0]!.quiescence,'unresolved');
 }finally{f.cleanup();}
 const intent=headTestFixture();try{intent.store.tests.command(intent.token,intent.request);assert.equal(intent.store.tests.claim(intent.store.tests.beginOwner()),null);}finally{intent.cleanup();}
});

test('B03 ordered journals reject contradictory no-spawn proof and copied quiescence witnesses',()=>{
 const f=fixture();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant,job}=f.store.tests.claim(owner)!;
  f.store.tests.recordProcess(grant,request);
  assert.throws(()=>f.store.tests.recordProcess(grant,{...request,ordinal:2}),/test_process_unresolved/);
  assert.throws(()=>f.store.tests.recordProcess(grant,{...request,state:'exited',spawnDisposition:'not_spawned',pid:123}),/invalid_test_observation/);
  f.store.tests.markUnknown(grant,'journal_write_failed');
  const journal=f.store.tests.unknown(owner)[0]!;assert.equal(observeHeadTestQuiescence(journal),null);
  assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.jobId,job.jobId);
 }finally{f.cleanup();}
 const empty=fixture();try{
  empty.store.tests.command(empty.token,empty.request);const owner=empty.store.tests.beginOwner(),claim=empty.store.tests.claim(owner)!;
  empty.store.tests.markUnknown(claim.grant,'owner_stopped');const journal=empty.store.tests.unknown(owner)[0]!,witness=observeHeadTestQuiescence(journal)!;
  assert.ok(witness);assert.throws(()=>empty.store.tests.reconcileQuiescence(owner,{} as typeof witness),/invalid_test_witness/);
  empty.store.tests.reconcileQuiescence(owner,witness);
  const job=empty.store.tests.query(empty.token,scope).jobs[0]!;assert.equal(job.state,'unknown');assert.equal(job.effectDisposition,'quiescent');
 }finally{empty.cleanup();}
});

test('B04 real observed group retains shared exclusion after lost start until fresh absence',async()=>{
 const f=fixture();let child:ReturnType<typeof spawn>|undefined;
 try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  f.store.tests.recordProcess(grant,request);
  child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'});await once(child,'spawn');
  f.store.tests.recordProcess(grant,{...request,state:'exited',pid:child.pid!,exitCode:0});
  assert.equal(observeHeadTestProcessQuiescence(f.store.tests.journal(grant)),null);
  assert.throws(()=>f.store.tests.recordProcess(grant,{...request,ordinal:2}),/test_process_unresolved/);
  f.store.tests.markUnknown(grant,'lost_start_observation');
  assert.equal(observeHeadTestQuiescence(f.store.tests.unknown(owner)[0]!),null);
  f.store.imports.command(f.token,{type:'RequestImport',commandId:'blocked-import',path:'/never-run'});
  const importer=f.store.imports.beginOwner();assert.equal(f.store.imports.claim(importer),null);
  const reply=f.store.command(f.store.authenticate(f.token),{type:'AskQuestion',commandId:'active-question',reviewId:'review',anchor:{snapshotId:'head-snapshot',side:'head',path:'value.ts',startLine:1,endLine:1},text:'Can discussion continue?'});assert.equal(reply.state,'applied');
  const closed=once(child,'close');process.kill(-child.pid!,'SIGKILL');await closed;child=undefined;
  const witness=observeHeadTestQuiescence(f.store.tests.unknown(owner)[0]!)!;assert.ok(witness);f.store.tests.reconcileQuiescence(owner,witness);
  assert.ok(f.store.imports.claim(importer));assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.state,'unknown');
 }finally{if(child?.pid){const closed=once(child,'close');try{process.kill(-child.pid,'SIGKILL');}catch{}await closed;}f.cleanup();}
});

test('B03 cancel intent prevents launch, definitive pre-spawn failure can reconcile, restart never replays',()=>{
 const f=fixture();try{
  f.store.tests.command(f.token,f.request);let owner=f.store.tests.beginOwner();const {grant,job}=f.store.tests.claim(owner)!;
  f.store.tests.recordProcess(grant,request);f.store.tests.recordProcess(grant,{...request,state:'exited',spawnDisposition:'not_spawned',exitCode:null});
  const current=f.store.tests.query(f.token,scope).jobs[0]!;f.store.tests.command(f.token,{type:'CancelTest',commandId:'cancel-active',jobId:job.jobId,expectedJobRevision:current.jobRevision});
  assert.equal(f.store.tests.control(grant).cancelled,true);
  assert.throws(()=>f.store.tests.recordProcess(grant,{...request,ordinal:2}),/test_cancelled/);
  f.restart();owner=f.store.tests.beginOwner();assert.equal(f.store.tests.claim(owner),null);
  const witness=observeHeadTestQuiescence(f.store.tests.unknown(owner)[0]!)!;assert.ok(witness);f.store.tests.reconcileQuiescence(owner,witness);
  assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.state,'unknown');
 }finally{f.cleanup();}
});

test('B03 stale fresh-absence evidence cannot clear a changed journal revision',()=>{
 const f=fixture();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),claim=f.store.tests.claim(owner)!;
  const before=observeHeadTestQuiescence(f.store.tests.journal(claim.grant))!;assert.ok(before);
  f.store.tests.markUnknown(claim.grant,'interrupted');
  assert.throws(()=>f.store.tests.reconcileQuiescence(owner,before),/invalid_test_witness/);
  assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.effectDisposition,'unresolved');
 }finally{f.cleanup();}
});

test('B03 subsequent preparation requires fresh absence; terminal updates retain observed identity',()=>{
 const f=fixture();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  f.store.tests.recordProcess(grant,request);
  f.store.tests.recordProcess(grant,{...request,state:'exited',spawnDisposition:'not_spawned',exitCode:null});
  assert.throws(()=>f.store.tests.recordProcess(grant,{...request,ordinal:2}),/test_process_unresolved/);
  const proof=observeHeadTestProcessQuiescence(f.store.tests.journal(grant))!;assert.ok(proof);
  f.store.tests.recordProcess(grant,{...request,ordinal:2},proof);
  f.store.tests.recordProcess(grant,{...request,ordinal:2,state:'started',pid:process.pid,startIdentity:'fixture-observed-identity'});
  assert.throws(()=>f.store.tests.recordProcess(grant,{...request,ordinal:2,state:'exited',pid:process.pid+1}),/invalid_test_observation/);
  f.store.tests.recordProcess(grant,{...request,ordinal:2,state:'exited',exitCode:0});
  const processRecord=f.store.tests.journal(grant).invocation.processes![1]!;
  assert.equal(processRecord.pid,process.pid);assert.equal(processRecord.startIdentity,'fixture-observed-identity');
  const publicJob=f.store.tests.query(f.token,scope).jobs[0]!;assert.equal(publicJob.invocations[0]!.processCount,2);assert.equal(JSON.stringify(publicJob).includes('fixture-observed-identity'),false);
 }finally{f.cleanup();}
});

test('B03 first stop intent is immutable and prevents any new requested effect',()=>{
 const f=fixture();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  f.store.tests.recordStop(grant,'deadline');f.store.tests.recordStop(grant,'later_error');
  assert.equal(f.store.tests.control(grant).stopReason,'deadline');
  assert.throws(()=>f.store.tests.recordProcess(grant,request),/test_stopped/);
 }finally{f.cleanup();}
});

for(const stage of ['requested','started','exited'] as const)test(`B03 identical ${stage} observation retries acknowledge without revision or launch authority`,()=>{
 const f=fixture();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  const requested=f.store.tests.recordProcess(grant,request);assert.equal(requested.disposition,'recorded');
  const observation=stage==='requested'?request:stage==='started'?{...request,state:stage,pid:process.pid,startIdentity:'fixture-observed'}:{...request,state:stage,exitCode:0};
  if(stage!=='requested'){if(stage==='exited')f.store.tests.recordProcess(grant,{...request,state:'started',pid:process.pid,startIdentity:'fixture-observed'});f.store.tests.recordProcess(grant,observation);}
  const before=f.store.tests.journal(grant);assert.equal(f.store.tests.recordProcess(grant,observation).disposition,'duplicate');assert.deepEqual(f.store.tests.journal(grant),before);
  assert.throws(()=>f.store.tests.recordProcess(grant,{...observation,intentDigest:'b'.repeat(64)}),/invalid_test_observation|test_process_limit/);
  f.store.tests.beginOwner();assert.throws(()=>f.store.tests.recordProcess(grant,observation),/stale_test_owner/);
 }finally{f.cleanup();}
});
