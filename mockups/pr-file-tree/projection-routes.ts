import { automaticRoutes, type LayoutNode, type Link, type Point } from './graph-geometry.ts';

export const projectionRoutes = (
    nodes: readonly LayoutNode[],
    projectedNodes: readonly Readonly<{ id: string }>[],
    links: readonly Link[],
    sizes: Readonly<Record<string, { width: number; height: number }>>,
    manual: Readonly<Record<string, Point>>,
) => {
    const currentIds = new Set(nodes.map(node => node.id));
    if (nodes.length !== projectedNodes.length
        || currentIds.size !== nodes.length
        || projectedNodes.some(node => !currentIds.has(node.id)))
        return null;
    return automaticRoutes(nodes, links, sizes, manual);
};
