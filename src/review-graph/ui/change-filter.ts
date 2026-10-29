import type {GraphFilterUI, GraphView} from './types.ts';

const changed = new Set(['add', 'remove', 'change']);
// Include retired verifies_policy only for reading retained pre-cleanup graphs.
const explanatory = new Set([
    'calls', 'contains_call', 'constructs', 'verifies', 'verifies_policy',
    'motivated_by', 'intended_to_achieve', 'impedes', 'related_policy',
]);

/** One-hop context is calculated from the original changed seeds, never a growing frontier. */
export const projectChangeFilter = (view: GraphView, changesOnly: boolean): GraphFilterUI => {
    if (!changesOnly) {
        return {
            changesOnly,
            nodeIds: view.nodes.map(node => node.id),
            relationIds: view.relations.map(edge => edge.id),
        };
    }
    const candidates = new Map(view.nodes.map(node => [node.id, node]));
    const seeds = new Set(view.nodes.filter(node => changed.has(node.ui.status ?? '')).map(node => node.id));
    const included = new Set(seeds);
    const eligible = view.relations.filter(edge => edge.data.comparisonStatus !== 'no change');
    for (const edge of eligible) {
        if (!explanatory.has(edge.relation)) continue;
        for (const [seed, context] of [[edge.from, edge.to], [edge.to, edge.from]] as const) {
            const neighbor = candidates.get(context);
            if (seeds.has(seed) && neighbor && neighbor.ui.status !== 'no change') included.add(context);
        }
    }
    for (const node of view.nodes) {
        if (node.kind === 'review' && node.ui.status !== 'no change') included.add(node.id);
    }
    // Frames are coordinate parents, not a route for admitting more semantic subjects.
    // Walk ancestors only; explicit no-change cards remain excluded even when a child survives.
    let addedParent = true;
    while (addedParent) {
        addedParent = false;
        for (const node of view.nodes) {
            if (!included.has(node.id) && node.ui.status !== 'no change' && node.nodes?.some(child => included.has(child.id))) {
                included.add(node.id);
                addedParent = true;
            }
        }
    }
    return {
        changesOnly,
        nodeIds: view.nodes.filter(node => included.has(node.id)).map(node => node.id),
        relationIds: eligible.filter(edge => included.has(edge.from) && included.has(edge.to)
            && (seeds.has(edge.from) || seeds.has(edge.to))).map(edge => edge.id),
    };
};
