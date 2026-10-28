type Row = {
  kind: string;
  beforeLine: number | null;
  afterLine: number | null;
  text: string;
};
type Hunk = {
  beforeStart: number;
  beforeCount: number;
  afterStart: number;
  afterCount: number;
  rows: Row[];
};
export const changeStops = (file: {
  path: string;
  hunks: Hunk[];
}) => {
  const total = file.hunks.reduce((sum, h) => sum + Math.max(1, h.rows.length), 0);
  let offset = 0;
  return file.hunks.map((h, index) => {
    const added = h.rows.some(r => r.kind === 'added');
    const removed = h.rows.some(r => r.kind === 'removed');
    const kind = added && removed ? 'modified' : removed ? 'removed' : 'added';
    const extent = Math.max(1, h.rows.length);
    const position = (offset + extent / 2) / total;
    offset += extent;
    const range = (start: number, count: number) => count ? `L${start}–${start + count - 1}` : 'no lines';
    return {
      id: `${file.path}:${index}`,
      index,
      kind,
      position,
      label: `${file.path} · ${kind} · Before ${range(h.beforeStart, h.beforeCount)} · After ${range(h.afterStart, h.afterCount)}`
    };
  });
};
// Alignment is only native Git context and ordered replacement blocks, never function matching.
export const splitRows = (rows: Row[]) => {
  const result: {
    before: Row | null;
    after: Row | null;
  }[] = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i]!;
    if (row.kind === 'context') {
      result.push({
        before: row,
        after: row
      });
      i++;
      continue;
    }
    const removed: Row[] = [];
    const added: Row[] = [];
    while (i < rows.length && rows[i]!.kind !== 'context') {
      const r = rows[i++]!;
      (r.kind === 'removed' ? removed : added).push(r);
    }
    for (let j = 0;j < Math.max(removed.length, added.length);j++)
      result.push({
        before: removed[j] ?? null,
        after: added[j] ?? null
      });
  }
  return result;
};
