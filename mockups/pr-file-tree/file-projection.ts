import { projectBehaviorCalls, type CallLink, type FunctionIdentity } from './calls.ts';
import type { FileTree } from './tree.ts';

export type FileCall = {
  link: CallLink;
  caller: FunctionIdentity;
  callee: FunctionIdentity;
  status: 'added' | 'unclassified';
};

// A new exact target file has no base occurrence. Other relationships require
// explicit pairing evidence before a comparison status can be assigned.
export const projectFileCalls = (tree: FileTree): FileCall[] => {
  const graph = projectBehaviorCalls();
  const files = new Map(tree.nodes.filter(node => node.kind === 'file').map(node => [node.path, node]));
  return graph.links.flatMap(link => {
    const caller = graph.nodes.find(node => node.id === link.caller)!;
    const callee = graph.nodes.find(node => node.id === link.callee)!;
    if (caller.declaration.path === callee.declaration.path) return [];
    const target = files.get(callee.declaration.path);
    if (!files.has(caller.declaration.path) || !target) throw new Error('call_file_home_missing');
    return [{ link, caller, callee,
      status: target.change === 'added' && link.target.side === 'head' ? 'added' as const : 'unclassified' as const }];
  });
};

// File identity, dimensions, colors and reader remain the original tree's.
// Only positions change. Actual inter-file calls organize connected components;
// remaining sources remain individually reachable, without invented edges.
export const layoutFileProjection = (tree: FileTree, narrow: boolean): FileTree => {
  const files = tree.nodes.filter(node => node.kind === 'file');
  const calls = projectFileCalls(tree);
  const positions = new Map<string, { x: number; y: number }>();
  const targets = [...new Set(calls.map(call => call.callee.declaration.path))];
  let top = 0;
  for (const target of targets) {
    const callers = [...new Set(calls.filter(call => call.callee.declaration.path === target).map(call => call.caller.declaration.path))];
    const start = top;
    for (const caller of callers) {
      positions.set(caller, { x: 0, y: top });
      const count = calls.filter(call => call.caller.declaration.path === caller && call.callee.declaration.path === target).length;
      top += Math.max(narrow ? 210 : 160, count * 76 + 80);
    }
    positions.set(target, { x: narrow ? 174 : 760, y: narrow ? start + 210 : start + (top - start) / 2 - 40 });
    top += narrow ? 140 : 120;
  }
  const unconnected = files.filter(node => !positions.has(node.path));
  for (const [index, node] of unconnected.entries()) {
    positions.set(node.path, { x: narrow ? 0 : index % 3 * 310, y: top + Math.floor(index / (narrow ? 1 : 3)) * 65 });
  }
  return { edges: [], nodes: files.map(node => ({ ...node, ...positions.get(node.path)!, depth: 0 })) };
};
