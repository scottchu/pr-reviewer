import { isPairedSubject, type GraphEntity, type GraphRelation } from './comparison-graph.ts';

export type CardRows = Readonly<{ title: string; rows: readonly string[] }>;
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
    case 'header': return { title: 'Authorization', rows: [text(data.value).replace(/^Authorization:\s*/, ''), 'Direct request construction only'] };
    case 'file': return { title: text(data.path), rows: [] };
    case 'test': return { title: text(data.name), rows: [...(Array.isArray(data.variants) ? [String(data.variants.length)+' parameter variants'] : []), ...(text(data.scope) ? [text(data.scope)] : []), 'Not run'] };
    case 'behavior': return {title:text(data.name),rows:Array.isArray(data.value)?data.value.map(String):[]};
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
  if (['located_in','absence_checked_in'].includes(edge.relation)) {
    const range = edge.data.range as { startLine?: number; endLine?: number } | undefined;
    return { title, rows: [text(edge.data.commit).slice(0, 7), range ? `L${range.startLine}–${range.endLine}` : 'Range unavailable'] };
  }
  if (edge.relation === 'calls' && edge.data.comparisonStatus === 'no change') return { title, rows: ['no change · Before + After source evidence'] };
  if (edge.relation === 'verifies' && edge.data.verificationKind === 'credential-preservation') return {title:'verifies retained credential behavior',rows:['Indirect bridge → login → refresh → request','Not run · not local-owner/helper-branch proof']};
  if (edge.relation === 'verifies_policy') return {title:'verifies HTTP policy',rows:['Source assertions · not run','Not client helper coverage or goal proof']};
  if (edge.relation === 'related_policy') return {title:'related policy',rows:['Source-derived inference · not a call']};
  if (edge.relation === 'verifies') return { title, rows: ['Indirect UI journey · not run', 'Not direct helper, every-branch or native-host proof'] };
  if (edge.relation === 'motivated_by') return { title, rows: ['Inferred rationale'] };
  if (edge.relation === 'intended_to_achieve') return { title, rows: ['Intended, not measured'] };
  if (edge.relation === 'impedes') return { title, rows: ['Inferred obstacle'] };
  return { title, rows: [] };
};
export const omittedStructuralEdge = (edge: GraphRelation): boolean =>
  edge.data.projection === 'metadata' || (['before', 'after'].includes(edge.relation) && isPairedSubject(edge.to));
