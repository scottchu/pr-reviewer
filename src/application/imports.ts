import {createRegistry} from '../integration/registry.ts';
import type {ImportCommand,ImportJob,ImportReceipt} from '../domain/public.ts';
export type ImportViewJob=Omit<ImportJob,'credentialReference'>;
type Intent=ImportCommand extends infer Command?Command extends ImportCommand?Omit<Command,'commandId'>:never:never;
export const createImportsBridge=()=>{
 let token='',state:{jobs:ImportViewJob[];error:string;authenticated:boolean;busy:boolean;uncertain:boolean}={jobs:[],error:'',authenticated:false,busy:false,uncertain:false};
 let pending:{command:ImportCommand;fingerprint:string}|null=null,disposed=false;
 const listeners=new Set<()=>void>(),registry=createRegistry();
 const publish=(next:typeof state)=>{state=next;for(const listener of listeners)listener();};
 const request=async(path:string,body?:unknown)=>{const response=await fetch(path,{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});const value=await response.json() as unknown;if(!response.ok)throw Object.assign(new Error(String((value as {error?:string}).error??'request_failed')),{definitive:[400,401,403].includes(response.status)});return value;};
 const refresh=async()=>{try{const jobs=await request('/api/imports') as ImportViewJob[];if(!disposed)publish({...state,jobs,authenticated:true});}catch(error){if(!disposed)publish({...state,error:error instanceof Error?error.message:'request_failed'});}};
 const send=async(intent:Intent):Promise<ImportReceipt>=>{
  if(state.busy)throw new Error('submission_in_progress');const fingerprint=JSON.stringify(intent);if(pending&&pending.fingerprint!==fingerprint)throw new Error('import_submission_unknown: retry the unchanged request');
  pending??={command:{...intent,commandId:crypto.randomUUID()} as ImportCommand,fingerprint};publish({...state,busy:true,error:''});
  try{const receipt=await request('/api/imports/commands',pending.command) as ImportReceipt;pending=null;publish({...state,uncertain:false});if(receipt.state==='rejected')throw new Error(receipt.error??'rejected');await refresh();return receipt;}
  catch(error){if(error instanceof Error&&'definitive' in error&&error.definitive)pending=null;publish({...state,uncertain:Boolean(pending),error:error instanceof Error?error.message:'request_failed'});throw error;}
  finally{publish({...state,busy:false});}
 };
 return {getSnapshot:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener);},importFrom:async(path:string,review?:import('../domain/public.ts').Review)=>send({type:'RequestImport',path,...(review?{target:{reviewId:review.reviewId,expectedCurrentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId}}:{})}),login:async(value:string)=>{token=value.trim();disposed=false;await refresh();},send,retry:async()=>{if(!pending)throw new Error('invalid_request');const {commandId,...intent}=pending.command;return send(intent as Intent);},connect:()=>{disposed=false;const route=registry.register('import-job-committed-to-authorized-view','local-owner',()=>Boolean(token)&&!state.busy,()=>{void refresh();});const timer=setInterval(()=>route.emit(),500);return()=>{disposed=true;clearInterval(timer);route.dispose();};},diagnostics:()=>registry.diagnostics()};
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
