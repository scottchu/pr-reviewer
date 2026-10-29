import type {GraphFilterUI, SceneIdentityUI, SceneSelectionUI} from './types.ts';
export type ScenePinsUI = Readonly<{nodes: readonly string[]; routes: readonly string[]}>;
/** Current main-thread pins always override a pending worker membership snapshot. */
export const sceneMembership = (scene: SceneIdentityUI | null, selection: SceneSelectionUI | null, pins: ScenePinsUI, inspected: readonly string[]) => {
    if (!scene || !selection || scene.comparison !== selection.comparison || scene.revision !== selection.revision) return null;
    return {nodes: new Set([...selection.nodeIds, ...pins.nodes, ...inspected]), routes: new Set([...selection.routeIds, ...pins.routes])};
};

/** Spatial fallback and focus/reader pins never widen semantic eligibility. */
export const filterSceneMembership = (
    filter: GraphFilterUI,
    spatial: ReturnType<typeof sceneMembership>,
) => ({
    nodes: new Set(filter.nodeIds.filter(id => !spatial || spatial.nodes.has(id))),
    routes: new Set(filter.relationIds.filter(id => !spatial || spatial.routes.has(id))),
});
