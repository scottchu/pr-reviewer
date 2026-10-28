import type { GraphEntity, GraphRelation } from './types.ts';
export const collectEntities = (entities: readonly GraphEntity[]): GraphEntity[] => entities.flatMap(entity => [entity, ...collectEntities(entity.nodes ?? [])]);
export const validateGraph = (entities: readonly GraphEntity[], relations: readonly GraphRelation[]): void => {
    const all = collectEntities(entities), ids = new Set(all.map(entity => entity.id));
    if (ids.size !== all.length || relations.some(edge => !ids.has(edge.from) || !ids.has(edge.to)))
        throw new Error('generated_graph_reference_invalid');
};
