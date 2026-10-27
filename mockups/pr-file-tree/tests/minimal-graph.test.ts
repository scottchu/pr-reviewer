import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { minimalGraph } from '../minimal-graph.ts';

test('minimum graph preserves exact function/call identities and declaration locations', () => {
  const core = minimalGraph.data.evidence;
  const request = minimalGraph.nodes.find(node => node.id === 'request-before');
  assert.equal(request?.data.canonicalId, core.functions.requestBefore.canonicalPacketId);
  const helper = minimalGraph.edges.find(edge => edge.from === 'request-after' && edge.relation === 'calls');
  assert.ok(core.calls.some(call => call.canonicalPacketId === helper?.data.canonicalId));
  const location = minimalGraph.edges.find(edge => edge.from === 'request-before' && edge.relation === 'located_in');
  assert.deepEqual(location?.data.range, { startLine: 24, endLine: 32 });
  assert.equal(location?.data.commit, core.comparison.baseSha);
});

test('comparison, constructs, calls and inferred intent retain different meanings without invented tests', () => {
  assert.ok(minimalGraph.edges.some(edge => edge.relation === 'before'));
  assert.ok(minimalGraph.edges.some(edge => edge.relation === 'after'));
  assert.ok(minimalGraph.edges.some(edge => edge.from === 'request-before' && edge.relation === 'constructs'));
  assert.ok(minimalGraph.edges.some(edge => edge.from === 'request-after' && edge.relation === 'calls'));
  assert.ok(minimalGraph.edges.find(edge => edge.relation === 'motivated_by')?.data.basis);
  assert.equal(minimalGraph.nodes.some(node => String(node.kind) === 'test'), false);
  assert.match(minimalGraph.data.scope, /Tests are not prepared/);
});

test('minimum entry imports no legacy application shell or owner UI', () => {
  const entry = readFileSync(new URL('../minimal-main.tsx', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /src="\/minimal-main.tsx"/);
  assert.doesNotMatch(entry, /owner-panels|file-diff|review-context|workspace-actions|createReviewWorkspace|main\.tsx['"]/);
});
