import type {SceneBoxUI, SceneSnapshotUI, SceneSelectionUI, ViewportQueryUI} from './types.ts';

type Item = Readonly<{kind: 'node' | 'route' | 'label'; id: string; bounds: SceneBoxUI}>;
type Branch = Readonly<{bounds: SceneBoxUI; items?: readonly Item[]; left?: Branch; right?: Branch}>;
export const intersects = (a: SceneBoxUI, b: SceneBoxUI): boolean =>
    a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
export const contains = (outer: SceneBoxUI, inner: SceneBoxUI): boolean =>
    inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const validBox = (box: SceneBoxUI): boolean => [box.x, box.y, box.width, box.height, box.x + box.width, box.y + box.height].every(Number.isFinite) && box.width >= 0 && box.height >= 0;
export const viewportBounds = (query: ViewportQueryUI, overscan = query.overscan): SceneBoxUI => {
    if (![query.x, query.y, query.zoom, query.width, query.height, query.pixelRatio, overscan].every(Number.isFinite) || query.zoom <= 0 || query.width <= 0 || query.height <= 0 || query.pixelRatio <= 0 || overscan < 0)
        throw new Error('Invalid viewport');
    const bounds = {x: (-query.x - overscan) / query.zoom, y: (-query.y - overscan) / query.zoom, width: (query.width + 2 * overscan) / query.zoom, height: (query.height + 2 * overscan) / query.zoom};
    if (!validBox(bounds)) throw new Error('Invalid viewport bounds');
    return bounds;
};
const enclosing = (items: readonly Readonly<{bounds: SceneBoxUI}>[]): SceneBoxUI => {
    let x = Infinity, y = Infinity, right = -Infinity, bottom = -Infinity;
    for (const {bounds} of items) {x = Math.min(x, bounds.x); y = Math.min(y, bounds.y); right = Math.max(right, bounds.x + bounds.width); bottom = Math.max(bottom, bounds.y + bounds.height);}
    return {x, y, width: right - x, height: bottom - y};
};
const build = (items: readonly Item[]): Branch | undefined => {
    if (!items.length) return undefined;
    const bounds = enclosing(items);
    if (items.length <= 8) return {bounds, items};
    const axis = bounds.width >= bounds.height ? 'x' : 'y';
    const ordered = [...items].sort((a, b) => a.bounds[axis] - b.bounds[axis]);
    const middle = Math.floor(ordered.length / 2);
    return {bounds, left: build(ordered.slice(0, middle))!, right: build(ordered.slice(middle))!};
};

/** Built once per immutable scene; repeated queries visit overlapping tree branches only. */
export const createSceneIndex = (scene: SceneSnapshotUI) => {
    if (!scene.comparison || !Number.isSafeInteger(scene.revision) || scene.revision < 0) throw new Error('Invalid scene identity');
    const nodes = new Map(scene.nodes.map(node => [node.id, node]));
    const routes = new Map(scene.routes.map(route => [route.id, route]));
    if (nodes.size !== scene.nodes.length || routes.size !== scene.routes.length) throw new Error('Duplicate geometry identity');
    for (const node of scene.nodes) {
        if (!node.id || !validBox(node.bounds)) throw new Error('Invalid node geometry');
        const seen = new Set([node.id]);
        let parent = node.parentId;
        while (parent !== undefined) {
            if (!nodes.has(parent) || seen.has(parent)) throw new Error('Invalid scene ancestry');
            seen.add(parent); parent = nodes.get(parent)!.parentId;
        }
    }
    for (const route of scene.routes)
        if (!route.id || !nodes.has(route.source) || !nodes.has(route.target) || !validBox(route.bounds) || !validBox(route.labelBounds)) throw new Error('Invalid route geometry');
    const root = build([
        ...scene.nodes.map(node => ({kind: 'node' as const, id: node.id, bounds: node.bounds})),
        ...scene.routes.flatMap(route => [{kind: 'route' as const, id: route.id, bounds: route.bounds}, {kind: 'label' as const, id: route.id, bounds: route.labelBounds}]),
    ]);
    return {query: (query: ViewportQueryUI): SceneSelectionUI => {
        if (query.comparison !== scene.comparison || query.revision !== scene.revision || !Number.isSafeInteger(query.request)) throw new Error('Stale scene query');
        const coverage = viewportBounds(query), selectedNodes = new Set<string>(), selectedRoutes = new Set<string>();
        let visited = 0, visitedBranches = 0;
        const visit = (branch: Branch | undefined): void => {
            if (!branch) return;
            visitedBranches++;
            if (!intersects(branch.bounds, coverage)) return;
            if (branch.items) for (const item of branch.items) {
                visited++;
                if (intersects(item.bounds, coverage)) (item.kind === 'node' ? selectedNodes : selectedRoutes).add(item.id);
            }
            else {visit(branch.left); visit(branch.right);}
        };
        visit(root);
        for (const id of query.pinnedNodes) if (nodes.has(id)) selectedNodes.add(id);
        for (const id of query.pinnedRoutes) if (routes.has(id)) selectedRoutes.add(id);
        const metadata = new Set<string>();
        const include = (id: string): void => {
            if (metadata.has(id)) return;
            metadata.add(id);
            const parent = nodes.get(id)?.parentId;
            if (parent) include(parent);
        };
        for (const id of selectedNodes) include(id);
        for (const id of selectedRoutes) {const route = routes.get(id)!; include(route.source); include(route.target);}
        return {comparison: scene.comparison, revision: scene.revision, request: query.request, coverage, nodeIds: [...selectedNodes].sort(), metadataNodeIds: [...metadata].sort(), routeIds: [...selectedRoutes].sort(), visited, visitedBranches};
    }};
};
