import test from 'node:test';
import assert from 'node:assert/strict';
import diffs from '../diffs.json' with { type: 'json' };
import sources from '../full-source.json' with { type: 'json' };
import { continuousSegments, visibleHunk } from '../continuous.ts';
test('continuous hunks plus expandable unchanged intervals reproduce every pinned source line', () => {
  for (const file of diffs.files) {
    const source = sources.files.find(s => s.path === file.path)!;
    const segments = continuousSegments(file, source);
    const rows = segments.flatMap(s => s.rows);
    for (const side of [
      'before', 'after'
    ] as const) {
      const text = source[side];
      const actual = rows.filter(r => r[side === 'before' ? 'beforeLine' : 'afterLine'] !== null).map(r => r.text);
      assert.deepEqual(actual, text === null || text === '' ? [] : text.replace(/\n$/, '').split('\n'));
    }
    assert.deepEqual(segments.filter(s => s.kind === 'hunk').map(s => s.id), file.hunks.map((_, i) => `hunk:${file.path}:${i}`));
  }
});
test('observational current hunk reaches the last range at clamped bottom', () => {
  assert.equal(visibleHunk([
    20, 200, 450, 620
  ], 500, 400, 900), 3);
  assert.equal(visibleHunk([
    20, 200, 450, 620
  ], 210, 400, 900), 1);
});
import contexts from '../function-context.json' with { type: 'json' };
test('changed request discloses the complete callable on both sides before unrelated context', () => {
  const file = diffs.files.find(f => f.path === 'src/application/review.ts')!;
  const source = sources.files.find(f => f.path === file.path)!;
  const context = contexts.files.find(f => f.path === file.path)!;
  assert.ok(context.before.some(r => r.kind === 'function' && r.name === 'request' && r.startLine === 24 && r.endLine === 32));
  assert.ok(context.after.some(r => r.kind === 'function' && r.name === 'request' && r.startLine === 25 && r.endLine === 33));
  const segments = continuousSegments(file, source, context);
  const visible = segments.filter(s => s.kind !== 'fold').flatMap(s => s.rows);
  for (const [side, start, end] of [
    [
      'before', 24, 32
    ], [
      'after', 25, 33
    ]
  ] as const) {
    for (let line = start;line <= end;line++)
      assert.ok(visible.some(r => r[side === 'before' ? 'beforeLine' : 'afterLine'] === line), `${side} ${line}`);
  }
  assert.ok(segments.some(s => s.kind === 'fold'));
});
