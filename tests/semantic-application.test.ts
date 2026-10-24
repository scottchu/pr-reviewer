import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAnalysisBridge,semanticProjection} from '../src/application/public.ts';
import type {AnalysisView,AnalysisReceipt,AnalysisCommand,SemanticAnchor} from '../src/domain/public.ts';
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
  assert.match(f.calls[4]!.url,/snapshotId=s/);f.calls[4]!.resolve(view('s',{graphRevision:3}));await retry;
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
  const next=bridge.requestContext('/same','p');f.calls[3]!.resolve({...receipt,jobId:'new-job',jobRevision:100});await tick();assert.match(f.calls[4]!.url,/minimumJobRevision=100/);assert.doesNotMatch(f.calls[4]!.url,/analysisId=/);f.calls[4]!.resolve(view('s',{analysis,corpus,analysisGeneration:2}));await tick();assert.match(f.calls[5]!.url,/analysisId=bbbb/);assert.doesNotMatch(f.calls[5]!.url,/minimumJobRevision=/);f.calls[5]!.resolve(view('s',{analysis,corpus,analysisGeneration:2}));await next;
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
