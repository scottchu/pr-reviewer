import type { GraphEntity, GraphRelation, FactDocument, SourceInput } from './types.ts';
import { collectEntities } from './validation.ts';
export type AttributedEnrichment = Readonly<{
    nodes: readonly GraphEntity[];
    edges: readonly GraphRelation[];
}>;
export const validateEnrichment = (facts: FactDocument, source: readonly GraphEntity[], candidate: AttributedEnrichment, sources?: readonly SourceInput[]): AttributedEnrichment => {
    const existing = new Set(collectEntities(source).map(entity => entity.id));
    const permittedKinds = new Set(['reason', 'goal', 'behavior']);
    const permittedRelations = new Set(['motivated_by', 'intended_to_achieve', 'impedes', 'related_policy']);
    for (const node of candidate.nodes) {
        if(node.nodes!==undefined||node.edges!==undefined)throw new Error('enrichment_nested_payload_rejected');
        if (existing.has(node.id) || !permittedKinds.has(node.kind) || !node.data.basis || node.data.comparisonStatus)
            throw new Error('enrichment_fact_override_rejected');
        for (const ref of (node.data.sourceRefs ?? []) as {
            path: string;
            side: string;
            startLine: number;
            endLine: number;
            commit?: string;
            contentHash?: string;
        }[]) {
            const file = [...facts.files, ...facts.contextFiles].find(file => file.path === ref.path);
            if (!file?.sides.some(side => side.side === ref.side && side.available) || !Number.isInteger(ref.startLine) || !Number.isInteger(ref.endLine) || ref.startLine < 1 || ref.endLine < ref.startLine)
                throw new Error('enrichment_source_reference_invalid');
            const side = file.sides.find(side => side.side === ref.side && side.available)!;
            if (('commit' in ref && ref.commit !== side.commit) || ('contentHash' in ref && ref.contentHash !== side.contentHash))
                throw new Error('enrichment_source_identity_invalid');
            const source = sources?.find(source => source.path === ref.path && source.side === ref.side);
            if (source && ref.endLine > source.content.split(/(?<=\n)/).length)
                throw new Error('enrichment_source_range_invalid');
        }
        existing.add(node.id);
    }
    for (const edge of candidate.edges)
        if (!existing.has(edge.from) || !existing.has(edge.to) || !permittedRelations.has(edge.relation))
            throw new Error('enrichment_relation_invalid');
    return candidate;
};
