import {test} from 'node:test';
import assert from 'node:assert/strict';
import {edgeRows} from '../minimal-projection.ts';
import {allEntities, visibleSourceGraph} from '../source-graph.ts';
import type {GraphRelation} from '../minimal-graph.ts';
const view = visibleSourceGraph({});

test('actual Before constructs and reduced After calls each have meaning, scope and exact source provenance', () => {
  const before = view.relations.find(edge=>edge.from==='request'&&edge.relation==='constructs')!;
  const after = view.relations.find(edge=>edge.from==='request'&&edge.relation==='calls')!;
  const beforeCard = edgeRows(before,allEntities());
  assert.match(beforeCard.rows.join(' '),/Before b096826.*src\/application\/review.ts.*L29/);
  assert.match(beforeCard.rows.join(' '),/Direct request construction only/);
  assert.match(beforeCard.rows.join(' '),/Not global header removal/);
  assert.match(beforeCard.explanation,/constructs/i);
  const afterCard = edgeRows(after,allEntities());
  assert.match(afterCard.explanation,/source.*call/i);
  assert.match(afterCard.rows.join(' '),/After e3b270e.*src\/application\/review.ts.*L30/);
  assert.match(afterCard.rows.join(' '),/accessHeaders\(captured\)/);
});

test('unchanged combined source witnesses retain symmetric full paths/ranges and no runtime-stability claim', () => {
  const edge = view.relations.find(edge=>edge.from==='refresh'&&edge.relation==='located_in')!;
  const card = edgeRows(edge,allEntities());
  assert.match(card.provenance.join(' '),/Before b096826.*src\/application\/review.ts.*L34–44/);
  assert.match(card.provenance.join(' '),/After e3b270e.*src\/application\/review.ts.*L35–45/);
  assert.match(card.scope.join(' '),/not runtime/i);
});

test('every current relation kind goes through the same reading fields and reports missing evidence honestly', () => {
  const kinds = new Set([...view.relations.map(edge=>edge.relation),'before','after','contains_call','defined_in','absence_checked_in','verifies']);
  for (const relation of kinds) {
    const edge:GraphRelation = {id:'missing',from:'a',to:'b',version:'comparison',relation,data:{}};
    const card = edgeRows(edge,[]);
    assert.ok(card.explanation.length,relation);
    assert.deepEqual(card.provenance,['Source provenance unavailable'],relation);
    assert.ok(card.rows.includes(card.explanation),relation);
  }
  for (const edge of view.relations) {
    const card = edgeRows(edge,allEntities());
    assert.ok(card.explanation.length,edge.id);
    assert.ok(card.provenance.length,edge.id);
    assert.ok(card.provenance.every(row=>card.rows.includes(row)),edge.id);
  }
});
