import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {storyCanonical} from '../src/domain/public.ts';
import type {StoryCommand,StoryContent,StoryReference,Principal} from '../src/domain/public.ts';
import {storyFixture} from './story-fixture.ts';
const owner={kind:'user' as const,actorId:'local-user'};
const attach=(f:ReturnType<typeof storyFixture>,session='session')=>{const connection=f.store.registerConnection(owner,{host:'codex',sessionId:session,connectionId:session,corroborated:true});const challenge=f.store.challenge(owner,'r','codex',session,session);return f.store.attach(connection.principal,challenge.challengeId,challenge.proof);};
const contextCommand=(id='context'):Extract<StoryCommand,{type:'PutStoryContext'}>=>({type:'PutStoryContext',commandId:id,reviewId:'r',snapshotId:'snapshot',expectedContextRevision:0,action:{type:'create',capture:{kind:'Ticket',title:'Owner purpose',text:'Reviewers need a concrete example.',originUrl:'https://example.invalid/ticket/1'}}});
test('S01/S02/S04/S05 publication is immutable, independently revised and retry survives restart',()=>{const f=storyFixture();try{
 const reviewBefore=f.store.review(owner,'r'),analysisBefore=f.store.analysis.query(f.token,{reviewId:'r',snapshotId:'snapshot'});
 const first=f.store.story.command(f.token,f.publish());assert.equal(first.state,'applied');assert.equal(first.storyRevision,1);assert.equal(first.contextRevision,0);
 const view=f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'});assert.equal(view.version!.contentHash.length,64);assert.equal(view.version!.author.actorId,'local-user');assert.equal(view.staticNeighborhoodAvailable,false);assert.deepEqual(view.brokenEvidence,[]);
 assert.deepEqual(f.store.story.command(f.token,f.publish()),first);
 assert.equal(f.store.story.command(f.token,f.publish({story:{...f.story,title:'Changed payload'}})).error,'command_conflict');
 assert.equal(f.store.story.command(f.token,f.publish({commandId:'compete'})).error,'story_conflict');
 const second=f.store.story.command(f.token,f.publish({commandId:'second',expectedStoryRevision:1,replacesVersionId:first.result.versionId!}));assert.equal(second.state,'applied');
 assert.deepEqual(f.store.review(owner,'r'),reviewBefore);assert.deepEqual(f.store.analysis.query(f.token,{reviewId:'r',snapshotId:'snapshot'}),analysisBefore);
 f.restart();assert.deepEqual(f.store.story.command(f.token,f.publish()),first);
 const old=f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot',versionId:first.result.versionId!,minimumStoryRevision:2});assert.equal(old.newerVersion,true);assert.equal(old.version!.storyRevision,1);assert.equal(old.versions.length,2);
 assert.throws(()=>f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot',minimumStoryRevision:3}),/revision_unavailable/);
 assert.throws(()=>f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot',versionId:'missing'}),/story_version_unavailable/);
}finally{f.cleanup();}});
test('S03/S04 context captures supersede without replacing old story provenance; stale context rejects',()=>{const f=storyFixture();try{
 const first=f.store.story.command(f.token,contextCommand());assert.equal(first.state,'applied');
 assert.deepEqual(f.store.story.command(f.token,contextCommand()),first);
 const capture=f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot'}).captures[0]!;
 const reference:StoryReference={type:'capture',captureId:capture.captureId,contentHash:capture.contentHash,start:0,end:8};
 const story:StoryContent={...f.story,captureIds:[capture.captureId],claims:f.story.claims.map(claim=>claim.id==='why'?{id:'why',text:'Owner supplied purpose.',basis:'supplied_rationale',references:[reference]}:claim)};
 const published=f.store.story.command(f.token,f.publish({contextRevision:1,story}));assert.equal(published.state,'applied');
 const next=f.store.story.command(f.token,{...contextCommand('next-context'),expectedContextRevision:1,action:{type:'create',capture:{kind:'Ticket',title:'Correction',text:'New owner purpose',supersedesCaptureId:capture.captureId}}});assert.equal(next.state,'applied');
 const current=f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot'});assert.equal(current.captures.length,1);assert.notEqual(current.captures[0]!.captureId,capture.captureId);
 assert.deepEqual(f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot',contextRevision:1}).captures,[capture]);
 const old=f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'});assert.equal(old.newerContext,true);assert.deepEqual(old.brokenEvidence,[]);
 assert.deepEqual(f.store.story.command(f.token,f.publish({contextRevision:1,story})),published);
 assert.equal(f.store.story.command(f.token,f.publish({commandId:'stale-context',expectedStoryRevision:1,contextRevision:1,story})).error,'story_context_conflict');
 assert.equal(f.store.story.command(f.token,f.publish({commandId:'not-selected',expectedStoryRevision:1,contextRevision:2,story})).error,'story_reference_invalid');
 assert.equal(f.store.story.command(f.token,{...contextCommand('duplicate-selection'),expectedContextRevision:2,action:{type:'select',captureIds:[current.captures[0]!.captureId,current.captures[0]!.captureId]}}).error,'story_structure_invalid');
 assert.equal(f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot'}).currentContextRevision,2);
}finally{f.cleanup();}});
test('S01 retained evidence rejects wrong hash, range, snapshot, metadata, capture and question identities',()=>{const f=storyFixture();try{
 const refs:StoryReference[]=[{...f.source,contentHash:'0'.repeat(64)},{...f.source,anchor:{...f.source.anchor,endLine:2}},{...f.source,anchor:{...f.source.anchor,snapshotId:'other'}},{type:'metadata',field:'title'},{type:'capture',captureId:'missing',contentHash:'0'.repeat(64)}];
 for(const [index,ref] of refs.entries()){const story={...f.story,claims:f.story.claims.map(claim=>claim.id==='what'?{...claim,references:[f.source,ref]}:claim)};assert.equal(f.store.story.command(f.token,f.publish({commandId:`bad-${index}`,story})).error,'story_reference_invalid');}
 assert.equal(f.store.story.command(f.token,f.publish({commandId:'question',story:{...f.story,questionId:'missing'}})).error,'story_reference_invalid');
 assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).storyRevision,0);
 assert.deepEqual(f.store.storyEvidence(f.token,{reviewId:'r',snapshotId:'snapshot',references:[f.source,f.source]}).valid,[f.source]);
}finally{f.cleanup();}});
test('S04 authority and initial series owner are checked before receipt replay; user corrections preserve agent owner',()=>{const f=storyFixture();try{
 const initial=attach(f);const first=f.store.story.command(initial.token,f.publish());assert.equal(first.state,'applied');
 assert.throws(()=>f.store.story.command(initial.token,contextCommand()),/unauthorized/);
 const correction=f.store.story.command(f.token,f.publish({commandId:'owner-correction',expectedStoryRevision:1}));assert.equal(correction.state,'applied');
 assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).seriesAuthor!.actorId,initial.attachment.actorId);
 assert.deepEqual(f.store.story.command(initial.token,f.publish()),first);
 const replacement=attach(f,'replacement');
 for(const action of [()=>f.store.story.command(initial.token,f.publish()),()=>f.store.story.query(initial.token,{reviewId:'r',snapshotId:'snapshot'}),()=>f.store.story.context(initial.token,{reviewId:'r',snapshotId:'snapshot'}),()=>f.store.storyEvidence(initial.token,{reviewId:'r',snapshotId:'snapshot',references:[]})])assert.throws(action,/stale_attachment/);
 assert.throws(()=>f.store.story.command(replacement.token,f.publish({commandId:'different-author',expectedStoryRevision:2})),/story_author_conflict/);
 const bootstrap=f.store.registerConnection(owner,{host:'codex',sessionId:'boot',connectionId:'boot',corroborated:true});
 assert.throws(()=>f.store.story.query(bootstrap.token,{reviewId:'r',snapshotId:'snapshot'}),/unauthorized/);
 f.store.prepare('other', {...f.snapshot,snapshotId:'other-snapshot'});
 assert.throws(()=>f.store.story.command(replacement.token,f.publish({reviewId:'other',snapshotId:'other-snapshot'})),/stale_attachment/);
 assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).storyRevision,2);
}finally{f.cleanup();}});
test('S05 same expected revision yields one apply and a durable conflict receipt',()=>{const f=storyFixture();try{
 const first=f.store.story.command(f.token,f.publish());const conflict=f.store.story.command(f.token,f.publish({commandId:'same-revision'}));assert.equal(first.state,'applied');assert.equal(conflict.error,'story_conflict');
 f.restart();assert.deepEqual(f.store.story.command(f.token,f.publish({commandId:'same-revision'})),conflict);
 assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).versions.length,1);
}finally{f.cleanup();}});
test('S06 retained body exact quota passes; next byte and rejected writes leave history unchanged',()=>{const f=storyFixture();try{
 const receipt=f.store.story.command(f.token,f.publish());assert.equal(receipt.state,'applied');
 const db=new DatabaseSync(f.filename);const bytes=(db.prepare('SELECT SUM(bytes) AS bytes FROM story_versions').get() as {bytes:number}).bytes;db.close();
 const version=f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).version!;assert.equal(Buffer.byteLength(storyCanonical(version)),bytes);
 const g=storyFixture({retainedBytes:bytes});try{assert.equal(g.store.story.command(g.token,g.publish()).state,'applied');const rejected=g.store.story.command(g.token,g.publish({commandId:'over',expectedStoryRevision:1}));assert.equal(rejected.error,'story_storage_limit');assert.equal(g.store.story.query(g.token,{reviewId:'r',snapshotId:'snapshot'}).versions.length,1);}finally{g.cleanup();}
 const h=storyFixture({retainedBytes:bytes-1});try{assert.equal(h.store.story.command(h.token,h.publish()).error,'story_storage_limit');assert.equal(h.store.story.query(h.token,{reviewId:'r',snapshotId:'snapshot'}).versions.length,0);}finally{h.cleanup();}
}finally{f.cleanup();}});
test('S01 existing published evidence reports breakage, never substitutes current bytes',()=>{const f=storyFixture();try{
 assert.equal(f.store.story.command(f.token,f.publish()).state,'applied');
 const db=new DatabaseSync(f.filename);const row=db.prepare('SELECT body FROM reviews WHERE id=?').get('r') as {body:string};const review=JSON.parse(row.body) as {snapshots:typeof f.snapshot[]};review.snapshots[0]!.sources[0]!.content='tampered\n';db.prepare('UPDATE reviews SET body=? WHERE id=?').run(JSON.stringify(review),'r');db.close();
 assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).brokenEvidence.length,1);
 assert.equal(f.store.story.command(f.token,f.publish({commandId:'new-with-broken-evidence',expectedStoryRevision:1})).error,'story_reference_invalid');
}finally{f.cleanup();}});
test('S04/S05 command-ID collisions reject in both story and each legacy ingress direction',()=>{const f=storyFixture();try{
 const story=f.store.story.command(f.token,f.publish());assert.equal(story.state,'applied');
 const ask={type:'AskQuestion' as const,commandId:'publish',reviewId:'r',anchor:f.source.anchor,text:'What changed?'};
 assert.equal(f.store.command(owner,ask).error,'command_conflict');
 const request={type:'RequestAnalysis' as const,commandId:'publish',reviewId:'r',snapshotId:'snapshot',expectedAnalysisGeneration:0};
 assert.equal(f.store.analysis.command(f.token,request).error,'command_conflict');
 assert.equal(f.store.imports.command(f.token,{type:'RequestImport',commandId:'publish',path:'/not-used'}).error,'command_conflict');
 assert.equal(f.store.command(owner,{...ask,commandId:'review-first'}).state,'applied');
 assert.notEqual(f.store.analysis.command(f.token,{...request,commandId:'analysis-first'}).error,'command_conflict');
 assert.equal(f.store.imports.command(f.token,{type:'RequestImport',commandId:'import-first',path:'/not-used'}).state,'applied');
 for(const commandId of ['review-first','analysis-first','import-first'])assert.equal(f.store.story.command(f.token,f.publish({commandId,expectedStoryRevision:1})).error,'command_conflict');
 for(const prefix of ['story-internal:','analysis-admit:','import-admit:','attach:'])assert.throws(()=>f.store.story.command(f.token,f.publish({commandId:`${prefix}reserved`})),/invalid_request/);
 assert.equal(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'}).versions.length,1);
}finally{f.cleanup();}});
