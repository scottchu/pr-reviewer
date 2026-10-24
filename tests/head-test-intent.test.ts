import {headTestFixture as fixture} from './head-test-fixture.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createStore} from '../src/storage/public.ts';
import {headTestCanonical,headTestCommandSchema,headTestDefinition} from '../src/domain/public.ts';
import type {HeadTestCommand} from '../src/domain/public.ts';
const scope={reviewId:'review',snapshotId:'head-snapshot'};
test('T01 unavailable default has fixed immutable catalog and rejects before durable intent',()=>{
 const f=fixture({});try{
  const view=f.store.tests.targets(f.token,scope);assert.equal(view.headSha,f.snapshot.headSha);assert.equal(view.targets[0]!.availability,'unavailable');assert.equal(view.targets[0]!.reason,'execution_not_configured');
  assert.throws(()=>f.store.tests.command(f.token,f.request),/execution_not_configured/);assert.deepEqual(f.store.tests.query(f.token,scope).jobs,[]);
  const def=headTestDefinition();assert.equal(createHash('sha256').update(JSON.stringify(def,(_k,v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v)).digest('hex'),'c8b3c8001ff71830ccf50405d6a50fe671c9943a4f5a4934616ce82dc043a940');
 }finally{f.cleanup();}
});
test('T01 strict requests reject extra effects and internal receipt IDs',()=>{
 const f=fixture();try{
  for(const extra of [{argv:['x']},{cwd:'/tmp'},{env:{}},{side:'base'},{headSha:'c'.repeat(40)},{executable:'bash'}])assert.equal(headTestCommandSchema.safeParse({...f.request,...extra}).success,false);
  for(const prefix of ['test-result:','analysis-admit:','import-admit:','story-internal:','attach:'])assert.equal(headTestCommandSchema.safeParse({...f.request,commandId:prefix+'x'}).success,false);
  assert.throws(()=>f.store.tests.command(f.token,{...f.request,targetId:'unknown'} as HeadTestCommand),/test_target_unavailable/);
  assert.throws(()=>f.store.tests.command(f.token,{...f.request,expectedTargetRevision:1} as HeadTestCommand),/test_target_conflict/);
  assert.throws(()=>f.store.tests.command(f.token,{...f.request,snapshotId:'foreign'} as HeadTestCommand),/source_unavailable/);
 }finally{f.cleanup();}
});
test('T02 exact durable request, head/digest attribution and cancellation survive reopen without runner',()=>{
 const f=fixture();try{
  const receipt=f.store.tests.command(f.token,f.request);assert.equal(receipt.state,'applied');assert.deepEqual(f.store.tests.command(f.token,f.request),receipt);
  const job=f.store.tests.query(f.token,{...scope,jobId:receipt.jobId,minimumJobRevision:receipt.jobRevision}).selectedJob!;
  assert.equal(job.state,'queued');assert.equal(job.headSha,f.snapshot.headSha);assert.equal(job.provenance,'test_only_configuration');assert.equal(job.target.digest,'c8b3c8001ff71830ccf50405d6a50fe671c9943a4f5a4934616ce82dc043a940');assert.deepEqual(job.invocations,[]);assert.equal(job.effectDisposition,'none');
  assert.equal(JSON.stringify(job).includes(f.token),false);assert.equal('credentialReference' in job,false);
  assert.throws(()=>f.store.tests.command(f.token,{...f.request,targetId:'changed'} as HeadTestCommand),/command_conflict/);
  f.restart();assert.deepEqual(f.store.tests.command(f.token,f.request),receipt);
  assert.throws(()=>f.store.tests.command(f.token,{type:'CancelTest',commandId:'stale',jobId:receipt.jobId,expectedJobRevision:0}),/test_job_conflict/);
  const cancel={type:'CancelTest' as const,commandId:'cancel',jobId:receipt.jobId,expectedJobRevision:receipt.jobRevision};const stopped=f.store.tests.command(f.token,cancel);assert.equal(stopped.jobRevision,2);assert.deepEqual(f.store.tests.command(f.token,cancel),stopped);
  f.restart();const retained=f.store.tests.query(f.token,{...scope,jobId:receipt.jobId}).selectedJob!;assert.equal(retained.state,'cancelled');assert.equal(retained.invocations.length,0);assert.equal(retained.cancellation?.commandId,'cancel');
  assert.throws(()=>f.store.tests.query(f.token,{...scope,jobId:receipt.jobId,minimumJobRevision:3}),/revision_unavailable/);
  assert.throws(()=>f.store.tests.query(f.token,{...scope,minimumJobRevision:1}),/jobId|custom|Invalid/);
 }finally{f.cleanup();}
});
test('T02 queue reservation limits are atomic and cancellation releases unused budget',()=>{
 const f=fixture({testOptions:{testOnlyAvailable:true,maxPending:2,maxRetainedBytes:5*1024*1024}});try{
  const a=f.store.tests.command(f.token,f.request);f.store.tests.command(f.token,{...f.request,commandId:'two'} as HeadTestCommand);
  assert.throws(()=>f.store.tests.command(f.token,{...f.request,commandId:'three'} as HeadTestCommand),/test_queue_full/);assert.equal(f.store.tests.query(f.token,scope).jobs.length,2);
  f.store.tests.command(f.token,{type:'CancelTest',commandId:'cancel',jobId:a.jobId,expectedJobRevision:a.jobRevision});assert.equal(f.store.tests.command(f.token,{...f.request,commandId:'three'} as HeadTestCommand).state,'applied');
 }finally{f.cleanup();}
 const small=fixture({testOptions:{testOnlyAvailable:true,maxRetainedBytes:2*1024*1024-1}});try{assert.throws(()=>small.store.tests.command(small.token,small.request),/test_storage_limit/);assert.equal(small.store.tests.query(small.token,scope).jobs.length,0);}finally{small.cleanup();}
});
test('T02 cross-family receipt collisions work in both directions and reserve private result IDs',()=>{
 const f=fixture();try{
  const owner=f.store.authenticate(f.token),ask={type:'AskQuestion' as const,commandId:'question',reviewId:'review',anchor:{snapshotId:'head-snapshot',side:'head' as const,path:'value.ts',startLine:1,endLine:1},text:'Why?'};
  f.store.command(owner,ask);assert.throws(()=>f.store.tests.command(f.token,{...f.request,commandId:'question'} as HeadTestCommand),/command_conflict/);
  f.store.tests.command(f.token,f.request);assert.equal(f.store.command(owner,{...ask,commandId:'test-request'}).error,'command_conflict');
  assert.equal(f.store.imports.command(f.token,{type:'RequestImport',commandId:'test-request',path:'/not-executed'}).error,'command_conflict');
  const analysis={type:'RequestAnalysis' as const,commandId:'test-request',reviewId:'review',snapshotId:'head-snapshot',expectedAnalysisGeneration:0,worktree:'/not-executed',sourceProject:'scottchu/pr-reviewer'};assert.equal(f.store.analysis.command(f.token,analysis).error,'command_conflict');
  const context={type:'PutStoryContext' as const,commandId:'test-request',reviewId:'review',snapshotId:'head-snapshot',expectedContextRevision:0,action:{type:'select' as const,captureIds:[]}};assert.equal(f.store.story.command(f.token,context).error,'command_conflict');
  for(const [id,run] of [['import-first',()=>f.store.imports.command(f.token,{type:'RequestImport',commandId:'import-first',path:'/not-executed'})],['analysis-first',()=>f.store.analysis.command(f.token,{...analysis,commandId:'analysis-first'})],['story-first',()=>f.store.story.command(f.token,{...context,commandId:'story-first'})]] as const){run();assert.throws(()=>f.store.tests.command(f.token,{...f.request,commandId:id} as HeadTestCommand),/command_conflict/);}
  assert.equal(f.store.command(owner,{...ask,commandId:'test-result:forged'}).error,'command_conflict');
  assert.equal(f.store.imports.command(f.token,{type:'RequestImport',commandId:'test-result:forged',path:'/none'}).error,'command_conflict');
  assert.equal(f.store.analysis.command(f.token,{...analysis,commandId:'test-result:forged'}).error,'command_conflict');
  assert.equal(f.store.story.command(f.token,{...context,commandId:'test-result:forged'}).error,'command_conflict');
 }finally{f.cleanup();}
});
test('T06 unfinished test intent blocks shared import/analysis after reopen without a lease row',()=>{
 const f=fixture();try{
  const receipt=f.store.tests.command(f.token,f.request);const db=new DatabaseSync(f.filename);const job=JSON.parse((db.prepare('SELECT body FROM test_jobs WHERE id=?').get(receipt.jobId) as {body:string}).body);
  job.state='running';job.effectDisposition='unresolved';job.invocations=[{invocationId:'prior-test',phase:'execute',state:'running',quiescence:'unresolved'}];db.prepare('UPDATE test_jobs SET body=? WHERE id=?').run(JSON.stringify(job),receipt.jobId);db.prepare('DELETE FROM execution_lease').run();db.close();f.restart();
  const recovered=f.store.tests.query(f.token,{...scope,jobId:receipt.jobId}).selectedJob!;assert.equal(recovered.state,'unknown');assert.equal(recovered.invocations[0]!.invocationId,'prior-test');assert.equal(recovered.effectDisposition,'unresolved');
  f.store.imports.command(f.token,{type:'RequestImport',commandId:'import',path:'/never-run'});assert.equal(f.store.imports.claim(f.store.imports.beginOwner()),null);
  f.store.analysis.command(f.token,{type:'RequestAnalysis',commandId:'analysis',reviewId:'review',snapshotId:'head-snapshot',expectedAnalysisGeneration:0,worktree:'/never-run',sourceProject:'scottchu/pr-reviewer'});assert.equal(f.store.analysis.claim(f.store.analysis.beginOwner()),null);
  const cancel=f.store.tests.command(f.token,{type:'CancelTest',commandId:'cancel-unknown',jobId:receipt.jobId,expectedJobRevision:recovered.jobRevision});assert.equal(f.store.tests.query(f.token,{...scope,jobId:receipt.jobId}).selectedJob!.state,'unknown');assert.ok(cancel.jobRevision>recovered.jobRevision);
  const question=f.store.command(f.store.authenticate(f.token),{type:'AskQuestion',commandId:'during-unknown',reviewId:'review',anchor:{snapshotId:'head-snapshot',side:'head',path:'value.ts',startLine:1,endLine:1},text:'Still reviewable'});assert.equal(question.state,'applied');
 }finally{f.cleanup();}
});
test('T06 confirmed-quiescent unknown history does not occupy shared slot; old store epoch is fenced',()=>{
 const f=fixture();try{
  const receipt=f.store.tests.command(f.token,f.request);const db=new DatabaseSync(f.filename);const job=JSON.parse((db.prepare('SELECT body FROM test_jobs WHERE id=?').get(receipt.jobId) as {body:string}).body);job.state='unknown';job.effectDisposition='quiescent';job.invocations=[{invocationId:'prior',phase:'execute',state:'unknown',quiescence:'confirmed'}];db.prepare('UPDATE test_jobs SET body=? WHERE id=?').run(JSON.stringify(job),receipt.jobId);db.close();
  const second=createStore(f.filename,{testOptions:{testOnlyAvailable:true}});try{
   assert.throws(()=>f.store.tests.query(f.token,scope),/stale_execution_owner/);assert.throws(()=>f.store.tests.command(f.token,f.request),/stale_execution_owner/);
   second.imports.command(f.token,{type:'RequestImport',commandId:'import',path:'/never-run'});assert.ok(second.imports.claim(second.imports.beginOwner()));assert.equal(second.tests.query(f.token,scope).jobs[0]!.state,'unknown');
  }finally{second.close();}
 }finally{f.cleanup();}
});
test('T01/T08 reads honor attachment scope/revocation and commands retain user authority on retry',()=>{
 const f=fixture();try{
  const owner=f.store.authenticate(f.token),created=f.store.tests.command(f.token,f.request);
  const connection=f.store.registerConnection(owner,{host:'codex',sessionId:'controlled',connectionId:'controlled',corroborated:true});
  assert.throws(()=>f.store.tests.targets(connection.token,scope),/unauthorized/);
  const challenge=f.store.challenge(owner,'review','codex','controlled','controlled'),attached=f.store.attach(connection.principal,challenge.challengeId,challenge.proof);
  assert.equal(f.store.tests.query(attached.token,scope).jobs[0]!.jobId,created.jobId);
  assert.throws(()=>f.store.tests.command(attached.token,f.request),/unauthorized/);
  f.store.prepare('other',{...f.snapshot,snapshotId:'other-snapshot'});assert.throws(()=>f.store.tests.query(attached.token,{reviewId:'other',snapshotId:'other-snapshot'}),/stale_attachment/);
  f.store.command(owner,{type:'RevokeAttachment',commandId:'revoke',reviewId:'review',attachmentId:attached.attachment.attachmentId});assert.throws(()=>f.store.tests.query(attached.token,scope),/stale_attachment/);
  const db=new DatabaseSync(f.filename);db.prepare('DELETE FROM credentials WHERE hash=?').run(createHash('sha256').update(f.token).digest('hex'));db.close();assert.throws(()=>f.store.tests.command(f.token,f.request),/unauthorized/);
 }finally{f.cleanup();}
});
test('T09 pagination is bounded and scope-bound; unavailable configuration cannot be mutated after construction',()=>{
 const options:{testOptions:{testOnlyAvailable?:true}}={testOptions:{}};const unavailable=fixture(options);try{options.testOptions.testOnlyAvailable=true;assert.equal(unavailable.store.tests.targets(unavailable.token,scope).targets[0]!.availability,'unavailable');}finally{unavailable.cleanup();}
 const f=fixture();try{
  const ids:string[]=[];for(let i=0;i<34;i++){const r=f.store.tests.command(f.token,{...f.request,commandId:`page-${i}`} as HeadTestCommand);ids.push(r.jobId);f.store.tests.command(f.token,{type:'CancelTest',commandId:`cancel-${i}`,jobId:r.jobId,expectedJobRevision:r.jobRevision});}
  const first=f.store.tests.query(f.token,scope);assert.equal(first.jobs.length,32);assert.ok(first.nextCursor);const second=f.store.tests.query(f.token,{...scope,cursor:first.nextCursor});assert.equal(second.jobs.length,2);assert.equal(second.nextCursor,null);assert.deepEqual([...first.jobs,...second.jobs].map(j=>j.jobId),ids);
  f.store.prepare('other',{...f.snapshot,snapshotId:'other-snapshot'});assert.throws(()=>f.store.tests.query(f.token,{reviewId:'other',snapshotId:'other-snapshot',cursor:first.nextCursor!}),/invalid_test_cursor/);assert.throws(()=>f.store.tests.query(f.token,{...scope,cursor:'garbage'}),/invalid_test_cursor/);assert.throws(()=>f.store.tests.query(f.token,{...scope,jobId:ids[0]!,cursor:first.nextCursor!}),/cursor/);
  assert.throws(()=>f.store.tests.query(f.token,{reviewId:'other',snapshotId:'other-snapshot',jobId:ids[0]!}),/test_job_unavailable/);
 }finally{f.cleanup();}
});
test('T06 an inconsistent quiescent flag without confirmed invocation evidence remains blocking',()=>{
 const f=fixture();try{
  const receipt=f.store.tests.command(f.token,f.request),db=new DatabaseSync(f.filename);const job=JSON.parse((db.prepare('SELECT body FROM test_jobs WHERE id=?').get(receipt.jobId) as {body:string}).body);job.state='unknown';job.effectDisposition='quiescent';job.invocations=[{invocationId:'uncertain',phase:'execute',state:'unknown',quiescence:'unresolved'}];db.prepare('UPDATE test_jobs SET body=? WHERE id=?').run(JSON.stringify(job),receipt.jobId);db.close();f.restart();
  f.store.imports.command(f.token,{type:'RequestImport',commandId:'blocked',path:'/never-run'});assert.equal(f.store.imports.claim(f.store.imports.beginOwner()),null);assert.equal(f.store.tests.query(f.token,scope).jobs[0]!.effectDisposition,'unresolved');
 }finally{f.cleanup();}
});
test('T02 pre-existing legacy receipts keep exact retry semantics when new internal prefixes become reserved',()=>{
 const f=fixture();try{
  const owner=f.store.authenticate(f.token),db=new DatabaseSync(f.filename);
  const cases=[
   {table:'receipts',command:{type:'AskQuestion',commandId:'legacy-question',reviewId:'review',anchor:{snapshotId:'head-snapshot',side:'head',path:'value.ts',startLine:1,endLine:1},text:'Prior receipt'},run:(input:unknown)=>f.store.command(owner,input as Parameters<typeof f.store.command>[1])},
   {table:'import_receipts',command:{type:'RequestImport',commandId:'legacy-import',path:'/never-run'},run:(input:unknown)=>f.store.imports.command(f.token,input as Parameters<typeof f.store.imports.command>[1])},
   {table:'analysis_receipts',command:{type:'RequestAnalysis',commandId:'legacy-analysis',reviewId:'review',snapshotId:'head-snapshot',expectedAnalysisGeneration:0,worktree:'/never-run',sourceProject:'scottchu/pr-reviewer'},run:(input:unknown)=>f.store.analysis.command(f.token,input as Parameters<typeof f.store.analysis.command>[1])},
   {table:'story_receipts',command:{type:'PutStoryContext',commandId:'legacy-story',reviewId:'review',snapshotId:'head-snapshot',expectedContextRevision:0,action:{type:'select',captureIds:[]}},run:(input:unknown)=>f.store.story.command(f.token,input as Parameters<typeof f.store.story.command>[1])},
  ];
  for(const item of cases){const receipt=item.run(item.command),command={...item.command,commandId:`test-result:${item.command.commandId}`},retained={...receipt,commandId:command.commandId};db.prepare(`UPDATE ${item.table} SET id=?,fingerprint=?,body=? WHERE id=?`).run(command.commandId,createHash('sha256').update(headTestCanonical(item.table==='story_receipts'?{principal:owner,command}:command)).digest('hex'),JSON.stringify(retained),item.command.commandId);assert.deepEqual(item.run(command),retained);}
  db.close();
 }finally{f.cleanup();}
});
