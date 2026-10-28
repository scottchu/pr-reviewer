import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSourceFacts} from '../prepare-source-facts.ts';
import {prepareAppGraph} from '../prepare-app-graph.ts';
import {allEntities} from '../source-graph.ts';

test('actual screenshot documents select true minus and plus rows in the default edit preview', () => {
  for (const path of ['docs/product/architecture.md', 'docs/product/review-loop/story-and-exploration.md']) {
    const group = allEntities().find(entity => entity.data.documentPath === path)!;
    const composition = group.data.editComposition as {status:string; added:number; removed:number; rows:{kind:string;text:string}[]};
    assert.ok(composition, path);
    assert.equal(composition.status, 'change');
    assert.ok(composition.added > 0 && composition.removed > 0);
    assert.ok(composition.rows.some(row => row.kind === 'remove'));
    assert.ok(composition.rows.some(row => row.kind === 'add'));
  }
});

test('actual mixed controlled-host test exposes four removed actions plus added source independently of assertion admission', async () => {
  const facts = await prepareSourceFacts('scottchu/pr-reviewer', 'b096826e31c0927190806de91ed70b8b64aa93d8', 'e3b270e5f49a9215452b0b86702946043e979059');
  const graph = prepareAppGraph(facts, 'fixture');
  const group = graph.entities.find(entity => entity.nodes?.some(child => child.kind === 'test' && String(child.data.name).startsWith('01-A/C/F/G controlled host')))!;
  const composition = group.data.editComposition as {status:string; added:number; removed:number; rows:{kind:string; text:string; beforeLine:number|null}[]};
  assert.ok(composition);
  assert.equal(composition.status, 'change');
  assert.equal(composition.removed, 4);
  assert.ok(composition.added > 0);
  const removed = composition.rows.filter(row => row.kind === 'remove');
  assert.equal(removed.filter(row => row.text.includes('Local access token')).length, 2);
  assert.equal(removed.filter(row => row.text.includes('Open review')).length, 2);
  assert.ok(removed.every(row => row.beforeLine! >= 146 && row.beforeLine! <= 244));
  assert.ok(group.nodes!.some(child => child.kind === 'evidence' && child.data.editComposition));
});


test('scoped edit truth table keeps existing entity presence separate, and rejects missing evidence', async () => {
  const {scopedEditComposition, editCategory} = await import('../edit-composition.ts');
  const {sourceHash} = await import('../source-facts.ts');
  for (const [added, removed, status] of [[0,0,'no change'],[2,0,'add'],[0,2,'remove'],[2,3,'change']] as const)
    assert.equal(editCategory(added, removed), status);
  const fixture = (patch:string, before:string, after:string) => {
    const sides = (['base','head'] as const).map(side => ({side, commit:(side==='base'?'a':'b').repeat(40),
      available:true, disposition:'text', contentHash:sourceHash(side==='base'?before:after)}));
    const file = {id:'fixture',path:'src/a.ts',nativeStatus:'M',comparisonStatus:'change',patch,patchHash:sourceHash(patch),sides};
    const witnesses = sides.map(side => ({anchor:{...side,path:file.path,startLine:1,endLine:(side.side==='base'?before:after).trimEnd().split('\n').length},sourceText:side.side==='base'?before:after}));
    const entity = {id:'existing',kind:'function',data:{comparisonStatus:'change',sourceWitnesses:witnesses}};
    const facts = {files:[file],contextFiles:[]} as unknown as import('../compile-source-graph.ts').FactDocument;
    return {entity,facts};
  };
  const before = 'const fn=()=>{\n};\n', after = 'const fn=()=>{\n  added();\n};\n';
  const plus = fixture('@@ -1,2 +1,3 @@\n const fn=()=>{\n+  added();\n };\n', before, after);
  const original = JSON.stringify(plus);
  assert.equal(scopedEditComposition(plus.entity,plus.facts).status,'add');
  assert.equal(plus.entity.data.comparisonStatus,'change');
  assert.equal(plus.entity.data.sourceWitnesses.length,2);
  assert.equal(JSON.stringify(plus),original);
  const minus = fixture('@@ -1,3 +1,2 @@\n const fn=()=>{\n-  added();\n };\n',after,before);
  assert.equal(scopedEditComposition(minus.entity,minus.facts).status,'remove');
  const unchanged = fixture('@@ -1,2 +1,2 @@\n const fn=()=>{\n };\n',before,before);
  assert.equal(scopedEditComposition(unchanged.entity,unchanged.facts).status,'no change');
  assert.equal(scopedEditComposition({...plus.entity,data:{comparisonStatus:'change'}},plus.facts).status,'unresolved');
  assert.equal(scopedEditComposition(plus.entity,{...plus.facts,files:[{...plus.facts.files[0]!,patch:null}]}).status,'unresolved');
  const primitive = {...plus.entity,data:{comparisonStatus:'change',occurrences:plus.entity.data.sourceWitnesses.map(witness=>witness.anchor)}};
  assert.equal(scopedEditComposition(primitive,plus.facts).status,'add');
  const outer = {...plus.entity,data:{...plus.entity.data,sourceWitnesses:plus.entity.data.sourceWitnesses.map(witness=>({...witness,anchor:{...witness.anchor,startLine:1,endLine:1},sourceText:'const fn=()=>{' }))}};
  assert.equal(scopedEditComposition(outer,plus.facts).status,'no change');
});

test('mixed presentation always retains both categories, scoped rows and neutral context instead of counts inferred from children', async () => {
  const {editPreview} = await import('../minimal-projection.ts');
  const entities = allEntities();
  for (const entity of entities) {
    const composition = entity.data.editComposition as import('../edit-composition.ts').EditComposition | undefined;
    if (!composition || composition.status !== 'change') continue;
    assert.ok(composition.added > 0 && composition.removed > 0,entity.id);
    const preview = editPreview(composition);
    assert.ok(preview.added.length && preview.removed.length,entity.id);
    assert.ok(preview.added.every(row=>row.kind==='add'&&row.beforeLine===null));
    assert.ok(preview.removed.every(row=>row.kind==='remove'&&row.afterLine===null));
    assert.ok(preview.added.length<=4&&preview.removed.length<=4);
  }
  const controlled = entities.find(entity => entity.nodes?.some(child=>child.kind==='test'&&String(child.data.name).startsWith('01-A/C/F/G controlled host')))!;
  assert.equal(editPreview(controlled.data.editComposition as import('../edit-composition.ts').EditComposition).removed.length,4);
});


test('same source body stays neutral when another expression changes on the same native row',async()=>{
  const {scopedEditComposition}=await import('../edit-composition.ts');
  const {sourceHash}=await import('../source-facts.ts');
  const before='const fn=()=>1; const other=1;\n',after='const fn=()=>1; const other=2;\n';
  const patch='@@ -1 +1 @@\n-const fn=()=>1; const other=1;\n+const fn=()=>1; const other=2;\n';
  const sides=(['base','head'] as const).map(side=>({side,commit:(side==='base'?'a':'b').repeat(40),available:true,disposition:'text',contentHash:sourceHash(side==='base'?before:after)}));
  const file={id:'one',path:'src/a.ts',nativeStatus:'M',comparisonStatus:'change',patch,patchHash:sourceHash(patch),sides};
  const entity={id:'fn',kind:'function',data:{comparisonStatus:'no change',sourceWitnesses:sides.map(side=>({anchor:{...side,path:file.path,startLine:1,endLine:1},sourceText:'()=>1'}))}};
  const facts={files:[file],contextFiles:[]} as unknown as import('../compile-source-graph.ts').FactDocument;
  assert.equal(scopedEditComposition(entity,facts).status,'no change');
  const unchangedContext={...file,comparisonStatus:'no change',sides:[sides[0]!,{...sides[1]!,contentHash:sides[0]!.contentHash}]};
  assert.equal(scopedEditComposition({id:'context',kind:'file',data:{path:file.path}}, {files:[],contextFiles:[unchangedContext]} as unknown as import('../compile-source-graph.ts').FactDocument).status,'no change');
});
