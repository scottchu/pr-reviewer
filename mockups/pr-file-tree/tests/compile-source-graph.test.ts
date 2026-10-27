import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileSourceGraph,nativeLineCorresponds,type FactDocument} from '../compile-source-graph.ts';
import {extractSourceFacts,sourceHash} from '../source-facts.ts';
import {prepareSourceFacts} from '../prepare-source-facts.ts';

const source=(path:string,side:'base'|'head',content:string)=>({repository:'example/repo',path,side,commit:(side==='base'?'a':'b').repeat(40),gitBlob:'c'.repeat(40),content,contentHash:sourceHash(content)});
const document=(entries:{path:string;before:string|null;after:string|null;patch:string;context?:boolean}[]):FactDocument=>{
  const files=entries.map(entry=>({id:sourceHash(entry.path),path:entry.path,nativeStatus:entry.before===null?'A':entry.after===null?'D':'M',comparisonStatus:entry.context?'no change':entry.before===null?'add':entry.after===null?'remove':'change',patch:entry.patch,patchHash:sourceHash(entry.patch),sides:[]}));
  return {format:'pinned-source-structural-facts-v1',producer:{version:'fixture',parser:'typescript@6',sourceHashes:{extractor:'fixture',gitStage:'fixture'}},repository:'example/repo',base:'a'.repeat(40),head:'b'.repeat(40),files:files.filter((_,index)=>!entries[index]!.context),contextFiles:files.filter((_,index)=>entries[index]!.context),units:entries.flatMap(entry=>(['base','head'] as const).flatMap(side=>{const text=side==='base'?entry.before:entry.after;return text===null?[]:extractSourceFacts(source(entry.path,side,text));})),coverage:{}} as unknown as FactDocument;
};

test('native unchanged gaps map changed declarations without name-only correspondence',()=>{
  const patch='@@ -1,1 +1,2 @@\n+import x;\n old\n@@ -5,1 +6,1 @@\n-old body\n+new body\n';
  assert.equal(nativeLineCorresponds(3,4,patch),true);
  assert.equal(nativeLineCorresponds(5,6,patch),false);
  assert.equal(nativeLineCorresponds(8,9,patch),true);
});

test('whole declaration replacement remains unresolved instead of guessing name identity',()=>{
  const before="import {accessHeaders} from './local-access.ts';\nconst request=()=>1;\nconst refresh=()=>request();\n";
  const after="import {accessHeaders} from './local-access.ts';\nconst request=()=>accessHeaders('x');\nconst refresh=()=>request();\n";
  const facts=document([{path:'src/application/review.ts',before,after,patch:"@@ -1,3 +1,3 @@\n import {accessHeaders} from './local-access.ts';\n-const request=()=>1;\n+const request=()=>accessHeaders('x');\n const refresh=()=>request();\n"},{path:'src/application/local-access.ts',before:null,after:'export const accessHeaders=(x:string)=>({Authorization:x});',patch:'@@ -0,0 +1 @@\n+export const accessHeaders=(x:string)=>({Authorization:x});'}]);
  const graph=compileSourceGraph(facts);
  // Whole replacement of a declaration is conservatively unresolved; actual PR request starts in an unchanged gap.
  assert.ok(!graph.entities.some(entity=>entity.id==='request'));
  assert.ok(graph.unresolved.some(row=>row.occurrence.name==='request'));
  assert.equal(graph.relations.filter(edge=>edge.relation==='changes').length,2);
  assert.equal(graph.entities.find(entity=>entity.id==='refresh')?.data.comparisonStatus,'no change');
  assert.deepEqual(graph,compileSourceGraph(facts));
});

test('unchanged actual Test contains its exact Assertion, not a guessed verifies-function relation',()=>{
  const text="import {test} from 'node:test'; import assert from 'node:assert/strict';\ntest('credential',()=>{assert.equal('Bearer x','Bearer x');});\n";
  const facts=document([{path:'tests/context.test.ts',before:text,after:text,patch:'',context:true}]);
  const graph=compileSourceGraph(facts),definition=graph.entities.find(entity=>entity.kind==='test')!,assertion=graph.entities.find(entity=>entity.kind==='assertion')!;
  assert.ok(graph.relations.some(edge=>edge.from===definition.id&&edge.to===assertion.id&&edge.relation==='contains'));
  assert.ok(graph.relations.some(edge=>edge.from===assertion.id&&edge.relation==='located_in'));
  assert.ok(!graph.relations.some(edge=>['verifies','changes'].includes(edge.relation)));
  assert.ok(!graph.entities.some(entity=>entity.kind==='run'||entity.kind==='absence'));
});

test('a natively appended test in an existing File is an addition without fake Before',()=>{
  const before="import {test} from 'node:test';\n";
  const after=before+"test('new source case',()=>{});\n";
  const graph=compileSourceGraph(document([{path:'tests/new.test.ts',before,after,patch:"@@ -1 +1,2 @@\n import {test} from 'node:test';\n+test('new source case',()=>{});\n"}]));
  assert.equal(graph.entities.find(entity=>entity.kind==='test')?.data.comparisonStatus,'add');
  assert.ok(!graph.entities.some(entity=>entity.kind==='absence'));
});

test('pinned PR25 native inventory mechanically yields changed request and unchanged caller witnesses',async()=>{
  const facts=await prepareSourceFacts('scottchu/pr-reviewer','b096826e31c0927190806de91ed70b8b64aa93d8','e3b270e5f49a9215452b0b86702946043e979059');
  const graph=compileSourceGraph(facts);
  assert.equal(graph.entities.find(entity=>entity.id==='request')?.data.comparisonStatus,'change');
  assert.equal(graph.entities.find(entity=>entity.id==='refresh')?.data.comparisonStatus,'no change');
  assert.equal(graph.entities.find(entity=>entity.id==='helper')?.data.comparisonStatus,'add');
  assert.equal(graph.relations.filter(edge=>edge.relation==='changes').length,facts.files.length);
  const calls=graph.relations.find(edge=>edge.relation==='calls'&&edge.from==='refresh'&&edge.to==='request')!;
  assert.equal(calls.data.comparisonStatus,'no change');
  const witnesses=calls.data.sourceCalls as {site:{anchor:{startLine:number}}}[];
  assert.deepEqual(witnesses.map(witness=>witness.site.anchor.startLine),[37,38]);
  const helperCall=graph.relations.find(edge=>edge.relation==='calls'&&edge.from==='request'&&edge.to==='helper')!;
  assert.equal(helperCall.version,'after');
  assert.ok(facts.units.some(unit=>unit.kind==='assertion'&&unit.anchor.path==='tests/application.test.ts'&&unit.anchor.startLine===418));
  assert.ok(!graph.relations.some(edge=>edge.relation==='verifies'));
});
