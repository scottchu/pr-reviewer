import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {DatabaseSync} from 'node:sqlite';
import {createStore} from '../src/storage/public.ts';
import {createGateway} from '../src/server/public.ts';
import {observeHeadTestQuiescence} from '../src/test-jobs/public.ts';
import type {Snapshot,HeadTestCommand,HeadTestReceipt,HeadTestView,HeadTestArtifactView} from '../src/domain/public.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';

const scope={reviewId:'review',snapshotId:'head-snapshot'};
const request:HeadTestCommand={type:'RequestTest',commandId:'single-owner-request',...scope,targetId:'review-source-core-v1',expectedTargetRevision:2};
const localFixture=(execution=false,headSha='b'.repeat(40))=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-head-local-')),filename=join(root,'review.sqlite');
 const options={testOptions:execution?{testOnlyExecution:true as const}:{testOnlyAvailable:true as const}};
 let store=createStore(filename,options);const content='export const value = 1;\n';
 const snapshot:Snapshot={snapshotId:scope.snapshotId,repository:'scottchu/pr-reviewer',prUrl:'https://github.com/scottchu/pr-reviewer/pull/24',prNumber:24,baseSha:'a'.repeat(40),headSha,sources:[{side:'head',path:'value.ts',content,hash:createHash('sha256').update(content).digest('hex'),lineCount:1}]};
 store.prepare(scope.reviewId,snapshot);
 return {filename,get store(){return store;},restart:()=>{store.close();store=createStore(filename,options);},cleanup:()=>{store.close();rmSync(root,{recursive:true,force:true});}};
};
const cli=async(gateway:string,command:string,args:readonly string[])=>new Promise<Record<string,unknown>>((resolve,reject)=>{
 const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/head-tests.ts',import.meta.url)),command,'--gateway',gateway,...args],{env:{PATH:'/usr/bin:/bin'},stdio:['ignore','pipe','pipe']});let out='',err='';
 child.stdout.on('data',(bytes:Buffer)=>{out+=bytes.toString();});child.stderr.on('data',(bytes:Buffer)=>{err+=bytes.toString();});child.once('error',reject);child.once('close',code=>{try{assert.equal(code,0,out+err);resolve(JSON.parse(out) as Record<string,unknown>);}catch(error){reject(error);}});
});
const cliScope=['--review',scope.reviewId,'--snapshot',scope.snapshotId];

test('I1/I2 local-owner intent reopens and claims without any credential row; serialized identities never authenticate',()=>{
 const f=localFixture(true);try{
  const receipt=f.store.tests.command(f.store.localOwner,request);
  assert.equal(receipt.actorId,'local-user');assert.deepEqual(f.store.tests.command(f.store.localOwner,request),receipt);
  for(const bad of [structuredClone(f.store.localOwner),'local-owner:v1','invalid'])assert.throws(()=>f.store.tests.targets(bad,scope),/unauthorized/);
  const db=new DatabaseSync(f.filename,{readOnly:true});try{assert.equal((db.prepare('SELECT count(*) AS n FROM credentials').get() as {n:number}).n,0);}finally{db.close();}
  f.restart();assert.deepEqual(f.store.tests.command(f.store.localOwner,request),receipt);
  const owner=f.store.tests.beginOwner(),claimed=f.store.tests.claim(owner)!;assert.ok(claimed);assert.equal(claimed.job.jobId,receipt.jobId);assert.equal(f.store.tests.control(claimed.grant).authorized,true);
  f.store.tests.recordProcess(claimed.grant,{ordinal:1,role:'git_prepare',state:'requested',intentDigest:'a'.repeat(64),inputCount:0,inputBytes:0});
  f.restart();const replacement=f.store.tests.beginOwner();assert.equal(f.store.tests.claim(replacement),null);
  const unknown=f.store.tests.query(f.store.localOwner,{...scope,jobId:receipt.jobId}).selectedJob!;assert.equal(unknown.state,'unknown');assert.equal(unknown.effectDisposition,'unresolved');assert.equal(observeHeadTestQuiescence(f.store.tests.unknown(replacement)[0]!),null);
 }finally{f.cleanup();}
});

test('I1 explicit Bearer never falls back; attached participants can read but cannot request or cancel',async()=>{
 const f=localFixture(),gateway=createGateway(f.store,async()=>({state:'unknown',reason:'fixture'}));
 try{
  const port=await gateway.listen(0),origin=`http://127.0.0.1:${port}`;
  const post=(path:string,body:unknown,authorization?:string)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(authorization===undefined?{}:{Authorization:authorization})},body:JSON.stringify(body)});
  assert.equal((await post('/api/tests/targets',scope)).status,200);
  const receipt=await (await post('/api/commands',request)).json() as HeadTestReceipt;
  for(const header of ['Bearer invalid','Bearer local-owner:v1','Basic invalid'])assert.equal((await post('/api/tests/targets',scope,header)).status,401);
  const principal=f.store.authenticate(f.store.localOwner),connection=f.store.registerConnection(principal,{host:'codex',sessionId:'b4-session',connectionId:'b4-connection',corroborated:true});
  assert.equal((await post('/api/tests/jobs',scope,`Bearer ${connection.token}`)).status,401);
  const challenge=f.store.challenge(principal,scope.reviewId,'codex','b4-session','b4-connection'),attached=f.store.attach(connection.principal,challenge.challengeId,challenge.proof);
  assert.equal((await post('/api/tests/jobs',{...scope,jobId:receipt.jobId},`Bearer ${attached.token}`)).status,200);
  for(const command of [request,{type:'CancelTest',commandId:'participant-cancel',jobId:receipt.jobId,expectedJobRevision:receipt.jobRevision}])assert.equal((await post('/api/commands',command,`Bearer ${attached.token}`)).status,401);
  f.store.command(principal,{type:'RevokeAttachment',commandId:'revoke-b4',reviewId:scope.reviewId,attachmentId:attached.attachment.attachmentId});
  const revoked=await post('/api/tests/jobs',scope,`Bearer ${attached.token}`);assert.equal(revoked.status,400);assert.deepEqual(await revoked.json(),{error:'stale_attachment'});
  const cancelled=await cli(origin,'cancel',['--job',receipt.jobId,'--command-id','owner-cancel','--job-revision',String(receipt.jobRevision)]);assert.equal((cancelled.result as {disposition:string}).disposition,'cancelled');
  const status=await cli(origin,'status',[...cliScope,'--job',receipt.jobId]);assert.equal((status.selectedJob as {state:string}).state,'cancelled');
 }finally{await gateway.close();f.cleanup();}
});

test('I2 a removed legacy credential does not become a local-owner execution grant',()=>{
 const f=localFixture(true);try{
  const token=f.store.issueUser(),receipt=f.store.tests.command(token,request);
  // Controlled legacy-revocation fixture, matching the existing intent regression.
  const db=new DatabaseSync(f.filename);try{db.prepare('DELETE FROM credentials WHERE hash=?').run(createHash('sha256').update(token).digest('hex'));}finally{db.close();}
  f.restart();const owner=f.store.tests.beginOwner();assert.equal(f.store.tests.claim(owner),null);
  const job=f.store.tests.query(f.store.localOwner,{...scope,jobId:receipt.jobId}).selectedJob!;assert.equal(job.state,'error');assert.equal(job.reason,'unauthorized');assert.deepEqual(job.invocations,[]);
  assert.throws(()=>f.store.tests.command(token,request),/unauthorized/);
 }finally{f.cleanup();}
});

test('I3 actual credential-free CLI and gateway retain one real fixture job, result and lossless artifact',async(t)=>{
 const input=await headPreparationFixture({testName:'configured 中🙂 fixture'}),f=localFixture(true,input.headSha),artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);
 let notifications=0;const gateway=createGateway(f.store,async()=>{notifications++;return {state:'unknown',reason:'fixture'};},{testExecution:{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input}});
 try{
  const port=await gateway.listen(0),origin=`http://127.0.0.1:${port}`;
  const catalog=await cli(origin,'targets',cliScope);assert.equal(catalog.headSha,input.headSha);
  const receipt=await cli(origin,'request',[...cliScope,'--command-id','cli-real-request','--target','review-source-core-v1','--target-revision','2']) as unknown as HeadTestReceipt;
  const query={...scope,jobId:receipt.jobId};let job=f.store.tests.query(f.store.localOwner,query).selectedJob!;
  // Observe real work; do not slow the target or hold a lease to manufacture overlap.
  assert.ok(['preparing','running'].includes(job.state));
  const response=await fetch(origin+'/api/commands',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'AskQuestion',commandId:'during-b4-prepare',reviewId:scope.reviewId,anchor:{snapshotId:scope.snapshotId,side:'head',path:'value.ts',startLine:1,endLine:1},text:'Which exact source and result identities does this job retain?'})});assert.equal(response.status,200);
  const deadline=Date.now()+10000;while(!job.result&&Date.now()<deadline){await pause(20);job=f.store.tests.query(f.store.localOwner,query).selectedJob!;}
  assert.equal(job.state,'passed');assert.equal(job.provenance,'test_only_execution');
  const status=await cli(origin,'status',[...cliScope,'--job',receipt.jobId,'--minimum-revision',String(job.jobRevision)]) as unknown as HeadTestView;assert.equal(status.selectedJob!.jobId,receipt.jobId);
  const result=await cli(origin,'result',[...cliScope,'--job',receipt.jobId]);assert.deepEqual(result.result,job.result);
  const output=job.result!.artifacts.find(item=>item.label==='test_root.stderr')!;
  const args=[...cliScope,'--job',receipt.jobId,'--artifact',output.artifactId];
  const page=await cli(origin,'artifact',args) as unknown as HeadTestArtifactView;
  const direct=await f.store.tests.artifact(f.store.localOwner,{...query,artifactId:output.artifactId});assert.deepEqual(page,direct);
  const text=await cli(origin,'artifact',[...args,'--text','true']);assert.equal(text.text,Buffer.from(page.data,'base64').toString('utf8'));assert.match(String(text.text),/中🙂/);
  assert.equal(f.store.review(f.store.authenticate(f.store.localOwner),scope.reviewId).questions.length,1);assert.equal(notifications,0);
  t.diagnostic(JSON.stringify({gatewayPort:port,jobId:receipt.jobId,resultId:job.result!.resultId,headSha:input.headSha,provenance:job.provenance,artifactId:output.artifactId,artifactSha256:output.sha256,observedCounts:job.result!.execution?.counts}));
 }finally{await gateway.close();f.cleanup();await input.cleanup();}
});
