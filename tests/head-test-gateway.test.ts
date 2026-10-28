import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGateway} from '../src/server/public.ts';
import {headTestFixture} from './head-test-fixture.ts';
import type {HeadTestReceipt,HeadTestTargets,HeadTestView} from '../src/domain/public.ts';
const scope={reviewId:'review',snapshotId:'head-snapshot'};
for(const available of [false,true])test(`T01/T02 internal gateway ${available?'test-only available':'production unavailable'} never owns a test runner`,async()=>{
 const f=headTestFixture(available?{testOptions:{testOnlyAvailable:true}}:{});let notifications=0;
 const gateway=createGateway(f.store,async()=>{notifications++;return {state:'unknown',reason:'fixture'};});
 try{
  const port=await gateway.listen(0),origin=`http://127.0.0.1:${port}`;
  const request=(path:string,body:unknown,token=f.token)=>fetch(origin+path,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const catalogResponse=await request('/api/tests/targets',scope);assert.equal(catalogResponse.status,200);const catalog=await catalogResponse.json() as HeadTestTargets;assert.equal(catalog.targets[0]!.availability,available?'available':'unavailable');
  const response=await request('/api/commands',f.request);
  if(available){
   assert.equal(response.status,200);const receipt=await response.json() as HeadTestReceipt;assert.deepEqual(await (await request('/api/commands',f.request)).json(),receipt);
   const query={...scope,jobId:receipt.jobId,minimumJobRevision:receipt.jobRevision};const view=await(await request('/api/tests/jobs',query)).json() as HeadTestView;assert.equal(view.selectedJob!.state,'queued');assert.equal(view.selectedJob!.headSha,f.snapshot.headSha);assert.deepEqual(view.selectedJob!.invocations,[]);
   assert.equal((await request('/api/commands',{type:'AskQuestion',commandId:'while-queued',reviewId:'review',anchor:{snapshotId:'head-snapshot',side:'head',path:'value.ts',startLine:1,endLine:1},text:'Discussion remains independent'})).status,200);
   const cancel=await request('/api/commands',{type:'CancelTest',commandId:'cancel',jobId:receipt.jobId,expectedJobRevision:receipt.jobRevision});assert.equal(cancel.status,200);
   const retained=await(await request('/api/tests/jobs',query)).json() as HeadTestView;assert.equal(retained.selectedJob!.state,'cancelled');assert.deepEqual(retained.selectedJob!.invocations,[]);
   assert.equal((await request('/api/tests/jobs',{...query,minimumJobRevision:999})).status,400);
  }else{assert.equal(response.status,400);assert.deepEqual(await response.json(),{error:'execution_not_configured'});assert.equal(f.store.tests.query(f.token,scope).jobs.length,0);}
  assert.equal((await request('/api/commands',{...f.request,argv:['arbitrary']})).status,400);
  assert.equal((await request('/api/tests/jobs',{...scope,path:'/private'})).status,400);
  assert.equal((await request('/api/tests/targets',scope,'invalid')).status,401);assert.equal(notifications,0);
  assert.equal(gateway.diagnostics().some(route=>route.id.includes('test')),false);
 }finally{await gateway.close();f.cleanup();}
});
