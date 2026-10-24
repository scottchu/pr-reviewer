import {createReviewBridge} from './review.ts';
import {createAnalysisBridge} from './analysis.ts';
import {createStoryBridge} from './story.ts';
import {createPrivateSession} from './private-session.ts';
import type {PrivateSession,GraphFrames} from './private-session.ts';
import type {Anchor} from '../domain/public.ts';
import {createRegistry} from '../integration/registry.ts';
export const createReviewWorkspace=(reviewId:string,initialSnapshotId?:string,options:{session?:PrivateSession}={})=>{
 const session=options.session??createPrivateSession(),analysis=createAnalysisBridge(reviewId),registry=createRegistry();
 let generation=0,credential='',disposed=false;
 let mapInput:{kind:'structural'|'semantic';snapshotId:string;frame:GraphFrames['structural']|GraphFrames['semantic']}|null=null;
 const mapRoutes=new Map<'structural'|'semantic',ReturnType<typeof registry.register>>();
 let confirmedDraft='',confirmedRoute:ReturnType<typeof registry.register>|null=null;
 const owns=(expected:number,captured:string)=>!disposed&&expected===generation&&captured===credential;
 const story=createStoryBridge(reviewId,{session,semantic:analysis,selectSnapshot:async id=>{const expected=generation,captured=credential;const result=await review.selectSnapshot(id);if(!owns(expected,captured))throw new Error('workspace_superseded');return result.snapshot;},readSnapshot:id=>review.readSnapshot(id)});
 const review=createReviewBridge(reviewId,initialSnapshotId,{session,onConfirmedDraft:id=>{confirmedDraft=id;if(!confirmedRoute)throw new Error('workspace_disconnected');confirmedRoute.emit();}});
 const canLeave=()=>{try{story.assertCanNavigate();return review.canLeaveReview();}catch{return false;}};
 return {
  review,analysis,story,canLeaveReview:canLeave,
  connect:()=>{
   if(confirmedRoute)throw new Error('duplicate_route');disposed=false;
   confirmedRoute=registry.register('question-confirmed-to-exact-draft',reviewId,()=>review.getSnapshot().authenticated,()=>story.confirmDraft(confirmedDraft));
   const guard=registry.register('question-recovery-to-draft-guard',reviewId,()=>true,()=>story.setQuestionGuard(review.getSnapshot().busy||review.getQuestionRecovery().state!=='none'));
   for(const kind of ['structural','semantic'] as const)mapRoutes.set(kind,registry.register(`${kind}-map-view-to-private-frame`,reviewId,()=>Boolean(mapInput&&mapInput.kind===kind&&!disposed&&credential&&review.getSnapshot().authenticated&&story.getSnapshot().authenticated&&review.getSnapshot().review?.snapshot.snapshotId===mapInput.snapshotId&&story.getSnapshot().snapshotId===mapInput.snapshotId),()=>{if(mapInput)story.updateGraphFrame(kind,mapInput.frame);}));
   const unsubscribe=review.subscribe(()=>guard.emit()),disconnect=review.connect();guard.emit();
   return()=>{generation++;disposed=true;disconnect();unsubscribe();guard.dispose();confirmedRoute?.dispose();confirmedRoute=null;for(const route of mapRoutes.values())route.dispose();mapRoutes.clear();mapInput=null;};
  },
  login:async(value:string)=>{const captured=value.trim(),expected=++generation;credential=captured;disposed=false;await review.login(captured);if(!owns(expected,captured))return;const current=review.getSnapshot().review;if(!review.getSnapshot().authenticated||!current)return;await Promise.all([analysis.login(captured,current.snapshot.snapshotId),story.login(captured,current.snapshot)]);if(!owns(expected,captured))return;},
  logout:()=>{generation++;credential='';story.logout();analysis.logout();review.logout();},
  selectSnapshot:async(snapshotId:string)=>{const expected=++generation,captured=credential;story.assertCanNavigate();const current=await review.selectSnapshot(snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(snapshotId),story.select(current.snapshot)]);if(!owns(expected,captured))throw new Error('workspace_superseded');return current;},
  openSource:async(anchor:Anchor,fileKey?:string)=>{const expected=++generation,captured=credential;if(anchor.snapshotId!==story.getSnapshot().snapshotId){story.assertCanNavigate();const current=await review.selectSnapshot(anchor.snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(anchor.snapshotId),story.select(current.snapshot)]);}if(!owns(expected,captured))throw new Error('workspace_superseded');story.selectSource(anchor,fileKey);},
  openPath:async(path:string)=>{story.assertCanNavigate();const snapshot=review.getSnapshot().review?.snapshot,source=snapshot?.sources.find(item=>item.path===path&&item.side==='head'&&item.lineCount>0)??snapshot?.sources.find(item=>item.path===path&&item.lineCount>0);if(!snapshot||!source)throw new Error('source_unavailable');story.selectSource({snapshotId:snapshot.snapshotId,side:source.side,path:source.path,startLine:1,endLine:1});},
  captureMap:(kind:'structural'|'semantic',snapshotId:string|null,frame:GraphFrames['structural']|GraphFrames['semantic'])=>{if(!snapshotId)return;mapInput={kind,snapshotId,frame};mapRoutes.get(kind)?.emit();mapInput=null;},
  ask:async()=>{const draft=story.activeDraft();if(!draft?.anchor)throw new Error('question_anchor_unavailable');return review.ask(draft.anchor,draft.text,draft.parentQuestionId,draft.id);},
  diagnostics:()=>registry.diagnostics()
 };
};
export type ReviewWorkspace=ReturnType<typeof createReviewWorkspace>;
