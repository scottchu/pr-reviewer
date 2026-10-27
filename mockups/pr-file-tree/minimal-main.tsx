import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ReactFlow, Background, BaseEdge, Handle, Position,
  MarkerType, getBezierPath, type Node, type NodeProps, type Edge,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './minimal.css';
import { installPageGestureBoundary } from './page-gestures.ts';
import { minimalGraph, positions, type GraphEntity, type GraphRelation } from './minimal-graph.ts';

type EntityNode = Node<{ entity: GraphEntity; outgoing: readonly GraphRelation[] }, 'entity'>;
type RelationEdge = Edge<{ relation: GraphRelation }, 'relation'>;

const Entity = ({ data }: NodeProps<EntityNode>) => (
  <article className={`minimal-entity kind-${data.entity.kind}`}>
    <Handle id="in" type="target" position={Position.Left} />
    <h2>{String(data.entity.data.name ?? data.entity.kind)}</h2>
    <pre className="nodrag nowheel">{JSON.stringify(data.entity, null, 2)}</pre>
    {data.outgoing.map(relation => (
      <div className="minimal-outgoing" key={relation.id}>
        <pre className="nodrag nowheel nopan" aria-label={`${relation.relation} edge JSON`}>{JSON.stringify(relation, null, 2)}</pre>
        <Handle id={relation.id} type="source" position={Position.Right} />
      </div>
    ))}
  </article>
);
const Relation = (props: EdgeProps<RelationEdge>) => {
  const [path] = getBezierPath(props);
  return <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} />;
};
const nodeTypes = { entity: Entity };
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
    const layout = positions(narrow);
    return minimalGraph.nodes.map(entity => ({
      id: entity.id,
      type: 'entity',
      data: { entity, outgoing: minimalGraph.edges.filter(relation => relation.from === entity.id) },
      position: layout[entity.id] ?? { x: 0, y: 0 },
      draggable: false,
    }));
  }, [narrow]);
  const edges = useMemo<RelationEdge[]>(() => minimalGraph.edges.map(relation => ({
    id: relation.id,
    type: 'relation',
    source: relation.from,
    sourceHandle: relation.id,
    target: relation.to,
    targetHandle: 'in',
    data: { relation },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9db3c8' },
  })), []);
  return <>
    <header className="minimal-header">
      <h1>PR25 · Request headers</h1>
      <p>One prepared change · Before constructs Bearer; After calls accessHeaders · Tests not prepared</p>
      <code>{JSON.stringify({ id: minimalGraph.id, kind: minimalGraph.kind })}</code>
    </header>
    <main aria-label="Request comparison graph">
      <ReactFlow<EntityNode, RelationEdge>
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        defaultViewport={{ x: 20, y: 35 - (positions(narrow).change?.y ?? 0), zoom: 1 }}
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
