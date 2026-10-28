import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, Background, BaseEdge, EdgeLabelRenderer, Handle, Position, MarkerType, PanOnScrollMode, useNodesState, useNodesInitialized, useReactFlow, type Node, type NodeProps, type Edge, type EdgeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './minimal.css';
import { installPageGestureBoundary } from './page-gestures.ts';
import { sourceGraph, visibleSourceGraph, allEntities, allRelations } from './source-graph.ts';
import type { GraphEntity, GraphRelation } from './minimal-graph.ts';
import type {NativeDocumentHunk, DocumentWitness} from './native-document-comparison.ts';
import type {EditComposition} from './edit-composition.ts';
import { cardRows, edgeRows, omittedStructuralEdge, presentationStatus, editCaption, editPreview } from './minimal-projection.ts';
import { readingBands, filePaths, documentPaths, iconFor, iconPaths } from './entity-presentation.ts';
import { childContentBounds } from './graph-bounds.ts';
import { beginsRouteDrag, keyboardDelta, movedNodePosition } from './gesture-policy.ts';
import { projectionRoutes, liveProjectionRoutes } from './projection-routes.ts';
import { initialLayout, curve, groupInterior, type Point, type Routed, type Side } from './graph-geometry.ts';
const useCoarseInput = () => {
    const [coarse, setCoarse] = useState(() => matchMedia('(pointer: coarse)').matches);
    useEffect(() => {
        const query = matchMedia('(pointer: coarse)');
        const update = () => setCoarse(query.matches);
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);
    return coarse;
};
const bands = readingBands(allEntities(), allRelations());
const paths = filePaths(allEntities());
const documents = documentPaths(allEntities());
const directions: readonly Side[] = ['left', 'right', 'top', 'bottom'];
const position = (side: Side) => ({
    left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom
})[side];
type EntityNode = Node<{
    entity: GraphEntity;
    limit?: number;
    unitCount?: number;
    onExpand?: (id: string, hide?: boolean) => void;
    onReflow?: () => void;
    onHeaderMeasure: (id: string, clearance: number) => void;
    onMoveStart: () => void;
    onMoveEnd: () => void;
    onMove: (id: string, delta: Point) => void;
}, 'entity' | 'graph'>;
type RelationEdge = Edge<{
    relation: GraphRelation;
    routed: Routed;
    coarse: boolean;
    onMoveStart: () => void;
    onMoveEnd: () => void;
    onBend: (id: string, offset: Point | undefined) => void;
    onMeasure: (id: string, size: {
        width: number;
        height: number;
    }) => void;
}, 'relation'>;
const Ports = () => <>{(['source', 'target'] as const).flatMap(type => directions.map(side => <Handle key={type + side} id={type + ':' + side} type={type} position={position(side)} style={{
    [side]: 0, ...(side === 'left' || side === 'right' ? { top: '50%' } : { left: '50%' }), transform: 'none'
}}/>))}</>;
const EntityIcon = ({ entity }: {
    entity: GraphEntity;
}) => {
    const kind = iconFor(entity);
    const paths = iconPaths[kind] ?? ['M4 4h16v16H4z', 'M9 9h6v6H9z'];
    return <svg className="entity-icon" data-icon={kind} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
  {paths.map((path, index) => <path key={index} d={path}/>)}
 </svg>;
};
const NodeDragHandle = ({ data }: { data: EntityNode['data'] }) => {
    const { getZoom } = useReactFlow();
    const pointer = useRef<{ id: number; x: number; y: number; zoom: number } | null>(null);
    return <button type="button" className="graph-drag-handle nodrag nopan" aria-label={'Move ' + cardRows(data.entity).title}
        onPointerDown={event => {
            if (event.button !== 0) return;
            event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
            pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, zoom: getZoom() };
            data.onMoveStart();
        }}
        onPointerMove={event => {
            const start = pointer.current;
            if (!start || start.id !== event.pointerId) return;
            event.preventDefault(); event.stopPropagation();
            data.onMove(data.entity.id, { x: (event.clientX - start.x) / start.zoom, y: (event.clientY - start.y) / start.zoom });
        }}
        onPointerUp={event => {
            if (pointer.current?.id !== event.pointerId) return;
            event.stopPropagation(); pointer.current = null; data.onMoveEnd();
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { pointer.current = null; data.onMoveEnd(); }}
        onKeyDown={event => {
            const delta = keyboardDelta(event.key);
            if (!delta) return;
            event.preventDefault(); event.stopPropagation(); data.onMoveStart(); data.onMove(data.entity.id, delta); data.onMoveEnd();
        }}>⠿</button>;
};
const DocumentSide = ({label, witness, hunk}: {
    label: 'Before' | 'After'; witness: DocumentWitness | null; hunk: NativeDocumentHunk;
}) => <section className={'document-side version-' + label.toLowerCase()}>
    <h3>{label}{witness ? ' · ' + witness.commit.slice(0, 7) + ' L' + witness.startLine + '–' + witness.endLine : ' · absent in this scope'}</h3>
    {witness && <>
        <p className="document-provenance">{witness.path}<br />{witness.commit}<br />SHA256 {witness.contentHash}</p>
        <pre>{hunk.rows.filter(row => (label === 'Before' ? row.beforeLine : row.afterLine) !== null)
            .map((row, index) => <span key={index} data-edit-kind={row.kind} className={'native-row-' + row.kind}>{row.text}</span>)}</pre>
    </>}
</section>;
const EditPreview = ({composition}: {composition: EditComposition}) => {
    const preview = editPreview(composition);
    return <div className="edit-preview nodrag nopan" aria-label="Scoped removed and added source preview">
        {(['remove', 'add'] as const).map(kind => {
            const rows = kind === 'remove' ? preview.removed : preview.added;
            const side = composition.hunks.map(hunk => kind === 'remove' ? hunk.before : hunk.after).find(Boolean);
            return <section key={kind} className={'edit-preview-pane preview-' + kind}>
                <h3>{kind === 'remove' ? 'Removed −' + composition.removed : 'Added +' + composition.added}</h3>
                <p>{kind === 'remove' ? 'Before' : 'After'}{side ? ' · ' + side.commit.slice(0, 7) : ''}</p>
                <div className="edit-preview-rows nowheel" tabIndex={0} aria-label={kind === 'remove' ? 'Removed source rows' : 'Added source rows'}>
                    {rows.length ? rows.map((row, index) => <div key={index} className="edit-preview-row" data-edit-kind={row.kind}>
                        <span className="edit-line">L{kind === 'remove' ? row.beforeLine : row.afterLine}</span><code>{row.text}</code>
                    </div>) : <p>No {kind === 'remove' ? 'removed' : 'added'} rows in this scope.</p>}
                </div>
                {rows.length > 0 && <p>First {rows.length} source rows · all evidence below</p>}
            </section>;
        })}
    </div>;
};
const DocumentEvidence = ({hunks, composition, onReflow}: {
    hunks: readonly NativeDocumentHunk[]; composition: EditComposition | undefined; onReflow: (() => void) | undefined;
}) => <>
    {composition && composition.status !== 'unresolved' ? <EditPreview composition={composition}/> : <p>Scoped source edits unresolved.</p>}
    {hunks.length > 0 && <details className="document-details nodrag nopan" onToggle={onReflow}>
        <summary>Read all {hunks.length} native hunks and source identities</summary>
        <div className="document-reading nowheel" tabIndex={0} aria-label="All native document hunks">
            {hunks.map(hunk => <section key={hunk.index} data-native-hunk={hunk.index}>
                <h3>Hunk {hunk.index} · {hunk.header}</h3>
                <DocumentSide label="Before" witness={hunk.before} hunk={hunk}/><DocumentSide label="After" witness={hunk.after} hunk={hunk}/>
            </section>)}
        </div>
    </details>}
</>;
const Entity = React.memo(({ data }: NodeProps<EntityNode>) => {
    const card = cardRows(data.entity);
    const status = presentationStatus(data.entity);
    const hunks = data.entity.data.nativeHunks as readonly NativeDocumentHunk[] | undefined;
    return <article className={'minimal-entity' + (hunks ? ' native-document-evidence' : '') + (typeof status === 'string' ? ' status-' + status.replaceAll(' ', '-') : '')}>
  <Ports /><NodeDragHandle data={data}/>
  <h2><EntityIcon entity={data.entity}/><span>{card.title}</span></h2>
  {hunks && <DocumentEvidence hunks={hunks} composition={data.entity.data.editComposition as EditComposition | undefined} onReflow={data.onReflow}/>}
  {card.rows.map((row, index) => <p key={index}>{row}</p>)}
  {data.entity.kind === 'file' && Boolean(data.unitCount) && <div className="file-unit-actions nodrag nopan">
   {(!data.limit || data.limit < (data.unitCount ?? 0)) && <button onClick={() => data.onExpand?.(data.entity.id)}>{data.limit ? 'Show more source units' : 'Show source units'}</button>}
   {Boolean(data.limit) && <button onClick={() => data.onExpand?.(data.entity.id, true)}>Hide source units</button>}
  </div>}
  {data.entity.kind === 'file' && Boolean(data.limit) && sourceGraph.unresolved.some(row => row.path === data.entity.data.path) && <details className="unpaired-source nodrag nopan" onToggle={() => data.onReflow?.()}>
   <summary>Source without an established counterpart</summary>
   {sourceGraph.unresolved.filter(row => row.path === data.entity.data.path).map(row => <p key={row.anchor.side + ':' + row.anchor.startLine + ':' + row.name}>{row.anchor.side === 'base' ? 'Before' : 'After'} L{row.anchor.startLine}–{row.anchor.endLine} · {row.name}</p>)}
  </details>}
 </article>;
});
const GraphBoundary = React.memo(({ data }: NodeProps<EntityNode>) => {
    const heading = useRef<HTMLHeadingElement>(null);
    useLayoutEffect(() => {
        const element = heading.current;
        if (!element) return;
        const measure = () => data.onHeaderMeasure(data.entity.id, Math.max(groupInterior.top, Math.ceil(element.offsetTop + element.offsetHeight + groupInterior.padding)));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, [data.entity.id, data.onHeaderMeasure]);
    return <>
 <Ports />
 <section className={'minimal-change-graph' + (presentationStatus(data.entity) ? ' status-' + presentationStatus(data.entity)!.replaceAll(' ', '-') : '')} aria-label={String(data.entity.data.name) + ' graph'}>
  <NodeDragHandle data={data}/><h2 ref={heading}><EntityIcon entity={data.entity}/><span>{String(data.entity.data.name)}{data.entity.data.editComposition ? <small className="group-edit-caption">{editCaption(data.entity.data.editComposition as EditComposition)}</small> : null}</span></h2>
 </section>
</>;
});
const Relation = React.memo((props: EdgeProps<RelationEdge>) => {
    const { getZoom } = useReactFlow();
    const labelRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{
        pointer: number;
        clientX: number;
        clientY: number;
        offset: Point;
        zoom: number;
    } | null>(null);
    const data = props.data;
    useLayoutEffect(() => { const element = labelRef.current; if (!element || !data)
        return; const measure = () => data.onMeasure(props.id, { width: element.offsetWidth, height: element.offsetHeight }); measure(); const observer = new ResizeObserver(measure); observer.observe(element); return () => observer.disconnect(); }, [props.id, data?.onMeasure]);
    if (!data)
        return null;
    const route = curve({ x: props.sourceX, y: props.sourceY }, { x: props.targetX, y: props.targetY }, data.routed.offset);
    const card = edgeRows(data.relation);
    const begin = (event: React.PointerEvent<Element>) => { if (event.button !== 0 || !beginsRouteDrag(event.pointerType, Boolean((event.target as Element).closest('.graph-drag-handle')), event.currentTarget.tagName.toLowerCase() === 'g'))
        return; data.onMoveStart(); event.stopPropagation(); event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = {
        pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, offset: data.routed.offset, zoom: getZoom()
    }; };
    const move = (event: React.PointerEvent<Element>) => { const start = drag.current; if (!start || start.pointer !== event.pointerId)
        return; event.stopPropagation(); event.preventDefault(); data.onBend(props.id, { x: start.offset.x + (event.clientX - start.clientX) / start.zoom, y: start.offset.y + (event.clientY - start.clientY) / start.zoom }); };
    const end = (event: React.PointerEvent<Element>) => { if (drag.current?.pointer !== event.pointerId)
        return; event.stopPropagation(); drag.current = null; data.onMoveEnd(); if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId); };
    const key = (event: React.KeyboardEvent<Element>) => { const delta = ({
        ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10]
    } as Record<string, number[]>)[event.key]; if (event.key === 'Home') {
        event.preventDefault();
        event.stopPropagation();
        data.onBend(props.id, undefined);
    }
    else if (delta) {
        event.preventDefault();
        event.stopPropagation();
        data.onBend(props.id, { x: data.routed.offset.x + delta[0]!, y: data.routed.offset.y + delta[1]! });
    } };
    return <><g data-route-id={props.id} className={'minimal-route nodrag' + (data.coarse ? '' : ' nopan')} role="button" tabIndex={0} aria-label={'Move ' + card.title + ' route'} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={key}><BaseEdge id={props.id} path={route.path} interactionWidth={24} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})}/></g><EdgeLabelRenderer><div ref={labelRef} className={'minimal-edge-card version-' + data.relation.version + ' nodrag' + (data.coarse ? '' : ' nopan')} data-relation={data.relation.relation} data-edge-id={props.id} role={data.coarse ? undefined : 'button'} tabIndex={data.coarse ? -1 : 0} aria-label={'Move ' + card.title + ' label and route'} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={key} style={{ transform: 'translate(-50%, -50%) translate(' + route.label.x + 'px, ' + route.label.y + 'px)' }}><span className="graph-drag-handle nodrag nopan" role="button" tabIndex={0} aria-label={'Move ' + card.title + ' label and route'} onKeyDown={key}>⠿</span><div className="edge-main-row">{data.relation.version !== 'comparison' && <span className="version-tag">{data.relation.version === 'before' ? 'Before' : 'After'}</span>}{card.title && <span>{card.title}</span>}{data.relation.relation === 'located_in' && card.rows.map(row => <span key={row}>{row}</span>)}</div>{data.relation.relation !== 'located_in' && card.rows.map((row, index) => <p key={index}>{row}</p>)}</div></EdgeLabelRenderer></>;
});
const nodeTypes = { entity: Entity, graph: GraphBoundary };
const edgeTypes = { relation: Relation };
const InitialLayout = ({ apply, links, revision, headers }: {
    headers: Readonly<Record<string, number>>;
    apply: (nodes: EntityNode[]) => void;
    links: readonly {
        id: string;
        source: string;
        target: string;
    }[];
    revision: string;
}) => {
    const initialized = useNodesInitialized();
    const { getNodes } = useReactFlow<EntityNode>();
    const applied = useRef<string | null>(null);
    useEffect(() => {
        if (!initialized || applied.current === revision)
            return;
        let second = 0;
        const first = requestAnimationFrame(() => {
            second = requestAnimationFrame(() => {
                applied.current = revision;
                const focus = allEntities().find(entity => entity.kind === 'review')?.id ?? 'pr25';
                apply(initialLayout(getNodes(), links, focus, bands, headers, paths, documents));
            });
        });
        return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
    }, [initialized, getNodes, apply, links, revision, headers]);
    return null;
};
const App = () => {
    const coarse = useCoarseInput();
    useEffect(() => installPageGestureBoundary(document.documentElement), []);
    const [limits, setLimits] = useState<Record<string, number>>({});
    const [geometryRevision, setGeometryRevision] = useState(0);
    const [headerClearances, setHeaderClearances] = useState<Record<string, number>>({});
    const onHeaderMeasure = useCallback((id: string, clearance: number) => setHeaderClearances(previous => (previous[id] ?? groupInterior.top) === clearance ? previous : { ...previous, [id]: clearance }), []);
    const view = useMemo(() => visibleSourceGraph(limits), [limits]);
    const relations = useMemo(() => view.relations.filter(edge => !omittedStructuralEdge(edge, allEntities())), [view]);
    const links = useMemo(() => relations.map(edge => ({
        id: edge.id, source: edge.from, target: edge.to
    })), [relations]);
    const [nodes, setNodes, onNodesChange] = useNodesState<EntityNode>([]);
    const [ready, setReady] = useState(false);
    const manualPositions = useRef<Record<string, Point>>({});
    const [manual, setManual] = useState<Record<string, Point>>({});
    const [sizes, setSizes] = useState<Record<string, {
        width: number;
        height: number;
    }>>({});
    type Movement = { nodes: readonly EntityNode[]; manual: Record<string, Point> };
    const latest = useRef<Movement>({ nodes, manual });
    const movementRef = useRef<Movement | null>(null);
    const [movement, setMovement] = useState<Movement | null>(null);
    useLayoutEffect(() => { latest.current = { nodes, manual }; }, [nodes, manual]);
    const beginMove = useCallback(() => {
        movementRef.current = latest.current;
        setMovement(latest.current);
    }, []);
    const endMove = useCallback(() => { movementRef.current = null; setMovement(null); }, []);
    const moveNode = useCallback((id: string, delta: Point) => {
        const position = movedNodePosition((movementRef.current ?? latest.current).nodes, id, delta, headerClearances);
        if (!position) return;
        manualPositions.current[id] = position;
        setNodes(previous => previous.map(node => node.id === id ? { ...node, position } : node));
    }, [setNodes, headerClearances]);
    const onExpand = useCallback((id: string, hide = false) => setLimits(previous => ({ ...previous, [id]: hide ? 0 : (previous[id] ?? 0) + 20 })), []);
    const onReflow = useCallback(() => setGeometryRevision(value => value + 1), []);
    useEffect(() => {
        setReady(false);
        setNodes(previous => {
            const prior = new Map(previous.map(node => [node.id, node]));
            return view.nodes.map(entity => {
                const known = prior.get(entity.id);
                const parent = view.nodes.find(group => group.nodes?.some(child => child.id === entity.id));
                const group = Boolean(entity.nodes && entity.edges);
                return {
                    id: entity.id, type: group ? 'graph' : 'entity', data: {
                        entity, limit: limits[entity.id] ?? 0, unitCount: sourceGraph.fileUnits[entity.id]?.length ?? 0, onExpand, onReflow, onHeaderMeasure, onMoveStart: beginMove, onMoveEnd: endMove, onMove: moveNode
                    },
                    position: known?.position ?? { x: 0, y: 0 }, draggable: !coarse, ...(parent ? { parentId: parent.id, extent: 'parent' as const } : {}),
                    ...(known?.measured ? { measured: known.measured } : {}), style: {
                        ...known?.style, pointerEvents: 'all', opacity: known ? 1 : 0, ...(group ? { width: known?.style?.width ?? 800, height: known?.style?.height ?? 520 } : {})
                    }
                };
            });
        });
    }, [view, limits, coarse, beginMove, endMove, moveNode, onExpand, onReflow, onHeaderMeasure, setNodes]);
    const apply = useCallback((laidOut: EntityNode[]) => {
        const positioned = laidOut.map(node => manualPositions.current[node.id] ? { ...node, position: manualPositions.current[node.id]! } : node);
        const bounded = positioned.map(node => {
            const bounds = childContentBounds(positioned, node.id, headerClearances);
            if (!bounds) return node;
            const position = movedNodePosition(positioned, node.id, { x: 0, y: 0 }, headerClearances)!;
            if (manualPositions.current[node.id]) manualPositions.current[node.id] = position;
            return { ...node, position, extent: [[bounds.min.x, bounds.min.y], [bounds.max.x, bounds.max.y]] as [[number, number], [number, number]] };
        });
        setNodes(bounded);
        setReady(true);
    }, [setNodes, headerClearances]);
    const changes: typeof onNodesChange = useCallback(next => {
        for (const change of next)
            if (change.type === 'position' && change.position && change.dragging !== undefined)
                manualPositions.current[change.id] = change.position;
        onNodesChange(next);
    }, [onNodesChange]);
    const onBend = useCallback((id: string, offset: Point | undefined) => setManual(previous => {
        const next = { ...previous };
        if (offset)
            next[id] = offset;
        else
            delete next[id];
        return next;
    }), []);
    const onMeasure = useCallback((id: string, size: {
        width: number;
        height: number;
    }) => setSizes(previous => previous[id]?.width === size.width && previous[id]?.height === size.height ? previous : { ...previous, [id]: size }), []);
    const placementNodes = movement?.nodes ?? nodes;
    const placementManual = movement?.manual ?? manual;
    const placements = useMemo(() => ready ? projectionRoutes(placementNodes, view.nodes, links, sizes, placementManual) : null,
        [ready, placementNodes, view.nodes, links, sizes, placementManual]);
    const edgeCache = useRef(new Map<string, RelationEdge>());
    const edges = useMemo<RelationEdge[]>(() => {
        if (!ready)
            return [];
        if (!placements)
            return [];
        const routes = liveProjectionRoutes(nodes, links, placements, manual, sizes);
        return relations.map(relation => {
            const routed = routes.get(relation.id)!;
            const prior = edgeCache.current.get(relation.id);
            if (prior?.data?.routed === routed && prior.data.coarse === coarse) return prior;
            const edge: RelationEdge = {
                id: relation.id, type: 'relation', source: relation.from, target: relation.to, sourceHandle: 'source:' + routed.sourceSide, targetHandle: 'target:' + routed.targetSide,
                data: {
                    relation, routed, coarse, onBend, onMeasure, onMoveStart: beginMove, onMoveEnd: endMove
                }, markerEnd: { type: MarkerType.ArrowClosed, color: '#9db3c8' }
            };
            edgeCache.current.set(relation.id, edge);
            return edge;
        });
    }, [ready, placements, nodes, links, manual, sizes, relations, coarse, beginMove, endMove, onBend, onMeasure]);
    const revision = JSON.stringify(limits) + ':' + geometryRevision + ':' + coarse + ':' + JSON.stringify(headerClearances);
    return <><header className="minimal-header"><h1>PR25 · Changes and evidence</h1><p>Files, code changes, tests and their source context</p></header>
  <main className={coarse ? 'coarse-input' : undefined} aria-label="PR25 source comparison graph"><ReactFlow<EntityNode, RelationEdge> nodes={nodes} onNodesChange={changes} onNodeDragStart={beginMove} onNodeDragStop={endMove} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} defaultViewport={{
        x: 20, y: 35, zoom: 1
    }} minZoom={0.25} maxZoom={2} panOnScroll panOnScrollMode={PanOnScrollMode.Free} zoomOnScroll={false} zoomOnPinch nodesConnectable={false} nodesDraggable elementsSelectable={false} proOptions={{ hideAttribution: true }}>
   <InitialLayout apply={apply} links={links} revision={revision} headers={headerClearances}/><Background color="#29333b" gap={24} size={1}/>
  </ReactFlow></main></>;
};
const root = document.getElementById('root');
if (!root)
    throw new Error('minimal_root_missing');
createRoot(root).render(<App />);
