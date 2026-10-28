import { reducedCallProjection } from './call-projection.ts';
import { collectEntities } from '../domain/validation.ts';
import type { SourceGraph } from '../domain/types.ts';
export const visibleGraph = (candidate: SourceGraph, limits: Readonly<Record<string, number>>) => {
    const registry = collectEntities(candidate.entities), ids = new Set(registry.map(entity => entity.id));
    const visible = new Set(registry.filter(entity => entity.kind === 'file').map(entity => entity.id));
    for (const id of candidate.initialVisible)
        if (ids.has(id))
            visible.add(id);
    for (const [file, limit] of Object.entries(limits)) {
        for (const id of (candidate.fileUnits[file] ?? []).slice(0, limit))
            visible.add(candidate.groupFor[id] ?? id);
    }
    for (const id of [...visible]) {
        const group = candidate.groupFor[id];
        if (group)
            visible.add(group);
    }
    for (const entity of registry.filter(entity => visible.has(entity.id) && entity.nodes))
        for (const child of entity.nodes ?? [])
            visible.add(child.id);
    const visibleTests = new Set(registry
        .filter(entity => entity.kind === 'test' && visible.has(entity.id))
        .map(entity => entity.id));
    for (const relation of candidate.relations)
        if (relation.relation === 'contains' && visibleTests.has(relation.from)
            && registry.some(entity => entity.id === relation.to && entity.kind === 'assertion'))
            visible.add(relation.to);
    const nodes = registry.filter(entity => visible.has(entity.id));
    return reducedCallProjection(nodes, candidate.relations.filter(edge => visible.has(edge.from) && visible.has(edge.to)), new Set(Object.entries(limits).filter(([, limit]) => limit > 0).map(([file]) => file)), candidate.relations);
};
