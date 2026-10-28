import type { GraphEntity, GraphRelation } from './minimal-graph.ts';

export type CallProjectionEvidence = Readonly<{
    callsiteId: string;
    canonicalRelations: readonly GraphRelation[];
    locations: readonly GraphRelation[];
}>;

export const reducedCallProjection = (
    nodes: readonly GraphEntity[],
    relations: readonly GraphRelation[],
    expandedFiles: ReadonlySet<string>,
    canonicalRelations: readonly GraphRelation[] = relations,
) => {
    const entities = new Map(nodes.map(node => [node.id, node]));
    const visibleRelations = new Set(relations.map(edge => edge.id));
    const hidden = new Set<string>();
    const projected: GraphRelation[] = [];
    for (const site of nodes.filter(node => node.kind === 'callsite')) {
        const incident = canonicalRelations.filter(edge => edge.from === site.id || edge.to === site.id);
        const owners = incident.filter(edge => edge.to === site.id && edge.relation === 'contains_call');
        const targets = incident.filter(edge => edge.from === site.id && edge.relation === 'calls');
        const homes = incident.filter(edge => edge.from === site.id && edge.relation === 'located_in');
        if (incident.length !== 3 || owners.length !== 1 || targets.length !== 1 || homes.length !== 1)
            continue;
        const owner = owners[0]!, target = targets[0]!, home = homes[0]!;
        if (expandedFiles.has(home.to) || !incident.every(edge => visibleRelations.has(edge.id))
            || entities.get(owner.from)?.kind !== 'function' || entities.get(target.to)?.kind !== 'function'
            || owner.version !== target.version || home.version !== target.version)
            continue;
        const sources = target.data.sourceCalls as readonly {
            id: string;
            site: { anchor: { path: string; commit: string; contentHash: string; startLine: number; endLine: number } };
        }[] | undefined;
        const anchor = sources?.length === 1 ? sources[0]?.site?.anchor : undefined;
        const range = home.data.range as { startLine: number; endLine: number } | undefined;
        if (!anchor || typeof anchor.path !== 'string' || typeof anchor.contentHash !== 'string'
            || home.data.commit !== anchor.commit || home.data.sourceHash !== anchor.contentHash
            || range?.startLine !== anchor.startLine || range?.endLine !== anchor.endLine
            || JSON.stringify(owner.data.sourceCalls) !== JSON.stringify(sources))
            continue;
        hidden.add(site.id);
        projected.push({
            ...target, id: 'projection:' + target.id, from: owner.from,
            data: {
                ...target.data, projection: 'collapsed-callsite', sourcePath: anchor.path,
                projectionEvidence: { callsiteId: site.id, canonicalRelations: [owner, target], locations: [home] } satisfies CallProjectionEvidence,
            },
        });
    }
    return {
        nodes: nodes.filter(node => !hidden.has(node.id)).map(node => node.nodes?.some(child => hidden.has(child.id))
            ? { ...node, nodes: node.nodes.filter(child => !hidden.has(child.id)) } : node),
        relations: [...relations.filter(edge => !hidden.has(edge.from) && !hidden.has(edge.to)), ...projected],
    };
};
