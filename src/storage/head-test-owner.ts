import {localPrincipal} from './access.ts';
import {createHash,randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import {headTestCanonical,processQuiescenceEligible,HEAD_TEST_DEFINITION_DIGEST} from '../domain/public.ts';
import type {HeadTestAdmissionReceipt,HeadTestJob,Principal,Review} from '../domain/public.ts';
import {isHeadTestQuiescence,isHeadTestProcessQuiescence,readHeadTestQuiescence,isHeadTestPreparation,inspectHeadTestPreparation,readHeadTestOutcome,readHeadCleanup} from '../test-jobs/public.ts';
import type {HeadTestOutcomeWitness,HeadTestQuiescenceWitness,HeadTestPreparationWitness,HeadTestQualification,HeadCleanupInput,HeadCleanupWitness} from '../test-jobs/public.ts';
import type {ExecutionLease} from './execution.ts';
import type {HeadTestOwner,HeadTestGrant,HeadTestJournal,HeadTestProcess,HeadTestStoredJob as Job,HeadTestPrivateInvocation} from './head-test-contracts.ts';
const processSchema=z.object({ordinal:z.number().int().min(1).max(34),role:z.enum(['git_prepare','runtime_version','test_root']),state:z.enum(['requested','started','exited']),intentDigest:z.string().regex(/^[a-f0-9]{64}$/),inputCount:z.number().int().min(0).max(8192),inputBytes:z.number().int().min(0).max(8192*65),pid:z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),startIdentity:z.string().min(1).max(1024).optional(),spawnDisposition:z.literal('not_spawned').optional(),exitCode:z.number().int().nullable().optional(),signal:z.string().max(64).nullable().optional(),execution:z.object({executable:z.string().max(128),argv:z.array(z.string().max(1024)).max(64),cwd:z.string().max(128),attemptedAt:z.iso.datetime(),startedAt:z.iso.datetime().nullable(),exitedAt:z.iso.datetime().nullable()}).strict().optional()}).strict();
type Ports=Readonly<{db:DatabaseSync;tx:<T>(operation:()=>T)=>T;execution:ExecutionLease;rows:()=>readonly {job:Job}[];get:(id:string)=>Job;put:(job:Job)=>unknown;publicJob:(job:Job)=>HeadTestJob;load:(id:string)=>Review;authorize:(principal:Principal,review:Review)=>void;fixtureExecution:boolean;configuration:Readonly<{qualification:HeadTestQualification;qualificationId:string;repository:string;donor:string}>|null}>;
export const createHeadTestOwnerStore=({db,tx,execution,rows,get,put,publicJob,load,authorize,fixtureExecution,configuration}:Ports)=>{
 db.exec('CREATE TABLE IF NOT EXISTS test_owner(id INTEGER PRIMARY KEY CHECK(id=1),generation TEXT NOT NULL)');
 const owners=new WeakMap<object,string>(),grants=new WeakMap<object,{generation:string;jobId:string;invocationId:string}>();
 const generation=()=> (db.prepare('SELECT generation FROM test_owner WHERE id=1').get() as {generation:string}|undefined)?.generation;
 const owner=(value:HeadTestOwner)=>{execution.assertCurrent();const id=owners.get(value);if(!id||id!==generation())throw new Error('stale_test_owner');return id;};
 const grant=(value:HeadTestGrant)=>{execution.assertCurrent();const record=grants.get(value);if(!record||record.generation!==generation())throw new Error('stale_test_owner');const job=get(record.jobId),invocation=job.invocations.at(-1);if(!invocation||invocation.invocationId!==record.invocationId||invocation.state!=='running')throw new Error('stale_test_owner');return {job,invocation};};
 const credential=(job:Job)=>{const local=localPrincipal(job.credentialReference),row=local?undefined:db.prepare('SELECT body FROM credentials WHERE hash=?').get(job.credentialReference) as {body:string}|undefined;if(!local&&!row)throw new Error('unauthorized');const principal=local??JSON.parse(row!.body) as Principal,review=load(job.reviewId);authorize(principal,review);if(principal.kind!=='user'||principal.actorId!==job.actorId)throw new Error('unauthorized');const snapshot=(review.snapshots??[review.snapshot]).find(item=>item.snapshotId===job.snapshotId);if(!snapshot||snapshot.headSha!==job.headSha||snapshot.repository!==job.repository)throw new Error('source_unavailable');};
 const active=(job:Job)=>{credential(job);if(job.cancellation)throw new Error('test_cancelled');if(job.stopReason)throw new Error('test_stopped');};
 const update=(job:Job)=>{const next={...job,jobRevision:job.jobRevision+1,updatedAt:new Date().toISOString()};put(next);return next;};
 const unclaimed=(job:Job,state:'unavailable'|'error',reason:string)=>{const next={...job,state,reason,reservedBytes:0};return update({...next,retainedBytes:Buffer.byteLength(headTestCanonical(publicJob(next)))});};
 const changeInvocation=(job:Job,invocation:HeadTestPrivateInvocation)=>({...job,invocations:job.invocations.map(item=>item.invocationId===invocation.invocationId?invocation:item)});
 const unknownJob=(job:Job,reason:string)=>update({...job,state:'unknown',reason,effectDisposition:'unresolved',invocations:job.invocations.map(item=>item.state==='running'?{...item,state:'unknown',quiescence:'unresolved'}:item)});
 const journal=(job:Job):HeadTestJournal=>({jobId:job.jobId,jobRevision:job.jobRevision,invocation:structuredClone(job.invocations.at(-1)!)});
 const cleanupInput=(value:HeadTestOwner,jobId:string):HeadCleanupInput=>{
  owner(value);const job=get(jobId),invocation=job.invocations.at(-1);
  if(!job.result||!job.cleanupLocation||!job.cleanup||job.cleanup.state==='complete'||job.state==='unknown'||job.effectDisposition!=='quiescent'||!invocation||invocation.state!=='completed'||invocation.quiescence!=='confirmed'||invocation.processJournalVersion!==1||invocation.filesystemRoots?.length!==1||invocation.filesystemRoots[0]!==job.cleanupLocation.rootId||!invocation.processes||invocation.processes.some(item=>!processQuiescenceEligible(item)))throw new Error('invalid_test_cleanup');
  return {jobId,invocationId:invocation.invocationId,resultId:job.result.resultId,attempts:job.cleanup.attempts,location:structuredClone(job.cleanupLocation),journal:journal(job)};
 };
 return {
  cleanupPending:(value:HeadTestOwner):readonly HeadCleanupInput[]=>{owner(value);return rows().filter(({job})=>job.cleanup&&job.cleanup.state!=='complete'&&(job.cleanupAfter??0)<=Date.now()).slice(0,8).map(({job})=>cleanupInput(value,job.jobId));},
  checkCleanup:(value:HeadTestOwner,input:HeadCleanupInput)=>{if(headTestCanonical(cleanupInput(value,input.jobId))!==headTestCanonical(input))throw new Error('invalid_test_cleanup');},
  recordCleanup:(value:HeadTestOwner,witness:HeadCleanupWitness)=>tx(()=>{
   owner(value);const observed=readHeadCleanup(witness);if(!observed||headTestCanonical(cleanupInput(value,observed.input.jobId))!==headTestCanonical(observed.input))throw new Error('invalid_test_cleanup');
   const job=get(observed.input.jobId),attempts=Math.min(Number.MAX_SAFE_INTEGER,observed.input.attempts+1);
   update({...job,cleanup:{state:observed.state,attempts,reason:observed.reason},cleanupAfter:observed.state==='complete'?0:Date.now()+Math.min(60000,1000*2**Math.min(6,attempts-1))});
  }),
  beginOwner:():HeadTestOwner=>tx(()=>{execution.assertCurrent();const id=randomUUID();db.prepare('INSERT OR REPLACE INTO test_owner VALUES(1,?)').run(id);for(const {job} of rows()){const invocation=job.invocations.at(-1);if(invocation?.state==='running'){unknownJob(job,'interrupted_test_invocation');execution.retain({kind:'test',jobId:job.jobId,invocationId:invocation.invocationId,phase:invocation.phase});}}const value=Object.freeze({}) as HeadTestOwner;owners.set(value,id);return value;}),
  claim:(value:HeadTestOwner):{job:HeadTestJob;grant:HeadTestGrant}|null=>tx(()=>{
   const id=owner(value);
   if(rows().some(({job})=>job.cleanup&&job.cleanup.state!=='complete'))return null;
   for(const {job} of rows()){
    if(job.state!=='queued'||job.provenance==='test_only_configuration'||job.provenance==='test_only_execution'&&!fixtureExecution)continue;
    if(job.provenance==='qualified_local_configuration'&&(!configuration||configuration.qualificationId!==job.qualificationId||configuration.qualification.headSha!==job.headSha)){unclaimed(job,'unavailable','qualification_required');continue;}
    try{active(job);if(job.target.digest!==HEAD_TEST_DEFINITION_DIGEST)throw new Error('test_target_conflict');}catch(error){unclaimed(job,'error',error instanceof Error?error.message:'unauthorized');continue;}
    const invocation:HeadTestPrivateInvocation={invocationId:randomUUID(),phase:'prepare',state:'running',quiescence:'unresolved',processJournalVersion:1,processes:[],filesystemRoots:[]};
    if(!execution.acquire({kind:'test',jobId:job.jobId,invocationId:invocation.invocationId,phase:'prepare'}))return null;
    const next=update({...job,state:'preparing',effectDisposition:'unresolved',invocations:[...job.invocations,invocation]});const token=Object.freeze({}) as HeadTestGrant;grants.set(token,{generation:id,jobId:job.jobId,invocationId:invocation.invocationId});return {job:publicJob(next),grant:token};
   }return null;
  }),
  input:(value:HeadTestGrant)=>{const {job,invocation}=grant(value);return {job:publicJob(job),invocationId:invocation.invocationId};},
  resolveHeadTestSource:(value:HeadTestGrant)=>{const {job}=grant(value);active(job);if(job.provenance==='test_only_execution')return null;if(!configuration||job.qualificationId!==configuration.qualificationId||job.headSha!==configuration.qualification.headSha)throw new Error('qualification_required');return structuredClone(configuration);},
  registerRoot:(value:HeadTestGrant)=>tx(()=>{const {job,invocation}=grant(value);active(job);if(invocation.phase!=='prepare'||invocation.filesystemRoots?.length!==0)throw new Error('test_preparation_conflict');const rootId=randomUUID();update(changeInvocation(job,{...invocation,filesystemRoots:[rootId]}));return rootId;}),
  prepared:(value:HeadTestGrant,witness:HeadTestPreparationWitness)=>tx(()=>{
   const {job,invocation}=grant(value);active(job);if(invocation.phase!=='prepare'||!isHeadTestPreparation(witness,publicJob(job),invocation.invocationId,invocation.filesystemRoots??[],journal(job)))throw new Error('invalid_test_witness');
   const prepared=inspectHeadTestPreparation(witness);if(!invocation.processes||invocation.processes.some(item=>item.state!=='exited'||!processQuiescenceEligible(item)))throw new Error('test_process_unresolved');
   execution.advance({kind:'test',jobId:job.jobId,invocationId:invocation.invocationId,phase:'prepare'},'execute');
   return publicJob(update({...changeInvocation(job,{...invocation,phase:'execute'}),preparation:{sourceManifestId:prepared.source.sourceManifestId,closureManifestId:prepared.closure.closureManifestId,sourceAccountId:prepared.account.sourceAccountId,treeId:prepared.source.manifest.treeId,runtimeSha256:prepared.runtimeSha256,environmentId:prepared.environmentId}}));
  }),
  control:(value:HeadTestGrant)=>{const {job}=grant(value);let authorized=true;try{credential(job);}catch{authorized=false;}return {jobId:job.jobId,jobRevision:job.jobRevision,cancelled:job.cancellation!==null,authorized,stopReason:job.stopReason??null};},
  recordStop:(value:HeadTestGrant,reason:string)=>tx(()=>{const {job}=grant(value);if(!/^[a-z][a-z0-9_]{0,63}$/.test(reason))throw new Error('invalid_test_reason');if(!job.stopReason)update({...job,stopReason:reason});}),
  journal:(value:HeadTestGrant):HeadTestJournal=>journal(grant(value).job),
  recordProcess:(value:HeadTestGrant,input:HeadTestProcess,priorQuiescence?:HeadTestQuiescenceWitness):Readonly<{disposition:'recorded'|'duplicate'}>=>{
   processSchema.parse(input);
   // Drop explicitly undefined optionals; persisted records have exact optional fields.
   const observation=Object.fromEntries(Object.entries(input).filter(([,item])=>item!==undefined)) as HeadTestProcess;
   const observationDigest=createHash('sha256').update(headTestCanonical(observation)).digest('hex');
   return tx(()=>{const {job,invocation}=grant(value),processes=invocation.processes;if(invocation.processJournalVersion!==1||!processes)throw new Error('test_process_unresolved');const old=processes.find(item=>item.ordinal===observation.ordinal);
    if(old?.state===observation.state&&old.observationDigest===observationDigest)return {disposition:'duplicate' as const};
    if(observation.state==='requested'){
     active(job);if(observation.pid!==undefined||observation.startIdentity!==undefined||observation.spawnDisposition!==undefined||observation.exitCode!==undefined||observation.signal!==undefined||observation.execution!==undefined)throw new Error('invalid_test_observation');
     if(old||observation.ordinal!==processes.length+1||processes.length>=34)throw new Error('test_process_limit');
     if(processes.some(item=>item.state!=='exited'||!processQuiescenceEligible(item))||processes.length>0&&(!priorQuiescence||!isHeadTestProcessQuiescence(priorQuiescence,journal(job))))throw new Error('test_process_unresolved');
     if(observation.role==='test_root'&&invocation.phase!=='execute'||observation.role!=='test_root'&&invocation.phase!=='prepare')throw new Error('test_phase_conflict');
     if(processes.filter(item=>item.role===observation.role).length>=(observation.role==='git_prepare'?32:1))throw new Error('test_process_limit');
    }else{
     if(!old||old.state==='exited'||old.role!==observation.role||old.intentDigest!==observation.intentDigest||old.inputCount!==observation.inputCount||old.inputBytes!==observation.inputBytes||observation.state==='started'&&old.state!=='requested')throw new Error('invalid_test_observation');
     if(old.pid!==undefined&&observation.pid!==undefined&&old.pid!==observation.pid||old.startIdentity!==undefined&&observation.startIdentity!==undefined&&old.startIdentity!==observation.startIdentity)throw new Error('invalid_test_observation');
     if(old.execution&&(!observation.execution||headTestCanonical({...old.execution,exitedAt:null})!==headTestCanonical({...observation.execution,exitedAt:null})))throw new Error('invalid_test_observation');
     if(observation.state==='started'&&(observation.pid===undefined||observation.exitCode!==undefined||observation.spawnDisposition!==undefined))throw new Error('invalid_test_observation');
     if(observation.spawnDisposition!==undefined&&(!processQuiescenceEligible(observation)||old.state!=='requested'||old.pid!==undefined||old.startIdentity!==undefined))throw new Error('invalid_test_observation');
    }
    const next=old?processes.map(item=>item.ordinal===old.ordinal?{...item,...observation,observationDigest}:item):[...processes,{...observation,observationDigest}];update({...changeInvocation(job,{...invocation,processes:next}),...(observation.role==='test_root'&&observation.state==='started'&&job.state==='preparing'?{state:'running' as const}:{})});return {disposition:'recorded' as const};
   });
  },
  complete:(value:HeadTestGrant,witness:HeadTestOutcomeWitness):HeadTestAdmissionReceipt=>tx(()=>{
   execution.assertCurrent();const handle=grants.get(value),observed=readHeadTestOutcome(witness);
   if(!handle||handle.generation!==generation()||!observed)throw new Error('invalid_test_witness');
   const job=get(handle.jobId),invocation=job.invocations.at(-1),result=observed.result,commandId=`test-result:${job.jobId}`;
   if(!invocation||invocation.invocationId!==handle.invocationId||result.jobId!==job.jobId||result.invocationId!==handle.invocationId)throw new Error('invalid_test_witness');
   const old=db.prepare('SELECT actor,fingerprint,body FROM test_receipts WHERE id=?').get(commandId) as {actor:string;fingerprint:string;body:string}|undefined;
   if(old){credential(job);if(old.actor!==job.actorId||old.fingerprint!==result.resultId||job.result?.resultId!==result.resultId)throw new Error('command_conflict');return JSON.parse(old.body) as HeadTestAdmissionReceipt;}
   for(const table of ['receipts','import_receipts','analysis_receipts','story_receipts'])if(db.prepare(`SELECT id FROM ${table} WHERE id=?`).get(commandId))throw new Error('command_conflict');
   if(invocation.state!=='running'||headTestCanonical(observed.journal)!==headTestCanonical(journal(job))||invocation.processJournalVersion!==1||!Array.isArray(invocation.processes)||invocation.processes.some(item=>!processQuiescenceEligible(item)))throw new Error('invalid_test_witness');
   let authorized=true;try{credential(job);}catch{authorized=false;}
   if(authorized!==observed.control.authorized||Boolean(job.cancellation)!==observed.control.cancelled||(job.stopReason??null)!==observed.control.stopReason||!authorized&&result.state!=='error'||job.cancellation&&result.state!=='cancelled')throw new Error('test_outcome_changed');
   if(Date.now()>=observed.deadline&&['passed','failed'].includes(result.state))throw new Error('test_outcome_changed');
   if(job.reservedBytes!==2*1024*1024||job.result)throw new Error('test_reservation_conflict');
   if(observed.cleanupLocation&&(invocation.filesystemRoots?.length!==1||invocation.filesystemRoots[0]!==observed.cleanupLocation.rootId))throw new Error('invalid_test_witness');
   const next:Job={...changeInvocation(job,{...invocation,state:'completed',quiescence:'confirmed'}),state:result.state,reason:result.reason,effectDisposition:'quiescent',result,artifactLocations:observed.locations,...(observed.cleanupLocation?{cleanupLocation:observed.cleanupLocation,cleanupAfter:0,cleanup:{state:'pending' as const,attempts:0,reason:null}}:{}),reservedBytes:0,retainedBytes:0,jobRevision:job.jobRevision+1,updatedAt:new Date().toISOString()};
   const receipt:HeadTestAdmissionReceipt={commandId,jobId:job.jobId,jobRevision:next.jobRevision,resultId:result.resultId,state:'applied'};
   const retainedBytes=observed.artifactBytes+Buffer.byteLength(headTestCanonical(next))+Buffer.byteLength(headTestCanonical(receipt));
   if(retainedBytes+512>job.reservedBytes)throw new Error('test_storage_limit');
   execution.release({kind:'test',jobId:job.jobId,invocationId:invocation.invocationId,phase:invocation.phase});put({...next,retainedBytes:retainedBytes+512});
   db.prepare('INSERT INTO test_receipts VALUES (?,?,?,?)').run(commandId,job.actorId,result.resultId,headTestCanonical(receipt));return receipt;
  }),
  markUnknown:(value:HeadTestGrant,reason:string)=>tx(()=>{const {job}=grant(value);if(!/^[a-z][a-z0-9_]{0,63}$/.test(reason))throw new Error('invalid_test_reason');unknownJob(job,reason);}),
  unknown:(value:HeadTestOwner):readonly HeadTestJournal[]=>{owner(value);return rows().filter(({job})=>job.state==='unknown'&&job.effectDisposition!=='quiescent'&&job.invocations.length>0).map(({job})=>journal(job));},
  reconcileQuiescence:(value:HeadTestOwner,witness:HeadTestQuiescenceWitness)=>tx(()=>{
   owner(value);const observed=readHeadTestQuiescence(witness);if(!observed)throw new Error('invalid_test_witness');const job=get(observed.jobId),invocation=job.invocations.at(-1);
   if(job.state!=='unknown'||!invocation||!isHeadTestQuiescence(witness,journal(job)))throw new Error('invalid_test_witness');
   if(invocation.processJournalVersion!==1||!Array.isArray(invocation.processes)||!Array.isArray(invocation.filesystemRoots)||invocation.filesystemRoots.length!==0||invocation.processes.some(item=>!processQuiescenceEligible(item)))throw new Error('test_process_unresolved');
   execution.clearQuiescent('test',job.jobId,invocation.invocationId);update({...changeInvocation(job,{...invocation,quiescence:'confirmed'}),effectDisposition:'quiescent'});
  }),
  diagnostics:(value:HeadTestOwner)=>{owner(value);return rows().slice(-8).map(({job})=>({jobId:job.jobId,jobRevision:job.jobRevision,state:job.state,phase:job.invocations.at(-1)?.phase??null,effectDisposition:job.effectDisposition}));},
 };
};
