import React, { useEffect, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MarkerType, Position } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { Anchor, SourceGraph } from '../domain/public.ts';
import '@xyflow/react/dist/style.css';

export const ReviewGraph = ({ graph, selectedPath, onOpen }: {
  graph: SourceGraph; selectedPath: string; onOpen: (anchor: Anchor) => void;
}) => {
  const [context, setContext] = useState(false);
  const [spans, setSpans] = useState(false);
  const [focusedPath, setFocusedPath] = useState(selectedPath);
  useEffect(() => setFocusedPath(selectedPath), [selectedPath]);
  const paths = [...new Set([
    ...graph.dispositions.map(item => item.path),
    ...graph.nodes.filter(node => !node.context && node.kind === 'file').map(node => node.path),
  ])];
  const focusedIds = new Set(graph.nodes.filter(node => node.path === focusedPath && node.kind === 'file').map(node => node.id));
  const neighborIds = new Set(graph.edges.filter(edge => edge.kind === 'document_reference' && (focusedIds.has(edge.source) || focusedIds.has(edge.target))).flatMap(edge => [edge.source, edge.target]));
  const related = graph.nodes.filter(node => node.kind === 'file' && node.path !== focusedPath && neighborIds.has(node.id));
  const contextNodes = context ? related.slice(0, 4) : [];
  const visible = useMemo(() => graph.nodes.filter(node =>
    node.path === focusedPath && (node.kind === 'file' || spans) || contextNodes.some(item => item.id === node.id)
  ), [graph, focusedPath, spans, context]);
  const nodes: Node[] = visible.map(node => {
    const precedingSpans = visible.filter(other => other.kind === 'hunk' && other.path === node.path && other.side === node.side && other.anchor.startLine < node.anchor.startLine).length;
    const spanRows = Math.max(0, ...(['base', 'head'] as const).map(side => visible.filter(other => other.kind === 'hunk' && other.path === focusedPath && other.side === side).length));
    const y = node.path !== focusedPath
      ? 340 + spanRows * 290 + contextNodes.indexOf(node) * 340
      : node.kind === 'hunk' ? 340 + precedingSpans * 290 : 0;
    return {
      id: node.id, position: { x: node.side === 'base' ? 0 : 560, y },
      sourcePosition: Position.Right, targetPosition: Position.Left,
      draggable: false, connectable: false, deletable: false,
      ariaLabel: `${node.side === 'base' ? 'Before' : 'After'} ${node.kind} ${node.label}. ${node.change}. Open source.`,
      style: { width: 430, height: node.kind === 'file' ? 300 : 250 },
      data: { label: <div className={`graph-node ${node.kind}`}>
        <span className="eyebrow">{node.side === 'base' ? 'Before' : 'After'} · {node.change} · {node.kind}</span>
        <strong>{node.label}</strong>
        <span className="graph-summary">{node.summary || 'Prepared source; no change excerpt'}</span>
        <button className="nodrag nopan" onClick={() => onOpen(node.anchor)}>
          Open {node.side} {node.path}{node.kind === 'hunk' ? `:${node.anchor.startLine}–${node.anchor.endLine}` : ''}
        </button>
      </div> },
    };
  });
  const ids = new Set(nodes.map(node => node.id));
  const edges: Edge[] = graph.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target)).map(edge => ({
    id: edge.id, source: edge.source, target: edge.target,
    label: edge.kind === 'document_reference' ? 'document link' : edge.label,
    type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: edge.kind === 'document_reference' ? '#5e638a' : '#858b92', strokeDasharray: edge.kind === 'document_reference' ? '5 3' : undefined },
    focusable: true, ariaLabel: `${edge.kind}: ${edge.label}; ${edge.method}`,
  }));
  const evidenceButton = (anchor: Anchor) => <button onClick={() => onOpen(anchor)}>{anchor.side} · {anchor.path}:{anchor.startLine}–{anchor.endLine}</button>;
  const focusFile = (path: string) => {
    setFocusedPath(path);
    setSpans(false);
    setContext(false);
  };
  return <section className="review-graph" aria-labelledby="graph-title" id="review-graph">
    <div className="graph-heading"><div>
      <p className="eyebrow">Source structure · read only</p>
      <h2 id="graph-title" tabIndex={-1}>Change map</h2>
      <p>{paths.length} changed paths · {graph.dispositions.filter(item => item.state === 'prepared').length} prepared changed-file sides · {graph.dispositions.filter(item => item.state !== 'prepared').length} unavailable/unprepared</p>
    </div><div className="graph-options">
      <label><input type="checkbox" checked={context} onChange={event => setContext(event.target.checked)} /> Show referenced context</label>
      <label><input type="checkbox" checked={spans} onChange={event => setSpans(event.target.checked)} /> Show selected file’s changed spans</label>
    </div></div>
    <nav aria-label="Changed files" className="changed-file-index">
      <h3>Complete changed-file index</h3>
      <p>Choose a file to focus the map. Source selection and question drafts stay where you left them.</p>
      <ul>{paths.map(path => {
        const file = graph.nodes.find(node => node.path === path && node.kind === 'file');
        const dispositions = graph.dispositions.filter(item => item.path === path);
        return <li key={path}><button aria-current={focusedPath === path ? 'true' : undefined} aria-label={`Focus ${path}`} onClick={() => focusFile(path)}>
          <strong>{path}</strong><span>{file?.change ?? 'unavailable'} · {dispositions.map(item => `${item.side}: ${item.state}`).join(' · ') || 'legacy prepared source'}</span>
        </button></li>;
      })}</ul>
    </nav>
    <p className="graph-focus" role="status">Focused file: <strong>{focusedPath}</strong> · {nodes.length} visible nodes · {edges.length} visible relationships of {graph.edges.length} total. {context ? `${contextNodes.length} of ${related.length} directly related source nodes shown.` : `${related.length} directly related source nodes available through context expansion.`}</p>
    <div className="graph-columns" aria-hidden="true"><strong>Before · base</strong><strong>After · head</strong></div>
    <div className="graph-canvas"><ReactFlow key={`${graph.snapshotId}:${focusedPath}:${context}:${spans}`} nodes={nodes} edges={edges}
      fitView fitViewOptions={{ padding: 0.15, maxZoom: 1 }} minZoom={0.15} maxZoom={1.4}
      nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null}
      onNodeDoubleClick={(_event, node) => { const item = graph.nodes.find(item => item.id === node.id); if (item) onOpen(item.anchor); }}
      onEdgeClick={(_event, edge) => { const item = graph.edges.find(item => item.id === edge.id); if (item?.anchors[0]) onOpen(item.anchors[0]); }}>
      <Background /><Controls showInteractive={false} />
    </ReactFlow></div>
    {!nodes.length && <p>No selectable source for this file. Its changed-path disposition remains in the inventory below.</p>}
    <p className="graph-limits">{graph.unknowns.join(' ')}</p>
    <details><summary>Accessible source and relationship evidence ({graph.nodes.length} nodes, {graph.edges.length} relationships)</summary>
      <div className="graph-evidence"><h3>Source nodes</h3><ul>{graph.nodes.map(node => <li key={node.id}>{evidenceButton(node.anchor)}<span>{node.kind} · {node.method} · {node.change}</span></li>)}</ul>
        <h3>Relationships</h3><ul>{graph.edges.map(edge => <li key={edge.id}><strong>{edge.kind}: {edge.label}</strong><span>{edge.method}</span>{edge.anchors.map((anchor, index) => <React.Fragment key={index}>{evidenceButton(anchor)}</React.Fragment>)}</li>)}</ul>
      </div>
    </details>
    <details><summary>Unresolved references and changed-path dispositions ({graph.unresolved.length} unresolved)</summary><ul>
      {graph.unresolved.map((reference, index) => <li key={index}>{evidenceButton(reference.source)} → {reference.destination}: {reference.reason}</li>)}
      {graph.dispositions.filter(item => item.state !== 'prepared').map(item => <li key={item.side + item.path}>{item.side} {item.path}: {item.state} · {item.reason}</li>)}
    </ul></details>
  </section>;
};
