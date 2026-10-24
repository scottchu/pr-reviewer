import { compareSources, validateAnchor, inlineDocumentLinks, resolveDocumentDestination, documentHeadingLine } from './public.ts';
import type { Anchor, Snapshot, Source, SourceView, SourceDisposition, DocumentReference, ChangedFile } from './public.ts';
export type GraphNode = { id: string; kind: 'file' | 'hunk'; label: string; side: 'base' | 'head'; path: string; anchor: Anchor; summary: string; method: string; change: string; context: boolean; fileKey?:string };
export type GraphEdge = { id: string; kind: 'comparison' | 'contains' | 'document_reference'; source: string; target: string; label: string; method: string; anchors: Anchor[] };
export type GraphFile=ChangedFile & {key:string};
export type SourceGraph = { files:GraphFile[]; snapshotId: string; nodes: GraphNode[]; edges: GraphEdge[]; unresolved: DocumentReference[]; dispositions: SourceDisposition[]; unknowns: string[] };
const sourceId = (snapshot: Snapshot, side: string, path: string) => JSON.stringify([snapshot.snapshotId,side,path]);
const anchorFor = (snapshot: Snapshot, source: Source, startLine=1, endLine=source.lineCount): Anchor => ({snapshotId:snapshot.snapshotId,side:source.side,path:source.path,startLine,endLine});
const singleView = (source: Source, status: 'added' | 'removed' | 'unchanged' | 'not_analyzed'): SourceView => ({...source,lines:(source.lineCount===0?[]:source.content.replace(/\n$/,'').split('\n')).map((text,index)=>({number:index+1,text,status}))});
export const graphFiles=(snapshot:Snapshot):GraphFile[] => snapshot.changedFiles?.map((file,index)=>({...file,key:JSON.stringify([index,file.oldPath,file.newPath])}))??[...new Set(snapshot.sources.map(source=>source.path))].map((path,index)=>({key:JSON.stringify([index,path,path]),status:'modified' as const,oldPath:snapshot.sources.some(source=>source.path===path&&source.side==='base')?path:null,newPath:snapshot.sources.some(source=>source.path===path&&source.side==='head')?path:null,dispositions:[]}));
export const uniqueSources=(snapshot:Snapshot):Source[]=>snapshot.sources.filter((source,index,sources)=>sources.findIndex(item=>item.side===source.side&&item.path===source.path)===index);
const providerView=(source:Source,files:readonly ChangedFile[]):SourceView=>{
 const view=singleView(source,'unchanged');
 for(const file of files){if((source.side==='base'?file.oldPath:file.newPath)!==source.path)continue;
  if(file.coverage!=='text'){for(const line of view.lines)line.status='not_analyzed';continue;}
  for(const hunk of file.hunks??[]){const start=source.side==='base'?hunk.oldStart:hunk.newStart,length=source.side==='base'?hunk.oldLines:hunk.newLines;for(const line of view.lines)if(line.number>=start&&line.number<start+length)line.status=hunk.oldLines&&hunk.newLines?'modified':source.side==='base'?'removed':'added';}
 }return view;
};
export const sourceComparison=(snapshot:Snapshot,anchor:Anchor,fileKey?:string):SourceView[]=>{
 if(!snapshot.candidate)return sourceViews(snapshot).filter(source=>source.path===anchor.path);
 const files=graphFiles(snapshot),file=files.find(file=>file.key===fileKey)??files.find(file=>(anchor.side==='base'?file.oldPath:file.newPath)===anchor.path);
 if(!file)return [];
 return (['base','head'] as const).flatMap(side=>{const path=side==='base'?file.oldPath:file.newPath,source=uniqueSources(snapshot).find(source=>source.side===side&&source.path===path);return source?[providerView(source,[file])]:[];});
};
export const sourceViews = (snapshot: Snapshot): SourceView[] => {
 if(snapshot.candidate)return uniqueSources(snapshot).map(source=>providerView(source,snapshot.changedFiles??[]));
 const views: SourceView[]=[];
 for(const source of snapshot.sources){
  const opposite=snapshot.sources.find(s=>s.path===source.path&&s.side!==source.side);
  const changed=snapshot.changedFiles?.find(f=>f.oldPath===source.path||f.newPath===source.path);
  if(opposite){
   try { const pair=source.side==='base'?compareSources(source,opposite):compareSources(opposite,source);views.push(pair[source.side==='base'?0:1]); }
   catch { views.push(singleView(source,'not_analyzed')); }
  } else views.push(singleView(source,changed?.status==='added'&&source.side==='head'?'added':changed?.status==='deleted'&&source.side==='base'?'removed':changed?'not_analyzed':'unchanged'));
 }
 return views;
};
const referenceValid = (snapshot:Snapshot, reference:DocumentReference):boolean => {
 if(reference.source.startLine!==reference.source.endLine||!validateAnchor(snapshot.snapshotId,snapshot.sources,reference.source))return false;
 const source=snapshot.sources.find(s=>s.path===reference.source.path&&s.side===reference.source.side)!;
 if(!inlineDocumentLinks(source.content).some(link=>link.line===reference.source.startLine&&link.destination===reference.destination))return false;
 if(!reference.target)return true;
 if(!validateAnchor(snapshot.snapshotId,snapshot.sources,reference.target)||reference.target.side!==reference.source.side)return false;
 try {
  const {path,fragment}=resolveDocumentDestination(source.path,reference.destination);
  const target=snapshot.sources.find(s=>s.path===path&&s.side===reference.target!.side);
  return Boolean(target&&path===reference.target.path&&documentHeadingLine(target.content,fragment)===reference.target.startLine&&reference.target.startLine===reference.target.endLine);
 } catch {return false;}

};
const providerGraph=(snapshot:Snapshot):SourceGraph=>{
 const files=graphFiles(snapshot),nodes:GraphNode[]=[],edges:GraphEdge[]=[];
 for(const file of files){
  const pair:GraphNode[]=[];
  for(const side of ['base','head'] as const){
   const path=side==='base'?file.oldPath:file.newPath,source=uniqueSources(snapshot).find(source=>source.side===side&&source.path===path);if(!source||source.lineCount===0)continue;
   const id=JSON.stringify([file.key,sourceId(snapshot,side,source.path)]),view=providerView(source,[file]),anchor=anchorFor(snapshot,source);
   const summary=view.lines.filter(line=>!['unchanged','not_analyzed'].includes(line.status)&&line.text.trim()).slice(0,3).map(line=>line.text.slice(0,150)).join('\n');
   const node:GraphNode={id,kind:'file',label:source.path,side,path:source.path,anchor,summary,method:'verified_git_blob',change:file.status,context:false,fileKey:file.key};nodes.push(node);pair.push(node);
   for(const hunk of file.hunks??[]){const start=side==='base'?hunk.oldStart:hunk.newStart,length=side==='base'?hunk.oldLines:hunk.newLines;if(length===0)continue;const span=anchorFor(snapshot,source,start,start+length-1),hunkId=JSON.stringify([file.key,hunk.id,side]);
    nodes.push({id:hunkId,kind:'hunk',label:`${side==='base'?'Before':'After'} lines ${start}–${start+length-1}`,side,path:source.path,anchor:span,summary:view.lines.slice(start-1,start+length-1).slice(0,3).map(line=>line.text.slice(0,160)).join('\n'),method:'pinned_git_hunk',change:hunk.oldLines&&hunk.newLines?'modified':side==='base'?'removed':'added',context:false,fileKey:file.key});
    edges.push({id:JSON.stringify(['contains',hunkId]),kind:'contains',source:id,target:hunkId,label:'contains pinned Git span',method:'primary_ledger_hunk',anchors:[span]});
   }
  }
  if(pair.length===2)edges.push({id:JSON.stringify(['comparison',file.key]),kind:'comparison',source:pair[0]!.id,target:pair[1]!.id,label:'before → after',method:'verified_changed_path_pair',anchors:pair.map(node=>node.anchor)});
 }
 return {snapshotId:snapshot.snapshotId,files,nodes,edges,unresolved:[],dispositions:files.flatMap(file=>file.dispositions),unknowns:['Callers/callees not analyzed. No semantic leaf assertion.','Imported coverage uses pinned Git hunks, not execution evidence.','Document reference preparation has not run for this imported snapshot. Empty and unsupported sides have no selectable line anchors.']};
};
export const projectGraph = (snapshot: Snapshot): SourceGraph => {
 if(snapshot.candidate)return providerGraph(snapshot);
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
  if(view.lines.some(line=>line.status==='not_analyzed'))unknowns.push(`Comparison unavailable: ${source.path}; no additions/removals or changed spans inferred.`);
  const headings=source.content.split('\n').filter(line=>/^#{1,6} /.test(line)).slice(0,3).map(line=>line.replace(/^#+ /,''));
  const changes=view.lines.filter(line=>!['unchanged','not_analyzed'].includes(line.status)&&line.text.trim()).slice(0,3).map(line=>line.text.slice(0,150));
  nodes.push({id,kind:'file',label:source.path,side:source.side,path:source.path,anchor:anchorFor(snapshot,source),summary:[...headings,...changes].join('\n'),method:'verified_git_blob',change:entry?.status??(snapshot.changedFiles?'context':'prepared'),context:Boolean(snapshot.changedFiles&&!entry)});
  if(source.side==='base'&&opposite){const target=sourceId(snapshot,'head',source.path);edges.push({id:JSON.stringify(['comparison',id,target]),kind:'comparison',source:id,target,label:'before → after',method:'verified_path_pair',anchors:[anchorFor(snapshot,source),anchorFor(snapshot,opposite)]});}
  let start=0;
  while(start<view.lines.length){
   if(['unchanged','not_analyzed'].includes(view.lines[start]!.status)){start++;continue;}
   let end=start;while(end+1<view.lines.length&&!['unchanged','not_analyzed'].includes(view.lines[end+1]!.status))end++;
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
 return {snapshotId:snapshot.snapshotId,files:graphFiles(snapshot),nodes,edges,unresolved,dispositions:snapshot.changedFiles?.flatMap(f=>f.dispositions)??[],unknowns:[...new Set(unknowns)]};
};
