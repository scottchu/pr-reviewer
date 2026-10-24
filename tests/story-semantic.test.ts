import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {semanticFixture,eventually} from './semantic-fixture.ts';
import {createAnalysisRunner} from '../src/analysis-jobs/public.ts';
import {graphFiles,validateSemanticAnchor} from '../src/domain/public.ts';
import type {StoryContent,StoryReference,StoryReceipt,SemanticFunctionNode} from '../src/domain/public.ts';
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
  f.store.analysis.command(f.token,{...f.request,commandId:'new-generation',expectedAnalysisGeneration:1,contextFilesPerSide:1});runner.wake();await eventually(()=>query().jobs.at(-1)?.state==='awaiting_declarations');choose('callee');await eventually(()=>query().jobs.at(-1)?.state==='admitted');
  const historical=f.store.story.query(f.token,scope);assert.equal(historical.version!.story.analysisId,analysis.analysisId);assert.deepEqual(historical.brokenEvidence,[]);assert.equal(historical.staticNeighborhoodAvailable,true);assert.equal(historical.historicalAnalysis,true);
  const newer=query();assert.notEqual(newer.corpus!.corpusId,story.corpusId);
  const newCorpusDb=new DatabaseSync(f.filename);newCorpusDb.prepare("DELETE FROM analysis_records WHERE review_id=? AND kind='corpus' AND id=?").run('r',newer.corpus!.corpusId);newCorpusDb.close();
  assert.equal(f.store.analysis.source(f.token,{...scope,corpusId:story.corpusId!,side:anchor.side,path:anchor.path,contentHash:anchor.contentHash}).contentHash,anchor.contentHash);
  const exactEvidence=f.store.analysis.evidence(f.token,{...scope,analysisId:analysis.analysisId});assert.equal(exactEvidence.corpus.corpusId,story.corpusId);assert.equal(exactEvidence.analysis.analysisId,analysis.analysisId);assert.throws(()=>f.store.analysis.evidence('wrong-token',{...scope,analysisId:analysis.analysisId}),/unauthorized/);
  const independentHistorical=f.store.story.query(f.token,scope);assert.equal(independentHistorical.basisUnavailable,false);assert.deepEqual(independentHistorical.brokenEvidence,[]);assert.equal(independentHistorical.historicalAnalysis,true);assert.equal(independentHistorical.version!.story.analysisId,analysis.analysisId);
  assert.throws(()=>f.store.analysis.query(f.token,{...scope,analysisId:analysis.analysisId}),/analysis_record_unavailable/);
  assert.equal(f.store.story.command(f.token,{...command,commandId:'historical-publication',expectedStoryRevision:2}).state,'applied');
  const original=f.store.story.query(f.token,{...scope,versionId:published.result.versionId!}).version;
  const actualQuery=f.store.analysis.evidence;
  f.store.analysis.evidence=()=>{throw new Error('controlled_unexpected_storage_failure');};
  try{assert.throws(()=>f.store.story.query(f.token,{...scope,versionId:published.result.versionId!}),/controlled_unexpected_storage_failure/);}finally{f.store.analysis.evidence=actualQuery;}
  const sourceOnly:StoryContent={...story};delete sourceOnly.analysisId;delete sourceOnly.corpusId;
  const snapshotSource={type:'snapshot_source' as const,anchor:{snapshotId:f.snapshot.snapshotId,side:'head' as const,path:'callee.ts',startLine:1,endLine:1},contentHash:f.snapshot.sources.find(source=>source.side==='head')!.hash};
  sourceOnly.claims=sourceOnly.claims.map(claim=>claim.id==='source'?{...claim,basis:'source_observation',references:[snapshotSource]}:claim);
  sourceOnly.steps=sourceOnly.steps.map(step=>({...step,focus:{type:'sources',fileKey:graphFiles(f.snapshot)[0]!.key,sources:[snapshotSource]}}));
  sourceOnly.scope=sourceOnly.scope.map(row=>row.type==='explained'?{...row,references:[snapshotSource]}:row);
  assert.equal(f.store.story.command(f.token,{...command,commandId:'source-only',expectedStoryRevision:3,story:sourceOnly}).state,'applied');
  const queryMarkerBeforeDeletion=newer.selectedAnalysisId;
  const db=new DatabaseSync(f.filename);db.prepare("DELETE FROM analysis_records WHERE review_id=? AND kind='corpus' AND id=?").run('r',story.corpusId!);db.close();
  const broken=f.store.story.query(f.token,{...scope,versionId:published.result.versionId!});assert.deepEqual(broken.version,original);assert.equal(broken.basisUnavailable,true);assert.equal(broken.staticNeighborhoodAvailable,false);assert.ok(broken.brokenEvidence.length>=2);
  const unaffected=f.store.story.query(f.token,scope);assert.equal(unaffected.version!.story.title,sourceOnly.title);assert.equal(unaffected.basisUnavailable,false);assert.deepEqual(unaffected.brokenEvidence,[]);assert.equal(unaffected.currentAnalysisId,queryMarkerBeforeDeletion);
  assert.equal(f.store.story.command(f.token,{...command,commandId:'broken-basis',expectedStoryRevision:4}).error,'story_reference_invalid');
  assert.throws(()=>f.store.story.query('wrong-token',scope),/unauthorized/);
  const corruptDb=new DatabaseSync(f.filename);corruptDb.prepare('INSERT INTO analysis_records VALUES (?,?,?,?,?,?)').run('r',f.snapshot.snapshotId,'corpus',story.corpusId!,'{malformed',10);corruptDb.close();
  const corrupt=f.store.story.query(f.token,{...scope,versionId:published.result.versionId!});assert.deepEqual(corrupt.version,original);assert.equal(corrupt.basisUnavailable,true);assert.ok(corrupt.brokenEvidence.length>=2);
  assert.deepEqual(f.store.story.query(f.token,scope).brokenEvidence,[]);
  assert.equal(f.store.story.command(f.token,{...command,commandId:'corrupt-basis',expectedStoryRevision:4}).error,'story_reference_invalid');


 }finally{await runner.stop();f.cleanup();}
});
test('public semantic validator preserves CRLF, separators, astral UTF-16 and empty-range rejection',()=>{
 const source={snapshotId:'s',side:'head' as const,path:'x.ts',contentHash:'a'.repeat(64),content:'\uFEFF😀\r\nx\u2028y\u2029z'};
 const anchor={snapshotId:'s',side:'head' as const,path:'x.ts',contentHash:source.contentHash,start:5,end:6,startLine:2,endLine:2};assert.equal(validateSemanticAnchor(source,anchor),true);assert.equal(validateSemanticAnchor(source,{...anchor,start:7,end:8,startLine:3,endLine:3}),true);assert.equal(validateSemanticAnchor(source,{...anchor,startLine:1}),false);assert.equal(validateSemanticAnchor(source,{...anchor,end:5}),false);assert.equal(validateSemanticAnchor(source,{...anchor,path:'wrong'}),false);
});
for(const [label,separator] of [['U2028','\u2028'],['U2029','\u2029'],['CRLF','\r\n'],['CR','\r']] as const)test(`static node/edge snapshot focus normalizes ${label} from exact UTF-16 bytes on base and head`,async()=>{
 const f=semanticFixture(),runner=createAnalysisRunner(f.store);try{
  const base=`export const before = () => "😀";${separator}export const callee = () => 1;\nexport const unrelated = () => 3;\nexport const caller = () => callee();\n`,head=base.replace('=> 1','=> 2');
  writeFileSync(join(f.root,'callee.ts'),base);f.git('add','.');f.git('commit','-qm','coordinate base');const baseSha=f.git('rev-parse','HEAD');writeFileSync(join(f.root,'callee.ts'),head);f.git('add','.');f.git('commit','-qm','coordinate head');const headSha=f.git('rev-parse','HEAD');
  const snapshot={...f.snapshot,snapshotId:`coordinate-${label}`,baseSha,headSha,sources:([{side:'base',content:base},{side:'head',content:head}] as const).map(({side,content})=>({side,content,path:'callee.ts',hash:createHash('sha256').update(content).digest('hex'),lineCount:content.split('\n').length-1}))};f.store.prepare(`coordinate-${label}`,snapshot);
  const scope={reviewId:`coordinate-${label}`,snapshotId:snapshot.snapshotId},query=()=>f.store.analysis.query(f.token,scope);assert.equal(f.store.analysis.command(f.token,{...f.request,...scope,commandId:'coordinate-request'}).state,'applied');runner.wake();await eventually(()=>query().jobs.at(-1)?.state==='awaiting_declarations');
  const prepared=query(),job=prepared.jobs.at(-1)!,inventory=prepared.preparation!.inventory!;if(inventory.status!=='available')throw new Error('fixture_inventory');assert.equal(f.store.analysis.command(f.token,{type:'SelectAnalysisDeclarations',commandId:'coordinate-select',jobId:job.jobId,expectedJobRevision:job.jobRevision,corpusId:job.corpusId!,inventoryId:job.inventoryId!,declarationIds:inventory.declarations.filter(node=>node.name==='callee').map(node=>node.id)}).state,'applied');runner.wake();await eventually(()=>query().jobs.at(-1)?.state==='admitted');
  const admitted=query(),analysis=admitted.analysis!;if(analysis.status!=='analyzed')throw new Error('fixture_analysis');
  let revision=0;
  for(const side of ['base','head'] as const){
   const node:SemanticFunctionNode=analysis.nodes.find(item=>item.name==='callee'&&item.declaration.side===side)!;
   const edge=analysis.edges.find(edge=>edge.target.side===side&&edge.target.path==='callee.ts'&&edge.sites.some(site=>site.anchor.path==='callee.ts'))!;assert.ok(edge);
   const exactSource=snapshot.sources.find(source=>source.side===side)!;const lfLine:number=exactSource.content.slice(0,node.declaration.start).split('\n').length;
   const source:Extract<StoryReference,{type:'snapshot_source'}>={type:'snapshot_source' as const,anchor:{snapshotId:snapshot.snapshotId,side,path:'callee.ts',startLine:lfLine,endLine:lfLine},contentHash:exactSource.hash};
   const wrong:Extract<StoryReference,{type:'snapshot_source'}>={...source,anchor:{...source.anchor,startLine:lfLine+1,endLine:lfLine+1}};
   for(const type of ['static_node','static_edge'] as const){const fact:Extract<StoryReference,{type:'static_node'|'static_edge'}>={type,analysisId:analysis.analysisId,factId:type==='static_node'?node.id:edge.id};
    const story:StoryContent={title:'Coordinate ownership',analysisId:analysis.analysisId,corpusId:admitted.corpus!.corpusId,captureIds:[],chapters:[{id:'chapter',title:'Callee',why:'unknown',what:'source',how:'source',example:{scenarioKind:'illustrative',input:'source',before:'unknown',after:'source'},stepIds:['step']}],claims:[{id:'unknown',text:'The purpose remains unknown.',basis:'unknown',references:[],uncertainty:'Ask the owner.'},{id:'source',text:'A retained static callee.',basis:'static_relationship',references:[fact,source]}],steps:[{id:'step',headline:'Exact retained callee',claimIds:['source'],focus:{type:'semantic',reference:fact,sources:[source]}}],scope:[{type:'explained',fileKey:graphFiles(snapshot)[0]!.key,chapterId:'chapter',explanation:'Changes the callee.',references:[source]}],limitations:['Static source only.']};
    const publish=(suffix:string,value:StoryContent):StoryReceipt=>f.store.story.command(f.token,{type:'PublishStory',commandId:`${side}-${type}-${suffix}`,...scope,contextRevision:0,expectedStoryRevision:revision,story:value});
    assert.equal(publish('both-wrong',{...story,claims:story.claims.map(claim=>claim.id==='source'?{...claim,references:[fact,wrong]}:claim),steps:[{...story.steps[0]!,focus:{type:'semantic',reference:fact,sources:[wrong]}}]}).error,'story_reference_invalid');
    assert.equal(publish('wrong-claim',{...story,claims:story.claims.map(claim=>claim.id==='source'?{...claim,references:[fact,wrong]}:claim)}).error,'story_reference_invalid');
    assert.equal(publish('wrong-focus',{...story,steps:[{...story.steps[0]!,focus:{type:'semantic',reference:fact,sources:[wrong]}}]}).error,'story_reference_invalid');
    const wrongSide={...source,anchor:{...source.anchor,side:side==='base'?'head' as const:'base' as const},contentHash:snapshot.sources.find(source=>source.side!==side)!.hash};assert.equal(publish('wrong-side',{...story,claims:story.claims.map(claim=>claim.id==='source'?{...claim,references:[fact,wrongSide]}:claim)}).error,'story_reference_invalid');
    assert.equal(publish('wrong-hash',{...story,steps:[{...story.steps[0]!,focus:{type:'semantic',reference:fact,sources:[{...source,contentHash:'0'.repeat(64)}]}}]}).error,'story_reference_invalid');
    const wrongOffset={type:'semantic_source' as const,corpusId:story.corpusId!,anchor:{...node.declaration,start:node.declaration.start-1}};assert.equal(publish('wrong-offset',{...story,steps:[{...story.steps[0]!,focus:{type:'semantic',reference:fact,sources:[wrongOffset]}}]}).error,'story_reference_invalid');
    assert.equal(publish('correct',story).state,'applied');revision++;
    const evidence=f.store.storyEvidence(f.token,{...scope,analysisId:story.analysisId!,corpusId:story.corpusId!,references:[fact]});assert.ok(evidence.facts[0]!.snapshotAnchors.some(ref=>ref.anchor.startLine===lfLine&&ref.anchor.side===side));
   }
  }
 }finally{await runner.stop();f.cleanup();}
});
