import React from 'react';
import {BaseEdge} from '@xyflow/react';

/** Literal Test/edit ownership only. No semantic label card or route editor. */
export const TestEditConnection = ({id, source, target, path, markerEnd, measureOnly}: {
    id: string; source: string; target: string; path: string; markerEnd: string | undefined; measureOnly: boolean;
}) => <g data-route-id={id} data-test-edit-source={source} data-test-edit-target={target}
    data-source-port="bottom" data-target-port="top" aria-label="Test source edit connection"
    aria-hidden={measureOnly || undefined} style={measureOnly ? {visibility: 'hidden', pointerEvents: 'none'} : {}}>
    <BaseEdge id={id} path={path} interactionWidth={0} {...(markerEnd ? {markerEnd} : {})}/>
</g>;
