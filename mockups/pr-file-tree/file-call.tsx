import React from 'react';
import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import { callActionName, callCitation, type CallLink } from './calls.ts';
import type { FileCall } from './file-projection.ts';

export type FileCallEdge = Edge<FileCall & {
  active: boolean;
  lane: number;
  narrow: boolean;
  labelX: number;
  onExplain: (link: CallLink) => void;
}, 'fileCall'>;

export const FileCallLine = (props: EdgeProps<FileCallEdge>) => {
  const data = props.data!;
  const x = data.narrow ? data.labelX : (props.sourceX + props.targetX) / 2;
  const y = data.narrow ? props.sourceY + 85 + data.lane : props.sourceY + data.lane;
  const bend = data.narrow ? Math.max(props.sourceX, props.targetX) + 55 : x;
  const path = `M${props.sourceX},${props.sourceY} C${bend},${props.sourceY} ${bend},${y} ${x},${y} C${x},${y + 45} ${props.targetX - 45},${props.targetY} ${props.targetX},${props.targetY}`;
  const color = data.status === 'added' ? '#92d4ac' : '#bdc6cc';
  const name = callActionName(data.link, data.caller, data.callee);
  return <>
    <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} style={{ stroke: color, strokeWidth: data.active ? 2.7 : 1.8 }} />
    <EdgeLabelRenderer>
      <button
        className="file-call-label nodrag nopan"
        style={{ transform: `translate(${x}px,${y}px)${data.narrow ? '' : ' translate(-50%,-50%)'}`, color }}
        aria-label={`${name}; ${data.status === 'added' ? 'Added call' : 'Comparison not established'}`}
        title={`${name}\n${callCitation(data.link)}`}
        data-call-id={data.link.id}
        data-relationship-status={data.status}
        onClick={() => data.onExplain(data.link)}
      >
        {data.caller.name}() → {data.callee.name}()

      </button>
    </EdgeLabelRenderer>
  </>;
};
