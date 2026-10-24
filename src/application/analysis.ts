import {localOwnerSession,accessHeaders} from './local-access.ts';
import {createRegistry} from '../integration/registry.ts';
import type {AnalysisCommand,AnalysisReceipt,AnalysisView,SemanticAnchor,SemanticSource,SemanticFunctionNode,SemanticCallEdge,AnalysisJobView} from '../domain/public.ts';
type Intent=AnalysisCommand extends infer C?C extends AnalysisCommand?Omit<C,'commandId'>:never:never;
type Owner={generation:number;token:string;snapshotId:string;analysisId:string|undefined};
export type SemanticView={view:AnalysisView|null;authenticated:boolean;busy:boolean;reading:boolean;uncertain:boolean;error:string;source:SemanticSource|null;sourceAnchor:SemanticAnchor|null;sourceBusy:boolean;sourceNavigation:'inspect'|'restore';focus:string;snippets:Readonly<Record<string,SemanticSource>>};
export const semanticSourceKey=(anchor:Pick<SemanticAnchor,'side'|'path'|'contentHash'>)=>JSON.stringify([anchor.side,anchor.path,anchor.contentHash]);
export const semanticExcerpt=(sources:Readonly<Record<string,SemanticSource>>,anchor:SemanticAnchor)=>sources[semanticSourceKey(anchor)]?.content.slice(anchor.start,anchor.end)??'Source excerpt loading…';
export const semanticProjection=(view:AnalysisView|null,focus:string)=>{
 const analysis=view?.analysis;
 if(analysis?.status!=='analyzed')return {nodes:[] as SemanticFunctionNode[],edges:[] as SemanticCallEdge[],totalNodes:0};
 const roots=analysis.neighborhoods.flatMap(item=>item.nodeId?[item.nodeId]:[]);
 const active=analysis.nodes.find(node=>node.id===focus)?.id??roots[0];
 const relevant=new Set<string>([...(active?[active]:[]),...roots]);
 for(const edge of analysis.edges)if(edge.caller===active||edge.callee===active||roots.includes(edge.caller)||roots.includes(edge.callee)){relevant.add(edge.caller);relevant.add(edge.callee);}
 const ordered=[...analysis.nodes.filter(node=>node.id===active),...analysis.nodes.filter(node=>node.id!==active&&roots.includes(node.id)),...analysis.nodes.filter(node=>!roots.includes(node.id)&&node.id!==active&&relevant.has(node.id))];
 const selected=ordered.slice(0,12);
 // Put supplied incoming callers above their selected function; callees below.
 // This is canvas ordering only, never an additional relationship or execution claim.
 const rank=(node:SemanticFunctionNode)=>roots.includes(node.id)||node.id===active?0:analysis.edges.some(edge=>edge.caller===node.id&&(roots.includes(edge.callee)||edge.callee===active))?-1:1;
 const nodes=selected.sort((a,b)=>rank(a)-rank(b)),ids=new Set(nodes.map(node=>node.id));
 return {nodes,edges:analysis.edges.filter(edge=>ids.has(edge.caller)&&ids.has(edge.callee)),totalNodes:relevant.size};
};
export const semanticRelationshipProjection=(view:AnalysisView|null,focus:string)=>{
 const projection=semanticProjection(view,focus),analysis=view?.analysis;
 const active=projection.nodes.find(node=>node.id===focus)?.id??(analysis?.status==='analyzed'?analysis.neighborhoods.find(item=>item.nodeId)?.nodeId:undefined);
 const name=(id:string)=>analysis?.status==='analyzed'?analysis.nodes.find(node=>node.id===id)?.name??'Unavailable function':'Unavailable function';
 return {...projection,nodes:projection.nodes.map(node=>({node,selected:node.id===active,incoming:projection.edges.filter(edge=>edge.callee===node.id).map(edge=>name(edge.caller)),outgoing:projection.edges.filter(edge=>edge.caller===node.id).map(edge=>name(edge.callee))})),edges:projection.edges.map(edge=>({edge,label:`${name(edge.caller)} → ${name(edge.callee)} · static call`}))};
};
export const semanticIssueProjection=(view:(Pick<AnalysisView,'analysis'> & {corpus:Pick<NonNullable<AnalysisView['corpus']>,'issues'>|null})| null,focus:string,sourceAnchor:SemanticAnchor|null=null)=>{
 const analysis=view?.analysis,selected=sourceAnchor??(analysis?.status==='analyzed'?analysis.nodes.find(node=>node.id===focus)?.body:null)??null;
 const matches=(anchor:SemanticAnchor)=>Boolean(selected&&anchor.snapshotId===selected.snapshotId&&anchor.side===selected.side&&anchor.path===selected.path&&anchor.contentHash===selected.contentHash&&anchor.start<selected.end&&anchor.end>selected.start);
 const unresolved=analysis?.status==='analyzed'?analysis.unresolved:[],diagnostics=analysis?.diagnostics??[],issues=view?.corpus?.issues??[];
 return {selected,unresolved:unresolved.filter(site=>!sourceAnchor&&site.caller===focus||matches(site.anchor)),diagnostics:diagnostics.filter(item=>selected&&item.side===selected.side&&item.path===selected.path&&item.start>=selected.start&&item.start<selected.end),context:issues.filter(item=>selected&&item.side===selected.side&&item.path===selected.path),global:issues.filter(item=>!item.path||!item.side),totals:{unresolved:unresolved.length,diagnostics:diagnostics.length,context:issues.length}};
};
export const createAnalysisBridge=(reviewId:string)=>{
 const empty=():SemanticView=>({view:null,authenticated:false,busy:false,reading:false,uncertain:false,error:'',source:null,sourceAnchor:null,sourceBusy:false,sourceNavigation:'inspect',focus:'',snippets:{}});
 let state=empty(),token='',generation=0,snapshotId='',analysisId:string|undefined,disposed=false;
 const registry=createRegistry(),listeners=new Set<()=>void>();
 let connection:object|null=null,read:{controller:AbortController;owner:Owner;done:Promise<void>;finish:()=>void}|null=null,sourceRead:{controller:AbortController;owner:Owner}|null=null;
 let pending:{command:AnalysisCommand;fingerprint:string;receipt?:AnalysisReceipt;jobGeneration?:number}|null=null;
 let operation:object|null=null;
 let priorSelection:{snapshotId:string;analysisId:string|undefined;state:SemanticView}|null=null;
 const captureAnalysisId=()=>state.view?.analysis?.status==='analyzed'?state.view.analysis.analysisId:null;
 const warmControllers=new Set<AbortController>();
 const publish=(next:SemanticView)=>{state=next;for(const listener of listeners)listener();};
 const owner=():Owner=>({generation,token,snapshotId,analysisId});
 const owns=(o:Owner)=>!disposed&&o.generation===generation&&o.token===token&&o.snapshotId===snapshotId;
 const abortRead=()=>{read?.controller.abort();read?.finish();read=null;};
 const interrupt=()=>{generation++;abortRead();sourceRead?.controller.abort();sourceRead=null;for(const c of warmControllers)c.abort();warmControllers.clear();operation=null;};
 const request=async(o:Owner,path:string,body?:unknown,signal?:AbortSignal)=>{
  const response=await fetch(path,{headers:{...accessHeaders(o.token),'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{}),...(signal?{signal}:{})});
  const value=await response.json() as unknown;
  if(!response.ok)throw Object.assign(new Error(String((value as {error?:string}).error??'request_failed')),{definitive:[400,401,403].includes(response.status)});
  return value;
 };
 const sourceQuery=(o:Owner,corpusId:string,anchor:SemanticAnchor)=>({reviewId,snapshotId:o.snapshotId,corpusId,side:anchor.side,path:anchor.path,contentHash:anchor.contentHash});
 const warm=async(o:Owner)=>{
  const corpus=state.view?.corpus,projection=semanticProjection(state.view,state.focus);if(!corpus||warmControllers.size)return;
  const anchors=[...projection.nodes.map(node=>node.body),...projection.edges.flatMap(edge=>edge.sites.slice(0,1).map(site=>site.anchor))];
  const unique=new Map(anchors.map(anchor=>[semanticSourceKey(anchor),anchor]));
  const controller=new AbortController();warmControllers.add(controller);
  try{for(const [key,anchor] of unique){if(!owns(o)||controller.signal.aborted)return;if(state.snippets[key])continue;
   const source=await request(o,'/api/analysis/source',sourceQuery(o,corpus.corpusId,anchor),controller.signal) as SemanticSource;
   if(owns(o)&&!controller.signal.aborted&&state.view?.corpus?.corpusId===corpus.corpusId)publish({...state,snippets:{...state.snippets,[key]:source}});
  }}catch{/* Explicit source navigation reports read errors; excerpts remain visibly unavailable. */}finally{warmControllers.delete(controller);}
 };
 const confirmsReceipt=(view:AnalysisView,receipt:AnalysisReceipt,jobGeneration?:number)=>{
  if(receipt.reviewId!==reviewId||view.reviewId!==receipt.reviewId||view.snapshotId!==receipt.snapshotId||view.graphRevision<receipt.graphRevision||view.analysisGeneration<receipt.analysisGeneration)return false;
  if(!receipt.jobId)return true;
  const job=view.jobs.find(job=>job.jobId===receipt.jobId);
  return Boolean(job&&receipt.jobRevision!==undefined&&job.reviewId===receipt.reviewId&&job.snapshotId===receipt.snapshotId&&job.jobRevision>=receipt.jobRevision&&job.generation<=receipt.analysisGeneration&&(jobGeneration===undefined||job.generation===jobGeneration));
 };
 const refresh=async(o:Owner,mode:'explicit'|'poll'='explicit',minimum?:AnalysisReceipt,jobGeneration?:number)=>{
  if(!owns(o)||!o.token||!o.snapshotId||(mode==='poll'&&(read||state.busy||state.sourceBusy)))return;
  o={...o,analysisId};abortRead();let finish=()=>{};const done=new Promise<void>(resolve=>{finish=resolve;});const currentRead={owner:o,controller:new AbortController(),done,finish};read=currentRead;
  const current=()=>owns(o)&&read===currentRead&&!currentRead.controller.signal.aborted;
  publish({...state,reading:true});
  try{
   const params=new URLSearchParams({reviewId,snapshotId:o.snapshotId,...(o.analysisId?{analysisId:o.analysisId}:{}),...(minimum?{minimumGraphRevision:String(minimum.graphRevision)}:{})});
   const view=await request(o,`/api/analysis?${params}`,undefined,currentRead.controller.signal) as AnalysisView;
   if(current()){
    // A server response cannot change private source or snapshot selection.
    if(view.reviewId!==reviewId||view.snapshotId!==o.snapshotId||(o.analysisId&&view.analysis?.analysisId!==o.analysisId))throw new Error('selection_mismatch');
    if(minimum&&!confirmsReceipt(view,minimum,jobGeneration))throw new Error('readback_pending');
    const same=state.view?.analysis?.analysisId===view.analysis?.analysisId;
    publish({...state,view,authenticated:true,error:'',focus:same?state.focus:'',snippets:same?state.snippets:{}});void warm(o);return view;
   }
  }catch(error){if(current())publish({...state,error:error instanceof Error?error.message:'request_failed'});throw error;
  }finally{if(read===currentRead){read=null;if(owns(o))publish({...state,reading:false});}currentRead.finish();}
 };
 const send=async(intent:Intent):Promise<AnalysisReceipt>=>{
  if(disposed||!token)throw new Error('unauthorized');if(state.busy)throw new Error('submission_in_progress');
  const fingerprint=JSON.stringify(intent);
  if(pending&&pending.fingerprint!==fingerprint)throw new Error('analysis_submission_unknown: retry the unchanged intent');
  const targetJob='jobId' in intent?state.view?.jobs.find(job=>job.jobId===intent.jobId):undefined;
  pending??={command:{...intent,commandId:crypto.randomUUID()} as AnalysisCommand,fingerprint,...(targetJob?{jobGeneration:targetJob.generation}:{})};
  const submission=pending,o=owner(),op={};operation=op;const current=()=>owns(o)&&operation===op;
  abortRead();publish({...state,busy:true,reading:false,error:''});
  try{
   const receipt=await request(o,'/api/analysis/commands',submission.command) as AnalysisReceipt;
   // Preserve an observed receipt for this credential/intent even when private
   // navigation disposed its presentation owner. Never touch a replaced intent.
   if(pending===submission&&o.token===token)submission.receipt=receipt;
   if(!current())throw new Error('submission_superseded');
   if(receipt.state==='rejected'){if(pending===submission)pending=null;throw new Error(receipt.error??'rejected');}
   // Job revisions are local to the receipt's exact job. The query minimum
   // addresses a chosen/latest job, so it cannot confirm a different old job.
   const jobGeneration=submission.command.type==='CancelAnalysis'?submission.jobGeneration:receipt.analysisGeneration;
   const result=receipt.snapshotId===o.snapshotId
    ?await refresh(o,'explicit',receipt,jobGeneration)
    :await request(o,`/api/analysis?${new URLSearchParams({reviewId,snapshotId:receipt.snapshotId,minimumGraphRevision:String(receipt.graphRevision)})}`) as AnalysisView;
   if(!current()||!result||!confirmsReceipt(result,receipt,jobGeneration))throw new Error('readback_pending');
   if(pending===submission)pending=null;publish({...state,uncertain:false});return receipt;
  }catch(error){if(current()){if(submission.receipt?.state!=='applied'&&error instanceof Error&&'definitive' in error&&error.definitive&&pending===submission)pending=null;publish({...state,uncertain:Boolean(pending),error:error instanceof Error?error.message:'request_failed'});}throw error;
  }finally{if(current()){operation=null;publish({...state,busy:false});}}
 };
 const select=async(nextSnapshotId:string,nextAnalysisId?:string)=>{
  if(snapshotId===nextSnapshotId&&analysisId===nextAnalysisId){
   if(state.view)return;
   // The same exact selection shares readiness, rather than mistaking an
   // in-flight read for a loaded view. Abort/disposal releases every waiter.
   const shared=read;
   if(shared){
    await shared.done;
    if(!owns(shared.owner)||snapshotId!==nextSnapshotId||analysisId!==nextAnalysisId)throw new Error('selection_superseded');
    if(state.view)return;
    throw new Error(state.error||'analysis_unavailable');
   }
  }
  // Commands retain their exact retry intent within this credential even when private navigation changes.
  const previous=state.view?{snapshotId,analysisId,state}:priorSelection;
  interrupt();snapshotId=nextSnapshotId;analysisId=nextAnalysisId;priorSelection=previous;const selection=owner();
  publish({...empty(),authenticated:Boolean(token),uncertain:Boolean(pending)});
  try{if(token&&snapshotId)await refresh(selection);if(owns(selection))priorSelection=null;}catch(error){
   if(owns(selection)){interrupt();snapshotId=previous?.snapshotId??'';analysisId=previous?.analysisId;priorSelection=null;publish(previous?{...previous.state,reading:false,sourceBusy:false,busy:false,error:error instanceof Error?error.message:'analysis_unavailable'}:{...empty(),error:error instanceof Error?error.message:'analysis_unavailable'});}
   throw error;
  }
 };
 return {
  getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener);},
  login:async(value:string=localOwnerSession,nextSnapshotId=snapshotId)=>{interrupt();priorSelection=null;token=value.trim();snapshotId=nextSnapshotId;analysisId=undefined;pending=null;disposed=false;publish(empty());if(token&&snapshotId)await refresh(owner());},
  logout:()=>{interrupt();priorSelection=null;token='';pending=null;publish(empty());},select,
  refresh:()=>refresh(owner()),send,captureAnalysisId,
  requestContext:(worktree:string,sourceProject:string,context:Pick<Extract<AnalysisCommand,{type:'RequestAnalysis'}>,'contextFilesPerSide'|'priorityPaths'>={})=>send({type:'RequestAnalysis',reviewId,snapshotId,expectedAnalysisGeneration:state.view?.analysisGeneration??0,...(worktree.trim()?{worktree:worktree.trim()}:{}),...(sourceProject.trim()?{sourceProject:sourceProject.trim()}:{}),...(context.contextFilesPerSide===undefined?{}:{contextFilesPerSide:context.contextFilesPerSide}),...(context.priorityPaths===undefined?{}:{priorityPaths:structuredClone(context.priorityPaths)})}),
  chooseDeclarations:(declarationIds:string[])=>{
   const preparation=state.view?.preparation,job=state.view?.jobs.find(job=>job.jobId===preparation?.jobId);
   if(!job?.corpusId||!job.inventoryId)throw new Error('inventory_unavailable');
   return send({type:'SelectAnalysisDeclarations',jobId:job.jobId,expectedJobRevision:job.jobRevision,corpusId:job.corpusId,inventoryId:job.inventoryId,declarationIds});
  },
  cancel:(job:AnalysisJobView)=>send({type:'CancelAnalysis',jobId:job.jobId,expectedJobRevision:job.jobRevision}),
  clarify:(primary:SemanticAnchor,text:string,kind:'interpretation'|'question'|'correction',evidence:SemanticAnchor[],clarificationId?:string,supersedes?:string)=>{
   const view=state.view;if(!view?.analysis)throw new Error('analysis_unavailable');
   return send({type:'PutGraphClarification',reviewId,snapshotId,analysisId:view.analysis.analysisId,expectedGraphRevision:view.graphRevision,primary,text,kind,evidence,...(clarificationId?{clarificationId}:{}),...(supersedes?{supersedes}:{})});
  },
  retry:async()=>{if(!pending)throw new Error('invalid_request');const {commandId,...intent}=pending.command;return send(intent as Intent);},
  focus:(id:string)=>{publish({...state,focus:id});void warm(owner());},
  openSource:async(anchor:SemanticAnchor,navigation:{intent?:'inspect'|'restore';signal?:AbortSignal}={})=>{
   if(navigation.signal?.aborted)throw new Error('selection_superseded');
   if(!analysisId&&captureAnalysisId()){analysisId=captureAnalysisId()!;abortRead();publish({...state,reading:false});}
   const o=owner(),corpus=state.view?.corpus;if(!corpus||anchor.snapshotId!==snapshotId)throw new Error('source_unavailable');
   sourceRead?.controller.abort();const op={owner:o,controller:new AbortController()};sourceRead=op;
   const cancel=()=>{op.controller.abort();if(sourceRead===op){sourceRead=null;if(owns(o))publish({...state,sourceBusy:false});}};navigation.signal?.addEventListener('abort',cancel,{once:true});
   publish({...state,sourceBusy:true,sourceNavigation:navigation.intent??'inspect',error:''});
   try{const source=await request(o,'/api/analysis/source',sourceQuery(o,corpus.corpusId,anchor),op.controller.signal) as SemanticSource;
    if(owns(o)&&sourceRead===op&&!op.controller.signal.aborted)publish({...state,source,sourceAnchor:anchor,snippets:{...state.snippets,[semanticSourceKey(anchor)]:source}});
   }catch(error){if(owns(o)&&sourceRead===op&&!op.controller.signal.aborted)publish({...state,error:error instanceof Error?error.message:'source_unavailable'});
   }finally{navigation.signal?.removeEventListener('abort',cancel);if(sourceRead===op){sourceRead=null;if(owns(o))publish({...state,sourceBusy:false});}}
  },
  closeSource:()=>{sourceRead?.controller.abort();sourceRead=null;publish({...state,source:null,sourceAnchor:null,sourceBusy:false});},
  connect:()=>{
   const owned={};connection=owned;disposed=false;
   const route=registry.register('semantic-committed-to-authorized-view',reviewId,()=>connection===owned&&Boolean(token)&&Boolean(snapshotId)&&!state.busy&&!state.sourceBusy,()=>{void refresh(owner(),'poll').catch(()=>{});});
   const timer=setInterval(()=>route.emit(),600);route.emit();let active=true;
   return()=>{if(!active)return;active=false;clearInterval(timer);route.dispose();if(connection===owned){connection=null;interrupt();disposed=true;publish({...state,busy:false,reading:false,sourceBusy:false,uncertain:Boolean(pending)});}};
  },
  diagnostics:()=>registry.diagnostics()
 };
};
export type AnalysisBridge=ReturnType<typeof createAnalysisBridge>;
