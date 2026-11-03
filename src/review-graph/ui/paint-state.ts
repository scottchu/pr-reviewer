import type {GraphFilterUI} from './types.ts';
import type {ScenePinsUI} from './scene-membership.ts';
export type PaintMembership = Readonly<{nodes: ReadonlySet<string>; routes: ReadonlySet<string>}>;
export type RetainedPaint = PaintMembership & Readonly<{comparison: string}>;
/** Measurement may mount full content; only this eligible paint set can be visible. */
export const graphPaintState = (
    comparison: string, filter: GraphFilterUI, current: PaintMembership | null,
    retained: RetainedPaint | null, pins: ScenePinsUI, readers: readonly string[], failedWithGeometry: boolean,
): PaintMembership & Readonly<{established: boolean}> => {
    const membership = failedWithGeometry ? null : current ?? (retained?.comparison === comparison ? retained : null);
    const established = Boolean(membership) || failedWithGeometry;
    const nodes = new Set(membership ? [...membership.nodes, ...pins.nodes, ...readers] : []);
    const routes = new Set(membership ? [...membership.routes, ...pins.routes] : []);
    return {
        established,
        nodes: new Set(filter.nodeIds.filter(id => established && (!membership || nodes.has(id)))),
        routes: new Set(filter.relationIds.filter(id => established && (!membership || routes.has(id)))),
    };
};
