import {createReviewBridge} from './review.ts';
import {createAnalysisBridge} from './analysis.ts';
import {createStoryBridge} from './story.ts';
import {createPrivateSession} from './private-session.ts';
import type {PrivateSession} from './private-session.ts';
import type {Anchor} from '../domain/public.ts';
import {createRegistry} from '../integration/registry.ts';
export const createReviewWorkspace=(reviewId:string,initialSnapshotId?:string,options:{session?:PrivateSession}={})=>{
 const session=options.session??createPrivateSession(),analysis=createAnalysisBridge(reviewId),registry=createRegistry();
 let generation=0,credential='',disposed=false;
 let confirmedDraft='',confirmedRoute:ReturnType<typeof registry.register>|null=null;
 const owns=(expected:number,captured:string)=>!disposed&&expected===generation&&captured===credential;
 const story=createStoryBridge(reviewId,{session,semantic:analysis,selectSnapshot:async id=>{const expected=generation,captured=credential;const result=await review.selectSnapshot(id);if(!owns(expected,captured))throw new Error('workspace_superseded');return result.snapshot;},readSnapshot:id=>review.readSnapshot(id)});
 const review=createReviewBridge(reviewId,initialSnapshotId,{session,onConfirmedDraft:id=>{confirmedDraft=id;if(!confirmedRoute)throw new Error('workspace_disconnected');confirmedRoute.emit();}});
 const canLeave=()=>{try{story.assertCanNavigate();return review.canLeaveReview();}catch{return false;}};
 return {
  review,analysis,story,canLeaveReview:canLeave,
  connect:()=>{
   if(confirmedRoute)throw new Error('duplicate_route');disposed=false;generation++;
   confirmedRoute=registry.register('question-confirmed-to-exact-draft',reviewId,()=>review.getSnapshot().authenticated,()=>story.confirmDraft(confirmedDraft));
   const guard=registry.register('question-recovery-to-draft-guard',reviewId,()=>true,()=>story.setQuestionGuard(review.getSnapshot().busy||review.getQuestionRecovery().state!=='none'));
   const unsubscribe=review.subscribe(()=>guard.emit()),disconnect=review.connect();guard.emit();
   return()=>{generation++;disposed=true;disconnect();unsubscribe();guard.dispose();confirmedRoute?.dispose();confirmedRoute=null;};
  },
  login:async(value:string)=>{const captured=value.trim(),expected=++generation;credential=captured;disposed=false;await review.login(captured);if(!owns(expected,captured))return;const current=review.getSnapshot().review;if(!review.getSnapshot().authenticated||!current)return;await Promise.all([analysis.login(captured,current.snapshot.snapshotId),story.login(captured,current.snapshot)]);if(!owns(expected,captured))return;},
  logout:()=>{generation++;credential='';story.logout();analysis.logout();review.logout();},
  selectSnapshot:async(snapshotId:string)=>{const expected=++generation,captured=credential;story.assertCanNavigate();const current=await review.selectSnapshot(snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(snapshotId),story.select(current.snapshot)]);if(!owns(expected,captured))throw new Error('workspace_superseded');return current;},
  openSource:async(anchor:Anchor,fileKey?:string)=>{const expected=++generation,captured=credential;if(anchor.snapshotId!==story.getSnapshot().snapshotId){story.assertCanNavigate();const current=await review.selectSnapshot(anchor.snapshotId);if(!owns(expected,captured))throw new Error('workspace_superseded');await Promise.all([analysis.select(anchor.snapshotId),story.select(current.snapshot)]);}if(!owns(expected,captured))throw new Error('workspace_superseded');story.selectSource(anchor,fileKey);},
  ask:async()=>{const draft=story.activeDraft();if(!draft?.anchor)throw new Error('question_anchor_unavailable');return review.ask(draft.anchor,draft.text,draft.parentQuestionId,draft.id);},
  diagnostics:()=>registry.diagnostics()
 };
};
export type ReviewWorkspace=ReturnType<typeof createReviewWorkspace>;
