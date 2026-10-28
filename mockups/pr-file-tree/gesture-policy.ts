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
) => {
    const node = nodes.find(entry => entry.id === id);
    if (!node) return undefined;
    const requested = { x: node.position.x + delta.x, y: node.position.y + delta.y };
    const parent = nodes.find(entry => entry.id === node.parentId);
    if (!parent) return requested;
    const outer = dimensions(parent);
    const inner = dimensions(node);
    return {
        x: Math.max(0, Math.min(requested.x, outer.width - inner.width)),
        y: Math.max(0, Math.min(requested.y, outer.height - inner.height)),
    };
};
