import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { graphFiles, storyReferences, validateAnchor, validateStoryStructure } from '../../../src/domain/public.ts';
import type { Snapshot } from '../../../src/domain/public.ts';
import { prepareChangeImpact } from '../change-impact.ts';
import comparison from '../paths.json' with { type: 'json' };
import full from '../full-source.json' with { type: 'json' };

const snapshot: Snapshot = {
  snapshotId: 'test-retained-pr25-story-input',
  repository: 'scottchu/pr-reviewer',
  prUrl: 'https://github.com/scottchu/pr-reviewer/pull/25',
  prNumber: 25,
  baseSha: comparison.base,
  headSha: comparison.head,
  changedFiles: comparison.paths.map(path => ({
    status: comparison.changes[path as keyof typeof comparison.changes] === 'added' ? 'added' : 'modified',
    oldPath: comparison.changes[path as keyof typeof comparison.changes] === 'added' ? null : path,
    newPath: path,
    dispositions: [],
  })),
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

test('prepared impact is one inference with six exact admitted references and original Change keys', () => {
  const prepared = prepareChangeImpact(snapshot);
  assert.equal(prepared.status, 'ready');
  if (prepared.status !== 'ready') assert.fail('Impact source is unavailable');
  assert.equal(prepared.claim.basis, 'inference');
  assert.equal(prepared.claim.references.length, 6);
  assert.match(prepared.claim.uncertainty!, /not runtime proof/);
  for (const reference of prepared.claim.references) {
    assert.equal(reference.type, 'snapshot_source');
    if (reference.type !== 'snapshot_source') assert.fail();
    assert.equal(reference.anchor.snapshotId, snapshot.snapshotId);
    assert.equal(reference.contentHash, snapshot.sources.find(source => source.path === reference.anchor.path && source.side === reference.anchor.side)!.hash);
    assert.ok(validateAnchor(snapshot.snapshotId, snapshot.sources, reference.anchor));
  }
  assert.ok(graphFiles(snapshot).some(file => file.key === prepared.source.key && file.newPath === 'src/server/public.ts'));
  assert.ok(graphFiles(snapshot).some(file => file.key === prepared.target.key && file.newPath === 'src/application/review.ts'));
});

test('impact refuses another comparison, missing exact source and stale source hash', () => {
  assert.equal(prepareChangeImpact({ ...snapshot, headSha: snapshot.baseSha }).status, 'unavailable');
  assert.equal(prepareChangeImpact({ ...snapshot, sources: snapshot.sources.filter(source => source.path !== 'src/server/public.ts') }).status, 'unavailable');
  assert.equal(prepareChangeImpact({ ...snapshot, sources: snapshot.sources.map(source => source.path === 'src/server/public.ts' ? { ...source, hash: '0'.repeat(64) } : source) }).status, 'unavailable');
});
