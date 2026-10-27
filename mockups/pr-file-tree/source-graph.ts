import input from './generated-source-graph.json' with { type: 'json' };
import type { GraphEntity, GraphRelation } from './minimal-graph.ts';
export type SourceGraph = Readonly<{
    entities: readonly GraphEntity[];
    relations: readonly GraphRelation[];
    fileUnits: Readonly<Record<string, readonly string[]>>;
    groupFor: Readonly<Record<string, string>>;
    initialVisible: readonly string[];
    unresolved: readonly {
        path: string;
        name: string;
        kind: string;
        sourceTextHash: string;
        anchor: {
            side: string;
            startLine: number;
            endLine: number;
        };
        reason: string;
    }[];
    provenance: Readonly<Record<string, unknown>>;
}>;
const candidate = input as unknown as SourceGraph;
const collect = (entities: readonly GraphEntity[]): GraphEntity[] => entities.flatMap(entity => [entity, ...collect(entity.nodes ?? [])]);
const registry = collect(candidate.entities);
const ids = new Set(registry.map(entity => entity.id));
if (ids.size !== registry.length || candidate.relations.some(edge => !ids.has(edge.from) || !ids.has(edge.to)))
    throw new Error('generated_graph_reference_invalid');
export const sourceGraph = candidate;
export const allEntities = (): readonly GraphEntity[] => registry;
export const allRelations = (): readonly GraphRelation[] => candidate.relations;
export const visibleSourceGraph = (limits: Readonly<Record<string, number>>) => {
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
    return { nodes, relations: candidate.relations.filter(edge => visible.has(edge.from) && visible.has(edge.to)) };
};
