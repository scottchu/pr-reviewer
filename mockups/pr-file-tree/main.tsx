import React,{useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ReactFlow,Background,BackgroundVariant,Handle,Position,BaseEdge,EdgeLabelRenderer,getBezierPath,MarkerType,type Node,type NodeProps,type ReactFlowInstance,type Edge,type EdgeProps} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import fixture from './paths.json' with {type:'json'};
import importFixture from './imports.json' with {type:'json'};
import {buildTree,type Change,type TreeNode} from './tree.ts';
import {projectImports,citationText} from './imports.ts';
const tree=buildTree(fixture.paths,fixture.changes);
type LabelNode=Node<{name:string;path:string;kind:'file'|'directory';change:Change;context:boolean;selected:boolean;provenance:string},'filename'>;
const Label=({data}:NodeProps<LabelNode>)=><><Handle type="target" position={Position.Left} isConnectable={false}/><span className={`filename ${data.kind} ${data.change} ${data.selected?'selected':''} ${data.context?'context':''}`} title={data.provenance} data-file-path={data.kind==='file'&&!data.context?data.path:undefined} data-context-path={data.context?data.path:undefined}>{data.change==='added'?'+ ':data.change==='modified'?'~ ':data.change==='deleted'?'− ':''}{data.name}</span><Handle type="source" position={Position.Right} isConnectable={false}/><Handle id="import-right" type="target" position={Position.Right} isConnectable={false}/></>;
const nodeTypes={filename:Label};
type ImportEdge=Edge<{citation:string;change:Change},'import'>;
const colors:Record<Change,string>={added:'#91d2b0',modified:'#dcc88f',deleted:'#e3a0a7',unchanged:'#98a9b4'};
const ImportLine=({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,markerEnd,data}:EdgeProps<ImportEdge>)=>{
 const loopX=Math.max(sourceX,targetX)+130;const [path,x,y]=targetPosition===Position.Right?[`M${sourceX},${sourceY} C${loopX},${sourceY} ${loopX},${targetY} ${targetX},${targetY}`,(sourceX+targetX)/8+.75*loopX,(sourceY+targetY)/2]:getBezierPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,curvature:.5});const color=colors[data?.change??'unchanged'];
 return <><BaseEdge path={path} {...(markerEnd?{markerEnd}:{})} style={{stroke:color,strokeWidth:1.6,opacity:.9}}/><EdgeLabelRenderer><span className="import-label" style={{transform:`translate(-50%, -50%) translate(${x}px,${y}px)`,color}} title={data?.citation}>{data?.change==='added'?'+ ':data?.change==='deleted'?'− ':''}imports</span></EdgeLabelRenderer></>;
};
const edgeTypes={import:ImportLine};
const containment=tree.edges.map(e=>({id:e.id,source:e.source,target:e.target,type:'smoothstep',interactionWidth:0,selectable:false,focusable:false,ariaLabel:`${e.source.slice(10)} contains ${e.target.slice(e.target.indexOf(':')+1)}`}));
const initialView=(overview=false)=>{
 const narrow=window.innerWidth<650;const anchor=tree.nodes.find(n=>n.id===(narrow&&!overview?'directory:src/application':'directory:.'))!;
 return {x:narrow&&!overview?20-anchor.x:28,y:narrow&&!overview?110-anchor.y:(window.innerHeight-46)/2-anchor.y,zoom:1};
};
const App=()=>{
 const flow=useRef<ReactFlowInstance<LabelNode>>(null);const [selected,setSelected]=useState<string|null>(null);
 const projection=useMemo(()=>projectImports(tree,importFixture,selected),[selected]);
 const nodes:LabelNode[]=useMemo(()=>[...tree.nodes,...projection.contexts].map((n:TreeNode)=>{const context=n.id.startsWith('context:');const provenance=context?`${n.path} · unchanged imported context\n${citationText(projection.links.filter(e=>e.targetPath===n.path).flatMap(e=>e.citations))}`:n.path==='.'?'pr-reviewer':`${n.path} · ${n.change}`;return {id:n.id,type:'filename',position:{x:n.x,y:n.y},data:{name:n.name,path:n.path,kind:n.kind,change:n.change,context,selected:n.path===selected,provenance},width:n.width,height:n.height,measured:{width:n.width,height:n.height},draggable:false,selectable:false,focusable:true,ariaLabel:provenance,style:{width:n.width,height:n.height}};}),[projection,selected]);
 const edges:Edge[]=useMemo(()=>[...containment,...projection.links.map(link=>({id:link.id,source:link.source,target:link.target,...(link.target.startsWith('file:')?{targetHandle:'import-right'}:{}),type:'import',data:{citation:citationText(link.citations),change:link.change},markerEnd:{type:MarkerType.ArrowClosed,color:colors[link.change],width:14,height:14},focusable:true,ariaLabel:`${selected} imports ${link.targetPath} · ${link.change}\n${citationText(link.citations)}`}))],[projection,selected]);
 const reset=()=>flow.current?.setViewport(initialView(true),{duration:0});
 const key=(e:React.KeyboardEvent<HTMLElement>)=>{
  if(!flow.current||e.altKey||e.metaKey||e.ctrlKey)return;const view=flow.current.getViewport();const step=e.shiftKey?160:80;
  if(e.key==='Enter'){const id=(e.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id');if(id?.startsWith('file:')){e.preventDefault();e.stopPropagation();const path=id.slice(5);setSelected(old=>old===path?null:path);}return;}
  if(e.key==='Escape'){setSelected(null);return;}
  const offset:Record<string,{x:number;y:number}>={ArrowLeft:{x:step,y:0},ArrowRight:{x:-step,y:0},ArrowUp:{x:0,y:step},ArrowDown:{x:0,y:-step}};
  const pan=offset[e.key];if(pan){e.preventDefault();void flow.current.setViewport({...view,x:view.x+pan.x,y:view.y+pan.y});}
  else if(e.key==='+'||e.key==='='||e.key==='-'){e.preventDefault();void flow.current.zoomTo(Math.max(.35,Math.min(2.5,view.zoom*(e.key==='-'?.85:1.15))),{duration:0});}
  else if(e.key==='0'){e.preventDefault();void reset();}
 };
 const prepared=importFixture.sources.some(s=>s.path===selected);
 return <><header><span title={`PR25 · ${fixture.base} → ${fixture.head}`}>pr-reviewer <b>PR #25</b></span>{selected&&<span className="selection-cue" title={`${selected}\nStatic relative imports only; including type imports. No dynamic/package imports or call/runtime inference.\n${projection.unresolved.length} unresolved relative imports.`}>{selected.split('/').at(-1)} · {prepared?'imports':'imports unavailable'}</span>}<button onClick={reset} aria-label="Overview" title="Overview · readable root framing"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></header><main tabIndex={0} onKeyDownCapture={key} aria-label="PR25 file tree. Tree edges mean contains; selected-file arrows mean static imports. Drag or scroll to pan; pinch or Control-wheel to zoom; arrow keys pan, plus and minus zoom, zero shows Overview."><ReactFlow<LabelNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} onNodeClick={(_,node)=>{if(node.data.kind==='file'&&!node.data.context)setSelected(old=>old===node.data.path?null:node.data.path);}} onPaneClick={()=>setSelected(null)} onInit={instance=>{flow.current=instance;void instance.setViewport(initialView(),{duration:0});}} defaultViewport={{x:28,y:28,zoom:1}} minZoom={.35} maxZoom={2.5} panOnDrag panOnScroll zoomOnScroll={false} zoomOnPinch zoomOnDoubleClick={false} preventScrolling autoPanOnNodeFocus={false} proOptions={{hideAttribution:true}}><Background variant={BackgroundVariant.Dots} color="#41474b" gap={22} size={.65}/></ReactFlow></main></>;
};
const root=document.getElementById('root');if(root)createRoot(root).render(<App/>);
