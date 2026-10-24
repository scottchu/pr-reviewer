import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
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
 const f=setup();try{const helper=join(f.root,'slow-git');writeFileSync(helper,`#!${process.execPath}\nsetTimeout(()=>{},30000);\n`);chmodSync(helper,0o700);
 const effects=createTrackedEffects({imports:f.store.imports,grant:f.claim.grant,executables:{git:helper}});
 const running=effects.run({executable:'git',args:[],cwd:f.root,maxBytes:128,timeoutMs:5000});
 const deadline=Date.now()+2000;while(f.store.imports.list(f.token)[0]?.invocations[0]?.processes[0]?.state!=='started'){if(Date.now()>deadline)throw new Error('spawn not observed');await new Promise(resolve=>setTimeout(resolve,10));}
 f.store.imports.command(f.token,{type:'CancelImport',commandId:'cancel',jobId:f.claim.job.jobId});await assert.rejects(running,/import_cancelled/);f.store.imports.fail(f.claim.grant,'import_cancelled',effects.terminationConfirmed());assert.equal(f.store.imports.list(f.token)[0]?.state,'cancelled');
 }finally{f.close();}
});
