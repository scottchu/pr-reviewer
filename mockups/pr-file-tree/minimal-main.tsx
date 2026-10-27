import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Background, BaseEdge, EdgeLabelRenderer, Handle, Position,
  MarkerType, getBezierPath, type Node, type NodeProps, type Edge,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './minimal.css';
import { installPageGestureBoundary } from './page-gestures.ts';
import { comparisonGraph as minimalGraph, allEntities, allRelations, isPairedSubject, type GraphEntity, type GraphRelation } from './comparison-graph.ts';

import { cardRows, edgeRows, entityVersion, groupSize, rowPositions, omittedStructuralEdge } from './minimal-projection.ts';

type EntityNode = Node<{ entity: GraphEntity; viewId: string }, 'entity' | 'graph'>;
type RelationEdge = Edge<{ relation: GraphRelation }, 'relation'>;

const Ports = () => <>
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
  return <article className="minimal-entity">
    <Ports />
    {paired && <>
      <Handle id="in-after" type="target" position={Position.Right} style={{ top: '30%' }} />
      <Handle id="out-before" type="source" position={Position.Bottom} style={{ left: '30%' }} />
      <Handle id="out-after" type="source" position={Position.Right} style={{ top: '70%' }} />
    </>}
    <Version value={version} />
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
  const [defaultPath, defaultX, defaultY] = getBezierPath(props);
  if (!props.data) return null;
  const testLink = props.data.relation.from === 'test-change' && props.data.relation.to === 'change';
  const outerLeft = testLink && props.data.relation.relation === 'motivated_by';
  const outerRight = testLink && props.data.relation.relation === 'verifies';
  const direction = outerLeft ? -1 : 1;
  const versionedLocation = props.data.relation.relation === 'located_in' && ['review-file', 'test-file'].includes(props.data.relation.to);
  const locationOffset = props.data.relation.version === 'before' ? -120 : 120;
  const middleX = (props.sourceX + props.targetX) / 2;
  const path = versionedLocation
    ? `M${props.sourceX},${props.sourceY} C${middleX},${props.sourceY + locationOffset} ${middleX},${props.targetY + locationOffset} ${props.targetX},${props.targetY}`
    : outerLeft || outerRight
    ? `M${props.sourceX},${props.sourceY} C${props.sourceX + direction * 320},${props.sourceY} ${props.targetX + direction * 320},${props.targetY} ${props.targetX},${props.targetY}`
    : defaultPath;
  const x = versionedLocation ? middleX : outerLeft || outerRight ? (props.sourceX + props.targetX) / 2 + direction * 240 : defaultX;
  const y = versionedLocation ? (props.sourceY + props.targetY) / 2 + locationOffset * 0.75 : outerLeft || outerRight ? (props.sourceY + props.targetY) / 2 : defaultY;
  const card = edgeRows(props.data.relation);
  return <>
    <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} />
    <EdgeLabelRenderer>
      <div className={`minimal-edge-card version-${props.data.relation.version} nodrag nopan`} data-relation={props.data.relation.relation} data-edge-id={props.id} style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
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
  const nodes = useMemo<EntityNode[]>(() => {
    const layout = rowPositions;
    return allEntities().map(entity => {
      const parent = minimalGraph.nodes.find(graph => graph.nodes?.some(child => child.id === entity.id));
      const isGraph = Boolean(entity.nodes && entity.edges);
      return {
        id: entity.id, type: isGraph ? 'graph' : 'entity', data: { entity, viewId: entity.id },
        position: layout[entity.id] ?? { x: 0, y: 0 }, draggable: false,
        ...(parent ? { parentId: parent.id, extent: 'parent' as const } : {}),
        ...(isGraph ? { style: { ...groupSize(entity.id) } } : {}),
      };
    });
  }, [narrow]);
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
      targetHandle: pairedLocation ? (beforeLocation ? 'in-before' : 'in-after-location') : isPairedSubject(relation.to) && relation.relation === 'calls' ? 'in-after' : testLink ? (relation.relation === 'verifies' ? 'in-right' : 'in-left') : beforeLocation || relation.from === 'refresh' ? 'in-right' : location ? 'in-left' : comparison || fromGraph || relation.relation === 'constructs' || relation.relation === 'contains' ? 'in-top' : 'in-left',
      data: { relation }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9db3c8' },
    };
  }), []);

  return <>
    <header className="minimal-header">
      <h1>PR25 · Request headers</h1>
      <p>One Change graph + one actual modified-test graph · Source-declared indirect relevance · Tests not run</p>
    </header>
    <main aria-label="Request comparison graph">
      <ReactFlow<EntityNode, RelationEdge>
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        defaultViewport={{ x: 20, y: 35, zoom: 1 }}
        minZoom={0.25} maxZoom={2} nodesConnectable={false}
        nodesDraggable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}
      >
        <Background color="#29333b" gap={24} size={1} />
      </ReactFlow>
    </main>
  </>;
};
const root = document.getElementById('root');
if (!root) throw new Error('minimal_root_missing');
createRoot(root).render(<App />);
