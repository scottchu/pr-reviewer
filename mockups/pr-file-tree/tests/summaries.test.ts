import test from 'node:test';
import assert from 'node:assert/strict';
import diffs from '../diffs.json' with { type: 'json' };
import { summaryFor } from '../summaries.ts';
test('prepared behavior summaries bind the requested native hunks and exact source identities', () => {
  for (const [path, indexes] of [
    [
      'src/storage/public.ts', [
        0, 1, 2
      ]
    ],
    [
      'src/storage/access.ts', [
        0
      ]
    ],
    [
      'src/application/review.ts', [
        2
      ]
    ],
  ] as const) {
    const file = diffs.files.find(file => file.path === path)!;
    for (const index of indexes) {
      const summary = summaryFor(file, index);
      assert.ok(summary);
      assert.ok(summary.identity.includes(file.after.hash!));
      assert.doesNotMatch(summary.what, /native Git hunk|red rows|green rows/);
      assert.ok(summary.why.includes('Source fact:'));
    }
  }
  const unprepared = diffs.files.find(file => file.path === 'src/application/analysis.ts')!;
  assert.equal(summaryFor(unprepared, 0), null);
});
