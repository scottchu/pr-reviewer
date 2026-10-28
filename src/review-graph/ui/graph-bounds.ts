import { dimensions, groupInterior, type Box, type LayoutNode, type Point } from './graph-geometry.ts';

export const childContentBounds = (nodes: readonly LayoutNode[], id: string, headers: Readonly<Record<string, number>> = {}) => {
    const node = nodes.find(entry => entry.id === id);
    const parent = nodes.find(entry => entry.id === node?.parentId);
    if (!parent) return undefined;
    const outer = dimensions(parent);
    return {
        min: { x: groupInterior.padding, y: headers[parent.id] ?? groupInterior.top },
        max: { x: outer.width - groupInterior.padding, y: outer.height - groupInterior.padding },
    };
};

const clearance = 8;
const outside = (center: Point, size: { width: number; height: number }, group: Box) =>
    center.x + size.width / 2 <= group.x - clearance
    || center.x - size.width / 2 >= group.x + group.width + clearance
    || center.y + size.height / 2 <= group.y - clearance
    || center.y - size.height / 2 >= group.y + group.height + clearance;

export const clearExternalLabel = (requested: Point, size: { width: number; height: number }, groups: readonly Box[]): Point => {
    if (groups.every(group => outside(requested, size, group))) return requested;
    const xs = [requested.x, ...groups.flatMap(group => [group.x - size.width / 2 - clearance, group.x + group.width + size.width / 2 + clearance])];
    const ys = [requested.y, ...groups.flatMap(group => [group.y - size.height / 2 - clearance, group.y + group.height + size.height / 2 + clearance])];
    let best = requested;
    let distance = Infinity;
    for (const x of xs)
        for (const y of ys) {
            const candidate = { x, y };
            const squared = (x - requested.x) ** 2 + (y - requested.y) ** 2;
            if (squared < distance && groups.every(group => outside(candidate, size, group))) {
                best = candidate;
                distance = squared;
            }
        }
    return best;
};

export const constrainInternalLabel = (requested: Point, size: { width: number; height: number }, group: Box): Point => ({
    x: Math.max(group.x + size.width / 2 + clearance, Math.min(requested.x, group.x + group.width - size.width / 2 - clearance)),
    y: Math.max(group.y + size.height / 2 + clearance, Math.min(requested.y, group.y + group.height - size.height / 2 - clearance)),
});
