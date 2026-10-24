import {createHeadOutputBudget} from './output.ts';
import type {HeadOutputBudget} from './output.ts';
import {spawn,execFileSync} from 'node:child_process';
import {realpath,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestCanonical} from '../domain/public.ts';
import {groupExists} from '../import-jobs/public.ts';
import type {HeadTestJournal,HeadTestProcess} from '../storage/public.ts';
import {headDigest} from './source.ts';
import type {HeadGitRead,HeadGitRequest} from './source.ts';
import {observeHeadTestProcessQuiescence} from './evidence.ts';
import type {HeadTestQuiescenceWitness} from './evidence.ts';
type Observer=Readonly<{
 journal:()=>HeadTestJournal; control:()=>Readonly<{authorized:boolean;cancelled:boolean;stopReason:string|null}>;
 recordStop:(reason:string)=>void;
 recordProcess:(observation:HeadTestProcess,prior?:HeadTestQuiescenceWitness)=>Readonly<{disposition:'recorded'|'duplicate'}>;
}>;
const git='/opt/homebrew/bin/git',bunDirectory='/Users/scottchu/.asdf/installs/bun/1.4.2/bin';
const identity=(pid:number):string|null=>{try{return execFileSync('/bin/ps',['-p',String(pid),'-o','lstart=','-o','pgid='],{encoding:'utf8',timeout:1000,maxBuffer:1024,env:{LANG:'C',LC_ALL:'C',TZ:'UTC'},stdio:['ignore','pipe','ignore']}).trim()||null;}catch{return null;}};
export const headTestEnvironment=(root:string):NodeJS.ProcessEnv=>({LANG:'C',LC_ALL:'C',TZ:'UTC',CI:'1',NO_COLOR:'1',PATH:bunDirectory,HOME:join(root,'home'),TMPDIR:join(root,'tmp'),XDG_CONFIG_HOME:join(root,'config'),XDG_CACHE_HOME:join(root,'cache')});
const oid=/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const vector=(request:HeadGitRequest,head:string):{args:string[];input:Buffer|null;maximum:number}=>{
 if(request.role==='batch'){
  if(request.objectIds.length<1||request.objectIds.length>8192||request.objectIds.some(id=>!oid.test(id))||new Set(request.objectIds).size!==request.objectIds.length)throw new Error('invalid_git_data_intent');
  const input=Buffer.from(request.objectIds.map(id=>`${id}\n`).join(''));if(input.length!==request.inputBytes||headDigest(input)!==request.inputDigest)throw new Error('invalid_git_data_intent');
  return {args:['cat-file','--batch'],input,maximum:64*1024*1024+request.objectIds.length*129};
 }
 if(!oid.test(request.objectId)||(request.role==='commit'||request.role==='listing')&&request.objectId!==head)throw new Error('source_identity_conflict');
 return {args:request.role==='listing'?['ls-tree','-rlz',request.objectId]:['cat-file',request.role,request.objectId],input:null,maximum:8*1024*1024};
};
/** Fixed private Git roles only. A stream must be consumed or closed to settle its process. */
export const createHeadGitReader=({repository,headSha,ownedRoot,observer,outputBudget=createHeadOutputBudget()}:{repository:string;headSha:string;ownedRoot:string;observer:Observer;outputBudget?:HeadOutputBudget}):HeadGitRead=>{
 let active=false,poisoned=false;const phaseStarted=Date.now();
 const read:HeadGitRead=async request=>{
  const spec=vector(request,headSha);
  return (async function*(){
   if(poisoned)throw new Error('test_process_poisoned');if(active)throw new Error('test_process_active');active=true;
   try{
    const root=await realpath(ownedRoot),repo=await realpath(repository);if(!(await lstat(join(repo,'.git'))).isDirectory())throw new Error('source_unavailable');
    for(const name of ['empty','home','tmp','config','cache']){const path=join(root,name),stat=await lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('environment_unavailable');}
    const control=observer.control();if(!control.authorized||control.cancelled||control.stopReason)throw new Error(control.cancelled?'test_cancelled':'test_stopped');
    const remaining=30000-(Date.now()-phaseStarted);if(remaining<=0)throw new Error('prepare_deadline');
    const args=['--no-optional-locks','--no-lazy-fetch','--literal-pathspecs','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','-c','protocol.allow=never',`--git-dir=${join(repo,'.git')}`,...spec.args];
    const env={...headTestEnvironment(root),GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GIT_NO_REPLACE_OBJECTS:'1',GIT_NO_LAZY_FETCH:'1',GIT_LITERAL_PATHSPECS:'1',GIT_ATTR_NOSYSTEM:'1'};
    const journal=observer.journal(),ordinal=(journal.invocation.processes?.length??0)+1,prior=observeHeadTestProcessQuiescence(journal);
    const requested:HeadTestProcess={ordinal,role:'git_prepare',state:'requested',intentDigest:headDigest(headTestCanonical({executable:git,args,cwd:join(root,'empty'),env,inputDigest:spec.input?headDigest(spec.input):null})),inputCount:request.role==='batch'?request.objectIds.length:0,inputBytes:spec.input?.length??0};
    const ack=observer.recordProcess(requested,...(prior?[prior]:[]));if(ack.disposition!=='recorded')throw new Error('test_launch_already_recorded');
    const attemptedAt=new Date().toISOString();let startedAt:string|null=null;const execution=(exitedAt:string|null)=>({executable:'<fixed-git>',argv:args.map(arg=>arg.replaceAll(repo,'<source-repository>')),cwd:'<owned-root>/empty',attemptedAt,startedAt,exitedAt});
    const child=spawn(git,args,{cwd:join(root,'empty'),env,detached:true,stdio:['pipe','pipe','pipe']});
    let started=false,closed=false,spawnError=false,journalFailed=false,observedIdentity:string|null=null,reason:string|null=null,stdoutBytes=0;
    let exitCode:number|null=null,exitSignal:NodeJS.Signals|null=null,kill:ReturnType<typeof setTimeout>|undefined,grace:ReturnType<typeof setTimeout>|undefined;
    let resolveClose:()=>void=()=>{};const completion=new Promise<void>(resolve=>{resolveClose=resolve;});
    const stop=(next:string)=>{
     if(!reason){reason=next;try{observer.recordStop(next);}catch{journalFailed=true;}}if(closed)return;
     if(!grace)grace=setTimeout(()=>{child.stdout.destroy(new Error('termination_unknown'));child.stderr.destroy();child.stdin.destroy();child.unref();resolveClose();},700);
     if(!started||!child.pid||!observedIdentity||identity(child.pid)!==observedIdentity)return;
     try{process.kill(-child.pid,'SIGTERM');}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')reason='termination_unknown';}
     if(!kill)kill=setTimeout(()=>{if(!closed&&child.pid&&observedIdentity&&identity(child.pid)===observedIdentity){try{process.kill(-child.pid,'SIGKILL');}catch{reason='termination_unknown';}}},250);
    };
    child.once('spawn',()=>{started=true;startedAt=new Date().toISOString();observedIdentity=child.pid?identity(child.pid):null;try{observer.recordProcess({...requested,state:'started',execution:execution(null),...(child.pid?{pid:child.pid}:{}),...(observedIdentity?{startIdentity:observedIdentity}:{})});}catch{journalFailed=true;stop('journal_write_failed');}});
    child.once('error',()=>{spawnError=true;reason??='source_unavailable';});
    child.stdin.on('error',()=>{if(!closed)stop('git_input_failed');});
    child.stderr.on('data',(chunk:Buffer)=>{if(!outputBudget.append('git_prepare','stderr',chunk))stop('output_limit');});
    child.once('close',(code,signal)=>{
     closed=true;exitCode=code;exitSignal=signal;
     try{observer.recordProcess({...requested,state:'exited',execution:execution(new Date().toISOString()),...(child.pid?{pid:child.pid}:{}),...(observedIdentity?{startIdentity:observedIdentity}:{}),...(!started&&spawnError&&child.pid===undefined?{spawnDisposition:'not_spawned' as const}:{}),exitCode:code,signal});}catch{journalFailed=true;}
     resolveClose();
    });
    const timeout=setTimeout(()=>stop('prepare_deadline'),Math.min(10000,remaining));
    const polling=setInterval(()=>{try{const now=observer.control();if(!now.authorized||now.cancelled||now.stopReason)stop(now.cancelled?'test_cancelled':now.stopReason??'unauthorized');}catch{stop('stale_test_owner');}},40);
    if(spec.input)child.stdin.end(spec.input);else child.stdin.end();
    let fullyRead=false;
    try{
     for await(const chunk of child.stdout){const bytes=Buffer.from(chunk as Uint8Array);stdoutBytes+=bytes.length;if(stdoutBytes>spec.maximum){stop('source_limit');throw new Error('source_limit');}for(let offset=0;offset<bytes.length;offset+=65536)yield bytes.subarray(offset,offset+65536);}
     fullyRead=true;await completion;
     if(!closed||journalFailed||started&&(!child.pid||groupExists(child.pid)))throw new Error('termination_unknown');
     if(reason||exitCode!==0||exitSignal)throw new Error(reason??'source_unavailable');
    }finally{
     if(!fullyRead||!closed){stop('source_reader_stopped');await completion;}
     clearTimeout(timeout);clearInterval(polling);if(kill)clearTimeout(kill);if(grace)clearTimeout(grace);
     if(!closed){child.stdout.destroy();child.stderr.destroy();child.stdin.destroy();child.unref();}
    }
   }catch(error){poisoned=true;throw error;}finally{active=false;}
  })();
 };
 return read;
};
