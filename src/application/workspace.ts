import {createReviewBridge} from './review.ts';
import {createAnalysisBridge} from './analysis.ts';
import {createStoryBridge} from './story.ts';
import {createPrivateSession} from './private-session.ts';
import type {PrivateSession} from './private-session.ts';
import type {Anchor} from '../domain/public.ts';
import {createRegistry} from '../integration/registry.ts';
export const createReviewWorkspace=(reviewId:string,initialSnapshotId?:string,options:{session?:PrivateSession}={})=>{
 const session=options.session??createPrivateSession(),analysis=createAnalysisBridge(reviewId),registry=createRegistry();
 let confirmedDraft='',confirmedRoute:ReturnType<typeof registry.register>|null=null;
 const story=createStoryBridge(reviewId,{session,semantic:analysis,selectSnapshot:async id=>(await review.selectSnapshot(id)).snapshot,readSnapshot:id=>review.readSnapshot(id)});
 const review=createReviewBridge(reviewId,initialSnapshotId,{session,onConfirmedDraft:id=>{confirmedDraft=id;if(!confirmedRoute)throw new Error('workspace_disconnected');confirmedRoute.emit();}});
 const canLeave=()=>{try{story.assertCanNavigate();return review.canLeaveReview();}catch{return false;}};
 return {
  review,analysis,story,canLeaveReview:canLeave,
  connect:()=>{
   confirmedRoute=registry.register('question-confirmed-to-exact-draft',reviewId,()=>review.getSnapshot().authenticated,()=>story.confirmDraft(confirmedDraft));
   const guard=registry.register('question-recovery-to-draft-guard',reviewId,()=>true,()=>story.setQuestionGuard(review.getSnapshot().busy||review.getQuestionRecovery().state!=='none'));
   const unsubscribe=review.subscribe(()=>guard.emit()),disconnect=review.connect();guard.emit();
   return()=>{disconnect();unsubscribe();guard.dispose();confirmedRoute?.dispose();confirmedRoute=null;};
  },
  login:async(credential:string)=>{await review.login(credential);const current=review.getSnapshot().review;if(!review.getSnapshot().authenticated||!current)return;await Promise.all([analysis.login(credential,current.snapshot.snapshotId),story.login(credential,current.snapshot)]);},
  logout:()=>{story.logout();analysis.logout();review.logout();},
  selectSnapshot:async(snapshotId:string)=>{story.assertCanNavigate();const current=await review.selectSnapshot(snapshotId);await Promise.all([analysis.select(snapshotId),story.select(current.snapshot)]);return current;},
  openSource:async(anchor:Anchor,fileKey?:string)=>{story.assertCanNavigate();if(anchor.snapshotId!==story.getSnapshot().snapshotId){const current=await review.selectSnapshot(anchor.snapshotId);await Promise.all([analysis.select(anchor.snapshotId),story.select(current.snapshot)]);}story.selectSource(anchor,fileKey);},
  ask:async()=>{const draft=story.activeDraft();if(!draft?.anchor)throw new Error('question_anchor_unavailable');return review.ask(draft.anchor,draft.text,draft.parentQuestionId,draft.id);},
  diagnostics:()=>registry.diagnostics()
 };
};
export type ReviewWorkspace=ReturnType<typeof createReviewWorkspace>;
