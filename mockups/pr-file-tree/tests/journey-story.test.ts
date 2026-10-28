import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { graphFiles, storyReferences, validateAnchor, validateStoryStructure } from '../../../src/domain/public.ts';
import type { Snapshot } from '../../../src/domain/public.ts';
import { prepareJourneyStory } from '../journey-story.ts';
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

test('prepared request and storage chapters retain exact source references and complete arbitrary-entry scope', () => {
  const story = prepareJourneyStory(snapshot);
  validateStoryStructure(story, snapshot);
  assert.equal(story.chapters.length, 2);
  assert.deepEqual(story.scope.map(row => row.fileKey), graphFiles(snapshot).map(file => file.key));
  assert.equal(story.scope.length, 50);
  assert.equal(story.scope.filter(row => row.type === 'unexplained').length, 45);
  for (const reference of storyReferences(story)) {
    assert.equal(reference.type, 'snapshot_source');
    if (reference.type !== 'snapshot_source') {
      assert.fail('prepared lexical evidence cannot invent admitted static relations');
    }
    assert.equal(reference.anchor.snapshotId, snapshot.snapshotId);
    assert.equal(validateAnchor(snapshot.snapshotId, snapshot.sources, reference.anchor), true);
    const source = snapshot.sources.find(item => item.side === reference.anchor.side && item.path === reference.anchor.path);
    assert.equal(source?.hash, reference.contentHash);
  }
});

test('unchanged caller context preserves both occurrences and explicitly qualifies its consequence', () => {
  const story = prepareJourneyStory(snapshot);
  const claim = story.claims.find(item => item.id === 'refresh-consequence')!;
  assert.equal(claim.basis, 'inference');
  assert.match(claim.uncertainty!, /not an executed request/);
  const step = story.steps.find(item => item.id === 'refresh')!;
  assert.equal(step.focus.type, 'sources');
  if (step.focus.type !== 'sources') {
    assert.fail('unchanged caller must retain exact source focus');
  }
  assert.deepEqual(step.focus.sources.map(reference => reference.anchor.side), ['base', 'head']);
  const excerpts = step.focus.sources.map(reference => {
    const source = snapshot.sources.find(item => item.side === reference.anchor.side && item.path === reference.anchor.path)!;
    return source.content.split('\n').slice(reference.anchor.startLine - 1, reference.anchor.endLine).join('\n');
  });
  assert.equal(excerpts[0], excerpts[1]);
  assert.match(excerpts[1]!, /request/);
  assert.equal(story.chapters.every(chapter => chapter.example.scenarioKind === 'source_derived'), true);
});

test('missing requirement, missing storage source or another comparison cannot mint a partial success story', () => {
  assert.throws(() => prepareJourneyStory({
    ...snapshot,
    sources: snapshot.sources.filter(source => source.path !== 'docs/product/review-loop/runtime.md'),
  }), /story_requirement_unavailable/);
  assert.throws(() => prepareJourneyStory({
    ...snapshot,
    sources: snapshot.sources.filter(source => source.path !== 'src/storage/access.ts'),
  }), /story_source_unavailable/);
  assert.throws(() => prepareJourneyStory({ ...snapshot, headSha: snapshot.baseSha }), /comparison_mismatch/);
  assert.equal('versionId' in prepareJourneyStory(snapshot), false);
});
