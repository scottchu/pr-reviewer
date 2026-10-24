import {spawn,execFileSync} from 'node:child_process';
import type {Store,ImportGrant} from '../storage/public.ts';
import type {AcquisitionEffects,Command,CommandResult,IssueReason} from '../source-acquisition/public.ts';
const processIdentity=(pid:number):string|null=>{try{return execFileSync('/bin/ps',['-p',String(pid),'-o','lstart=','-o','pgid='],{encoding:'utf8',timeout:1000,maxBuffer:1024,stdio:['ignore','pipe','ignore']}).trim()||null;}catch{return null;}};
export const groupExists=(pid:number):boolean=>{try{process.kill(-pid,0);return true;}catch(error){return (error as NodeJS.ErrnoException).code!=='ESRCH';}};
export const createTrackedEffects=({imports,grant,executables={},phaseTimeoutMs=120000,signal}:{imports:Store['imports'];grant:ImportGrant;executables?:Partial<Record<Command['executable'],string>>;phaseTimeoutMs?:number;signal?:AbortSignal})=>{
 const phaseStarted=Date.now(),maxLaunches=imports.launchLimit(grant);let ordinal=0,confirmed=true,poisoned=false,running=false;
 const run:AcquisitionEffects['run']=async command=>{
  if(poisoned)throw new Error('termination_unknown');if(running)throw new Error('import_process_limit');
  if(signal?.aborted||imports.cancelled(grant))throw new Error('import_cancelled');
  const remaining=phaseTimeoutMs-(Date.now()-phaseStarted);if(remaining<=0||ordinal>=maxLaunches)throw new Error('import_phase_limit');
  const current=++ordinal;imports.recordProcess(grant,{ordinal:current,executable:command.executable,state:'requested'});running=true;
  const env:NodeJS.ProcessEnv={...process.env};for(const key of Object.keys(env))if(key.startsWith('GIT_'))delete env[key];
  Object.assign(env,{GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GH_PROMPT_DISABLED:'1',GLAB_CHECK_UPDATE:'false',GIT_LITERAL_PATHSPECS:'1',GIT_ATTR_NOSYSTEM:'1',GIT_PAGER:'cat',PAGER:'cat'});
  return await new Promise<CommandResult>((resolve,reject)=>{
   const child=spawn(executables[command.executable]??command.executable,[...command.args],{cwd:command.cwd,env,stdio:['ignore','pipe','pipe'],detached:true});
   let started=false,exited=false,finished=false,identity:string|null=null,reason:IssueReason|null=null,cancelled=false,bytes=0,spawnError=false,journalLost=false;
   const chunks:Buffer[]=[];let killTimer:ReturnType<typeof setTimeout>|undefined,observationTimer:ReturnType<typeof setTimeout>|undefined;
   const cleanup=()=>{clearTimeout(timeout);clearInterval(cancellation);if(killTimer)clearTimeout(killTimer);if(observationTimer)clearTimeout(observationTimer);};
   const unknown=()=>{if(finished)return;finished=true;running=false;poisoned=true;confirmed=false;cleanup();child.stdout.destroy();child.stderr.destroy();child.unref();reject(new Error('termination_unknown'));};
   const stop=(next:IssueReason|null,isCancel=false)=>{
    if(finished||exited)return;reason??=next;cancelled ||= isCancel;if(!observationTimer)observationTimer=setTimeout(unknown,700);
    if(!started||!child.pid||!identity||processIdentity(child.pid)!==identity){confirmed=false;return;}
    try{process.kill(-child.pid,'SIGTERM');}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')confirmed=false;}
    if(!killTimer)killTimer=setTimeout(()=>{if(!exited&&child.pid&&processIdentity(child.pid)===identity){try{process.kill(-child.pid,'SIGKILL');}catch{confirmed=false;}}},250);
   };
   const timeout=setTimeout(()=>stop('timeout'),Math.min(command.timeoutMs,remaining));
   const cancellation=setInterval(()=>{try{if(signal?.aborted||imports.cancelled(grant))stop(null,true);}catch{confirmed=false;stop(null,true);}},40);
   child.once('spawn',()=>{
    started=true;identity=child.pid?processIdentity(child.pid):null;
    if(!child.pid){journalLost=true;stop('command_failed');return;}
    try{imports.recordProcess(grant,{ordinal:current,executable:command.executable,state:'started',pid:child.pid,...(identity?{startIdentity:identity}:{})});}catch{journalLost=true;confirmed=false;stop('command_failed');}
   });
   const collect=(chunk:Buffer,stdout:boolean)=>{if(finished)return;bytes+=chunk.length;if(bytes>command.maxBytes){stop('output_limit');return;}if(stdout)chunks.push(chunk);};
   child.stdout.on('data',(chunk:Buffer)=>collect(chunk,true));child.stderr.on('data',(chunk:Buffer)=>collect(chunk,false));
   child.once('error',(error:NodeJS.ErrnoException)=>{spawnError=true;reason=error.code==='ENOENT'?'tool_missing':'command_failed';});
   child.once('close',(code,signal)=>{
    if(finished)return;exited=true;finished=true;cleanup();
    // The parent exit alone does not prove descendants in its owned group stopped.
    const childConfirmed=!journalLost&&(!started||Boolean(child.pid&&!groupExists(child.pid)));if(!childConfirmed)poisoned=true;confirmed=!poisoned&&childConfirmed;running=false;
    try{imports.recordProcess(grant,{ordinal:current,executable:command.executable,state:'exited',exitCode:code,signal,reason:cancelled?'cancelled':reason??(code===0?'ok':'command_failed')});}catch{confirmed=false;}
    if(!confirmed){reject(new Error('termination_unknown'));return;}
    if(cancelled){reject(new Error('import_cancelled'));return;}
    if(reason||spawnError||code!==0){resolve({kind:'unavailable',reason:reason??'command_failed'});return;}
    resolve({kind:'ok',stdout:Buffer.concat(chunks)});
   });
  });
 };
 return {run,terminationConfirmed:()=>confirmed&&!running};
};
