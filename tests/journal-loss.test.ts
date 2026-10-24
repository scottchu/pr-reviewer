import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,existsSync,chmodSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {semanticFixture,eventually} from './semantic-fixture.ts';
import {createAnalysisRunner,runAnalysisWorker} from '../src/analysis-jobs/public.ts';
import {createImportRunner,createOwnedAcquisitionEffects,groupExists} from '../src/import-jobs/public.ts';
const alive=(pid:number)=>{try{process.kill(pid,0);return true;}catch{return false;}};
const identity=(pid:number)=>{try{return execFileSync('/bin/ps',['-p',String(pid),'-o','lstart=','-o','pgid='],{encoding:'utf8',timeout:1000}).trim();}catch{return '';}};

for(const fault of ['started','exited'] as const)for(const mode of ['context','worker','import'] as const)test(`05E ${mode}: lost ${fault} write cannot release shared slot while an owned descendant lives`,{timeout:15000},async()=>{
 const f=semanticFixture(),marker=join(f.root,'descendant.json'),helper=join(f.root,mode==='worker'?'worker.cjs':'fixture-git');
 let runner:{idle:()=>Promise<void>;wake:()=>void;stop:()=>Promise<void>}|undefined,leader:number|undefined,descendant:number|undefined,leaderIdentity='',descendantIdentity='';
 const childCode=`process.on('SIGTERM',()=>{});require('node:fs').writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:process.pid,ppid:process.ppid}));setInterval(()=>{},1000);`;
 writeFileSync(helper,`${mode==='worker'?'':`#!${process.execPath}\n`}const {spawn}=require('node:child_process');spawn(process.execPath,['-e',${JSON.stringify(childCode)}],{stdio:'ignore'});${fault==='exited'?'setTimeout(()=>process.exit(0),250);':''}setInterval(()=>{},1000);\n`);chmodSync(helper,0o700);
 const inject=(observation:{state:string;executable:string;pid?:number})=>{
  if(mode==='worker'&&observation.executable!=='node')return;
  if(fault==='exited'&&observation.state==='exited')throw Error('injected_terminal_journal_failure');
  if(observation.state!=='started')return;
  leader=observation.pid;assert.ok(leader);leaderIdentity=identity(leader);
  const deadline=Date.now()+2500;while(!existsSync(marker)){if(Date.now()>deadline)throw Error('fixture_marker_timeout');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}
  const child=JSON.parse(readFileSync(marker,'utf8')) as {pid:number;ppid:number};assert.equal(child.ppid,leader);descendant=child.pid;descendantIdentity=identity(descendant);assert.ok(descendantIdentity&&alive(descendant));
  if(fault==='started')throw Error('injected_started_journal_failure');
 };
 try{
  if(mode==='import'){
   const record=f.store.imports.recordProcess;f.store.imports.recordProcess=(grant,observation)=>{inject(observation);record(grant,observation);};
   f.store.imports.command(f.token,{type:'RequestImport',commandId:'fault',path:f.root});
   runner=createImportRunner(f.store,{write:async()=>{throw Error('unexpected_artifact');},read:async()=>null},{effects:(grant,signal)=>createOwnedAcquisitionEffects({signal,executables:{git:helper},observations:{launchLimit:()=>f.store.imports.launchLimit(grant),cancelled:()=>f.store.imports.cancelled(grant),recordProcess:observation=>f.store.imports.recordProcess(grant,observation)}})});
  }else{
   const record=f.store.analysis.recordProcess;f.store.analysis.recordProcess=(grant,observation)=>{inject(observation);record(grant,observation);};f.store.analysis.command(f.token,f.request);
   runner=createAnalysisRunner(f.store,mode==='worker'?{worker:(request,observations,options)=>runAnalysisWorker(request,observations,{...options,entryPath:helper})}:{contextEffects:(grant,signal)=>createOwnedAcquisitionEffects({signal,executables:{git:helper},observations:{launchLimit:()=>f.store.analysis.launchLimit(grant),cancelled:()=>f.store.analysis.cancelled(grant),recordProcess:observation=>{assert.equal(observation.executable,'git');f.store.analysis.recordProcess(grant,{...observation,executable:'git'});}}})});
  }
  await runner.idle();assert.ok(descendant&&alive(descendant));
  const query=()=>mode==='import'?f.store.imports.list(f.token)[0]!:f.store.analysis.query(f.token,{reviewId:'r',snapshotId:f.snapshot.snapshotId}).jobs[0]!;
  assert.equal(query().state,'unknown');
  let claim:()=>unknown;
  if(mode==='import'){f.store.analysis.command(f.token,f.request);const owner=f.store.analysis.beginOwner();claim=()=>f.store.analysis.claim(owner);}
  else{f.store.imports.command(f.token,{type:'RequestImport',commandId:'competing',path:f.root});const owner=f.store.imports.beginOwner();claim=()=>f.store.imports.claim(owner);}
  assert.equal(claim(),null);runner.wake();await runner.idle();await new Promise(resolve=>setTimeout(resolve,240));await runner.idle();
  assert.ok(alive(descendant));assert.equal(query().state,'unknown','coordinator must not infer quiescence from exited without durable start');assert.equal(claim(),null,'live owned descendant must retain shared exclusion');
  assert.equal(query().invocations.at(-1)!.processes.at(-1)!.pid,leader,'terminal observation recovers the actual observed identity');
  assert.equal(identity(descendant),descendantIdentity);process.kill(descendant,'SIGKILL');await eventually(()=>!groupExists(leader!),2000);
  runner.wake();await runner.idle();assert.equal(query().state,'failed');assert.ok(claim(),'positive group absence permits unrelated work without replay');
 }finally{
  await runner?.stop();
  if(descendant&&alive(descendant)&&identity(descendant)===descendantIdentity)process.kill(descendant,'SIGKILL');
  if(leader&&alive(leader)&&identity(leader)===leaderIdentity){try{process.kill(-leader,'SIGKILL');}catch{}}
  await eventually(()=>!descendant||!alive(descendant),2000);f.cleanup();
 }
});

for(const kind of ['import','analysis'] as const)test(`05E ${kind}: ambiguous legacy journals cannot be cleared but empty and definitive pre-spawn cases can`,()=>{
 const scenarios=['empty','requested','legacy-exited','not-spawned','contradictory'] as const;
 for(const scenario of scenarios){
  const f=semanticFixture();try{
   type Observation={ordinal:number;executable:'git';state:'requested'|'started'|'exited';pid?:number;spawnDisposition?:'not_spawned'};
   const ports=(()=>{
    if(kind==='import'){f.store.imports.command(f.token,{type:'RequestImport',commandId:'case',path:f.root});const owner=f.store.imports.beginOwner(),claim=f.store.imports.claim(owner)!;return {record:(o:Observation)=>f.store.imports.recordProcess(claim.grant,o),fail:()=>f.store.imports.fail(claim.grant,'termination_unknown',false),confirm:()=>f.store.imports.confirmQuiescent(owner,claim.job.jobId),state:()=>f.store.imports.list(f.token)[0]!.state};}
    f.store.analysis.command(f.token,f.request);const owner=f.store.analysis.beginOwner(),claim=f.store.analysis.claim(owner)!;return {record:(o:Observation)=>f.store.analysis.recordProcess(claim.grant,o),fail:()=>f.store.analysis.fail(claim.grant,'termination_unknown',false),confirm:()=>f.store.analysis.confirmQuiescent(owner,claim.job.jobId),state:()=>f.store.analysis.query(f.token,{reviewId:'r',snapshotId:f.snapshot.snapshotId}).jobs[0]!.state};
   })();
   if(scenario!=='empty')ports.record({ordinal:1,executable:'git',state:'requested'});
   if(scenario==='contradictory')assert.throws(()=>ports.record({ordinal:1,executable:'git',state:'exited',pid:process.pid,spawnDisposition:'not_spawned'}),/invalid_.*observation/);
   if(scenario==='legacy-exited')ports.record({ordinal:1,executable:'git',state:'exited'});
   if(scenario==='not-spawned')ports.record({ordinal:1,executable:'git',state:'exited',spawnDisposition:'not_spawned'});
   ports.fail();assert.equal(ports.state(),'unknown');
   if(scenario==='empty'||scenario==='not-spawned'){ports.confirm();assert.equal(ports.state(),'failed');}
   else{assert.throws(ports.confirm,/process_unresolved/);assert.equal(ports.state(),'unknown');}
  }finally{f.cleanup();}
 }
});

test('05E actual acquisition pre-spawn failure is explicit; requested journal failure launches nothing',async()=>{
 const f=semanticFixture();try{
  const observations:import('../src/domain/public.ts').ProcessObservation[]=[];
  const effects=createOwnedAcquisitionEffects({executables:{git:join(f.root,'missing-executable')},observations:{launchLimit:()=>1,cancelled:()=>false,recordProcess:observation=>{observations.push(observation);}}});
  await effects.run({executable:'git',args:[],cwd:f.root,timeoutMs:1000,maxBytes:1024});
  assert.equal(observations.at(-1)!.spawnDisposition,'not_spawned');assert.equal(observations.at(-1)!.pid,undefined);assert.equal(effects.terminationConfirmed(),true);
  const marker=join(f.root,'must-not-exist'),helper=join(f.root,'must-not-run');writeFileSync(helper,`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'ran');`);chmodSync(helper,0o700);
  const blocked=createOwnedAcquisitionEffects({executables:{git:helper},observations:{launchLimit:()=>1,cancelled:()=>false,recordProcess:()=>{throw Error('requested_write_failure');}}});
  await assert.rejects(blocked.run({executable:'git',args:[],cwd:f.root,timeoutMs:1000,maxBytes:1024}),/requested_write_failure/);assert.equal(existsSync(marker),false);
 }finally{f.cleanup();}
});
