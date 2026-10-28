import { directFileCallRoute, type FileBounds } from './file-call-route.ts';
import React from 'react';
import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import { callActionName, callCitation, callDisplayName, type CallLink } from './calls.ts';
import type { FileCall } from './file-projection.ts';

export type FileCallEdge = Edge<FileCall & {
  active: boolean;
  lane: number;
  narrow: boolean;
  sourceBounds: FileBounds;
  targetBounds: FileBounds;
  count: number;
  targetIndex: number;
  targetCount: number;
  onExplain: (link: CallLink) => void;
}, 'fileCall'>;

export const FileCallLine = (props: EdgeProps<FileCallEdge>) => {
  const data = props.data!;
  const route = directFileCallRoute(data.sourceBounds, data.targetBounds, data.lane, data.count, data.targetIndex, data.targetCount, data.narrow);
  const color = data.status === 'added' ? '#92d4ac' : '#bdc6cc';
  const name = callActionName(data.link, data.caller, data.callee);
  return <>
    <BaseEdge id={props.id} path={route.path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} style={{ stroke: color, strokeWidth: data.active ? 2.7 : 1.8 }} />
    <EdgeLabelRenderer>
      <button
        className="file-call-label nodrag nopan"
        style={{ transform: `translate(${route.label.x}px,${route.label.y}px)`, maxWidth: data.narrow ? (data.count > 1 ? 208 : Math.max(120, 334 - route.label.x)) : (data.count > 1 ? 340 : 620), color }}
        aria-label={`${name}; ${data.status === 'added' ? 'Added call' : 'Comparison not established'}`}
        title={`${name}\n${callCitation(data.link)}`}
        data-call-id={data.link.id}
        data-relationship-status={data.status}
        onClick={() => data.onExplain(data.link)}
      >
        {callDisplayName(data.caller)}() → {callDisplayName(data.callee)}()

      </button>
    </EdgeLabelRenderer>
  </>;
};


export type FileRequirementEdge = Edge<{
  document: string;
  sourceLeft: number;
  startLine: number;
  endLine: number;
  onRead: (keyboard: boolean) => void;
  lane: number;
}, 'requirementReference'>;

export const FileRequirementLine = (props: EdgeProps<FileRequirementEdge>) => {
  const data = props.data!;
  const rail = Math.min(props.sourceX, props.targetX) - 40 - data.lane * 24;
  const path = `M${props.sourceX},${props.sourceY} H${props.sourceX + 16} V${props.sourceY + 38} H${rail} V${props.targetY} H${props.targetX}`;
  return <>
    <BaseEdge id={props.id} path={path} style={{ stroke: '#9bb9d2', strokeDasharray: '5 5' }} />
    <EdgeLabelRenderer><button className="root-requirement-reference nodrag nopan"
      style={{ transform: `translate(${data.sourceLeft}px,${props.sourceY + 20}px)` }}
      aria-label={`Read documented requirement ${data.document} After L${data.startLine}–${data.endLine}; implementation evidence src/application/review.ts After L25–33`}
      title="Requirement / implementation evidence; not a call, literal hyperlink or proven edit causation"
      data-relation-type="requirement-reference" onClick={event => data.onRead(event.detail === 0)}>Requirement reference</button></EdgeLabelRenderer>
  </>;
};
