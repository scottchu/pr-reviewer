import { childContentBounds } from './graph-bounds.ts';
import { dimensions } from './graph-geometry.ts';
export const beginsRouteDrag = (pointerType: string, designatedHandle: boolean, edgeStroke: boolean) =>
    pointerType !== 'touch' || (!edgeStroke && designatedHandle);

export const keyboardDelta = (key: string) => ({
    ArrowLeft: { x: -10, y: 0 }, ArrowRight: { x: 10, y: 0 },
    ArrowUp: { x: 0, y: -10 }, ArrowDown: { x: 0, y: 10 },
} as Readonly<Record<string, Readonly<{ x: number; y: number }>>>)[key];

export const movedNodePosition = (
    nodes: readonly import('./graph-geometry.ts').LayoutNode[],
    id: string,
    delta: Readonly<{ x: number; y: number }>,
    headers: Readonly<Record<string, number>> = {},
) => {
    const node = nodes.find(entry => entry.id === id);
    if (!node) return undefined;
    const requested = { x: node.position.x + delta.x, y: node.position.y + delta.y };
    const parent = nodes.find(entry => entry.id === node.parentId);
    if (!parent) return requested;
    const bounds = childContentBounds(nodes, id, headers)!;
    const inner = dimensions(node);
    if (bounds.max.x - inner.width < bounds.min.x || bounds.max.y - inner.height < bounds.min.y) return node.position;
    return {
        x: Math.max(bounds.min.x, Math.min(requested.x, bounds.max.x - inner.width)),
        y: Math.max(bounds.min.y, Math.min(requested.y, bounds.max.y - inner.height)),
    };
};
