import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {createStore} from '../src/storage/public.ts';
import {buildSnapshot,verifyPreparedSnapshot} from '../src/source-preparation/public.ts';
import type {Snapshot,Principal,Command} from '../src/domain/public.ts';
const owner:Principal={kind:'user',actorId:'local-user'};
const spec={prNumber:21,prUrl:'https://github.com/scottchu/pr-reviewer/pull/21',baseSha:'bdce918b4ab0563d698d3fcf9c1df1e19c1be68f',paths:['src/ui/graph.tsx']};
const first=buildSnapshot({...spec,headSha:'501917502a67caa513a923523b40d2084e53074f'}),second=buildSnapshot({...spec,headSha:'3df0163aa7ee1e5a63ad09877b2785e9ba781641'}),third=buildSnapshot({...spec,headSha:'857fb072aaba095b9dadbfac4dcf11ff914eacdc'});
const ask=(id:string,snapshotId=first.snapshotId,parentQuestionId?:string):Extract<Command,{type:'AskQuestion'}>=>({type:'AskQuestion',commandId:id,reviewId:'r',text:'Question',anchor:{snapshotId,path:'src/ui/graph.tsx',side:'head',startLine:1,endLine:1},...(parentQuestionId?{parentQuestionId}:{})});
const admit=(store:ReturnType<typeof createStore>,principal:Principal,command:Extract<Command,{type:'AddSnapshot'}>)=>{
 let witness;try{witness=verifyPreparedSnapshot(command.reviewId,command.snapshot,command.identityScheme);}catch{}
 return store.command(principal,command,witness);
};
test('02B additive snapshots CAS, identity, hash rejection, no wake and historical reply/follow-up',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-history-')),store=createStore(join(root,'db'));
 try{
 store.prepare('r',first);const bootstrap=store.registerConnection(owner,{host:'codex',sessionId:'controlled',connectionId:'controlled',corroborated:true}),challenge=store.challenge(owner,'r','codex','controlled','controlled'),binding=store.attach(bootstrap.principal,challenge.challengeId,challenge.proof),agent=store.authenticate(binding.token);
 const q=store.command(owner,ask('q'));
 const add:Extract<Command,{type:'AddSnapshot'}>={type:'AddSnapshot',identityScheme:'manual_git_v1',commandId:'add',reviewId:'r',expectedCurrentSnapshotId:first.snapshotId,snapshot:second};
 const receipt=admit(store,owner,add);assert.equal(receipt.state,'applied');assert.deepEqual(admit(store,owner,add),receipt);assert.equal(store.review(owner,'r').currentSnapshotId,second.snapshotId);assert.equal(store.review(owner,'r',0,first.snapshotId).snapshot.snapshotId,first.snapshotId);assert.equal(store.review(owner,'r').inbox.length,1);
 assert.equal(admit(store,owner,{...add,commandId:'same-existing'}).state,'applied');assert.equal(store.review(owner,'r').currentSnapshotId,second.snapshotId);
 const beforeRetained=store.review(owner,'r').revision;assert.equal(store.command(owner,{...add,commandId:'old-retained-without-witness',snapshot:first}).state,'applied');assert.equal(store.review(owner,'r').currentSnapshotId,second.snapshotId);assert.equal(store.review(owner,'r').revision,beforeRetained);assert.equal(store.command(owner,{...add,commandId:'retained-id-conflict',snapshot:{...second,title:'Conflicting retained value'}}).error,'snapshot_conflict');
 assert.equal(admit(store,owner,{...add,commandId:'stale',snapshot:third}).error,'current_snapshot_conflict');
 assert.equal(admit(store,owner,{...add,commandId:'wrong-review',expectedCurrentSnapshotId:second.snapshotId,snapshot:{...third,repository:'other/repo',prUrl:'https://github.com/other/repo/pull/21'}}).error,'review_identity_conflict');
 assert.equal(admit(store,agent,{...add,commandId:'forbidden'}).error,'unauthorized');
 assert.equal(admit(store,owner,{...add,commandId:'tampered',expectedCurrentSnapshotId:second.snapshotId,snapshot:{...third,snapshotId:'tampered',sources:[{...second.sources[0]!,hash:'0'.repeat(64)}]}}).error,'source_unavailable');
 const reply:Command={type:'SubmitReply',commandId:'old-reply',reviewId:'r',questionId:String(q.result.questionId),generation:1,body:'Late source-backed answer',limitations:'Controlled',evidence:[ask('x').anchor]};assert.equal(store.command(agent,reply).state,'applied');assert.equal(store.command(agent,{...reply,commandId:'wrong-source',evidence:[ask('x',second.snapshotId).anchor]}).error,'invalid_anchor');
 assert.equal(store.command(owner,ask('follow',second.snapshotId,String(q.result.questionId))).state,'applied');assert.equal(store.review(owner,'r').questions[1]?.parentQuestionId,q.result.questionId);assert.equal(store.review(owner,'r').questions[0]?.anchor.snapshotId,first.snapshotId);
 assert.equal(store.command(owner,ask('bad-parent',second.snapshotId,'missing-parent')).error,'invalid_parent_question');
 assert.throws(()=>store.review(owner,'r',0,'missing'),/source_unavailable/);
 assert.equal(store.command(owner,{type:'RevokeAttachment',commandId:'revoke-history',reviewId:'r',attachmentId:binding.attachment.attachmentId}).state,'applied');assert.equal(store.command(agent,{...reply,commandId:'stale-old-reply'}).error,'stale_attachment');assert.throws(()=>store.review(agent,'r',0,first.snapshotId),/stale_attachment/);
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});
test('02B additive/idempotent migration of copied old aggregate preserves credentials, receipts and attempts',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-history-migration-')),original=join(root,'old.sqlite'),copy=join(root,'copy.sqlite');let store=createStore(original);
 try{
 store.prepare('r',first);const token=store.issueUser();const bootstrap=store.registerConnection(owner,{host:'codex',sessionId:'migration-controlled',connectionId:'migration-controlled',corroborated:true}),challenge=store.challenge(owner,'r','codex','migration-controlled','migration-controlled'),binding=store.attach(bootstrap.principal,challenge.challengeId,challenge.proof),agent=store.authenticate(binding.token),receipt=store.command(owner,ask('old-q'));const attempt=store.claim('r')!;store.finish('r',attempt.invocationId,'unknown','retained uncertainty');const inbox=store.inbox(agent);const retained=store.review(owner,'r');store.close();
 const db=new DatabaseSync(original);const row=db.prepare('SELECT body FROM reviews WHERE id=?').get('r') as {body:string};const body=JSON.parse(row.body);delete body.snapshots;delete body.currentSnapshotId;delete body.snapshotSummaries;db.prepare('UPDATE reviews SET body=? WHERE id=?').run(JSON.stringify(body),'r');db.close();copyFileSync(original,copy);
 store=createStore(copy);assert.equal(store.authenticate(token).actorId,'local-user');assert.deepEqual(store.authenticate(binding.token),agent);assert.deepEqual(store.command(owner,ask('old-q')),receipt);const migrated=store.review(owner,'r');assert.equal(migrated.currentSnapshotId,first.snapshotId);assert.equal(migrated.snapshotSummaries?.length,1);assert.deepEqual(migrated.attempts,retained.attempts);assert.deepEqual(migrated.inbox,retained.inbox);assert.deepEqual(migrated.attachment,retained.attachment);assert.equal(store.inbox(agent,inbox.nextCursor).items.length,0);assert.equal(store.claim('r'),null,'unknown claim must not launch again');store.close();store=createStore(copy);assert.deepEqual(store.command(owner,ask('old-q')),receipt);assert.equal(store.review(owner,'r').questions.length,1);
 const unchanged=new DatabaseSync(original);assert.equal(JSON.parse((unchanged.prepare('SELECT body FROM reviews WHERE id=?').get('r') as {body:string}).body).currentSnapshotId,undefined);unchanged.close();
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});

test('02B failed multi-review migration rolls back earlier aggregate conversion',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-history-rollback-')),path=join(root,'db');const store=createStore(path);store.prepare('valid',first);store.close();
 try{
 const db=new DatabaseSync(path);const raw=JSON.parse((db.prepare('SELECT body FROM reviews WHERE id=?').get('valid') as {body:string}).body);delete raw.snapshots;delete raw.currentSnapshotId;const legacy=JSON.stringify(raw);db.prepare('UPDATE reviews SET body=? WHERE id=?').run(legacy,'valid');db.prepare('INSERT INTO reviews VALUES (?,?)').run('invalid',JSON.stringify({...raw,reviewId:'invalid',snapshots:[],currentSnapshotId:first.snapshotId}));db.close();
 assert.throws(()=>createStore(path),/source_unavailable/);const read=new DatabaseSync(path);assert.equal((read.prepare('SELECT body FROM reviews WHERE id=?').get('valid') as {body:string}).body,legacy);read.close();
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('02B separate-process expected-current race admits exactly one snapshot',async()=>{
 const {spawn}=await import('node:child_process');const {writeFileSync}=await import('node:fs');const {resolve}=await import('node:path');const root=mkdtempSync(join(tmpdir(),'pr-reviewer-history-race-')),database=join(root,'review.sqlite');const store=createStore(database);store.prepare('r',first);store.close();
 try{
 const launch=(id:string,snapshot:Snapshot)=>new Promise<{state:string;error?:string}>( (resolveResult,reject)=>{
 const input=join(root,id+'.json');writeFileSync(input,JSON.stringify({type:'AddSnapshot',identityScheme:'manual_git_v1',commandId:id,reviewId:'r',expectedCurrentSnapshotId:first.snapshotId,snapshot}));
 const source=`import {createStore} from ${JSON.stringify(resolve('src/storage/public.ts'))};import{readFileSync}from'node:fs';const s=createStore(process.argv[1]);const command=JSON.parse(readFileSync(process.argv[2],'utf8'));const {verifyPreparedSnapshot}=await import(${JSON.stringify(resolve('src/source-preparation/public.ts'))});const r=s.command({kind:'user',actorId:'local-user'},command,verifyPreparedSnapshot(command.reviewId,command.snapshot,command.identityScheme));process.stdout.write(JSON.stringify(r));s.close();`;
 const child=spawn(process.execPath,['--experimental-strip-types','--input-type=module','-e',source,database,input],{stdio:['ignore','pipe','pipe']});let out='',err='';child.stdout.on('data',b=>out+=String(b));child.stderr.on('data',b=>err+=String(b));child.on('error',reject);child.on('exit',code=>code===0?resolveResult(JSON.parse(out)):reject(new Error(err)));
 });
 const results=await Promise.all([launch('one',second),launch('two',third)]);assert.equal(results.filter(result=>result.state==='applied').length,1);assert.equal(results.filter(result=>result.error==='current_snapshot_conflict').length,1);const read=createStore(database);assert.equal(read.review(owner,'r').snapshotSummaries?.length,2);read.close();
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('store startup hides its uncommitted epoch and failed recovery preserves the prior owner',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-startup-')),database=join(root,'review.sqlite'),store=createStore(database,{testOptions:{testOnlyExecution:true}});
 store.prepare('r',first);
 const scope={reviewId:'r',snapshotId:first.snapshotId};
 const receipt=store.tests.command(store.localOwner,{type:'RequestTest',commandId:'startup-test',...scope,targetId:'review-source-core-v1',expectedTargetRevision:2});
 const claimed=store.tests.claim(store.tests.beginOwner());assert.ok(claimed);
 const reader=new DatabaseSync(database,{readOnly:true});
 const epoch=()=> (reader.prepare('SELECT epoch FROM execution_owner WHERE id=1').get() as {epoch:string}).epoch;
 const retained=()=>({job:reader.prepare('SELECT body FROM test_jobs WHERE id=?').get(receipt.jobId),lease:reader.prepare('SELECT body FROM execution_lease WHERE id=1').get()});
 const beforeRecovery=retained();
 const prior=epoch(),prepare=DatabaseSync.prototype.prepare;let duringClaim:string|undefined;
 try{
  // Observe the competing connection exactly between epoch replacement and recovery.
  DatabaseSync.prototype.prepare=function(sql){
   const statement=prepare.call(this,sql);
   if(sql==='INSERT OR REPLACE INTO execution_owner VALUES (1,?)'){
    statement.run=new Proxy(statement.run,{apply:(run,receiver,parameters)=>{
     const result=Reflect.apply(run,receiver,parameters);duringClaim=epoch();return result;
    }});
   }
   return statement;
  };
  assert.throws(()=>createStore(database,{analysisLimits:{maxContextLaunches:0}}),/invalid_analysis_limit/);
  assert.equal(duringClaim,prior,'a competing reader must not observe a partially initialized owner');
  assert.equal(epoch(),prior,'failed initialization must roll back its execution claim');
  assert.equal(store.tests.targets(store.localOwner,{reviewId:'r',snapshotId:first.snapshotId}).snapshotId,first.snapshotId);
  assert.throws(()=>createStore(database,{storyLimits:{retainedBytes:-1}}),/invalid_request/);
  assert.equal(epoch(),prior,'failure after effect recovery must also roll back its claim');
  assert.deepEqual(retained(),beforeRecovery,'failed construction must restore the complete job journal and effect lease');
  assert.equal(store.tests.control(claimed.grant).authorized,true,'the existing owner grant remains current after rollback');
  assert.equal(store.tests.targets(store.localOwner,{reviewId:'r',snapshotId:first.snapshotId}).snapshotId,first.snapshotId);
 }finally{DatabaseSync.prototype.prepare=prepare;reader.close();store.close();rmSync(root,{recursive:true,force:true});}
});
