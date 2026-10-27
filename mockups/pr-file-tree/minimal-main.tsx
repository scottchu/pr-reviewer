import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Background, BaseEdge, EdgeLabelRenderer, Handle, Position,
  MarkerType, getBezierPath, useNodesState, useReactFlow, type Node, type NodeProps, type Edge,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './minimal.css';
import { installPageGestureBoundary } from './page-gestures.ts';
import { comparisonGraph as minimalGraph, allEntities, allRelations, isPairedSubject, type GraphEntity, type GraphRelation } from './comparison-graph.ts';

import { cardRows, edgeRows, entityVersion, groupSize, rowPositions, omittedStructuralEdge, locationPeers } from './minimal-projection.ts';

type EntityNode = Node<{ entity: GraphEntity; viewId: string }, 'entity' | 'graph'>;
type RelationEdge = Edge<{ relation: GraphRelation; locationLane: number; locationCount: number }, 'relation'>;

const Ports = ({ entity }: { entity: GraphEntity }) => <>
  {entity.kind === 'file' && locationPeers(entity.id).map((edge, index, peers) => (
    <Handle key={edge.id} id={'file-in:' + edge.id} type="target" position={(rowPositions[entity.id]?.x ?? 0) < 0 ? Position.Right : Position.Left} style={{ top: ((index + 1) / (peers.length + 1) * 100) + '%' }} />
  ))}
  <Handle id="in-top" type="target" position={Position.Top} />
  <Handle id="in-left" type="target" position={Position.Left} />
  <Handle id="in-right" type="target" position={Position.Right} />
  <Handle id="in-before" type="target" position={Position.Right} style={{ top: '30%' }} />
  <Handle id="in-after-location" type="target" position={Position.Right} style={{ top: '70%' }} />
  <Handle id="location-before" type="source" position={Position.Left} style={{ top: '30%' }} />
  <Handle id="location-after" type="source" position={Position.Left} style={{ top: '70%' }} />
  <Handle id="out-bottom" type="source" position={Position.Bottom} />
  <Handle id="out-left" type="source" position={Position.Left} />
  <Handle id="out-right" type="source" position={Position.Right} />
</>;
const Version = ({ value }: { value: GraphRelation['version'] }) => value === 'comparison' ? null : <span className="version-tag">{value === 'before' ? 'Before' : 'After'}</span>;
const Entity = ({ data }: NodeProps<EntityNode>) => {
  const card = cardRows(data.entity);
  const paired = isPairedSubject(data.entity.id);
  const version = paired ? 'comparison' : entityVersion(data.entity.id);
  return <article className={'minimal-entity' + (typeof data.entity.data.comparisonStatus === 'string' ? ' status-' + data.entity.data.comparisonStatus.replaceAll(' ', '-') : '')} {...(data.entity.kind === 'file' ? { style: { minHeight: Math.max(70, locationPeers(data.entity.id).length * 18 + 40) } } : {})}>
    <Ports entity={data.entity} />
    {paired && <>
      <Handle id="in-after" type="target" position={Position.Right} style={{ top: '30%' }} />
      <Handle id="out-before" type="source" position={Position.Bottom} style={{ left: '30%' }} />
      <Handle id="out-after" type="source" position={Position.Right} style={{ top: '70%' }} />
    </>}
    <h2>{card.title}</h2>
    {card.rows.map((row, index) => <p key={index}>{row}</p>)}
  </article>;
};
const GraphBoundary = ({ data }: NodeProps<EntityNode>) => (
  <section className="minimal-change-graph" aria-label={`${String(data.entity.data.name)} graph`}>
    <h2>{String(data.entity.data.name)}</h2>
    {data.entity.id !== 'change' && <Handle id="before" type="source" position={Position.Bottom} style={{ left: 190, top: 70, bottom: 'auto' }} />}
    {data.entity.id !== 'change' && <Handle id="after" type="source" position={Position.Bottom} style={{ left: 790, top: 70, bottom: 'auto' }} />}
    <Handle id="in-right" type="target" position={Position.Right} style={{ top: '25%' }} />
    <Handle id="in-left" type="target" position={Position.Left} style={{ top: '25%' }} />
    <Handle id="out-right" type="source" position={Position.Right} style={{ top: '65%' }} />
    <Handle id="out-left" type="source" position={Position.Left} style={{ top: '65%' }} />
    <Handle id="out-bottom" type="source" position={Position.Bottom} />
  </section>
);
const Relation = (props: EdgeProps<RelationEdge>) => {
  const { getZoom } = useReactFlow();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ pointer: number; clientX: number; clientY: number; x: number; y: number; zoom: number } | null>(null);
  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation(); event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, ...offset, zoom: getZoom() };
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current; if (!start || start.pointer !== event.pointerId) return;
    event.stopPropagation(); event.preventDefault();
    setOffset({ x: start.x + (event.clientX - start.clientX) / start.zoom, y: start.y + (event.clientY - start.clientY) / start.zoom });
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    event.stopPropagation(); drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const [defaultPath, defaultX, defaultY] = getBezierPath(props);
  if (!props.data) return null;
  const testLink = props.data.relation.from === 'test-change' && props.data.relation.to === 'change';
  const outerLeft = testLink && props.data.relation.relation === 'motivated_by';
  const outerRight = testLink && props.data.relation.relation === 'verifies';
  const direction = outerLeft ? -1 : 1;
  const versionedLocation = props.data.relation.relation === 'located_in' && props.targetX < 0;
  const middleX = (props.sourceX + props.targetX) / 2;
  const locationX = props.targetX + 330;
  const locationY = props.targetY + (props.data.locationLane - (props.data.locationCount - 1) / 2) * 70;
  const controlX = (locationX - (props.sourceX + props.targetX) / 8) / 0.75;
  const locationOffset = (locationY - (props.sourceY + props.targetY) / 2) / 0.75;
  const reverseCall = props.data.relation.relation === 'calls' && props.sourceX > props.targetX;
  const callControlX = props.sourceX - 160;
  const path = versionedLocation
    ? `M${props.sourceX},${props.sourceY} C${controlX},${props.sourceY + locationOffset} ${controlX},${props.targetY + locationOffset} ${props.targetX},${props.targetY}`
    : reverseCall
    ? `M${props.sourceX},${props.sourceY} C${callControlX},${props.sourceY} ${callControlX},${props.targetY} ${props.targetX},${props.targetY}`
    : outerLeft || outerRight
    ? `M${props.sourceX},${props.sourceY} C${props.sourceX + direction * 320},${props.sourceY} ${props.targetX + direction * 320},${props.targetY} ${props.targetX},${props.targetY}`
    : defaultPath;
  const x = versionedLocation ? locationX : reverseCall ? (props.sourceX + props.targetX) / 8 + callControlX * 0.75 : outerLeft || outerRight ? (props.sourceX + props.targetX) / 2 + direction * 240 : defaultX;
  const y = versionedLocation ? locationY : reverseCall ? (props.sourceY + props.targetY) / 2 : outerLeft || outerRight ? (props.sourceY + props.targetY) / 2 : defaultY;
  const ownCall = props.data.relation.relation === 'calls' && props.data.relation.from.startsWith('callsite:') && props.sourceX < props.targetX;
  // Follow the existing right-to-left cubic at t=.8, beyond the unrelated cross-graph path.
  const t = 0.8; const u = 1 - t;
  const callLabelX = u ** 3 * props.sourceX + 3 * u * t * ((props.sourceX + props.targetX) / 2) + t ** 3 * props.targetX;
  const callLabelY = (u ** 3 + 3 * u ** 2 * t) * props.sourceY + (3 * u * t ** 2 + t ** 3) * props.targetY;
  const card = edgeRows(props.data.relation);
  return <>
    <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} />
    <EdgeLabelRenderer>
      <div className={`minimal-edge-card version-${props.data.relation.version} nodrag nopan`} data-relation={props.data.relation.relation} data-edge-id={props.id} role="button" tabIndex={0} aria-label={`Move ${card.title} label`} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={event => { const delta = ({ ArrowLeft: [-10,0], ArrowRight: [10,0], ArrowUp: [0,-10], ArrowDown: [0,10] } as Record<string, number[]>)[event.key]; if (event.key === 'Home') { event.preventDefault(); event.stopPropagation(); setOffset({x:0,y:0}); } else if (delta) { event.preventDefault(); event.stopPropagation(); setOffset(value => ({ x: value.x + delta[0]!, y: value.y + delta[1]! })); } }} style={{ transform: `translate(-50%, -50%) translate(${(ownCall ? callLabelX : x) + offset.x}px, ${(ownCall ? callLabelY : y) + offset.y}px)` }}>
        <div className="edge-main-row"><Version value={props.data.relation.version} />{card.title && <span>{card.title}</span>}{props.data.relation.relation === 'located_in' && card.rows.map(row => <span key={row}>{row}</span>)}</div>
        {props.data.relation.relation !== 'located_in' && card.rows.map((row, index) => <p key={index}>{row}</p>)}
      </div>
    </EdgeLabelRenderer>
  </>;
};
const nodeTypes = { entity: Entity, graph: GraphBoundary };
const edgeTypes = { relation: Relation };

const App = () => {
  const [narrow, setNarrow] = useState(() => window.innerWidth < 650);
  useEffect(() => {
    const media = matchMedia('(max-width: 649px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    const dispose = installPageGestureBoundary(document.documentElement);
    return () => { media.removeEventListener('change', update); dispose(); };
  }, []);
  const initialNodes = useMemo<EntityNode[]>(() => {
    const layout = rowPositions;
    return allEntities().map(entity => {
      const parent = minimalGraph.nodes.find(graph => graph.nodes?.some(child => child.id === entity.id));
      const isGraph = Boolean(entity.nodes && entity.edges);
      return {
        id: entity.id, type: isGraph ? 'graph' : 'entity', data: { entity, viewId: entity.id },
        position: entity.kind === 'callsite' ? { x: 640, y: 350 } : layout[entity.id] ?? { x: 0, y: 0 }, draggable: true,
        ...(parent ? { parentId: parent.id, extent: 'parent' as const } : {}),
        ...(isGraph ? { style: { ...groupSize(entity.id) } } : {}),
      };
    });
  }, [narrow]);
  const [nodes, , onNodesChange] = useNodesState<EntityNode>(initialNodes);
  const edges = useMemo<RelationEdge[]>(() => allRelations().filter(relation => !omittedStructuralEdge(relation)).map(relation => {
    const fromGraph = relation.from === 'change' || relation.from === 'test-change';
    const comparison = relation.relation === 'before' || relation.relation === 'after';
    const testLink = relation.from === 'test-change' && relation.to === 'change';
    const location = relation.relation === 'located_in';
    const beforeLocation = location && relation.version === 'before';
    const pairedLocation = location && ['review-file', 'test-file'].includes(relation.to);
    return {
      id: relation.id, type: 'relation', source: relation.from, target: relation.to,
      sourceHandle: pairedLocation ? (beforeLocation ? 'location-before' : 'location-after') : isPairedSubject(relation.from) && relation.version === 'before' && relation.relation !== 'located_in' ? 'out-before' : isPairedSubject(relation.from) && relation.version === 'after' && relation.relation !== 'located_in' ? 'out-after' : comparison ? relation.relation : testLink ? (relation.relation === 'verifies' ? 'out-right' : 'out-left') : beforeLocation ? 'out-left' : location ? 'out-right' : relation.from === 'refresh' ? 'out-left' : relation.relation === 'calls' || relation.relation === 'impedes' ? 'out-right' : 'out-bottom',
      targetHandle: location ? 'file-in:' + relation.id : pairedLocation ? (beforeLocation ? 'in-before' : 'in-after-location') : isPairedSubject(relation.to) && relation.relation === 'calls' && relation.version === 'after' ? 'in-after' : testLink ? (relation.relation === 'verifies' ? 'in-right' : 'in-left') : beforeLocation || relation.from === 'refresh' ? 'in-right' : location ? 'in-left' : comparison || fromGraph || relation.relation === 'constructs' || relation.relation === 'contains' ? 'in-top' : 'in-left',
      data: { relation, locationLane: locationPeers(relation.to).findIndex(edge => edge.id === relation.id), locationCount: locationPeers(relation.to).length }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9db3c8' },
    };
  }), []);

  return <>
    <header className="minimal-header">
      <h1>PR25 · Request headers</h1>
      <p>One Change graph + one actual modified-test graph · Source-declared indirect relevance · Tests not run</p>
    </header>
    <main aria-label="Request comparison graph">
      <ReactFlow<EntityNode, RelationEdge>
        nodes={nodes} onNodesChange={onNodesChange} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        defaultViewport={{ x: 20, y: 35, zoom: 1 }}
        minZoom={0.25} maxZoom={2} nodesConnectable={false}
        nodesDraggable={true} elementsSelectable={false} proOptions={{ hideAttribution: true }}
      >
        <Background color="#29333b" gap={24} size={1} />
      </ReactFlow>
    </main>
  </>;
};
const root = document.getElementById('root');
if (!root) throw new Error('minimal_root_missing');
createRoot(root).render(<App />);
