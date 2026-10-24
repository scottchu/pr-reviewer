import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {storyCommandSchema,validateStoryStructure,graphFiles} from '../src/domain/public.ts';
import type {StoryContent,StoryReceipt} from '../src/domain/public.ts';
import {storyFixture} from './story-fixture.ts';
const maximum=(f:ReturnType<typeof storyFixture>):StoryContent=>{
 const claims=Array.from({length:128},(_,index)=>({id:`claim-${index}`,text:'x'.repeat(1200),basis:'unknown' as const,references:[],uncertainty:'The owner has not supplied the basis.'}));
 const steps=Array.from({length:32},(_,index)=>({id:`step-${index}`,headline:'Read explicit unknown',claimIds:claims.slice(index*4,index*4+4).map(claim=>claim.id),focus:{type:'none' as const}}));
 const chapters=Array.from({length:8},(_,index)=>({id:`chapter-${index}`,title:'Responsibility',why:'claim-0',what:'claim-1',how:'claim-2',example:{scenarioKind:'illustrative' as const,input:'claim-0',before:'claim-1',after:'claim-2'},stepIds:steps.slice(index*4,index*4+4).map(step=>step.id)}));
 return {...f.story,claims,steps,chapters,scope:[{type:'unexplained',fileKey:f.fileKey,reason:'The account explicitly leaves this file unexplained.'}]};
};
test('S06 exact chapter/step/claim maxima pass; one-over each and 8-reference steps reject',()=>{const f=storyFixture();try{
 const story=maximum(f);assert.doesNotThrow(()=>validateStoryStructure(story,f.snapshot));assert.equal(f.store.story.command(f.token,f.publish({story})).state,'applied');
 for(const changed of [{...story,chapters:[...story.chapters,story.chapters[0]!]},{...story,steps:[...story.steps,story.steps[0]!]},{...story,claims:[...story.claims,story.claims[0]!]}])assert.equal(storyCommandSchema.safeParse(f.publish({story:changed})).success,false);
 const many={...f.story,claims:f.story.claims.map(claim=>claim.id==='what'?{...claim,references:Array.from({length:9},()=>f.source)}:claim)};assert.equal(storyCommandSchema.safeParse(f.publish({story:many})).success,false);
}finally{f.cleanup();}});
test('S06 capture UTF-8 8KiB and 16 selections pass; one-over and unsafe URLs reject without changing context',()=>{const f=storyFixture();try{
 const create=(index:number,text='x',originUrl?:string)=>({type:'PutStoryContext' as const,commandId:`context-${index}`,reviewId:'r',snapshotId:'snapshot',expectedContextRevision:index,action:{type:'create' as const,capture:{kind:'PR' as const,title:'Supplied text',text,...(originUrl?{originUrl}:{})}}});
 assert.equal(f.store.story.command(f.token,create(0,'😀'.repeat(2048))).state,'applied');
 assert.throws(()=>f.store.story.command(f.token,create(1,'😀'.repeat(2048)+'x')),/invalid_request/);
 for(const url of ['javascript:alert(1)','https://owner:password@example.invalid/'])assert.throws(()=>f.store.story.command(f.token,create(1,'text',url)),/invalid_request/);
 for(let index=1;index<16;index++)assert.equal(f.store.story.command(f.token,create(index)).state,'applied');
 assert.equal(f.store.story.command(f.token,create(16)).error,'invalid_request');
 const view=f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot'});assert.equal(view.captures.length,16);assert.equal(view.currentContextRevision,16);
}finally{f.cleanup();}});
test('S06 complete encoded story 256KiB passes and one byte above rejects atomically',()=>{const f=storyFixture();try{
 const snapshot={...f.snapshot,snapshotId:'wide',changedFiles:Array.from({length:256},(_,index)=>({status:'added' as const,oldPath:null,newPath:`unsupported-${index}.bin`,coverage:'unsupported' as const,dispositions:[]}))};f.store.prepare('wide',snapshot);
 let story=maximum(f);story={...story,scope:graphFiles(snapshot).map(file=>({type:'unexplained' as const,fileKey:file.key,reason:'x'.repeat(400)}))};
 const base=f.publish({reviewId:'wide',snapshotId:'wide',story});const bytes=Buffer.byteLength(JSON.stringify(base));assert.ok(bytes>256*1024);
 let remove=bytes-256*1024;const claims=story.claims.map(claim=>{const count=Math.min(remove,claim.text.length-1);remove-=count;return {...claim,text:claim.text.slice(count)};});assert.equal(remove,0);story={...story,claims};const exact={...base,story};assert.equal(Buffer.byteLength(JSON.stringify(exact)),256*1024);
 const receipt=f.store.story.command(f.token,exact);assert.equal(receipt.state,'applied');
 const over={...exact,commandId:'publisz',story:{...story,title:story.title+'x'}};assert.equal(Buffer.byteLength(JSON.stringify(over)),256*1024+1);assert.equal(f.store.story.command(f.token,over).error,'invalid_request');assert.equal(f.store.story.query(f.token,{reviewId:'wide',snapshotId:'wide'}).versions.length,1);
}finally{f.cleanup();}});
test('S04/S05 concurrent independent processes publish one CAS winner and preserve exact loser receipt',async()=>{const f=storyFixture();try{
 const moduleUrl=new URL(`file://${resolve('src/storage/public.ts')}`).href;
 const script=`import {createStore} from ${JSON.stringify(moduleUrl)};const [filename,token,body]=process.argv.slice(1);const store=createStore(filename);try{process.stdout.write(JSON.stringify(store.story.command(token,JSON.parse(body))));}finally{store.close();}`;
 const run=promisify(execFile);const results=await Promise.all(['race-1','race-2'].map(commandId=>run(process.execPath,['--experimental-strip-types','--input-type=module','-e',script,f.filename,f.token,JSON.stringify(f.publish({commandId}))])));const receipts=results.map(result=>JSON.parse(result.stdout) as StoryReceipt);assert.equal(receipts.filter(receipt=>receipt.state==='applied').length,1);assert.equal(receipts.filter(receipt=>receipt.error==='story_conflict').length,1);
 for(const receipt of receipts)assert.deepEqual(f.store.story.command(f.token,f.publish({commandId:receipt.commandId})),receipt);assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).versions.length,1);
}finally{f.cleanup();}});
test('S05 storage faults roll back capture/version/pointer together while retaining a rejected receipt',()=>{const f=storyFixture();try{
 const db=new DatabaseSync(f.filename);db.exec("CREATE TRIGGER controlled_context_fault BEFORE INSERT ON story_contexts BEGIN SELECT RAISE(ABORT,'controlled fault'); END;");
 const command={type:'PutStoryContext' as const,commandId:'fault-context',reviewId:'r',snapshotId:'snapshot',expectedContextRevision:0,action:{type:'create' as const,capture:{kind:'PR' as const,title:'Fault',text:'Retain no partial capture.'}}};const rejected=f.store.story.command(f.token,command);assert.equal(rejected.state,'rejected');assert.equal((db.prepare('SELECT COUNT(*) AS n FROM story_captures').get() as {n:number}).n,0);assert.equal(f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot'}).currentContextRevision,0);assert.deepEqual(f.store.story.command(f.token,command),rejected);
 db.exec("DROP TRIGGER controlled_context_fault; CREATE TRIGGER controlled_head_fault BEFORE INSERT ON story_heads BEGIN SELECT RAISE(ABORT,'controlled fault'); END;");assert.equal(f.store.story.command(f.token,f.publish()).state,'rejected');assert.equal((db.prepare('SELECT COUNT(*) AS n FROM story_versions').get() as {n:number}).n,0);assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).storyRevision,0);db.close();
}finally{f.cleanup();}});
