import type { GraphEntity, GraphRelation } from './types.ts';

export const collectEntities = (entities: readonly GraphEntity[]): GraphEntity[] =>
    entities.flatMap(entity => [entity, ...collectEntities(entity.nodes ?? [])]);

export const validateGraph = (entities: readonly GraphEntity[], relations: readonly GraphRelation[]): void => {
    const all = collectEntities(entities);
    const ids = new Set(all.map(entity => entity.id));
    const edges = [...relations, ...all.flatMap(entity => entity.edges ?? [])];
    if (ids.size !== all.length || edges.some(edge => !ids.has(edge.from) || !ids.has(edge.to))) {
        throw new Error('generated_graph_reference_invalid');
    }
    if (new Set(edges.map(edge => edge.id)).size !== edges.length) {
        throw new Error('generated_graph_relation_identity_invalid');
    }
};
