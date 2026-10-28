import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allEntities,visibleSourceGraph} from '../source-graph.ts';
import {cardRows} from '../minimal-projection.ts';

test('default code/test groups retain semantic children without unsolicited raw Evidence graph nodes',()=>{
  const groups=visibleSourceGraph({}).nodes.filter(entity=>entity.nodes&&!entity.data.documentPath);
  assert.ok(groups.length>0);
  for(const group of groups) assert.ok(group.nodes!.every(child=>child.kind!=='evidence'),group.id);
  assert.deepEqual(groups.find(group=>group.id==='change')!.nodes!.map(child=>child.id).sort(),['header-value','request']);
  assert.deepEqual(groups.find(group=>group.id==='change:helper')!.nodes!.map(child=>child.id),['helper']);
  assert.equal(allEntities().some(entity=>entity.id.endsWith(':edit-evidence')),false);
  assert.equal(allEntities().filter(entity=>entity.data.documentPath).length,20);
});

test('default function/test statuses are concise while exact source evidence stays on the same entity',()=>{
  const entities=allEntities();
  for(const entity of entities.filter(entity=>['function','test'].includes(entity.kind)))
    assert.ok(cardRows(entity).rows.every(row=>!row.startsWith('Scoped ')),entity.id);
  const test=entities.find(entity=>entity.kind==='test'&&String(entity.data.name).startsWith('01-A/C/F/G controlled host'))!;
  const composition=test.data.editComposition as import('../edit-composition.ts').EditComposition;
  assert.equal(composition.removed,4);
  assert.equal(composition.status,'change');
  assert.equal(composition.rows.filter(row=>row.kind==='remove'&&row.text.includes('Local access token')).length,2);
  assert.equal(composition.rows.filter(row=>row.kind==='remove'&&row.text.includes('Open review')).length,2);
  assert.ok(composition.hunks.length>0);
});
