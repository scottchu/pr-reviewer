import {test} from 'node:test';
import {writeFileSync} from 'node:fs';
import {semanticFixture,eventually} from './semantic-fixture.ts';
import {createGateway} from '../src/server/public.ts';
import assert from 'node:assert/strict';
import {createAnalysisBridge,semanticProjection} from '../src/application/public.ts';
import type {AnalysisView,AnalysisReceipt,AnalysisCommand,SemanticAnchor,AnalysisJobView} from '../src/domain/public.ts';
const view=(snapshotId='s',patch:Partial<AnalysisView>={}):AnalysisView=>({reviewId:'r',snapshotId,currentSnapshotId:'current',analysisGeneration:0,graphRevision:0,selectedAnalysisId:null,jobs:[],preparation:null,corpus:null,inventory:null,analysis:null,clarifications:[],...patch});
const receipt:AnalysisReceipt={commandId:'assigned',actorId:'owner',state:'applied',reviewId:'r',snapshotId:'s',analysisGeneration:1,graphRevision:0,result:{}};
const anchor:SemanticAnchor={snapshotId:'s',side:'head',path:'same.ts',contentHash:'a'.repeat(64),start:0,end:1,startLine:1,endLine:1};
const controlledFetch=()=>{
 const original=globalThis.fetch;
 const calls:{url:string;options:RequestInit|undefined;resolve:(value:unknown,status?:number)=>void;reject:(error:Error)=>void}[]=[];
 globalThis.fetch=((url: string|URL|Request,options?:RequestInit)=>new Promise<Response>((resolve,reject)=>calls.push({url:String(url),options,resolve:(body,status=200)=>resolve(new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}})),reject}))) as typeof fetch;
 return {calls,restore:()=>{globalThis.fetch=original;}};
};
const tick=()=>new Promise<void>(resolve=>setImmediate(resolve));
const jobView=(jobId:string,jobRevision:number,generation=1):AnalysisJobView=>({jobId,jobRevision,generation,reviewId:'r',snapshotId:'s',state:'superseded',reason:null,corpusId:null,inventoryId:null,analysisId:null,declarationIds:[],invocations:[],contextIssues:[],admission:null});
test('semantic credentials and selection fence late reads even when transport ignores abort',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const old=bridge.login('old','s'),fresh=bridge.login('new','s');f.calls[1]!.resolve(view('s',{graphRevision:8}));await fresh;
  f.calls[0]!.resolve(view('s',{graphRevision:99}));await old;
  assert.equal(bridge.getSnapshot().view?.graphRevision,8);
  const a=bridge.select('history-a'),b=bridge.select('history-b');f.calls[3]!.resolve(view('history-b'));await b;f.calls[2]!.resolve(view('history-a'));await a;
  assert.equal(bridge.getSnapshot().view?.snapshotId,'history-b');assert.equal(f.calls[2]!.options?.signal?.aborted,true);
 }finally{f.restore();}
});
test('late old-credential command cannot clear a new pending operation or its intent',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  let login=bridge.login('old','s');f.calls[0]!.resolve(view());await login;
  const old=bridge.requestContext('/old','p').catch(error=>error as Error);
  login=bridge.login('new','s');f.calls[2]!.resolve(view());await login;
  const fresh=bridge.requestContext('/new','p');f.calls[1]!.resolve(receipt);assert.match(String(await old),/superseded/);
  assert.equal(bridge.getSnapshot().busy,true);assert.match(f.calls[3]!.options?.body as string,/new/);
  f.calls[3]!.resolve(receipt);await tick();f.calls[4]!.resolve(view('s',{analysisGeneration:1}));await fresh;
  assert.equal(bridge.getSnapshot().busy,false);assert.equal(bridge.getSnapshot().uncertain,false);
 }finally{f.restore();}
});
test('uncertain semantic command retries exact ID through readback failure and rejects changed intent',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view());await login;
  const first=bridge.requestContext('/source','p');const firstBody=f.calls[1]!.options?.body;f.calls[1]!.reject(new Error('connection_lost'));await assert.rejects(first,/connection_lost/);
  await assert.rejects(bridge.requestContext('/changed','p'),/unchanged/);
  const retry=bridge.retry();assert.equal(f.calls[2]!.options?.body,firstBody);f.calls[2]!.resolve(receipt);await tick();f.calls[3]!.reject(new Error('readback_lost'));await assert.rejects(retry,/readback_lost/);
  assert.equal(bridge.getSnapshot().uncertain,true);
  const last=bridge.retry();assert.equal(f.calls[4]!.options?.body,firstBody);f.calls[4]!.resolve(receipt);await tick();f.calls[5]!.resolve(view('s',{analysisGeneration:1}));await last;
  assert.equal(bridge.getSnapshot().uncertain,false);
 }finally{f.restore();}
});
test('poll route cannot interrupt an explicit login read and returns to baseline after disposal',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');let dispose=()=>{};
 try{
  const login=bridge.login('owner','s');dispose=bridge.connect();await new Promise(resolve=>setTimeout(resolve,650));assert.equal(f.calls.length,1);assert.equal(f.calls[0]!.options?.signal?.aborted,false);
  f.calls[0]!.resolve(view());await login;assert.equal(bridge.diagnostics().length,1);
  dispose();assert.deepEqual(bridge.diagnostics(),[]);const count=f.calls.length;await new Promise(resolve=>setTimeout(resolve,650));assert.equal(f.calls.length,count);
 }finally{dispose();f.restore();}
});
test('old clarification response cannot overwrite a newer snapshot or clear its pending context command',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view());await login;
  const intent:Omit<Extract<AnalysisCommand,{type:'PutGraphClarification'}>,'commandId'>={type:'PutGraphClarification',reviewId:'r',snapshotId:'s',analysisId:'b'.repeat(64),expectedGraphRevision:3,kind:'question',primary:anchor,evidence:[],text:'What evidence supports this?'};
  const annotation=bridge.send(intent).catch(error=>error as Error),select=bridge.select('new');f.calls[2]!.resolve(view('new'));await select;
  f.calls[1]!.resolve({...receipt,graphRevision:4});assert.match(String(await annotation),/superseded/);
  assert.equal(bridge.getSnapshot().view?.snapshotId,'new');assert.equal(bridge.getSnapshot().view?.graphRevision,0);assert.equal(bridge.getSnapshot().uncertain,true);
  await assert.rejects(bridge.requestContext('/new','p'),/unchanged/);
 }finally{f.restore();}
});
test('late exact-source response after private snapshot selection is ignored',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  // Public-port test double: this metadata is not storage/admission evidence.
  const corpus={corpusId:'c'.repeat(64),sources:[]} as unknown as NonNullable<AnalysisView['corpus']>;
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view('s',{corpus}));await login;
  const opening=bridge.openSource(anchor),select=bridge.select('new');f.calls[2]!.resolve(view('new'));await select;
  f.calls[1]!.resolve({...anchor,corpusId:corpus.corpusId,content:'old source'});await opening;
  assert.equal(bridge.getSnapshot().source,null);assert.equal(bridge.getSnapshot().view?.snapshotId,'new');assert.equal(bridge.getSnapshot().sourceBusy,false);
 }finally{f.restore();}
});
test('retry a retained old-snapshot annotation reads its receipt scope without moving current private selection',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view());await login;
  const first=bridge.requestContext('/old','p');f.calls[1]!.reject(new Error('connection_lost'));await assert.rejects(first);
  const select=bridge.select('new');f.calls[2]!.resolve(view('new'));await select;
  const retry=bridge.retry();f.calls[3]!.resolve({...receipt,snapshotId:'s',graphRevision:3});await tick();
  assert.match(f.calls[4]!.url,/snapshotId=s/);f.calls[4]!.resolve(view('s',{graphRevision:3,analysisGeneration:1}));await retry;
  assert.equal(bridge.getSnapshot().view?.snapshotId,'new');assert.equal(bridge.getSnapshot().uncertain,false);
 }finally{f.restore();}
});
test('pending new generation preserves admitted facts and polling cannot interrupt source evidence',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');let dispose=()=>{};
 try{
  // Public-port doubles exercise presentation ownership, not result validation/admission.
  const analysis={status:'analyzed',analysisId:'b'.repeat(64),nodes:[],edges:[],neighborhoods:[],unresolved:[]} as unknown as NonNullable<AnalysisView['analysis']>;
  const corpus={corpusId:'c'.repeat(64),sources:[]} as unknown as NonNullable<AnalysisView['corpus']>;
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view('s',{analysis,corpus}));await login;
  const opening=bridge.openSource(anchor);dispose=bridge.connect();await new Promise(resolve=>setTimeout(resolve,650));assert.equal(f.calls.length,2);assert.equal(f.calls[1]!.options?.signal?.aborted,false);
  f.calls[1]!.resolve({...anchor,corpusId:corpus.corpusId,content:'exact retained body'});await opening;
  const refreshing=bridge.refresh();f.calls[2]!.resolve(view('s',{analysis,corpus,analysisGeneration:2,preparation:{jobId:'pending',corpus:null,inventory:null,result:null}}));await refreshing;
  assert.equal(bridge.getSnapshot().view?.analysis?.analysisId,analysis.analysisId);assert.equal(bridge.getSnapshot().view?.preparation?.jobId,'pending');assert.equal(bridge.getSnapshot().source?.content,'exact retained body');assert.deepEqual(bridge.getSnapshot().sourceAnchor,anchor);
 }finally{dispose();f.restore();}
});

test('held evidence pins its admitted analysis; a newer preparation receipt is confirmed independently of that private pin',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const analysis={status:'analyzed',analysisId:'b'.repeat(64),nodes:[],edges:[],neighborhoods:[],unresolved:[]} as unknown as NonNullable<AnalysisView['analysis']>;
  const corpus={corpusId:'c'.repeat(64),sources:[]} as unknown as NonNullable<AnalysisView['corpus']>;
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view('s',{analysis,corpus,selectedAnalysisId:analysis.analysisId}));await login;
  const open=bridge.openSource(anchor);f.calls[1]!.resolve({...anchor,corpusId:corpus.corpusId,content:'held evidence'});await open;
  const stale=bridge.refresh();assert.match(f.calls[2]!.url,/analysisId=bbbb/);f.calls[2]!.resolve(view('s',{analysis:{...analysis,analysisId:'d'.repeat(64)}}));await assert.rejects(stale,/selection_mismatch/);assert.equal(bridge.getSnapshot().view?.analysis?.analysisId,analysis.analysisId);
  const next=bridge.requestContext('/same','p');f.calls[3]!.resolve({...receipt,jobId:'new-job',jobRevision:100});await tick();assert.match(f.calls[4]!.url,/analysisId=bbbb/);assert.doesNotMatch(f.calls[4]!.url,/minimumJobRevision/);f.calls[4]!.resolve(view('s',{analysis,corpus,analysisGeneration:2,jobs:[jobView('new-job',100),jobView('newer-job',1,2)]}));await next;
  assert.equal(bridge.getSnapshot().source?.content,'held evidence');assert.equal(bridge.getSnapshot().view?.analysis?.analysisId,analysis.analysisId);assert.equal(bridge.getSnapshot().uncertain,false);
 }finally{f.restore();}
});
test('focused graph bounds do not discard admitted facts or invent a node for an unresolved seed',()=>{
 const a=(id:string,side:'base'|'head')=>({id,name:id,kind:'function',role:'context',declaration:{...anchor,side},body:{...anchor,side}});
 const nodes=[a('before','base'),a('after','head'),...Array.from({length:20},(_,i)=>a('neighbor'+i,'head'))];
 const analysis={status:'analyzed',analysisId:'b'.repeat(64),nodes,edges:nodes.slice(2).map(node=>({id:node.id,caller:'after',callee:node.id})),neighborhoods:[{nodeId:'before'},{nodeId:'after'}],unresolved:[]} as unknown as NonNullable<AnalysisView['analysis']>;
 const input=view('s',{analysis}),before=JSON.stringify(input),projected=semanticProjection(input,'after');assert.equal(projected.nodes.length,12);assert.equal(projected.totalNodes,22);assert.ok(projected.nodes.some(node=>node.id==='before'));assert.ok(projected.nodes.some(node=>node.id==='after'));assert.equal(JSON.stringify(input),before);
 const empty=semanticProjection(view('s',{analysis:{...analysis,status:'analyzed',nodes:[],edges:[],neighborhoods:[],unresolved:[]}}),'');assert.equal(empty.totalNodes,0);assert.deepEqual(empty.nodes,[]);
});
test('slow background body reads remain bounded while committed polling continues',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const node={id:'seed',name:'seed',kind:'function',role:'changed',declaration:anchor,body:anchor};
  const analysis={status:'analyzed',analysisId:'b'.repeat(64),nodes:[node],edges:[],neighborhoods:[{nodeId:'seed'}],unresolved:[]} as unknown as NonNullable<AnalysisView['analysis']>;
  const corpus={corpusId:'c'.repeat(64),sources:[]} as unknown as NonNullable<AnalysisView['corpus']>;
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view('s',{analysis,corpus}));await login;assert.equal(f.calls.length,2);
  const read=bridge.refresh();f.calls[2]!.resolve(view('s',{analysis,corpus}));await read;assert.equal(f.calls.filter(call=>call.url==='/api/analysis/source').length,1);
  f.calls[1]!.resolve({...anchor,corpusId:corpus.corpusId,content:'complete body'});await tick();assert.equal(Object.keys(bridge.getSnapshot().snippets).length,1);
 }finally{f.restore();}
});

test('an accepted receipt survives definitive readback failure and retries its exact command against its own old job',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view());await login;
  const first=bridge.requestContext('/source','p'),command=f.calls[1]!.options?.body;
  const accepted={...receipt,jobId:'older-job',jobRevision:99};f.calls[1]!.resolve(accepted);await tick();f.calls[2]!.resolve({error:'revision_unavailable'},400);await assert.rejects(first,/revision_unavailable/);
  assert.equal(bridge.getSnapshot().uncertain,true,'an accepted command remains recoverable after readback400');
  const retry=bridge.retry();assert.equal(f.calls[3]!.options?.body,command);f.calls[3]!.resolve(accepted);await tick();assert.doesNotMatch(f.calls[4]!.url,/minimumJobRevision/);
  f.calls[4]!.resolve(view('s',{analysisGeneration:2,jobs:[jobView('older-job',103),jobView('newer-job',1,2)]}));assert.deepEqual(await retry,accepted);assert.equal(bridge.getSnapshot().uncertain,false);
 }finally{f.restore();}
});
test('an unrelated large job revision cannot acknowledge an accepted old-job receipt',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view());await login;
  const send=bridge.requestContext('/source','p');f.calls[1]!.resolve({...receipt,jobId:'older-job',jobRevision:99});await tick();
  f.calls[2]!.resolve(view('s',{analysisGeneration:2,jobs:[jobView('older-job',98),jobView('newer-job',1000,2)]}));await assert.rejects(send,/readback_pending/);assert.equal(bridge.getSnapshot().uncertain,true);assert.deepEqual(bridge.getSnapshot().view?.jobs,[]);
 }finally{f.restore();}
});

test('real gateway confirms the exact delayed accepted job after a newer same-snapshot request', {timeout:20000},async()=>{
 const fixture=semanticFixture(),gateway=createGateway(fixture.store,async()=>({state:'unknown' as const,reason:'Controlled semantic receipt race.'}));
 const base=`http://127.0.0.1:${await gateway.listen(0)}`,original=globalThis.fetch,bridge=createAnalysisBridge('r');
 let held:AnalysisReceipt|null=null,release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 const reads:{url:string;status:number}[]=[];
 globalThis.fetch=(async(input,options)=>{
  const url=String(input),response=await original(url.startsWith('/')?base+url:url,options);
  if(url.startsWith('/api/analysis?'))reads.push({url,status:response.status});
  if(url==='/api/analysis/commands'&&JSON.parse(String(options?.body)).type==='SelectAnalysisDeclarations'){held=await response.clone().json() as AnalysisReceipt;await gate;}
  return response;
 }) as typeof fetch;
 const query=()=>fixture.store.analysis.query(fixture.token,{reviewId:'r',snapshotId:fixture.snapshot.snapshotId});
 try{
  await bridge.login(fixture.token,fixture.snapshot.snapshotId);await bridge.requestContext(fixture.root,'scottchu/pr-reviewer');await eventually(()=>query().jobs.at(-1)?.state==='awaiting_declarations',15000);await bridge.refresh();
  const inventory=query().preparation?.inventory;assert.equal(inventory?.status,'available');if(inventory?.status!=='available')throw new Error('inventory_unavailable');
  const choosing=bridge.chooseDeclarations([inventory.declarations.find(item=>item.name==='callee'&&item.declaration.side==='head')!.id]).then(value=>({receipt:value,error:null}),error=>({receipt:null,error:String(error)}));
  await eventually(()=>held!==null,15000);const accepted=held as unknown as AnalysisReceipt;
  // A concurrent public owner command advances the generation. The pending B job
  // is intentionally not separately woken; no storage internals or fact JSON are used.
  const replacement=fixture.store.analysis.command(fixture.token,{...fixture.request,commandId:'replacement-before-acknowledgement',expectedAnalysisGeneration:1});assert.equal(replacement.state,'applied');
  const before=query();assert.ok(before.jobs.find(job=>job.jobId===replacement.jobId)!.jobRevision<accepted.jobRevision!);
  release();const result=await choosing,after=query();
  if(process.env.REVIEW_SEMANTIC_RECEIPT_EVIDENCE)writeFileSync(process.env.REVIEW_SEMANTIC_RECEIPT_EVIDENCE,JSON.stringify({provenance:'Real Git, Node gateway, SQLite and fixed analysis worker; concurrent public owner RequestAnalysis before held command response.',accepted,result,uncertain:bridge.getSnapshot().uncertain,jobs:after.jobs.map(job=>({jobId:job.jobId,generation:job.generation,jobRevision:job.jobRevision,state:job.state})),reads},null,2));
  assert.equal(result.error,null);assert.equal(result.receipt?.commandId,accepted.commandId);assert.equal(bridge.getSnapshot().uncertain,false);assert.equal(bridge.getSnapshot().view?.analysisGeneration,2);assert.ok(reads.every(read=>!read.url.includes('minimumJobRevision')));
 }finally{release();bridge.logout();globalThis.fetch=original;await gateway.close();fixture.cleanup();}
});
test('cancelling an older unknown job confirms its captured job generation independently of current snapshot generation',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const old={...jobView('old-unknown',80),state:'unknown' as const};
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view('s',{analysisGeneration:2,jobs:[old,jobView('new-job',1,2)]}));await login;
  const cancel=bridge.cancel(old);f.calls[1]!.resolve({...receipt,analysisGeneration:2,jobId:old.jobId,jobRevision:81});await tick();
  f.calls[2]!.resolve(view('s',{analysisGeneration:2,jobs:[{...old,jobRevision:81},jobView('new-job',1,2)]}));await cancel;assert.equal(bridge.getSnapshot().uncertain,false);
 }finally{f.restore();}
});
test('a late accepted old-snapshot receipt stays accepted through a later retry HTTP rejection',async()=>{
 const f=controlledFetch(),bridge=createAnalysisBridge('r');
 try{
  const login=bridge.login('owner','s');f.calls[0]!.resolve(view());await login;
  const first=bridge.requestContext('/old','p').catch(error=>String(error)),originalCommand=f.calls[1]!.options?.body;
  const select=bridge.select('new');f.calls[2]!.resolve(view('new'));await select;f.calls[1]!.resolve(receipt);assert.match(String(await first),/superseded/);
  const retry=bridge.retry();assert.equal(f.calls[3]!.options?.body,originalCommand);f.calls[3]!.resolve({error:'projection_pending'},400);await assert.rejects(retry,/projection_pending/);
  assert.equal(bridge.getSnapshot().uncertain,true);assert.equal(bridge.getSnapshot().view?.snapshotId,'new');
 }finally{f.restore();}
});
