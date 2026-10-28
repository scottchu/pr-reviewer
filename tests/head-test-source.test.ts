import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {materializeHeadTestSource} from '../src/test-jobs/public.ts';
import type {HeadGitRead} from '../src/test-jobs/public.ts';
const object=(kind:string,body:Buffer)=>createHash('sha1').update(`${kind} ${body.length}\0`).update(body).digest('hex');
const fixture=(path='tests/large.test.ts',body=Buffer.alloc(2500000,65))=>{
 const oid=object('blob',body),tree=Buffer.concat([Buffer.from(`100644 ${path}\0`),Buffer.from(oid,'hex')]),treeId=object('tree',tree),commit=Buffer.from(`tree ${treeId}\nauthor Fixture <fixture@example.invalid> 0 +0000\ncommitter Fixture <fixture@example.invalid> 0 +0000\n\nfixture\n`),head=object('commit',commit);
 const listing=Buffer.from(`100644 blob ${oid} ${body.length}\t${path}\0`),batch=Buffer.concat([Buffer.from(`${oid} blob ${body.length}\n`),body,Buffer.from('\n')]);
 const calls:string[]=[];
 const read:HeadGitRead=async request=>{calls.push(request.role);const data=request.role==='commit'?commit:request.role==='tree'?tree:request.role==='listing'?listing:batch;return (async function*(){for(let n=0;n<data.length;n+=65536)yield data.subarray(n,n+65536);})();};
 return {head,read,calls,body,batch};
};
test('B02 complete source decoder accepts multi-MiB binary batch separately from diagnostic budget',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-source-'));try{const f=fixture();const result=await materializeHeadTestSource({headSha:f.head,destination:join(root,'source'),read:f.read,check:()=>{}});assert.deepEqual(f.calls,['commit','tree','listing','batch']);assert.equal(result.manifest.entries.length,1);assert.equal(result.manifest.entries[0]!.bytes,2500000);assert.deepEqual(await readFile(join(root,'source/tests/large.test.ts')),f.body);assert.equal(result.sourceManifestId.length,64);}finally{await rm(root,{recursive:true,force:true});}
});
test('B02 rejects traversal/config paths and corrupt binary framing without accepting a source manifest',async()=>{
 for(const path of ['../escape','.git/config','node_modules/injected.ts','.env.local','bunfig.toml']){
  const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-source-'));try{const f=fixture(path,Buffer.from('x'));await assert.rejects(materializeHeadTestSource({headSha:f.head,destination:join(root,'source'),read:f.read,check:()=>{}}),/source_path_unavailable/);}finally{await rm(root,{recursive:true,force:true});}
 }
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-source-'));try{const f=fixture('ok.ts',Buffer.from('x'));const read:HeadGitRead=async request=>request.role==='batch'?(async function*(){yield Buffer.concat([f.batch,Buffer.from('trailing')]);})():f.read(request);await assert.rejects(materializeHeadTestSource({headSha:f.head,destination:join(root,'source'),read,check:()=>{}}),/source_batch_invalid/);}finally{await rm(root,{recursive:true,force:true});}
});
