import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {headTestFixture} from './head-test-fixture.ts';
import {createHeadBunRunner} from '../src/test-jobs/bun-process.ts';
const setup=async()=>{const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-bun-'));for(const name of ['empty','home','tmp','config','cache'])await mkdir(join(root,name));await writeFile(join(root,'empty-bunfig.toml'),'');return root;};
test('B02 direct qualified Bun version is journaled with isolated environment and no package script',async()=>{
 const f=headTestFixture({testOptions:{testOnlyExecution:true}}),root=await setup();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  const run=createHeadBunRunner({ownedRoot:root,deadline:Date.now()+10000,observer:{journal:()=>f.store.tests.journal(grant),control:()=>f.store.tests.control(grant),recordStop:reason=>f.store.tests.recordStop(grant,reason),recordProcess:(observation,witness)=>f.store.tests.recordProcess(grant,observation,witness)}});
  const result=await run('runtime_version');assert.equal(result.terminationConfirmed,true);assert.equal(result.exitCode,0);assert.equal(result.output.filter(x=>x.channel==='stdout').map(x=>x.text).join('').trim(),'1.4.2');
  assert.equal(f.store.tests.journal(grant).invocation.processes![0]!.role,'runtime_version');assert.equal(f.store.tests.journal(grant).invocation.processes![0]!.state,'exited');
  await assert.rejects(run('runtime_version'),/test_process_limit/);assert.equal(f.store.tests.journal(grant).invocation.processes!.length,1);
 }finally{f.cleanup();await rm(root,{recursive:true,force:true});}
});
test('B03 cancelled or expired Bun operation cannot create a process request',async()=>{
 const f=headTestFixture({testOptions:{testOnlyExecution:true}}),root=await setup();try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  const run=createHeadBunRunner({ownedRoot:root,deadline:Date.now()-1,observer:{journal:()=>f.store.tests.journal(grant),control:()=>f.store.tests.control(grant),recordStop:reason=>f.store.tests.recordStop(grant,reason),recordProcess:(observation,witness)=>f.store.tests.recordProcess(grant,observation,witness)}});
  await assert.rejects(run('runtime_version'),/test_deadline/);assert.equal(f.store.tests.journal(grant).invocation.processes!.length,0);
 }finally{f.cleanup();await rm(root,{recursive:true,force:true});}
});
