import test from 'node:test';
import assert from 'node:assert/strict';
import diffs from '../diffs.json' with { type: 'json' };
import { changeStops, splitRows } from '../change-rail.ts';
test('actual native hunks classify pure additions/removals and replacements independently from file status', () => {
  const helper = changeStops(diffs.files.find(f => f.path === 'src/application/local-access.ts')!);
  assert.equal(helper[0]?.kind, 'added');
  const dev = changeStops(diffs.files.find(f => f.path === 'scripts/dev.ts')!);
  assert.equal(dev[0]?.kind, 'removed');
  assert.ok(dev.some(s => s.kind === 'modified'));
  assert.ok(dev.length > 1);
  for (const f of diffs.files) {
    const stops = changeStops(f);
    assert.equal(stops.length, f.hunks.length);
    let previous = -1;
    for (const [i, stop] of stops.entries()) {
      assert.ok(stop.position > previous && stop.position > 0 && stop.position < 1);
      previous = stop.position;
      assert.ok(stop.label.includes(f.path));
      assert.ok(stop.label.includes('Before'));
      assert.ok(stop.label.includes('After'));
      assert.equal(stop.index, i);
    }
  }
});
test('split pairs only native change blocks and keeps both source inventories lossless', () => {
  for (const file of diffs.files)
    for (const hunk of file.hunks) {
      const paired = splitRows(hunk.rows);
      assert.deepEqual(paired.flatMap(r => r.before ? [
        r.before
      ] : []), hunk.rows.filter(r => r.beforeLine !== null));
      assert.deepEqual(paired.flatMap(r => r.after ? [
        r.after
      ] : []), hunk.rows.filter(r => r.afterLine !== null));
      for (const r of paired)
        if (r.before?.kind === 'context')
          assert.equal(r.before, r.after);
    }
});
