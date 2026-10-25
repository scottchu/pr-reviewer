import React,{useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ReactFlow,Background,BackgroundVariant,Handle,Position,type Node,type NodeProps,type ReactFlowInstance} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import fixture from './paths.json' with {type:'json'};
import {buildTree} from './tree.ts';
const tree=buildTree(fixture.paths);
type LabelNode=Node<{name:string;path:string;kind:'file'|'directory'},'filename'>;
const Label=({data}:NodeProps<LabelNode>)=><><Handle type="target" position={Position.Left} isConnectable={false}/><span className={`filename ${data.kind}`} title={data.path==='.'?'pr-reviewer':data.path} data-file-path={data.kind==='file'?data.path:undefined}>{data.name}</span><Handle type="source" position={Position.Right} isConnectable={false}/></>;
const nodeTypes={filename:Label};
const nodes:LabelNode[]=tree.nodes.map(n=>({id:n.id,type:'filename',position:{x:n.x,y:n.y},data:{name:n.name,path:n.path,kind:n.kind},width:n.width,height:n.height,measured:{width:n.width,height:n.height},draggable:false,selectable:false,focusable:true,ariaLabel:n.path==='.'?'pr-reviewer repository root':n.path,style:{width:n.width,height:n.height}}));
const edges=tree.edges.map(e=>({id:e.id,source:e.source,target:e.target,type:'smoothstep',interactionWidth:0,selectable:false,focusable:false,ariaLabel:`${e.source.slice(10)} contains ${e.target.slice(e.target.indexOf(':')+1)}`}));
const initialView=()=>{
 const narrow=window.innerWidth<650;const anchor=tree.nodes.find(n=>n.id===(narrow?'directory:src/application':'directory:.'))!;
 return {x:narrow?20-anchor.x:28,y:narrow?110-anchor.y:(window.innerHeight-46)/2-anchor.y,zoom:1};
};
const App=()=>{
 const flow=useRef<ReactFlowInstance<LabelNode>>(null);
 const reset=()=>flow.current?.setViewport(initialView(),{duration:0});
 const key=(e:React.KeyboardEvent<HTMLElement>)=>{
  if(!flow.current||e.altKey||e.metaKey||e.ctrlKey)return;const view=flow.current.getViewport();const step=e.shiftKey?160:80;
  const offset:Record<string,{x:number;y:number}>={ArrowLeft:{x:step,y:0},ArrowRight:{x:-step,y:0},ArrowUp:{x:0,y:step},ArrowDown:{x:0,y:-step}};
  const pan=offset[e.key];if(pan){e.preventDefault();void flow.current.setViewport({...view,x:view.x+pan.x,y:view.y+pan.y});}
  else if(e.key==='+'||e.key==='='||e.key==='-'){e.preventDefault();void flow.current.zoomTo(Math.max(.35,Math.min(2.5,view.zoom*(e.key==='-'?.85:1.15))),{duration:0});}
  else if(e.key==='0'){e.preventDefault();void reset();}
 };
 return <><header><span title={`PR25 · ${fixture.base} → ${fixture.head}`}>pr-reviewer <b>PR #25</b></span><button onClick={reset} aria-label="Reset view" title="Reset view"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></header><main tabIndex={0} onKeyDown={key} aria-label="PR25 file tree. Edges mean contains. Drag or scroll to pan; pinch or Control-wheel to zoom; arrow keys pan, plus and minus zoom, zero resets."><ReactFlow<LabelNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} onNodeClick={()=>{}} onInit={instance=>{flow.current=instance;void instance.setViewport(initialView(),{duration:0});}} defaultViewport={{x:28,y:28,zoom:1}} minZoom={.35} maxZoom={2.5} panOnDrag panOnScroll zoomOnScroll={false} zoomOnPinch zoomOnDoubleClick={false} preventScrolling autoPanOnNodeFocus={false} proOptions={{hideAttribution:true}}><Background variant={BackgroundVariant.Dots} color="#41474b" gap={22} size={.65}/></ReactFlow></main></>;
};
const root=document.getElementById('root');if(root)createRoot(root).render(<App/>);
