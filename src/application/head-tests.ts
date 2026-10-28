import {headTestCanonical,headTestTargetsSchema,headTestViewSchema,headTestReceiptSchema,headTestArtifactViewSchema} from '../domain/public.ts';
import type {HeadTestScope,HeadTestTargets,HeadTestJob,HeadTestReceipt,HeadTestArtifact} from '../domain/public.ts';
import {localOwnerSession,accessHeaders} from './local-access.ts';
import {credentialScope} from './private-session.ts';
import {createRegistry} from '../integration/registry.ts';
import {createTestIntentSession} from './head-test-session.ts';
import type {TestRecovery,TestIntentSession} from './head-test-session.ts';
export type TestArtifactState=Readonly<{jobId:string;artifact:HeadTestArtifact;text:string;offset:number;complete:boolean;limited:boolean;busy:boolean;error:string}>;
export type HeadTestsState=Readonly<{scope:HeadTestScope|null;catalog:HeadTestTargets|null;jobs:readonly HeadTestJob[];nextCursor:string|null;selectedJob:HeadTestJob|null;receipt:HeadTestReceipt|null;recovery:TestRecovery|null;busy:boolean;reading:boolean;error:string;artifact:TestArtifactState|null}>;
type Slot={controller:AbortController;timer:ReturnType<typeof setTimeout>;generation:number};
const message=(error:unknown)=>error instanceof Error?error.message:'test_request_failed';
const sameScope=(a:HeadTestScope,b:HeadTestScope)=>a.reviewId===b.reviewId&&a.snapshotId===b.snapshotId;
export const createHeadTestsBridge=(reviewId:string,options:{session?:TestIntentSession;fetch?:(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>Promise<Response>;pollMs?:number;requestMs?:number}={})=>{
 let access=localOwnerSession;
 const privateSession=(ownerScope=localOwnerSession)=>options.session??createTestIntentSession(reviewId,{ownerScope});
 let session=privateSession();
 const transport=options.fetch??((...args:Parameters<typeof fetch>)=>fetch(...args)),registry=createRegistry(),listeners=new Set<()=>void>();
 let state:HeadTestsState={scope:null,catalog:null,jobs:[],nextCursor:null,selectedJob:null,receipt:null,recovery:null,busy:false,reading:false,error:'',artifact:null};
 let generation=0,disposed=false,connection:object|null=null,storageBlocked=false,decoder:TextDecoder|null=null,artifactChunks:Uint8Array[]=[];
 let catalogSlot:Slot|null=null,jobSlot:Slot|null=null,mutationSlot:Slot|null=null,artifactSlot:Slot|null=null;
 let focus:{scope:HeadTestScope;jobId:string;minimum:number}|null=null;
 const publish=(patch:Partial<HeadTestsState>)=>{state={...state,...patch};for(const listener of listeners)listener();};
 try{state={...state,recovery:session.read()};}catch(error){storageBlocked=true;state={...state,error:message(error)};}
 const abort=(slot:Slot|null)=>{if(slot){clearTimeout(slot.timer);slot.controller.abort();}};
 const createSlot=():Slot=>{const controller=new AbortController();return {controller,generation,timer:setTimeout(()=>controller.abort(new Error('test_request_timeout')),options.requestMs??10000)};};
 const current=(slot:Slot)=>!disposed&&slot.generation===generation&&!slot.controller.signal.aborted;
 const request=async(path:string,body:unknown,slot:Slot)=>{
  const response=await transport(path,{method:'POST',headers:{...accessHeaders(access),'Content-Type':'application/json'},body:JSON.stringify(body),signal:slot.controller.signal});
  const value=await response.json() as unknown;
  if(!response.ok){const error=new Error(value&&typeof value==='object'&&'error' in value?String(value.error):'test_request_failed');throw Object.assign(error,{definitive:[400,401,403,404,409].includes(response.status)});}
  return value;
 };
 const digest=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes).buffer)),value=>value.toString(16).padStart(2,'0')).join('');
 const validJob=async(job:HeadTestJob,scope:HeadTestScope,id?:string,minimum=0)=>{
  if(!sameScope(job,scope)||(id!==undefined&&job.jobId!==id)||job.jobRevision<minimum)throw new Error('test_job_mismatch');
  if(state.catalog&&sameScope(state.catalog,scope)&&job.headSha!==state.catalog.headSha)throw new Error('test_job_mismatch');
  if(job.result){const {resultId,...body}=job.result,intent=body.intent;
   if(body.jobId!==job.jobId||body.invocationId!==job.invocations.at(-1)?.invocationId||body.state!==job.state||!sameScope(intent,job)||intent.actorId!==job.actorId||intent.repository!==job.repository||intent.baseSha!==job.baseSha||intent.headSha!==job.headSha||intent.targetDigest!==job.target.digest||intent.qualificationId!==(job.qualificationId??null)||await digest(new TextEncoder().encode(headTestCanonical(body)))!==resultId)throw new Error('test_result_mismatch');
  }
 };
 const readJob=async(target=focus)=>{
  if(!target||disposed)return;abort(jobSlot);const slot=createSlot();jobSlot=slot;
  try{
   const view=headTestViewSchema.parse(await request('/api/tests/jobs',{...target.scope,jobId:target.jobId,minimumJobRevision:target.minimum},slot));
   if(!sameScope(view,target.scope)||!view.selectedJob)throw new Error('test_job_mismatch');await validJob(view.selectedJob,target.scope,target.jobId,target.minimum);
   if(!current(slot)||jobSlot!==slot||focus!==target)return;
   const previous=state.selectedJob;if(previous&&previous.jobId===view.selectedJob.jobId&&previous.jobRevision>view.selectedJob.jobRevision)throw new Error('test_job_revision_regressed');
   const jobs=sameScope(view.selectedJob,state.scope??target.scope)&&state.scope?[...state.jobs.filter(job=>job.jobId!==view.selectedJob!.jobId),view.selectedJob]:state.jobs;
   publish({selectedJob:view.selectedJob,jobs,error:storageBlocked||state.recovery?state.error:''});
   const pending=state.recovery;
   if(pending?.receipt&&pending.receipt.jobId===target.jobId&&sameScope(pending.scope,target.scope)&&view.selectedJob.jobRevision>=pending.receipt.jobRevision){session.clear();publish({recovery:null});}
  }catch(error){if(!disposed&&slot.generation===generation&&jobSlot===slot)publish({error:message(error)});}
  finally{clearTimeout(slot.timer);if(jobSlot===slot)jobSlot=null;}
 };
 const refresh=async(cursor?:string)=>{
  const scope=state.scope;if(disposed||!scope)return;abort(catalogSlot);const slot=createSlot();catalogSlot=slot;publish({reading:true});
  try{
   const catalog=headTestTargetsSchema.parse(await request('/api/tests/targets',scope,slot));
   if(!sameScope(catalog,scope))throw new Error('test_catalog_mismatch');
   const view=headTestViewSchema.parse(await request('/api/tests/jobs',{...scope,...(cursor?{cursor}:{})},slot));
   if(!sameScope(view,scope))throw new Error('test_history_mismatch');for(const job of view.jobs)await validJob(job,scope);
   if(!current(slot)||catalogSlot!==slot)return;
   const merged=new Map(state.jobs.map(job=>[job.jobId,job]));for(const job of view.jobs){const old=merged.get(job.jobId);if(!old||old.jobRevision<=job.jobRevision)merged.set(job.jobId,job);}
   publish({catalog,jobs:[...merged.values()],nextCursor:cursor?view.nextCursor:state.jobs.length>view.jobs.length?state.nextCursor:view.nextCursor,error:storageBlocked||state.recovery?state.error:''});
  }catch(error){if(!disposed&&slot.generation===generation&&catalogSlot===slot)publish({error:message(error)});}
  finally{clearTimeout(slot.timer);if(catalogSlot===slot){catalogSlot=null;publish({reading:false});}}
 };
 const stopArtifact=()=>{abort(artifactSlot);artifactSlot=null;decoder=null;artifactChunks=[];};
 const select=async(snapshotId:string)=>{
  generation++;disposed=false;abort(catalogSlot);abort(jobSlot);abort(mutationSlot);catalogSlot=jobSlot=mutationSlot=null;stopArtifact();focus=null;
  publish({scope:{reviewId,snapshotId},catalog:null,jobs:[],nextCursor:null,selectedJob:null,receipt:null,artifact:null,busy:false,reading:false,error:storageBlocked||state.recovery?state.error:''});
  const pending=state.recovery;if(pending?.receipt&&sameScope(pending.scope,state.scope!)){focus={scope:pending.scope,jobId:pending.receipt.jobId,minimum:pending.receipt.jobRevision};publish({receipt:pending.receipt});await Promise.all([refresh(),readJob()]);}else await refresh();
 };
 const send=async(pending:TestRecovery)=>{
  if(disposed)throw new Error('test_connection_disposed');if(state.busy)throw new Error('test_submission_in_progress');
  if(storageBlocked)throw new Error(state.error||'test_storage_unavailable');
  if(!state.recovery){session.save(pending);publish({recovery:pending});}
  const slot=createSlot();mutationSlot=slot;publish({busy:true,error:''});
  try{
   let receipt=pending.receipt;
   if(!receipt){
    receipt=headTestReceiptSchema.parse(await request('/api/commands',pending.command,slot));
    if(receipt.commandId!==pending.command.commandId||!sameScope(receipt,pending.scope)||(pending.command.type==='CancelTest'&&receipt.jobId!==pending.command.jobId))throw new Error('test_receipt_mismatch');
    if(!current(slot)||mutationSlot!==slot)throw new Error('test_submission_superseded');
    const accepted={...pending,receipt};session.save(accepted);publish({recovery:accepted});
   }
   if(!current(slot)||mutationSlot!==slot)throw new Error('test_submission_superseded');
   focus={scope:pending.scope,jobId:receipt.jobId,minimum:receipt.jobRevision};stopArtifact();publish({receipt,artifact:null});await readJob();
   return receipt;
  }catch(error){
   if(!disposed&&slot.generation===generation&&mutationSlot===slot){
    if(error instanceof Error&&'definitive' in error&&error.definitive){try{session.clear();publish({recovery:null});}catch(storageError){publish({error:message(storageError)});throw storageError;}}
    publish({error:message(error)});
   }
   throw error;
  }finally{clearTimeout(slot.timer);if(mutationSlot===slot){mutationSlot=null;publish({busy:false});}}
 };
 const run=async(targetId:string)=>{
  if(state.recovery)throw new Error('test_intent_pending');const catalog=state.catalog,target=catalog?.targets.find(item=>item.targetId===targetId);
  if(!catalog||!state.scope||!sameScope(catalog,state.scope)||target?.availability!=='available')throw new Error('test_target_unavailable');
  return send({scope:state.scope,command:{type:'RequestTest',commandId:crypto.randomUUID(),...state.scope,targetId,expectedTargetRevision:target.revision},receipt:null});
 };
 const cancel=async()=>{if(state.recovery)throw new Error('test_intent_pending');const job=state.selectedJob;if(!job)throw new Error('test_job_unavailable');return send({scope:{reviewId:job.reviewId,snapshotId:job.snapshotId},command:{type:'CancelTest',commandId:crypto.randomUUID(),jobId:job.jobId,expectedJobRevision:job.jobRevision},receipt:null});};
 const selectJob=async(jobId:string)=>{const job=state.jobs.find(item=>item.jobId===jobId);if(!job)throw new Error('test_job_unavailable');focus={scope:{reviewId:job.reviewId,snapshotId:job.snapshotId},jobId,minimum:job.jobRevision};stopArtifact();publish({selectedJob:job,artifact:null});await readJob();};
 const loadArtifact=async()=>{
  const selection=state.artifact,job=state.selectedJob,target=focus;if(!selection||!job||!target||selection.busy||selection.complete||selection.limited)return;
  abort(artifactSlot);const slot=createSlot();artifactSlot=slot;publish({artifact:{...selection,busy:true,error:''}});
  try{
   const page=headTestArtifactViewSchema.parse(await request('/api/tests/artifact',{...target.scope,jobId:job.jobId,artifactId:selection.artifact.artifactId,offset:selection.offset,length:Math.min(65536,1048576-selection.offset)},slot));
   const binary=atob(page.data),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
   if(page.jobId!==job.jobId||page.artifactId!==selection.artifact.artifactId||page.sha256!==selection.artifact.sha256||page.totalBytes!==selection.artifact.bytes||page.offset!==selection.offset||btoa(binary)!==page.data||page.bytes!==bytes.length||page.nextOffset!==page.offset+page.bytes||page.complete!==(page.nextOffset===page.totalBytes)||(!page.complete&&page.bytes===0))throw new Error('test_artifact_mismatch');
   if(!current(slot)||artifactSlot!==slot||focus!==target||!decoder)return;
   const chunks=[...artifactChunks,bytes];
   if(page.complete){const joined=new Uint8Array(page.totalBytes);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}if(await digest(joined)!==page.sha256)throw new Error('test_artifact_integrity_error');}
   if(!current(slot)||artifactSlot!==slot||focus!==target||!decoder)return;artifactChunks=chunks;
   const text=selection.text+decoder.decode(bytes,{stream:!page.complete});publish({artifact:{...selection,text,offset:page.nextOffset,complete:page.complete,limited:!page.complete&&page.nextOffset>=1048576,busy:false,error:''}});
  }catch(error){if(!disposed&&slot.generation===generation&&artifactSlot===slot)publish({artifact:{...selection,busy:false,error:message(error)}});}
  finally{clearTimeout(slot.timer);if(artifactSlot===slot)artifactSlot=null;}
 };
 const selectArtifact=async(artifactId:string)=>{const job=state.selectedJob,artifact=job?.result?.artifacts.find(item=>item.artifactId===artifactId);if(!job||!artifact)throw new Error('test_artifact_unavailable');stopArtifact();decoder=new TextDecoder('utf-8');publish({artifact:{jobId:job.jobId,artifact,text:'',offset:0,complete:false,limited:false,busy:false,error:''}});await loadArtifact();};
 const lock=()=>{generation++;for(const slot of [catalogSlot,jobSlot,mutationSlot,artifactSlot])abort(slot);catalogSlot=jobSlot=mutationSlot=artifactSlot=null;focus=null;decoder=null;artifactChunks=[];publish({scope:null,catalog:null,jobs:[],selectedJob:null,artifact:null,busy:false,reading:false});};
 const setAccess=async(value:string)=>{if(value===access)return;lock();access=value;storageBlocked=true;publish({recovery:null,error:'test_access_initializing'});const expected=generation,ownerScope=value===localOwnerSession?localOwnerSession:await credentialScope(typeof location==='undefined'?'local':location.origin,value);if(expected!==generation||disposed)return;access=value;session=privateSession(ownerScope);storageBlocked=false;try{publish({recovery:session.read(),error:''});}catch(error){storageBlocked=true;publish({recovery:null,error:message(error)});}};
 const connect=()=>{
  if(connection)throw new Error('duplicate_route');disposed=false;const owned={};connection=owned;
  const route=registry.register('head-test-committed-to-authorized-view',reviewId,()=>connection===owned&&!disposed&&!state.busy,()=>{if(!catalogSlot)void refresh();if(focus&&!jobSlot)void readJob();});
  const timer=setInterval(()=>route.emit(),options.pollMs??500);
  return()=>{if(connection!==owned)return;connection=null;disposed=true;generation++;clearInterval(timer);route.dispose();for(const slot of [catalogSlot,jobSlot,mutationSlot,artifactSlot])abort(slot);catalogSlot=jobSlot=mutationSlot=artifactSlot=null;decoder=null;artifactChunks=[];publish({busy:false,reading:false,artifact:state.artifact?{...state.artifact,busy:false}:null});};
 };
 return {getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},select,lock,setAccess,refresh,loadMore:()=>state.nextCursor?refresh(state.nextCursor):Promise.resolve(),run,cancel,recover:()=>{if(!state.recovery)throw new Error('test_recovery_unavailable');return send(state.recovery);},selectJob,selectArtifact,loadArtifact,connect,diagnostics:()=>registry.diagnostics()};
};
export type HeadTestsBridge=ReturnType<typeof createHeadTestsBridge>;
