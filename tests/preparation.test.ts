import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {buildSnapshot,verifyPreparedSnapshot} from '../src/source-preparation/public.ts';
import type {PreparedSnapshotWitness} from '../src/source-preparation/public.ts';
import type {Snapshot,Command} from '../src/domain/public.ts';
import {createStore} from '../src/storage/public.ts';
const spec={prNumber:21,prUrl:'https://github.com/scottchu/pr-reviewer/pull/21',baseSha:'bdce918b4ab0563d698d3fcf9c1df1e19c1be68f',paths:['src/ui/graph.tsx']};
const old=buildSnapshot({...spec,headSha:'501917502a67caa513a923523b40d2084e53074f'}),next=buildSnapshot({...spec,headSha:'857fb072aaba095b9dadbfac4dcf11ff914eacdc'});
const owner={kind:'user' as const,actorId:'local-user'};
const command=(snapshot:Snapshot,id:string):Extract<Command,{type:'AddSnapshot'}>=>({type:'AddSnapshot',identityScheme:'manual_git_v1',commandId:id,reviewId:'r',expectedCurrentSnapshotId:old.snapshotId,snapshot});
const reversed=(value:unknown):unknown=>Array.isArray(value)?value.map(reversed):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reversed(item)])):value;
test('manual-v1 property-order permutation verifies the same immutable ID and a matching witness admits it',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-preparation-order-')),store=createStore(join(root,'db'));
 try{store.prepare('r',old);const permuted=reversed(next) as Snapshot,witness=verifyPreparedSnapshot('r',permuted,'manual_git_v1');assert.equal(store.command(owner,command(permuted,'permuted'),witness).state,'applied');assert.equal(store.review(owner,'r').snapshot.snapshotId,next.snapshotId);assert.equal(store.review(owner,'r',0,old.snapshotId).snapshot.snapshotId,old.snapshotId);}finally{store.close();rmSync(root,{recursive:true,force:true});}
});
test('raw flags, serialized/forged witnesses, other-review and mismatched-manifest witnesses cannot admit new source',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-preparation-witness-')),store=createStore(join(root,'db'));
 try{store.prepare('r',old);const valid=verifyPreparedSnapshot('r',next,'manual_git_v1'),other=verifyPreparedSnapshot('other',next,'manual_git_v1'),prior=verifyPreparedSnapshot('r',old,'manual_git_v1');
 for(const [id,witness] of [['raw',undefined],['flag',{verified:true,reviewId:'r'}],['serialized',JSON.parse(JSON.stringify(valid))],['other-review',other],['different-manifest',prior]] as const){const receipt=store.command(owner,command(next,id),witness as PreparedSnapshotWitness|undefined);assert.equal(receipt.error,'source_unavailable');assert.equal(store.review(owner,'r').currentSnapshotId,old.snapshotId);assert.deepEqual(store.command(owner,command(next,id),valid),receipt,'a new verification cannot rewrite an already rejected command receipt');}
 assert.equal(store.command(owner,command(next,'valid-witness'),valid).state,'applied');
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});
test('manual verifier rejects a tampered new ID and hash-consistent forged content against pinned Git',()=>{
 assert.throws(()=>verifyPreparedSnapshot('r',{...next,snapshotId:'0'.repeat(64)},'manual_git_v1'),/source_unavailable/);
 const source=next.sources[0]!,content='Forged but correctly hashed content\n',forged={...next,sources:[{...source,content,lineCount:1,hash:createHash('sha256').update(content).digest('hex')}]};
 assert.throws(()=>verifyPreparedSnapshot('r',forged,'manual_git_v1'),/source_unavailable/);
});
test('manual v1 preserves the actual pre-extraction PR14 legacy ID',()=>{
 const snapshot=buildSnapshot({prNumber:14,prUrl:'https://github.com/scottchu/pr-reviewer/pull/14',baseSha:'a6d63c1e46424cb979ee912aa993ad964835c287',headSha:'fd6c5fb26a325c8318087c0f058de247a55e6c07',path:'docs/README.md'});
 assert.equal(snapshot.snapshotId,'aefdff44d33f7202f2bbdce5483f3deac88de8d9c18a29efabbeaf4d3e753e47');assert.ok(verifyPreparedSnapshot('legacy',snapshot,'manual_git_v1'));
});
test('missing pinned Git blob cannot gain a verification witness even with a previously valid manifest',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-preparation-missing-')),previous=process.env.GIT_DIR;
 const git=(...args:string[])=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{git('init','-q');writeFileSync(join(root,'a.md'),'Before\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','base');const baseSha=git('rev-parse','HEAD');writeFileSync(join(root,'a.md'),'After\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','head');const headSha=git('rev-parse','HEAD'),object=git('rev-parse',`${headSha}:a.md`);process.env.GIT_DIR=join(root,'.git');const snapshot=buildSnapshot({prNumber:21,prUrl:spec.prUrl,baseSha,headSha,path:'a.md'});rmSync(join(root,'.git','objects',object.slice(0,2),object.slice(2)));assert.throws(()=>verifyPreparedSnapshot('r',snapshot,'manual_git_v1'),/source_unavailable/);
 }finally{if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;rmSync(root,{recursive:true,force:true});}
});
