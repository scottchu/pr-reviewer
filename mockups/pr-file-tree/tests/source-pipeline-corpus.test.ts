import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseSource} from '../../../src/review-graph/parse/typescript.ts';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import type {SourceInput,FactDocument,StructuralUnit} from '../../../src/review-graph/domain/types.ts';
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const input=(content:string,path='src/a.ts'):SourceInput=>({repository:'example/repo',side:'head',commit:'b'.repeat(40),gitBlob:'c'.repeat(40),contentHash:digest(content),path,content});
const extract=(content:string)=>domainService.extractSource(parseSource(input(content)));

test('independent literal extraction corpus: exact declarations, lexical owner/call and source spans',()=>{
 const content='const α = () => 1;\nconst caller = () => α();\n';
 const units=extract(content);
 assert.deepEqual(units.map(unit=>[unit.kind,unit.name,unit.anchor.start,unit.anchor.end,unit.anchor.startLine,unit.anchor.endLine]),[
  ['function','α',10,17,1,1],['function','caller',34,43,2,2],['callsite','α',40,43,2,2],
 ]);
 assert.equal(units[2]!.ownerId,units[1]!.id);
 assert.equal(units[2]!.binding!.targetId,units[0]!.id);
 assert.deepEqual(units.map(unit=>unit.sourceText),['() => 1','() => α()','α()']);
 for(const unit of units)assert.equal(content.slice(unit.anchor.start,unit.anchor.end),unit.sourceText);
});

test('independent test/assertion alias corpus and forbidden shadowed/custom facts',()=>{
 const content="import {test as check} from 'node:test';\nimport assert from 'node:assert/strict';\ncheck('ok',()=>{assert.equal(1,1);});\n";
 const units=extract(content),sourceTest=units.find(unit=>unit.kind==='test')!,assertion=units.find(unit=>unit.kind==='assertion')!;
 assert.equal(sourceTest.name,'ok');assert.equal(sourceTest.sourceText,"check('ok',()=>{assert.equal(1,1);})");
 assert.deepEqual([sourceTest.anchor.startLine,sourceTest.anchor.endLine],[3,3]);
 assert.equal(assertion.sourceText,'assert.equal(1,1)');assert.equal(assertion.ownerId,sourceTest.id);
 assert.equal(units.some(unit=>(unit.kind as string)==='run'),false);
 const negative=[
  "import {test} from 'node:test'; const caller=(test:any)=>test('fake',()=>{});",
  "import {test} from 'node:test'; test.each([1])('fake',()=>{});",
 ];
 for(const text of negative)assert.equal(extract(text).some(unit=>unit.kind==='test'),false);
 const shadow="import {test} from 'node:test'; import assert from 'node:assert/strict'; test('x',()=>{ const assert={equal:()=>{}}; assert.equal(); });";
 assert.equal(extract(shadow).some(unit=>unit.kind==='assertion'),false);
 const custom="import {test} from 'node:test'; import {expect} from '@playwright/test'; test('x',()=>{ expect(1).toBeInvented(); });";
 assert.equal(extract(custom).some(unit=>unit.kind==='assertion'),false);
 assert.ok(extract(custom).some(unit=>unit.diagnostic));
});

test('independent binding negatives and Unicode/newline anchor round trips',()=>{
 for(const text of ['const target=()=>1; const caller=(target:()=>number)=>target();','let target=()=>1; target=()=>2; const caller=()=>target();']){
  const call=extract(text).find(unit=>unit.kind==='callsite'&&unit.name==='target')!;
  assert.ok(call);assert.equal(call.binding,undefined);
 }
 assert.equal(extract("import {target} from './target.ts';").some(unit=>unit.kind==='callsite'),false);
 const content='\ufeffconst café = () => "😀";\r\nconst second = () => café()';
 const units=extract(content);
 const first=units.find(unit=>unit.kind==='function'&&unit.name==='café')!;
 assert.equal(first.sourceText,'() => "😀"');assert.equal(first.anchor.startLine,1);
 const second=units.find(unit=>unit.kind==='function'&&unit.name==='second')!;
 assert.equal(second.anchor.startLine,2);assert.equal(second.anchor.end,content.length);
 for(const unit of units)assert.equal(content.slice(unit.anchor.start,unit.anchor.end),unit.sourceText);
 const prefixed=extract('// neutral\n'+content);
 assert.equal(prefixed.length,units.length);
 assert.deepEqual(prefixed.map(unit=>unit.anchor.startLine),units.map(unit=>unit.anchor.startLine+1));
});

test('manually authored correspondence facts forbid whole-replacement pairing',()=>{
 const unit=(side:'base'|'head',text:string):StructuralUnit=>({id:side,kind:'function',name:'same',identityPath:'same',sourceText:text,basis:'manual corpus',anchor:{repository:'example/repo',side,path:'src/a.ts',commit:(side==='base'?'a':'b').repeat(40),contentHash:(side==='base'?'c':'d').repeat(64),start:11,end:16,startLine:1,endLine:1}});
 const facts={repository:'example/repo',base:'a'.repeat(40),head:'b'.repeat(40),producer:{},files:[{id:'file',path:'src/a.ts',comparisonStatus:'change',nativeStatus:'M',sides:[],patch:'@@ -1 +1 @@\n-const same=()=>1;\n+const same=()=>2;\n'}],contextFiles:[],units:[unit('base','()=>1'),unit('head','()=>2')],coverage:{}} as unknown as FactDocument;
 const graph=domainService.compare(facts);
 assert.equal(graph.entities.some(entity=>entity.kind==='function'),false);
 assert.equal(graph.unresolved.length,2);
 assert.equal(graph.relations.some(edge=>edge.relation==='verifies'),false);
});


test('manually authored import-binding corpus rejects ambiguous extensionless targets',()=>{
 const anchor=(path:string)=>({repository:'example/repo',side:'head' as const,path,commit:'b'.repeat(40),contentHash:'c'.repeat(64),start:0,end:5,startLine:1,endLine:1});
 const caller:StructuralUnit={id:'caller',kind:'function',name:'caller',sourceText:'()=>target()',anchor:anchor('src/a.ts'),basis:'manual'};
 const target=(path:string,id:string):StructuralUnit=>({id,kind:'function',name:'target',exportName:'target',sourceText:'()=>1',anchor:anchor(path),basis:'manual'});
 const site:StructuralUnit={id:'site',kind:'callsite',name:'target',ownerId:'caller',sourceText:'target()',anchor:anchor('src/a.ts'),basis:'manual',binding:{kind:'relative-import',module:'./target',name:'target'}};
 const files=['src/a.ts','src/target.ts','src/target.tsx'].map(path=>({id:path,path,nativeStatus:'A',comparisonStatus:'add',sides:[],patch:'@@ -0,0 +1 @@\n+line\n'}));
 const facts={repository:'example/repo',base:'a'.repeat(40),head:'b'.repeat(40),producer:{},files,contextFiles:[],units:[caller,target('src/target.ts','one'),target('src/target.tsx','two'),site],coverage:{}} as unknown as FactDocument;
 assert.equal(domainService.compare(facts).relations.filter(edge=>edge.relation==='calls').length,0);
 const explicit={...facts,units:[...facts.units.slice(0,-1),{...site,binding:{kind:'relative-import' as const,module:'./target.ts',name:'target'}}]};
 assert.equal(domainService.compare(explicit).relations.filter(edge=>edge.relation==='calls').length,1);
});
