import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {CEILINGS,canonical,frame,parseFrame,validateEnvelope,validateRequest} from './protocol.ts';
import type {AnalysisWorker,WorkerWitnessCheck,AnalysisWorkerWitness,WorkerEnvelope} from './contract.ts';

const witnesses=new WeakMap<object,{request:string;envelope:WorkerEnvelope}>();
const freeze=<T>(value:T):T=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
export const isAnalysisWorkerWitness:WorkerWitnessCheck=(value,request,envelope):value is AnalysisWorkerWitness=>{
 if(!value||typeof value!=='object')return false;const binding=witnesses.get(value);if(!binding||binding.envelope!==envelope)return false;
 try{return binding.request===canonical(request);}catch{return false;}
};
const identity=(pid:number):string|null=>{try{return execFileSync('/bin/ps',['-p',String(pid),'-o','lstart=','-o','pgid='],{encoding:'utf8',timeout:1000,maxBuffer:1024,env:{},stdio:['ignore','pipe','ignore']}).trim()||null;}catch{return null;}};
const groupExists=(pid:number)=>{try{process.kill(-pid,0);return true;}catch(error){return (error as NodeJS.ErrnoException).code!=='ESRCH';}};

export const runAnalysisWorker:AnalysisWorker=async(value,observations,options={})=>{
 const limits={...CEILINGS};for(const name of Object.keys(CEILINGS) as (keyof typeof CEILINGS)[]){const v=options[name];if(v!==undefined){if(!Number.isSafeInteger(v)||v<1||v>CEILINGS[name])throw Error('analysis_worker_limit');limits[name]=v as never;}}
 for(const path of [options.executable,options.entryPath])if(path!==undefined&&(typeof path!=='string'||!path.startsWith('/')||path.includes('\0')))throw Error('analysis_worker_owner_option');
 const request=validateRequest(value),requestKey=canonical(request),input=frame(request,limits.inputBytes);
 if(options.signal?.aborted||observations.cancelled())throw Error('analysis_worker_cancelled');
 const startedAt=Date.now();observations.recordProcess({ordinal:1,executable:'node',state:'requested'});
 return await new Promise((resolve,reject)=>{
  // Explicit allowlist: no NODE_OPTIONS, loader, inspector, credential or target environment.
  const child=spawn(options.executable??process.execPath,['--max-old-space-size=256','--experimental-strip-types',options.entryPath??fileURLToPath(new URL('./worker-entry.ts',import.meta.url))],{stdio:['pipe','pipe','pipe'],detached:true,env:{LANG:'C',TZ:'UTC',NO_COLOR:'1'}});
  let started=false,exited=false,closed=false,finished=false,journalLost=false,spawnFailed=false,ownedIdentity:string|null=null,reason:string|null=null,stdoutBytes=0,stderrBytes=0,exitCode:number|null=null,exitSignal:NodeJS.Signals|null=null;
  const chunks:Buffer[]=[];let killTimer:ReturnType<typeof setTimeout>|undefined,settleTimer:ReturnType<typeof setTimeout>|undefined;
  const cleanup=()=>{clearTimeout(deadline);clearInterval(poll);if(killTimer)clearTimeout(killTimer);if(settleTimer)clearTimeout(settleTimer);options.signal?.removeEventListener('abort',abort);};
  const finish=(unknown=false)=>{
   if(finished)return;finished=true;cleanup();let terminal=unknown||journalLost||(!closed&&started)||Boolean(child.pid&&groupExists(child.pid))?'termination_unknown':reason??(spawnFailed||exitCode!==0?'analysis_worker_failed':'ok');
   if(exited||!started){try{observations.recordProcess({ordinal:1,executable:'node',state:'exited',exitCode,signal:exitSignal,reason:terminal});}catch{terminal='termination_unknown';}}
   child.stdin.destroy();child.stdout.destroy();child.stderr.destroy();child.unref();
   if(terminal!=='ok'){reject(Error(terminal));return;}
   try{const envelope=freeze(validateEnvelope(parseFrame(Buffer.concat(chunks),limits.outputBytes),request));const witness=Object.freeze({}) as AnalysisWorkerWitness;witnesses.set(witness,{request:requestKey,envelope});resolve({envelope,witness});}catch(error){reject(Error(error instanceof Error&&/^analysis_worker_/.test(error.message)?error.message:'analysis_worker_validation'));}
  };
  const bound=()=>{if(!settleTimer)settleTimer=setTimeout(()=>finish(true),700);};
  const stop=(next:string)=>{
   if(finished)return;reason??=next;bound();if(exited||!started||!child.pid||!ownedIdentity||identity(child.pid)!==ownedIdentity)return;
   try{process.kill(-child.pid,'SIGTERM');}catch(error){/* Definitive close/group observations, never a sent signal, decide quiescence. */}
   if(!killTimer)killTimer=setTimeout(()=>{if(!finished&&!exited&&child.pid&&ownedIdentity&&identity(child.pid)===ownedIdentity){try{process.kill(-child.pid,'SIGKILL');}catch(error){/* Definitive close/group observations, never a sent signal, decide quiescence. */}}},250);
  };
  const abort=()=>stop('analysis_worker_cancelled');
  const deadline=setTimeout(()=>stop('analysis_worker_timeout'),Math.max(1,limits.timeoutMs-(Date.now()-startedAt)));
  const poll=setInterval(()=>{try{if(options.signal?.aborted||observations.cancelled())abort();}catch{journalLost=true;stop('analysis_worker_observation');}},25);
  options.signal?.addEventListener('abort',abort,{once:true});
  child.once('spawn',()=>{if(finished)return;started=true;ownedIdentity=child.pid?identity(child.pid):null;
   try{observations.recordProcess({ordinal:1,executable:'node',state:'started',...(child.pid?{pid:child.pid}:{}),...(ownedIdentity?{startIdentity:ownedIdentity}:{})});}catch{journalLost=true;stop('analysis_worker_observation');}
   if(options.signal?.aborted)abort();if(reason)stop(reason);
  });
  child.stdout.on('data',(chunk:Buffer)=>{if(finished||reason)return;stdoutBytes+=chunk.length;if(stdoutBytes>limits.outputBytes+4){stop('analysis_worker_output_limit');return;}chunks.push(chunk);
   if(stdoutBytes>=4){const header=Buffer.concat(chunks,4),length=header.readUInt32BE(0);if(length>limits.outputBytes)stop('analysis_worker_output_limit');else if(stdoutBytes>length+4)stop('analysis_worker_frame');}
  });
  child.stderr.on('data',(chunk:Buffer)=>{if(finished)return;stderrBytes+=chunk.length;if(stderrBytes>limits.stderrBytes)stop('analysis_worker_output_limit');});
  child.stdin.on('error',()=>{if(!finished)reason??='analysis_worker_failed';});
  child.once('error',()=>{spawnFailed=true;reason??='analysis_worker_failed';});
  child.once('exit',(code,signal)=>{if(finished)return;exited=true;exitCode=code;exitSignal=signal;bound();});
  child.once('close',(code,signal)=>{if(finished)return;closed=true;exitCode=code;exitSignal=signal;finish();});
  child.stdin.end(input);
 });
};
