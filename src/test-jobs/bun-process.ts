import {createHeadOutputBudget} from './output.ts';
import type {HeadOutputBudget} from './output.ts';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {constants} from 'node:fs';
import {open,realpath,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestCanonical,headTestDefinition} from '../domain/public.ts';
import {groupExists} from '../import-jobs/public.ts';
import type {HeadTestJournal,HeadTestProcess} from '../storage/public.ts';
import {headTestEnvironment} from './git-process.ts';
import {headDigest} from './source.ts';
import {observeHeadTestProcessQuiescence} from './evidence.ts';
import type {HeadTestQuiescenceWitness} from './evidence.ts';
export const HEAD_BUN='/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun';
export const verifyHeadBun=async(check:()=>void):Promise<string>=>{
 if(await realpath(HEAD_BUN)!==HEAD_BUN)throw new Error('runtime_unavailable');const file=await open(HEAD_BUN,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const before=await file.stat();if(!before.isFile()||before.size>128*1024*1024)throw new Error('runtime_unavailable');const digest=createHash('sha256');let bytes=0;while(true){check();const chunk=Buffer.alloc(65536),read=await file.read(chunk,0,chunk.length,null);if(!read.bytesRead)break;bytes+=read.bytesRead;if(bytes>128*1024*1024)throw new Error('runtime_unavailable');digest.update(chunk.subarray(0,read.bytesRead));}const after=await file.stat(),hash=digest.digest('hex');if(bytes!==before.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||hash!==headTestDefinition().runtime.sha256)throw new Error('runtime_unavailable');return hash;}finally{await file.close();}
};
type Observer=Readonly<{journal:()=>HeadTestJournal;control:()=>Readonly<{authorized:boolean;cancelled:boolean;stopReason:string|null}>;recordStop:(reason:string)=>void;recordProcess:(observation:HeadTestProcess,prior?:HeadTestQuiescenceWitness)=>Readonly<{disposition:'recorded'|'duplicate'}>}>;
export type HeadBunRun=Readonly<{role:'runtime_version'|'test_root';exitCode:number|null;signal:string|null;output:readonly Readonly<{channel:'stdout'|'stderr';bytes:number;text:string;data:Uint8Array}>[];outputBytes:number;terminationConfirmed:boolean;reason:string|null}>;
const identity=(pid:number):string|null=>{try{return execFileSync('/bin/ps',['-p',String(pid),'-o','lstart=','-o','pgid='],{encoding:'utf8',timeout:1000,maxBuffer:1024,env:{LANG:'C',LC_ALL:'C',TZ:'UTC'},stdio:['ignore','pipe','ignore']}).trim()||null;}catch{return null;}};
export const createHeadBunRunner=({ownedRoot,observer,deadline,outputBudget=createHeadOutputBudget()}:{ownedRoot:string;observer:Observer;deadline:number;outputBudget?:HeadOutputBudget})=>{
 let active=false,poisoned=false;
 return async(role:'runtime_version'|'test_root'):Promise<HeadBunRun>=>{
  if(active||poisoned)throw new Error('test_process_unavailable');const current=observer.control();if(!current.authorized||current.cancelled||current.stopReason)throw new Error('test_stopped');
  const remaining=deadline-Date.now();if(remaining<=0)throw new Error('test_deadline');
  await verifyHeadBun(()=>{if(Date.now()>=deadline)throw new Error('test_deadline');});const root=await realpath(ownedRoot),config=join(root,'empty-bunfig.toml');
  const empty=await lstat(config);if(!empty.isFile()||empty.isSymbolicLink()||empty.size!==0)throw new Error('runtime_config_unavailable');
  const args=role==='runtime_version'?['--version']:headTestDefinition().argvTemplate.map(arg=>arg==='--config=<owned-empty-bunfig>'?`--config=${config}`:arg),cwd=join(root,role==='runtime_version'?'empty':'source'),env=headTestEnvironment(root);
  if(Date.now()>=deadline)throw new Error('test_deadline');
  const journal=observer.journal(),prior=observeHeadTestProcessQuiescence(journal),requested:HeadTestProcess={ordinal:(journal.invocation.processes?.length??0)+1,role,state:'requested',intentDigest:headDigest(headTestCanonical({executable:HEAD_BUN,args,cwd,env})),inputCount:0,inputBytes:0};
  if(observer.recordProcess(requested,...(prior?[prior]:[])).disposition!=='recorded')throw new Error('test_launch_already_recorded');active=true;
  return await new Promise<HeadBunRun>((resolve)=>{
   const attemptedAt=new Date().toISOString();let startedAt:string|null=null;const execution=(exitedAt:string|null)=>({executable:'<qualified-bun>',argv:args.map(arg=>arg.replaceAll(root,'<owned-root>')),cwd:cwd.replace(root,'<owned-root>'),attemptedAt,startedAt,exitedAt});
   const child=spawn(HEAD_BUN,args,{cwd,env,detached:true,stdio:['ignore','pipe','pipe']});let started=false,closed=false,finished=false,spawnError=false,journalFailed=false,observedIdentity:string|null=null,reason:string|null=null,bytes=0;
   const output:{channel:'stdout'|'stderr';bytes:number;text:string;data:Uint8Array}[]=[];let kill:ReturnType<typeof setTimeout>|undefined,grace:ReturnType<typeof setTimeout>|undefined;
   const cleanup=()=>{clearTimeout(timeout);clearInterval(polling);if(kill)clearTimeout(kill);if(grace)clearTimeout(grace);};
   const finish=(exitCode:number|null,signal:string|null,confirmed:boolean)=>{if(finished)return;finished=true;active=false;poisoned ||= !confirmed||reason!==null;cleanup();resolve({role,exitCode,signal,output,outputBytes:bytes,terminationConfirmed:confirmed,reason});};
   const stop=(next:string)=>{
    if(!reason){reason=next;try{observer.recordStop(next);}catch{journalFailed=true;}}if(closed||finished)return;
    if(!grace)grace=setTimeout(()=>{child.stdout.destroy();child.stderr.destroy();child.unref();finish(null,null,false);},700);
    if(!started||!child.pid||!observedIdentity||identity(child.pid)!==observedIdentity)return;
    try{process.kill(-child.pid,'SIGTERM');}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')reason='termination_unknown';}
    if(!kill)kill=setTimeout(()=>{if(!closed&&child.pid&&observedIdentity&&identity(child.pid)===observedIdentity){try{process.kill(-child.pid,'SIGKILL');}catch{reason='termination_unknown';}}},250);
   };
   child.once('spawn',()=>{started=true;startedAt=new Date().toISOString();observedIdentity=child.pid?identity(child.pid):null;try{observer.recordProcess({...requested,state:'started',execution:execution(null),...(child.pid?{pid:child.pid}:{}),...(observedIdentity?{startIdentity:observedIdentity}:{})});}catch{journalFailed=true;stop('journal_write_failed');}});
   child.once('error',()=>{spawnError=true;reason??='runtime_unavailable';});
   const collect=(channel:'stdout'|'stderr',chunk:Buffer)=>{if(finished)return;bytes+=chunk.length;if(!outputBudget.append(role,channel,chunk)){stop('output_limit');return;}output.push({channel,bytes:chunk.length,text:chunk.toString('utf8'),data:Uint8Array.from(chunk)});};
   child.stdout.on('data',(chunk:Buffer)=>collect('stdout',chunk));child.stderr.on('data',(chunk:Buffer)=>collect('stderr',chunk));
   child.once('close',(exitCode,signal)=>{closed=true;if(finished)return;try{observer.recordProcess({...requested,state:'exited',execution:execution(new Date().toISOString()),...(child.pid?{pid:child.pid}:{}),...(observedIdentity?{startIdentity:observedIdentity}:{}),...(!started&&spawnError&&child.pid===undefined?{spawnDisposition:'not_spawned' as const}:{}),exitCode,signal});}catch{journalFailed=true;}finish(exitCode,signal,!journalFailed&&(!started&&spawnError||Boolean(child.pid&&!groupExists(child.pid))));});
   const timeout=setTimeout(()=>stop('test_deadline'),Math.min(deadline-Date.now(),role==='runtime_version'?10000:120000));
   const polling=setInterval(()=>{try{const now=observer.control();if(!now.authorized||now.cancelled||now.stopReason)stop(now.cancelled?'test_cancelled':now.stopReason??'unauthorized');}catch{stop('stale_test_owner');}},40);
  });
 };
};
