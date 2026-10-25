import React from 'react';
import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import { callActionName, callCitation, type CallLink } from './calls.ts';
import type { FileCall } from './file-projection.ts';

export type FileCallEdge = Edge<FileCall & {
  active: boolean;
  lane: number;
  narrow: boolean;
  sourceBottom: number;
  sourceLeft: number;
  targetRight: number;
  targetBottom: number;
  onExplain: (link: CallLink) => void;
}, 'fileCall'>;

export const FileCallLine = (props: EdgeProps<FileCallEdge>) => {
  const data = props.data!;
  const left = data.sourceLeft;
  const right = Math.max(data.narrow ? left + 344 : props.targetX - 40, data.sourceLeft + (props.sourceX - data.sourceLeft) + 24, data.targetRight + 20);
  const y = data.sourceBottom + 110 + data.lane * (data.narrow ? 100 : 86);
  const sourceRail = `M${props.sourceX},${props.sourceY} H${props.sourceX + 8} V${data.sourceBottom + 32} H${left} V${y}`;
  const targetRail = `M${props.targetX},${props.targetY} H${props.targetX - 8} V${data.targetBottom + 24} H${right} V${y}`;
  const path = `M${left},${y} H${right}`;
  const color = data.status === 'added' ? '#92d4ac' : '#bdc6cc';
  const name = callActionName(data.link, data.caller, data.callee);
  return <>
    <path className="file-port-extension" d={sourceRail} data-port-owner={data.caller.declaration.path} />
    <path className="file-port-extension" d={targetRail} data-port-owner={data.callee.declaration.path} />
    <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} style={{ stroke: color, strokeWidth: data.active ? 2.7 : 1.8 }} />
    <EdgeLabelRenderer>
      <button
        className="file-call-label nodrag nopan"
        style={{ transform: `translate(${left + 8}px,${y - (data.narrow ? 70 : 46)}px)`, maxWidth: right - left - 16, color }}
        aria-label={`${name}; ${data.status === 'added' ? 'Added call' : 'Comparison not established'}`}
        title={`${name}\n${callCitation(data.link)}`}
        data-call-id={data.link.id}
        data-relationship-status={data.status}
        onClick={() => data.onExplain(data.link)}
      >
        {data.caller.name}() → {data.callee.name}()

      </button>
      <span className="file-route-owner" style={{ transform: `translate(${left + 8}px,${y + 6}px)` }}>from {data.caller.declaration.path.split('/').at(-1)}</span>
      <span className="file-route-owner file-route-target" style={{ transform: `translate(${right - 6}px,${y + 6}px) translateX(-100%)` }}>to {data.callee.declaration.path.split('/').at(-1)}</span>
    </EdgeLabelRenderer>
  </>;
};


export type FileRequirementEdge = Edge<{
  document: string;
  sourceLeft: number;
  startLine: number;
  endLine: number;
  onRead: () => void;
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
      data-relation-type="requirement-reference" onClick={data.onRead}>Requirement reference</button></EdgeLabelRenderer>
  </>;
};
