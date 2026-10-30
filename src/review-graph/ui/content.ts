import type {EditComposition} from '../domain/edit-composition.ts';
import {relationshipProvenance} from './relationship-evidence.ts';
import type { GraphEntity, GraphRelation, SourceAnchor } from '../domain/types.ts';
export type CardRows = Readonly<{
    title: string;
    rows: readonly string[];
}>;
const text = (value: unknown) => typeof value === 'string' ? value : '';
const constructionLocations = (entity: GraphEntity): readonly string[] => {
    const witnesses = entity.data.sourceWitnesses as readonly {anchor: SourceAnchor}[] | undefined;
    const locations = (witnesses ?? []).flatMap(({anchor}) => {
        if (!anchor || !['base', 'head'].includes(anchor.side) || !anchor.commit || !anchor.path ||
            !Number.isInteger(anchor.startLine) || anchor.startLine < 1 || !Number.isInteger(anchor.endLine) || anchor.endLine < anchor.startLine)
            return [];
        return [(anchor.side === 'base' ? 'Before' : 'After') + ' ' + anchor.commit.slice(0, 7) + ' · ' + anchor.path + ' · L' +
            anchor.startLine + (anchor.endLine === anchor.startLine ? '' : '–' + anchor.endLine)];
    });
    return locations.length ? locations : ['Source occurrence identity unavailable'];
};
const contentRows = (entity: GraphEntity): CardRows => {
    const { kind, data } = entity;
    switch (kind) {
        case 'review': return { title: text(data.name), rows: [] };
        case 'callsite': return { title: text(data.value) || text(data.name), rows: [] };
        case 'function': return { title: text(data.name), rows: data.comparisonStatus === 'no change' ? ['Source-body equality, not behavior equivalence'] : [] };
        case 'header': return {
            title: 'Authorization property construction',
            rows: [text(data.value).replace(/^Authorization:\s*/, ''),
                text(data.statusScope) || 'Direct headers.Authorization construction only', ...constructionLocations(entity)],
        };
        case 'file': return { title: text(data.path), rows: [] };
        case 'test': return { title: text(data.name), rows: [...(Array.isArray(data.variants) ? [String(data.variants.length) + ' parameter variants'] : []), ...(text(data.scope) ? [text(data.scope)] : [])] };
        case 'behavior': return { title: text(data.name), rows: Array.isArray(data.value) ? data.value.map(String) : [] };
        case 'assertion': return {
            title: text(data.name),
            rows: Array.isArray(data.value) ? data.value.map(String).filter(value => value !== text(data.name)) : [],
        };
        case 'source_step': return { title: text(data.name).replace(/^Before:\s*/, ''), rows: ['Source step · not an assertion'] };
        case 'reason': return { title: text(data.name), rows: [] };
        case 'goal': return { title: text(data.name), rows: [] };
        default: return { title: text(data.name) || text(data.label), rows: text(data.value) ? [text(data.value)] : [] };
    }
};
export const presentationStatus = (entity: GraphEntity): string | undefined => {
    const composition = entity.data.editComposition as EditComposition | undefined;
    return composition ? composition.status === 'unresolved' ? undefined : composition.status :
        typeof entity.data.comparisonStatus === 'string' ? entity.data.comparisonStatus : undefined;
};
export const editPreview = (composition: EditComposition) => ({
    removed: composition.rows.filter(row => row.kind === 'remove').slice(0, 4),
    added: composition.rows.filter(row => row.kind === 'add').slice(0, 4),
});
export const editCaption = (composition: EditComposition): string => composition.status === 'unresolved'
    ? 'Scoped source edits unresolved'
    : 'Scoped ' + composition.scope + ' edits: +' + composition.added + ' / −' + composition.removed;
export const cardRows = (entity: GraphEntity): CardRows => {
    const content = contentRows(entity);
    const composition = entity.data.editComposition as EditComposition | undefined;
    const status = composition ? composition.status : text(entity.data.comparisonStatus);
    const statusLabel = entity.kind === 'header' && status === 'remove' ? 'Removed source occurrence' : status;
    return { ...content, rows: statusLabel ? [statusLabel, ...content.rows] : content.rows };
};
export type RelationRows = CardRows & Readonly<{
    explanation: string; scope: readonly string[]; provenance: readonly string[];
}>;
const relationMeanings: Readonly<Record<string, string>> = {
    before: 'Before source witness for this comparison', after: 'After source witness for this comparison',
    located_in: 'Source occurrence is located in this file', defined_in: 'Source definition is located in this file',
    absence_checked_in: 'Source absence assertion is located in this file',
    changes: 'Native diff records edits in this file', constructs: 'Source constructs this header property',
    contains: 'Source contains this member', contains_call: 'Source body contains this callsite',
    calls: 'Source call to the target declaration', verifies: 'Prepared source assertion concerns this behavior',
    // Retained pre-cleanup graphs only; current preparation never emits this kind.
    verifies_policy: 'Prepared source assertions concern HTTP policy',
    motivated_by: 'Prepared source-derived rationale', intended_to_achieve: 'Prepared intended outcome',
    impedes: 'Prepared inferred obstacle', related_policy: 'Prepared shared policy inference',
};
export const edgeRows = (edge: GraphRelation, entities: readonly GraphEntity[] = []): RelationRows => {
    const title = edge.relation.replaceAll('_', ' ') + (edge.data.comparisonStatus === 'no change' ? ' · no change' : '');
    const calls = edge.data.sourceCalls as {site?: {sourceText?: string}}[] | undefined;
    const callText = calls?.find(call=>call.site?.sourceText)?.site?.sourceText;
    const explanation = edge.relation === 'calls' && callText ? 'Source call: ' + callText : relationMeanings[edge.relation] ?? 'Relationship explanation unavailable';
    const scopes = [text(edge.data.scope), text(edge.data.scopeLimit)];
    if (['calls','contains_call'].includes(edge.relation)) scopes.push('Lexical source relation; not runtime execution');
    if (edge.data.comparisonStatus === 'no change') scopes.push('Before and After source witnesses; not runtime stability');
    if (edge.relation === 'verifies' && edge.data.verificationKind === 'credential-preservation')
        scopes.push('Indirect bridge → login → refresh → request', 'Not run · not local-owner/helper-branch proof');
    else if (edge.relation === 'verifies') scopes.push('Indirect source context', 'Not direct helper or every-branch proof');
    if (edge.relation === 'verifies_policy') scopes.push('Prepared policy context', 'Not client helper coverage or goal proof');
    if (edge.relation === 'related_policy') scopes.push('Source-derived inference · not a call');
    if (edge.relation === 'motivated_by') scopes.push('Inferred rationale · not author testimony');
    if (edge.relation === 'intended_to_achieve') scopes.push('Intended, not measured');
    if (edge.relation === 'impedes') scopes.push('Inferred obstacle; no measured outcome');
    const scope = [...new Set(scopes.filter(Boolean))];
    const provenance = relationshipProvenance(edge, entities);
    return {title, explanation, scope, provenance, rows: [explanation, ...scope, ...provenance]};
};
export const omittedStructuralEdge = (edge: GraphRelation, entities: readonly GraphEntity[] = []): boolean => edge.data.projection === 'metadata' ||
    entities.some(parent => parent.id === edge.from && parent.nodes?.some(child => child.id === edge.to));
