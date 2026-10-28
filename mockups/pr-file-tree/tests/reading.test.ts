import test from 'node:test';
import assert from 'node:assert/strict';
import { rememberFile } from '../reading.ts';
test('separate file reading snapshots survive another workspace and remain immutable', () => {
  const a = {
    active: 2,
    top: 123,
    horizontal: {
      2: 87
    },
    mode: 'unified' as const,
    folds: [
      'context:a:1'
    ]
  };
  const initial = rememberFile({}, 'a.ts', a);
  const b = rememberFile(initial, 'b.ts', {
    active: 0,
    top: 40,
    horizontal: {},
    mode: 'split'
  });
  assert.deepEqual(b['a.ts'], a);
  assert.deepEqual(initial, {
    'a.ts': a
  });
  a.horizontal[2] = 999;
  assert.equal(b['a.ts']!.horizontal[2], 87);
  a.folds.push('later');
  assert.deepEqual(b['a.ts']!.folds, [
    'context:a:1'
  ]);
});
