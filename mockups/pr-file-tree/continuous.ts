import type { FileDiff } from './file-diff.tsx';
export type SourceRow = {
  kind: string;
  beforeLine: number | null;
  afterLine: number | null;
  text: string;
};
export type ContextRange = {
  startLine: number;
  endLine: number;
};
export type FunctionContext = {
  before: readonly ContextRange[];
  after: readonly ContextRange[];
};
export type Segment = {
  id: string;
  kind: 'hunk' | 'fold' | 'context';
  index: number;
  rows: SourceRow[];
  label: string;
};
export const continuousSegments = (file: FileDiff, source: {
  before: string | null;
  after: string | null;
}, required: FunctionContext = {
  before: [],
  after: []
}): Segment[] => {
  const lines = (text: string | null) => text === null || text === '' ? [] : text.replace(/\n$/, '').split('\n');
  const before = lines(source.before);
  const after = lines(source.after);
  const result: Segment[] = [];
  let old = 1;
  let newer = 1;
  const isRequired = (row: SourceRow) => ([
    'before', 'after'
  ] as const).some(side => {
    const line = row[side === 'before' ? 'beforeLine' : 'afterLine'];
    return line !== null && required[side].some(range => line >= range.startLine && line <= range.endLine);
  });
  const context = (endOld: number, endNew: number, index: number) => {
    const count = endOld - old;
    if (count !== endNew - newer || count < 0) {
      throw new Error('context_range_mismatch');
    }
    const rows = Array.from({
      length: count
    }, (_, i) => {
      const text = before[old + i - 1];
      if (text === undefined || text !== after[newer + i - 1]) {
        throw new Error('context_source_mismatch');
      }
      return {
        kind: 'context',
        beforeLine: old + i,
        afterLine: newer + i,
        text
      };
    });
    let start = 0;
    while (start < rows.length) {
      const visible = isRequired(rows[start]!);
      let end = start + 1;
      while (end < rows.length && isRequired(rows[end]!) === visible)
        end++;
      const run = rows.slice(start, end);
      const first = run[0]!;
      const last = run.at(-1)!;
      result.push({
        id: `context:${file.path}:${first.beforeLine}:${first.afterLine}:${run.length}`,
        kind: visible ? 'context' : 'fold',
        index,
        rows: run,
        label: `${run.length} unchanged ${run.length === 1 ? 'line' : 'lines'} · Before L${first.beforeLine}–${last.beforeLine} / After L${first.afterLine}–${last.afterLine}`
      });
      start = end;
    }
  };
  file.hunks.forEach((hunk, index) => {
    context(Math.max(1, hunk.beforeStart), Math.max(1, hunk.afterStart), index);
    result.push({
      id: `hunk:${file.path}:${index}`,
      kind: 'hunk',
      index,
      rows: hunk.rows,
      label: hunk.header
    });
    old = Math.max(1, hunk.beforeStart + hunk.beforeCount);
    newer = Math.max(1, hunk.afterStart + hunk.afterCount);
  });
  context(before.length + 1, after.length + 1, file.hunks.length);
  return result;
};
export const visibleHunk = (positions: readonly number[], top: number, height: number, extent: number) => {
  if (!positions.length)
    return 0;
  if (extent > height + 2 && top >= extent - height - 2)
    return positions.length - 1;
  let current = 0;
  positions.forEach((position, index) => {
    if (position <= top + 42)
      current = index;
  });
  return current;
};
