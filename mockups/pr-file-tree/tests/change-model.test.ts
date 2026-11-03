import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildChangeModel, loadChangeModel, changeForSubject, resolveChangeEvidence} from '../../../src/review-graph/domain/change-model.ts';
import type {SourceGraph, GraphEntity, SourceAnchor} from '../../../src/review-graph/domain/types.ts';
import type {EditComposition} from '../../../src/review-graph/domain/edit-composition.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import {projectExperience} from '../../../src/review-graph/ui/projection.ts';
import {sourceGraph} from '../source-graph.ts';

const before='before-commit', after='after-commit', path='tests/example.ts';
const witness = (side:'base'|'head') => ({side,commit:side==='base'?before:after,path,contentHash:side+'-hash',startLine:2,endLine:2,text:side==='base'?'old\n':'new\n'} as const);
const composition:EditComposition={status:'change',scope:'file',removed:1,added:1,
 rows:[{kind:'remove',text:'old\n',beforeLine:2,afterLine:null},{kind:'add',text:'new\n',beforeLine:null,afterLine:2}],
 hunks:[{index:1,header:'@@ -2 +2 @@',before:witness('base'),after:witness('head'),rows:[{kind:'remove',text:'old\n',beforeLine:2,afterLine:null},{kind:'add',text:'new\n',beforeLine:null,afterLine:2}]}]};
const file:GraphEntity={id:'file',kind:'file',data:{path,repository:'repo',comparisonStatus:'change',comparisonBasis:'Pinned native diff',sourceEvidence:[{side:'base',commit:before,available:true,contentHash:'base-hash',objectId:'base-blob'},{side:'head',commit:after,available:true,contentHash:'head-hash',objectId:'head-blob'}],editComposition:composition}};
const unit=(kind:'function'|'test',status='change'):GraphEntity=>({id:kind,kind,data:{name:kind,comparisonStatus:status,comparisonBasis:'Admitted exact source correspondence',sourceWitnesses:(['base','head'] as const).filter(side=>status!=='add'||side==='head').filter(side=>status!=='remove'||side==='base').map(side=>({id:kind+'-'+side,sourceTextHash:side+'-text',anchor:{repository:'repo',side,commit:side==='base'?before:after,path,contentHash:side+'-hash',start:0,end:20,startLine:1,endLine:3} satisfies SourceAnchor})),editComposition:{...composition,scope:'source unit'}}});
const fixture=(extra:readonly GraphEntity[]=[unit('function'),unit('test')]):SourceGraph=>({entities:[file,...extra],relations:[],fileUnits:{file:extra.map(n=>n.id)},groupFor:{function:'existing-function-change',test:'existing-test-change'},initialVisible:['file'],unresolved:[],provenance:{repository:'repo',base:before,head:after}});

test('C1/C2: File Function Test share one qualified Change and exact native evidence resolver',()=>{
 const graph=fixture(),model=buildChangeModel(graph);assert.equal(model.version,1);assert.deepEqual(model.diagnostics,[]);
 assert.deepEqual(model.changes.map(c=>c.subject.kind),['file','function','test']);
 for(const subject of graph.entities){const change=changeForSubject(model,subject.id)!;assert.ok(change);assert.equal(change.kind,'change');assert.deepEqual(change.comparison,{repository:'repo',base:before,head:after});assert.equal(change.fileId,'file');assert.equal(change.before.presence,'present');assert.equal(change.after.presence,'present');
 const evidence=resolveChangeEvidence(graph,change)!;assert.equal(evidence.composition,subject.data.editComposition);assert.deepEqual(evidence.removed.map(r=>[r.text,r.line,r.hunkIndex]),[['old\n',2,1]]);assert.deepEqual(evidence.added.map(r=>[r.text,r.line,r.hunkIndex]),[['new\n',2,1]]);}
 assert.equal(changeForSubject(model,'function')!.id,'existing-function-change');assert.equal(changeForSubject(model,'test')!.id,'existing-test-change');
 assert.equal(changeForSubject(model,'test')!.fileChangeId,changeForSubject(model,'file')!.id);
 assert.equal(changeForSubject(model,'function')!.fileChangeId,changeForSubject(model,'file')!.id);
});

test('C2: unchanged has no fabricated Change; added and removed unit absence is not File absence',()=>{
 for(const status of ['add','remove'] as const){const subject=unit('test',status);const kind=status==='add'?'add':'remove';const old=subject.data.editComposition as EditComposition;const rows=old.rows.filter(r=>r.kind===kind);const c={...old,status,added:kind==='add'?1:0,removed:kind==='remove'?1:0,rows,hunks:old.hunks.map(h=>({...h,rows,before:status==='add'?null:h.before,after:status==='remove'?null:h.after}))};
 const graph=fixture([{...subject,data:{...subject.data,editComposition:c}}]),change=changeForSubject(buildChangeModel(graph),'test')!;
 assert.equal(change[status==='add'?'before':'after'].presence,'absent');assert.equal(change[status==='add'?'after':'before'].presence,'present');assert.equal(changeForSubject(buildChangeModel(graph),'file')!.before.presence,'present');assert.equal(resolveChangeEvidence(graph,change)![status==='add'?'removed':'added'].length,0);}
 assert.equal(changeForSubject(buildChangeModel(fixture([unit('test','no change')])),'test'),undefined);
});

test('C2: native failure stays unavailable; forged model references, scope, identity and duplicate accounts fail closed',()=>{
 const graph=fixture(),model=buildChangeModel(graph);assert.deepEqual(loadChangeModel({...graph,changeModel:model}),model);
 for(const mutate of [(m:typeof model)=>({...m,changes:[...m.changes,m.changes[0]!]}),(m:typeof model)=>({...m,changes:m.changes.map((c,i)=>i?c:{...c,comparison:{...c.comparison,head:'forged'}})}),(m:typeof model)=>({...m,changes:m.changes.map((c,i)=>i?c:{...c,evidence:{...c.evidence,ownerId:'test'}})}),(m:typeof model)=>({...m,changes:m.changes.map((c,i)=>i?c:{...c,before:{...c.before,presence:'absent'}})})])assert.throws(()=>loadChangeModel({...graph,changeModel:mutate(model)} as SourceGraph),/change_model/);
 const broken={...file,data:{...file.data,editComposition:{...composition,status:'unresolved',reason:'Native parse unavailable',hunks:[],rows:[],added:0,removed:0}}};const unavailable=fixture([]);const input={...unavailable,entities:[broken]};const change=buildChangeModel(input).changes[0]!;assert.equal(change.before.presence,'present');assert.equal(change.evidence.status,'unavailable');assert.equal(resolveChangeEvidence(input,change),undefined);
});

test('C3/C4/C5: real PR25 uses shared File/function/Test accounts without modifying original graph',()=>{
 const bytes=JSON.stringify(sourceGraph),model=loadChangeModel(sourceGraph);
 for(const kind of ['file','function','test'])assert.ok(model.changes.some(c=>c.subject.kind===kind));
 const request=changeForSubject(model,'request')!;assert.equal(request.id,'change');assert.equal(request.subject.kind,'function');assert.deepEqual(resolveChangeEvidence(sourceGraph,request)!.removed.map(r=>r.line),[29]);
 const testId='unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';const testChange=changeForSubject(model,testId)!;assert.equal(testChange.subject.kind,'test');assert.equal(testChange.fileId,model.changes.find(c=>c.id===testChange.fileChangeId)!.subject.id);assert.equal(resolveChangeEvidence(sourceGraph,testChange)!.removed.length,4);assert.equal(resolveChangeEvidence(sourceGraph,testChange)!.added.length,8);
 assert.equal(JSON.stringify(sourceGraph),bytes);assert.ok(!model.changes.some(c=>String(c.subject.kind)==='assertion'));
});


test('C1/C2: addition/removal/unchanged and unavailable native text use the same contract for every subject kind',()=>{
 for(const kind of ['file','function','test'] as const)for(const status of ['add','remove','no change'] as const){
  const side=status==='add'?'head':'base',editKind=status==='add'?'add':'remove';
  let subject=kind==='file'?file:unit(kind,status);
  const rows=composition.rows.filter(row=>row.kind===editKind);
  const edit:EditComposition={...composition,scope:kind==='file'?'file':'source unit',status,added:status==='add'?1:0,removed:status==='remove'?1:0,rows:status==='no change'?[]:rows,
   hunks:status==='no change'?[]:composition.hunks.map(h=>({...h,header:kind==='file'?(status==='add'?'@@ -0,0 +2 @@':'@@ -2 +0,0 @@'):h.header,rows,before:side==='head'?null:h.before,after:side==='base'?null:h.after}))};
  subject={...subject,data:{...subject.data,comparisonStatus:status,editComposition:edit,...(kind==='file'?{sourceEvidence:(file.data.sourceEvidence as {side:string;commit:string}[]).map(s=>status==='no change'||s.side===side?s:{side:s.side,commit:s.commit,available:false})}:{})}};
  const graph=kind==='file'?fixture([]):fixture([subject]);const input=kind==='file'?{...graph,entities:[subject]}:graph;
  const change=changeForSubject(loadChangeModel(input),subject.id);
  if(status==='no change'){assert.equal(change,undefined);continue;}
  assert.ok(change,kind+':'+status);assert.equal(change[status==='add'?'before':'after'].presence,'absent');assert.equal(resolveChangeEvidence(input,change)![status==='add'?'removed':'added'].length,0);
 }
});

test('C2/C3: native references reject wrong lines/hashes/text and expose File/unit overlap at exact source identity',()=>{
 for(const mutate of [
  (c:EditComposition)=>({...c,hunks:c.hunks.map(h=>({...h,before:{...h.before!,contentHash:'wrong'}}))}),
  (c:EditComposition)=>({...c,hunks:c.hunks.map(h=>({...h,rows:h.rows.map(r=>r.kind==='remove'?{...r,beforeLine:100}:r)}))}),
  (c:EditComposition)=>({...c,hunks:c.hunks.map(h=>({...h,before:{...h.before!,text:'forged\n'}}))}),
 ]){
  const subject=unit('test'),graph=fixture([{...subject,data:{...subject.data,editComposition:mutate(subject.data.editComposition as EditComposition)}}]);
  const change=changeForSubject(loadChangeModel(graph),'test')!;assert.equal(change.evidence.status,'unavailable');assert.equal(resolveChangeEvidence(graph,change),undefined);
 }
 const graph=fixture(),model=loadChangeModel(graph),fileChange=changeForSubject(model,'file')!,testChange=changeForSubject(model,'test')!;
 const nativeFile=resolveChangeEvidence(graph,fileChange)!.removed[0]!,nativeTest=resolveChangeEvidence(graph,testChange)!.removed[0]!;
 assert.deepEqual([nativeTest.witness.commit,nativeTest.witness.path,nativeTest.witness.contentHash,nativeTest.line,nativeTest.text],
  [nativeFile.witness.commit,nativeFile.witness.path,nativeFile.witness.contentHash,nativeFile.line,nativeFile.text]);
 assert.equal(testChange.fileChangeId,fileChange.id);
});


test('C2: known-present File with unavailable bytes is neither absence nor an empty successful diff',()=>{
 const subject={...file,data:{...file.data,sourceEvidence:[{side:'base',commit:before,available:false,objectId:'base-blob'},{side:'head',commit:after,available:false,objectId:'head-blob'}]}};
 const graph={...fixture([]),entities:[subject]},change=loadChangeModel(graph).changes[0]!;
 assert.equal(change.before.presence,'present');assert.equal(change.after.presence,'present');
 assert.equal(change.before.presence==='present'&&change.before.source,'unavailable');
 assert.equal(change.evidence.status,'unavailable');assert.equal(resolveChangeEvidence(graph,change),undefined);
});

test('C4: fresh typed registry is consumed by Experience and every File Function Test reader, independent of Test edit-side policy',()=>{
 const raw=fixture(),graph={...raw,changeModel:buildChangeModel(raw)},state=experienceService.openComparison(graph);
 assert.equal(state.changeModel,graph.changeModel);
 const view=projectExperience(state);
 for(const kind of ['file','function','test']){
  const entity=view.entities.find(e=>e.id===kind)!;assert.ok(entity.ui.sourceReading?.available,kind);
  const panes=entity.ui.sourceReading!.panes;
  assert.deepEqual(panes.map(p=>p.rows.map(r=>[r.line,r.text])),[[[2,'old\n']],[[2,'new\n']]]);
 }
 const next=experienceService.handleIntent(state,{type:'source-disclosure',comparisonId:state.comparisonId,entityId:'test',open:true}).state;
 assert.equal(next.changeModel,state.changeModel);
 const fresh=createGraphSession(graph);assert.equal(fresh.comparisonId,state.comparisonId);
});


test('C2 review regressions: missing tree entry cannot contain present blob metadata and physical/context rows must be qualified',()=>{
 for(const key of ['objectId','mode','type','contentHash','disposition']){
  const subject={...file,data:{...file.data,comparisonStatus:'add',sourceEvidence:[{side:'base',commit:before,available:false,[key]:'contradictory-present-record'},{side:'head',commit:after,available:true,contentHash:'head-hash'}]}};
  const graph={...fixture([]),entities:[subject]},model=buildChangeModel(graph);assert.equal(model.changes.length,0);assert.ok(model.diagnostics.some(d=>d.reason==='Checked absence unsupported'));
 }
 const rows=[{kind:'remove',text:'old\n',beforeLine:1,afterLine:null},{kind:'remove',text:'later\n',beforeLine:9,afterLine:null},{kind:'add',text:'new\n',beforeLine:null,afterLine:2}] as const;
 const gap={...composition,removed:2,rows,hunks:[{index:1,header:'@@ -1,2 +2 @@',before:{...witness('base'),startLine:1,endLine:9,text:'old\nlater\n'},after:witness('head'),rows}]};
 const graph={...fixture([]),entities:[{...file,data:{...file.data,editComposition:gap}}]};assert.equal(loadChangeModel(graph).changes[0]!.evidence.status,'unavailable');
 const contextRows=[{kind:'context',text:'context\n',beforeLine:1,afterLine:1},{kind:'add',text:'new\n',beforeLine:null,afterLine:2}] as const;
 const context:EditComposition={...composition,removed:0,rows:contextRows,hunks:[{index:1,header:'@@ -1 +1,2 @@',before:{...witness('base'),startLine:1,endLine:1,text:'context\n',contentHash:'wrong-context-hash'},after:{...witness('head'),startLine:1,endLine:2,text:'context\nnew\n'},rows:contextRows}]};
 const input={...fixture([]),entities:[{...file,data:{...file.data,editComposition:context}}]};assert.equal(loadChangeModel(input).changes[0]!.evidence.status,'unavailable');
});
