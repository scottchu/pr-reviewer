import { domainService } from '../domain/service.ts';
import type { FactDocument, GraphEntity, GraphRelation, SourceInput } from '../domain/types.ts';
import type { AttributedEnrichment } from '../domain/enrichment.ts';
export type { AttributedEnrichment } from '../domain/enrichment.ts';

export const admitAttributedEnrichment = (
    facts: FactDocument,
    source: readonly GraphEntity[],
    candidate: AttributedEnrichment,
    sources?: readonly SourceInput[],
    sourceRelations: readonly GraphRelation[] = [],
) => domainService.validateEnrichment(facts, source, candidate, sources, sourceRelations);
