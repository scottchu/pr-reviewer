import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runAnalysisWorker,isAnalysisWorkerWitness} from '../src/analysis-jobs/public.ts';
import type {WorkerRequest,WorkerEnvelope,WorkerOptions,WorkerObservations} from '../src/analysis-jobs/public.ts';
import type {AnalysisProcess} from '../src/domain/public.ts';

const content='\uFEFFexport const target = () => 1;\r\nexport const caller = () => target();\r\n';
const input={contract:'source-neighborhood-v1' as const,snapshotId:'worker-fixture',change:{repository:'fixture/repo',provider:'fixture',changeId:'1'},commits:{base:'a'.repeat(40),head:'b'.repeat(40)},corpus:{base:{commit:'a'.repeat(40),inventory:'selected-context' as const,acquisition:'fixture'},head:{commit:'b'.repeat(40),inventory:'selected-context' as const,acquisition:'fixture'}},sources:[{side:'head' as const,path:'fixture.ts',commit:'b'.repeat(40),role:'changed' as const,selected:true,source:{content,contentHash:createHash('sha256').update(content).digest('hex')}}],profile:{name:'repository-static-v1' as const},budgets:{inventoryPathsPerSide:4096,inventoryBytes:2097152,filesPerSide:128,fileBytes:262144,totalBytes:4194304,seeds:64,astNodes:200000,invocationSites:10000,outputNodes:2000,outputSites:4000,aliasPatterns:32,aliasTargets:4,reExportLinks:32}};
const request:WorkerRequest={protocol:'analysis-worker-v1',invocationId:'fixture-inventory',phase:'inventory',input};
const observations=()=>{const rows:AnalysisProcess[]=[];return {rows,port:{recordProcess:(row:AnalysisProcess)=>rows.push(row),cancelled:()=>false} satisfies WorkerObservations};};
const fixture=async(code:string,options:WorkerOptions={},port:WorkerObservations=observations().port)=>{const root=mkdtempSync(join(tmpdir(),'pr-reviewer-worker-'));const entryPath=join(root,'fixture.cjs');writeFileSync(entryPath,code);try{return await runAnalysisWorker(request,port,{entryPath,...options});}finally{rmSync(root,{recursive:true,force:true});}};
const emit=(envelope:WorkerEnvelope)=>`const b=Buffer.from(${JSON.stringify(JSON.stringify(envelope))});const h=Buffer.alloc(4);h.writeUInt32BE(b.length);process.stdout.write(Buffer.concat([h,b]));`;

test('real Node worker inventories and computes without serializable authority; lifecycle is ordered',async()=>{
 const o=observations(),out=await runAnalysisWorker(request,o.port);assert.equal(out.envelope.phase,'inventory');assert.equal(out.envelope.result.status,'available');assert.deepEqual(o.rows.map(r=>r.state),['requested','started','exited']);assert.equal(o.rows[2]?.reason,'ok');assert.ok(isAnalysisWorkerWitness(out.witness,request,out.envelope));assert.equal(isAnalysisWorkerWitness({},request,out.envelope),false);assert.equal(isAnalysisWorkerWitness(out.witness,request,structuredClone(out.envelope)),false);assert.equal(isAnalysisWorkerWitness(out.witness,structuredClone(request),out.envelope),true);
 if(out.envelope.phase!=='inventory'||out.envelope.result.status!=='available')throw Error('fixture');const declaration=out.envelope.result.declarations.find(d=>d.name==='caller')!;
 const compute:WorkerRequest={protocol:request.protocol,invocationId:'compute',phase:'compute',input:{...input,seeds:[{side:declaration.declaration.side,path:declaration.declaration.path,contentHash:declaration.declaration.contentHash,start:declaration.declaration.start,end:declaration.declaration.end}]}};
 const result=await runAnalysisWorker(compute,observations().port);assert.equal(result.envelope.result.status,'analyzed');if(result.envelope.phase==='compute'&&result.envelope.result.status==='analyzed'){assert.equal(result.envelope.result.edges.length,1);assert.equal(result.envelope.result.neighborhoods[0]?.incomingScope,'supplied_files_only');}
 assert.equal(isAnalysisWorkerWitness(out.witness,{...request,invocationId:'other'},out.envelope),false);assert.equal(isAnalysisWorkerWitness(JSON.parse(JSON.stringify(out.witness)),request,out.envelope),false);
});

test('bounded transport rejects malformed, truncated, oversized and repeated frames',async()=>{
 for(const code of ["process.stdout.write('oops')","process.stdout.write(Buffer.from([0,0,0,10,123]))","const h=Buffer.alloc(4);h.writeUInt32BE(16777217);process.stdout.write(h)","process.stdout.write(Buffer.from([0,0,0,2,123,125,0]))"]){await assert.rejects(fixture(code),/analysis_worker_/);}
 await assert.rejects(fixture("process.stderr.write('x'.repeat(65))",{stderrBytes:64}),/output_limit/);
});

test('parent rejects response provenance, complete schema, canonical identifiers and anchors',async()=>{
 const original=(await runAnalysisWorker(request,observations().port)).envelope;
 const mutations=[(e:any)=>e.inputFingerprint='0'.repeat(64),(e:any)=>e.invocationId='wrong',(e:any)=>e.phase='compute',(e:any)=>e.result.extra=true,(e:any)=>e.result.inventoryId='0'.repeat(64),(e:any)=>e.result.declarations[0].id='0'.repeat(64),(e:any)=>e.result.declarations[0].declaration.startLine=42,(e:any)=>e.result.declarations.push(e.result.declarations[0]),(e:any)=>e.result.coverage[0].path='other.ts',(e:any)=>e.result.coverage[0].examined=999999,(e:any)=>e.result.observed.invocationSites=0,(e:any)=>e.result.coverage[0].parseStatus='not_parsed',(e:any)=>e.result.coverage[0].status='pending'];
 for(const mutate of mutations){const value=structuredClone(original);mutate(value);await assert.rejects(fixture(emit(value)),/analysis_worker_/);}
});

test('limits reject invalid or raised ceilings before any process observation',async()=>{
 for(const options of [{timeoutMs:20001},{timeoutMs:0},{inputBytes:33554433},{outputBytes:16777217},{stderrBytes:65537},{timeoutMs:NaN},{outputBytes:1.5}]){const o=observations();await assert.rejects(runAnalysisWorker(request,o.port,options),/limit/);assert.deepEqual(o.rows,[]);}
 const o=observations();await assert.rejects(runAnalysisWorker(request,o.port,{inputBytes:100}),/input_limit/);assert.deepEqual(o.rows,[]);
});

test('nonzero, crash, deadline and cancellation require actual owned termination',async()=>{
 await assert.rejects(fixture('process.exit(7)'),/failed/);await assert.rejects(fixture("process.kill(process.pid,'SIGKILL')"),/failed/);
 const o=observations();await assert.rejects(fixture('setTimeout(()=>{},30000)',{timeoutMs:100},o.port),/timeout/);assert.equal(o.rows.at(-1)?.state,'exited');
 const controller=new AbortController(),cancel=observations();const running=fixture('setTimeout(()=>{},30000)',{signal:controller.signal},cancel.port);setTimeout(()=>controller.abort(),100);await assert.rejects(running,/cancelled/);const count=cancel.rows.length;await new Promise(r=>setTimeout(r,100));assert.equal(cancel.rows.length,count);
 const before=observations();await assert.rejects(runAnalysisWorker(request,{...before.port,cancelled:()=>true}),/cancelled/);assert.deepEqual(before.rows,[]);
});

test('leader exit never accepts valid output while owned descendants remain',async()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-worker-descendant-')),pidFile=join(root,'pid');let pid:number|undefined;
 try{const envelope=(await runAnalysisWorker(request,observations().port)).envelope;
 const code=`const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');const c=spawn(process.execPath,['-e','setTimeout(()=>{},30000)'],{stdio:'ignore'});writeFileSync(${JSON.stringify(pidFile)},String(c.pid));c.unref();${emit(envelope)}`;
 const o=observations();await assert.rejects(fixture(code,{},o.port),/termination_unknown/);pid=Number(readFileSync(pidFile,'utf8'));assert.doesNotThrow(()=>process.kill(pid!,0));assert.equal(o.rows.at(-1)?.reason,'termination_unknown');
 }finally{if(!pid&&existsSync(pidFile))pid=Number(readFileSync(pidFile,'utf8'));if(pid)try{process.kill(pid,'SIGKILL');}catch{}rmSync(root,{recursive:true,force:true});}
});

test('journal failure cannot mint authority and missing executable is a bounded known failure',async()=>{
 await assert.rejects(fixture('setTimeout(()=>{},30000)',{timeoutMs:100},{recordProcess:row=>{if(row.state==='started')throw Error('journal');},cancelled:()=>false}),/termination_unknown/);
 const o=observations();await assert.rejects(runAnalysisWorker(request,o.port,{executable:'/nonexistent/owner-fixture'}),/failed/);assert.deepEqual(o.rows.map(r=>r.state),['requested','exited']);
 for(const port of [{recordProcess:()=>{throw Error('private-path:/tmp/secret');},cancelled:()=>false},{recordProcess:()=>{},cancelled:()=>{throw Error('private-path:/tmp/secret');}}])await assert.rejects(runAnalysisWorker(request,port),error=>{assert.equal(String(error),'Error: analysis_worker_observation');return true;});
});

test('actual heap exhaustion is a known resource failure with sanitized diagnostics',async()=>{
 const o=observations();await assert.rejects(fixture('const a=[];while(true)a.push(new Array(1000000).fill(1));',{timeoutMs:5000},o.port),error=>{assert.match(String(error),/analysis_worker_failed/);assert.equal(String(error).includes('heap'),false);return true;});assert.equal(o.rows.at(-1)?.state,'exited');assert.equal(o.rows.at(-1)?.reason,'analysis_worker_failed');
});

test('fixed child environment discards preloads and credential-bearing ambient values',async()=>{
 const envelope=(await runAnalysisWorker(request,observations().port)).envelope;
 const saved={NODE_OPTIONS:process.env.NODE_OPTIONS,AWS_SECRET_ACCESS_KEY:process.env.AWS_SECRET_ACCESS_KEY};
 try{process.env.NODE_OPTIONS='--require=/nonexistent/private-preload';process.env.AWS_SECRET_ACCESS_KEY='worker-test-private';const out=await fixture(`if(process.env.NODE_OPTIONS||process.env.AWS_SECRET_ACCESS_KEY)process.exit(9);${emit(envelope)}`);assert.ok(isAnalysisWorkerWitness(out.witness,request,out.envelope));}
 finally{for(const key of ['NODE_OPTIONS','AWS_SECRET_ACCESS_KEY'] as const){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});

test('inherited pipes after leader exit settle as unknown without guessing descendant ownership',async()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-worker-pipes-')),pidFile=join(root,'pid');let pid:number|undefined;
 try{const o=observations();const running=fixture(`const {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');const c=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setTimeout(()=>{},30000)"],{stdio:'inherit'});writeFileSync(${JSON.stringify(pidFile)},String(c.pid));process.on('SIGTERM',()=>process.exit(0));setTimeout(()=>{},30000);`,{timeoutMs:200},o.port);
 const started=Date.now();await assert.rejects(running,/termination_unknown/);assert.ok(Date.now()-started<2000);pid=Number(readFileSync(pidFile,'utf8'));assert.doesNotThrow(()=>process.kill(pid!,0));assert.equal(o.rows.at(-1)?.reason,'termination_unknown');const count=o.rows.length;await new Promise(r=>setTimeout(r,50));assert.equal(o.rows.length,count);
 }finally{if(!pid&&existsSync(pidFile))pid=Number(readFileSync(pidFile,'utf8'));if(pid)try{process.kill(pid,'SIGKILL');}catch{}rmSync(root,{recursive:true,force:true});}
});

test('compute references and source anchors cannot be forged in otherwise valid frames',async()=>{
 const inventory=(await runAnalysisWorker(request,observations().port)).envelope;if(inventory.phase!=='inventory'||inventory.result.status!=='available')throw Error('fixture');const d=inventory.result.declarations.find(d=>d.name==='caller')!.declaration;
 const compute:WorkerRequest={...request,phase:'compute',input:{...input,seeds:[{side:d.side,path:d.path,contentHash:d.contentHash,start:d.start,end:d.end}]}};
 const base=(await runAnalysisWorker(compute,observations().port)).envelope;
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-worker-compute-')),entryPath=join(root,'fixture.cjs');try{
 const mutations=[(e:any)=>e.result.edges[0].callee='0'.repeat(64),(e:any)=>e.result.edges[0].id='0'.repeat(64),(e:any)=>e.result.edges[0].sites[0].anchor.contentHash='0'.repeat(64),(e:any)=>e.result.edges[0].sites[0].anchor.end=100000,(e:any)=>e.result.neighborhoods[0].outgoing=[],(e:any)=>e.result.nodes[0].body.side='base',(e:any)=>e.result.edges.push(e.result.edges[0]),(e:any)=>e.result.coverage[0].resolved=0,(e:any)=>e.result.coverage[0].unresolved=100,(e:any)=>{e.result.observed.invocationSites=0;e.result.coverage[0].examined=0;},(e:any)=>e.result.neighborhoods[0].outgoingAssessment='No explicit invocation sites in this function body under the supported syntax scan.',(e:any)=>e.result.neighborhoods[0].incomingAssessment='resolved_callers_found',(e:any)=>e.result.neighborhoods[0].limitations=[]];
 for(const mutate of mutations){const envelope=structuredClone(base);mutate(envelope);writeFileSync(entryPath,emit(envelope));await assert.rejects(runAnalysisWorker(compute,observations().port,{entryPath}),/analysis_worker_/);}
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('worker preserves rich pure-module results and honest partial/budget outcomes exactly',async()=>{
 // The oracle compiler is loaded in this test only; worker.ts uses type-only source-analysis imports.
 const {listNeighborhoodDeclarations,analyzeNeighborhood}=await import('../src/source-analysis/public.ts');
 const texts=[['impl.ts','export function target(x: number): number; export function target(x: string): string; export function target(x: number | string) { return x; }'],['bridge.ts',"export { target as renamed } from './impl';"],['use.ts',"import { renamed } from './bridge'; const caller = () => renamed(1); let mutable = () => 1; mutable(); const dynamic = () => import('./impl'); const missing = () => external();"],['component.tsx','export const Component = () => <div />;'],['broken.ts','const broken = ( => ;']] as const;
 const sources=texts.map(([path,content])=>({...input.sources[0]!,path,source:{content,contentHash:createHash('sha256').update(content).digest('hex')}}));
 const rich={...input,sources:[...sources,{side:'head' as const,path:'absent.ts',commit:input.commits.head,role:'context' as const,selected:true,exclusion:'missing' as const}]};
 const inventory=listNeighborhoodDeclarations(rich);assert.equal(inventory.status,'available');if(inventory.status!=='available')throw Error('fixture');const d=inventory.declarations.find(d=>d.name==='caller')!.declaration;
 const compute={...rich,seeds:[{side:d.side,path:d.path,contentHash:d.contentHash,start:d.start,end:d.end}]};
 for(const phase of ['inventory','compute'] as const){
  for(const budget of [{},{astNodes:1},{invocationSites:0},{outputNodes:0},{totalBytes:0},{inventoryBytes:1}]){
   const request:WorkerRequest=phase==='inventory'?{protocol:'analysis-worker-v1',invocationId:'rich-inventory',phase,input:{...rich,budgets:{...input.budgets,...budget}}}:{protocol:'analysis-worker-v1',invocationId:'rich-compute',phase,input:{...compute,budgets:{...input.budgets,...budget}}};
   const expected=request.phase==='inventory'?listNeighborhoodDeclarations(request.input):analyzeNeighborhood(request.input);const actual=await runAnalysisWorker(request,observations().port);assert.deepEqual(actual.envelope.result,expected);
  }
 }
});

test('bounded repeated anchors cannot make parent validation repeatedly rescan source prefixes',async()=>{
 const content=' '.repeat(240000)+'export const target = () => 1;\nexport const caller = () => {'+'target();'.repeat(20)+'};\n';
 const rich={...input,sources:[{...input.sources[0]!,source:{content,contentHash:createHash('sha256').update(content).digest('hex')}}]};
 const inventoryRequest:WorkerRequest={...request,input:rich};const inventory=(await runAnalysisWorker(inventoryRequest,observations().port)).envelope;if(inventory.phase!=='inventory'||inventory.result.status!=='available')throw Error('fixture');
 const seeds=inventory.result.declarations.map(d=>{const {side,path,contentHash,start,end}=d.declaration;return {side,path,contentHash,start,end};});const compute:WorkerRequest={...request,phase:'compute',input:{...rich,seeds}};
 const envelope=structuredClone((await runAnalysisWorker(compute,observations().port)).envelope);if(envelope.phase!=='compute'||envelope.result.status!=='analyzed')throw Error('fixture');
 const changed=JSON.parse(JSON.stringify(envelope));for(const edge of changed.result.edges)for(const site of edge.sites)site.signatures=Array.from({length:2000},()=>edge.target);
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-worker-bounded-')),entryPath=join(root,'fixture.cjs');try{writeFileSync(entryPath,emit(changed));const start=Date.now();await assert.rejects(runAnalysisWorker(compute,observations().port,{entryPath}),/analysis_worker_/);assert.ok(Date.now()-start<5000);}finally{rmSync(root,{recursive:true,force:true});}
});
