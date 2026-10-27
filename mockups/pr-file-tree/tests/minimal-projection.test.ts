import { test } from 'node:test';
import assert from 'node:assert/strict';
import { minimalGraph as source } from '../minimal-graph.ts';
import { comparisonGraph, allEntities, allRelations } from '../comparison-graph.ts';
import { cardRows, edgeRows, omittedStructuralEdge } from '../minimal-projection.ts';

test('explicit compiler emits one function/File/test entity and retains original occurrence evidence', () => {
  const entities = allEntities();
  assert.equal(new Set(entities.map(entity => entity.id)).size, entities.length);
  assert.equal(entities.filter(entity => entity.kind === 'function').length, 3);
  assert.equal(entities.filter(entity => entity.kind === 'file').length, 3);
  assert.equal(entities.filter(entity => entity.kind === 'test').length, 1);
  const request = entities.find(entity => entity.id === 'request');
  assert.ok(request);
  const occurrences = request.data.occurrences as { canonicalId: string }[];
  assert.deepEqual(occurrences.map(value => value.canonicalId), [source.data.evidence.functions.requestBefore.canonicalPacketId, source.data.evidence.functions.requestAfter.canonicalPacketId]);
  assert.equal(comparisonGraph.data.occurrenceInput, source);
  const locations = allRelations().filter(edge => edge.from === 'request' && edge.relation === 'located_in');
  assert.equal(locations.length, 2);
  assert.ok(locations.every(edge => edge.to === 'review-file'));
  assert.deepEqual(locations.map(edge => edge.data.range), [{ startLine: 24, endLine: 32 }, { startLine: 25, endLine: 33 }]);
  assert.ok(allRelations().some(edge => edge.from === 'request' && edge.version === 'before' && edge.relation === 'constructs'));
  assert.ok(allRelations().some(edge => edge.from === 'request' && edge.version === 'after' && edge.relation === 'calls'));
});

test('comparison statuses are scoped/evidenced and never test outcomes or guessed intent status', () => {
  const allowed = new Set(['change', 'no change', 'add', 'remove']);
  for (const entity of allEntities()) {
    if (entity.data.comparisonStatus) {
      assert.ok(allowed.has(String(entity.data.comparisonStatus)));
      assert.ok(entity.data.comparisonBasis);
    }
  }
  assert.equal(allEntities().find(entity => entity.id === 'refresh')?.data.comparisonStatus, 'no change');
  assert.equal(allEntities().find(entity => entity.id === 'helper')?.data.comparisonStatus, 'add');
  assert.equal(allEntities().find(entity => entity.id === 'owner-journey-test')?.data.comparisonStatus, 'change');
  assert.equal(allEntities().find(entity => entity.id === 'header-value')?.data.comparisonStatus, undefined);
  assert.equal(allEntities().find(entity => entity.id === 'goal')?.data.comparisonStatus, undefined);
  assert.equal(allRelations().filter(omittedStructuralEdge).length, 4);
});

test('kind-driven rows keep short commit/range and clearly describe unexecuted assertions', () => {
  const file = allEntities().find(entity => entity.id === 'review-file');
  assert.ok(file);
  assert.deepEqual(cardRows(file), { title: 'src/application/review.ts', rows: ['change'] });
  const before = allRelations().find(edge => edge.from === 'request' && edge.relation === 'located_in' && edge.version === 'before');
  assert.ok(before);
  assert.deepEqual(edgeRows(before), { title: 'located in', rows: ['b096826', 'L24–32'] });
  const assertions = allEntities().find(entity => entity.id === 'new-test-assertions');
  assert.ok(assertions);
  assert.match(cardRows(assertions).rows.join(' '), /Asserts API requests/);
  assert.doesNotMatch(cardRows(assertions).rows.join(' '), /Observed API requests/);
});
