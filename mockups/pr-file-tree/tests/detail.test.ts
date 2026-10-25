import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import diffs from '../diffs.json' with { type: 'json' };
import paths from '../paths.json' with { type: 'json' };
import { buildTree } from '../tree.ts';
import { detailTransition, detailTree, nearbyFile } from '../detail.ts';
test('all native Git hunk rows and both side hashes are the pinned source, including actual red removals', () => {
  assert.equal(diffs.files.length, 50);
  let added = 0;
  let removed = 0;
  for (const f of diffs.files) {
    for (const side of [
      'before', 'after'
    ] as const) {
      if (!f[side].available)
        continue;
      const source = execFileSync('git', [
        'show', `${f[side].commit}:${f.path}`
      ], {
        encoding: 'utf8'
      });
      assert.equal(createHash('sha256').update(source).digest('hex'), f[side].hash);
      const lines = source.split('\n');
      for (const h of f.hunks)
        for (const r of h.rows) {
          const line = side === 'before' ? r.beforeLine : r.afterLine;
          if (line !== null)
            assert.equal(r.text, lines[line - 1]);
        }
    }
    for (const h of f.hunks)
      for (const r of h.rows) {
        added += r.kind === 'added' ? 1 : 0;
        removed += r.kind === 'removed' ? 1 : 0;
      }
  }
  assert.equal(added, 492);
  assert.equal(removed, 192);
  assert.ok(diffs.files.find(f => f.path === 'scripts/dev.ts')!.hunks.some(h => h.rows.some(r => r.kind === 'removed' && r.text.includes('node:fs'))));
});
test('graph zoom never changes explicit file disclosure', () => {
  let state = {
    expanded: null as string | null,
    lastZoom: 1
  };
  for (const zoom of [
    .4, 2, 1
  ]) {
    state = detailTransition(state, {
      type: 'zoom',
      zoom,
      focal: 'src/application/review.ts'
    });
    assert.equal(state.expanded, null);
  }
  state = detailTransition(state, {
    type: 'focus',
    path: 'src/application/review.ts'
  });
  for (const zoom of [
    .4, 2, 1
  ]) {
    state = detailTransition(state, {
      type: 'zoom',
      zoom,
      focal: null
    });
    assert.equal(state.expanded, 'src/application/review.ts');
  }
});
test('in-place file detail keeps the same origin/ID and all50 files while reserving neighbor space', () => {
  const tree = buildTree(paths.paths, paths.changes);
  const file = tree.nodes.find(n => n.id === 'file:src/application/review.ts')!;
  const expanded = detailTree(tree, file.path, false);
  const n = expanded.nodes.find(n => n.id === file.id)!;
  assert.equal(n.x, file.x);
  assert.equal(n.y, file.y);
  assert.equal(n.width, 760);
  assert.equal(expanded.nodes.filter(n => n.kind === 'file').length, 50);
  assert.deepEqual(expanded.edges, tree.edges);
  for (const other of expanded.nodes) {
    if (other.id === n.id)
      continue;
    assert.ok(n.x + n.width <= other.x || other.x + other.width <= n.x || n.y + n.height <= other.y || other.y + other.height <= n.y);
  }
  assert.deepEqual(detailTree(tree, null, false), tree);
});
