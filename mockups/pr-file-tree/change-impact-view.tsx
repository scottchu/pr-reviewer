import React, { useEffect, useRef } from 'react';
import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from '@xyflow/react';
import type { StoryReference } from '../../src/domain/public.ts';
import type { ChangeImpact } from './change-impact.ts';

type ReadyImpact = Extract<ChangeImpact, { status: 'ready' }>;
export type ChangeImpactEdge = Edge<{ impact: ReadyImpact; sourceBottom: number; onExplain: () => void }, 'changeImpact'>;
export const ChangeImpactLine = (props: EdgeProps<ChangeImpactEdge>) => {
  const data = props.data!;
  const right = Math.max(props.sourceX + 24, props.targetX + 344);
  const lane = data.sourceBottom + 68;
  const path = `M${props.sourceX},${props.sourceY} H${right} V${lane} H${props.targetX - 8} V${props.targetY} H${props.targetX}`;
  return <>
    <BaseEdge id={props.id} path={path} style={{ stroke: '#baa6d6', strokeWidth: 1.8 }} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} />
    <EdgeLabelRenderer><button className="change-impact-label nodrag nopan"
      style={{ transform: `translate(${props.targetX + 8}px,${data.sourceBottom + 12}px)` }}
      data-impact-id={data.impact.claim.id} data-relation-type="change-impact"
      data-source-change={data.impact.source.key} data-target-change={data.impact.target.key}
      aria-label="Explain inferred change consequence: server/public.ts → application/review.ts; requires matching owner-request headers"
      onClick={data.onExplain}>Requires matching owner-request headers</button></EdgeLabelRenderer>
  </>;
};

export const ChangeImpactExplanation = ({ impact, narrow, busy, onClose, onInspect }: {
  impact: ReadyImpact;
  narrow: boolean;
  busy: boolean;
  onClose: () => void;
  onInspect: (reference: StoryReference, keyboard: boolean) => void;
}) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <section ref={panel} className={`relationship-reader impact-explanation${narrow ? ' owner-modal' : ''}`}
    role={narrow ? 'dialog' : 'region'} aria-modal={narrow ? true : undefined} aria-label="Change consequence explanation"
    onWheel={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (narrow && event.key === 'Tab') {
        const buttons = panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons?.[0]; const last = buttons?.[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <div className="reader-heading"><h2 ref={heading} tabIndex={-1}>Matching owner-request headers</h2><button aria-label="Close change consequence" onClick={onClose}>×</button></div>
    <small>Prepared inference · source-derived implementation consequence</small>
    <p>{impact.claim.text}</p>
    <p className="owner-limit">{impact.claim.uncertainty}</p>
    <p>Gateway change → review request change</p>
    <h3>Exact source evidence</h3>
    {impact.claim.references.map((reference, index) => reference.type === 'snapshot_source' && <button key={index}
      className="callsite-action" disabled={busy} onClick={event => onInspect(reference, event.detail === 0)}>
      Read {reference.anchor.side === 'base' ? 'Before' : 'After'} · {reference.anchor.path} L{reference.anchor.startLine}–{reference.anchor.endLine}
    </button>)}
  </section>;
};
