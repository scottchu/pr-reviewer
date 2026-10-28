import { absoluteBoxes, sides, port, curve, automaticRoutes, type LayoutNode, type Link, type Point } from './graph-geometry.ts';

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

// During a gesture, keep placement decisions stable while endpoints and a manual bend follow input.
export const liveProjectionRoutes = (
    nodes: readonly LayoutNode[],
    links: readonly Link[],
    placements: ReadonlyMap<string, import('./graph-geometry.ts').Routed>,
    manual: Readonly<Record<string, Point>>,
) => {
    const boxes = absoluteBoxes(nodes);
    return new Map(links.map(link => {
        const placement = placements.get(link.id)!;
        const source = boxes.get(link.source)!;
        const target = boxes.get(link.target)!;
        const [sourceSide, targetSide] = sides(source, target);
        const offset = manual[link.id] ?? placement.offset;
        const label = curve(port(source, sourceSide), port(target, targetSide), offset).label;
        const same = placement.sourceSide === sourceSide && placement.targetSide === targetSide
            && placement.offset.x === offset.x && placement.offset.y === offset.y
            && placement.label.x === label.x && placement.label.y === label.y;
        return [link.id, same ? placement : { sourceSide, targetSide, offset, label }] as const;
    }));
};
