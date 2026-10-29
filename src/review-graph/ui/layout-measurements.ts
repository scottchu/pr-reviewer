import type {LayoutNode} from './graph-geometry.ts';

type MeasuredNode = Pick<LayoutNode, 'id' | 'measured'>;
const positiveDimension = (value: number | undefined): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value > 0;

/** ReactFlow stores render projections. Import dimensions only into the full model. */
export const withMeasuredGeometry = <T extends LayoutNode>(
    full: readonly T[],
    observed: readonly MeasuredNode[],
): (T & Pick<LayoutNode, 'measured'>)[] => {
    const measurements = new Map(observed.map(node => [node.id, node.measured]));
    return full.map(node => {
        const measured = measurements.get(node.id);
        const width = measured?.width;
        const height = measured?.height;
        if (!positiveDimension(width) && !positiveDimension(height)) return node;
        return {
            ...node,
            measured: {
                ...node.measured,
                ...(positiveDimension(width) ? {width} : {}),
                ...(positiveDimension(height) ? {height} : {}),
            },
        };
    });
};
