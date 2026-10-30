import {absoluteBoxes, internalLabelPlans, curve, port, type LayoutNode, type Link, type Box, type Point, type Routed, type LabelSize} from './graph-geometry.ts';
import {clearExternalLabel, constrainInternalLabel} from './graph-bounds.ts';

const gap = 12;
const overlaps = (a: Box, b: Box): boolean =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const rectangle = (center: Point, size: LabelSize): Box =>
    ({x: center.x - size.width / 2, y: center.y - size.height / 2, ...size});
const distance = (a: Point, b: Point): number => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/** Event-boundary search, then a guaranteed exterior fallback for an unbounded canvas. */
const freePosition = (
    requested: Point, size: LabelSize, obstacles: readonly Box[], constrain: (point: Point) => Point,
    inside?: Box,
): Point | undefined => {
    const fits = (point: Point) => {
        const box = rectangle(point, size);
        return !inside || (box.x >= inside.x && box.y >= inside.y &&
            box.x + box.width <= inside.x + inside.width && box.y + box.height <= inside.y + inside.height);
    };
    const queue = [constrain(requested)];
    const visited = new Set<string>();
    for (let count = 0; queue.length && count < 48; count++) {
        queue.sort((a, b) => distance(a, requested) - distance(b, requested));
        const point = queue.shift()!;
        const key = point.x + ':' + point.y;
        if (visited.has(key)) continue;
        visited.add(key);
        if (!fits(point)) continue;
        const blocked = obstacles.filter(box => overlaps(rectangle(point, size), box));
        if (!blocked.length) return point;
        for (const box of blocked) {
            queue.push(...[
                {x: box.x - size.width / 2 - gap, y: point.y},
                {x: box.x + box.width + size.width / 2 + gap, y: point.y},
                {x: point.x, y: box.y - size.height / 2 - gap},
                {x: point.x, y: box.y + box.height + size.height / 2 + gap},
            ].map(constrain).filter(candidate => !visited.has(candidate.x + ':' + candidate.y)));
        }
    }
    if (inside) return undefined;
    const left = Math.min(requested.x, ...obstacles.map(box => box.x));
    const right = Math.max(requested.x, ...obstacles.map(box => box.x + box.width));
    const top = Math.min(requested.y, ...obstacles.map(box => box.y));
    const bottom = Math.max(requested.y, ...obstacles.map(box => box.y + box.height));
    return [
        {x: left - size.width / 2 - gap, y: requested.y},
        {x: right + size.width / 2 + gap, y: requested.y},
        {x: requested.x, y: top - size.height / 2 - gap},
        {x: requested.x, y: bottom + size.height / 2 + gap},
    ].sort((a, b) => distance(a, requested) - distance(b, requested))[0];
};

/** Resolve boundaries and collisions together; no later independent clamp may move these labels. */
export const placeRelationLabels = (
    nodes: readonly LayoutNode[], links: readonly Link[], placements: ReadonlyMap<string, Routed>,
    sizes: Readonly<Record<string, LabelSize>>, manual: Readonly<Record<string, Point>>,
    headers: Readonly<Record<string, number>> = {},
): ReadonlyMap<string, Routed> => {
    const boxes = absoluteBoxes(nodes);
    const byId = new Map(nodes.map(node => [node.id, node]));
    const groups = nodes.filter(node => nodes.some(child => child.parentId === node.id)).map(node => boxes.get(node.id)!);
    const leaves = nodes.filter(node => !nodes.some(child => child.parentId === node.id)).map(node => boxes.get(node.id)!);
    const planned = new Map(internalLabelPlans(nodes, links, sizes, headers).flatMap(plan =>
        [...plan.labels].map(([id, point]) => [id, {x: boxes.get(plan.groupId)!.x + point.x, y: boxes.get(plan.groupId)!.y + point.y}] as const)));
    const ordered = links.map((link, index) => ({link, index})).sort((a, b) =>
        Number(Boolean(manual[b.link.id])) - Number(Boolean(manual[a.link.id])) ||
        Number(planned.has(b.link.id)) - Number(planned.has(a.link.id)) || a.index - b.index);
    const reserved: Box[] = [];
    const output = new Map<string, Routed>();
    for (const {link} of ordered) {
        const placement = placements.get(link.id)!;
        const size = sizes[link.id] ?? {width: 240, height: 75};
        const parent = byId.get(link.source)?.parentId;
        const own = parent && parent === byId.get(link.target)?.parentId ? boxes.get(parent) : undefined;
        const inner = own ? {x: own.x + 8, y: own.y + (headers[parent!] ?? 80),
            width: own.width - 16, height: own.height - (headers[parent!] ?? 80) - 8} : undefined;
        const constrain = own ? (point: Point) => {
            const bounded = constrainInternalLabel(point, size, own);
            return {...bounded, y: Math.max(inner!.y + size.height / 2, bounded.y)};
        } : (point: Point) => clearExternalLabel(point, size, groups);
        const source = boxes.get(link.source)!, target = boxes.get(link.target)!;
        const start = port(source, placement.sourceSide), end = port(target, placement.targetSide);
        const requested = manual[link.id] ? curve(start, end, manual[link.id]!).label : planned.get(link.id) ?? placement.label;
        const obstacles = [...leaves, ...reserved, ...(own ? [] : groups)];
        const found = manual[link.id] ? constrain(requested) : freePosition(requested, size, obstacles, constrain, inner);
        const label = found ?? constrain(requested);
        // Preserve explicit manual input; impossible automatic geometry stays observable, never a success claim.
        const blocked = !found || (!manual[link.id] && obstacles.some(box => overlaps(rectangle(label, size), box)));
        const offset = {x: label.x - (start.x + end.x) / 2, y: label.y - (start.y + end.y) / 2};
        const unchanged = !blocked && !placement.placementBlocked && placement.offset.x === offset.x && placement.offset.y === offset.y &&
            placement.label.x === label.x && placement.label.y === label.y;
        const {placementBlocked: _previousBlocked, ...prior} = placement;
        output.set(link.id, unchanged ? placement : {...prior, label, offset,
            ...(blocked ? {placementBlocked: true as const} : {})});
        reserved.push(rectangle(label, size));
    }
    return output;
};
