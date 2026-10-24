import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storyCommandSchema,storyCanonical,storyReferences,validateStoryStructure} from '../src/domain/public.ts';
import {storyFixture} from './story-fixture.ts';
test('S01/S02 strict bounded authored account retains explicit unknown and complete primary scope',()=>{const f=storyFixture();try{
 const command=storyCommandSchema.parse(f.publish());assert.equal(command.type,'PublishStory');
 assert.doesNotThrow(()=>validateStoryStructure(f.story,f.snapshot));
 const cases=[{...f.story,scope:[]},{...f.story,scope:[...f.story.scope,...f.story.scope]},{...f.story,steps:[{...f.story.steps[0]!,claimIds:['missing']}]},{...f.story,chapters:[{...f.story.chapters[0]!,stepIds:['missing']}]},{...f.story,claims:[...f.story.claims,f.story.claims[0]!]}];
 for(const story of cases)assert.throws(()=>validateStoryStructure(story,f.snapshot));
 assert.equal(storyReferences(f.story).length,1);assert.equal(storyCanonical({z:[2,1],a:'x'}),'{"a":"x","z":[2,1]}');
 assert.equal(storyCommandSchema.safeParse({...f.publish(),actorId:'forged'}).success,false);
 assert.equal(storyCommandSchema.safeParse({...f.publish(),story:{...f.story,verified:true}}).success,false);
}finally{f.cleanup();}});
test('S06 rejects nested/unbounded shapes and command namespace before evidence work',()=>{const f=storyFixture();try{
 for(const value of [f.publish({commandId:'story-internal:fake'}),f.publish({story:{...f.story,chapters:Array.from({length:9},()=>f.story.chapters[0]!)}}),f.publish({story:{...f.story,title:'x'.repeat(121)}})])assert.equal(storyCommandSchema.safeParse(value).success,false);
 assert.notEqual(storyCanonical({a:[1,2]}),storyCanonical({a:[2,1]}));
}finally{f.cleanup();}});
test('S02 unsupported, empty and copied primary entries keep distinct exact coverage keys',()=>{const f=storyFixture();try{
 const files=[{status:'modified' as const,oldPath:'value.ts',newPath:'value.ts',dispositions:[]},{status:'copied' as const,oldPath:'value.ts',newPath:'copy.ts',dispositions:[]},{status:'added' as const,oldPath:null,newPath:'binary.bin',coverage:'unsupported' as const,dispositions:[]},{status:'added' as const,oldPath:null,newPath:'empty.txt',coverage:'text' as const,dispositions:[]}];
 const snapshot={...f.snapshot,changedFiles:files};const scope=files.map((file,index)=>({type:'unexplained' as const,fileKey:JSON.stringify([index,file.oldPath,file.newPath]),reason:'Evidence is incomplete; no fabricated source anchor.'}));
 const story={...f.story,scope,steps:[{...f.story.steps[0]!,focus:{type:'structural' as const,fileKey:scope[0]!.fileKey}}]};assert.doesNotThrow(()=>validateStoryStructure(story,snapshot));assert.throws(()=>validateStoryStructure({...story,scope:scope.slice(0,3)},snapshot),/story_scope_invalid/);
}finally{f.cleanup();}});
test('S06 256 unique references pass, one extra rejects and each step stays within eight',()=>{const f=storyFixture();try{
 const references=Array.from({length:257},(_,index)=>({...f.source,anchor:{...f.source.anchor,startLine:index+1,endLine:index+1}}));
 const claims=Array.from({length:32},(_,index)=>({id:`claim-${index}`,text:'An explicit source-backed inference with limits.',basis:'inference' as const,references:references.slice(index*8,index*8+8),uncertainty:'The author has not verified runtime behavior.'}));
 const steps=claims.map(claim=>({id:`step-${claim.id}`,headline:'Inspect source',claimIds:[claim.id],focus:{type:'structural' as const,fileKey:f.fileKey}}));
 const chapter={...f.story.chapters[0]!,why:'claim-0',what:'claim-0',how:'claim-0',example:{scenarioKind:'illustrative' as const,input:'claim-0',before:'claim-0',after:'claim-0'},stepIds:steps.map(step=>step.id)};
 const story={...f.story,claims,steps,chapters:[chapter],scope:[{type:'unexplained' as const,fileKey:f.fileKey,reason:'Full interpretation remains unknown.'}]};assert.equal(storyReferences(story).length,256);assert.doesNotThrow(()=>validateStoryStructure(story,f.snapshot));
 assert.throws(()=>validateStoryStructure({...story,scope:[{type:'explained',fileKey:f.fileKey,chapterId:chapter.id,explanation:'One further exact reference.',references:[references[256]!]}]},f.snapshot),/invalid_request/);
}finally{f.cleanup();}});
