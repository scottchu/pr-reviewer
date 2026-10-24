import {sourceComparison,validateAnchor} from '../domain/public.ts';
import type {Anchor,Snapshot,SourceGraph,SourceView} from '../domain/public.ts';
import type {GraphFrames} from './private-session.ts';
export type CanvasFrame=NonNullable<GraphFrames['structural']>;
export type CanvasSide=Readonly<{side:'base'|'head';source:SourceView|null;anchor:Anchor|null;lines:SourceView['lines'];omitted:number;reason:string}>;
export type CanvasReading=Readonly<{fileKey:string;sides:readonly CanvasSide[]}>;
export type SourceCanvasView=Readonly<{snapshot:Snapshot|null;graph:SourceGraph|null;frame:CanvasFrame|null;reading:CanvasReading|null;back:readonly CanvasFrame[];busy:boolean;error:string;restoreId:number}>;
const initial=():SourceCanvasView=>({snapshot:null,graph:null,frame:null,reading:null,back:[],busy:false,error:'',restoreId:0});
const defaultFrame=(fileKey:string):CanvasFrame=>({fileKey,context:false,spans:false,spanId:'',viewport:{x:0,y:0,zoom:1}});
const verifySource=async(source:SourceView)=>{const bytes=new TextEncoder().encode(source.content);if(bytes.length>1048576)throw new Error('source_budget_exceeded');const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),value=>value.toString(16).padStart(2,'0')).join('');if(digest!==source.hash)throw new Error('source_checksum_mismatch');};
export const createSourceCanvas=(options:{verify?:(source:SourceView)=>Promise<void>;timeoutMs?:number}={})=>{
 let state=initial(),generation=0,read:AbortController|null=null,disposed=false;
 const listeners=new Set<()=>void>();
 const publish=(next:SourceCanvasView)=>{state=next;for(const listener of listeners)listener();};
 const interrupt=()=>{generation++;read?.abort();read=null;};
 const project=(anchor:Anchor,fileKey:string|undefined,expectedHash?:string):{reading:CanvasReading;frame:CanvasFrame}=>{
  const {snapshot,graph}=state;if(!snapshot||!graph||graph.snapshotId!==snapshot.snapshotId||!validateAnchor(snapshot.snapshotId,snapshot.sources,anchor))throw new Error('canvas_source_unavailable');
  const candidates=graph.files.filter(file=>(anchor.side==='base'?file.oldPath:file.newPath)===anchor.path),file=fileKey?candidates.find(file=>file.key===fileKey):candidates.length===1?candidates[0]:undefined;
  if(!file)throw new Error(candidates.length>1?'canvas_comparison_ambiguous':'canvas_comparison_unavailable');
  const sources=sourceComparison(snapshot,anchor,file.key),selected=sources.find(source=>source.side===anchor.side&&source.path===anchor.path);
  if(!selected)throw new Error('canvas_source_unavailable');if(expectedHash&&selected.hash!==expectedHash)throw new Error('source_checksum_mismatch');
  const sides=(['base','head'] as const).map(side=>{const source=sources.find(item=>item.side===side)??null,sourceAnchor=source&&source.lineCount>0?{snapshotId:snapshot.snapshotId,side,path:source.path,startLine:side===anchor.side?anchor.startLine:Math.max(1,source.lines.find(line=>line.status!=='unchanged'&&line.status!=='not_analyzed')?.number??1),endLine:side===anchor.side?anchor.endLine:Math.max(1,source.lines.find(line=>line.status!=='unchanged'&&line.status!=='not_analyzed')?.number??1)}:null;return {side,source,anchor:sourceAnchor,lines:[],omitted:source?.lineCount??0,reason:source&&source.lineCount===0?'Empty retained source; no selectable lines.':source?'':file.dispositions.find(item=>item.side===side)?.state==='prepared'?'Exact comparison side unavailable in the public source projection; no substitute partner.':file.dispositions.find(item=>item.side===side)?.reason??'Absent or unprepared in the exact pinned comparison.'};});
  return {reading:{fileKey:file.key,sides},frame:{...(state.frame??defaultFrame(file.key)),fileKey:file.key,spans:false,spanId:'',inspection:{anchor:structuredClone(anchor),contentHash:selected.hash}}};
 };
 const bounded=(reading:CanvasReading,expanded=false):CanvasReading=>({...reading,sides:reading.sides.map(side=>{const limit=expanded?200:48,start=Math.max(0,(side.anchor?.startLine??1)-9),lines=side.source?.lines.slice(start,start+limit)??[];return {...side,lines,omitted:(side.source?.lines.length??0)-lines.length};})});
 const validate=async(reading:CanvasReading,controller:AbortController)=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const cancelled=new Promise<never>((_resolve,reject)=>{const stop=()=>reject(new Error('canvas_read_superseded'));controller.signal.addEventListener('abort',stop,{once:true});if(controller.signal.aborted)stop();timer=setTimeout(()=>{controller.abort();},options.timeoutMs??10000);});
  try{await Promise.race([Promise.all(reading.sides.flatMap(side=>side.source?[(options.verify??verifySource)(side.source)]:[])),cancelled]);}finally{if(timer)clearTimeout(timer);}
 };
 const inspect=async(anchor:Anchor,fileKey?:string,restoreFrame?:CanvasFrame)=>{
  interrupt();const expected=generation,controller=new AbortController();read=controller;const previous=state.frame;
  publish({...state,busy:true,error:''});
  try{const projected=project(anchor,fileKey,restoreFrame?.inspection?.contentHash);await validate(projected.reading,controller);if(disposed||expected!==generation||read!==controller||controller.signal.aborted)throw new Error('canvas_read_superseded');
   const frame=restoreFrame??{...projected.frame,viewport:{x:0,y:0,zoom:1}};publish({...state,frame,reading:bounded(projected.reading,frame.inspection?.expanded),back:restoreFrame?state.back:previous?[...state.back,structuredClone(previous)].slice(-16):state.back,busy:false,error:'',restoreId:state.restoreId+1});
  }catch(error){if(!disposed&&expected===generation&&read===controller)publish({...state,busy:false,reading:restoreFrame?null:state.reading,error:error instanceof Error?error.message:'canvas_source_unavailable'});throw error;}finally{if(read===controller)read=null;}
 };
 const restore=async(frame:CanvasFrame|null)=>{
  if(!frame)return;const graph=state.graph;if(!graph?.files.some(file=>file.key===frame.fileKey)){publish({...state,reading:null,error:'saved_canvas_source_unavailable'});throw new Error('saved_canvas_source_unavailable');}
  if(frame.inspection)return inspect(frame.inspection.anchor,frame.fileKey,structuredClone(frame));
  interrupt();publish({...state,frame:structuredClone(frame),reading:null,busy:false,error:'',restoreId:state.restoreId+1});
 };
 return {
  getSnapshot:()=>state,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},
  setReview:(snapshot:Snapshot|null,graph:SourceGraph|null)=>{disposed=false;const changed=state.snapshot?.snapshotId!==snapshot?.snapshotId;if(changed||!snapshot||!graph){interrupt();publish({...initial(),snapshot,graph,frame:graph?.files[0]?defaultFrame(graph.files[0].key):null});}else{const selected=state.frame?.inspection,source=selected?snapshot.sources.find(item=>item.side===selected.anchor.side&&item.path===selected.anchor.path):null;publish({...state,snapshot,graph,...(selected&&source?.hash!==selected.contentHash?{reading:null,error:'source_checksum_mismatch'}:{})});}},
  inspect,restore,
  back:async()=>{const frame=state.back.at(-1);if(!frame)return;await restore(frame);publish({...state,back:state.back.slice(0,-1)});},
  focusFile:(fileKey:string)=>{if(!state.graph?.files.some(file=>file.key===fileKey))throw new Error('canvas_comparison_unavailable');interrupt();publish({...state,frame:defaultFrame(fileKey),reading:null,busy:false,error:'',back:state.frame?[...state.back,structuredClone(state.frame)].slice(-16):state.back,restoreId:state.restoreId+1});},
  setViewport:(viewport:CanvasFrame['viewport'])=>{if(state.frame&&Number.isFinite(viewport.x)&&Number.isFinite(viewport.y)&&Number.isFinite(viewport.zoom)&&viewport.zoom>=.1&&viewport.zoom<=4)publish({...state,frame:{...state.frame,viewport:{...viewport}}});},
  setContext:(context:boolean)=>{if(state.frame)publish({...state,frame:{...state.frame,context}});},
  expand:()=>{if(!state.frame?.inspection||!state.reading)return;const expanded=!state.frame.inspection.expanded;publish({...state,frame:{...state.frame,inspection:{...state.frame.inspection,expanded}},reading:bounded(state.reading,expanded),restoreId:state.restoreId+1});},
  dispose:()=>{interrupt();disposed=true;publish(initial());}
 };
};
export type SourceCanvas=ReturnType<typeof createSourceCanvas>;
