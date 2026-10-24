import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {headTestFixture} from './head-test-fixture.ts';
import {createHeadGitReader,materializeHeadTestSource} from '../src/test-jobs/public.ts';
const looseObject=async(repo:string,kind:string,body:Buffer)=>{
 const raw=Buffer.concat([Buffer.from(`${kind} ${body.length}\0`),body]),oid=createHash('sha1').update(raw).digest('hex'),dir=join(repo,'.git/objects',oid.slice(0,2));await mkdir(dir,{recursive:true});await writeFile(join(dir,oid.slice(2)),deflateSync(raw));return oid;
};
const prepare=async()=>{
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-git-')),repo=join(root,'repo');await mkdir(join(repo,'.git/objects'),{recursive:true});await mkdir(join(repo,'.git/refs'));await writeFile(join(repo,'.git/HEAD'),'ref: refs/heads/fixture\n');
 for(const name of ['empty','home','tmp','config','cache'])await mkdir(join(root,name));
 const blob=await looseObject(repo,'blob',Buffer.alloc(2500000,65));const tree=await looseObject(repo,'tree',Buffer.concat([Buffer.from('100644 large.ts\0'),Buffer.from(blob,'hex')]));const head=await looseObject(repo,'commit',Buffer.from(`tree ${tree}\nauthor Fixture <fixture@example.invalid> 0 +0000\ncommitter Fixture <fixture@example.invalid> 0 +0000\n\nfixture\n`));
 return {root,repo,head};
};
test('B02 actual fixed protected Git reads consume binary stdin/stdout with durable journals',async()=>{
 const f=headTestFixture({testOptions:{testOnlyExecution:true}}),fixture=await prepare();
 try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  const read=createHeadGitReader({repository:fixture.repo,headSha:fixture.head,ownedRoot:fixture.root,observer:{journal:()=>f.store.tests.journal(grant),control:()=>f.store.tests.control(grant),recordStop:reason=>f.store.tests.recordStop(grant,reason),recordProcess:(observation,witness)=>f.store.tests.recordProcess(grant,observation,witness)}});
  const source=await materializeHeadTestSource({headSha:fixture.head,destination:join(fixture.root,'source'),read,check:()=>{}});
  assert.equal(source.manifest.headSha,fixture.head);assert.equal(source.manifest.entries.length,1);assert.equal(source.manifest.entries[0]!.bytes,2500000);
  const journal=f.store.tests.journal(grant);assert.equal(journal.invocation.processes!.length,4);assert.ok(journal.invocation.processes!.every(p=>p.state==='exited'&&p.pid&&p.exitCode===0));assert.ok(journal.invocation.processes![3]!.inputBytes>0);
 }finally{f.cleanup();await rm(fixture.root,{recursive:true,force:true});}
});
test('B03 lost start journal poisons the Git adapter and repeats actual PID on terminal observation',async()=>{
 const f=headTestFixture({testOptions:{testOnlyExecution:true}}),fixture=await prepare();
 try{
  f.store.tests.command(f.token,f.request);const owner=f.store.tests.beginOwner(),{grant}=f.store.tests.claim(owner)!;
  const read=createHeadGitReader({repository:fixture.repo,headSha:fixture.head,ownedRoot:fixture.root,observer:{journal:()=>f.store.tests.journal(grant),control:()=>f.store.tests.control(grant),recordStop:reason=>f.store.tests.recordStop(grant,reason),recordProcess:(observation,witness)=>{if(observation.state==='started')throw new Error('controlled_start_write_failure');return f.store.tests.recordProcess(grant,observation,witness);}}});
  const run=async()=>{for await(const _ of await read({role:'commit',objectId:fixture.head})){};};
  await assert.rejects(run(),/termination_unknown/);const journal=f.store.tests.journal(grant);assert.equal(journal.invocation.processes!.length,1);assert.equal(journal.invocation.processes![0]!.state,'exited');assert.ok(journal.invocation.processes![0]!.pid);
  await assert.rejects(run(),/test_process_poisoned/);assert.equal(f.store.tests.journal(grant).invocation.processes!.length,1);
 }finally{f.cleanup();await rm(fixture.root,{recursive:true,force:true});}
});
