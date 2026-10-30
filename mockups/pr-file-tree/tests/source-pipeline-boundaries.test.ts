import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript-analysis';
import {createHash} from 'node:crypto';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import {extractPreparedComparison,assemblePreparedResult} from '../../../src/review-graph/preparation/run.ts';
import type {SourceSnapshot,SourceInput,FactDocument,GraphEntity} from '../../../src/review-graph/domain/types.ts';
const root=fileURLToPath(new URL('../../../src/review-graph/',import.meta.url));
const files=(folder:string):string[]=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(resolve(folder,entry.name)):/\.tsx?$/.test(entry.name)?[resolve(folder,entry.name)]:[]);
const imports=(file:string)=>{
 const ast=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 return ast.statements.flatMap(statement=>{
  if(!ts.isImportDeclaration(statement)&&!ts.isExportDeclaration(statement))return [];
  const spec=statement.moduleSpecifier;if(!spec||!ts.isStringLiteral(spec))return [];
  const clause=ts.isImportDeclaration(statement)?statement.importClause:undefined;
  const bindings=clause?.namedBindings;
  const typeOnly=(ts.isExportDeclaration(statement)&&statement.isTypeOnly)||clause?.isTypeOnly||(bindings&&ts.isNamedImports(bindings)&&!clause?.name&&bindings.elements.every(item=>item.isTypeOnly));
  return [{specifier:spec.text,typeOnly:Boolean(typeOnly)}];
 });
};

test('recursive owning dependency direction and browser runtime closure exclude prototype/parser/provider policies',()=>{
 const all=files(root);assert.ok(all.length>20);
 for(const file of all)for(const item of imports(file)){
  if(file.includes('/domain/'))assert.doesNotMatch(item.specifier,/mockups|preparation|experience|\/ui\/|react|source-acquisition/);
  if(file.includes('/experience/'))assert.doesNotMatch(item.specifier,/mockups|\/ui\/|typescript-analysis|node:|\/read\/|\/parse\//);
  if(!file.endsWith('/ui/components/ReviewGraph.tsx'))assert.doesNotMatch(item.specifier,/mockups/);
 }
 const visited=new Set<string>();
 const visit=(file:string)=>{if(visited.has(file))return;visited.add(file);for(const item of imports(file).filter(item=>!item.typeOnly)){
  assert.doesNotMatch(item.specifier,/^node:|typescript-analysis/,'browser runtime import '+file);
  if(item.specifier.startsWith('.')&&/\.tsx?$/.test(item.specifier))visit(resolve(dirname(file),item.specifier));
 }};
 visit(resolve(root,'ui/components/ReviewGraph.tsx'));
 visit(resolve(root,'ui/session.ts'));
 assert.ok(visited.has(resolve(root,'experience/service.ts')));
 assert.ok(visited.has(resolve(root,'ui/projection.ts')));
 const renderer=readFileSync(resolve(root,'ui/components/ReviewGraph.tsx'),'utf8');
 assert.match(renderer,/previous\.expand\(id,hide\)/);assert.match(renderer,/previous\.inspect\(id,open\)/);
 for(const item of imports(resolve(root,'ui/components/ReviewGraph.tsx'))) assert.doesNotMatch(item.specifier,/domain|parse|experience/);
 const session=readFileSync(resolve(root,'ui/session.ts'),'utf8');assert.match(session,/experienceService\.handleIntent/);assert.match(session,/projectExperience\(state\)/);
 assert.doesNotMatch(renderer,/cardRows\(|edgeRows\(|presentationStatus\(|iconFor\(|editPreview\(|editCaption\(/);
});

const content='const f=()=>1;\n';
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const source:SourceInput={repository:'example/repo',side:'head',path:'src/a.ts',commit:'b'.repeat(40),gitBlob:'c'.repeat(40),content,contentHash:hash(content)};
const snapshot=(patch:string):SourceSnapshot=>({format:'manual',producer:{version:'manual',parser:'typescript',sourceHashes:{}},repository:'example/repo',base:'a'.repeat(40),head:'b'.repeat(40),files:[{id:'file',path:'src/a.ts',nativeStatus:'A',comparisonStatus:'add',sides:[{side:'base',commit:'a'.repeat(40),available:false},{side:'head',commit:source.commit,available:true,contentHash:source.contentHash,disposition:'text'}],patch,patchHash:hash(patch)}],contextFiles:[],coverage:{},sources:[source]});

test('failed native parse survives extraction and cached classification does not retry the parser',()=>{
 const input=snapshot('@@ -0,0 +1,2 @@\n+const f=()=>1;\n');
 const parsed=domainService.parseSnapshot(input);
 assert.deepEqual(parsed.nativeDiagnostics,[{fileId:'file',reason:'document_patch_hunk_count_mismatch'}]);
 const extracted=extractPreparedComparison(parsed);
 assert.deepEqual(extracted.nativeDiagnostics,parsed.nativeDiagnostics);
 const edited=extracted.editCompositions.get('file:file')!;
 assert.equal(edited.status,'unresolved');assert.equal(edited.reason,'document_patch_hunk_count_mismatch');
 const noRetry={...extracted.facts,files:[{...extracted.facts.files[0]!,get patch():never{throw new Error('parser_retried');}}]};
 const result=domainService.classifyEdits(extracted.comparison.entities.find(entity=>entity.kind==='file')!,noRetry,parsed.nativeDiffs,parsed.nativeDiagnostics);
 assert.equal(result.reason,'document_patch_hunk_count_mismatch');
});

test('enrichment failure leaves source graph usable and forbidden claims cannot smuggle nested facts or relationships',()=>{
 const parsed=domainService.parseSnapshot(snapshot('@@ -0,0 +1 @@\n+const f=()=>1;\n'));
 const extracted=extractPreparedComparison(parsed);
 const before=JSON.stringify(extracted.facts);
 const restored=assemblePreparedResult({status:'failed',stage:'enrich',error:new Error('unavailable'),facts:extracted.facts,source:extracted},facts=>hash(JSON.stringify(facts)));
 assert.equal(restored.enrichmentStatus,'unavailable');
 domainService.validateGraph(restored.graph.entities,restored.graph.relations);
 assert.ok(restored.graph.entities.some(entity=>entity.kind==='file'));
 assert.equal(JSON.stringify(extracted.facts),before);
 const claim:GraphEntity={id:'reason',kind:'reason',data:{basis:'manual',sourceRefs:[{repository:source.repository,path:source.path,side:'head',commit:source.commit,contentHash:source.contentHash,startLine:1,endLine:1}]}};
 assert.equal(domainService.validateEnrichment(extracted.facts,extracted.comparison.entities,{nodes:[claim],edges:[]},[source]).nodes[0],claim);
 assert.throws(()=>domainService.validateEnrichment(extracted.facts,[],{nodes:[{...claim,nodes:[{id:'invented',kind:'function',data:{}}]}],edges:[]}),/nested_payload/);
 assert.throws(()=>domainService.validateEnrichment(extracted.facts,[],{nodes:[{...claim,edges:[{id:'fake',from:'x',to:'y',version:'after',relation:'calls',data:{}}]}],edges:[]}),/nested_payload/);
 for(const update of [{commit:'wrong'},{contentHash:'wrong'},{endLine:10},{endLine:1.5}]){
  const refs=claim.data.sourceRefs as Record<string,unknown>[];
  assert.throws(()=>domainService.validateEnrichment(extracted.facts,[],{nodes:[{...claim,data:{...claim.data,sourceRefs:[{...refs[0],...update}]}}],edges:[]},[source]),/enrichment_source_/);
 }
 assert.throws(()=>domainService.validateEnrichment(extracted.facts,extracted.comparison.entities,{nodes:[{id:extracted.comparison.entities[0]!.id,kind:'reason',data:{basis:'override'}}],edges:[]}),/override/);
});

test('malformed Markdown assembly retains the file and diagnostic without retrying failed native parsing',()=>{
 const prior=snapshot('@@ -0,0 +1,2 @@\n+# source\n');
 const input={...prior,files:prior.files.map(file=>({...file,path:'docs/a.md'}))};
 const parsed=domainService.parseSnapshot(input);
 const extracted=extractPreparedComparison(parsed);
 assert.deepEqual(extracted.nativeDiagnostics,[{fileId:'file',reason:'document_patch_hunk_count_mismatch'}]);
 const assembled=assemblePreparedResult({status:'failed',stage:'enrich',error:new Error('unavailable'),facts:extracted.facts,source:extracted},facts=>hash(JSON.stringify(facts)));
 assert.equal(assembled.enrichmentStatus,'unavailable');
 assert.deepEqual(assembled.nativeDiagnostics,extracted.nativeDiagnostics);
 const file=assembled.graph.entities.find(entity=>entity.kind==='file'&&entity.data.path==='docs/a.md')!;
 assert.ok(file);
 assert.equal((file.data.editComposition as {status:string}).status,'unresolved');
 assert.equal(assembled.graph.entities.some(entity=>entity.data.documentPath==='docs/a.md'),false);
 domainService.validateGraph(assembled.graph.entities,assembled.graph.relations);
});
