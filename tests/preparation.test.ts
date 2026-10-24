import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {buildSnapshot,verifyPreparedSnapshot} from '../src/source-preparation/public.ts';
import type {PreparedSnapshotWitness} from '../src/source-preparation/public.ts';
import type {Snapshot,Command} from '../src/domain/public.ts';
import {createStore} from '../src/storage/public.ts';
import {canonical,normalizeCommand,inlineDocumentLinks,resolveDocumentDestination,documentHeadingLine} from '../src/domain/public.ts';
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

test('documented manual-v1 source/identity vectors and persisted legacy retry fingerprint remain compatible',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-compatibility-vectors-')),previous=process.env.GIT_DIR;
 const env={...process.env,GIT_AUTHOR_NAME:'Compatibility',GIT_AUTHOR_EMAIL:'compatibility@example.invalid',GIT_COMMITTER_NAME:'Compatibility',GIT_COMMITTER_EMAIL:'compatibility@example.invalid',GIT_AUTHOR_DATE:'2020-01-01T00:00:00Z',GIT_COMMITTER_DATE:'2020-01-01T00:00:00Z'};
 const git=(...args:string[])=>execFileSync('git',['-C',root,'-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false',...args],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  git('init','-q');writeFileSync(join(root,'a.txt'),'A\r\n');writeFileSync(join(root,'b.md'),'# Before\n[missing](missing.md)\n');git('add','--','a.txt','b.md');git('commit','-qm','base');const baseSha=git('rev-parse','HEAD');writeFileSync(join(root,'a.txt'),'B\n');writeFileSync(join(root,'b.md'),'# After\n[missing](missing.md)\n');git('add','--','a.txt','b.md');git('commit','-qm','head');const headSha=git('rev-parse','HEAD');
  assert.equal(baseSha,'85c4cc5ef2b3ae02fe120ac19aca2815d86268d5');assert.equal(headSha,'54d0cd7ca8d89a01a6feb02709ecb8f2d3fff3b0');process.env.GIT_DIR=join(root,'.git');
  const input={prNumber:22,prUrl:'https://github.com/scottchu/pr-reviewer/pull/22',baseSha,headSha};const one=buildSnapshot({...input,path:'a.txt'}),multi=buildSnapshot({...input,paths:['b.md']});assert.equal(one.snapshotId,'3fe24971d42609a7e83ea4ad5c693f908b03ed543ef8d82d7b71ce98f6a98ccf');assert.deepEqual(one.sources.map(source=>[source.lineCount,source.hash]),[[1,'26ffd5886253906a36a7ea0f6e26056fc36472626cb4894bcb100a34dc69d1db'],[1,'c0cde77fa8fef97d476c10aad3d2d54fcc2f336140d073651c2dcccf1e379fd6']]);assert.equal(multi.snapshotId,'0605b48424ec56fe55f946dbcfbfc938b1cb3f15e40a012c96b3273336c223dd');assert.equal(multi.documentReferences?.length,2);assert.ok(multi.documentReferences?.every(reference=>reference.target===null&&reference.reason==='source_unavailable: pinned Git object cannot be read'));
  const command:Command={type:'AskQuestion',commandId:'compat-question-1',reviewId:'compat-review',anchor:{snapshotId:one.snapshotId,side:'head',path:'a.txt',startLine:1,endLine:1},text:'  Why?\n'};
  const fingerprint='19993f0600c97b6769933cf3aa4093913b35438db52c8cff4db6750c0119db6e';assert.equal(createHash('sha256').update(canonical(normalizeCommand(command)),'utf8').digest('hex'),fingerprint);
  const path=join(root,'legacy.sqlite'),store=createStore(path);store.prepare('compat-review',one);store.close();const db=new DatabaseSync(path);const row=JSON.parse((db.prepare('SELECT body FROM reviews').get() as {body:string}).body);delete row.snapshots;delete row.currentSnapshotId;row.revision=2;row.questions=[{questionId:'legacy-question',anchor:command.anchor,text:'Why?',actorId:'local-user',revision:2,createdAt:'2020-01-01T00:00:00.000Z',working:false}];db.prepare('UPDATE reviews SET body=?').run(JSON.stringify(row));const receipt={commandId:command.commandId,actorId:'local-user',state:'applied',revision:2,cursor:2,result:{questionId:'legacy-question'}};db.prepare('INSERT INTO receipts VALUES (?,?,?,?)').run(command.commandId,'local-user',fingerprint,JSON.stringify(receipt));db.close();
  const migrated=createStore(path);try{assert.deepEqual(migrated.command(owner,reversed({...command,text:'Why?'}) as Command),receipt);assert.equal(migrated.review(owner,'compat-review').questions.length,1);assert.equal(migrated.command(owner,{...command,text:'Changed'}).error,'command_conflict');}finally{migrated.close();}
 }finally{if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;rmSync(root,{recursive:true,force:true});}
});

test('documented manual Markdown identity vectors preserve heading, duplicate, start and unsupported-form conventions',()=>{
 const target='# Intro\n# Topic\n# Topic\n';
 const link=inlineDocumentLinks('one\ntwo\nthree\n[go](b.md#topic)\n');assert.deepEqual(link,[{destination:'b.md#topic',line:4}]);const resolved=resolveDocumentDestination('docs/a.md',link[0]!.destination);assert.deepEqual(resolved,{path:'docs/b.md',fragment:'topic'});assert.equal(documentHeadingLine(target,resolved.fragment),2);
 for(const destination of ['b.md','b.md#'])assert.equal(documentHeadingLine(target,resolveDocumentDestination('docs/a.md',destination).fragment),1);
 for(const fragment of ['topic-1','Topic'])assert.throws(()=>documentHeadingLine(target,fragment),/heading fragment unresolved/);
 assert.deepEqual(inlineDocumentLinks('[go][topic]\n<a href="b.md">go</a>\n![go](b.md)\n'),[]);assert.equal(documentHeadingLine('# Foo  Bar!\n','foo--bar'),1);assert.throws(()=>documentHeadingLine('# Foo  Bar!\n','foo-bar'),/heading fragment unresolved/);
});
