import {createRegistry} from '../integration/registry.ts';
import type {Snapshot,StoryContent,StoryView,StoryContextView,StoryReference,SemanticSource} from '../domain/public.ts';
import type {AnalysisBridge} from './analysis.ts';
type Step=StoryContent['steps'][number];
type Chapter=StoryContent['chapters'][number];
type SourceReference=Extract<StoryReference,{type:'snapshot_source'|'semantic_source'}>;
export type StorySemanticPort=Pick<AnalysisBridge,'select'|'focus'|'getSnapshot'>;
export type StoryClock={now:()=>number;every:(callback:()=>void,period:number)=>()=>void};
type Cursor=Readonly<{versionId:string;chapterId:string;stepId:string;index:number}>;
export type StoryState=Readonly<{
 reviewId:string;snapshotId:string|null;snapshot:Snapshot|null;view:StoryView|null;context:StoryContextView|null;
 cursor:Cursor|null;mode:'paused'|'playing'|'ended';elapsedMs:number;surface:'flow'|'diff';hidden:boolean;reducedMotion:boolean;
 authenticated:boolean;reading:boolean;error:string;focusError:string;evidence:StoryReference|null;evidenceText:string;evidenceBusy:boolean;
 semanticSources:Readonly<Record<string,SemanticSource>>;position:Readonly<{x:number;y:number}>;viewport:Readonly<{width:number;height:number}>;playerSize:Readonly<{width:number;height:number}>;
}>;
export type StoryIntent=
 |{type:'replay'}|{type:'pause';reason:string}|{type:'previous'}|{type:'next'}|{type:'chapter';chapterId:string}|{type:'tick';elapsedMs:number}
 |{type:'surface';surface:'flow'|'diff'}|{type:'visibility';hidden:boolean}|{type:'reducedMotion';value:boolean}
 |{type:'movePlayer';x:number;y:number}|{type:'resizePlayer';viewport:{width:number;height:number};size:{width:number;height:number}}|{type:'resetPlayer'};
export type StoryExcerpt=Readonly<{reference:SourceReference;coordinates:'snapshot LF lines'|'semantic UTF-16 offsets';text:string;unavailable:boolean}>;
export type StoryProjection=Readonly<{chapter:Chapter;step:Step;claims:StoryContent['claims'];index:number;total:number;comparisonKey:string|undefined;sources:StoryExcerpt[]}>;
const ordered=(story:StoryContent)=>story.chapters.flatMap(chapter=>chapter.stepIds.flatMap(id=>{const step=story.steps.find(item=>item.id===id);return step?[{chapter,step}]:[];}));
const cursorAt=(view:StoryView|null,index:number):Cursor|null=>{
 const version=view?.version;if(!version)return null;const item=ordered(version.story)[index];
 return item?{versionId:version.versionId,chapterId:item.chapter.id,stepId:item.step.id,index}:null;
};
const move=(state:StoryState,index:number):StoryState=>{
 const total=state.view?.version?ordered(state.view.version.story).length:0;
 return {...state,cursor:cursorAt(state.view,Math.max(0,Math.min(total-1,index))),mode:'paused',elapsedMs:0,evidence:null,evidenceText:'',evidenceBusy:false};
};
const clamp=(state:StoryState,x:number,y:number)=>{
 const horizontal=Math.max(0,(state.viewport.width-state.playerSize.width)/2-8),vertical=Math.max(0,state.viewport.height-state.playerSize.height-16);
 return {x:Math.max(-horizontal,Math.min(horizontal,Number.isFinite(x)?x:0)),y:Math.max(-vertical,Math.min(0,Number.isFinite(y)?y:0))};
};
export const storyTransition=(state:StoryState,intent:StoryIntent):StoryState=>{
 switch(intent.type){
  case 'replay':return state.cursor&&!state.hidden?{...state,mode:'playing',elapsedMs:0}:state;
  case 'pause':return state.mode==='playing'?{...state,mode:'paused'}:state;
  case 'previous':return move(state,(state.cursor?.index??0)-1);
  case 'next':return move(state,(state.cursor?.index??0)+1);
  case 'chapter':{const story=state.view?.version?.story;if(!story)return state;const index=ordered(story).findIndex(item=>item.chapter.id===intent.chapterId);return index<0?state:move(state,index);}
  case 'tick':{
   if(state.mode!=='playing'||state.hidden||!state.cursor||!Number.isFinite(intent.elapsedMs)||intent.elapsedMs<=0)return state;
   const total=ordered(state.view!.version!.story).length,elapsed=state.elapsedMs+intent.elapsedMs,advance=Math.floor(elapsed/8000),index=Math.min(total-1,state.cursor.index+advance);
   const ended=state.cursor.index+advance>=total;
   return {...state,cursor:cursorAt(state.view,index),elapsedMs:ended?8000:elapsed%8000,mode:ended?'ended':'playing',...(advance?{evidence:null,evidenceText:'',evidenceBusy:false}:{})};
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
 return {chapter:item.chapter,step:item.step,claims:item.step.claimIds.flatMap(id=>{const claim=version.story.claims.find(claim=>claim.id===id);return claim?[claim]:[];}),index:cursor.index,total:steps.length,comparisonKey:key,sources:refs.map(ref=>excerpt(state,ref))};
};
const freeze=<T>(value:T):T=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item);}return value;};
const empty=(reviewId:string):StoryState=>({reviewId,snapshotId:null,snapshot:null,view:null,context:null,cursor:null,mode:'paused',elapsedMs:0,surface:'flow',hidden:false,reducedMotion:false,authenticated:false,reading:false,error:'',focusError:'',evidence:null,evidenceText:'',evidenceBusy:false,semanticSources:{},position:{x:0,y:0},viewport:{width:1024,height:768},playerSize:{width:500,height:44}});
const defaultClock:StoryClock={now:()=>performance.now(),every:(callback,period)=>{const timer=setInterval(callback,period);return()=>clearInterval(timer);}};
export const createStoryBridge=(reviewId:string,options:{clock?:StoryClock;semantic?:StorySemanticPort}={})=>{
 const clock=options.clock??defaultClock,registry=createRegistry(),listeners=new Set<()=>void>();
 let state=freeze(empty(reviewId)),token='',generation=0,versionId:string|undefined,connection:object|null=null,disposed=false;
 let read:AbortController|null=null,evidenceRead:AbortController|null=null,focusSerial=0,stopClock:(()=>void)|null=null,lastTick=0,disposeConnection:(()=>void)|null=null;
 let focusRoute:ReturnType<typeof registry.register>|null=null,pollRoute:ReturnType<typeof registry.register>|null=null;
 const publish=(next:StoryState)=>{if(Object.keys(next).every(key=>Object.is(next[key as keyof StoryState],state[key as keyof StoryState])))return;state=freeze(next);syncClock();for(const listener of listeners)listener();};
 const syncClock=()=>{
  const active=Boolean(connection)&&!disposed&&state.mode==='playing'&&!state.hidden&&Boolean(token);
  if(!active){stopClock?.();stopClock=null;return;}if(stopClock)return;
  lastTick=clock.now();stopClock=clock.every(()=>{const now=clock.now(),elapsedMs=Math.max(0,now-lastTick);lastTick=now;const previous=state.cursor?.stepId;publish(storyTransition(state,{type:'tick',elapsedMs}));if(previous!==state.cursor?.stepId)focusRoute?.emit();},250);
 };
 const interrupt=()=>{generation++;focusSerial++;read?.abort();read=null;evidenceRead?.abort();evidenceRead=null;stopClock?.();stopClock=null;};
 const request=async(capturedToken:string,path:string,signal:AbortSignal)=>{
  const response=await fetch(path,{headers:{Authorization:`Bearer ${capturedToken}`},signal});const body=await response.json() as unknown;
  if(!response.ok)throw new Error(String((body as {error?:string}).error??'request_failed'));return body;
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
   publish({...state,view,authenticated:true,error:'',...(changed?{cursor:cursorAt(view,0),context:null,mode:'paused' as const,elapsedMs:0,evidence:null,evidenceText:'',evidenceBusy:false,semanticSources:{}}:{})});
   if(changed||!state.context){
    const params=new URLSearchParams({reviewId,snapshotId,contextRevision:String(view.version?.contextRevision??view.contextRevision)});
    const context=await request(capturedToken,`/api/story/context?${params}`,controller.signal) as StoryContextView;
    if(owns()){
     if(context.reviewId!==reviewId||context.snapshotId!==snapshotId||context.selectedRevision!==(view.version?.contextRevision??view.contextRevision))throw new Error('story_context_selection_mismatch');
     publish({...state,context});
    }
   }
   if(owns()&&changed)focusRoute?.emit();return view;
  }catch(error){if(owns())publish({...state,mode:state.mode==='playing'?'paused':state.mode,error:error instanceof Error?error.message:'request_failed'});}
  finally{if(read===controller){read=null;if(generation===expected&&!disposed)publish({...state,reading:false});}}
 };
 const hydrateSources=async(sources:readonly SourceReference[],controller:AbortController,owns:()=>boolean,capturedToken:string)=>{
  for(const ref of sources){if(!owns())return;if(ref.type!=='semantic_source'||state.semanticSources[sourceKey(ref)])continue;
   const params=new URLSearchParams({reviewId,snapshotId:ref.anchor.snapshotId,corpusId:ref.corpusId,side:ref.anchor.side,path:ref.anchor.path,contentHash:ref.anchor.contentHash});
   const source=await request(capturedToken,`/api/analysis/source?${params}`,controller.signal) as SemanticSource;
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
 const intent=(intent:StoryIntent)=>{const previous=state.cursor?.stepId;publish(storyTransition(state,intent));if(previous!==state.cursor?.stepId||intent.type==='replay')focusRoute?.emit();};
 const select=async(snapshot:Snapshot)=>{
  if(state.snapshotId===snapshot.snapshotId)return;
  interrupt();versionId=undefined;publish({...empty(reviewId),snapshot:structuredClone(snapshot),snapshotId:snapshot.snapshotId,authenticated:Boolean(token),reducedMotion:state.reducedMotion,hidden:state.hidden,viewport:state.viewport,playerSize:state.playerSize});
  wireRoutes();if(token&&!disposed)await refresh();
 };
 return {
  getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},intent,
  login:async(value:string,snapshot:Snapshot)=>{interrupt();disposed=false;token=value.trim();versionId=undefined;publish({...empty(reviewId),snapshot:structuredClone(snapshot),snapshotId:snapshot.snapshotId,reducedMotion:state.reducedMotion,hidden:state.hidden,viewport:state.viewport,playerSize:state.playerSize});wireRoutes();if(token)await refresh();},
  logout:()=>{interrupt();token='';versionId=undefined;publish(empty(reviewId));wireRoutes();},select,refresh:()=>refresh(),
  openVersion:async(nextVersionId?:string)=>{interrupt();publish({...state,mode:'paused',reading:false,evidenceBusy:false});wireRoutes();await refresh('explicit',nextVersionId??null,true);},
  openCurrentContext:async()=>{
   if(!token||!state.snapshotId||disposed)return;intent({type:'pause',reason:'context'});
   evidenceRead?.abort();const controller=new AbortController();evidenceRead=controller;const expected=generation,capturedToken=token,snapshotId=state.snapshotId;
   const owns=()=>!disposed&&expected===generation&&evidenceRead===controller&&!controller.signal.aborted;
   try{const context=await request(capturedToken,`/api/story/context?${new URLSearchParams({reviewId,snapshotId})}`,controller.signal) as StoryContextView;if(owns()){if(context.reviewId!==reviewId||context.snapshotId!==snapshotId)throw new Error('story_context_selection_mismatch');publish({...state,context});}}
   catch(error){if(owns())publish({...state,error:error instanceof Error?error.message:'story_context_unavailable'});}finally{if(evidenceRead===controller)evidenceRead=null;}
  },
  openEvidence:async(reference:StoryReference)=>{
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
  },
  connect:()=>{
   disposeConnection?.();disposed=false;const owned={};connection=owned;
   wireRoutes();const stopPoll=clock.every(()=>pollRoute?.emit(),700);syncClock();focusRoute?.emit();let active=true;
   const dispose=()=>{if(!active)return;active=false;stopPoll();if(connection===owned){pollRoute?.dispose();pollRoute=null;focusRoute?.dispose();focusRoute=null;connection=null;interrupt();disposed=true;publish({...state,mode:state.mode==='playing'?'paused':state.mode,reading:false,evidenceBusy:false});}};
   disposeConnection=dispose;return dispose;
  },
  diagnostics:()=>registry.diagnostics()
 };
};
export type StoryBridge=ReturnType<typeof createStoryBridge>;
