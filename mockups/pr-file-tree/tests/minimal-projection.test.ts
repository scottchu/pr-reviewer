import { test } from 'node:test';
import assert from 'node:assert/strict';
import { minimalGraph as source } from '../minimal-graph.ts';
import { comparisonGraph, allEntities, allRelations, pairUnchangedLocations } from '../comparison-graph.ts';
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
  const locations = comparisonGraph.data.definitionLocations;
  assert.equal(locations.length, 2);
  assert.ok(locations.every(edge => edge.to === 'review-file'));
  assert.deepEqual(locations.map(edge => edge.data.range), [{ startLine: 24, endLine: 32 }, { startLine: 25, endLine: 33 }]);
  assert.ok(allRelations().some(edge => edge.from === 'request' && edge.version === 'before' && edge.relation === 'constructs'));
  assert.ok(allRelations().some(edge => edge.from === 'request' && edge.version === 'after' && edge.relation === 'contains_call'));
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
  assert.equal(allEntities().find(entity => entity.id === 'header-value')?.data.comparisonStatus, 'remove');
  assert.equal(allEntities().find(entity => entity.id === 'goal')?.data.comparisonStatus, undefined);
  assert.equal(allRelations().filter(omittedStructuralEdge).length, 5);
});

test('kind-driven rows keep short commit/range and clearly describe unexecuted assertions', () => {
  const file = allEntities().find(entity => entity.id === 'review-file');
  assert.ok(file);
  assert.deepEqual(cardRows(file), { title: 'src/application/review.ts', rows: ['change'] });
  const before = allRelations().find(edge => edge.from === 'header-value' && edge.relation === 'located_in' && edge.version === 'before');
  assert.ok(before);
  assert.deepEqual(edgeRows(before), { title: 'located in', rows: ['b096826', 'L29–29'] });
  const assertions = allEntities().find(entity => entity.id === 'new-test-assertions');
  assert.ok(assertions);
  assert.match(cardRows(assertions).rows.join(' '), /Asserts API requests/);
  assert.doesNotMatch(cardRows(assertions).rows.join(' '), /Observed API requests/);
});

 test('all prepared calls derive comparison relations and exact content locations', () => {
 const relations = allRelations();
 const refresh = relations.find(edge => edge.from === 'refresh' && edge.relation === 'calls');
 assert.ok(refresh); assert.equal(refresh.version, 'comparison'); assert.equal(refresh.data.comparisonStatus, 'no change');
 const facts = refresh.data.sourceCalls as typeof source.data.evidence.calls;
 assert.equal(facts.length, 2); assert.deepEqual(facts.map(fact => fact.mappedSnapshotSite.startLine).sort(), [37,38]);
 assert.ok(facts.every(fact => fact.certainty === 'source_observed_manual'));
 const site = allEntities().find(entity => entity.kind === 'callsite'); assert.ok(site);
 const location = relations.find(edge => edge.from === site.id && edge.relation === 'located_in');
 assert.equal(location?.to, 'review-file'); assert.deepEqual(location?.data.range, {startLine:30,endLine:30});
 const header = relations.find(edge => edge.from === 'header-value' && edge.relation === 'located_in');
 assert.equal(header?.to, 'review-file'); assert.deepEqual(header?.data.range, {startLine:29,endLine:29});
 const helper = relations.find(edge => edge.from === 'helper' && edge.relation === 'located_in');
 assert.equal(helper?.to,'helper-file'); assert.deepEqual(helper?.data.range,{startLine:3,endLine:3});
 const refreshHomes = relations.filter(edge => edge.from === 'refresh' && edge.relation === 'located_in');
 assert.equal(refreshHomes.length,1); assert.equal(refreshHomes[0]?.version,'comparison'); assert.equal(refreshHomes[0]?.data.comparisonStatus,'no change');
 const witnesses = refreshHomes[0]?.data.witnesses as {data:{range:unknown}}[]; assert.deepEqual(witnesses.map(edge => edge.data.range),[{startLine:34,endLine:44},{startLine:35,endLine:45}]);
 assert.ok(refreshHomes.every(edge => edge.to === 'review-file'));
 assert.equal(allEntities().find(entity => entity.id === 'request')?.data.comparisonStatus,'change');
 assert.equal(allEntities().find(entity => entity.id === 'review-file')?.data.comparisonStatus,'change');
 for(const entity of allEntities().filter(entity => ['function','callsite','header','test','assertion','source_step'].includes(entity.kind))) {
 assert.ok(relations.some(edge => edge.from === entity.id && ['located_in','defined_in'].includes(edge.relation)),entity.id+' has File evidence');
 }
 });

test('unchanged locations retain both witness records without merging unsupported comparisons', () => {
 const edge = allRelations().find(edge => edge.from === 'refresh' && edge.relation === 'located_in')!;
 const witnesses = edge.data.witnesses as typeof edge[];
 assert.equal(witnesses[0]?.data.commit, source.data.evidence.comparison.baseSha);
 assert.equal(witnesses[1]?.data.commit, source.data.evidence.comparison.headSha);
 assert.equal(edgeRows(edge).title,'located in · no change');
 assert.deepEqual(edgeRows(edge).rows,['Before b096826 L34–44','After e3b270e L35–45']);
 assert.equal(pairUnchangedLocations(witnesses,new Set()).length,2);
 const reversed=pairUnchangedLocations([...witnesses].reverse(),new Set(['refresh']));assert.equal(reversed.length,1);assert.deepEqual(reversed[0]?.data.witnesses,witnesses);
 const changed = witnesses.map(witness=>({...witness,from:'modified-test'}));
 assert.equal(pairUnchangedLocations(changed,new Set(['refresh'])).length,2);
 assert.equal(allRelations().filter(edge=>edge.from==='owner-journey-test'&&edge.relation==='located_in').length,2);
});

test('removed Authorization content is scoped to direct construction, not all headers',()=>{
 const header=allEntities().find(entity=>entity.id==='header-value')!;assert.equal(header.data.comparisonStatus,'remove');
 assert.match(String(header.data.statusScope),/explicit-credential helper still produces/);assert.match(cardRows(header).rows.join(' '),/Direct request construction only/);
 assert.ok(allRelations().some(edge=>edge.relation==='calls'&&edge.to==='helper'));
});
