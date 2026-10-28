import { extractParsedSource } from './extraction/source-units.ts';
import { compileSourceGraph } from './comparison.ts';
import { scopedEditComposition } from './edit-composition.ts';
import { parseSnapshot } from '../parse/typescript.ts';
import type { ParsedSnapshot, FactDocument, GraphEntity, GraphRelation } from './types.ts';
import { collectEntities, validateGraph } from './validation.ts';
export { collectEntities, validateGraph } from './validation.ts';
import { validateEnrichment } from './enrichment.ts';
export const extractSnapshot = (parsed: ParsedSnapshot): FactDocument => {
    const { sources, ...snapshot } = parsed.snapshot;
    const units = parsed.sources.flatMap(extractParsedSource);
    return { ...snapshot, units, coverage: { ...snapshot.coverage, unresolvedAssertionPatterns: units.filter(unit => unit.diagnostic).map(unit => ({ anchor: unit.anchor, reason: unit.diagnostic })) } };
};
export const domainService = { parseSnapshot, extractSnapshot, extractSource: extractParsedSource, compare: compileSourceGraph, classifyEdits: scopedEditComposition, validateGraph, validateEnrichment } as const;
