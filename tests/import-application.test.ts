import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createStore} from '../src/storage/public.ts';
import {createGateway} from '../src/server/public.ts';
import {createImportsBridge} from '../src/application/imports.ts';
import type {ImportCommand} from '../src/domain/public.ts';

const deferred=<T,>()=>{
 let resolve!:(value:T|PromiseLike<T>)=>void;
 const promise=new Promise<T>(done=>{resolve=done;});
 return {promise,resolve};
};
const hold=()=>{
 const entered=deferred<void>(),released=deferred<void>();
 return {entered:entered.promise,release:()=>released.resolve(),wait:async()=>{entered.resolve();await released.promise;}};
};
type ResponseHook=(path:string,init:RequestInit|undefined,response:Response)=>Promise<Response>;

// Real gateway reads reproduce the reported bug. The command-only HTTP fixture
// applies the real store ingress without starting source/provider subprocesses.
const fixture=async()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-import-application-'));
 const store=createStore(join(root,'db'));
 const gateway=createGateway(store,async()=>({state:'unknown',reason:'fixture'}));
 const gatewayPort=await gateway.listen(0),nativeFetch=globalThis.fetch;
 const commands:{token:string;command:ImportCommand}[]=[];
 const server=createServer(async(req,res)=>{
  try{
   const token=(req.headers.authorization??'').slice(7);
   if(store.authenticate(token).kind!=='user')throw new Error('unauthorized');
   const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk as Uint8Array));
   const command=JSON.parse(Buffer.concat(chunks).toString()) as ImportCommand;
   commands.push({token,command});
   const receipt=store.imports.command(token,command);
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(receipt));
  }catch(error){res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error instanceof Error?error.message:'request_failed'}));}
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address==='object');
 let hook:ResponseHook=async(_path,_init,response)=>response;
 let reads=0;
 globalThis.fetch=(async(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>{
  const path=String(input),port=init?.method==='POST'?address.port:gatewayPort;
  if(init?.method!=='POST')reads++;
  const response=await nativeFetch(`http://127.0.0.1:${port}${path}`,init);
  return hook(path,init,response);
 }) as typeof fetch;
 const bridge=createImportsBridge();
 const seed=(token:string,path:string)=>store.imports.command(token,{type:'RequestImport',commandId:crypto.randomUUID(),path}).jobId;
 return {store,bridge,commands,seed,reads:()=>reads,setHook:(value:ResponseHook)=>{hook=value;},close:async()=>{
  globalThis.fetch=nativeFetch;
  await gateway.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  store.close();rmSync(root,{recursive:true,force:true});
 }};
};

test('late old-credential gateway GET cannot overwrite the new credential view',async()=>{
 const f=await fixture(),gate=hold();
 try{
  const old=f.store.issueUser(),current=f.store.issueUser();
  const oldJob=f.seed(old,'/old'),newJob=f.seed(current,'/current');
  f.setHook(async(_path,init,response)=>{if((init?.headers as Record<string,string>).Authorization===`Bearer ${old}`)await gate.wait();return response;});
  const previous=f.bridge.login(old);await gate.entered;
  await f.bridge.login(current);assert.equal(f.bridge.getSnapshot().jobs[0]?.jobId,newJob);
  gate.release();await previous;
  assert.notEqual(oldJob,newJob);assert.equal(f.bridge.getSnapshot().jobs[0]?.jobId,newJob);
 }finally{gate.release();await f.close();}
});

test('explicit same-token login resets the view and stale read errors cannot publish after it or logout',async()=>{
 const f=await fixture(),gate=hold();
 try{
  const token=f.store.issueUser();f.seed(token,'/first');await f.bridge.login(token);
  let first=true;
  f.setHook(async(_path,_init,response)=>{if(first){first=false;await gate.wait();throw new Error('old_read_failed');}return response;});
  const old=f.bridge.login(token);await gate.entered;
  const current=f.bridge.login(token);
  assert.deepEqual(f.bridge.getSnapshot().jobs,[],'explicit login clears old credential view synchronously');
  assert.equal(f.bridge.getSnapshot().authenticated,false);
  await current;gate.release();await old;
  assert.equal(f.bridge.getSnapshot().error,'');assert.equal(f.bridge.getSnapshot().authenticated,true);
  await f.bridge.login('');assert.deepEqual(f.bridge.getSnapshot().jobs,[]);assert.equal(f.bridge.getSnapshot().authenticated,false);
 }finally{gate.release();await f.close();}
});

for(const outcome of ['receipt','error','definitive'] as const)test(`late old command ${outcome} cannot release a new credential command or retain its old retry`,async()=>{
 const f=await fixture(),oldGate=hold(),newGate=hold();
 try{
  const old=f.store.issueUser(),current=f.store.issueUser();await f.bridge.login(old);
  f.setHook(async(_path,init,response)=>{
   if(init?.method!=='POST')return response;
   if((init.headers as Record<string,string>).Authorization===`Bearer ${old}`){await oldGate.wait();if(outcome==='error')throw new Error('old_lost_ack');if(outcome==='definitive')return Response.json({error:'old_unauthorized'},{status:401});}
   else await newGate.wait();
   return response;
  });
  const oldSend=f.bridge.importFrom('/old').then(()=>null,error=>error);await oldGate.entered;
  await f.bridge.login(current);
  assert.equal(f.bridge.getSnapshot().busy,false);assert.equal(f.bridge.getSnapshot().uncertain,false);
  await assert.rejects(f.bridge.retry(),/invalid_request/);
  const newSend=f.bridge.importFrom('/new');await newGate.entered;
  oldGate.release();await oldSend;
  assert.equal(f.bridge.getSnapshot().busy,true,'stale finally cannot release the newer command');
  assert.equal(f.bridge.getSnapshot().error,'');assert.equal(f.bridge.getSnapshot().uncertain,false);
  await assert.rejects(f.bridge.importFrom('/overlap'),/submission_in_progress/);
  newGate.release();await newSend;
  assert.equal(f.bridge.getSnapshot().busy,false);assert.equal(f.bridge.getSnapshot().jobs[0]?.path,'/new');
  assert.deepEqual(f.commands.map(item=>[item.token,item.command.type==='RequestImport'?item.command.path:'']),[[old,'/old'],[current,'/new']]);
 }finally{oldGate.release();newGate.release();await f.close();}
});

test('disposal fences a pending GET; reconnect rereads and an old disposer cannot tear it down',async()=>{
 const f=await fixture(),gate=hold();let dispose:(()=>void)|undefined;
 try{
  const token=f.store.issueUser(),job=f.seed(token,'/before');
  const first=f.bridge.connect();
  let once=true;f.setHook(async(_path,_init,response)=>{if(once){once=false;await gate.wait();}return response;});
  const login=f.bridge.login(token);await gate.entered;first();
  const snapshot=f.bridge.getSnapshot();gate.release();await login;
  assert.equal(f.bridge.getSnapshot(),snapshot,'disposed reads do not publish even when transport finishes');
  f.seed(token,'/after');dispose=f.bridge.connect();first();
  assert.equal(f.bridge.diagnostics().length,1);
  await delay(650);
  assert.equal(f.bridge.getSnapshot().jobs.length,2);assert.ok(f.bridge.getSnapshot().jobs.some(item=>item.jobId===job));
  assert.equal(f.bridge.getSnapshot().authenticated,true);
  assert.throws(()=>f.bridge.connect(),/duplicate_route/);
 }finally{dispose?.();gate.release();await f.close();}
});

test('disposed command cannot publish; reconnect reads its server commit and explicit retry retains identity',async()=>{
 const f=await fixture(),gate=hold();let dispose:(()=>void)|undefined;
 try{
  const token=f.store.issueUser();await f.bridge.login(token);const first=f.bridge.connect();
  let once=true;f.setHook(async(_path,init,response)=>{if(init?.method==='POST'&&once){once=false;await gate.wait();}return response;});
  const sent=f.bridge.importFrom('/committed-while-disposed');await gate.entered;first();
  assert.equal(f.bridge.getSnapshot().busy,false);assert.equal(f.bridge.getSnapshot().uncertain,true);
  const snapshot=f.bridge.getSnapshot();gate.release();await sent;
  assert.equal(f.bridge.getSnapshot(),snapshot);
  dispose=f.bridge.connect();await delay(650);
  assert.equal(f.bridge.getSnapshot().jobs[0]?.path,'/committed-while-disposed');assert.equal(f.commands.length,1,'reconnect does not replay');
  await f.bridge.retry();assert.equal(f.commands.length,2);assert.equal(f.commands[0]?.command.commandId,f.commands[1]?.command.commandId);
  assert.equal(f.bridge.getSnapshot().uncertain,false);assert.equal(f.store.imports.list(token).length,1);
 }finally{dispose?.();gate.release();await f.close();}
});

test('polling cannot replace a slow explicit login read',async()=>{
 const f=await fixture(),gate=hold();let dispose:(()=>void)|undefined;
 try{
  const token=f.store.issueUser();f.seed(token,'/current');
  f.setHook(async(_path,_init,response)=>{await gate.wait();return response;});
  dispose=f.bridge.connect();const login=f.bridge.login(token);await gate.entered;
  const reads=f.reads();await delay(650);assert.equal(f.reads(),reads);
  gate.release();await login;assert.equal(f.bridge.getSnapshot().jobs[0]?.path,'/current');
 }finally{dispose?.();gate.release();await f.close();}
});

test('an older same-credential poll cannot rewind a command readback',async()=>{
 const f=await fixture(),gate=hold();let dispose:(()=>void)|undefined;
 try{
  const token=f.store.issueUser();await f.bridge.login(token);dispose=f.bridge.connect();
  let once=true;f.setHook(async(_path,init,response)=>{if(init?.method!=='POST'&&once){once=false;await gate.wait();}return response;});
  await gate.entered;await f.bridge.importFrom('/latest');assert.equal(f.bridge.getSnapshot().jobs[0]?.path,'/latest');
  gate.release();await delay(30);assert.equal(f.bridge.getSnapshot().jobs[0]?.path,'/latest');
 }finally{dispose?.();gate.release();await f.close();}
});

test('current unknown retry uses one exact command; changed intent is blocked and relogin resets recovery',async()=>{
 const f=await fixture();
 try{
  const token=f.store.issueUser();await f.bridge.login(token);
  let lost=true;f.setHook(async(_path,init,response)=>{if(init?.method==='POST'&&lost){lost=false;throw new Error('lost_ack');}return response;});
  await assert.rejects(f.bridge.importFrom('/same'),/lost_ack/);assert.equal(f.bridge.getSnapshot().uncertain,true);assert.equal(f.bridge.getSnapshot().busy,false);
  await assert.rejects(f.bridge.importFrom('/changed'),/import_submission_unknown/);
  const receipt=await f.bridge.retry();assert.equal(receipt.state,'applied');assert.equal(f.commands[0]?.command.commandId,f.commands[1]?.command.commandId);
  assert.equal(f.store.imports.list(token).length,1);assert.equal(f.bridge.getSnapshot().uncertain,false);assert.equal(f.bridge.getSnapshot().error,'');
  lost=true;await assert.rejects(f.bridge.importFrom('/another'),/lost_ack/);
  await f.bridge.login(token);await assert.rejects(f.bridge.retry(),/invalid_request/);assert.equal(f.bridge.getSnapshot().uncertain,false);
 }finally{await f.close();}
});

test('definitive HTTP and domain rejections release pending intent for a corrected command',async()=>{
 const f=await fixture();
 try{
  const token=f.store.issueUser();await f.bridge.login(token);
  let reject=true;f.setHook(async(_path,init,response)=>{if(init?.method==='POST'&&reject){reject=false;return Response.json({error:'invalid_request'},{status:400});}return response;});
  await assert.rejects(f.bridge.importFrom('/rejected-http'),/invalid_request/);assert.equal(f.bridge.getSnapshot().uncertain,false);
  await f.bridge.importFrom('/corrected');assert.notEqual(f.commands[0]?.command.commandId,f.commands[1]?.command.commandId);
  await assert.rejects(f.bridge.send({type:'CancelImport',jobId:crypto.randomUUID()}));assert.equal(f.bridge.getSnapshot().uncertain,false);
  await f.bridge.importFrom('/normal');assert.equal(f.bridge.getSnapshot().busy,false);assert.equal(f.bridge.getSnapshot().error,'');
 }finally{await f.close();}
});
