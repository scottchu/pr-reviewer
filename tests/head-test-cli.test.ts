import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {headTestDefinition,HEAD_TEST_DEFINITION_DIGEST,headTestCanonical} from '../src/domain/public.ts';
import type {HeadTestJob,HeadTestResult} from '../src/domain/public.ts';
const script=fileURLToPath(new URL('../scripts/head-tests.ts',import.meta.url));
const id='11111111-1111-4111-8111-111111111111',hash='a'.repeat(64),time='2026-10-24T00:00:00.000Z';
const target={targetId:'review-source-core-v1',revision:2,digest:HEAD_TEST_DEFINITION_DIGEST,definition:headTestDefinition()};
const fixtureJob=():HeadTestJob=>{
 const preparation={sourceManifestId:hash,closureManifestId:hash,sourceAccountId:hash,treeId:'a'.repeat(40),runtimeSha256:hash,environmentId:hash};
 const body:Omit<HeadTestResult,'resultId'>={schema:'head-test-result-v1',jobId:'job',invocationId:'invocation',intent:{reviewId:'review',snapshotId:'snapshot',actorId:'local-user',repository:'scottchu/pr-reviewer',baseSha:'a'.repeat(40),headSha:'b'.repeat(40),targetDigest:target.digest,qualificationId:null},coverage:'prepared_execution',stage:'execution',evidence:{...preparation,absentReason:'not_completed'},processes:[],verification:{pre:null,post:null,absenceReason:'not_reached'},state:'failed',reason:'assertions_failed',preparation,preparationAbsence:null,execution:{exitCode:1,signal:null,collectionObserved:true,counts:{passed:0,failed:1,total:1}},executionAbsence:null,output:{observedBytes:0,retainedBytes:0,overflow:false},artifacts:[]};
 return {schema:'head-test-job-v1',jobId:'job',reviewId:'review',snapshotId:'snapshot',repository:'scottchu/pr-reviewer',sourceProject:'scottchu/pr-reviewer',baseSha:'a'.repeat(40),headSha:'b'.repeat(40),actorId:'local-user',target,provenance:'test_only_execution',preparation,createdAt:time,updatedAt:time,jobRevision:9,state:'failed',reason:'assertions_failed',effectDisposition:'quiescent',cancellation:null,invocations:[{invocationId:'invocation',phase:'execute',state:'completed',quiescence:'confirmed',processCount:0}],result:{...body,resultId:createHash('sha256').update(headTestCanonical(body)).digest('hex')}};
};
const cli=(args:readonly string[])=>new Promise<{code:number|null;out:string;err:string}>(resolve=>{
 const child=spawn(process.execPath,[script,...args],{env:{PATH:'/usr/bin:/bin'},stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',(b:Buffer)=>{out+=b.toString();});child.stderr.on('data',(b:Buffer)=>{err+=b.toString();});child.once('close',code=>resolve({code,out,err}));
});
const fixture=async(handler:(request:IncomingMessage,response:ServerResponse,body:Record<string,unknown>)=>void)=>{
 const requests:{path:string|undefined;body:Record<string,unknown>;authorization:string|undefined}[]=[];
 const server=createServer(async(req,res)=>{const chunks:Buffer[]=[];for await(const data of req)chunks.push(Buffer.from(data));const body=JSON.parse(Buffer.concat(chunks).toString()||'{}') as Record<string,unknown>;requests.push({path:req.url,body,authorization:req.headers.authorization});handler(req,res,body);});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');
 return {gateway:`http://127.0.0.1:${address.port}`,requests,close:()=>new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
};
const send=(res:ServerResponse,value:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
const scope=['--review','review','--snapshot','snapshot'];
test('C01/C02 actual CLI requests and reads same stored job/result then sends exact cancel without credentials',async()=>{
 const job=fixtureJob(),server=await fixture((req,res,body)=>{
  if(req.url==='/api/tests/targets')send(res,{reviewId:'review',snapshotId:'snapshot',headSha:job.headSha,targets:[{...target,availability:'available',reason:'test_only_execution'}]});
  else if(req.url==='/api/tests/jobs')send(res,{reviewId:'review',snapshotId:'snapshot',jobs:[job],selectedJob:job,nextCursor:null});
  else send(res,{commandId:body.commandId,actorId:'local-user',reviewId:'review',snapshotId:'snapshot',jobId:'job',jobRevision:9,state:'applied',result:{disposition:body.type==='CancelTest'?'already_terminal':'queued'}});
 });
 try{const run=(command:string,...args:string[])=>cli([command,'--gateway',server.gateway,...args]);
  assert.equal((await run('targets',...scope)).code,0);
  const requested=await run('request',...scope,'--command-id','explicit-request','--target',target.targetId,'--target-revision','2');assert.equal(requested.code,0);assert.equal(JSON.parse(requested.out).jobId,'job');
  const status=await run('status',...scope,'--job','job','--minimum-revision','9');assert.equal(status.code,0);assert.equal(JSON.parse(status.out).selectedJob.jobId,'job');
  const result=await run('result',...scope,'--job','job');assert.equal(result.code,0);assert.deepEqual(JSON.parse(result.out).result,job.result);
  const cancel=await run('cancel','--job','job','--command-id','explicit-cancel','--job-revision','9');assert.equal(cancel.code,0);assert.equal(JSON.parse(cancel.out).result.disposition,'already_terminal');
  assert.deepEqual(server.requests.map(r=>r.authorization),Array(5).fill(undefined));assert.deepEqual(server.requests[1]!.body,{type:'RequestTest',commandId:'explicit-request',reviewId:'review',snapshotId:'snapshot',targetId:target.targetId,expectedTargetRevision:2});assert.equal(server.requests[2]!.body.minimumJobRevision,9);assert.deepEqual(server.requests[4]!.body,{type:'CancelTest',commandId:'explicit-cancel',jobId:'job',expectedJobRevision:9});
 }finally{await server.close();}
});
test('C03 byte pages and streamed text preserve Unicode at page boundaries and escape control output',async()=>{
 const bytes=Buffer.from('x'.repeat(65535)+'中🙂\u001b[31m'),sha256=createHash('sha256').update(bytes).digest('hex');
 const server=await fixture((_req,res,body)=>{const offset=Number(body.offset??0),end=Math.min(bytes.length,offset+Number(body.length??65536));send(res,{jobId:'job',artifactId:id,sha256,totalBytes:bytes.length,offset,bytes:end-offset,nextOffset:end,complete:end===bytes.length,encoding:'base64',data:bytes.subarray(offset,end).toString('base64')});});
 try{const args=['artifact','--gateway',server.gateway,...scope,'--job','job','--artifact',id];const page=await cli([...args,'--offset','65535','--length','1']);assert.equal(page.code,0);assert.deepEqual(Buffer.from(JSON.parse(page.out).data,'base64'),bytes.subarray(65535,65536));
  const text=await cli([...args,'--text','true']);assert.equal(text.code,0);assert.equal(JSON.parse(text.out).text,bytes.toString('utf8'));assert.equal(text.out.includes('\u001b'),false);assert.equal(server.requests.length,3);
 }finally{await server.close();}
});
test('C04 invalid arguments send nothing and dropped mutation acknowledgement never retries',async()=>{
 const server=await fixture((req)=>{req.socket.destroy();});
 try{for(const args of [[],['targets','--token','secret'],['request',...scope,'--command-id','x','--target',target.targetId,'--target-revision','02'],['status',...scope,'--job','job','--job','duplicate'],['artifact',...scope,'--job','job','--artifact',id,'--length','65537']]){const value=await cli([...args,'--gateway',server.gateway]);assert.notEqual(value.code,0);assert.equal(JSON.parse(value.out).error.outcome,'not_sent');assert.equal(value.out.includes('secret'),false);}assert.equal(server.requests.length,0);for(const gateway of ['http://example.invalid',server.gateway+'/unexpected',server.gateway+'?query=1']){const value=await cli(['targets','--gateway',gateway,...scope]);assert.equal(JSON.parse(value.out).error.code,'invalid_gateway');assert.equal(JSON.parse(value.out).error.outcome,'not_sent');}assert.equal(server.requests.length,0);
  const lost=await cli(['request','--gateway',server.gateway,...scope,'--command-id','lost','--target',target.targetId,'--target-revision','2']);assert.notEqual(lost.code,0);assert.deepEqual(JSON.parse(lost.out),{ok:false,error:{code:'transport_error',outcome:'unknown',commandId:'lost'}});assert.equal(server.requests.length,1);
 }finally{await server.close();}
});
test('C04 rejects mismatched response identity, malformed schema, oversized body and redirects',async()=>{
 let mode='identity';const server=await fixture((_req,res)=>{if(mode==='identity'){const job=fixtureJob();send(res,{reviewId:'other',snapshotId:'snapshot',jobs:[job],selectedJob:job,nextCursor:null});}else if(mode==='schema')send(res,{unexpected:true});else if(mode==='large')res.end(' '.repeat(4*1024*1024+1));else{res.writeHead(302,{Location:'/api/tests/jobs'});res.end();}});
 try{for(mode of ['identity','schema','large','redirect']){const value=await cli(['status','--gateway',server.gateway,...scope,'--job','job']);assert.notEqual(value.code,0);assert.equal(JSON.parse(value.out).error.outcome,'unavailable');}assert.equal(server.requests.length,4);}finally{await server.close();}
});
test('C03 inconsistent artifact pages and digest fail before emitting partial text',async()=>{
 const server=await fixture((_req,res,body)=>{const offset=Number(body.offset??0);send(res,{jobId:'job',artifactId:id,sha256:hash,totalBytes:65537,offset,bytes:offset?1:65536,nextOffset:offset?65537:65536,complete:offset>0,encoding:'base64',data:Buffer.alloc(offset?1:65536,65).toString('base64')});});
 try{const value=await cli(['artifact','--gateway',server.gateway,...scope,'--job','job','--artifact',id,'--text','true']);assert.notEqual(value.code,0);assert.equal(JSON.parse(value.out).error.code,'artifact_integrity_error');assert.equal(value.out.includes('AAAA'),false);}finally{await server.close();}
});
test('C04 validates minimum revision, captured result identity, and typed errors without leaking server content',async()=>{
 let mode='minimum';const server=await fixture((_req,res)=>{const job=fixtureJob();if(mode==='minimum')send(res,{reviewId:'review',snapshotId:'snapshot',jobs:[job],selectedJob:job,nextCursor:null});else if(mode==='result'){const changed={...job,result:{...job.result!,intent:{...job.result!.intent,baseSha:'c'.repeat(40)}}};send(res,{reviewId:'review',snapshotId:'snapshot',jobs:[changed],selectedJob:changed,nextCursor:null});}else if(mode==='typed')send(res,{error:'test_job_conflict'},400);else send(res,{error:'private_server_detail'},500);});
 try{for(mode of ['minimum','result','typed','private']){const value=await cli(['result','--gateway',server.gateway,...scope,'--job','job','--minimum-revision',mode==='minimum'?'10':'9']);assert.notEqual(value.code,0);assert.equal(JSON.parse(value.out).error.code,mode==='typed'?'test_job_conflict':mode==='private'?'http_error':'response_schema');assert.equal(value.out.includes('private_server_detail'),false);assert.equal(value.err,'');}}
 finally{await server.close();}
});
test('C03 artifact declaration over retained-byte limit rejects before text collection',async()=>{
 const server=await fixture((_req,res)=>send(res,{jobId:'job',artifactId:id,sha256:hash,totalBytes:2*1024*1024+1,offset:0,bytes:0,nextOffset:0,complete:false,encoding:'base64',data:''}));
 try{const value=await cli(['artifact','--gateway',server.gateway,...scope,'--job','job','--artifact',id,'--text','true']);assert.notEqual(value.code,0);assert.equal(JSON.parse(value.out).error.code,'response_schema');assert.equal(server.requests.length,1);}finally{await server.close();}
});
test('C03 artifact paging rejects changed identity and preserves malformed original bytes in base64 mode',async()=>{
 let mode='changed';const invalid=Buffer.from([0xff,0x61]),sha256=createHash('sha256').update(invalid).digest('hex');
 const server=await fixture((_req,res,body)=>{const offset=Number(body.offset??0);if(mode==='invalid')send(res,{jobId:'job',artifactId:id,sha256,totalBytes:invalid.length,offset:0,bytes:invalid.length,nextOffset:invalid.length,complete:true,encoding:'base64',data:invalid.toString('base64')});else send(res,{jobId:'job',artifactId:id,sha256:offset?'b'.repeat(64):hash,totalBytes:65537,offset,bytes:offset?1:65536,nextOffset:offset?65537:65536,complete:offset>0,encoding:'base64',data:Buffer.alloc(offset?1:65536).toString('base64')});});
 try{const args=['artifact','--gateway',server.gateway,...scope,'--job','job','--artifact',id],changed=await cli([...args,'--text','true']);assert.notEqual(changed.code,0);assert.equal(JSON.parse(changed.out).error.code,'response_schema');mode='invalid';const raw=await cli(args);assert.equal(raw.code,0);assert.deepEqual(Buffer.from(JSON.parse(raw.out).data,'base64'),invalid);const text=await cli([...args,'--text','true']);assert.equal(text.code,0);assert.equal(JSON.parse(text.out).text,'�a');}finally{await server.close();}
});
test('C04 deadline aborts one stalled mutation with unknown acknowledgement and no retry',async()=>{
 const server=await fixture(()=>{});
 try{const value=await cli(['cancel','--gateway',server.gateway,'--job','job','--command-id','deadline-cancel','--job-revision','9']);assert.notEqual(value.code,0);assert.deepEqual(JSON.parse(value.out),{ok:false,error:{code:'deadline_exceeded',outcome:'unknown',commandId:'deadline-cancel'}});assert.equal(server.requests.length,1);}finally{await server.close();}
});
