import {placeRelationLabels} from './label-placement.ts';
import { clearExternalLabel, constrainInternalLabel } from './graph-bounds.ts';
import { absoluteBoxes, sides, port, curve, automaticRoutes, type LayoutNode, type Link, type Point } from './graph-geometry.ts';

export const projectionRoutes = (
    nodes: readonly LayoutNode[],
    projectedNodes: readonly Readonly<{ id: string }>[],
    links: readonly Link[],
    sizes: Readonly<Record<string, { width: number; height: number }>>,
    manual: Readonly<Record<string, Point>>,
    headers: Readonly<Record<string, number>> = {},
) => {
    const currentIds = new Set(nodes.map(node => node.id));
    if (nodes.length !== projectedNodes.length
        || currentIds.size !== nodes.length
        || projectedNodes.some(node => !currentIds.has(node.id)))
        return null;
    return placeRelationLabels(nodes, links, automaticRoutes(nodes, links, sizes, manual), sizes, manual, headers);
};

// During a gesture, keep placement decisions stable while endpoints and a manual bend follow input.
export const liveProjectionRoutes = (
    nodes: readonly LayoutNode[],
    links: readonly Link[],
    placements: ReadonlyMap<string, import('./graph-geometry.ts').Routed>,
    manual: Readonly<Record<string, Point>>,
    sizes: Readonly<Record<string, { width: number; height: number }>> = {},
) => {
    const boxes = absoluteBoxes(nodes);
    const groups = nodes.filter(node => nodes.some(child => child.parentId === node.id)).map(node => boxes.get(node.id)!);
    const byId = new Map(nodes.map(node => [node.id, node]));
    return new Map(links.map(link => {
        const placement = placements.get(link.id)!;
        const source = boxes.get(link.source)!;
        const target = boxes.get(link.target)!;
        const [sourceSide, targetSide] = sides(source, target);
        const requested = manual[link.id] ?? placement.offset;
        const rawLabel = curve(port(source, sourceSide), port(target, targetSide), requested).label;
        const size = sizes[link.id] ?? { width: 240, height: 75 };
        const parent = byId.get(link.source)?.parentId;
        const ownGroup = parent && parent === byId.get(link.target)?.parentId ? boxes.get(parent) : undefined;
        const label = ownGroup ? constrainInternalLabel(rawLabel, size, ownGroup) : clearExternalLabel(rawLabel, size, groups);
        const offset = { x: requested.x + label.x - rawLabel.x, y: requested.y + label.y - rawLabel.y };
        const same = placement.sourceSide === sourceSide && placement.targetSide === targetSide
            && placement.offset.x === offset.x && placement.offset.y === offset.y
            && placement.label.x === label.x && placement.label.y === label.y;
        return [link.id, same ? placement : { ...placement, sourceSide, targetSide, offset, label }] as const;
    }));
};
