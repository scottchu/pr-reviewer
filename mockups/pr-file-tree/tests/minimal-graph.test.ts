import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { minimalGraph, codeChange, testChange, allEntities, allRelations } from '../minimal-graph.ts';

test('minimum graph preserves exact function/call identities and declaration locations', () => {
  const core = minimalGraph.data.evidence;
  const request = allEntities().find(node => node.id === 'request-before');
  assert.equal(request?.data.canonicalId, core.functions.requestBefore.canonicalPacketId);
  const helper = allRelations().find(edge => edge.from === 'request-after' && edge.relation === 'calls');
  assert.ok(core.calls.some(call => call.canonicalPacketId === helper?.data.canonicalId));
  const location = allRelations().find(edge => edge.from === 'request-before' && edge.relation === 'located_in');
  assert.deepEqual(location?.data.range, { startLine: 24, endLine: 32 });
  assert.equal(location?.data.commit, core.comparison.baseSha);
});

test('identity-bearing code/test graphs retain comparison and actual indirect verification', () => {
  assert.ok(allRelations().some(edge => edge.relation === 'before'));
  assert.ok(allRelations().some(edge => edge.relation === 'after'));
  assert.ok(allRelations().some(edge => edge.from === 'request-before' && edge.relation === 'constructs'));
  assert.ok(allRelations().some(edge => edge.from === 'request-after' && edge.relation === 'calls'));
  assert.ok(allRelations().find(edge => edge.relation === 'motivated_by')?.data.basis);
  assert.ok(codeChange.nodes?.some(node => node.id === 'request-before'));
  assert.ok(codeChange.edges?.some(edge => edge.relation === 'after'));
  assert.ok(testChange.nodes?.some(node => node.kind === 'test'));
  const verification = allRelations().find(edge => edge.relation === 'verifies');
  assert.equal(verification?.from, testChange.id);
  assert.equal(verification?.to, codeChange.id);
  assert.match(String(verification?.data.basis), /indirect/);
  assert.equal(verification?.data.execution, 'not run');
  assert.equal(minimalGraph.data.preparedTest.versions.head.definition.startLine, 140);
  assert.equal(minimalGraph.data.preparedTest.versions.base.definition.endLine, 244);
});

test('minimum entry imports no legacy application shell or owner UI', () => {
  const entry = readFileSync(new URL('../minimal-main.tsx', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /src="\/minimal-main.tsx"/);
  assert.doesNotMatch(entry, /owner-panels|file-diff|review-context|workspace-actions|createReviewWorkspace|main\.tsx['"]/);
});
