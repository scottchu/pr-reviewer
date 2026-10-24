import {accessHeaders} from './local-access.ts';
import {validateAnchor,projectGraph,graphFiles} from '../domain/public.ts';
import type {Anchor} from '../domain/public.ts';
import type {PrivateSession,QuestionDraft,GraphFrames,StoryReturnFrame,PrivateStoryView} from './private-session.ts';
import {createRegistry} from '../integration/registry.ts';
import type {Snapshot,StoryContent,StoryView,StoryContextView,StoryReference,SemanticSource} from '../domain/public.ts';
import type {AnalysisBridge} from './analysis.ts';
type Step=StoryContent['steps'][number];
type Chapter=StoryContent['chapters'][number];
type SourceReference=Extract<StoryReference,{type:'snapshot_source'|'semantic_source'}>;
export type StorySemanticPort=Pick<AnalysisBridge,'select'|'focus'|'getSnapshot'> & Partial<Pick<AnalysisBridge,'openSource'|'closeSource'|'refresh'>>;
export type StoryClock={now:()=>number;every:(callback:()=>void,period:number)=>()=>void};
type Cursor=Readonly<{versionId:string;chapterId:string;stepId:string;index:number}>;
export type StoryState=Readonly<{
 reviewId:string;snapshotId:string|null;snapshot:Snapshot|null;view:StoryView|null;context:StoryContextView|null;
 cursor:Cursor|null;focusRevision:number;mode:'paused'|'playing'|'ended'|'exploring';elapsedMs:number;surface:'flow'|'diff';hidden:boolean;reducedMotion:boolean;
 authenticated:boolean;reading:boolean;contextReading:boolean;error:string;focusError:string;evidence:StoryReference|null;evidenceText:string;evidenceBusy:boolean;
 drafts:readonly QuestionDraft[];activeDraftId:string;returnFrame:StoryReturnFrame|null;maps:GraphFrames;mapRestoreId:number;pageScroll:number;viewRecoveryMessage:string;questionLocked:boolean;
 semanticSources:Readonly<Record<string,SemanticSource>>;position:Readonly<{x:number;y:number}>;viewport:Readonly<{width:number;height:number}>;playerSize:Readonly<{width:number;height:number}>;
}>;
export type StoryIntent=
 |{type:'replay'}|{type:'pause';reason:string}|{type:'previous'}|{type:'next'}|{type:'chapter';chapterId:string}|{type:'tick';elapsedMs:number}
 |{type:'surface';surface:'flow'|'diff'}|{type:'visibility';hidden:boolean}|{type:'reducedMotion';value:boolean}
 |{type:'movePlayer';x:number;y:number}|{type:'resizePlayer';viewport:{width:number;height:number};size:{width:number;height:number}}|{type:'resetPlayer'};
export type StoryExcerpt=Readonly<{reference:SourceReference;coordinates:'snapshot LF lines'|'semantic UTF-16 offsets';text:string;unavailable:boolean}>;
export type StoryGraphFocus=Readonly<{intentId:string;fileKey:string;hunkId?:string}>;
export type StoryProjection=Readonly<{chapter:Chapter;step:Step;claims:StoryContent['claims'];index:number;total:number;comparisonKey:string|undefined;graphFocus:StoryGraphFocus|undefined;sources:StoryExcerpt[]}>;
const ordered=(story:StoryContent)=>story.chapters.flatMap(chapter=>chapter.stepIds.flatMap(id=>{const step=story.steps.find(item=>item.id===id);return step?[{chapter,step}]:[];}));
const cursorAt=(view:StoryView|null,index:number):Cursor|null=>{
 const version=view?.version;if(!version)return null;const item=ordered(version.story)[index];
 return item?{versionId:version.versionId,chapterId:item.chapter.id,stepId:item.step.id,index}:null;
};
const move=(state:StoryState,index:number):StoryState=>{
 const total=state.view?.version?ordered(state.view.version.story).length:0;
 return {...state,cursor:cursorAt(state.view,Math.max(0,Math.min(total-1,index))),focusRevision:state.focusRevision+1,mode:'paused',elapsedMs:0,evidence:null,evidenceText:'',evidenceBusy:false};
};
const clamp=(state:StoryState,x:number,y:number)=>{
 const horizontal=Math.max(0,(state.viewport.width-state.playerSize.width)/2-8),vertical=Math.max(0,state.viewport.height-state.playerSize.height-16);
 return {x:Math.max(-horizontal,Math.min(horizontal,Number.isFinite(x)?x:0)),y:Math.max(-vertical,Math.min(0,Number.isFinite(y)?y:0))};
};
export const storyTransition=(state:StoryState,intent:StoryIntent):StoryState=>{
 switch(intent.type){
  case 'replay':return state.cursor&&!state.hidden?{...state,mode:'playing',elapsedMs:0,focusRevision:state.focusRevision+1}:state;
  case 'pause':return state.mode==='playing'?{...state,mode:'paused'}:state;
  case 'previous':return move(state,(state.cursor?.index??0)-1);
  case 'next':return move(state,(state.cursor?.index??0)+1);
  case 'chapter':{const story=state.view?.version?.story;if(!story)return state;const index=ordered(story).findIndex(item=>item.chapter.id===intent.chapterId);return index<0?state:move(state,index);}
  case 'tick':{
   if(state.mode!=='playing'||state.hidden||!state.cursor||!Number.isFinite(intent.elapsedMs)||intent.elapsedMs<=0)return state;
   const total=ordered(state.view!.version!.story).length,elapsed=state.elapsedMs+intent.elapsedMs,advance=Math.floor(elapsed/8000),index=Math.min(total-1,state.cursor.index+advance);
   const ended=state.cursor.index+advance>=total;
   return {...state,cursor:cursorAt(state.view,index),focusRevision:state.focusRevision+(advance?1:0),elapsedMs:ended?8000:elapsed%8000,mode:ended?'ended':'playing',...(advance?{evidence:null,evidenceText:'',evidenceBusy:false}:{})};
  }
  case 'surface':return {...state,surface:intent.surface,mode:state.mode==='playing'?'paused':state.mode};
  case 'visibility':return {...state,hidden:intent.hidden,mode:intent.hidden&&state.mode==='playing'?'paused':state.mode};
  case 'reducedMotion':return {...state,reducedMotion:intent.value,mode:state.mode==='playing'?'paused':state.mode};
  case 'movePlayer':return {...state,position:clamp(state,intent.x,intent.y),mode:state.mode==='playing'?'paused':state.mode};
  case 'resizePlayer':{const next={...state,viewport:intent.viewport,playerSize:intent.size};return {...next,position:clamp(next,state.position.x,state.position.y)};}
  case 'resetPlayer':return {...state,position:{x:0,y:0},mode:state.mode==='playing'?'paused':state.mode};
 }
};
const sourceKey=(reference:SourceReference)=>JSON.stringify(reference.type==='snapshot_source'?['snapshot',reference.anchor.side,reference.anchor.path,reference.contentHash]:[reference.corpusId,reference.anchor.side,reference.anchor.path,reference.anchor.contentHash]);
const excerpt=(state:StoryState,reference:SourceReference):StoryExcerpt=>{
 if(reference.type==='snapshot_source'){
  const anchor=reference.anchor,source=state.snapshot?.sources.find(source=>anchor.snapshotId===state.snapshotId&&source.side===anchor.side&&source.path===anchor.path&&source.hash===reference.contentHash);
  const valid=source&&anchor.startLine>=1&&anchor.endLine>=anchor.startLine&&anchor.endLine<=source.lineCount;
  return {reference,coordinates:'snapshot LF lines',text:valid?source.content.split('\n').slice(anchor.startLine-1,anchor.endLine).join('\n'):'Exact snapshot source unavailable.',unavailable:!valid};
 }
 const source=state.semanticSources[sourceKey(reference)],anchor=reference.anchor;
 const valid=source&&source.snapshotId===anchor.snapshotId&&source.side===anchor.side&&source.path===anchor.path&&source.contentHash===anchor.contentHash&&anchor.start>=0&&anchor.end>anchor.start&&anchor.end<=source.content.length;
 return {reference,coordinates:'semantic UTF-16 offsets',text:valid?source.content.slice(anchor.start,anchor.end):'Exact semantic source unavailable or loading.',unavailable:!valid};
};
export const storyProjection=(state:StoryState):StoryProjection|null=>{
 const version=state.view?.version,cursor=state.cursor;if(!version||!cursor)return null;
 const steps=ordered(version.story),item=steps[cursor.index];if(!item)return null;
 const focus=item.step.focus,refs=focus.type==='sources'||focus.type==='semantic'?focus.sources:[];
 const key=focus.type==='sources'||focus.type==='structural'?focus.fileKey:undefined;
 return {chapter:item.chapter,step:item.step,claims:item.step.claimIds.flatMap(id=>{const claim=version.story.claims.find(claim=>claim.id===id);return claim?[claim]:[];}),index:cursor.index,total:steps.length,comparisonKey:key,graphFocus:key?{intentId:`${version.versionId}:${state.focusRevision}`,fileKey:key,...(focus.type==='structural'&&focus.hunkId?{hunkId:focus.hunkId}:{})}:undefined,sources:refs.map(ref=>excerpt(state,ref))};
};
export const storyPresentation=(state:StoryState)=>{
 const projection=storyProjection(state),version=state.view?.version;if(!projection||!version)return null;
 const shown=new Set(projection.claims.map(claim=>claim.id));
 const chapter=projection.chapter,detailIds=[{label:'Why',id:chapter.why},{label:'What changes',id:chapter.what},{label:'How it works',id:chapter.how},{label:'Example input',id:chapter.example.input},{label:'Example before',id:chapter.example.before},{label:'Example after',id:chapter.example.after}];
 const details=detailIds.flatMap(({label,id})=>{if(shown.has(id))return [];shown.add(id);const claim=version.story.claims.find(claim=>claim.id===id);return claim?[{label,claim}]:[];});
 const files=state.snapshot?graphFiles(state.snapshot):[];
 const rows=version.story.scope.map(account=>{const file=files.find(file=>file.key===account.fileKey);return {account,label:!file?'Retained file identity unavailable':file.oldPath&&file.newPath&&file.oldPath!==file.newPath?`${file.oldPath} → ${file.newPath}`:file.newPath??file.oldPath??'Metadata',status:file?.status??'unavailable'};});
 const groups=[...version.story.chapters.map(chapter=>({id:`chapter:${chapter.id}`,title:chapter.title,meaning:version.story.claims.find(claim=>claim.id===chapter.what)??null,files:rows.filter(row=>row.account.type==='explained'&&row.account.chapterId===chapter.id)})),{id:'unexplained',title:'Unexplained',meaning:null,files:rows.filter(row=>row.account.type==='unexplained')}].filter(group=>group.files.length||group.id==='unexplained');
 return {details,groups};
};
export type QuestionEvidenceIntent=Readonly<{kind:'ready';evidence:Extract<StoryReference,{type:'snapshot_source'}>;draft:QuestionDraft;anchor:Anchor;confirmationRequired:boolean;mismatch:boolean}>;
export const questionEvidenceProjection=(state:StoryState):QuestionEvidenceIntent|Readonly<{kind:'blocked'|'unavailable';reason:string}>=>{
 const draft=state.drafts.find(draft=>draft.id===state.activeDraftId),reference=state.evidence;
 if(state.questionLocked)return {kind:'blocked',reason:'Reconcile the unresolved question before changing its anchor.'};
 if(draft?.submitted)return {kind:'blocked',reason:'This draft was submitted. Start a new question explicitly before changing its anchor.'};
 if(!state.authenticated||!draft||!state.snapshot||reference?.type!=='snapshot_source')return {kind:'unavailable',reason:'This evidence has no question-eligible retained snapshot range. Inspection leaves your question unchanged.'};
 if(reference.anchor.snapshotId!==state.snapshotId||state.snapshot.snapshotId!==state.snapshotId)return {kind:'unavailable',reason:'Inspected evidence belongs to a different snapshot. Return to its review snapshot explicitly; this action cannot navigate or retarget across snapshots.'};
 const source=state.snapshot.sources.find(source=>source.side===reference.anchor.side&&source.path===reference.anchor.path&&source.hash===reference.contentHash);
 if(!source||!validateAnchor(state.snapshot.snapshotId,state.snapshot.sources,reference.anchor))return {kind:'unavailable',reason:'The exact retained snapshot evidence is unavailable. No question anchor has been substituted.'};
 return {kind:'ready',evidence:reference,draft,anchor:reference.anchor,confirmationRequired:Boolean(draft.text.trim()),mismatch:JSON.stringify(draft.anchor)!==JSON.stringify(reference.anchor)};
};
const freeze=<T>(value:T):T=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item);}return value;};
const empty=(reviewId:string):StoryState=>({reviewId,snapshotId:null,snapshot:null,view:null,context:null,cursor:null,focusRevision:0,mode:'paused',elapsedMs:0,surface:'flow',hidden:false,reducedMotion:false,authenticated:false,reading:false,contextReading:false,error:'',focusError:'',evidence:null,evidenceText:'',evidenceBusy:false,drafts:[],activeDraftId:'',returnFrame:null,maps:{structural:null,semantic:null},mapRestoreId:0,pageScroll:0,viewRecoveryMessage:'',questionLocked:false,semanticSources:{},position:{x:0,y:0},viewport:{width:1024,height:768},playerSize:{width:500,height:44}});
const defaultClock:StoryClock={now:()=>performance.now(),every:(callback,period)=>{const timer=setInterval(callback,period);return()=>clearInterval(timer);}};
export const createStoryBridge=(reviewId:string,options:{clock?:StoryClock;semantic?:StorySemanticPort;session?:PrivateSession;selectSnapshot?:(snapshotId:string)=>Promise<Snapshot>;readSnapshot?:(snapshotId:string,signal?:AbortSignal)=>Promise<Snapshot>}={})=>{
 const clock=options.clock??defaultClock,registry=createRegistry(),listeners=new Set<()=>void>();
 let state=freeze(empty(reviewId)),token='',scope='',privateIntent=0,hydrating=false,viewCheckpointBlocked=false,generation=0,versionId:string|undefined,connection:object|null=null,disposed=false;
 let recoveryNotice='';
 let contextTarget:number|'current'|null=null;
 let read:AbortController|null=null,contextRead:AbortController|null=null,evidenceRead:AbortController|null=null,focusSerial=0,stopClock:(()=>void)|null=null,lastTick=0,disposeConnection:(()=>void)|null=null;
 let focusRoute:ReturnType<typeof registry.register>|null=null,pollRoute:ReturnType<typeof registry.register>|null=null;
 const readControllers=new Set<AbortController>();
 let restoreOperation:{controller:AbortController}|null=null;
 const invalidatePrivateIntent=()=>{privateIntent++;restoreOperation?.controller.abort();restoreOperation=null;return privateIntent;};
 const awaitRead=<T,>(reading:Promise<T>,signal?:AbortSignal):Promise<T>=>{if(!signal)return reading;return new Promise<T>((resolve,reject)=>{const abort=()=>reject(new Error('selection_superseded'));if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});void reading.then(value=>{signal.removeEventListener('abort',abort);if(signal.aborted)abort();else resolve(value);},error=>{signal.removeEventListener('abort',abort);reject(error);});});};
 const publish=(next:StoryState)=>{if(Object.keys(next).every(key=>Object.is(next[key as keyof StoryState],state[key as keyof StoryState])))return;state=freeze(next);syncClock();checkpoint();for(const listener of listeners)listener();};
 const activeDraft=()=>state.drafts.find(draft=>draft.id===state.activeDraftId)??state.drafts[0]??null;
 const makeDraft=(snapshot:Snapshot):QuestionDraft=>{const source=snapshot.sources.find(source=>source.side==='head'&&source.lineCount>0)??snapshot.sources.find(source=>source.lineCount>0);return {id:crypto.randomUUID(),anchor:source?{snapshotId:snapshot.snapshotId,side:source.side,path:source.path,startLine:1,endLine:1}:null,text:'',submitted:false};};
 const privateView=():PrivateStoryView|null=>state.snapshotId&&state.drafts.length?{reviewId,snapshotId:state.snapshotId,versionId:state.view?.version?.versionId??null,cursor:state.cursor,elapsedMs:state.elapsedMs,surface:state.surface,position:state.position,pageScroll:state.pageScroll,maps:state.maps,activeDraftId:state.activeDraftId,drafts:[...state.drafts],returnFrame:state.returnFrame}:null;
 const checkpoint=()=>{const value=privateView();if(!options.session||!scope||hydrating||viewCheckpointBlocked||!value)return;const result=options.session.saveView(scope,value);const message=result.message||recoveryNotice;if(message!==state.viewRecoveryMessage)state=freeze({...state,viewRecoveryMessage:message});};
 const replaceDraft=(draft:QuestionDraft)=>publish({...state,drafts:state.drafts.map(current=>current.id===draft.id?draft:current)});
 const assertEditable=()=>{if(state.questionLocked)throw new Error('submission_pending: reconcile the unresolved question first');};
 const assertCanNavigate=()=>{assertEditable();if(activeDraft()?.text.trim())throw new Error('draft_held: keep or clear the active draft before changing its source');};
 const validateMap=(snapshot:Snapshot,maps:GraphFrames)=>{const frame=maps.structural;if(!frame)return;const graph=projectGraph(snapshot),file=graph.files.find(file=>file.key===frame.fileKey);if(!file||frame.spans&&frame.spanId&&!graph.nodes.some(node=>node.kind==='hunk'&&node.id===frame.spanId&&(node.fileKey===frame.fileKey||node.path===file.oldPath||node.path===file.newPath)))throw new Error('saved_map_unavailable');};
 const restorePrivate=async(value:PrivateStoryView,expected:number)=>{
  const capturedToken=token,validation=new AbortController();readControllers.add(validation);try{
  if(!state.snapshot||value.reviewId!==reviewId||value.snapshotId!==state.snapshotId)throw new Error('saved_view_source_unavailable: open its retained source explicitly');
  const snapshots=new Map<string,Snapshot>([[state.snapshot.snapshotId,state.snapshot]]);
  for(const draft of value.drafts){if(!draft.anchor)continue;let snapshot=snapshots.get(draft.anchor.snapshotId);if(!snapshot){if(!options.readSnapshot)throw new Error('saved_draft_source_unavailable');snapshot=await options.readSnapshot(draft.anchor.snapshotId,validation.signal);snapshots.set(snapshot.snapshotId,snapshot);}if(!validateAnchor(snapshot.snapshotId,snapshot.sources,draft.anchor))throw new Error('saved_draft_anchor_unavailable');}
  if(value.versionId!==state.view?.version?.versionId){if(value.versionId)await refresh('explicit',value.versionId,true);else if(state.view?.version)throw new Error('saved_story_unavailable');}
  if(expected!==generation)throw new Error('selection_superseded');
  if(value.cursor){const exact=cursorAt(state.view,value.cursor.index);if(!exact||JSON.stringify(exact)!==JSON.stringify(value.cursor))throw new Error('saved_story_cursor_unavailable');}
  if(value.returnFrame){const frame=value.returnFrame;if(!value.drafts.some(draft=>draft.id===frame.originalDraftId))throw new Error('saved_return_draft_unavailable');if(!snapshots.has(frame.snapshotId)&&options.readSnapshot)snapshots.set(frame.snapshotId,await options.readSnapshot(frame.snapshotId,validation.signal));if(!snapshots.has(frame.snapshotId))throw new Error('saved_return_source_unavailable');if(frame.versionId){const view=await request(capturedToken,`/api/story?${new URLSearchParams({reviewId,snapshotId:frame.snapshotId,versionId:frame.versionId})}`,validation.signal) as StoryView;if(!view.version||view.version.versionId!==frame.versionId||frame.cursor&&cursorAt(view,frame.cursor.index)?.stepId!==frame.cursor.stepId)throw new Error('saved_return_story_unavailable');}}
  if(expected!==generation)throw new Error('selection_superseded');
  validateMap(state.snapshot,value.maps);
  const recovered=await restoreSemantic(value.maps,value.snapshotId,()=>expected===generation&&!disposed&&capturedToken===token,validation.signal);
  if(expected!==generation||disposed||capturedToken!==token)throw new Error('selection_superseded');
  recoveryNotice=recovered.message;
  publish({...state,viewRecoveryMessage:recoveryNotice,drafts:value.drafts,activeDraftId:value.activeDraftId,returnFrame:value.returnFrame,maps:recovered.maps,mapRestoreId:state.mapRestoreId+1,pageScroll:value.pageScroll,cursor:value.cursor,elapsedMs:value.elapsedMs,surface:value.surface,position:clamp(state,value.position.x,value.position.y),mode:value.returnFrame?'exploring':'paused',focusRevision:state.focusRevision+1});
  }finally{readControllers.delete(validation);}
 };
 const restoreSemantic=async(maps:GraphFrames,snapshotId:string,owns:()=>boolean,signal?:AbortSignal)=>{
  let frame=maps.semantic;if(!frame)return {maps,message:''};if(!options.semantic)throw new Error('analysis_unavailable');
  const check=()=>{if(!owns())throw new Error('selection_superseded');};check();
  let observed=options.semantic.getSnapshot().view,message='',normalizedId:string|null=null;
  const isUnavailable=()=>Boolean(frame?.analysisId&&observed?.reviewId===reviewId&&observed.snapshotId===snapshotId&&observed.selectedAnalysisId===null&&observed.analysis?.status==='unavailable'&&observed.analysis.analysisId===frame.analysisId&&observed.jobs.some(job=>job.analysisId===frame!.analysisId&&job.state==='unavailable'));
  if(isUnavailable()){
   // Retained diagnostics identify a recovery candidate, never current authority.
   // A failed/superseded read must leave the private frame and drafts untouched.
   if(!options.semantic.refresh)throw new Error('analysis_revalidation_unavailable');
   observed=await awaitRead(options.semantic.refresh(),signal)??null;check();
   if(!isUnavailable())throw new Error('analysis_record_unavailable');
   normalizedId=frame.analysisId;frame={...frame,analysisId:null};maps={...maps,semantic:frame};message='Saved unavailable analysis was not admitted; restored its diagnostic view without a historical analysis pin.';
  }
  await awaitRead(options.semantic.select(snapshotId,frame.analysisId??undefined),signal);check();
  const loaded=options.semantic.getSnapshot();if(normalizedId&&(loaded.view?.snapshotId!==snapshotId||loaded.view.selectedAnalysisId!==null||loaded.view.analysis?.status!=='unavailable'||loaded.view.analysis.analysisId!==normalizedId||!loaded.view.jobs.some(job=>job.analysisId===normalizedId&&job.state==='unavailable')))throw new Error('analysis_record_unavailable');if(frame.analysisId&&loaded.view?.analysis?.analysisId!==frame.analysisId)throw new Error('analysis_record_unavailable');
  if(frame.focus&&(loaded.view?.analysis?.status!=='analyzed'||!loaded.view.analysis.nodes.some(node=>node.id===frame.focus)))throw new Error('analysis_focus_unavailable');
  if(frame.corpusId&&loaded.view?.corpus?.corpusId!==frame.corpusId)throw new Error('source_corpus_unavailable');
  if(frame.sourceAnchor){if(!options.semantic.openSource)throw new Error('source_unavailable');await awaitRead(options.semantic.openSource(frame.sourceAnchor,{intent:'restore',...(signal?{signal}:{})}),signal);check();const selected=options.semantic.getSnapshot();if(JSON.stringify(selected.sourceAnchor)!==JSON.stringify(frame.sourceAnchor)||!selected.source||selected.source.corpusId!==frame.corpusId||selected.source.contentHash!==frame.sourceAnchor.contentHash||selected.source.snapshotId!==snapshotId||selected.source.side!==frame.sourceAnchor.side||selected.source.path!==frame.sourceAnchor.path||frame.sourceAnchor.snapshotId!==snapshotId||frame.sourceAnchor.end<=frame.sourceAnchor.start||frame.sourceAnchor.end>selected.source.content.length)throw new Error(selected.error||'source_unavailable');}
  else options.semantic.closeSource?.();check();options.semantic.focus(frame.focus);return {maps,message};
 };
 const stageEvidence=async(target:StoryState,reference:StoryReference,captured:string,owns:()=>boolean,signal:AbortSignal):Promise<StoryState>=>{
  let text='',sources=target.semanticSources;const check=()=>{if(!owns())throw new Error('selection_superseded');};check();
  if(reference.type==='snapshot_source'||reference.type==='semantic_source'){
   if(reference.type==='semantic_source'&&!sources[sourceKey(reference)]){const anchor=reference.anchor,params=new URLSearchParams({reviewId,snapshotId:anchor.snapshotId,corpusId:reference.corpusId,side:anchor.side,path:anchor.path,contentHash:anchor.contentHash}),source=await request(captured,'/api/analysis/source',signal,Object.fromEntries(params)) as SemanticSource;check();if(source.snapshotId!==anchor.snapshotId||source.corpusId!==reference.corpusId||source.side!==anchor.side||source.path!==anchor.path||source.contentHash!==anchor.contentHash)throw new Error('source_unavailable');sources={...sources,[sourceKey(reference)]:source};}
   const selected=excerpt({...target,semanticSources:sources},reference);if(selected.unavailable)throw new Error(selected.text);text=selected.text;
  }else if(reference.type==='capture'){const params=new URLSearchParams({reviewId,snapshotId:target.snapshotId??'',contextRevision:String(target.view?.version?.contextRevision??0),captureId:reference.captureId}),context=await request(captured,`/api/story/context?${params}`,signal) as StoryContextView;check();const capture=context.captures.find(capture=>capture.captureId===reference.captureId&&capture.contentHash===reference.contentHash);if(!capture)throw new Error('Exact supplied capture unavailable.');text=reference.start===undefined?capture.text:capture.text.slice(reference.start,reference.end);}
  else if(reference.type==='metadata')text=String(target.snapshot?.[reference.field]??'Retained metadata unavailable.');
  else if(reference.type==='clarification')text=`Attributed clarification ${reference.clarificationId}, revision ${reference.revision}, analysis ${reference.analysisId}. Open its retained analysis for the attributed text.`;
  else text=`Static ${reference.type==='static_node'?'node':'edge'} ${reference.factId}, analysis ${reference.analysisId}. Static support is not execution evidence.`;
  check();return {...target,evidence:reference,evidenceText:text,evidenceBusy:false,semanticSources:sources};
 };
 const syncClock=()=>{
  const active=Boolean(connection)&&!disposed&&state.mode==='playing'&&!state.hidden&&Boolean(token);
  if(!active){stopClock?.();stopClock=null;return;}if(stopClock)return;
  lastTick=clock.now();stopClock=clock.every(()=>{const now=clock.now(),elapsedMs=Math.max(0,now-lastTick);lastTick=now;const previous=state.cursor?.stepId;publish(storyTransition(state,{type:'tick',elapsedMs}));if(previous!==state.cursor?.stepId)focusRoute?.emit();},250);
 };
 const interrupt=()=>{generation++;focusSerial++;invalidatePrivateIntent();for(const controller of readControllers)controller.abort();readControllers.clear();read?.abort();read=null;contextRead?.abort();contextRead=null;evidenceRead?.abort();evidenceRead=null;stopClock?.();stopClock=null;};
 const request=async(capturedToken:string,path:string,signal:AbortSignal,query?:Record<string,string>)=>{
  const controller=new AbortController();readControllers.add(controller);const ownedSignal=AbortSignal.any([signal,controller.signal]);
  try{if(ownedSignal.aborted)throw new Error('selection_superseded');const response=await awaitRead(fetch(path,{headers:{...accessHeaders(capturedToken),...(query?{'Content-Type':'application/json'}:{})},signal:ownedSignal,...(query?{method:'POST',body:JSON.stringify(query)}:{})}),ownedSignal);const body=await response.json() as unknown;if(ownedSignal.aborted)throw new Error('selection_superseded');if(!response.ok)throw new Error(String((body as {error?:string}).error??'request_failed'));return body;}finally{readControllers.delete(controller);}
 };
 const readContext=async(contextRevision?:number)=>{
  if(disposed||!token||!state.snapshotId)return;
  contextTarget=contextRevision??'current';contextRead?.abort();const controller=new AbortController();contextRead=controller;
  const expected=generation,capturedToken=token,snapshotId=state.snapshotId,selectedVersion=state.view?.version?.versionId;
  const owns=()=>!disposed&&generation===expected&&token===capturedToken&&state.snapshotId===snapshotId&&state.view?.version?.versionId===selectedVersion&&contextRead===controller&&!controller.signal.aborted;
  publish({...state,contextReading:true});
  try{
   const params=new URLSearchParams({reviewId,snapshotId,...(contextRevision===undefined?{}:{contextRevision:String(contextRevision)})});
   const context=await request(capturedToken,`/api/story/context?${params}`,controller.signal) as StoryContextView;
   if(owns()){
    if(context.reviewId!==reviewId||context.snapshotId!==snapshotId||context.selectedRevision!==(contextRevision??context.currentContextRevision))throw new Error('story_context_selection_mismatch');
    publish({...state,context,error:''});return context;
   }
  }catch(error){if(owns())publish({...state,mode:state.mode==='playing'?'paused':state.mode,error:error instanceof Error?error.message:'story_context_unavailable'});}
  finally{if(contextRead===controller){contextRead=null;if(expected===generation&&!disposed)publish({...state,contextReading:false});}}
 };
 const refresh=async(mode:'explicit'|'poll'='explicit',requestedVersionId:string|null=versionId??null,replace=false)=>{
  if(disposed||!token||!state.snapshotId||(mode==='poll'&&(read||state.evidenceBusy)))return;
  read?.abort();const controller=new AbortController();read=controller;const expected=generation,capturedToken=token,snapshotId=state.snapshotId;
  const owns=()=>!disposed&&generation===expected&&token===capturedToken&&state.snapshotId===snapshotId&&read===controller&&!controller.signal.aborted;
  publish({...state,reading:true});
  try{
   const query=new URLSearchParams({reviewId,snapshotId,...(requestedVersionId?{versionId:requestedVersionId}:{})});
   const view=await request(capturedToken,`/api/story?${query}`,controller.signal) as StoryView;
   if(!owns())return;
   if(view.reviewId!==reviewId||view.snapshotId!==snapshotId||(requestedVersionId&&view.version?.versionId!==requestedVersionId))throw new Error('story_selection_mismatch');
   const changed=replace||state.view?.version?.versionId!==view.version?.versionId;
   versionId=view.version?.versionId;
   publish({...state,view,authenticated:true,error:'',...(changed?{cursor:cursorAt(view,0),focusRevision:state.focusRevision+1,context:null,mode:state.returnFrame?'exploring' as const:'paused' as const,elapsedMs:0,evidence:null,evidenceText:'',evidenceBusy:false,semanticSources:{}}:{})});
   if(changed)focusRoute?.emit();
   if(changed)await readContext(view.version?.contextRevision??view.contextRevision);
   else if(!state.context&&!contextRead)await readContext(contextTarget==='current'?undefined:contextTarget??view.version?.contextRevision??view.contextRevision);
   return view;
  }catch(error){if(owns())publish({...state,mode:state.mode==='playing'?'paused':state.mode,error:error instanceof Error?error.message:'request_failed'});}
  finally{if(read===controller){read=null;if(generation===expected&&!disposed)publish({...state,reading:false});}}
 };
 const hydrateSources=async(sources:readonly SourceReference[],controller:AbortController,owns:()=>boolean,capturedToken:string)=>{
  for(const ref of sources){if(!owns())return;if(ref.type!=='semantic_source'||state.semanticSources[sourceKey(ref)])continue;
   const params=new URLSearchParams({reviewId,snapshotId:ref.anchor.snapshotId,corpusId:ref.corpusId,side:ref.anchor.side,path:ref.anchor.path,contentHash:ref.anchor.contentHash});
   const source=await request(capturedToken,'/api/analysis/source',controller.signal,Object.fromEntries(params)) as SemanticSource;
   if(owns()){
    if(source.snapshotId!==ref.anchor.snapshotId||source.path!==ref.anchor.path||source.side!==ref.anchor.side||source.contentHash!==ref.anchor.contentHash||source.corpusId!==ref.corpusId)throw new Error('story_source_selection_mismatch');
    publish({...state,semanticSources:{...state.semanticSources,[sourceKey(ref)]:source}});
   }
  }
 };
 const coordinate=async()=>{
  const projection=storyProjection(state),version=state.view?.version;if(!projection||!version||!token)return;
  const serial=++focusSerial,expected=generation,chosen=state.cursor?.stepId,capturedToken=token;
  evidenceRead?.abort();const controller=new AbortController();evidenceRead=controller;
  const owns=()=>Boolean(connection)&&!disposed&&expected===generation&&serial===focusSerial&&state.cursor?.stepId===chosen&&state.view?.version?.versionId===version.versionId&&!controller.signal.aborted;
  publish({...state,focusError:''});
  try{
   const focus=projection.step.focus;
   if(focus.type==='sources'||focus.type==='semantic')await hydrateSources(focus.sources,controller,owns,capturedToken);
   if(!owns())return;
   if(options.semantic&&version.story.analysisId){
    await options.semantic.select(version.snapshotId,version.story.analysisId);if(!owns())return;
    if(focus.type!=='semantic')return;
    const graph=options.semantic.getSnapshot().view?.analysis;
    if(!graph||graph.analysisId!==version.story.analysisId)throw new Error('Exact story static neighborhood unavailable.');
    const reference=focus.reference;
    const id=reference.type==='static_node'?reference.factId:graph.status==='analyzed'?graph.edges.find(edge=>edge.id===reference.factId)?.callee:undefined;
    if(!id)throw new Error('Exact story relationship unavailable.');options.semantic.focus(id);
   }
  }catch(error){if(owns())publish({...state,focusError:error instanceof Error?error.message:'story_focus_unavailable'});}
  finally{if(evidenceRead===controller)evidenceRead=null;}
 };
 const wireRoutes=()=>{
  pollRoute?.dispose();focusRoute?.dispose();pollRoute=null;focusRoute=null;if(!connection)return;
  const owned=connection,expected=generation,snapshotId=state.snapshotId;
  const authorized=()=>connection===owned&&generation===expected&&state.snapshotId===snapshotId&&Boolean(token)&&!disposed;
  const scope=JSON.stringify({reviewId,snapshotId,generation:expected});
  pollRoute=registry.register('story-committed-to-authorized-view',scope,()=>authorized()&&Boolean(state.snapshotId)&&!read&&!state.evidenceBusy,()=>{void refresh('poll');});
  focusRoute=registry.register('story-focus-to-coordinated-view',scope,()=>authorized()&&Boolean(state.cursor),()=>{void coordinate();});
 };
 const intent=(intent:StoryIntent)=>{if(intent.type!=='tick'&&intent.type!=='resizePlayer')invalidatePrivateIntent();if(state.mode==='exploring'&&['replay','previous','next','chapter'].includes(intent.type)){publish({...state,error:'resume_required: resume the saved story before story navigation'});return;}const previous=state.focusRevision;publish(storyTransition(state,intent));if(previous!==state.focusRevision){options.semantic?.closeSource?.();focusRoute?.emit();}};
 const select=async(snapshot:Snapshot)=>{
  if(state.snapshotId===snapshot.snapshotId)return;
  const draft=makeDraft(snapshot),retained=state.returnFrame?{drafts:state.drafts.map(item=>{if(item.id!==state.activeDraftId)return item;const {comparisonKey,...rest}=item;return {...rest,anchor:draft.anchor};}),activeDraftId:state.activeDraftId,returnFrame:state.returnFrame,mode:'exploring' as const}:null;interrupt();versionId=undefined;contextTarget=null;publish({...empty(reviewId),...(retained??{drafts:[draft],activeDraftId:draft.id}),questionLocked:state.questionLocked,snapshot:structuredClone(snapshot),snapshotId:snapshot.snapshotId,authenticated:Boolean(token),reducedMotion:state.reducedMotion,hidden:state.hidden,viewport:state.viewport,playerSize:state.playerSize});
  wireRoutes();if(token&&!disposed)await refresh();
 };
 const bridgeOpenEvidence=async(reference:StoryReference)=>{
   if(!token||!state.snapshotId||disposed)return;
   intent({type:'pause',reason:'evidence'});evidenceRead?.abort();const controller=new AbortController();evidenceRead=controller;const expected=generation,selectedVersion=state.view?.version,selectedStep=state.cursor?.stepId,capturedToken=token;
   const owns=()=>!disposed&&generation===expected&&state.cursor?.stepId===selectedStep&&state.view?.version?.versionId===selectedVersion?.versionId&&evidenceRead===controller&&!controller.signal.aborted;
   publish({...state,evidence:structuredClone(reference),evidenceText:'',evidenceBusy:true});
   try{
    let text='';
    if(reference.type==='snapshot_source'||reference.type==='semantic_source'){await hydrateSources([reference],controller,owns,capturedToken);if(!owns())return;text=excerpt(state,reference).text;}
    else if(reference.type==='capture'){
     const params=new URLSearchParams({reviewId,snapshotId:state.snapshotId??'',contextRevision:String(selectedVersion?.contextRevision??0),captureId:reference.captureId});
     const context=await request(capturedToken,`/api/story/context?${params}`,controller.signal) as StoryContextView;
     const capture=context.captures.find(capture=>capture.captureId===reference.captureId&&capture.contentHash===reference.contentHash);
     if(!capture)throw new Error('Exact supplied capture unavailable.');text=reference.start===undefined?capture.text:capture.text.slice(reference.start,reference.end);
    }else if(reference.type==='metadata')text=String(state.snapshot?.[reference.field]??'Retained metadata unavailable.');
    else if(reference.type==='clarification')text=`Attributed clarification ${reference.clarificationId}, revision ${reference.revision}, analysis ${reference.analysisId}. Open its retained analysis for the attributed text.`;
    else text=`Static ${reference.type==='static_node'?'node':'edge'} ${reference.factId}, analysis ${reference.analysisId}. Static support is not execution evidence.`;
    if(owns())publish({...state,evidenceText:text});
   }catch(error){if(owns())publish({...state,evidenceText:error instanceof Error?error.message:'Exact evidence unavailable.'});}
   finally{if(evidenceRead===controller){evidenceRead=null;if(owns())publish({...state,evidenceBusy:false});else if(expected===generation&&!disposed)publish({...state,evidenceBusy:false});}}
  };
 return {
  getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},intent,
  login:async(value:string,snapshot:Snapshot)=>{
   recoveryNotice='';
   interrupt();disposed=false;hydrating=true;viewCheckpointBlocked=false;scope='';token=value.trim();versionId=undefined;contextTarget=null;const draft=makeDraft(snapshot);publish({...empty(reviewId),drafts:[draft],activeDraftId:draft.id,questionLocked:state.questionLocked,snapshot:structuredClone(snapshot),snapshotId:snapshot.snapshotId,reducedMotion:state.reducedMotion,hidden:state.hidden,viewport:state.viewport,playerSize:state.playerSize});wireRoutes();const expected=generation;
   try{const view=token?await refresh():undefined;if(!view||expected!==generation)return;if(options.session){const nextScope=await options.session.scope(token);if(expected!==generation)return;scope=nextScope;const saved=options.session.readView(scope);if(saved.kind==='record'&&saved.record?.value){const value=saved.record.value;try{await restorePrivate({...value,drafts:value.drafts.map(draft=>saved.record!.submitted.includes(draft.id)?{...draft,text:'',submitted:true}:draft)},expected);if(saved.record.omitted.length)publish({...state,viewRecoveryMessage:'Oversize saved draft text is unavailable after reload.'});}catch(error){if(expected===generation){viewCheckpointBlocked=true;publish({...state,viewRecoveryMessage:error instanceof Error?error.message:'saved_view_unavailable'});}}}else if(saved.kind!=='none'&&saved.kind!=='record')publish({...state,viewRecoveryMessage:`view_${saved.kind}`});}}
   finally{if(expected===generation){hydrating=false;checkpoint();}}
  },
  logout:()=>{interrupt();recoveryNotice='';scope='';hydrating=false;token='';versionId=undefined;contextTarget=null;publish(empty(reviewId));wireRoutes();},select:async(snapshot:Snapshot)=>{assertCanNavigate();await select(snapshot);},refresh:()=>refresh(),
  activeDraft,getPrivateView:privateView,assertCanNavigate,
  resetPrivateView:()=>{assertEditable();recoveryNotice='';options.session?.clearView();viewCheckpointBlocked=false;publish({...state,viewRecoveryMessage:''});checkpoint();},
  setQuestionGuard:(locked:boolean)=>{if(locked)invalidatePrivateIntent();if(state.questionLocked!==locked)publish({...state,questionLocked:locked});},
  editDraft:(text:string)=>{invalidatePrivateIntent();assertEditable();const draft=activeDraft();if(!draft)return;if(draft.submitted){const next={...draft,id:crypto.randomUUID(),text,submitted:false};publish({...state,drafts:state.drafts.map(item=>item.id===draft.id?next:item),activeDraftId:next.id});}else replaceDraft({...draft,text});},
  selectSource:(anchor:Anchor,comparisonKey?:string)=>{invalidatePrivateIntent();assertEditable();const draft=activeDraft();if(!draft||!state.snapshot||!validateAnchor(state.snapshot.snapshotId,state.snapshot.sources,anchor))throw new Error('invalid_anchor');if(draft.text.trim()&&(JSON.stringify(anchor)!==JSON.stringify(draft.anchor)||comparisonKey!==draft.comparisonKey))throw new Error('draft_held: source selection is held while the active draft is nonempty');const {comparisonKey:old,...rest}=draft;replaceDraft({...rest,anchor:structuredClone(anchor),...(comparisonKey?{comparisonKey}:{})});intent({type:'pause',reason:'source'});},
  adoptEvidence:(proposal:QuestionEvidenceIntent,confirmed=false)=>{
   assertEditable();const current=questionEvidenceProjection(state);
   if(current.kind!=='ready')throw new Error(current.reason);
   if(JSON.stringify(current)!==JSON.stringify(proposal))throw new Error('evidence_question_superseded: inspect and confirm the current draft again');
   if(current.confirmationRequired&&!confirmed)throw new Error('anchor_confirmation_required');
   invalidatePrivateIntent();const {comparisonKey:old,...draft}=current.draft;replaceDraft({...draft,anchor:structuredClone(current.anchor)});intent({type:'pause',reason:'question'});
  },
  setQuestionRange:(patch:Partial<Pick<Anchor,'side'|'startLine'|'endLine'>>)=>{invalidatePrivateIntent();assertEditable();const draft=activeDraft();if(!draft?.anchor)return;replaceDraft({...draft,anchor:{...draft.anchor,...patch}});intent({type:'pause',reason:'question'});},
  setParentQuestion:(parentQuestionId?:string)=>{invalidatePrivateIntent();assertCanNavigate();const draft=activeDraft();if(!draft)return;const {parentQuestionId:previous,...rest}=draft;replaceDraft({...rest,...(parentQuestionId?{parentQuestionId}:{})});},
  confirmDraft:(draftId:string)=>{publish({...state,drafts:state.drafts.map(draft=>draft.id===draftId?{...draft,text:'',submitted:true}:draft)});},
  chooseDraft:async(draftId:string)=>{
   assertEditable();if(state.returnFrame)throw new Error('resume_required');const draft=state.drafts.find(draft=>draft.id===draftId);if(!draft)throw new Error('draft_unavailable');
   const captured=token;let serial=invalidatePrivateIntent(),expected=generation;const check=()=>{if(disposed||expected!==generation||captured!==token||serial!==privateIntent)throw new Error('selection_superseded');assertEditable();};
   if(draft.anchor&&draft.anchor.snapshotId!==state.snapshotId){if(!options.selectSnapshot)throw new Error('source_unavailable');const drafts=state.drafts,snapshot=await options.selectSnapshot(draft.anchor.snapshotId);check();const selecting=select(snapshot);expected=generation;serial=privateIntent;await selecting;check();publish({...state,drafts,activeDraftId:draft.id});}else publish({...state,activeDraftId:draft.id});
  },
  updateGraphFrame:(kind:'structural'|'semantic',frame:GraphFrames['structural']|GraphFrames['semantic'])=>{if(JSON.stringify(state.maps[kind])===JSON.stringify(frame))return;publish({...state,maps:{...state.maps,[kind]:structuredClone(frame)}});},
  setPageScroll:(pageScroll:number)=>{if(Number.isFinite(pageScroll)&&pageScroll>=0&&Math.abs(state.pageScroll-pageScroll)>1)publish({...state,pageScroll});},
  enterExploration:()=>{invalidatePrivateIntent();assertEditable();if(state.returnFrame)return;const original=activeDraft();if(!original||!state.snapshotId)throw new Error('source_unavailable');const frame:StoryReturnFrame={snapshotId:state.snapshotId,versionId:state.view?.version?.versionId??null,cursor:state.cursor,elapsedMs:state.elapsedMs,surface:state.surface,position:state.position,pageScroll:state.pageScroll,maps:state.maps,originalDraftId:original.id,evidence:state.evidence};const retained=state.drafts.find(draft=>draft.id!==original.id),draft=retained??{...original,id:crypto.randomUUID(),text:'',submitted:false};publish({...state,returnFrame:frame,drafts:[original,draft],activeDraftId:draft.id,mode:'exploring'});},
  resumeStory:async()=>{
   assertEditable();const frame=state.returnFrame;if(!frame)return;if(restoreOperation)throw new Error('resume_in_progress');
   const expected=generation,captured=token,serial=invalidatePrivateIntent(),drafts=state.drafts,operation={controller:new AbortController()};restoreOperation=operation;const signal=operation.controller.signal;try{
   const owns=()=>!disposed&&generation===expected&&token===captured&&privateIntent===serial&&restoreOperation===operation&&!signal.aborted&&state.returnFrame===frame&&!state.questionLocked;
   const check=()=>{if(!owns())throw new Error('selection_superseded');};
   const original=drafts.find(draft=>draft.id===frame.originalDraftId);if(!original)throw new Error('return_draft_unavailable');
   let snapshot=state.snapshot;if(snapshot?.snapshotId!==frame.snapshotId){const load=options.readSnapshot??options.selectSnapshot;if(!load)throw new Error('source_unavailable');snapshot=await load(frame.snapshotId,signal);check();}
   if(!snapshot||snapshot.snapshotId!==frame.snapshotId)throw new Error('return_source_unavailable');
   const view=await request(captured,`/api/story?${new URLSearchParams({reviewId,snapshotId:frame.snapshotId,...(frame.versionId?{versionId:frame.versionId}:{})})}`,signal) as StoryView;check();
   if(view.reviewId!==reviewId||view.snapshotId!==frame.snapshotId||(view.version?.versionId??null)!==frame.versionId||frame.cursor&&JSON.stringify(cursorAt(view,frame.cursor.index))!==JSON.stringify(frame.cursor))throw new Error('return_story_unavailable');
   const context=await request(captured,`/api/story/context?${new URLSearchParams({reviewId,snapshotId:frame.snapshotId,contextRevision:String(view.version?.contextRevision??view.contextRevision)})}`,signal) as StoryContextView;check();
   if(context.reviewId!==reviewId||context.snapshotId!==frame.snapshotId||context.selectedRevision!==(view.version?.contextRevision??view.contextRevision))throw new Error('return_context_unavailable');
   validateMap(snapshot,frame.maps);
   let restored:StoryState={...state,snapshot,snapshotId:frame.snapshotId,view,context,cursor:frame.cursor,elapsedMs:frame.elapsedMs,surface:frame.surface,position:clamp(state,frame.position.x,frame.position.y),maps:frame.maps,pageScroll:frame.pageScroll,activeDraftId:original.id,returnFrame:null,mode:'paused',evidence:null,evidenceText:'',semanticSources:{}};
   if(frame.evidence)restored=await stageEvidence(restored,frame.evidence,captured,owns,signal);check();
   const recovered=await restoreSemantic(frame.maps,frame.snapshotId,owns,signal);check();restored={...restored,maps:recovered.maps,viewRecoveryMessage:recovered.message};
   if(state.snapshotId!==frame.snapshotId){if(!options.selectSnapshot)throw new Error('source_unavailable');await options.selectSnapshot(frame.snapshotId);check();}
   interrupt();recoveryNotice=recovered.message;versionId=view.version?.versionId;contextTarget=context.selectedRevision;
   publish({...restored,drafts:state.drafts,questionLocked:state.questionLocked,mapRestoreId:state.mapRestoreId+1,focusRevision:state.focusRevision+1,reading:false,contextReading:false,evidenceBusy:false,error:''});wireRoutes();
   }finally{if(restoreOperation===operation)restoreOperation=null;}
  },
  askAboutStep:()=>{assertCanNavigate();const projection=storyProjection(state),source=projection?.sources.find(source=>source.reference.type==='snapshot_source');if(!source||source.reference.type!=='snapshot_source')throw new Error('question_anchor_unavailable: semantic context is not a snapshot question anchor');const draft=activeDraft();if(draft)replaceDraft({...draft,anchor:source.reference.anchor,...(projection?.comparisonKey?{comparisonKey:projection.comparisonKey}:{})});intent({type:'pause',reason:'question'});},
  openVersion:async(nextVersionId?:string)=>{assertEditable();if(state.returnFrame)throw new Error('resume_required');interrupt();publish({...state,mode:'paused',reading:false,contextReading:false,evidenceBusy:false});wireRoutes();await refresh('explicit',nextVersionId??null,true);},
  openCurrentContext:async()=>{intent({type:'pause',reason:'context'});await readContext();},
  openEvidence:bridgeOpenEvidence,
  connect:()=>{
   disposeConnection?.();disposed=false;const owned={};connection=owned;
   wireRoutes();const stopPoll=clock.every(()=>pollRoute?.emit(),700);syncClock();focusRoute?.emit();let active=true;
   const dispose=()=>{if(!active)return;active=false;stopPoll();if(connection===owned){pollRoute?.dispose();pollRoute=null;focusRoute?.dispose();focusRoute=null;connection=null;interrupt();disposed=true;publish({...state,mode:state.mode==='playing'?'paused':state.mode,reading:false,contextReading:false,evidenceBusy:false});}};
   disposeConnection=dispose;return dispose;
  },
  diagnostics:()=>registry.diagnostics()
 };
};
export type StoryBridge=ReturnType<typeof createStoryBridge>;
