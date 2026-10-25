import type { ReadingFocus } from './reading.ts';

type ComparedHunk = {
  rows: readonly { kind: string; beforeLine: number | null; afterLine: number | null }[];
};

// Select actual changed rows, not overlapping context lines from a nearby hunk.
export const focusedComparison = (hunks: readonly ComparedHunk[], focus: ReadingFocus): number | null => {
  const side = focus.preferredSide;
  const index = hunks.findIndex(hunk => hunk.rows.some(row => {
    const line = side === 'before' ? row.beforeLine : row.afterLine;
    return row.kind !== 'context' && line !== null
      && focus[side].some(range => line >= range.startLine && line <= range.endLine);
  }));
  return index < 0 ? null : index;
};
