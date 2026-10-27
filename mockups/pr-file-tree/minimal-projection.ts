import { allEntities, allRelations, isPairedSubject, type GraphEntity, type GraphRelation } from './comparison-graph.ts';

export type CardRows = Readonly<{ title: string; rows: readonly string[] }>;
export const entityVersion = (id: string): GraphRelation['version'] => {
  const values = allEntities().find(entity => entity.id === id)?.data.occurrences;
  if (!Array.isArray(values)) return 'comparison';
  const sides = new Set(values.map(value => (value as { side?: string; anchor?: { side?: string } }).side ?? (value as { anchor?: { side?: string } }).anchor?.side));
  if (sides.has('base') && sides.has('head')) return 'comparison';
  return sides.has('base') ? 'before' : sides.has('head') ? 'after' : 'comparison';
};
const text = (value: unknown) => typeof value === 'string' ? value : '';
const assertionText = (value: string) => {
  if (value.includes('Local access token') && value.includes('toHaveCount(0)')) return 'No local access token field';
  if (value.includes('Log out') && value.includes('toHaveCount(0)')) return 'No Log out button';
  if (value.includes('ownerRequests.every')) return 'Asserts API requests omit Authorization';
  return value;
};
const contentRows = (entity: GraphEntity): CardRows => {
  const { kind, data } = entity;
  switch (kind) {
    case 'callsite': return { title: text(data.value) || text(data.name), rows: [] };
    case 'function': return { title: text(data.name), rows: data.comparisonStatus === 'no change' ? ['Source-body equality, not behavior equivalence'] : [] };
    case 'header': return { title: 'Authorization', rows: [text(data.value).replace(/^Authorization:\s*/, '')] };
    case 'file': return { title: text(data.path), rows: [] };
    case 'test': return { title: text(data.name), rows: ['Not run'] };
    case 'assertion': return {
      title: text(data.name).replace(/^After:\s*/, ''),
      rows: [...(Array.isArray(data.value) ? data.value.map(value => assertionText(String(value))) : []), 'Not run'],
    };
    case 'source_step': return { title: text(data.name).replace(/^Before:\s*/, ''), rows: ['Source step · not an assertion'] };
    case 'reason': return { title: text(data.name), rows: ['Source-derived inference'] };
    case 'goal': return { title: text(data.name), rows: ['Intended outcome · not measured'] };
    default: return { title: text(data.name) || text(data.label), rows: text(data.value) ? [text(data.value)] : [] };
  }
};
export const cardRows = (entity: GraphEntity): CardRows => {
  const content = contentRows(entity);
  const status = text(entity.data.comparisonStatus);
  return { ...content, rows: status ? [status, ...content.rows] : content.rows };
};
export const edgeRows = (edge: GraphRelation): CardRows => {
  const title = ['before', 'after'].includes(edge.relation) ? '' : edge.relation.replaceAll('_', ' ');
  if (edge.relation === 'located_in' && edge.data.comparisonStatus === 'no change') {
    const witnesses = edge.data.witnesses as readonly GraphRelation[];
    return { title: 'located in · no change', rows: witnesses.map(witness => { const range = witness.data.range as { startLine: number; endLine: number }; return (witness.version === 'before' ? 'Before ' : 'After ') + text(witness.data.commit).slice(0,7) + ' L' + range.startLine + '–' + range.endLine; }) };
  }
  if (edge.relation === 'located_in') {
    const range = edge.data.range as { startLine?: number; endLine?: number } | undefined;
    return { title, rows: [text(edge.data.commit).slice(0, 7), range ? `L${range.startLine}–${range.endLine}` : 'Range unavailable'] };
  }
  if (edge.relation === 'calls' && edge.data.comparisonStatus === 'no change') return { title, rows: ['no change · Before + After source evidence'] };
  if (edge.relation === 'verifies') return { title, rows: ['Indirect UI journey · not run', 'Not direct helper, every-branch or native-host proof'] };
  if (edge.relation === 'motivated_by') return { title, rows: ['Inferred rationale'] };
  if (edge.relation === 'intended_to_achieve') return { title, rows: ['Intended, not measured'] };
  if (edge.relation === 'impedes') return { title, rows: ['Inferred obstacle'] };
  return { title, rows: [] };
};
export const groupSize = (id: string) => ({ width: 1000, height: id === 'change' ? 520 : 780 });
export const rowPositions: Readonly<Record<string, { x: number; y: number }>> = {
  change: { x: 0, y: 0 }, request: { x: 340, y: 150 }, 'header-value': { x: 40, y: 380 },
  refresh: { x: 1500, y: 0 }, helper: { x: 1500, y: 380 },
  'review-file': { x: -950, y: 150 }, 'helper-file': { x: 2200, y: 380 },
  reason: { x: 0, y: 900 }, goal: { x: 1500, y: 900 },
  'test-change': { x: 0, y: 1400 }, 'owner-journey-test': { x: 340, y: 200 },
  'old-test-step': { x: 40, y: 520 }, 'new-test-assertions': { x: 640, y: 520 },
  'test-file': { x: -950, y: 1600 },
};
export const omittedStructuralEdge = (edge: GraphRelation): boolean =>
  edge.data.projection === 'metadata' || (['before', 'after'].includes(edge.relation) && isPairedSubject(edge.to));

export const locationPeers = (fileId: string): readonly GraphRelation[] => allRelations()
  .filter(edge => edge.relation === 'located_in' && edge.to === fileId)
  .sort((a, b) => {
    const side = (a.version === 'before' ? 0 : 1) - (b.version === 'before' ? 0 : 1);
    if (side) return side;
    if (a.from !== b.from) return a.from < b.from ? -1 : 1;
    return ((a.data.range as { startLine?: number } | undefined)?.startLine ?? 0) - ((b.data.range as { startLine?: number } | undefined)?.startLine ?? 0);
  });
