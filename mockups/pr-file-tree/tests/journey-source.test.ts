import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import type { Snapshot } from '../../../src/domain/public.ts';
import type { CallAnchor } from '../calls.ts';
import { projectCalls } from '../calls.ts';
import { mapJourneySource } from '../journey-source.ts';
import comparison from '../paths.json' with { type: 'json' };
import full from '../full-source.json' with { type: 'json' };

const snapshot: Snapshot = {
  snapshotId: 'test-retained-snapshot',
  repository: 'scottchu/pr-reviewer',
  prUrl: 'https://github.com/scottchu/pr-reviewer/pull/25',
  prNumber: 25,
  baseSha: comparison.base,
  headSha: comparison.head,
  sources: full.files.flatMap(file => (['base', 'head'] as const).flatMap(side => {
    const content = side === 'base' ? file.before : file.after;
    return content === null ? [] : [{
      side,
      path: file.path,
      content,
      hash: createHash('sha256').update(content).digest('hex'),
      lineCount: content.replace(/\n$/, '').split('\n').length,
    }];
  })),
};
const request = projectCalls('src/application/review.ts').seeds.find(node => node.name === 'request' && node.declaration.side === 'head')!.declaration;

test('exact source mapping retains packet identity and returns a separate retained LF reference', () => {
  const original = structuredClone(request);
  const mapped = mapJourneySource(snapshot, request);
  assert.equal(mapped.status, 'ready');
  assert.deepEqual(request, original);
  if (mapped.status !== 'ready') {
    assert.fail('exact pinned request must map');
  }
  assert.equal(mapped.evidence.snapshotId, 'pr25-pinned-call-evidence');
  assert.equal(mapped.reference.anchor.snapshotId, snapshot.snapshotId);
  assert.equal(mapped.reference.contentHash, request.contentHash);
  assert.equal(mapped.reference.anchor.startLine, request.startLine);
  assert.equal(mapped.reference.anchor.endLine, request.endLine);
  assert.equal(mapped.reference.anchor.side, request.side);
});

test('mapping refuses another comparison, missing source, a stale hash and shifted coordinates', () => {
  const failures = [
    mapJourneySource({ ...snapshot, headSha: comparison.base }, request),
    mapJourneySource({ ...snapshot, sources: [] }, request),
    mapJourneySource(snapshot, { ...request, contentHash: '0'.repeat(64) }),
    mapJourneySource(snapshot, { ...request, startLine: request.startLine + 1 }),
    mapJourneySource(snapshot, { ...request, end: Number.MAX_SAFE_INTEGER }),
  ];
  assert.deepEqual(failures.map(result => result.status === 'unavailable' ? result.reason : 'unexpected_ready'), [
    'comparison_mismatch', 'source_unprepared', 'source_hash_mismatch', 'range_mismatch', 'range_mismatch',
  ]);
});

test('mapping preserves independent before/after occurrence identity and rejects split UTF-16 code points', () => {
  for (const seed of projectCalls('src/application/review.ts').seeds) {
    assert.equal(mapJourneySource(snapshot, seed.declaration).status, 'ready');
  }
  const content = 'a😀b\n';
  const source = {
    side: 'head' as const,
    path: 'unicode.ts',
    content,
    lineCount: 1,
    hash: createHash('sha256').update(content).digest('hex'),
  };
  const evidence: CallAnchor = {
    snapshotId: 'packet-local-unicode',
    side: 'head',
    path: source.path,
    contentHash: source.hash,
    start: 1,
    end: 3,
    startLine: 1,
    endLine: 1,
  };
  const target = { ...snapshot, sources: [source] };
  assert.equal(mapJourneySource(target, evidence).status, 'ready');
  for (const invalid of [{ ...evidence, start: 2 }, { ...evidence, end: 2 }]) {
    const mapped = mapJourneySource(target, invalid);
    assert.equal(mapped.status === 'unavailable' && mapped.reason, 'range_mismatch');
  }
});
