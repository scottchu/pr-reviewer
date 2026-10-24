import {test} from 'node:test';
import assert from 'node:assert/strict';
import {semanticFixture,eventually} from './semantic-fixture.ts';
import {createAnalysisRunner} from '../src/analysis-jobs/public.ts';
import {graphFiles,validateSemanticAnchor} from '../src/domain/public.ts';
import type {StoryContent,StoryReference} from '../src/domain/public.ts';
test('S01 exact UTF-16 source/fact/clarification basis is admitted-only, historical and independent from story CAS',async()=>{
 const f=semanticFixture(),runner=createAnalysisRunner(f.store);const scope={reviewId:'r',snapshotId:f.snapshot.snapshotId};const query=()=>f.store.analysis.query(f.token,scope);
 const choose=(name='callee')=>{const view=query(),job=view.jobs.at(-1)!,inventory=view.preparation!.inventory!;if(inventory.status!=='available')throw new Error('fixture_inventory');assert.equal(f.store.analysis.command(f.token,{type:'SelectAnalysisDeclarations',commandId:`select-${view.analysisGeneration}`,jobId:job.jobId,expectedJobRevision:job.jobRevision,corpusId:job.corpusId!,inventoryId:job.inventoryId!,declarationIds:[inventory.declarations.find(item=>item.name===name&&item.declaration.side==='head')!.id]}).state,'applied');runner.wake();};
 try{
  f.store.analysis.command(f.token,f.request);runner.wake();await eventually(()=>query().jobs.at(-1)?.state==='awaiting_declarations');
  const prepared=query();assert.equal(f.store.storyEvidence(f.token,{...scope,analysisId:'0'.repeat(64),corpusId:prepared.preparation!.corpus!.corpusId,references:[]}).basisUnavailable,true);
  choose();await eventually(()=>query().jobs.at(-1)?.state==='admitted');
  const admitted=query(),analysis=admitted.analysis!;if(analysis.status!=='analyzed')throw new Error('fixture_analysis');
  const node=analysis.nodes.find(item=>item.name==='callee'&&item.declaration.side==='head')!,anchor=node.declaration;
  const source:StoryReference={type:'semantic_source',corpusId:admitted.corpus!.corpusId,anchor};const fact:StoryReference={type:'static_node',analysisId:analysis.analysisId,factId:node.id};
  const story:StoryContent={title:'Static export and explicit limits',analysisId:analysis.analysisId,corpusId:admitted.corpus!.corpusId,captureIds:[],chapters:[{id:'chapter',title:'Export',why:'unknown',what:'source',how:'source',example:{scenarioKind:'source_derived',input:'source',before:'unknown',after:'source'},stepIds:['step']}],claims:[{id:'unknown',text:'The business motivation is not supplied.',basis:'unknown',references:[],uncertainty:'Ask the owner.'},{id:'source',text:'The retained exported arrow is a static fact, not execution.',basis:'static_relationship',references:[fact,source]}],steps:[{id:'step',headline:'Inspect the exact declaration',claimIds:['source'],focus:{type:'semantic',reference:fact,sources:[source]}}],scope:graphFiles(f.snapshot).map(file=>({type:'explained',fileKey:file.key,chapterId:'chapter',explanation:'Changes the retained export.',references:[source]})),limitations:['Static binding only; execution and motivation unknown.']};
  const command={type:'PublishStory' as const,commandId:'semantic-story',...scope,expectedStoryRevision:0,contextRevision:0,story};
  const published=f.store.story.command(f.token,command);assert.equal(published.state,'applied');
  const bad:StoryReference[]=[{...source,corpusId:'f'.repeat(64)},{...source,anchor:{...anchor,contentHash:'f'.repeat(64)}},{...source,anchor:{...anchor,end:999999}},{...source,anchor:{...anchor,startLine:2}},{...source,anchor:{...anchor,snapshotId:'foreign'}},{...fact,analysisId:'f'.repeat(64)},{...fact,factId:'missing'},{type:'clarification',analysisId:analysis.analysisId,clarificationId:'missing',revision:1}];
  for(const [index,reference] of bad.entries()){const invalid=f.store.storyEvidence(f.token,{...scope,analysisId:story.analysisId!,corpusId:story.corpusId!,references:[reference]});assert.equal(invalid.invalid.length,1,`bad reference ${index}`);}
  assert.equal(f.store.story.command(f.token,{...command,commandId:'missing-basis',expectedStoryRevision:1,story:{...story,analysisId:'f'.repeat(64),claims:story.claims.map(claim=>claim.id==='source'?{...claim,basis:'source_observation',references:[source]}:claim)}}).error,'story_reference_invalid');
  const clarification=f.store.analysis.command(f.token,{type:'PutGraphClarification',commandId:'clarification',...scope,analysisId:analysis.analysisId,expectedGraphRevision:admitted.graphRevision,primary:anchor,evidence:[anchor],text:'Authored interpretation, not runtime proof.',kind:'interpretation'});assert.equal(clarification.state,'applied');
  const clarificationId=f.store.analysis.query(f.token,scope).clarifications[0]!.clarificationId;
  assert.equal(f.store.storyEvidence(f.token,{...scope,analysisId:story.analysisId!,corpusId:story.corpusId!,references:[{type:'clarification',analysisId:story.analysisId!,clarificationId,revision:1}]}).invalid.length,0);
  assert.equal(f.store.story.command(f.token,{...command,commandId:'after-clarification',expectedStoryRevision:1}).state,'applied');
  f.store.analysis.command(f.token,{...f.request,commandId:'new-generation',expectedAnalysisGeneration:1});runner.wake();await eventually(()=>query().jobs.at(-1)?.state==='awaiting_declarations');choose('unknown');await eventually(()=>query().jobs.at(-1)?.state==='admitted');
  const historical=f.store.story.query(f.token,scope);assert.equal(historical.version!.story.analysisId,analysis.analysisId);assert.deepEqual(historical.brokenEvidence,[]);assert.equal(historical.staticNeighborhoodAvailable,true);assert.equal(historical.historicalAnalysis,true);
  assert.equal(f.store.story.command(f.token,{...command,commandId:'historical-publication',expectedStoryRevision:2}).state,'applied');
 }finally{await runner.stop();f.cleanup();}
});
test('public semantic validator preserves CRLF, separators, astral UTF-16 and empty-range rejection',()=>{
 const source={snapshotId:'s',side:'head' as const,path:'x.ts',contentHash:'a'.repeat(64),content:'\uFEFF😀\r\nx\u2028y\u2029z'};
 const anchor={snapshotId:'s',side:'head' as const,path:'x.ts',contentHash:source.contentHash,start:5,end:6,startLine:2,endLine:2};assert.equal(validateSemanticAnchor(source,anchor),true);assert.equal(validateSemanticAnchor(source,{...anchor,start:7,end:8,startLine:3,endLine:3}),true);assert.equal(validateSemanticAnchor(source,{...anchor,startLine:1}),false);assert.equal(validateSemanticAnchor(source,{...anchor,end:5}),false);assert.equal(validateSemanticAnchor(source,{...anchor,path:'wrong'}),false);
});
