import {discoverChange} from '../source-acquisition/public.ts';
import type {AcquisitionEffects} from '../source-acquisition/public.ts';
import {acquirePreparedSnapshot,bindPreparedSnapshotToReview} from '../source-preparation/public.ts';
import type {PreparedSnapshotWitness} from '../source-preparation/public.ts';
import type {Store,ImportGrant} from '../storage/public.ts';
import {canonical} from '../domain/public.ts';
import type {Snapshot} from '../domain/public.ts';
import {createRegistry} from '../integration/registry.ts';
import {createTrackedEffects,groupExists} from './process.ts';
import type {ImportArtifacts} from '../import-artifacts/public.ts';
export type {ImportArtifacts} from '../import-artifacts/public.ts';
export const createImportRunner=(store:Store,artifacts:ImportArtifacts,options:{effects?:(grant:ImportGrant,signal:AbortSignal)=>AcquisitionEffects&{terminationConfirmed:()=>boolean}}={})=>{
 const imports=store.imports,owner=imports.beginOwner(),registry=createRegistry(),verified=new Map<string,{snapshot:Snapshot;witness:PreparedSnapshotWitness}>();
 let active=false,stopped=false,current:Promise<void>|null=null,abort:AbortController|null=null;
 const admission=registry.register('verified-import-result-to-admission','import-owner',()=>!stopped,()=>{
  for(const job of imports.ready(owner)){
   const prepared=verified.get(job.jobId);if(!prepared)continue;
   const witness=bindPreparedSnapshotToReview(prepared.witness,job.jobId,job.reviewId,prepared.snapshot);
   imports.admit(owner,job.jobId,prepared.snapshot,witness);
  }
 });
 const tick=async()=>{
  if(active||stopped)return;active=true;
  try{
   // Quiescence is observation only. The interrupted invocation is never replayed.
   for(const job of imports.unknown(owner)){
    const processes=job.invocations.at(-1)?.processes??[];
    if(processes.every(process=>process.state==='exited'&&(process.pid===undefined||!groupExists(process.pid))||process.state==='started'&&process.pid!==undefined&&!groupExists(process.pid)))imports.confirmQuiescent(owner,job.jobId);
   }
   admission.emit();
   while(!stopped){
    const claim=imports.claim(owner);if(!claim)break;
    const {job,grant}=claim,invocation=job.invocations.at(-1)!;
    abort=new AbortController();const effects=options.effects?.(grant,abort.signal)??createTrackedEffects({imports,grant,signal:abort.signal});let resultWriteStarted=false;
    try{
     if(invocation.phase==='discovery'){
      const discovery=await discoverChange(job.path,effects);if(!effects.terminationConfirmed())throw new Error('termination_unknown');imports.finishDiscovery(grant,discovery);
     }else{
      if(!job.candidate||!job.canonicalWorktree)throw new Error('source_unavailable');
      let retained:unknown=null;
      if(invocation.phase==='reverification'){
       if(!job.artifact)throw new Error('invalid_import_artifact');
       retained=await artifacts.read({reference:job.artifact,expectedJobId:job.jobId,expectedInvocationId:job.artifact.invocationId});
      }
      const result=await acquirePreparedSnapshot({jobId:job.jobId,reviewId:job.reviewId,worktree:job.canonicalWorktree,candidate:job.candidate},effects);
      if(!effects.terminationConfirmed())throw new Error('termination_unknown');
      if(result.kind!=='prepared')throw new Error(result.issues[0]?.reason??'source_unavailable');
      if(invocation.phase==='reverification'&&canonical(retained)!==canonical(result.value))throw new Error('retained_result_changed');
      resultWriteStarted=true;
      const reference=await artifacts.write({jobId:job.jobId,invocationId:invocation.invocationId,value:result.value});
      if(imports.finishResult(grant,reference)){verified.set(job.jobId,{snapshot:result.snapshot,witness:result.witness});admission.emit();}
     }
    }catch(error){
     const reason=error instanceof Error?error.message:'import_failed';
     try{imports.fail(grant,resultWriteStarted?'result_persistence_unknown':reason,!resultWriteStarted&&effects.terminationConfirmed());}catch{try{imports.fail(grant,'unresolved_process_observation',false);}catch{/* An already committed result/receipt remains authoritative. */}}
    }
   }
  }finally{active=false;}
 };
 const request=registry.register('import-request-to-runner','import-owner',()=>!stopped,()=>{if(active||stopped)return;current=tick();void current.catch(()=>{});});
 const timer=setInterval(()=>request.emit(),200);request.emit();
 return {wake:()=>request.emit(),idle:async()=>{await current;},diagnostics:()=>registry.diagnostics(),stop:async()=>{stopped=true;abort?.abort();clearInterval(timer);registry.dispose();await current;}};
};
