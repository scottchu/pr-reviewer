import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import {headTestFixture} from './head-test-fixture.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';
import {createGateway} from '../src/server/public.ts';
import type {HeadTestReceipt,HeadTestView,HeadTestArtifactView} from '../src/domain/public.ts';
test('B01-B04 gateway request executes the same durable job while a real preparation permits discussion and later artifact query',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);
 let notifications=0;const gateway=createGateway(f.store,async()=>{notifications++;return {state:'unknown',reason:'fixture'};},{testExecution:{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input}});
 try{
  const port=await gateway.listen(0),origin=`http://127.0.0.1:${port}`;
  const post=async(path:string,body:unknown)=>{const response=await fetch(origin+path,{method:'POST',headers:{Authorization:`Bearer ${f.token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
  const receipt=await post('/api/commands',f.request) as HeadTestReceipt,scope={reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId};
  const active=await post('/api/tests/jobs',scope) as HeadTestView;assert.ok(['preparing','running'].includes(active.selectedJob!.state));
  const question=await post('/api/commands',{type:'AskQuestion',commandId:'during-actual-preparation',reviewId:'review',anchor:{snapshotId:'head-snapshot',side:'head',path:'value.ts',startLine:1,endLine:1},text:'Which source and dependency identities will this job retain?'});assert.equal(question.state,'applied');
  let view=active;const deadline=Date.now()+10000;while(!view.selectedJob!.result&&Date.now()<deadline){await pause(20);view=await post('/api/tests/jobs',scope) as HeadTestView;}
  assert.equal(view.selectedJob!.state,'passed');assert.equal(view.selectedJob!.result!.intent.headSha,input.headSha);assert.equal(view.selectedJob!.jobId,receipt.jobId);
  const output=view.selectedJob!.result!.artifacts.find(item=>item.label==='test_root.stderr')!;
  const artifact=await post('/api/tests/artifact',{...scope,artifactId:output.artifactId}) as HeadTestArtifactView;assert.match(Buffer.from(artifact.data,'base64').toString('utf8'),/4 pass/);
  assert.equal(f.store.review(f.store.authenticate(f.token),'review').questions.length,1);assert.equal(notifications,0);assert.ok(gateway.testDiagnostics().some(route=>route.id==='verified-head-test-result-to-admission'));
 }finally{await gateway.close();f.cleanup();await input.cleanup();}
});
test('B03 owner stop during real preparation joins or retains uncertainty without replaying the test root',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});const artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);
 const {createTestRunner}=await import('../src/test-jobs/public.ts');let runner:ReturnType<typeof createTestRunner>|undefined;
 try{
  const receipt=f.store.tests.command(f.token,f.request);runner=createTestRunner(f.store,{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input});await runner.stop();
  const job=f.store.tests.query(f.token,{reviewId:'review',snapshotId:'head-snapshot',jobId:receipt.jobId}).selectedJob!;
  assert.ok(['error','unknown'].includes(job.state));assert.notEqual(job.state,'passed');assert.equal(job.result?.execution??null,null);assert.deepEqual(runner.diagnostics(),[]);
  const processes=job.result?.processes??[];assert.equal(processes.filter(item=>item.role==='test_root').length,0);
 }finally{await runner?.stop();f.cleanup();await input.cleanup();}
});
