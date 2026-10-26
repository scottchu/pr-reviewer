import React, { useLayoutEffect } from 'react';
import { Handle, Position, BaseEdge, EdgeLabelRenderer, useUpdateNodeInternals, type Node, type NodeProps, type Edge, type EdgeProps } from '@xyflow/react';
import { callActionName, callCitation, callDisplayName, declaredTestSummary, type FunctionIdentity, type CallLink, type CallAnchor } from './calls.ts';
import type { DeclaredTest } from './declared-tests.types.ts';
export type FunctionNode = Node<{
  identity: FunctionIdentity;
  active: boolean;
  testsShown: boolean;
  onRead: (identity: FunctionIdentity) => void;
  onTests: (identity: FunctionIdentity) => void;
}, 'function'>;
export const FunctionLabel = ({ id, data }: NodeProps<FunctionNode>) => {
  const update = useUpdateNodeInternals();
  useLayoutEffect(() => {
    update(id);
  }, [
    id, update
  ]);
  const anchor = data.identity.declaration;
  const description = `${anchor.side === 'base' ? 'Before' : 'After'} ${callDisplayName(data.identity)} · ${anchor.path}:${anchor.startLine}–${anchor.endLine}`;
  return <div
    className={`function-object ${data.identity.seed ? 'changed-seed' : 'call-context'} ${data.active ? 'active' : ''}`}
    data-function-id={data.identity.id}
  >

    <Handle
      id="call-in"
      type="target"
      position={Position.Left}
      isConnectable={false}
    />

    <button
      className="function-read nodrag nopan"
      aria-label={`Read ${description}`}
      title={`${description}\nAnalyzer label ${data.identity.name}\nSHA256 ${anchor.contentHash}\nUTF-16 ${anchor.start}–${anchor.end}`}
      onClick={() => data.onRead(data.identity)}
    >

      <small>{anchor.side === 'base' ? 'Before' : 'After'} · {data.identity.sourceUnchanged ? 'unchanged source' : data.identity.seed ? 'changed' : 'context'}</small>
      <span>{callDisplayName(data.identity)}</span>

      <small>

        {anchor.path.split('/').at(-1)}:

        {anchor.startLine}–

        {anchor.endLine}

        </small>

    </button>

    {data.identity.seed && <button
      className="function-tests nodrag nopan"
      aria-label={`Relevant tests for ${description}`}
      title="Relevant declared tests; no execution"
      aria-pressed={data.testsShown}
      onClick={() => data.onTests(data.identity)}
    >

      <svg
        width="16"
        height="18"
        viewBox="0 0 20 22"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        aria-hidden="true"
      >

        <path d="M6 2h8M8 2v6L3 18q-1 2 2 2h10q3 0 2-2L12 8V2M6 13h8" />

      </svg>

    </button>}

    <Handle
      id="call-out"
      type="source"
      position={Position.Right}
      isConnectable={false}
    />

  </div>;
};
export type DeclaredTestNode = Node<{
  record: DeclaredTest;
  onRead: (record: DeclaredTest) => void;
}, 'declaredTest'>;
export const DeclaredTestLabel = ({ data }: NodeProps<DeclaredTestNode>) => <div className="declared-test-node">

  <Handle
    id="test-in"
    type="target"
    position={Position.Left}
    isConnectable={false}
  />

  <button
    className={`declared-test-object nodrag nopan ${data.record.classification}`}
    data-declared-test={data.record.id}
    onClick={() => data.onRead(data.record)}
    aria-label={`Read declared test ${data.record.name}`}
    title={`${data.record.name}\n${data.record.summary}\n${data.record.limit}`}
  >

    <span>Declared test ·

      {data.record.classification === 'unmodified' ? 'unchanged context' : data.record.classification}</span>

    <strong>

      {declaredTestSummary(data.record)}

    </strong>

    <small>

      {data.record.path} · not run</small>

  </button>

</div>;
export type CallEdge = Edge<{
  link: CallLink;
  active: boolean;
  onExplain: (link: CallLink) => void;
  caller: FunctionIdentity;
  callee: FunctionIdentity;
  lane: number;
}, 'call'>;
export const CallLine = (props: EdgeProps<CallEdge>) => {
  const data = props.data;
  const x = (props.sourceX + props.targetX) / 2;
  const y = (props.sourceY + props.targetY) / 2 + (data?.lane ?? 0);
  const control = Math.max(10, Math.abs(props.targetX - props.sourceX) / 4);
  // Independent curves avoid a shared step trunk. Two joined cubics retain
  // horizontal endpoint tangents and exact ports, including parallel records.
  const path = `M ${props.sourceX},${props.sourceY} C ${props.sourceX + control},${props.sourceY} ${x - control},${y} ${x},${y} C ${x + control},${y} ${props.targetX - control},${props.targetY} ${props.targetX},${props.targetY}`;
  const name = data ? callActionName(data.link, data.caller, data.callee) : 'Call relationship unavailable';
  return <>

    <BaseEdge
      id={props.id}
      path={path}
      {...(props.markerEnd ? {
        markerEnd: props.markerEnd
      } : {})}
      style={{
        stroke: data?.active ? '#e2d194' : '#8daebe',
        strokeWidth: data?.active ? 2.5 : 1.3,
        strokeDasharray: data?.link.certainty === 'source_observed_manual' ? '5 3' : undefined
      }}
    />

    <EdgeLabelRenderer>

      <button
        className={`call-edge-label nodrag nopan ${data?.active ? 'active' : ''}`}
        style={{
          transform: `translate(-50%, -50%) translate(${x}px,${y}px)`
        }}
        title={data ? `${name}\n${callCitation(data.link)}` : ''}
        aria-label={name}
        data-call-id={props.id}
        onClick={() => data?.onExplain(data.link)}
      >calls</button>

    </EdgeLabelRenderer>

  </>;
};
export const CallExplanation = ({ link, nodes, onClose, onInspect }: {
  link: CallLink;
  nodes: readonly FunctionIdentity[];
  onClose: () => void;
  onInspect?: (anchor: CallAnchor) => void;
}) => {
  const caller = nodes.find(node => node.id === link.caller)!;
  const callee = nodes.find(node => node.id === link.callee)!;
  const callerName = callDisplayName(caller), calleeName = callDisplayName(callee);
  const what = callee.name === 'accessHeaders'
    ? `${callerName} delegates its access headers to accessHeaders. Local-owner requests omit Bearer; explicit credentials retain it.`
    : caller.name === 'refresh' && callee.name === 'request'
      ? 'Refresh loads the pinned review through request. Its source body is unchanged here, while request’s access-header choice changes.'
      : caller.name === 'authenticate' && callee.name === 'localPrincipal'
        ? 'Authentication checks whether this reference identifies the local owner before looking up a credential.'
        : callee.name === 'accessReference'
          ? `${callerName} derives an access reference through the shared helper. The helper distinguishes the in-process owner capability from credential strings.`
          : `${callerName} calls ${calleeName} at ${link.sites[0]?.anchor.path}:${link.sites[0]?.anchor.startLine}. This is direct source context in the pinned comparison.`;
  return <section
    className="relationship-reader nodrag nopan nowheel"
    aria-label="Call relationship explanation"
    onWheel={event => event.stopPropagation()}
  >

    <div className="reader-heading">

      <strong>

        {callerName} →

        {calleeName}</strong>

      <button
        aria-label="Close relationship explanation"
        onClick={onClose}
      >×</button>

    </div>

    <p className="reader-relation">

      {link.target.side === 'base' ? 'Before' : 'After'} ·

      {link.sites[0]?.anchor.path}</p>

    <p className="reader-primary">

      {what}

    </p>

    <details>

      <summary>Why and source evidence</summary>

      <p>Source fact: the exact call expression and target are retained below. Intended rationale beyond these source facts is inference; execution, security and whole-project coverage are unknown.</p>

      <pre>

        {callCitation(link)}

      </pre>
      {onInspect && link.sites.map(site => <button key={`${site.anchor.side}:${site.anchor.start}`} className="callsite-action"
        onClick={() => onInspect(site.anchor)}>Read callsite {site.anchor.side === 'base' ? 'Before' : 'After'} · {site.anchor.path}:{site.anchor.startLine}</button>)}

      <p>

        {link.certainty === 'source_observed_manual' ? 'Source-observed lexical call; the analyzer obstruction remains unresolved.' : 'Statically resolved in the bounded supplied source corpus; not a runtime trace.'}

      </p>

    </details>

  </section>;
};
