import {absoluteBoxes, curve, port, type LayoutNode, type Routed} from './graph-geometry.ts';
import type {SceneIdentityUI, SceneSnapshotUI, SceneRouteUI} from './types.ts';

/** Uses complete measured/manual geometry, never the rendered subset. */
export const sceneGeometry = (
    identity: SceneIdentityUI, nodes: readonly LayoutNode[],
    edges: readonly Readonly<{id: string; source: string; target: string; routed: Routed}>[],
    sizes: Readonly<Record<string, Readonly<{width: number; height: number}>>>,
): SceneSnapshotUI => {
    const boxes = absoluteBoxes(nodes);
    const routes: SceneRouteUI[] = edges.map(edge => {
        const start = port(boxes.get(edge.source)!, edge.routed.sourceSide), end = port(boxes.get(edge.target)!, edge.routed.targetSide);
        const route = curve(start, end, edge.routed.offset);
        // The quadratic is contained in its control hull. Include hit-stroke/marker padding.
        const control = {x: 2 * route.label.x - (start.x + end.x) / 2, y: 2 * route.label.y - (start.y + end.y) / 2};
        const x = Math.min(start.x, end.x, control.x) - 16, y = Math.min(start.y, end.y, control.y) - 16;
        const size = sizes[edge.id]!;
        return {id: edge.id, source: edge.source, target: edge.target,
            bounds: {x, y, width: Math.max(start.x, end.x, control.x) + 16 - x, height: Math.max(start.y, end.y, control.y) + 16 - y},
            labelBounds: {x: route.label.x - size.width / 2, y: route.label.y - size.height / 2, ...size}};
    });
    return {...identity, nodes: nodes.map(node => ({id: node.id, ...(node.parentId ? {parentId: node.parentId} : {}), bounds: boxes.get(node.id)!})), routes};
};
