import { compareSources, validateAnchor } from './public.ts';
import type { Anchor, Snapshot, Source, SourceView, SourceDisposition, DocumentReference } from './public.ts';
export type GraphNode = { id: string; kind: 'file' | 'hunk'; label: string; side: 'base' | 'head'; path: string; anchor: Anchor; summary: string; method: string; change: string; context: boolean };
export type GraphEdge = { id: string; kind: 'comparison' | 'contains' | 'document_reference'; source: string; target: string; label: string; method: string; anchors: Anchor[] };
export type SourceGraph = { snapshotId: string; nodes: GraphNode[]; edges: GraphEdge[]; unresolved: DocumentReference[]; dispositions: SourceDisposition[]; unknowns: string[] };
const sourceId = (snapshot: Snapshot, side: string, path: string) => JSON.stringify([snapshot.snapshotId,side,path]);
const anchorFor = (snapshot: Snapshot, source: Source, startLine=1, endLine=source.lineCount): Anchor => ({snapshotId:snapshot.snapshotId,side:source.side,path:source.path,startLine,endLine});
const singleView = (source: Source, status: 'added' | 'removed' | 'unchanged'): SourceView => ({...source,lines:source.content.replace(/\n$/,'').split('\n').map((text,index)=>({number:index+1,text,status}))});
export const sourceViews = (snapshot: Snapshot): SourceView[] => {
 const views: SourceView[]=[];
 for(const source of snapshot.sources){
  const opposite=snapshot.sources.find(s=>s.path===source.path&&s.side!==source.side);
  const changed=snapshot.changedFiles?.find(f=>f.oldPath===source.path||f.newPath===source.path);
  if(opposite){
   try { const pair=source.side==='base'?compareSources(source,opposite):compareSources(opposite,source);views.push(pair[source.side==='base'?0:1]); }
   catch { views.push(singleView(source,'unchanged')); }
  } else views.push(singleView(source,changed?(source.side==='head'?'added':'removed'):'unchanged'));
 }
 return views;
};
const referenceValid = (snapshot:Snapshot, reference:DocumentReference):boolean => {
 if(!validateAnchor(snapshot.snapshotId,snapshot.sources,reference.source))return false;
 const source=snapshot.sources.find(s=>s.path===reference.source.path&&s.side===reference.source.side)!;
 const line=source.content.split("\n")[reference.source.startLine-1]??"";
 if(![...line.matchAll(/(?<!!)\[[^\]]+\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)].some(match=>match[1]===reference.destination))return false;
 if(!reference.target)return true;
 if(!validateAnchor(snapshot.snapshotId,snapshot.sources,reference.target)||reference.target.side!==reference.source.side)return false;
 try {
  const destination=decodeURIComponent(reference.destination);
  if(/^[a-z][a-z0-9+.-]*:/i.test(destination)||destination.startsWith("/"))return false;
  const relative=destination.split("#")[0]??"";
  const parts=relative?source.path.split("/").slice(0,-1).concat(relative.split("/")):source.path.split("/");
  const resolved:string[]=[];for(const part of parts){if(part==="..") {if(!resolved.length)return false;resolved.pop();}else if(part&&part!==".")resolved.push(part);}
  return resolved.join("/")===reference.target.path;
 } catch {return false;}
};
export const projectGraph = (snapshot: Snapshot): SourceGraph => {
 const nodes: GraphNode[]=[], edges: GraphEdge[]=[], unresolved: DocumentReference[]=[];
 const unknowns=['Callers/callees not analyzed. No semantic leaf assertion.', 'Only bounded inline Markdown links outside code fences analyzed; reference-style and HTML links not analyzed.'];
 if((snapshot.documentReferences?.length??0)>=120)unknowns.push("Reference budget reached; remaining inline links not analyzed.");
 const views=sourceViews(snapshot);
 for(const source of snapshot.sources){
  const id=sourceId(snapshot,source.side,source.path), view=views.find(s=>s.side===source.side&&s.path===source.path)!;
  const entry=snapshot.changedFiles?.find(f=>f.oldPath===source.path||f.newPath===source.path);
  const opposite=snapshot.sources.find(s=>s.path===source.path&&s.side!==source.side);
  const oversized=opposite&&source.lineCount*opposite.lineCount>1000000;
  if(oversized) unknowns.push(`Line comparison not analyzed: ${source.path} exceeds comparison budget.`);
  const headings=source.content.split('\n').filter(line=>/^#{1,6} /.test(line)).slice(0,3).map(line=>line.replace(/^#+ /,''));
  const changes=view.lines.filter(line=>line.status!=='unchanged'&&line.text.trim()).slice(0,3).map(line=>line.text.slice(0,150));
  nodes.push({id,kind:'file',label:source.path,side:source.side,path:source.path,anchor:anchorFor(snapshot,source),summary:[...headings,...changes].join('\n'),method:'verified_git_blob',change:entry?.status??(snapshot.changedFiles?'context':'prepared'),context:Boolean(snapshot.changedFiles&&!entry)});
  if(source.side==='base'&&opposite){const target=sourceId(snapshot,'head',source.path);edges.push({id:JSON.stringify(['comparison',id,target]),kind:'comparison',source:id,target,label:'before → after',method:'verified_path_pair',anchors:[anchorFor(snapshot,source),anchorFor(snapshot,opposite)]});}
  let start=0;
  while(start<view.lines.length){
   if(view.lines[start]!.status==='unchanged'){start++;continue;}
   let end=start;while(end+1<view.lines.length&&view.lines[end+1]!.status!=='unchanged')end++;
   const anchor=anchorFor(snapshot,source,start+1,end+1), hunkId=JSON.stringify([id,start+1,end+1]);
   const summary=view.lines.slice(start,end+1).filter(l=>l.text.trim()).slice(0,3).map(l=>l.text.slice(0,160)).join('\n');
   nodes.push({id:hunkId,kind:'hunk',label:`${source.side==='base'?'Before':'After'} lines ${start+1}–${end+1}`,side:source.side,path:source.path,anchor,summary,method:'bounded_line_comparison',change:view.lines[start]!.status,context:false});
   edges.push({id:JSON.stringify(['contains',hunkId]),kind:'contains',source:id,target:hunkId,label:'contains changed span',method:'source_span_ownership',anchors:[anchor]});start=end+1;
  }
 }
 for(const reference of snapshot.documentReferences??[]){
  if(!referenceValid(snapshot,reference)){unresolved.push({...reference,target:null,reason:'invalid pinned source anchor'});continue;}
  if(!reference.target){unresolved.push(reference);continue;}
  const source=sourceId(snapshot,reference.source.side,reference.source.path),target=sourceId(snapshot,reference.target.side,reference.target.path);
  edges.push({id:JSON.stringify(['reference',reference.source,reference.destination]),kind:'document_reference',source,target,label:`document link · ${reference.destination}`,method:reference.method,anchors:[reference.source,reference.target]});
 }
 return {snapshotId:snapshot.snapshotId,nodes,edges,unresolved,dispositions:snapshot.changedFiles?.flatMap(f=>f.dispositions)??[],unknowns:[...new Set(unknowns)]};
};
