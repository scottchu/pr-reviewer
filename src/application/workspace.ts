import {createHeadTestsBridge} from './head-tests.ts';
import {localOwnerSession} from './local-access.ts';
import {createReviewBridge} from './review.ts';
import {createAnalysisBridge} from './analysis.ts';
import type {SourceCanvas} from './canvas.ts';
import {createSourceCanvas,createCanvasFrameValidator} from './canvas.ts';
import {createStoryBridge,storyProjection} from './story.ts';
import {createPrivateSession} from './private-session.ts';
import type {PrivateSession,GraphFrames} from './private-session.ts';
import type {Anchor} from '../domain/public.ts';
import {createRegistry} from '../integration/registry.ts';
export const createReviewWorkspace=(reviewId:string,initialSnapshotId?:string,options:{session?:PrivateSession;canvas?:SourceCanvas}={})=>{
 const session=options.session??createPrivateSession(),canvas=options.canvas??createSourceCanvas(),canvasFrames=createCanvasFrameValidator(),analysis=createAnalysisBridge(reviewId),tests=createHeadTestsBridge(reviewId),registry=createRegistry();
 let generation=0,credential='',disposed=false,canvasAccessReady=false;
 let syncCanvas=()=>{},syncCanvasStory=()=>{};
 let mapInput:{kind:'structural'|'semantic';snapshotId:string;frame:GraphFrames['structural']|GraphFrames['semantic']}|null=null;
 const mapRoutes=new Map<'structural'|'semantic',ReturnType<typeof registry.register>>();
 let confirmedDraft='',confirmedRoute:ReturnType<typeof registry.register>|null=null;
 const owns=(expected:number,captured:string)=>!disposed&&expected===generation&&captured===credential;
 const story=createStoryBridge(reviewId,{session,semantic:analysis,canvasFrames,selectSnapshot:async id=>{const expected=generation,captured=credential;const result=await review.selectSnapshot(id);if(!owns(expected,captured))throw new Error('workspace_superseded');return result.snapshot;},readSnapshot:(id,signal)=>review.readSnapshot(id,signal)});
 const review=createReviewBridge(reviewId,initialSnapshotId,{session,onConfirmedDraft:id=>{confirmedDraft=id;if(!confirmedRoute)throw new Error('workspace_disconnected');confirmedRoute.emit();}});
 const canLeave=()=>{try{story.assertCanNavigate();return review.canLeaveReview();}catch{return false;}};
 const login=async(value:string=localOwnerSession)=>{
   const captured=value.trim(),expected=++generation;credential=captured;disposed=false;canvasAccessReady=false;canvas.dispose();
   try{
    const testsReady=tests.setAccess(captured);await review.login(captured);if(!owns(expected,captured))return;await testsReady;if(!owns(expected,captured))return;
    const current=review.getSnapshot().review;if(!review.getSnapshot().authenticated||!current)return;
    // Private hydration may select a retained analysis; finish the initial
    // semantic login read before handing that selection owner to StoryBridge.
    await analysis.login(captured,current.snapshot.snapshotId);if(!owns(expected,captured))return;
    await story.login(captured,current.snapshot);if(!owns(expected,captured))return;canvasAccessReady=true;syncCanvas();syncCanvasStory();
   }catch(error){if(owns(expected,captured))throw error;}
  };

 return {
  review,analysis,story,tests,canvas,canLeaveReview:canLeave,
  connect:()=>{
   if(confirmedRoute)throw new Error('duplicate_route');disposed=false;
   confirmedRoute=registry.register('question-confirmed-to-exact-draft',reviewId,()=>review.getSnapshot().authenticated,()=>story.confirmDraft(confirmedDraft));
   const guard=registry.register('question-recovery-to-draft-guard',reviewId,()=>true,()=>story.setQuestionGuard(review.getSnapshot().busy||review.getQuestionRecovery().state!=='none'));
   for(const kind of ['structural','semantic'] as const)mapRoutes.set(kind,registry.register(`${kind}-map-view-to-private-frame`,reviewId,()=>Boolean(mapInput&&mapInput.kind===kind&&!disposed&&credential&&review.getSnapshot().authenticated&&story.getSnapshot().authenticated&&review.getSnapshot().review?.snapshot.snapshotId===mapInput.snapshotId&&story.getSnapshot().snapshotId===mapInput.snapshotId),()=>{if(mapInput)story.updateGraphFrame(kind,mapInput.frame);}));
   let testSnapshot='';
   const testScope=registry.register('review-scope-to-head-test-view',reviewId,()=>true,()=>{const current=review.getSnapshot();if(!current.authenticated||!current.review){if(testSnapshot){testSnapshot='';tests.lock();}return;}const id=current.review.snapshot.snapshotId;if(testSnapshot!==id){testSnapshot=id;void tests.select(id);}});
   let restoringCanvas=true,restoreSerial=-1,restoreOwner=0,canvasScope='',storyIntent='';
   let pendingCanvasRestore:{owner:number;scope:string;credential:string;serial:number;startId:number}|null=null;
   const ownsCanvasRestore=(pending:NonNullable<typeof pendingCanvasRestore>)=>!disposed&&canvasAccessReady&&pending.owner===restoreOwner&&pending.scope===canvasScope&&pending.credential===credential&&pending.serial===restoreSerial;
   const captureCanvas=registry.register('canvas-inspection-to-private-frame',reviewId,()=>{const view=canvas.getSnapshot();return Boolean(!disposed&&canvasAccessReady&&!restoringCanvas&&!view.busy&&!view.error&&view.frame&&credential&&review.getSnapshot().authenticated&&story.getSnapshot().authenticated&&view.snapshot?.snapshotId===review.getSnapshot().review?.snapshot.snapshotId&&view.snapshot?.snapshotId===story.getSnapshot().snapshotId);},()=>story.updateGraphFrame('structural',canvas.getSnapshot().frame));
   const reviewCanvas=registry.register('review-source-to-canvas-inspection',reviewId,()=>!disposed,()=>{const current=review.getSnapshot(),scope=canvasAccessReady&&current.authenticated?current.review?.snapshot.snapshotId??'':'';if(scope!==canvasScope){canvasScope=scope;restoreOwner++;pendingCanvasRestore=null;restoreSerial=-1;restoringCanvas=true;}canvas.setReview(canvasAccessReady&&current.authenticated?current.review?.snapshot??null:null,canvasAccessReady&&current.authenticated?current.graph:null);});
   const storyCanvas=registry.register('story-frame-to-canvas-inspection',reviewId,()=>!disposed&&canvasAccessReady&&review.getSnapshot().authenticated&&story.getSnapshot().authenticated&&canvas.getSnapshot().snapshot?.snapshotId===story.getSnapshot().snapshotId,()=>{
    const current=story.getSnapshot(),focus=storyProjection(current)?.graphFocus;
    if(current.mapRestoreId!==restoreSerial){restoreSerial=current.mapRestoreId;storyIntent=focus?.intentId??'';if(current.mapRestoreId){restoringCanvas=true;const pending={owner:++restoreOwner,scope:canvasScope,credential,serial:restoreSerial,startId:canvas.getSnapshot().restoreId};pendingCanvasRestore=pending;void canvas.restore(current.maps.structural).catch(()=>{}).finally(()=>{if(ownsCanvasRestore(pending)){restoringCanvas=false;pendingCanvasRestore=null;captureCanvas.emit();}});return;}restoringCanvas=false;captureCanvas.emit();}
    if(focus&&focus.intentId!==storyIntent){storyIntent=focus.intentId;const graph=canvas.getSnapshot().graph;if(graph?.files.some(file=>file.key===focus.fileKey))canvas.focusFile(focus.fileKey);}
   });
   syncCanvas=()=>reviewCanvas.emit();syncCanvasStory=()=>storyCanvas.emit();
   const unsubscribeCanvas=canvas.subscribe(()=>{const view=canvas.getSnapshot(),pending=pendingCanvasRestore;if(pending&&ownsCanvasRestore(pending)&&!view.busy&&!view.error&&view.restoreId!==pending.startId){restoringCanvas=false;pendingCanvasRestore=null;}captureCanvas.emit();}),unsubscribeStory=story.subscribe(()=>storyCanvas.emit());
   const disconnectTests=tests.connect();
   const unsubscribe=review.subscribe(()=>{guard.emit();testScope.emit();reviewCanvas.emit();}),disconnect=review.connect();guard.emit();testScope.emit();reviewCanvas.emit();storyCanvas.emit();
   let active=true;return()=>{if(!active)return;active=false;generation++;disposed=true;canvasAccessReady=false;syncCanvas=()=>{};syncCanvasStory=()=>{};disconnect();disconnectTests();unsubscribe();unsubscribeCanvas();unsubscribeStory();captureCanvas.dispose();reviewCanvas.dispose();storyCanvas.dispose();canvas.dispose();testScope.dispose();guard.dispose();confirmedRoute?.dispose();confirmedRoute=null;for(const route of mapRoutes.values())route.dispose();mapRoutes.clear();mapInput=null;};
  },
  open:()=>login(),
  login,
  logout:()=>{generation++;credential='';canvasAccessReady=false;canvas.dispose();story.logout();analysis.logout();review.logout();},
  selectSnapshot:async(snapshotId:string)=>{const expected=++generation,captured=credential;story.assertCanNavigate();const current=await review.selectSnapshot(snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(snapshotId),story.select(current.snapshot)]);if(!owns(expected,captured))throw new Error('workspace_superseded');return current;},
  inspectSource:async(anchor:Anchor,fileKey?:string)=>{const expected=++generation,captured=credential;story.intent({type:'pause',reason:'reading'});if(anchor.snapshotId!==story.getSnapshot().snapshotId){story.assertCanNavigate();const current=await review.selectSnapshot(anchor.snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(anchor.snapshotId),story.select(current.snapshot)]);}if(!owns(expected,captured))throw new Error('workspace_superseded');await canvas.inspect(anchor,fileKey);if(!owns(expected,captured))throw new Error('workspace_superseded');},
  openSource:async(anchor:Anchor,fileKey?:string)=>{const expected=++generation,captured=credential;if(anchor.snapshotId!==story.getSnapshot().snapshotId){story.assertCanNavigate();const current=await review.selectSnapshot(anchor.snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(anchor.snapshotId),story.select(current.snapshot)]);}if(!owns(expected,captured))throw new Error('workspace_superseded');story.selectSource(anchor,fileKey);},
  openPath:async(path:string)=>{story.assertCanNavigate();const snapshot=review.getSnapshot().review?.snapshot,source=snapshot?.sources.find(item=>item.path===path&&item.side==='head'&&item.lineCount>0)??snapshot?.sources.find(item=>item.path===path&&item.lineCount>0);if(!snapshot||!source)throw new Error('source_unavailable');story.selectSource({snapshotId:snapshot.snapshotId,side:source.side,path:source.path,startLine:1,endLine:1});},
  captureMap:(kind:'structural'|'semantic',snapshotId:string|null,frame:GraphFrames['structural']|GraphFrames['semantic'])=>{if(!snapshotId)return;mapInput={kind,snapshotId,frame};mapRoutes.get(kind)?.emit();mapInput=null;},
  ask:async()=>{const draft=story.activeDraft();if(!draft?.anchor)throw new Error('question_anchor_unavailable');return review.ask(draft.anchor,draft.text,draft.parentQuestionId,draft.id);},
  diagnostics:()=>registry.diagnostics()
 };
};
export type ReviewWorkspace=ReturnType<typeof createReviewWorkspace>;
