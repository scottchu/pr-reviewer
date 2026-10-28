import { hunkGaps } from './coordinates.ts';
import { splitRows } from './change-rail.ts';
import type { FileDiff, DiffMode } from './file-diff.tsx';
export type InnerData = {
  kind: 'file' | 'hunk' | 'source' | 'comparison' | 'gap';
  label: string;
  description?: string;
  path: string;
  index: number;
  side?: 'before' | 'after';
  source?: FileDiff['before'];
  hunk?: FileDiff['hunks'][number];
  mode: DiffMode;
  rowHeights: number[];
  active?: boolean;
  selectedSource?: boolean;
  horizontal?: boolean;
  scrollLeft?: number | undefined;
  restoreVersion?: number;
  onHorizontal?: (index: number, left: number) => void;
  focusColumn?: number;
  onMeasured?: (index: number, height: number) => void;
  explain?: () => void;
};
export type InnerNode = {
  id: string;
  type: 'innerGroup' | 'innerSource' | 'innerComparison' | 'innerGap';
  parentId?: string;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
  data: InnerData;
};
export type InnerEdge = {
  id: string;
  source: string;
  target: string;
  kind: 'contains' | 'compares';
  index: number;
  side?: 'before' | 'after';
};
export const fileGroupModel = (file: FileDiff, mode: DiffMode, width: number, measured: Record<number, number> = {}) => {
  const root = `file:${file.path}`;
  const nodes: InnerNode[] = [];
  const edges: InnerEdge[] = [];
  const hunks: {
    id: string;
    y: number;
    height: number;
  }[] = [];
  let y = 36;
  nodes.push({
    id: root,
    type: 'innerGroup',
    position: {
      x: 0,
      y: 0
    },
    width,
    height: 1,
    data: {
      kind: 'file',
      label: file.path,
      path: file.path,
      index: -1,
      mode,
      rowHeights: []
    }
  });
  const gaps = hunkGaps(file.hunks);
  file.hunks.forEach((h, index) => {
    const gap = gaps[index];
    if (gap) {
      nodes.push({
        id: `gap:${file.path}:${index}`,
        type: 'innerGap',
        parentId: root,
        position: {
          x: 16,
          y: y - 12
        },
        width: width - 24,
        height: 22,
        data: {
          kind: 'gap',
          label: gap.short,
          description: gap.label,
          path: file.path,
          index,
          mode,
          rowHeights: []
        }
      });
      y += 22;
    }
    const id = `hunk:${file.path}:${index}`;
    const groupWidth = width - 24;
    const bodyWidth = groupWidth - 16;
    const rows = mode === 'unified' ? h.rows.map(r => ({
      before: r,
      after: null
    })) : splitRows(h.rows);
    const characters = Math.max(8, Math.floor(((mode === 'split' ? bodyWidth / 2 : bodyWidth) - 39) / 6.7));
    const horizontal = width < 500;
    const rowHeights = rows.map(r => horizontal ? 22 : Math.max(1, ...[
      r.before, r.after
    ].map(row => Math.ceil((row?.text.length ?? 0) / characters))) * 20);
    const height = 84 + (measured[index] ?? rowHeights.reduce((a, b) => a + b, 0)) + 10;
    const replacement = splitRows(h.rows).find(r => r.before?.kind === 'removed' && r.after?.kind === 'added');
    let prefix = 0;
    if (replacement)
      while (prefix < Math.min(replacement.before!.text.length, replacement.after!.text.length) && replacement.before!.text[prefix] === replacement.after!.text[prefix])
        prefix++;
    const data = {
      path: file.path,
      index,
      mode,
      rowHeights,
      hunk: h,
      horizontal,
      focusColumn: Math.max(0, prefix - 15)
    };
    nodes.push({
      id,
      type: 'innerGroup',
      parentId: root,
      position: {
        x: 16,
        y
      },
      width: groupWidth,
      height,
      data: {
        ...data,
        kind: 'hunk',
        label: `Change ${index + 1} · −${h.beforeStart},${h.beforeCount} → +${h.afterStart},${h.afterCount}`
      }
    });
    edges.push({
      id: `contains:${id}`,
      source: root,
      target: id,
      kind: 'contains',
      index
    });
    ([
      'before', 'after'
    ] as const).forEach((side, j) => {
      const sourceId = `source:${file.path}:${index}:${side}`;
      const start = side === 'before' ? h.beforeStart : h.afterStart;
      const count = side === 'before' ? h.beforeCount : h.afterCount;
      nodes.push({
        id: sourceId,
        type: 'innerSource',
        parentId: id,
        position: {
          x: 8 + j * (bodyWidth / 2),
          y: 32
        },
        width: bodyWidth / 2,
        height: 30,
        data: {
          ...data,
          kind: 'source',
          side,
          source: file[side],
          label: `${side === 'before' ? 'Before' : 'After'} ${count ? `L${start}–${start + count - 1}` : 'absent'}`
        }
      });
      edges.push({
        id: `compares:${sourceId}`,
        source: sourceId,
        target: `comparison:${file.path}:${index}`,
        kind: 'compares',
        index,
        side
      });
    });
    nodes.push({
      id: `comparison:${file.path}:${index}`,
      type: 'innerComparison',
      parentId: id,
      position: {
        x: 8,
        y: 80
      },
      width: bodyWidth,
      height: height - 84,
      data: {
        ...data,
        kind: 'comparison',
        label: 'Native Git comparison'
      }
    });
    hunks.push({
      id,
      y,
      height
    });
    y += height + 18;
  });
  nodes[0]!.height = y;
  return {
    root,
    nodes,
    edges,
    hunks,
    height: y,
    width
  };
};
