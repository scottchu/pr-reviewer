import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {changeSourceRelationships} from '../../../src/review-graph/domain/source-relationships.ts';
import {loadChangeModel,changeForSubject,resolveChangeEvidence} from '../../../src/review-graph/domain/change-model.ts';
import type {SourceGraph} from '../../../src/review-graph/domain/types.ts';
import {sourceGraph} from '../source-graph.ts';
const tid='unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const graph=sourceGraph as SourceGraph;
const clone=()=>JSON.parse(JSON.stringify(graph)) as SourceGraph;

test('C1/C2: paired request code rows bind exact Before construction and After call facts without changing source',()=>{
 const hash=(g:SourceGraph)=>createHash('sha256').update(JSON.stringify(g)).digest('hex'),before=hash(graph);
 const change=changeForSubject(loadChangeModel(graph),'request')!,account=changeSourceRelationships(graph,change),native=resolveChangeEvidence(graph,change)!;
 assert.deepEqual(native.removed.map(r=>r.line),[29]);assert.deepEqual(native.added.map(r=>r.line),[30]);
 assert.equal(account.implementationLink,'supplied');
 const construction=account.references.find(r=>r.relation==='constructs')!,call=account.references.find(r=>r.relation==='calls')!;
 assert.deepEqual([construction.source.side,construction.source.startLine,construction.targetId],['base',29,'header-value']);
 assert.deepEqual([call.source.side,call.source.startLine,call.targetId],['head',30,'helper']);assert.equal(call.relationIds.length,3);assert.equal(call.targetSource.path,'src/application/local-access.ts');assert.equal(call.targetSource.startLine,3);assert.equal(call.targetSource.side,'head');
 for(const ref of account.references){assert.equal(ref.source.repository,change.comparison.repository);assert.equal(ref.source.commit,ref.source.side==='base'?change.comparison.base:change.comparison.head);for(const id of ref.relationIds)assert.ok(graph.relations.some(r=>r.id===id));}
 assert.ok(native.added[0]!.text.includes('accessHeaders(captured)'));assert.equal(hash(graph),before);
});

test('C3: controlled-host Test has native code but no invented implementation relationship or Assertion inventory',()=>{
 const change=changeForSubject(loadChangeModel(graph),tid)!,account=changeSourceRelationships(graph,change),native=resolveChangeEvidence(graph,change)!;
 assert.equal(native.removed.length,4);assert.equal(native.added.length,8);
 assert.deepEqual(account,{references:[],implementationLink:'not-established'});
 assert.ok(native.added.some(row=>row.text.includes("page.on('request',request=>")));
});

test('C2: wrong side/commit/path/hash/range and ambiguous or unsupported binding fail closed',()=>{
 for(const [key,value] of [['side','base'],['commit','forged'],['path','other.ts'],['contentHash','wrong'],['startLine',99999]] as const){
  const input=clone();const edge=input.relations.find(r=>r.relation==='calls'&&r.to==='helper'&&String(r.data.sourceCalls).length&&r.id.includes('c97c6a'))!;
  const calls=edge.data.sourceCalls as {site:{anchor:Record<string,unknown>}}[];calls[0]!.site.anchor[key]=value;
  const change=changeForSubject(loadChangeModel(input),'request')!;assert.ok(!changeSourceRelationships(input,change).references.some(r=>r.relation==='calls'),key);
 }
 const input=clone(),edge=input.relations.find(r=>r.id==='calls:c97c6af347bb9a2b366bccc5c2a80f275b380341b0e4d25b6ae3aaed107f9fd4')!;
 const extra={...edge,id:'ambiguous-extra-target'};const ambiguous={...input,relations:[...input.relations,extra]};
 assert.ok(!changeSourceRelationships(ambiguous,changeForSubject(loadChangeModel(ambiguous),'request')!).references.some(r=>r.relation==='calls'));
 const forged={...input,relations:input.relations.map(r=>r===edge?{...r,data:{...r.data,method:'same-name-guess'}}:r)};
 assert.ok(!changeSourceRelationships(forged,changeForSubject(loadChangeModel(forged),'request')!).references.some(r=>r.relation==='calls'));
});

import {relationshipFixture} from './code-relationship-fixture.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {absoluteBoxes,initialLayout} from '../../../src/review-graph/ui/graph-geometry.ts';

test('C1/C2/C3: independently authored File Function Test fixtures share qualified references; type does not choose code or invent absence',()=>{
 for(const kind of ['function','test'] as const){
  const graph=relationshipFixture(kind),model=loadChangeModel(graph);
  for(const id of ['subject','file']){
   const account=changeSourceRelationships(graph,changeForSubject(model,id)!);
   assert.equal(account.implementationLink,'supplied');assert.deepEqual(account.references.map(r=>[r.relation,r.source.side,r.source.startLine,r.targetId]),[['constructs','base',2,'property'],['calls','head',2,'target']]);
  }
  const view=createGraphSession(graph).view,edits=view.nodes.filter(n=>n.ui.sourceEdit);
  assert.equal(edits.length,2);assert.deepEqual(edits.map(n=>n.ui.sourceEdit!.relationships!.map(r=>[r.reference.relation,r.line])),[[['constructs',2]],[['calls',2]]]);
  assert.equal(view.nodes.find(n=>n.id==='subject')!.ui.relationshipNotice,undefined);
 }
});

test('C1/C3/C4: real paired code and exact references coexist with retained source context and explicit Test unknown',()=>{
 const session=createGraphSession(graph),view=session.view,request=changeForSubject(loadChangeModel(graph),'request')!;
 const edits=view.nodes.filter(n=>n.ui.sourceEdit?.changeId===request.id);
 assert.deepEqual(edits.map(n=>n.ui.sourceEdit!.rows.map(r=>r.line)),[[29],[30]]);
 assert.deepEqual(edits.map(n=>n.ui.sourceEdit!.relationships!.map(r=>[r.reference.relation,r.reference.targetId,r.line])),[[['constructs','header-value',29]],[['calls','helper',30]]]);
 assert.ok(view.nodes.find(n=>n.id===tid)!.ui.relationshipNotice?.includes('not established'));
 assert.ok(!view.nodes.some(n=>n.kind==='assertion'));
 for(const ref of edits.flatMap(n=>n.ui.sourceEdit!.relationships!))for(const id of ref.reference.relationIds)assert.ok(graph.relations.some(r=>r.id===id));
 const nodes=view.nodes.map(entity=>{const parent=view.nodes.find(group=>group.nodes?.some(n=>n.id===entity.id));return{id:entity.id,position:{x:0,y:0},measured:{width:entity.ui.sourceEdit?380:300,height:entity.ui.sourceEdit?200:100},...(parent?{parentId:parent.id}:{})}});
 const links=[...view.relations,...(view.changeEditConnections??[])].map(edge=>({id:edge.id,source:edge.from,target:edge.to,...(edge.changeEditConnector?{labelFree:true as const}:{})}));
 const boxes=absoluteBoxes(initialLayout(nodes,links,'pr25'));
 for(const subject of ['request',tid]){
  const source=boxes.get(subject)!,sides=view.nodes.filter(n=>n.ui.sourceEdit?.subjectId===subject).map(n=>boxes.get(n.id)!);
  assert.ok(sides.every(side=>side.y>source.y+source.height));assert.equal(sides[0]!.y,sides[1]!.y);assert.ok(sides[0]!.x+sides[0]!.width<sides[1]!.x);
 }
 assert.ok(boxes.get('header-value')!.y>Math.max(...edits.map(n=>boxes.get(n.id)!.y+boxes.get(n.id)!.height)));
});


test('C2: copied location/call text contradictions cannot override qualified native rows',()=>{
 const g=relationshipFixture();const homes=g.relations.find(r=>r.id==='site-home')!;
 const badHome={...g,relations:g.relations.map(r=>r===homes?{...r,data:{...r.data,sourceEvidence:{...(r.data.sourceEvidence as object),contentHash:'wrong'}}}:r)};
 assert.equal(changeSourceRelationships(badHome,changeForSubject(loadChangeModel(badHome),'subject')!).implementationLink,'not-established');
 const copied=relationshipFixture();
 for(const edge of copied.relations.filter(r=>r.relation==='calls'||r.relation==='contains_call')){
  (edge.data.sourceCalls as {site:{sourceText:string}}[])[0]!.site.sourceText='sameNameButDifferentSource()';
 }
 const site=copied.entities.flatMap(n=>n.nodes??[]).find(n=>n.id==='site')!;
 const invalid={...copied,entities:copied.entities.map(n=>n.nodes?{...n,nodes:n.nodes.map(child=>child===site?{...child,data:{...child.data,value:'sameNameButDifferentSource()'}}:child)}:n)};
 assert.equal(changeSourceRelationships(invalid,changeForSubject(loadChangeModel(invalid),'subject')!).implementationLink,'not-established');
});


test('C2: callee identity is qualified and unambiguous; malformed call records cannot mint links',()=>{
 for(const mutate of [(a:Record<string,unknown>)=>({...a,contentHash:'wrong'}),(a:Record<string,unknown>)=>({...a,side:'base',commit:'before'})]){
  const g=relationshipFixture(),target=g.entities.find(n=>n.id==='target')!,ws=target.data.sourceWitnesses as {id:string;anchor:Record<string,unknown>}[];
  const changed={...g,entities:g.entities.map(n=>n===target?{...n,data:{...n.data,sourceWitnesses:ws.map(w=>({...w,anchor:mutate(w.anchor)}))}}:n)};
  assert.equal(changeSourceRelationships(changed,changeForSubject(loadChangeModel(changed),'subject')!).implementationLink,'not-established');
 }
 const g=relationshipFixture(),target=g.entities.find(n=>n.id==='target')!,ws=target.data.sourceWitnesses as {id:string;anchor:Record<string,unknown>}[];
 const duplicate={...g,entities:g.entities.map(n=>n===target?{...n,data:{...n.data,sourceWitnesses:[...ws,{...ws[0]!,id:'other-target-occurrence'}]}}:n)};
 assert.equal(changeSourceRelationships(duplicate,changeForSubject(loadChangeModel(duplicate),'subject')!).implementationLink,'not-established');
 const malformed={...g,relations:g.relations.map(r=>r.relation==='calls'?{...r,data:{...r.data,sourceCalls:[null]}}:r)};
 assert.equal(changeSourceRelationships(malformed,changeForSubject(loadChangeModel(malformed),'subject')!).implementationLink,'not-established');
});
