import { projectBehaviorCalls, type FunctionIdentity } from './calls.ts';
import type { FileTree } from './tree.ts';
import groups from './behavior-groups.json' with { type: 'json' };

export type GraphLens = 'behavior' | 'files';
export const responsibilityNames: Readonly<Record<string, string>> = {
  G1: 'Open the workspace', G2: 'Owner-aware requests', G3: 'Authority and retained work',
  G4: 'Private question recovery', G5: 'Local tools', G6: 'Declared test sources',
  G7: 'Access contract', G8: 'Delivery and open gates',
};
const family = (node: FunctionIdentity) => node.declaration.path.includes('/storage/') ? 'G3'
  : node.declaration.path.endsWith('/private-session.ts') ? 'G4' : 'G2';

// Actual directed calls determine rank. Authored responsibilities separate
// disconnected evidence components; no layout proximity creates a call fact.
export const layoutBehavior = (projection = projectBehaviorCalls()) => {
  const positions: { identity: FunctionIdentity; x: number; y: number }[] = [];
  const sections: { id: string; label: string; x: number; y: number; height: number }[] = [];
  let top = 0;
  for (const group of ['G2', 'G3', 'G4']) {
    const start = top;
    for (const side of ['base', 'head'] as const) {
      const nodes = projection.nodes.filter(node => family(node) === group && node.declaration.side === side);
      const ids = new Set(nodes.map(node => node.id));
      const links = projection.links.filter(link => ids.has(link.caller) && ids.has(link.callee));
      const ranks = new Map(nodes.map(node => [node.id, 0]));
      let pending = new Set(ids);
      for (let pass = 0; pending.size && pass <= nodes.length; pass++) {
        const ready = [...pending].filter(id => !links.some(link => link.callee === id && pending.has(link.caller)));
        if (!ready.length) throw new Error('call_cycle_needs_explicit_layout');
        for (const id of ready) {
          ranks.set(id, Math.max(0, ...links.filter(link => link.callee === id).map(link => ranks.get(link.caller)! + 1)));
          pending.delete(id);
        }
      }
      const rows = new Map<number, number>();
      const sorted = [...nodes].sort((a, b) => (ranks.get(a.id)! - ranks.get(b.id)!)
        || Number(b.sourceUnchanged) - Number(a.sourceUnchanged) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
      for (const identity of sorted) {
        const rank = ranks.get(identity.id)!;
        const row = rows.get(rank) ?? 0;
        positions.push({ identity, x: rank * 270, y: top + row * 82 + 90 });
        rows.set(rank, row + 1);
      }
      sections.push({ id: `${group}:${side}`, label: `${side === 'base' ? 'Before' : 'After'} · ${responsibilityNames[group]}`, x: 0, y: top, height: 32 });
      top += Math.max(1, ...rows.values()) * 82 + 115;
    }
    sections.push({ id: `frontier:${group}`, label: 'Direct evidence only · other callers and dispatch unresolved', x: 0, y: top - 38, height: 28 });
    if (top <= start) throw new Error('empty_behavior_group');
    top += 80;
  }
  return { positions, sections, bottom: top };
};

// Same file/source IDs, secondary source homes. Their G labels are authored
// scope accounting from the maintained PR ledger, never folders or call edges.
export const behaviorSourceHomes = (tree: FileTree): FileTree => ({
  edges: [],
  nodes: tree.nodes.filter(node => node.kind === 'file').map(node => {
    const item = groups.find(item => item.path === node.path);
    if (!item) throw new Error('source_home_without_scope');
    const peers = groups.filter(peer => peer.group === item.group);
    const index = peers.findIndex(peer => peer.path === node.path);
    const group = Number(item.group.slice(1)) - 1;
    return { ...node, x: 1120 + group % 2 * 960, y: Math.floor(group / 2) * 1100 + index * 58 + 100, depth: 0 };
  }),
});

export const sourceHomeSections = () => Object.entries(responsibilityNames).map(([id, name], index) => ({
  id: `scope:${id}`, label: `${name} · source homes; coverage partial`, x: 1120 + index % 2 * 960, y: Math.floor(index / 2) * 1100 + 30, height: 40,
}));
