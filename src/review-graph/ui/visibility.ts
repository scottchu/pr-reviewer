import { reducedCallProjection } from './call-projection.ts';
import { collectEntities } from '../domain/validation.ts';
import type { SourceGraph } from '../domain/types.ts';

const readingUnitIndexes = new WeakMap<SourceGraph, Readonly<Record<string, readonly string[]>>>();
/** Assertions remain canonical evidence; pagination visits coherent source units. */
export const sourceReadingUnits = (candidate: SourceGraph): Readonly<Record<string, readonly string[]>> => {
    const known = readingUnitIndexes.get(candidate);
    if (known) return known;
    const assertions = new Set(collectEntities(candidate.entities).filter(entity => entity.kind === 'assertion').map(entity => entity.id));
    const units = Object.fromEntries(Object.entries(candidate.fileUnits).map(([file, ids]) => [file, ids.filter(id => !assertions.has(id))]));
    readingUnitIndexes.set(candidate, units);
    return units;
};
export const visibleGraph = (candidate: SourceGraph, limits: Readonly<Record<string, number>>) => {
    const registry = collectEntities(candidate.entities), ids = new Set(registry.map(entity => entity.id));
    const visible = new Set(registry.filter(entity => entity.kind === 'file').map(entity => entity.id));
    for (const id of candidate.initialVisible)
        if (ids.has(id))
            visible.add(id);
    for (const [file, limit] of Object.entries(limits)) {
        for (const id of (sourceReadingUnits(candidate)[file] ?? []).slice(0, limit))
            visible.add(candidate.groupFor[id] ?? id);
    }
    for (const id of [...visible]) {
        const group = candidate.groupFor[id];
        if (group)
            visible.add(group);
    }
    for (const entity of registry.filter(entity => visible.has(entity.id) && entity.nodes))
        for (const child of entity.nodes ?? [])
            if (child.kind !== 'assertion') visible.add(child.id);
    const nodes = registry.filter(entity => visible.has(entity.id) && entity.kind !== 'assertion');
    const nodeIds = new Set(nodes.map(entity => entity.id));
    return reducedCallProjection(nodes, candidate.relations.filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to)), new Set(Object.entries(limits).filter(([, limit]) => limit > 0).map(([file]) => file)), candidate.relations);
};
