import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readdir,symlink,unlink,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {headTestFixture} from './head-test-fixture.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';
import {createTestRunner,prepareHeadTestInputs,executePreparedHeadTest,observeHeadTestOutcome,cleanupHeadTestRoots} from '../src/test-jobs/public.ts';
import {inspectHeadOverlays} from '../src/test-jobs/overlays.ts';

// Adapted from the independent 1e35644 counterexamples; actual fixed Bun target, no held lease or slow test.
test('B1 corrections: terminal cleanup, lossless Unicode pages and complete actual evidence',async()=>{
 const input=await headPreparationFixture({testName:'x'.repeat(65530)+'中文🙂 fixture'}),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});let runner:ReturnType<typeof createTestRunner>|undefined;
 try{
  const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);const receipt=f.store.tests.command(f.token,f.request);runner=createTestRunner(f.store,{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input});await runner.idle();await runner.stop();
  const job=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!,result=job.result!;
  assert.equal(job.state,'passed');assert.equal(job.cleanup?.state,'complete');assert.deepEqual(await readdir(input.executionRoot),[]);
  assert.equal(result.verification.pre?.inputs,'verified');assert.equal(result.verification.post?.inputs,'verified');assert.equal(result.verification.post?.overlays,'verified');
  const process=result.processes.find(item=>item.role==='test_root')!;assert.ok(process.execution);assert.equal(process.execution.cwd,'<owned-root>/source');assert.equal(process.execution.argv[3],'--config=<owned-root>/empty-bunfig.toml');assert.ok(Date.parse(process.execution.attemptedAt)<=Date.parse(process.execution.startedAt!));assert.ok(Date.parse(process.execution.startedAt!)<=Date.parse(process.execution.exitedAt!));assert.equal(JSON.stringify(result).includes(input.root),false);
  const artifact=result.artifacts.find(item=>item.label==='test_root.stderr')!,q={reviewId:'review',snapshotId:'head-snapshot',jobId:job.jobId,artifactId:artifact.artifactId};
  const pages:Buffer[]=[];let offset=0;while(true){const page=await f.store.tests.artifact(f.token,{...q,offset,length:65536});assert.equal(page.encoding,'base64');assert.ok(page.bytes<=65536);pages.push(Buffer.from(page.data,'base64'));assert.equal(page.nextOffset,offset+page.bytes);if(page.complete)break;offset=page.nextOffset;}
  const bytes=Buffer.concat(pages);assert.equal(createHash('sha256').update(bytes).digest('hex'),artifact.sha256);
  for(const scalar of ['中','🙂']){const position=bytes.indexOf(Buffer.from(scalar));assert.ok(position>=0);const first=await f.store.tests.artifact(f.token,{...q,offset:position,length:1}),second=await f.store.tests.artifact(f.token,{...q,offset:first.nextOffset,length:Buffer.byteLength(scalar)-1});assert.equal(Buffer.concat([Buffer.from(first.data,'base64'),Buffer.from(second.data,'base64')]).toString('utf8'),scalar);}
 }finally{await runner?.stop();f.cleanup();await input.cleanup();}
});
test('B1 correction: measured unexpected HOME overlay prevents pass and survives cleanup as evidence',async()=>{
 const input=await headPreparationFixture({closureScript:"import {writeFileSync} from 'node:fs'; writeFileSync(process.env.HOME+'/unexpected-overlay.txt','bounded fixture overlay');"}),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});let runner:ReturnType<typeof createTestRunner>|undefined;
 try{const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);const receipt=f.store.tests.command(f.token,f.request);runner=createTestRunner(f.store,{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input});await runner.idle();
  const job=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!;assert.equal(job.state,'error');assert.equal(job.reason,'unexpected_owned_overlay');assert.equal(job.result!.verification.post?.overlays,'error');assert.equal(job.cleanup?.state,'complete');
  const artifact=job.result!.artifacts.find(item=>item.kind==='source_evidence')!,page=await f.store.tests.artifact(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:job.jobId,artifactId:artifact.artifactId});assert.match(Buffer.from(page.data,'base64').toString('utf8'),/home\/unexpected-overlay.txt/);
 }finally{await runner?.stop();f.cleanup();await input.cleanup();}
});
test('B1 correction: failed cleanup persists, blocks new test claims, and retries with a replacement owner without replay',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);const receipt=f.store.tests.command(f.token,f.request),owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  const prepared=await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.prepared(grant,prepared);await executePreparedHeadTest({store:f.store,grant,witness:prepared});const witness=await observeHeadTestOutcome({store:f.store,grant,artifactRoot});assert.ok(witness);f.store.tests.complete(grant,witness);
  const root=(await readdir(input.executionRoot))[0]!,link=join(input.executionRoot,root,'home','link');await symlink(input.donor,link);await cleanupHeadTestRoots(f.store,owner);
  const query={reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId},failed=f.store.tests.query(f.token,query).selectedJob!;assert.equal(failed.cleanup?.state,'error');assert.equal(failed.cleanup?.attempts,1);const resultId=failed.result!.resultId;
  f.store.tests.command(f.token,{...f.request,commandId:'second'});assert.equal(f.store.tests.claim(owner),null);await unlink(link);f.restart();await new Promise(resolve=>setTimeout(resolve,1050));const replacement=f.store.tests.beginOwner();await cleanupHeadTestRoots(f.store,replacement);
  const complete=f.store.tests.query(f.token,query).selectedJob!;assert.equal(complete.cleanup?.state,'complete');assert.equal(complete.cleanup?.attempts,2);assert.equal(complete.result!.resultId,resultId);assert.equal(complete.invocations.length,1);assert.deepEqual(await readdir(input.executionRoot),[]);assert.ok(f.store.tests.claim(replacement));
 }finally{f.cleanup();await input.cleanup();}
});
test('B1 correction: unknown roots remain untouched and cannot enter admitted cleanup',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.markUnknown(grant,'test_effect_unresolved');await cleanupHeadTestRoots(f.store,owner);assert.equal((await readdir(input.executionRoot)).length,1);assert.deepEqual(f.store.tests.cleanupPending(owner),[]);assert.equal(f.store.tests.claim(owner),null);
 }finally{f.cleanup();await input.cleanup();}
});
test('B1 correction: overlay account bounds and expected cache policy are explicit',async()=>{
 const input=await headPreparationFixture(),root=join(input.root,'overlay');await mkdir(root);
 try{for(const dir of ['cache','config','empty','home','source','tmp'])await mkdir(join(root,dir));await writeFile(join(root,'empty-bunfig.toml'),'');await mkdir(join(root,'cache/bun/@t@'),{recursive:true});await writeFile(join(root,'cache/bun/@t@/0123456789abcdef.pile'),'measured cache fixture');
  assert.equal((await inspectHeadOverlays(root,'post',()=>{})).reason,null);assert.equal((await inspectHeadOverlays(root,'pre',()=>{})).reason,'unexpected_owned_overlay');await writeFile(join(root,'tmp','unexpected'),'x');assert.equal((await inspectHeadOverlays(root,'post',()=>{})).reason,'unexpected_owned_overlay');assert.equal((await inspectHeadOverlays(root,'post',()=>{throw new Error('test_deadline');})).complete,false);
 }finally{await input.cleanup();}
});

test('B1 correction: source mutation retains measured mismatch while actual zero exit cannot pass',async()=>{
 const input=await headPreparationFixture({closureScript:"import {writeFileSync} from 'node:fs'; writeFileSync(process.cwd()+'/unexpected-source.txt','fixture mutation');"}),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});let runner:ReturnType<typeof createTestRunner>|undefined;
 try{const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);const receipt=f.store.tests.command(f.token,f.request);runner=createTestRunner(f.store,{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input});await runner.idle();
  const result=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!.result!;assert.equal(result.state,'error');assert.equal(result.execution!.exitCode,0);assert.equal(result.verification.post!.inputs,'error');assert.equal(result.verification.post!.changedEntries,1);assert.notEqual(result.verification.post!.sourceDigest,result.verification.post!.expectedSourceDigest);
 }finally{await runner?.stop();f.cleanup();await input.cleanup();}
});
test('B1 correction: attempted root creation without captured identity remains unknown rather than inventing cleanup authority',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{const unavailableRoot=join(input.root,'not-a-directory');await writeFile(unavailableRoot,'fixture');f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  await assert.rejects(prepareHeadTestInputs({store:f.store,grant,executionRoot:unavailableRoot,fixtureInputs:input}));assert.equal(await observeHeadTestOutcome({store:f.store,grant,artifactRoot:join(input.root,'unused')}),null);assert.equal(f.store.tests.journal(grant).invocation.processes!.length,0);
 }finally{f.cleanup();await input.cleanup();}
});
