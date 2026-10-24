import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {acquirePreparedSnapshot,isPreparedSnapshotWitness,validateProviderSnapshot} from '../src/source-preparation/public.ts';
import {createNodeEffects} from '../src/source-acquisition/public.ts';
import type {Candidate,AcquisitionEffects} from '../src/source-acquisition/public.ts';
import {createStore} from '../src/storage/public.ts';
import {snapshotSchema,canonical} from '../src/domain/public.ts';
const fixture=()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-provider-preparation-'));
 const env={...process.env,GIT_AUTHOR_NAME:'Compatibility',GIT_AUTHOR_EMAIL:'compatibility@example.invalid',GIT_COMMITTER_NAME:'Compatibility',GIT_COMMITTER_EMAIL:'compatibility@example.invalid',GIT_AUTHOR_DATE:'2020-01-01T00:00:00Z',GIT_COMMITTER_DATE:'2020-01-01T00:00:00Z'};
 const git=(...args:string[])=>execFileSync('git',['-C',root,'-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false',...args],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q');writeFileSync(join(root,'a'),'original\n'.repeat(10));git('add','.');git('commit','-qm','base');const baseSha=git('rev-parse','HEAD');
 writeFileSync(join(root,'a'),'changed\n'+'original\n'.repeat(9));writeFileSync(join(root,'b'),'original\n'.repeat(10));writeFileSync(join(root,'empty'),'');writeFileSync(join(root,'binary'),Buffer.from([0,1]));git('add','.');git('commit','-qm','head');const headSha=git('rev-parse','HEAD');
 const candidate:Candidate={provider:'github',host:'github.com',sourceProject:'team/repo',targetProject:'team/repo',number:1,url:'https://github.com/team/repo/pull/1',title:'Copy and edit',state:'open',sourceBranch:'feature',targetBranch:'main',baseSha,headSha,targetTipSha:baseSha,baselineMethod:'github_compare_merge_base'};
 const native=createNodeEffects();const effects:AcquisitionEffects={run:async command=>command.executable==='git'?native.run(command):{kind:'ok',stdout:Buffer.from(JSON.stringify(command.args.at(-1)?.includes('/compare/')?{merge_base_commit:{sha:baseSha}}:{number:1,html_url:candidate.url,title:candidate.title,state:'open',head:{ref:'feature',sha:headSha,repo:{full_name:'team/repo'}},base:{ref:'main',sha:baseSha,repo:{full_name:'team/repo'}}}))}};
 return {root,candidate,effects};
};
test('trusted provider preparation preserves copy occurrences, empty text and complete unsupported ledger with a job-bound witness',async()=>{
 const f=fixture();try{
 const prepared=await acquirePreparedSnapshot({jobId:'job',reviewId:'review',worktree:f.root,candidate:f.candidate},f.effects);
 assert.equal(prepared.kind,'prepared');if(prepared.kind!=='prepared')return;
 const {snapshot,witness}=prepared;assert.equal(snapshotSchema.safeParse(snapshot).success,true);
 assert.equal(snapshot.sources.filter(source=>source.side==='base'&&source.path==='a').length,2);
 assert.equal(snapshot.counts?.preparedSides,5);assert.equal(snapshot.sources.find(source=>source.path==='empty')?.lineCount,0);
 assert.equal(snapshot.changedFiles?.length,4);assert.equal(snapshot.changedFiles?.find(file=>file.newPath==='binary')?.dispositions[0]?.state,'unsupported');
 assert.ok(isPreparedSnapshotWitness(witness,'review',snapshot,'job'));assert.equal(isPreparedSnapshotWitness(witness,'review',snapshot,'other'),false);assert.equal(isPreparedSnapshotWitness(JSON.parse(JSON.stringify(witness)),'review',snapshot,'job'),false);
 assert.doesNotThrow(()=>validateProviderSnapshot(snapshot));
 const forged=structuredClone(snapshot);forged.sources[2]={...forged.sources[2]!,content:'conflict\n'};assert.throws(()=>validateProviderSnapshot(forged),/source_unavailable/);
 const permuted=JSON.parse(JSON.stringify(snapshot,(_key,value:unknown)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).reverse()):value));assert.equal(canonical(permuted),canonical(snapshot));assert.ok(isPreparedSnapshotWitness(witness,'review',permuted,'job'));
 assert.equal(f.candidate.baseSha,'4fedc8abc9e31d2943b08adaaa3b519b575038f7');assert.equal(f.candidate.headSha,'0f3dee9f23ccb67a1692e8fb5502af1fde42ea61');assert.equal(snapshot.snapshotId,'f83c2d2727683f93ac10768b28b9f3791163d21da53774136fca55ac71e90dbb');
 }finally{rmSync(f.root,{recursive:true,force:true});}
});

test('provider creation commits source, job and receipt atomically; raw witnesses and concurrent identity collision retain existing history',async()=>{
 const f=fixture(),store=createStore(join(f.root,'review.sqlite'));try{
 const token=store.issueUser(),owner=store.imports.beginOwner();
 const request=(id:string)=>{const receipt=store.imports.command(token,{type:'RequestImport',commandId:id,path:f.root});const discovery=store.imports.claim(owner)!;store.imports.finishDiscovery(discovery.grant,{kind:'unique',canonicalWorktree:f.root,candidates:[f.candidate]});const acquisition=store.imports.claim(owner)!;return {receipt,acquisition};};
 const first=request('first');const job=first.acquisition.job;const prepared=await acquirePreparedSnapshot({jobId:job.jobId,reviewId:job.reviewId,worktree:f.root,candidate:f.candidate},f.effects);assert.equal(prepared.kind,'prepared');if(prepared.kind!=='prepared')return;
 store.imports.finishResult(first.acquisition.grant,{schema:'import-result-v1',artifactId:'a',jobId:job.jobId,invocationId:job.invocations.at(-1)!.invocationId,digest:'0'.repeat(64),bytes:1});
 const rejected=store.imports.admit(owner,job.jobId,prepared.snapshot,{} as never);assert.equal(rejected.error,'source_unavailable');assert.equal(store.list(store.authenticate(token)).length,0);
 store.imports.command(token,{type:'AdmitImportResult',commandId:'retry-verified',jobId:job.jobId});
 // Explicit target change needs a newly bound witness; the previous review identity cannot be reused.
 assert.equal(store.imports.admit(owner,job.jobId,prepared.snapshot,prepared.witness).error,'source_unavailable');
 store.imports.command(token,{type:'AdmitImportResult',commandId:'retry-again',jobId:job.jobId});const current=store.imports.ready(owner)[0]!;
 const verified=await acquirePreparedSnapshot({jobId:job.jobId,reviewId:current.reviewId,worktree:f.root,candidate:f.candidate},f.effects);if(verified.kind!=='prepared')throw new Error('fixture');
 const receipt=store.imports.admit(owner,job.jobId,verified.snapshot,verified.witness);assert.equal(receipt.state,'applied');assert.deepEqual(store.imports.admit(owner,job.jobId,verified.snapshot,verified.witness),receipt);
 const review=store.review(store.authenticate(token),current.reviewId);assert.equal(review.snapshot.snapshotId,prepared.snapshot.snapshotId);assert.equal(review.revision,1);assert.equal(store.imports.list(token)[0]?.state,'admitted');
 // A later import of the same stable provider identity requires an explicit existing-review choice.
 store.imports.command(token,{type:'RequestImport',commandId:'second',path:f.root});const second=store.imports.claim(owner)!;store.imports.finishDiscovery(second.grant,{kind:'unique',canonicalWorktree:f.root,candidates:[f.candidate]});assert.equal(store.imports.list(token)[1]?.state,'choosing');assert.equal(store.imports.claim(owner),null);
 const choosing=store.imports.list(token)[1]!;assert.equal(store.imports.command(token,{type:'ChooseImportCandidate',commandId:'wrong-revision',jobId:choosing.jobId,discoveryRevision:choosing.discoveryRevision-1,candidateIndex:0}).error,'stale_import_choice');
 assert.equal(store.imports.command(token,{type:'ChooseImportCandidate',commandId:'explicit-continuation',jobId:choosing.jobId,discoveryRevision:choosing.discoveryRevision,candidateIndex:0,target:{reviewId:current.reviewId,expectedCurrentSnapshotId:review.snapshot.snapshotId}}).state,'applied');
 const again=store.imports.claim(owner)!;const retained=await acquirePreparedSnapshot({jobId:again.job.jobId,reviewId:current.reviewId,worktree:f.root,candidate:f.candidate},f.effects);if(retained.kind!=='prepared')throw new Error('fixture');
 store.imports.finishResult(again.grant,{schema:'import-result-v1',artifactId:'b',jobId:again.job.jobId,invocationId:again.job.invocations.at(-1)!.invocationId,digest:'1'.repeat(64),bytes:1});assert.equal(store.imports.admit(owner,again.job.jobId,retained.snapshot,retained.witness).result.alreadyRetained,true);assert.equal(store.review(store.authenticate(token),current.reviewId).revision,1);
 }finally{store.close();rmSync(f.root,{recursive:true,force:true});}
});
