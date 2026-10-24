import {test} from 'node:test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStore} from '../src/storage/public.ts';
import {createTrackedEffects} from '../src/import-jobs/public.ts';
const setup=()=>{const root=mkdtempSync(join(tmpdir(),'pr-reviewer-import-process-'));const store=createStore(join(root,'db')),token=store.issueUser();store.imports.command(token,{type:'RequestImport',commandId:'request',path:root});const owner=store.imports.beginOwner(),claim=store.imports.claim(owner)!;return {root,store,token,owner,claim,close:()=>{store.close();rmSync(root,{recursive:true,force:true});}};};
test('real child request/start/exit are durable and output is bounded without persisting argv or stderr',async()=>{
 const f=setup();try{const effects=createTrackedEffects({imports:f.store.imports,grant:f.claim.grant});const result=await effects.run({executable:'git',args:['--version'],cwd:f.root,maxBytes:128,timeoutMs:1000});assert.equal(result.kind,'ok');const job=f.store.imports.list(f.token)[0]!;assert.equal(job.invocations[0]?.processes[0]?.state,'exited');assert.ok(job.invocations[0]?.processes[0]?.pid);assert.equal(JSON.stringify(job).includes('--version'),false);
 const bounded=await effects.run({executable:'git',args:['--version'],cwd:f.root,maxBytes:1,timeoutMs:1000});assert.equal(bounded.kind,'unavailable');if(bounded.kind==='unavailable')assert.equal(bounded.reason,'output_limit');
 }finally{f.close();}
});
test('cancel during an actually observed owned child confirms termination and does not kill an unrelated child',async()=>{
 const f=setup(),unrelated=spawn(process.execPath,['-e','setTimeout(()=>{},30000)'],{stdio:'ignore'});try{const helper=join(f.root,'slow-git');writeFileSync(helper,`#!${process.execPath}\nsetTimeout(()=>{},30000);\n`);chmodSync(helper,0o700);
 const effects=createTrackedEffects({imports:f.store.imports,grant:f.claim.grant,executables:{git:helper}});
 const running=effects.run({executable:'git',args:[],cwd:f.root,maxBytes:128,timeoutMs:5000});
 const deadline=Date.now()+2000;while(f.store.imports.list(f.token)[0]?.invocations[0]?.processes[0]?.state!=='started'){if(Date.now()>deadline)throw new Error('spawn not observed');await new Promise(resolve=>setTimeout(resolve,10));}
 f.store.imports.command(f.token,{type:'CancelImport',commandId:'cancel',jobId:f.claim.job.jobId});await assert.rejects(running,/import_cancelled/);f.store.imports.fail(f.claim.grant,'import_cancelled',effects.terminationConfirmed());assert.equal(f.store.imports.list(f.token)[0]?.state,'cancelled');assert.doesNotThrow(()=>process.kill(unrelated.pid!,0));
 }finally{unrelated.kill('SIGKILL');await new Promise<void>(resolve=>unrelated.once('close',()=>resolve()));f.close();}
});

test('runner stop and idle retain the active real process promise across ordinary scheduling ticks',async()=>{
 const {createImportRunner}=await import('../src/import-jobs/public.ts');
 const f=setup();try{
 // setup claimed an invocation; finish it, then queue fresh work for the runner.
 f.store.imports.finishDiscovery(f.claim.grant,{kind:'none',canonicalWorktree:null,candidates:[]});
 f.store.imports.command(f.token,{type:'RequestImport',commandId:'for-runner',path:f.root});
 const helper=join(f.root,'slow-owned-git');writeFileSync(helper,`#!${process.execPath}\nsetTimeout(()=>{},30000);\n`);chmodSync(helper,0o700);
 const runner=createImportRunner(f.store,{write:async()=>{throw new Error('not used');},read:async()=>null},{effects:(grant,signal)=>createTrackedEffects({imports:f.store.imports,grant,signal,executables:{git:helper}})});
 const deadline=Date.now()+2000;let pid:number|undefined;while(!pid){pid=f.store.imports.list(f.token).at(-1)?.invocations[0]?.processes[0]?.pid;if(Date.now()>deadline)throw new Error('spawn not observed');await new Promise(resolve=>setTimeout(resolve,10));}
 await new Promise(resolve=>setTimeout(resolve,300));await runner.stop();
 const observation=f.store.imports.list(f.token).at(-1)?.invocations[0]?.processes[0];assert.equal(observation?.state,'exited');assert.throws(()=>globalThis.process.kill(-pid!,0));assert.notEqual(f.store.imports.list(f.token).at(-1)?.state,'discovering');
 }finally{f.close();}
});

test('an exited leader never releases an unknown effects slot while its actual same-group descendant lives',async()=>{
 const {createImportRunner}=await import('../src/import-jobs/public.ts');const f=setup();let descendant:number|undefined;
 try{f.store.imports.finishDiscovery(f.claim.grant,{kind:'none',canonicalWorktree:null,candidates:[]});f.store.imports.command(f.token,{type:'RequestImport',commandId:'leader',path:f.root});f.store.imports.command(f.token,{type:'RequestImport',commandId:'next',path:'/next'});
 const helper=join(f.root,'leader-git'),pidFile=join(f.root,'descendant.pid');writeFileSync(helper,`#!${process.execPath}\nconst {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');const child=spawn(process.execPath,['-e','setTimeout(()=>{},30000)'],{stdio:'ignore'});writeFileSync(${JSON.stringify(pidFile)},String(child.pid));child.unref();setTimeout(()=>process.exit(0),120);\n`);chmodSync(helper,0o700);
 const runner=createImportRunner(f.store,{write:async()=>{throw new Error('unused');},read:async()=>null},{effects:(grant,signal)=>createTrackedEffects({imports:f.store.imports,grant,signal,executables:{git:helper}})});
 try{await runner.idle();descendant=Number(readFileSync(pidFile,'utf8'));assert.equal(f.store.imports.list(f.token)[1]?.state,'unknown');await new Promise(resolve=>setTimeout(resolve,450));assert.equal(f.store.imports.list(f.token)[1]?.state,'unknown');assert.equal(f.store.imports.list(f.token)[2]?.state,'queued');assert.doesNotThrow(()=>process.kill(descendant!,0));}finally{await runner.stop();}
 }finally{if(!descendant&&existsSync(join(f.root,'descendant.pid')))descendant=Number(readFileSync(join(f.root,'descendant.pid'),'utf8'));if(descendant)try{process.kill(descendant,'SIGKILL');}catch{}f.close();}
});

test('leader exit with inherited pipes and TERM-resistant descendant settles as bounded unknown without unsafe group escalation',async()=>{
 const f=setup();let descendant:number|undefined,running:Promise<unknown>|undefined;
 try{const helper=join(f.root,'inherited-pipes-git'),pidFile=join(f.root,'pipe-descendant.pid');writeFileSync(helper,`#!${process.execPath}\nconst {spawn}=require('node:child_process');const {writeFileSync}=require('node:fs');const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setTimeout(()=>{},30000)"],{stdio:'inherit'});writeFileSync(${JSON.stringify(pidFile)},String(child.pid));process.on('SIGTERM',()=>process.exit(0));setTimeout(()=>{},30000);\n`);chmodSync(helper,0o700);
 const effects=createTrackedEffects({imports:f.store.imports,grant:f.claim.grant,executables:{git:helper}});running=effects.run({executable:'git',args:[],cwd:f.root,maxBytes:128,timeoutMs:400});
 let deadline:ReturnType<typeof setTimeout>|undefined;try{await assert.rejects(Promise.race([running,new Promise((_resolve,reject)=>{deadline=setTimeout(()=>reject(new Error('termination did not settle within bounded observation window')),1800);})]),/termination_unknown/);}finally{if(deadline)clearTimeout(deadline);}
 descendant=Number(readFileSync(pidFile,'utf8'));assert.equal(effects.terminationConfirmed(),false);assert.doesNotThrow(()=>process.kill(descendant!,0));f.store.imports.fail(f.claim.grant,'termination_unknown',false);assert.equal(f.store.imports.list(f.token)[0]?.state,'unknown');assert.equal(f.store.imports.claim(f.owner),null);
 }finally{if(!descendant&&existsSync(join(f.root,'pipe-descendant.pid')))descendant=Number(readFileSync(join(f.root,'pipe-descendant.pid'),'utf8'));if(descendant)try{process.kill(descendant,'SIGKILL');}catch{}await running?.catch(()=>{});f.close();}
});
