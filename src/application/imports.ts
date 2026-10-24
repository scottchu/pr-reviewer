import {createRegistry} from '../integration/registry.ts';
import type {ImportCommand,ImportJob,ImportReceipt} from '../domain/public.ts';
export type ImportViewJob=Omit<ImportJob,'credentialReference'>;
type Intent=ImportCommand extends infer Command?Command extends ImportCommand?Omit<Command,'commandId'>:never:never;
type ImportView={jobs:ImportViewJob[];error:string;authenticated:boolean;busy:boolean;uncertain:boolean};
type Owner={generation:number;token:string};
type Pending={command:ImportCommand;fingerprint:string};

export const createImportsBridge=()=>{
 const emptyView=():ImportView=>({jobs:[],error:'',authenticated:false,busy:false,uncertain:false});
 let token='',generation=0,disposed=false,state=emptyView();
 let pending:Pending|null=null;
 let activeCommand:{owner:Owner;submission:Pending}|null=null;
 let inflight:{owner:Owner;controller:AbortController}|null=null;
 let connection:object|null=null;
 const listeners=new Set<()=>void>(),registry=createRegistry();
 const publish=(next:ImportView)=>{state=next;for(const listener of listeners)listener();};
 const owner=():Owner=>({generation,token});
 const owns=(expected:Owner)=>!disposed&&expected.generation===generation&&expected.token===token;
 const abortRead=()=>{const previous=inflight;inflight=null;previous?.controller.abort();};
 const request=async(expected:Owner,path:string,body?:unknown,signal?:AbortSignal)=>{
  const response=await fetch(path,{
   headers:{Authorization:`Bearer ${expected.token}`,'Content-Type':'application/json'},
   ...(body?{method:'POST',body:JSON.stringify(body)}:{}),...(signal?{signal}:{})
  });
  const value=await response.json() as unknown;
  if(!response.ok)throw Object.assign(new Error(String((value as {error?:string}).error??'request_failed')),{definitive:[400,401,403].includes(response.status)});
  return value;
 };
 const refresh=async(expected:Owner,mode:'explicit'|'poll'='explicit')=>{
  if(!owns(expected)||!expected.token||(mode==='poll'&&(inflight||state.busy)))return;
  abortRead();
  const read={owner:expected,controller:new AbortController()};inflight=read;
  const current=()=>owns(read.owner)&&inflight===read&&!read.controller.signal.aborted;
  try{
   const jobs=await request(expected,'/api/imports',undefined,read.controller.signal) as ImportViewJob[];
   if(current())publish({...state,jobs,error:'',authenticated:true});
  }catch(error){
   if(current())publish({...state,error:error instanceof Error?error.message:'request_failed'});
  }finally{if(inflight===read)inflight=null;}
 };
 const send=async(intent:Intent):Promise<ImportReceipt>=>{
  if(disposed)throw new Error('connection_disposed');
  if(state.busy)throw new Error('submission_in_progress');
  const fingerprint=JSON.stringify(intent);
  if(pending&&pending.fingerprint!==fingerprint)throw new Error('import_submission_unknown: retry the unchanged request');
  pending??={command:{...intent,commandId:crypto.randomUUID()} as ImportCommand,fingerprint};
  const operation={owner:owner(),submission:pending};activeCommand=operation;
  const current=()=>owns(operation.owner)&&activeCommand===operation;
  // The command's explicit readback replaces any older poll, never vice versa.
  abortRead();
  publish({...state,busy:true,error:''});
  try{
   if(!current())throw new Error('submission_superseded');
   const receipt=await request(operation.owner,'/api/imports/commands',operation.submission.command) as ImportReceipt;
   if(current()){
    if(pending===operation.submission)pending=null;
    publish({...state,uncertain:false});
   }
   if(receipt.state==='rejected')throw new Error(receipt.error??'rejected');
   if(current())await refresh(operation.owner);
   return receipt;
  }catch(error){
   if(current()){
    if(error instanceof Error&&'definitive' in error&&error.definitive&&pending===operation.submission)pending=null;
    publish({...state,uncertain:Boolean(pending),error:error instanceof Error?error.message:'request_failed'});
   }
   throw error;
  }finally{
   if(current()){activeCommand=null;publish({...state,busy:false});}
  }
 };
 const connect=()=>{
  const owned={};
  const route=registry.register('import-job-committed-to-authorized-view','local-owner',()=>connection===owned&&Boolean(token)&&!state.busy,()=>{void refresh(owner(),'poll');});
  connection=owned;disposed=false;
  const timer=setInterval(()=>route.emit(),500);route.emit();
  let active=true;
  return()=>{
   if(!active)return;active=false;clearInterval(timer);route.dispose();
   if(connection!==owned)return;
   connection=null;disposed=true;generation++;abortRead();activeCommand=null;
   // A dispatched command may have committed. Retain its exact retry intent
   // for this credential, without publishing its eventual stale completion.
   if(state.busy)publish({...state,busy:false,uncertain:Boolean(pending)});
  };
 };
 return {
  getSnapshot:()=>state,
  subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener);},
  importFrom:async(path:string,review?:import('../domain/public.ts').Review)=>send({type:'RequestImport',path,...(review?{target:{reviewId:review.reviewId,expectedCurrentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId}}:{})}),
  login:async(value:string)=>{
   generation++;token=value.trim();disposed=false;abortRead();pending=null;activeCommand=null;
   publish(emptyView());await refresh(owner());
  },
  send,
  retry:async()=>{if(!pending)throw new Error('invalid_request');const {commandId,...intent}=pending.command;return send(intent as Intent);},
  connect,
  diagnostics:()=>registry.diagnostics()
 };
};

export type ImportAction={id:string;label:string}&({kind:'command';intent:Intent}|{kind:'open';reviewId:string});
export const describeImportJobs=(jobs:readonly ImportViewJob[],review:import('../domain/public.ts').Review)=>{
 const currentTarget={reviewId:review.reviewId,expectedCurrentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId};
 return jobs.map(job=>{
  const actions:ImportAction[]=[];
  const command=(id:string,label:string,intent:Intent):ImportAction=>({kind:'command',id,label,intent});
  if(['queued','discovering','choosing','acquisition_queued','acquiring','reverify_queued','reverifying','result_ready'].includes(job.state))actions.push(command('cancel','Request cancellation',{type:'CancelImport',jobId:job.jobId}));
  if(['needs_reverification','admission_conflict'].includes(job.state))actions.push(command('reverify','Re-verify retained result',{type:'ReverifyImportResult',jobId:job.jobId}));
  if(job.state==='admission_conflict')actions.push(command('admit','Admit against this review’s current snapshot',{type:'AdmitImportResult',jobId:job.jobId,target:currentTarget}));
  if(job.state==='admitted')actions.push({kind:'open',id:'open',label:'Open imported review',reviewId:job.reviewId});
  const choices=job.state==='choosing'?job.candidates.map((candidate,index)=>{
   const existing=job.existingReviews.filter(item=>item.candidateIndex===undefined||item.candidateIndex===index),choices:ImportAction[]=existing.map(item=>command(`continue:${item.reviewId}`,`Continue ${item.reviewId} at ${item.currentSnapshotId.slice(0,12)}`,{type:'ChooseImportCandidate',jobId:job.jobId,discoveryRevision:job.discoveryRevision,candidateIndex:index,target:{reviewId:item.reviewId,expectedCurrentSnapshotId:item.currentSnapshotId}}));
   if(!existing.length)choices.unshift(command('create',`Create review for change ${candidate.number}`,{type:'ChooseImportCandidate',jobId:job.jobId,discoveryRevision:job.discoveryRevision,candidateIndex:index}));
   return {id:String(index),label:`${candidate.provider} · ${candidate.targetProject} #${candidate.number}`,href:candidate.url,detail:`${candidate.sourceProject}:${candidate.sourceBranch} → ${candidate.targetBranch}`,comparison:`Base ${candidate.baseSha} → Head ${candidate.headSha}`,actions:choices};
  }):[];
  const detail=job.state==='unknown'?'The previous invocation is uncertain and is not retried. New acquisition waits until its effects are proven stopped; saved discussion remains usable.':job.state==='admission_conflict'?'The source result is retained. Choose a new admission attempt; existing receipts and history remain intact.':undefined;
  return {id:job.jobId,title:job.candidate?`${job.candidate.provider} · ${job.candidate.targetProject} #${job.candidate.number}`:job.path,status:`${job.state.replaceAll('_',' ')}${job.reason?` · ${job.reason}`:''}`,...(detail?{detail}:{}),...(job.candidate?{comparison:`Base ${job.candidate.baseSha} → Head ${job.candidate.headSha}`} :{}),choices,actions,evidence:[`Job ${job.jobId} · revision ${job.jobRevision}. ${job.invocations.length} invocations · ${job.invocations.reduce((n,invocation)=>n+invocation.processes.length,0)} process observations.`,...job.invocations.map(invocation=>`${invocation.phase}: ${invocation.state} · ${invocation.processes.filter(process=>process.state==='exited').length}/${invocation.processes.length} observed exits`),...(job.admission?[`Admission ${job.admission.state} · ${job.admission.error??`review revision ${String(job.admission.result.reviewRevision)}`}`]:[])]};
 });
};
