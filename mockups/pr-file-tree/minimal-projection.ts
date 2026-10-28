import type { CallProjectionEvidence } from './call-projection.ts';
import type { GraphEntity, GraphRelation } from './minimal-graph.ts';
export type CardRows = Readonly<{
    title: string;
    rows: readonly string[];
}>;
const text = (value: unknown) => typeof value === 'string' ? value : '';
const assertionText = (value: string) => {
    if (value.includes('Local access token') && value.includes('toHaveCount(0)'))
        return 'No local access token field';
    if (value.includes('Log out') && value.includes('toHaveCount(0)'))
        return 'No Log out button';
    if (value.includes('ownerRequests.every'))
        return 'Asserts API requests omit Authorization';
    return value;
};
const contentRows = (entity: GraphEntity): CardRows => {
    const { kind, data } = entity;
    switch (kind) {
        case 'review': return { title: text(data.name), rows: [] };
        case 'callsite': return { title: text(data.value) || text(data.name), rows: [] };
        case 'function': return { title: text(data.name), rows: data.comparisonStatus === 'no change' ? ['Source-body equality, not behavior equivalence'] : [] };
        case 'header': return { title: 'Authorization', rows: [text(data.value).replace(/^Authorization:\s*/, '')] };
        case 'file': return { title: text(data.path), rows: [] };
        case 'test': return { title: text(data.name), rows: [...(Array.isArray(data.variants) ? [String(data.variants.length) + ' parameter variants'] : []), ...(text(data.scope) ? [text(data.scope)] : [])] };
        case 'behavior': return { title: text(data.name), rows: Array.isArray(data.value) ? data.value.map(String) : [] };
        case 'assertion': return {
            title: text(data.name).replace(/^After:\s*/, ''),
            rows: [...(Array.isArray(data.value) ? data.value.map(value => assertionText(String(value))) : []),],
        };
        case 'source_step': return { title: text(data.name).replace(/^Before:\s*/, ''), rows: ['Source step · not an assertion'] };
        case 'reason': return { title: text(data.name), rows: [] };
        case 'goal': return { title: text(data.name), rows: [] };
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
    if (edge.relation === 'constructs')
        return {title, rows: [text(edge.data.scope), text(edge.data.scopeLimit)].filter(Boolean)};
    if (edge.relation === 'calls' && edge.data.projection === 'collapsed-callsite') {
        const proof = edge.data.projectionEvidence as CallProjectionEvidence;
        const source = proof.locations[0]!;
        const range = source.data.range as { startLine: number; endLine: number };
        const path = text(edge.data.sourcePath).split('/').at(-1);
        return { title, rows: [text(source.data.commit).slice(0, 7) + ' · ' + path + ' L' + range.startLine + (range.endLine === range.startLine ? '' : '–' + range.endLine)] };
    }
    if (edge.relation === 'located_in' && edge.data.comparisonStatus === 'no change') {
        const witnesses = edge.data.witnesses as readonly GraphRelation[];
        return { title: 'located in · no change', rows: witnesses.map(witness => { const range = witness.data.range as {
                startLine: number;
                endLine: number;
            }; return (witness.version === 'before' ? 'Before ' : 'After ') + text(witness.data.commit).slice(0, 7) + ' L' + range.startLine + '–' + range.endLine; }) };
    }
    if (['located_in', 'absence_checked_in'].includes(edge.relation)) {
        const range = edge.data.range as {
            startLine?: number;
            endLine?: number;
        } | undefined;
        return { title, rows: [text(edge.data.commit).slice(0, 7), range ? `L${range.startLine}–${range.endLine}` : 'Range unavailable'] };
    }
    if (edge.relation === 'calls' && edge.data.comparisonStatus === 'no change')
        return { title, rows: ['no change · Before + After source evidence'] };
    if (edge.relation === 'verifies' && edge.data.verificationKind === 'credential-preservation')
        return { title: 'verifies retained credential behavior', rows: ['Indirect bridge → login → refresh → request', 'Not run · not local-owner/helper-branch proof'] };
    if (edge.relation === 'verifies_policy')
        return { title: 'verifies HTTP policy', rows: ['Prepared policy context', 'Not client helper coverage or goal proof'] };
    if (edge.relation === 'related_policy')
        return { title: 'related policy', rows: ['Source-derived inference · not a call'] };
    if (edge.relation === 'verifies')
        return { title, rows: ['Indirect source context', 'Not direct helper or every-branch proof'] };
    if (edge.relation === 'motivated_by')
        return { title, rows: ['Inferred rationale'] };
    if (edge.relation === 'intended_to_achieve')
        return { title, rows: ['Intended, not measured'] };
    if (edge.relation === 'impedes')
        return { title, rows: ['Inferred obstacle'] };
    return { title, rows: [] };
};
export const omittedStructuralEdge = (edge: GraphRelation, entities: readonly GraphEntity[] = []): boolean => edge.data.projection === 'metadata' ||
    entities.some(parent => parent.id === edge.from && parent.nodes?.some(child => child.id === edge.to));
