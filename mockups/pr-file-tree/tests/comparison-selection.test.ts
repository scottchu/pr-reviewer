import test from 'node:test';
import assert from 'node:assert/strict';
import { focusedComparison } from '../comparison-selection.ts';
import type { ReadingFocus } from '../reading.ts';

const hunks = [
  { rows: [{ kind: 'context', beforeLine: 25, afterLine: 26 }, { kind: 'added', beforeLine: null, afterLine: 1 }] },
  { rows: [{ kind: 'removed', beforeLine: 29, afterLine: null }, { kind: 'added', beforeLine: null, afterLine: 30 }] }
];
const focus: ReadingFocus = { id: 'exact', path: 'review.ts', name: 'request', before: [], after: [{ startLine: 25, endLine: 33 }], preferredSide: 'after' };
test('exact focus selects intersecting changed rows rather than nearby context', () => {
  assert.equal(focusedComparison(hunks, focus), 1);
  assert.equal(focusedComparison(hunks, { ...focus, before: [{ startLine: 29, endLine: 29 }], after: [], preferredSide: 'before' }), 1);
});
test('unchanged or opposite-side ranges never fabricate a changed comparison', () => {
  assert.equal(focusedComparison(hunks, { ...focus, after: [{ startLine: 26, endLine: 26 }] }), null);
  assert.equal(focusedComparison(hunks, { ...focus, preferredSide: 'before' }), null);
});
