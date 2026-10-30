import type { GraphEntity, GraphRelation, FactDocument, SourceInput } from './types.ts';
import { collectEntities, validateGraph } from './validation.ts';
import { sourceHash } from './hash.ts';

export type AttributedSourceReference = Readonly<{
    repository: string;
    path: string;
    side: 'base' | 'head';
    commit: string;
    contentHash: string;
    startLine: number;
    endLine: number;
}>;

export type AttributedEnrichment = Readonly<{
    nodes: readonly GraphEntity[];
    edges: readonly GraphRelation[];
}>;

const relationKinds: Readonly<Record<string, readonly [string, string]>> = {
    motivated_by: ['change', 'reason'],
    intended_to_achieve: ['change', 'goal'],
    impedes: ['reason', 'goal'],
    related_policy: ['change', 'behavior'],
};
const hasBasis = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const validateEnrichment = (
    facts: FactDocument,
    source: readonly GraphEntity[],
    candidate: AttributedEnrichment,
    sources?: readonly SourceInput[],
): AttributedEnrichment => {
    const existing = new Map(collectEntities(source).map(entity => [entity.id, entity]));
    const permittedKinds = new Set(['reason', 'goal', 'behavior']);
    for (const node of candidate.nodes) {
        if (node.nodes !== undefined || node.edges !== undefined) {
            throw new Error('enrichment_nested_payload_rejected');
        }
        if (existing.has(node.id) || !permittedKinds.has(node.kind) || node.data.comparisonStatus !== undefined) {
            throw new Error('enrichment_fact_override_rejected');
        }
        if (!hasBasis(node.data.basis) || !Array.isArray(node.data.sourceRefs) || !node.data.sourceRefs.length) {
            throw new Error('enrichment_source_basis_required');
        }
        for (const ref of node.data.sourceRefs as readonly AttributedSourceReference[]) {
            const file = [...facts.files, ...facts.contextFiles].find(file => file.path === ref.path);
            const side = file?.sides.find(side => side.side === ref.side && side.available);
            if (!side || !['base', 'head'].includes(ref.side) || ref.repository !== facts.repository ||
                ref.commit !== side.commit || ref.contentHash !== side.contentHash) {
                throw new Error('enrichment_source_identity_invalid');
            }
            const input = sources?.find(input => input.path === ref.path && input.side === ref.side);
            if (!input || input.repository !== ref.repository || input.commit !== ref.commit ||
                input.contentHash !== ref.contentHash || sourceHash(input.content) !== ref.contentHash) {
                throw new Error('enrichment_source_bytes_unavailable');
            }
            if (!Number.isInteger(ref.startLine) || !Number.isInteger(ref.endLine) || ref.startLine < 1 ||
                ref.endLine < ref.startLine || ref.endLine > input.content.split(/(?<=\n)/).length) {
                throw new Error('enrichment_source_range_invalid');
            }
        }
        existing.set(node.id, node);
    }
    for (const edge of candidate.edges) {
        const kinds = relationKinds[edge.relation];
        if (!kinds || existing.get(edge.from)?.kind !== kinds[0] || existing.get(edge.to)?.kind !== kinds[1] ||
            !hasBasis(edge.data.basis) || edge.version !== 'comparison') {
            throw new Error('enrichment_relation_invalid');
        }
        if (!candidate.nodes.some(node => node.id === edge.from || node.id === edge.to)) {
            throw new Error('enrichment_relation_without_attribution');
        }
    }
    validateGraph([...source, ...candidate.nodes], candidate.edges);
    return candidate;
};
