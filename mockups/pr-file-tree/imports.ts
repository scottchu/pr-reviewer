import type { Change, FileTree, TreeNode } from './tree.ts';
export type ImportRecord = {
  from: string;
  side: string;
  commit: string;
  sourceHash: string;
  sourceLine: number;
  startOffset: number;
  endOffset: number;
  specifier: string;
  target: string | null;
  targetHash: string | null;
  targetKind?: string;
};
export type GraphNode = Omit<TreeNode, 'kind'> & {
  kind: TreeNode['kind'] | 'external';
};
export type ImportLink = {
  id: string;
  source: string;
  target: string;
  targetPath: string;
  targetKind: 'repository' | 'external';
  kind: 'imports';
  change: Change;
  citations: ImportRecord[];
};
export type ImportProjection = {
  contexts: GraphNode[];
  links: ImportLink[];
  unresolved: ImportRecord[];
};
export const projectImports = (tree: FileTree, fixture: {
  records: readonly ImportRecord[];
}, selected: string | null): ImportProjection => {
  const origin = tree.nodes.find(n => n.kind === 'file' && n.path === selected);
  if (!origin)
    return {
      contexts: [],
      links: [],
      unresolved: []
    };
  const records = fixture.records.filter(r => r.from === selected);
  const unresolved = records.filter(r => !r.target);
  const grouped = new Map<string, ImportRecord[]>();
  for (const r of records) {
    if (!r.target)
      continue;
    const key = `${r.targetKind ?? 'repository'}:${r.target}`;
    const group = grouped.get(key) ?? [];
    group.push(r);
    grouped.set(key, group);
  }
  const contexts: GraphNode[] = [];
  const links: ImportLink[] = [];
  for (const [key, citations] of [
    ...grouped.entries()
  ].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const path = citations[0]!.target!;
    const external = citations[0]!.targetKind === 'external';
    let target: GraphNode | undefined = external ? undefined : tree.nodes.find(n => n.kind === 'file' && n.path === path);
    if (!target) {
      const name = external ? path : path.split('/').at(-1)!;
      const width = Math.ceil(name.length * 7.4 + 12);
      const x = origin.x + origin.width + 160;
      let y = origin.y + contexts.length * 34;
      const overlaps = (n: GraphNode) => x < n.x + n.width + 10 && x + width + 10 > n.x && y < n.y + n.height + 6 && y + 32 > n.y;
      while ([
        ...tree.nodes, ...contexts
      ].some(overlaps))
        y += 32;
      target = {
        id: external ? `external:${path}` : `context:${path}`,
        path,
        name,
        kind: external ? 'external' : 'file',
        change: 'unchanged',
        depth: origin.depth + 1,
        x,
        y,
        width,
        height: 26
      };
      contexts.push(target);
    }
    const before = citations.some(r => r.side === 'before');
    const after = citations.some(r => r.side === 'after');
    links.push({
      id: `imports:${origin.path}:${key}`,
      source: origin.id,
      target: target.id,
      targetPath: path,
      targetKind: external ? 'external' : 'repository',
      kind: 'imports',
      change: before && after ? 'unchanged' : after ? 'added' : 'deleted',
      citations
    });
  }
  return {
    contexts,
    links,
    unresolved
  };
};
export const citationText = (records: readonly ImportRecord[]) => records.map(r => `${r.side} ${r.commit}\n${r.from}:${r.sourceLine} UTF-16[${r.startOffset},${r.endOffset})\nsource SHA-256 ${r.sourceHash}\nimports ${r.specifier} → ${r.target ?? 'unresolved'}\n${r.targetKind === 'external' ? 'External module identity only; no repository target hash or package resolution.' : `target SHA-256 ${r.targetHash ?? 'unavailable'}`}`).join('\n\n');
