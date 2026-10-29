export type ToolbarPointUI = Readonly<{x: number; y: number}>;
export type ToolbarBoundsUI = Readonly<{width: number; height: number; toolbarWidth: number; toolbarHeight: number}>;
export type ToolbarDragUI = Readonly<{pointerId: number; pointer: ToolbarPointUI; origin: ToolbarPointUI}>;

const extent = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
export const clampToolbarPosition = (point: ToolbarPointUI, bounds: ToolbarBoundsUI): ToolbarPointUI => ({
    x: Math.max(0, Math.min(Number.isFinite(point.x) ? point.x : 0, Math.max(0, extent(bounds.width) - extent(bounds.toolbarWidth)))),
    y: Math.max(0, Math.min(Number.isFinite(point.y) ? point.y : 0, Math.max(0, extent(bounds.height) - extent(bounds.toolbarHeight)))),
});

/** Toolbar coordinates are CSS pixels, independent of the graph camera/zoom. */
export const dragToolbarPosition = (drag: ToolbarDragUI, pointer: ToolbarPointUI, bounds: ToolbarBoundsUI) =>
    clampToolbarPosition({x: drag.origin.x + pointer.x - drag.pointer.x, y: drag.origin.y + pointer.y - drag.pointer.y}, bounds);

export const toolbarArrowPosition = (point: ToolbarPointUI, key: string, bounds: ToolbarBoundsUI): ToolbarPointUI | null => {
    const directions = {ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10]} as const;
    if (!Object.hasOwn(directions, key)) return null;
    const delta = directions[key as keyof typeof directions];
    return delta ? clampToolbarPosition({x: point.x + delta[0], y: point.y + delta[1]}, bounds) : null;
};
