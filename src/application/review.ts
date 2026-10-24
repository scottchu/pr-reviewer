import {localOwnerSession,accessHeaders} from './local-access.ts';
import {sourceViews,projectGraph,validateAnchor,commandSchema,storyCanonical} from '../domain/public.ts';
import type {Anchor,Receipt,Review,Snapshot} from '../domain/public.ts';
import type {View} from './public.ts';
import {createRegistry} from '../integration/registry.ts';
import {createPrivateSession,encodedBytes,requestFingerprint,parsePendingCommand} from './private-session.ts';
import type {PrivateSession,PendingQuestion,QuestionRecovery} from './private-session.ts';
const noRecovery=():QuestionRecovery=>({state:'none',message:'',busy:false});
const empty=():View=>({sources:[],graph:null,initialSelection:null,review:null,error:'',busy:false,selecting:false,authenticated:false,recovery:noRecovery()});
export const createReviewBridge=(reviewId:string,initialSnapshotId?:string,options:{session?:PrivateSession;onConfirmedDraft?:(draftId:string)=>void}={})=>{
 const session=options.session??createPrivateSession(),registry=createRegistry(),listeners=new Set<()=>void>();
 let state=empty(),token='',scope='',generation=0,selectedSnapshotId:string|null=initialSnapshotId??null,inflight:AbortController|null=null;
 let pending:PendingQuestion|null=null,pendingAccess:'none'|'authorized'|'locked'|'quarantined'|'storage_unavailable'='none',operation:object|null=null;
 const readControllers=new Set<AbortController>();
 const abortReads=()=>{for(const controller of readControllers)controller.abort();readControllers.clear();};
 const recovery=():QuestionRecovery=>{
  if(pendingAccess==='quarantined')return {state:'quarantined',message:'Saved question recovery is corrupt or unsupported. It is quarantined; no replacement question can be sent.',busy:state.busy};
  if(pendingAccess==='storage_unavailable')return {state:'storage_unavailable',message:'Question recovery storage is unavailable. No uncheckpointed question will be sent.',busy:state.busy};
  if(pendingAccess==='locked'||pending&&(!scope||pending.scope!==scope||pending.origin!==session.origin))return {state:'locked',message:'An unresolved question is locked. A legacy or different-owner recovery record requires explicit reconciliation; its command has been preserved.',busy:state.busy};
  if(!pending)return {...noRecovery(),busy:state.busy};
  const command=parsePendingCommand(pending);return {state:pending.phase,message:pending.phase==='awaiting_ack'?'Question acknowledgement is unresolved. Explicit recovery reuses the unchanged saved command.':'Question accepted; exact question readback is still required.',busy:state.busy,reviewId:pending.reviewId,snapshotId:command.anchor.snapshotId,draftId:pending.draftId,commandId:command.commandId};
 };
 const publish=(next:View)=>{state={...next};state={...state,recovery:recovery()};for(const listener of listeners)listener();};
 const owns=(expected:number,captured:string,op?:object)=>generation===expected&&token===captured&&(!op||operation===op);
 const request=async(captured:string,path:string,body?:unknown,signal?:AbortSignal)=>{
  const controller=body===undefined?new AbortController():null;if(controller)readControllers.add(controller);
  const ownedSignal=controller?(signal?AbortSignal.any([signal,controller.signal]):controller.signal):signal;
  try{
   if(ownedSignal?.aborted)throw new Error('selection_superseded');
   const response=await fetch(path,{headers:{...accessHeaders(captured),'Content-Type':'application/json'},...(body===undefined?{}:{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)}),...(ownedSignal?{signal:ownedSignal}:{})});
   const value=await response.json() as unknown;if(ownedSignal?.aborted)throw new Error('selection_superseded');if(!response.ok)throw new Error(String((value as {error?:string}).error??'request_failed'));return value;
  }finally{if(controller)readControllers.delete(controller);}
 };
 const interruptSelection=()=>{if(state.selecting){selectedSnapshotId=state.review?.snapshot.snapshotId??selectedSnapshotId;publish({...state,selecting:false});}};
 const refresh=async(minimumRevision=0)=>{
  const expected=generation,captured=token;inflight?.abort();const controller=new AbortController();inflight=controller;
  try{
   const review=await request(captured,`/api/reviews/${encodeURIComponent(reviewId)}?minimumRevision=${minimumRevision}${selectedSnapshotId?`&snapshotId=${encodeURIComponent(selectedSnapshotId)}`:''}`,undefined,controller.signal) as Review;
   if(owns(expected,captured)&&!controller.signal.aborted){if(review.reviewId!==reviewId||selectedSnapshotId&&review.snapshot.snapshotId!==selectedSnapshotId)throw new Error('selection_mismatch');selectedSnapshotId??=review.snapshot.snapshotId;
    const source=review.snapshot.sources.find(source=>source.side==='head'&&source.lineCount>0)??review.snapshot.sources.find(source=>source.lineCount>0);
    publish({...state,review,sources:state.review?.snapshot.snapshotId===review.snapshot.snapshotId?state.sources:sourceViews(review.snapshot),graph:state.review?.snapshot.snapshotId===review.snapshot.snapshotId?state.graph:projectGraph(review.snapshot),error:'',initialSelection:source?{snapshotId:review.snapshot.snapshotId,side:source.side,path:source.path,startLine:1,endLine:1}:null,authenticated:true});return review;
   }
  }catch(error){if(owns(expected,captured)&&!controller.signal.aborted)publish({...state,error:error instanceof Error?error.message:'request_failed'});}
  finally{if(inflight===controller)inflight=null;}
 };
 const hydrateRecovery=async(expected:number,captured:string)=>{
  const nextScope=await session.scope(captured);if(!owns(expected,captured))return;
  const loaded=await session.readPending();if(!owns(expected,captured))return;scope=nextScope;
  if(loaded.kind==='record'){
   pending=loaded.record!;pendingAccess=pending.scope===scope&&pending.origin===session.origin?'authorized':'locked';
   if(pendingAccess==='authorized'){
    const command=parsePendingCommand(pending);
    try{const review=await request(captured,`/api/reviews/${encodeURIComponent(pending.reviewId)}?snapshotId=${encodeURIComponent(command.anchor.snapshotId)}`) as Review;if(!owns(expected,captured))return;if(review.reviewId!==pending.reviewId||review.snapshot.snapshotId!==command.anchor.snapshotId||!validateAnchor(command.anchor.snapshotId,review.snapshot.sources,command.anchor))pendingAccess='locked';}catch{if(owns(expected,captured))pendingAccess='locked';}
   }
  }else {pending=null;pendingAccess=loaded.kind==='none'?'none':loaded.kind;}
  if(owns(expected,captured))publish({...state});
 };
 const confirms=(review:Review,record:PendingQuestion,receipt:Receipt)=>{
  const command=parsePendingCommand(record),question=review.questions.find(question=>question.questionId===receipt.result.questionId);
  return review.reviewId===record.reviewId&&review.snapshot.snapshotId===command.anchor.snapshotId&&review.revision>=receipt.revision&&Boolean(question&&question.actorId===receipt.actorId&&question.text===command.text.trim()&&storyCanonical(question.anchor)===storyCanonical(command.anchor)&&question.parentQuestionId===command.parentQuestionId);
 };
 const reconcile=async(record:PendingQuestion,expected:number,captured:string,op:object)=>{
  const current=()=>owns(expected,captured,op)&&pending?.fingerprint===record.fingerprint&&pending.scope===record.scope;
  const command=parsePendingCommand(record);if(!current()||scope!==record.scope||pendingAccess!=='authorized')throw new Error('submission_superseded');
  session.writePending(record);if(!current())throw new Error('submission_superseded');
  let receipt:Receipt;
  if(record.phase==='accepted_awaiting_readback')receipt=session.parseReceipt(record.receipt);
  else{
   // A retry is explicit, exact and still guarded by the current storage identity.
   receipt=session.parseReceipt(await request(captured,'/api/commands',record.request));
   if(!current())throw new Error('submission_superseded');
   if(receipt.commandId!==command.commandId)throw new Error('receipt_identity_mismatch');
   if(receipt.state==='rejected'){
    if(receipt.error==='command_conflict')throw new Error('command_conflict');
    session.clearPending(record);if(current()){pending=null;pendingAccess='none';}throw new Error(receipt.error??'rejected');
   }
   if(typeof receipt.result.questionId!=='string'||receipt.result.eventId!==null&&typeof receipt.result.eventId!=='string'||!receipt.actorId||receipt.revision<1)throw new Error('receipt_identity_mismatch');
   const accepted:PendingQuestion={...record,phase:'accepted_awaiting_readback',receipt};pending=accepted;
   // Failure preserves the durable awaiting-ack record and this receipt in memory.
   session.writePending(accepted);record=accepted;
  }
  if(!current())throw new Error('submission_superseded');
  const readback=await request(captured,`/api/reviews/${encodeURIComponent(record.reviewId)}?snapshotId=${encodeURIComponent(command.anchor.snapshotId)}&minimumRevision=${receipt.revision}`) as Review;
  if(!current())throw new Error('submission_superseded');if(!confirms(readback,record,receipt))throw new Error('readback_pending: exact accepted question not confirmed');
  session.invalidateDraft(scope,record.draftId);if(!current())throw new Error('submission_superseded');options.onConfirmedDraft?.(record.draftId);session.clearPending(record);
  if(current()){pending=null;pendingAccess='none';publish({...state,...(state.review?.snapshot.snapshotId===readback.snapshot.snapshotId&&readback.reviewId===reviewId?{review:readback}:{})});}
  return receipt;
 };
 const perform=async(work:(expected:number,captured:string,op:object)=>Promise<Receipt>)=>{
  if(state.busy)throw new Error('submission_in_progress');if(!state.authenticated||!token||!scope)throw new Error('unauthorized');
  const expected=generation,captured=token,op={};operation=op;publish({...state,busy:true,error:''});
  try{return await work(expected,captured,op);}catch(error){if(owns(expected,captured,op))publish({...state,error:error instanceof Error?error.message:'request_failed'});throw error;}
  finally{if(owns(expected,captured,op)){operation=null;publish({...state,busy:false});}}
 };
 return {
  getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener);},
  canLeaveReview:()=>!state.busy&&!state.selecting&&!pending&&pendingAccess==='none',getQuestionRecovery:()=>state.recovery,
  connect:()=>{const route=registry.register('review-committed-to-view',reviewId,()=>Boolean(token)&&!state.busy&&!state.selecting&&!inflight,()=>{void refresh();});const timer=setInterval(()=>route.emit(),700);route.emit();return()=>{clearInterval(timer);route.dispose();generation++;abortReads();operation=null;const canceled=inflight;inflight=null;interruptSelection();canceled?.abort();publish({...state,busy:false});};},
  login:async(value:string=localOwnerSession)=>{abortReads();token=value.trim();scope='';generation++;operation=null;inflight?.abort();inflight=null;interruptSelection();publish({...empty(),recovery:{state:'locked',message:'Loading private recovery…',busy:false}});const expected=generation,captured=token,review=await refresh();if(review&&owns(expected,captured))await hydrateRecovery(expected,captured);},
  logout:()=>{generation++;abortReads();operation=null;token='';scope='';inflight?.abort();inflight=null;pendingAccess=pending?'locked':pendingAccess;let error='';try{session.clearView();}catch(cause){error=cause instanceof Error?cause.message:'view_storage_unavailable';}publish({...empty(),error});},
  readSnapshot:async(snapshotId:string,signal?:AbortSignal):Promise<Snapshot>=>{const expected=generation,captured=token;if(!captured||!state.authenticated)throw new Error('unauthorized');const review=await request(captured,`/api/reviews/${encodeURIComponent(reviewId)}?snapshotId=${encodeURIComponent(snapshotId)}`,undefined,signal) as Review;if(!owns(expected,captured)||signal?.aborted)throw new Error('selection_superseded');if(review.reviewId!==reviewId||review.snapshot.snapshotId!==snapshotId)throw new Error('source_unavailable');return review.snapshot;},
  selectSnapshot:async(snapshotId:string)=>{
   if(state.busy||pending||pendingAccess!=='none')throw new Error('submission_pending: reconcile the question before changing snapshots');abortReads();const previous=state.review?.snapshot.snapshotId??selectedSnapshotId;selectedSnapshotId=snapshotId;const expected=++generation;publish({...state,selecting:true});
   try{const review=await refresh();if(expected!==generation)throw new Error('selection_superseded');if(!review){selectedSnapshotId=previous;throw new Error(state.error||'source_unavailable');}return review;}finally{if(expected===generation)publish({...state,selecting:false});}
  },
  ask:(anchor:Anchor,text:string,parentQuestionId?:string,draftId?:string)=>perform(async(expected,captured,op)=>{
   if(state.selecting)throw new Error('selection_in_progress');if(pendingAccess!=='none'&&pendingAccess!=='authorized')throw new Error(`submission_${pendingAccess}`);
   if(pending){const saved=parsePendingCommand(pending);if(storyCanonical(saved.anchor)!==storyCanonical(anchor)||saved.text!==text||saved.parentQuestionId!==parentQuestionId||draftId&&draftId!==pending.draftId)throw new Error('submission_unknown: retry the unchanged question to reconcile');return reconcile(pending,expected,captured,op);}
   if(!state.review||!validateAnchor(state.review.snapshot.snapshotId,state.review.snapshot.sources,anchor))throw new Error('invalid_anchor');
   if(!text.trim()||encodedBytes(text.trim())>16384)throw new Error('invalid_request');
   const command=commandSchema.parse({type:'AskQuestion',commandId:crypto.randomUUID(),reviewId,anchor:structuredClone(anchor),text,...(parentQuestionId?{parentQuestionId}:{})});const request=storyCanonical(command);
   if(encodedBytes(request)>session.limits.requestBytes)throw new Error('question_request_too_large');const fingerprint=await requestFingerprint(request);
   if(!owns(expected,captured,op))throw new Error('submission_superseded');const loaded=await session.readPending();if(!owns(expected,captured,op))throw new Error('submission_superseded');
   if(loaded.kind!=='none'){pending=loaded.record??null;pendingAccess=loaded.kind==='record'?'locked':loaded.kind;throw new Error('submission_unknown');}
   const record:PendingQuestion={schema:1,origin:session.origin,scope,reviewId,draftId:draftId??crypto.randomUUID(),phase:'awaiting_ack',request,fingerprint};pending=record;pendingAccess='authorized';session.writePending(record);if(!owns(expected,captured,op))throw new Error('submission_superseded');return reconcile(record,expected,captured,op);
  }),
  recoverPendingQuestion:()=>perform(async(expected,captured,op)=>{if(!pending||pendingAccess!=='authorized'||pending.scope!==scope||pending.origin!==session.origin)throw new Error('recovery_locked');return reconcile(pending,expected,captured,op);}),
  revoke:async()=>{const attachment=state.review?.attachment;if(!attachment)return;const receipt=await request(token,'/api/commands',{type:'RevokeAttachment',commandId:crypto.randomUUID(),reviewId,attachmentId:attachment.attachmentId}) as Receipt;await refresh(receipt.revision);},
  diagnostics:()=>registry.diagnostics()
 };
};
export type ReviewBridge=ReturnType<typeof createReviewBridge>;
