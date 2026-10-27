import React, {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ReactFlow,Background,BaseEdge,EdgeLabelRenderer,Handle,Position,MarkerType,PanOnScrollMode,useNodesState,useNodesInitialized,useReactFlow,type Node,type NodeProps,type Edge,type EdgeProps} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './minimal.css';
import {installPageGestureBoundary} from './page-gestures.ts';
import {comparisonGraph,allEntities,allRelations,type GraphEntity,type GraphRelation} from './comparison-graph.ts';
import {cardRows,edgeRows,omittedStructuralEdge} from './minimal-projection.ts';
import {readingBands,iconFor,iconPaths} from './entity-presentation.ts';
import {initialLayout,automaticRoutes,curve,type Point,type Routed,type Side} from './graph-geometry.ts';

const relations=allRelations().filter(edge=>!omittedStructuralEdge(edge));
const links=relations.map(edge=>({id:edge.id,source:edge.from,target:edge.to}));
const bands=readingBands(allEntities(),allRelations());
const directions:readonly Side[]=['left','right','top','bottom'];
const position=(side:Side)=>({left:Position.Left,right:Position.Right,top:Position.Top,bottom:Position.Bottom})[side];
type EntityNode=Node<{entity:GraphEntity},'entity'|'graph'>;
type RelationEdge=Edge<{relation:GraphRelation;routed:Routed;onBend:(id:string,offset:Point|undefined)=>void;onMeasure:(id:string,size:{width:number;height:number})=>void},'relation'>;
const Ports=()=> <>{(['source','target'] as const).flatMap(type=>directions.map(side=><Handle key={type+side} id={type+':'+side} type={type} position={position(side)} style={{[side]:0,...(side==='left'||side==='right'?{top:'50%'}:{left:'50%'}),transform:'none'}}/>))}</>;
const EntityIcon = ({entity}: {entity: GraphEntity}) => {
 const kind = iconFor(entity);
 const paths = iconPaths[kind] ?? ['M4 4h16v16H4z', 'M9 9h6v6H9z'];
 return <svg className="entity-icon" data-icon={kind} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
  {paths.map((path, index) => <path key={index} d={path}/>)}
 </svg>;
};
const Entity = ({data}: NodeProps<EntityNode>) => {
 const card = cardRows(data.entity);
 const status = data.entity.data.comparisonStatus;
 return <article className={'minimal-entity' + (typeof status === 'string' ? ' status-' + status.replaceAll(' ', '-') : '')}>
  <Ports/>
  <h2><EntityIcon entity={data.entity}/><span>{card.title}</span></h2>
  {card.rows.map((row, index) => <p key={index}>{row}</p>)}
 </article>;
};
const GraphBoundary = ({data}: NodeProps<EntityNode>) => <>
 <Ports/>
 <section className="minimal-change-graph" aria-label={String(data.entity.data.name) + ' graph'}>
  <h2><EntityIcon entity={data.entity}/><span>{String(data.entity.data.name)}</span></h2>
 </section>
</>;
const Relation=(props:EdgeProps<RelationEdge>)=>{
 const {getZoom}=useReactFlow();const labelRef=useRef<HTMLDivElement>(null);
 const drag=useRef<{pointer:number;clientX:number;clientY:number;offset:Point;zoom:number}|null>(null);
 const data=props.data;
 useLayoutEffect(()=>{const element=labelRef.current;if(!element||!data)return;const measure=()=>data.onMeasure(props.id,{width:element.offsetWidth,height:element.offsetHeight});measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[props.id,data?.onMeasure]);
 if(!data)return null;
 const route=curve({x:props.sourceX,y:props.sourceY},{x:props.targetX,y:props.targetY},data.routed.offset);const card=edgeRows(data.relation);
 const begin=(event:React.PointerEvent<Element>)=>{if(event.button!==0)return;event.stopPropagation();event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointer:event.pointerId,clientX:event.clientX,clientY:event.clientY,offset:data.routed.offset,zoom:getZoom()};};
 const move=(event:React.PointerEvent<Element>)=>{const start=drag.current;if(!start||start.pointer!==event.pointerId)return;event.stopPropagation();event.preventDefault();data.onBend(props.id,{x:start.offset.x+(event.clientX-start.clientX)/start.zoom,y:start.offset.y+(event.clientY-start.clientY)/start.zoom});};
 const end=(event:React.PointerEvent<Element>)=>{if(drag.current?.pointer!==event.pointerId)return;event.stopPropagation();drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);};
 const key=(event:React.KeyboardEvent<Element>)=>{const delta=({ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]} as Record<string,number[]>)[event.key];if(event.key==='Home'){event.preventDefault();event.stopPropagation();data.onBend(props.id,undefined);}else if(delta){event.preventDefault();event.stopPropagation();data.onBend(props.id,{x:data.routed.offset.x+delta[0]!,y:data.routed.offset.y+delta[1]!});}};
 return <><g data-route-id={props.id} className="minimal-route nodrag nopan" role="button" tabIndex={0} aria-label={'Move '+card.title+' route'} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={key}><BaseEdge id={props.id} path={route.path} interactionWidth={24} {...(props.markerEnd?{markerEnd:props.markerEnd}:{})}/></g><EdgeLabelRenderer><div ref={labelRef} className={'minimal-edge-card version-'+data.relation.version+' nodrag nopan'} data-relation={data.relation.relation} data-edge-id={props.id} role="button" tabIndex={0} aria-label={'Move '+card.title+' label and route'} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onKeyDown={key} style={{transform:'translate(-50%, -50%) translate('+route.label.x+'px, '+route.label.y+'px)'}}><div className="edge-main-row">{data.relation.version!=='comparison'&&<span className="version-tag">{data.relation.version==='before'?'Before':'After'}</span>}{card.title&&<span>{card.title}</span>}{data.relation.relation==='located_in'&&card.rows.map(row=><span key={row}>{row}</span>)}</div>{data.relation.relation!=='located_in'&&card.rows.map((row,index)=><p key={index}>{row}</p>)}</div></EdgeLabelRenderer></>;
};
const nodeTypes={entity:Entity,graph:GraphBoundary};const edgeTypes={relation:Relation};
const InitialLayout=({apply}:{apply:(nodes:EntityNode[])=>void})=>{const initialized=useNodesInitialized();const {getNodes}=useReactFlow<EntityNode>();const applied=useRef(false);useEffect(()=>{if(!initialized||applied.current)return;applied.current=true;apply(initialLayout(getNodes(),links,allEntities().find(entity=>bands.get(entity.id)===0)?.id??'change',bands));},[initialized,getNodes,apply]);return null;};
const App=()=>{
 useEffect(()=>installPageGestureBoundary(document.documentElement),[]);
 const initialNodes=useMemo<EntityNode[]>(()=>allEntities().map(entity=>{const parent=comparisonGraph.nodes.find(graph=>graph.nodes?.some(child=>child.id===entity.id));const group=Boolean(entity.nodes&&entity.edges);return{id:entity.id,type:group?'graph':'entity',data:{entity},position:{x:0,y:0},draggable:true,...(parent?{parentId:parent.id,extent:'parent' as const}:{}),style:{opacity:0,...(group?{width:800,height:520}:{})}};}),[]);
 const [nodes,setNodes,onNodesChange]=useNodesState<EntityNode>(initialNodes);const [ready,setReady]=useState(false);
 const [manual,setManual]=useState<Record<string,Point>>({});const [sizes,setSizes]=useState<Record<string,{width:number;height:number}>>({});
 const apply=useCallback((laidOut:EntityNode[])=>{setNodes(laidOut);setReady(true);},[setNodes]);
 const onBend=useCallback((id:string,offset:Point|undefined)=>setManual(previous=>{const next={...previous};if(offset)next[id]=offset;else delete next[id];return next;}),[]);
 const onMeasure=useCallback((id:string,size:{width:number;height:number})=>setSizes(previous=>previous[id]?.width===size.width&&previous[id]?.height===size.height?previous:{...previous,[id]:size}),[]);
 const edges=useMemo<RelationEdge[]>(()=>{if(!ready)return[];const routes=automaticRoutes(nodes,links,sizes,manual);return relations.map(relation=>{const routed=routes.get(relation.id)!;return{id:relation.id,type:'relation',source:relation.from,target:relation.to,sourceHandle:'source:'+routed.sourceSide,targetHandle:'target:'+routed.targetSide,data:{relation,routed,onBend,onMeasure},markerEnd:{type:MarkerType.ArrowClosed,color:'#9db3c8'}};});},[ready,nodes,sizes,manual,onBend,onMeasure]);
 return <><header className="minimal-header"><h1>PR25 · Request headers</h1><p>PR25 request change · Source-declared E2E, application and gateway tests · Tests not run</p></header><main aria-label="Request comparison graph"><ReactFlow<EntityNode,RelationEdge> nodes={nodes} onNodesChange={onNodesChange} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} defaultViewport={{x:20,y:35,zoom:1}} minZoom={0.25} maxZoom={2} panOnScroll panOnScrollMode={PanOnScrollMode.Free} zoomOnScroll={false} zoomOnPinch nodesConnectable={false} nodesDraggable elementsSelectable={false} proOptions={{hideAttribution:true}}><InitialLayout apply={apply}/><Background color="#29333b" gap={24} size={1}/></ReactFlow></main></>;
};
const root=document.getElementById('root');if(!root)throw new Error('minimal_root_missing');createRoot(root).render(<App/>);
