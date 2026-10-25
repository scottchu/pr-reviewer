import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCalls, relevantTests } from '../calls.ts';
test('selected review and storage seeds retain only incident one-hop calls and both source sides', () => {
  const review = projectCalls('src/application/review.ts');
  assert.equal(review.seeds.length, 2);
  assert.equal(review.links.length, 13);
  assert.deepEqual(new Set(review.seeds.map(seed => seed.declaration.side)), new Set([
    'base', 'head'
  ]));
  assert.ok(review.links.every(link => link.certainty === 'source_observed_manual'));
  assert.ok(review.links.every(link => review.seeds.some(seed => seed.id === link.caller || seed.id === link.callee)));
  assert.ok(review.nodes.some(node => node.name === 'refresh' && node.sourceUnchanged));
  assert.ok(!review.nodes.some(node => node.declaration.path === 'src/application/analysis.ts'));
  const storage = projectCalls('src/storage/public.ts');
  assert.equal(storage.links.length, 5);
  assert.ok(storage.links.every(link => link.certainty === 'resolved_static'));
  assert.ok(storage.nodes.every(node => node.declaration.path.startsWith('src/storage/')));
  assert.equal(projectCalls('src/ui/main.tsx').prepared, false);
});
test('declared tests use exact function identity and preserve missing mappings and unrun results', () => {
  const request = projectCalls('src/application/review.ts').seeds.find(seed => seed.declaration.side === 'head')!;
  assert.deepEqual(relevantTests(request.id).map(record => record.id), [
    'review-owner-changed'
  ]);
  const helper = projectCalls('src/application/local-access.ts').seeds[0]!;
  assert.deepEqual(relevantTests(helper.id).map(record => record.id), [
    'review-owner-changed'
  ]);
  const storage = projectCalls('src/storage/public.ts');
  const base = storage.seeds.find(seed => seed.declaration.side === 'base')!;
  const head = storage.seeds.find(seed => seed.declaration.side === 'head')!;
  assert.ok(!relevantTests(base.id).some(record => record.id === 'gateway-retained'));
  assert.ok(relevantTests(head.id).some(record => record.id === 'gateway-retained'));
  assert.ok(relevantTests(head.id).every(record => record.execution.result === null));
  assert.deepEqual(relevantTests('unprepared'), []);
});
