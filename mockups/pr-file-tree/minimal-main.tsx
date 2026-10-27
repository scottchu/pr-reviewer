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
import { minimalGraph, allEntities, allRelations, positions, type GraphEntity, type GraphRelation } from './minimal-graph.ts';

type EntityNode = Node<{ entity: GraphEntity }, 'entity' | 'graph'>;
type RelationEdge = Edge<{ relation: GraphRelation }, 'relation'>;

const Ports = () => <>
  <Handle id="in-top" type="target" position={Position.Top} />
  <Handle id="in-left" type="target" position={Position.Left} />
  <Handle id="in-right" type="target" position={Position.Right} />
  <Handle id="out-bottom" type="source" position={Position.Bottom} />
  <Handle id="out-left" type="source" position={Position.Left} />
  <Handle id="out-right" type="source" position={Position.Right} />
</>;
const Entity = ({ data }: NodeProps<EntityNode>) => (
  <article className={`minimal-entity kind-${data.entity.kind}`}>
    <Ports />
    <h2>{String(data.entity.data.name ?? data.entity.kind)}</h2>
    <pre className="nodrag nowheel">{JSON.stringify(data.entity, null, 2)}</pre>
  </article>
);
const GraphBoundary = ({ data }: NodeProps<EntityNode>) => (
  <section className="minimal-change-graph" aria-label={`${String(data.entity.data.name)} graph`}>
    <h2>{String(data.entity.data.name)} · graph</h2>
    <pre className="minimal-graph-identity nodrag nowheel">{JSON.stringify({
      id: data.entity.id, kind: data.entity.kind, data: data.entity.data,
    }, null, 2)}</pre>
    <Handle id="before" type="source" position={Position.Bottom} style={{ left: 210, top: 390, bottom: 'auto' }} />
    <Handle id="after" type="source" position={Position.Bottom} style={{ left: 1110, top: 390, bottom: 'auto' }} />
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
  const beforeLocation = props.data.relation.relation === 'located_in' && props.data.relation.version === 'before';
  const outerLeft = beforeLocation || (props.data.relation.from === 'test-change' && props.data.relation.relation === 'motivated_by');
  const path = outerLeft
    ? `M${props.sourceX},${props.sourceY} C${props.sourceX - 640},${props.sourceY} ${props.targetX - 640},${props.targetY} ${props.targetX},${props.targetY}`
    : defaultPath;
  const x = outerLeft ? (props.sourceX + props.targetX) / 2 - 480 : defaultX;
  const y = outerLeft ? (props.sourceY + props.targetY) / 2 : defaultY;
  return <>
    <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} />
    <EdgeLabelRenderer>
      <pre className="minimal-edge-json nodrag nopan" style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
        {JSON.stringify(props.data.relation, null, 2)}
      </pre>
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
    const layout = positions(narrow);
    return allEntities().map(entity => {
      const parent = minimalGraph.nodes.find(graph => graph.nodes?.some(child => child.id === entity.id));
      const isGraph = Boolean(entity.nodes && entity.edges);
      return {
        id: entity.id, type: isGraph ? 'graph' : 'entity', data: { entity },
        position: layout[entity.id] ?? { x: 0, y: 0 }, draggable: false,
        ...(parent ? { parentId: parent.id, extent: 'parent' as const } : {}),
        ...(isGraph ? { style: { width: 1600, height: entity.id === 'change' ? 1700 : 1900 } } : {}),
      };
    });
  }, [narrow]);
  const edges = useMemo<RelationEdge[]>(() => allRelations().map(relation => {
    const fromGraph = relation.from === 'change' || relation.from === 'test-change';
    const comparison = relation.relation === 'before' || relation.relation === 'after';
    const testLink = relation.from === 'test-change' && relation.to === 'change';
    const location = relation.relation === 'located_in';
    const beforeLocation = location && relation.version === 'before';
    const helperLocation = location && relation.from === 'helper-after';
    return {
      id: relation.id, type: 'relation', source: relation.from, target: relation.to,
      sourceHandle: comparison ? relation.relation : testLink ? (relation.relation === 'verifies' ? 'out-right' : 'out-left') : beforeLocation ? 'out-left' : helperLocation ? 'out-right' : relation.relation === 'calls' || relation.relation === 'impedes' ? 'out-right' : 'out-bottom',
      targetHandle: testLink ? (relation.relation === 'verifies' ? 'in-right' : 'in-left') : beforeLocation || helperLocation ? 'in-left' : comparison || location || fromGraph || relation.relation === 'constructs' || relation.relation === 'contains' ? 'in-top' : 'in-left',
      data: { relation }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9db3c8' },
    };
  }), []);

  return <>
    <header className="minimal-header">
      <h1>PR25 · Request headers</h1>
      <p>One Change graph + one actual modified-test graph · Source-declared indirect relevance · Tests not run</p>
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
