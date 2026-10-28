import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import {projectExperience} from '../../../src/review-graph/ui/projection.ts';
import {runSourcePipeline} from '../../../src/review-graph/pipeline/run.ts';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import type {SourceGraph,GraphEntity,SourceSnapshot} from '../../../src/review-graph/domain/types.ts';
const composition=(status:string)=>({status,scope:'source unit',added:status==='add'?1:0,removed:0,rows:[],hunks:[]});
const fn:GraphEntity={id:'fn',kind:'function',data:{name:'f()',comparisonStatus:'change',editComposition:composition('add')}};
const graph:SourceGraph={entities:[
 {id:'file',kind:'file',data:{path:'src/a.ts',comparisonStatus:'change'}},
 {id:'group',kind:'change',data:{name:'f() change',comparisonStatus:'change',editComposition:composition('add')},nodes:[fn],edges:[]},
 {id:'unknown',kind:'function',data:{name:'unknown()',comparisonStatus:'change',editComposition:composition('unresolved')}},
 {id:'neutral',kind:'function',data:{name:'same()',comparisonStatus:'no change'}},
 {id:'docs',kind:'change',data:{name:'docs change',documentPath:'docs/a.md'},nodes:[{id:'doc-evidence',kind:'evidence',data:{name:'Native comparison',nativeHunks:[]}}],edges:[]},
],relations:[],fileUnits:{file:['fn']},groupFor:{fn:'group'},initialVisible:['group','unknown','neutral','docs'],unresolved:[],provenance:{repository:'example/repo',base:'a'.repeat(40),head:'b'.repeat(40)}};

test('independent UIType oracle preserves semantic defaults, scoped status and source controls',()=>{
 const state=experienceService.openComparison(graph),before=JSON.stringify(state);
 const view=projectExperience(state);
 assert.deepEqual(view.nodes.map(entity=>entity.id),['file','group','fn','unknown','neutral','docs','doc-evidence']);
 assert.deepEqual(view.nodes.find(entity=>entity.id==='fn')!.ui,{card:{title:'f()',rows:['add']},status:'add',icon:'function',sourceControl:true,sourceOpen:false,fileControl:false,inlineSourceReading:false,unitCount:0,unpairedRows:[],sourceReading:{caption:'Scoped source unit edits: +1 / −0',available:true,hunks:[],panes:[{kind:'remove',title:'Removed −0',versionLabel:'Before',emptyLabel:'No removed rows in this scope.',footer:'First 0 source rows · all evidence below',rows:[]},{kind:'add',title:'Added +1',versionLabel:'After',emptyLabel:'No added rows in this scope.',footer:'First 0 source rows · all evidence below',rows:[]}]}});
 assert.deepEqual(view.nodes.find(entity=>entity.id==='neutral')!.ui.card,{title:'same()',rows:['no change','Source-body equality, not behavior equivalence']});
 assert.equal(view.nodes.find(entity=>entity.id==='unknown')!.ui.status,undefined);
 assert.deepEqual(view.nodes.find(entity=>entity.id==='group')!.nodes!.map(entity=>entity.id),['fn']);
 assert.equal(view.nodes.filter(entity=>entity.kind==='evidence').length,1);
 assert.equal(JSON.stringify(state),before);
});

test('actual Experience intentions are immutable, scoped and reflected by UIProjection',()=>{
 const session=createGraphSession(graph);
 const expanded=session.expand('file',false);
 assert.equal(expanded.limits.file,20);assert.equal(session.limits.file,undefined);
 assert.equal(expanded.inspect('fn',true).view.entities.find(entity=>entity.id==='fn')!.ui.sourceOpen,true);
 assert.equal(session.inspect('fn',true).inspect('fn',false).view.entities.find(entity=>entity.id==='fn')!.ui.sourceOpen,false);
 const state=experienceService.openComparison(graph),before=JSON.stringify(state);
 const show=experienceService.handleIntent(state,{type:'show-source-units',comparisonId:state.comparisonId,fileId:'file'});
 assert.equal(show.state.limits.file,20);assert.equal(state.limits.file,undefined);
 const more=experienceService.handleIntent(show.state,{type:'show-source-units',comparisonId:state.comparisonId,fileId:'file'});
 assert.equal(more.state.limits.file,40);
 const hidden=experienceService.handleIntent(more.state,{type:'show-source-units',comparisonId:state.comparisonId,fileId:'file',hide:true});assert.equal(hidden.state.limits.file,0);
 const opened=experienceService.handleIntent(state,{type:'source-disclosure',comparisonId:state.comparisonId,entityId:'fn',open:true});
 assert.equal(projectExperience(opened.state).nodes.find(entity=>entity.id==='fn')!.ui.sourceOpen,true);
 const returned=experienceService.handleIntent(opened.state,{type:'return-to-graph',comparisonId:state.comparisonId});
 assert.equal(projectExperience(returned.state).nodes.find(entity=>entity.id==='fn')!.ui.sourceOpen,false);
 assert.equal(JSON.stringify(state),before);
 const invalid=experienceService.handleIntent(state,{type:'show-source-units',comparisonId:state.comparisonId,fileId:'unknown'});assert.equal(invalid.accepted,false);assert.equal(invalid.state,state);
 for(const provenance of [{...graph.provenance,base:'c'.repeat(40)},{...graph.provenance,repository:'other/repo'}]){
  const other=experienceService.openComparison({...graph,provenance});
  assert.notEqual(other.comparisonId,state.comparisonId);
  const stale=experienceService.handleIntent(other,{type:'source-disclosure',comparisonId:state.comparisonId,entityId:'fn',open:true});
  assert.equal(stale.accepted,false);assert.equal(stale.state,other);
 }
});

test('real stage ports compare before enrichment and preserve extracted source on enrichment failure',async()=>{
 const content='const f=()=>1;\n',contentHash=createHash('sha256').update(content).digest('hex');
 const snapshot:SourceSnapshot={format:'manual',producer:{version:'manual',parser:'typescript',sourceHashes:{}},repository:'example/repo',base:'a'.repeat(40),head:'b'.repeat(40),files:[{id:'file',path:'src/a.ts',nativeStatus:'A',comparisonStatus:'add',sides:[{side:'base',commit:'a'.repeat(40),available:false},{side:'head',commit:'b'.repeat(40),available:true,contentHash,disposition:'text'}],patch:'@@ -0,0 +1 @@\n+const f=()=>1;\n',patchHash:'manual'}],contextFiles:[],coverage:{},sources:[{repository:'example/repo',side:'head',commit:'b'.repeat(40),path:'src/a.ts',content,contentHash,gitBlob:'c'.repeat(40)}]};
 const order:string[]=[];
 const result=await runSourcePipeline({read:()=>snapshot,parse:domainService.parseSnapshot,extract:parsed=>{const facts=domainService.extractSnapshot(parsed);const comparison=domainService.compare(facts);order.push('compared');return {facts,comparison,nativeDiffs:parsed.nativeDiffs,nativeDiagnostics:parsed.nativeDiagnostics,editCompositions:new Map()};},enrich:source=>{assert.ok(source.comparison.entities.some(entity=>entity.kind==='function'));throw new Error('enricher_unavailable');}},stage=>order.push(stage));
 assert.deepEqual(order,['read','parse','extract','compared','enrich']);
 assert.equal(result.status,'failed');if(result.status!=='failed')return;
 assert.equal(result.stage,'enrich');assert.equal(result.source!.facts.units[0]!.name,'f');
 domainService.validateGraph(result.source!.comparison.entities,result.source!.comparison.relations);
 const failedRead=await runSourcePipeline({read:()=>{throw new Error('read_failed');},parse:()=>{throw new Error('must_not_parse');},extract:()=>{throw new Error('must_not_extract');},enrich:()=>null});
 assert.equal(failedRead.status,'failed');if(failedRead.status==='failed'){assert.equal(failedRead.stage,'read');assert.equal(failedRead.source,undefined);}
 const controller=new AbortController();controller.abort();
 const cancelled=await runSourcePipeline({read:()=>{throw new Error('must_not_read');},parse:domainService.parseSnapshot,extract:()=>{throw new Error('must_not_extract');},enrich:()=>null},()=>{},controller.signal);
 assert.equal(cancelled.status,'failed');
});
