import type {ExecutionLease} from './execution.ts';
import {createHash,randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {canonical,importCommandSchema,importWaitingStates,canCancelImport,importStableIdentity,createImportedReview,applyCommand} from '../domain/public.ts';
import type {Review,Snapshot,Principal,ImportCommand,ImportJob,ImportReceipt,ImportInvocation,ProviderCandidate,ProcessObservation,ArtifactReference} from '../domain/public.ts';
import {isPreparedSnapshotWitness,validateProviderSnapshot} from '../source-preparation/public.ts';
import type {PreparedSnapshotWitness} from '../source-preparation/public.ts';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
declare const ownerBrand:unique symbol;
declare const grantBrand:unique symbol;
export type ImportOwner={readonly [ownerBrand]:true};
export type ImportGrant={readonly [grantBrand]:true};
export type ImportLimits={maxLaunches?:number;maxRetainedSourceBytes?:number};
type Ports={execution:ExecutionLease;limits?:ImportLimits;db:DatabaseSync;tx:<T>(operation:()=>T)=>T;load:(id:string)=>Review;save:(review:Review)=>void};
export const createImportStore=({db,tx,load,save,execution,limits={}}:Ports)=>{
 const ceiling=limits.maxLaunches??4096,sourceQuota=limits.maxRetainedSourceBytes??64*1024*1024;
 if(!Number.isSafeInteger(ceiling)||ceiling<1||ceiling>4096||!Number.isSafeInteger(sourceQuota)||sourceQuota<1||sourceQuota>64*1024*1024)throw new Error('invalid_import_limit');
 const phaseLimit=(invocation:ImportInvocation)=>Math.min(invocation.phase==='discovery'?256:4096,ceiling);
 const encodedSourceBytes=(snapshot:Snapshot)=>Buffer.byteLength(JSON.stringify(snapshot.sources),'utf8');
 db.exec('CREATE TABLE IF NOT EXISTS import_jobs(id TEXT PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS import_receipts(id TEXT PRIMARY KEY,actor TEXT NOT NULL,fingerprint TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS import_owner(id INTEGER PRIMARY KEY CHECK(id=1),generation TEXT NOT NULL);');
 const owners=new WeakMap<object,string>(),grants=new WeakMap<object,{generation:string;jobId:string;invocationId:string}>();
 const all=()=> (db.prepare('SELECT body FROM import_jobs ORDER BY rowid').all() as {body:string}[]).map(row=>JSON.parse(row.body) as ImportJob);
 const get=(id:string)=>{const row=db.prepare('SELECT body FROM import_jobs WHERE id=?').get(id) as {body:string}|undefined;if(!row)throw new Error('invalid_request');return JSON.parse(row.body) as ImportJob;};
 const put=(job:ImportJob)=>{db.prepare('INSERT INTO import_jobs VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(job.jobId,JSON.stringify(job));};
 const update=(job:ImportJob)=>{job.jobRevision++;job.updatedAt=new Date().toISOString();put(job);};
 const user=(reference:string):Principal=>{const row=db.prepare('SELECT body FROM credentials WHERE hash=?').get(reference) as {body:string}|undefined;const principal=row?JSON.parse(row.body) as Principal:null;if(!principal||principal.kind!=='user')throw new Error('unauthorized');return principal;};
 const owner=(value:ImportOwner)=>{const generation=owners.get(value),row=db.prepare('SELECT generation FROM import_owner WHERE id=1').get() as {generation:string}|undefined;if(!generation||row?.generation!==generation)throw new Error('stale_import_runner');return generation;};
 const grant=(value:ImportGrant)=>{const record=grants.get(value),row=db.prepare('SELECT generation FROM import_owner WHERE id=1').get() as {generation:string}|undefined;if(!record||record.generation!==row?.generation)throw new Error('stale_import_runner');const job=get(record.jobId),invocation=job.invocations.at(-1);if(!invocation||invocation.invocationId!==record.invocationId||invocation.state!=='running')throw new Error('stale_import_runner');return {job,invocation};};
 const terminal=(invocation:ImportInvocation)=>{if(invocation.processes.some(process=>process.state!=='exited'))throw new Error('import_process_unresolved');};
 const release=(job:ImportJob,invocation:ImportInvocation)=>execution.release({kind:'import',jobId:job.jobId,invocationId:invocation.invocationId,phase:invocation.phase});
 const matching=(candidate:ProviderCandidate)=> (db.prepare('SELECT review_id,current_snapshot_id FROM review_import_identities WHERE provider=? AND host=? AND target_project=? AND change_number=? ORDER BY review_id').all(candidate.provider,candidate.host,candidate.targetProject,candidate.number) as {review_id:string;current_snapshot_id:string}[]).map(row=>({reviewId:row.review_id,currentSnapshotId:row.current_snapshot_id}));
 const view=(job:ImportJob)=>{const {credentialReference,...publicJob}=job;return publicJob;};
 const retainedBytes=(review:Review)=> (review.snapshots??[review.snapshot]).reduce((n,snapshot)=>n+encodedSourceBytes(snapshot),0);
 const command=(token:string,input:ImportCommand):ImportReceipt=>{
  const reference=hash(token),principal=user(reference),parsed=importCommandSchema.parse(input),fingerprint=hash(canonical(parsed));
  return tx(()=>{
   user(reference);
   const old=db.prepare('SELECT actor,fingerprint,body FROM import_receipts WHERE id=?').get(parsed.commandId) as {actor:string;fingerprint:string;body:string}|undefined;
   if(old)return old.actor===principal.actorId&&old.fingerprint===fingerprint?JSON.parse(old.body) as ImportReceipt:{commandId:parsed.commandId,actorId:principal.actorId,state:'rejected',jobId:null,jobRevision:0,result:{},error:'command_conflict'};
   let job:ImportJob|undefined,receipt:ImportReceipt;
   try{
    if(parsed.type==='RequestImport'){
     if(all().filter(job=>importWaitingStates.includes(job.state)||['discovering','acquiring','reverifying','cancel_requested','unknown'].includes(job.state)).length>=8)throw new Error('import_queue_full');
     const now=new Date().toISOString();job={jobId:randomUUID(),actorId:principal.actorId,credentialReference:reference,path:parsed.path,canonicalWorktree:null,state:'queued',jobRevision:1,createdAt:now,updatedAt:now,reviewId:parsed.target?.reviewId??randomUUID(),target:parsed.target??null,candidate:null,candidates:[],discoveryRevision:0,discovery:null,existingReviews:[],invocations:[],artifact:null,admissionCommandId:`import-admit:${randomUUID()}`,admission:null,reason:null};
     if(parsed.target)load(parsed.target.reviewId);put(job);
    }else{
     job=get(parsed.jobId);if(job.actorId!==principal.actorId||job.credentialReference!==reference)throw new Error('unauthorized');
     if(parsed.type==='ChooseImportCandidate'){
      if(job.state!=='choosing'||job.discoveryRevision!==parsed.discoveryRevision||!job.candidates[parsed.candidateIndex])throw new Error('stale_import_choice');
      const candidate=job.candidates[parsed.candidateIndex]!;job.existingReviews=matching(candidate);
      if(parsed.target&&!job.existingReviews.some(review=>review.reviewId===parsed.target!.reviewId)||!parsed.target&&job.existingReviews.length)throw new Error('existing_review_choice_required');
      job.candidate=candidate;job.target=parsed.target??null;job.reviewId=parsed.target?.reviewId??job.reviewId;job.state='acquisition_queued';job.reason=null;
     }else if(parsed.type==='CancelImport'){
      if(!canCancelImport(job.state))throw new Error('import_terminal');
      const running=job.invocations.at(-1)?.state==='running';job.state=running?'cancel_requested':job.state==='unknown'?'unknown':'cancelled';job.reason=job.state==='unknown'?'termination_unconfirmed':null;
     }else if(parsed.type==='ReverifyImportResult'){
      if(!['needs_reverification','admission_conflict','result_ready'].includes(job.state)||!job.artifact)throw new Error('invalid_request');job.state='reverify_queued';job.reason=null;
     }else if(parsed.type==='AdmitImportResult'){
      if(!['admission_conflict','result_ready'].includes(job.state)||!job.artifact)throw new Error('invalid_request');
      if(parsed.target){load(parsed.target.reviewId);job.target=parsed.target;job.reviewId=parsed.target.reviewId;}else{if(job.target)job.reviewId=randomUUID();job.target=null;}
      job.admissionCommandId=`import-admit:${parsed.commandId}`;job.admission=null;job.state='result_ready';job.reason=null;
     }
     update(job);
    }
    receipt={commandId:parsed.commandId,actorId:principal.actorId,state:'applied',jobId:job.jobId,jobRevision:job.jobRevision,result:{jobId:job.jobId}};
   }catch(error){receipt={commandId:parsed.commandId,actorId:principal.actorId,state:'rejected',jobId:job?.jobId??null,jobRevision:job?.jobRevision??0,result:{},error:error instanceof Error?error.message:'invalid_request'};}
   db.prepare('INSERT INTO import_receipts VALUES (?,?,?,?)').run(parsed.commandId,principal.actorId,fingerprint,JSON.stringify(receipt));return receipt;
  });
 };
 return {
  command,
  list:(token:string)=>{const reference=hash(token),principal=user(reference);return all().filter(job=>job.actorId===principal.actorId&&job.credentialReference===reference).map(view);},
  beginOwner:():ImportOwner=>tx(()=>{
   const generation=randomUUID();db.prepare('INSERT OR REPLACE INTO import_owner VALUES (1,?)').run(generation);
   for(const job of all()){
    const invocation=job.invocations.at(-1);
    if(invocation&&(invocation.state==='running'||job.state==='unknown')){execution.retain({kind:'import',jobId:job.jobId,invocationId:invocation.invocationId,phase:invocation.phase});invocation.state='unknown';job.state='unknown';job.reason='interrupted_invocation';update(job);}
    else if(['result_ready','admission_conflict'].includes(job.state)){job.state='needs_reverification';job.reason='restart_requires_reverification';update(job);}
   }
   const value=Object.freeze({}) as ImportOwner;owners.set(value,generation);return value;
  }),
  claim:(value:ImportOwner):{job:ImportJob;grant:ImportGrant}|null=>tx(()=>{
   const generation=owner(value),jobs=all();if(jobs.some(job=>job.invocations.at(-1)?.state==='running'||job.state==='unknown'))return null;
   for(const job of jobs){
    if(!['queued','acquisition_queued','reverify_queued'].includes(job.state))continue;
    try{user(job.credentialReference);}catch{job.state='failed';job.reason='unauthorized';update(job);continue;}
    const phase=job.state==='queued'?'discovery':job.state==='reverify_queued'?'reverification':'acquisition';
    const invocation:ImportInvocation={invocationId:randomUUID(),phase,generation,state:'running',startedAt:new Date().toISOString(),processes:[]};if(!execution.acquire({kind:'import',jobId:job.jobId,invocationId:invocation.invocationId,phase}))return null;job.invocations.push(invocation);job.state=phase==='discovery'?'discovering':phase==='acquisition'?'acquiring':'reverifying';update(job);
    const result=Object.freeze({}) as ImportGrant;grants.set(result,{generation,jobId:job.jobId,invocationId:invocation.invocationId});return {job,grant:result};
   }return null;
  }),
  launchLimit:(value:ImportGrant)=>phaseLimit(grant(value).invocation),
  recordProcess:(value:ImportGrant,observation:ProcessObservation)=>tx(()=>{
   const {job,invocation}=grant(value);if(job.state==='cancel_requested'&&observation.state==='requested')throw new Error('import_cancelled');
   const old=invocation.processes.find(process=>process.ordinal===observation.ordinal);
   if(observation.state==='requested'){if(old||observation.ordinal!==invocation.processes.length+1||invocation.processes.length>=phaseLimit(invocation)||invocation.processes.some(process=>process.state!=='exited'))throw new Error('import_process_limit');invocation.processes.push({...observation,requestedAt:new Date().toISOString()});}
   else {if(!old||old.executable!==observation.executable||observation.state==='started'&&old.state!=='requested'||observation.state==='exited'&&!['requested','started'].includes(old.state))throw new Error('invalid_import_observation');Object.assign(old,observation,observation.state==='started'?{startedAt:new Date().toISOString()}:{endedAt:new Date().toISOString()});}
   update(job);
  }),
  cancelled:(value:ImportGrant)=>{const {job}=grant(value);return job.state==='cancel_requested';},
  finishDiscovery:(value:ImportGrant,discovery:{kind:string;canonicalWorktree:string|null;candidates:readonly ProviderCandidate[]})=>tx(()=>{
   const {job,invocation}=grant(value);terminal(invocation);if(invocation.phase!=='discovery')throw new Error('stale_import_runner');release(job,invocation);invocation.state='completed';
   if(job.state==='cancel_requested'){job.state='cancelled';update(job);return;}
   user(job.credentialReference);job.discovery=discovery;job.canonicalWorktree=discovery.canonicalWorktree;job.candidates=structuredClone(discovery.candidates) as ProviderCandidate[];job.discoveryRevision=job.jobRevision+1;job.existingReviews=job.candidates.flatMap((candidate,candidateIndex)=>matching(candidate).map(review=>({...review,candidateIndex})));
   if(discovery.kind==='unique'&&job.candidates.length===1&&discovery.canonicalWorktree){job.candidate=job.candidates[0]!;job.existingReviews=matching(job.candidate);if(job.target&&!job.existingReviews.some(review=>review.reviewId===job.target!.reviewId)){job.state='failed';job.reason='review_identity_conflict';}else job.state=job.existingReviews.length&&!job.target?'choosing':'acquisition_queued';}
   else {job.state=discovery.kind==='ambiguous'?'choosing':'unavailable';job.reason=discovery.kind;}
   update(job);
  }),
  finishResult:(value:ImportGrant,reference:ArtifactReference)=>tx(()=>{
   const {job,invocation}=grant(value);terminal(invocation);if(invocation.phase==='discovery'||reference.jobId!==job.jobId||reference.invocationId!==invocation.invocationId||reference.schema!=='import-result-v1'||reference.bytes>16*1024*1024)throw new Error('invalid_import_artifact');
   release(job,invocation);if(job.state==='cancel_requested'){invocation.state='cancelled';job.state='cancelled';update(job);return false;}
   user(job.credentialReference);invocation.state='completed';invocation.artifact=reference;job.artifact=reference;job.state='result_ready';job.reason=null;update(job);return true;
  }),
  fail:(value:ImportGrant,reason:string,terminationConfirmed=true)=>tx(()=>{const {job,invocation}=grant(value);if(terminationConfirmed){terminal(invocation);release(job,invocation);}invocation.state=terminationConfirmed?(job.state==='cancel_requested'?'cancelled':'completed'):'unknown';job.state=!terminationConfirmed?'unknown':job.state==='cancel_requested'?'cancelled':'failed';job.reason=reason;update(job);}),
  ready:(value:ImportOwner)=>{owner(value);return all().filter(job=>job.state==='result_ready');},
  unknown:(value:ImportOwner)=>{owner(value);return all().filter(job=>job.state==='unknown');},
  confirmQuiescent:(value:ImportOwner,jobId:string)=>tx(()=>{owner(value);const job=get(jobId);if(job.state!=='unknown')throw new Error('invalid_request');const invocation=job.invocations.at(-1);if(invocation)execution.clearQuiescent('import',job.jobId,invocation.invocationId);job.state=job.artifact?'needs_reverification':'failed';job.reason='interrupted_invocation_not_replayed';update(job);}),
  admit:(value:ImportOwner,jobId:string,snapshot:Snapshot,witness:PreparedSnapshotWitness):ImportReceipt=>{
   // Expensive content checks and witness lookup precede the short owning transaction.
   const observed=get(jobId),fingerprint=hash(canonical({jobId,target:observed.target,reviewId:observed.reviewId,snapshot}));const observedReview=observed.target?load(observed.reviewId):null;const alreadyRetained=observedReview&&(observedReview.snapshots??[observedReview.snapshot]).some(retained=>retained.snapshotId===snapshot.snapshotId);const exceedsBudget=(observedReview?retainedBytes(observedReview):0)+(alreadyRetained?0:encodedSourceBytes(snapshot))>sourceQuota;let verified=false;try{validateProviderSnapshot(snapshot);verified=isPreparedSnapshotWitness(witness,observed.reviewId,snapshot,jobId);}catch{}
   return tx(()=>{
    owner(value);const job=get(jobId),id=job.admissionCommandId;let principal:Principal={kind:'user',actorId:job.actorId};if(id!==observed.admissionCommandId||canonical(job.target)!==canonical(observed.target))throw new Error('stale_import_runner');
    const old=db.prepare('SELECT actor,fingerprint,body FROM import_receipts WHERE id=?').get(id) as {actor:string;fingerprint:string;body:string}|undefined;
    if(old)return old.fingerprint===fingerprint?JSON.parse(old.body) as ImportReceipt:{commandId:id,actorId:principal.actorId,state:'rejected',jobId,jobRevision:job.jobRevision,result:{},error:'command_conflict'};
    let receipt:ImportReceipt;
    try{
     principal=user(job.credentialReference);
     if(job.state!=='result_ready'||!verified||!job.candidate||canonical(job.candidate)!==canonical(snapshot.candidate)||observed.reviewId!==job.reviewId)throw new Error('source_unavailable');
     let review:Review,result:Record<string,unknown>;
     if(job.target){const current=load(job.reviewId);const next=applyCommand(current,principal,{type:'AddSnapshot',commandId:id,reviewId:job.reviewId,expectedCurrentSnapshotId:job.target.expectedCurrentSnapshotId,identityScheme:'acquisition_v1',snapshot},{entity:randomUUID(),event:randomUUID()},new Date().toISOString());if(exceedsBudget&&next.result.alreadyRetained!==true)throw new Error('retained_source_limit');review=next.review;result=next.result;}
     else{if(exceedsBudget)throw new Error('retained_source_limit');if(matching(snapshot.candidate!).length)throw new Error('existing_review_conflict');if(db.prepare('SELECT id FROM reviews WHERE id=?').get(job.reviewId))throw new Error('review_identity_conflict');review=createImportedReview(job.reviewId,snapshot);result={snapshotId:snapshot.snapshotId};}
     save(review);job.state='admitted';job.reason=null;update(job);receipt={commandId:id,actorId:principal.actorId,state:'applied',jobId,jobRevision:job.jobRevision,result:{...result,reviewId:review.reviewId,reviewRevision:review.revision}};
    }catch(error){if(job.state==='result_ready')job.state='admission_conflict';job.reason=error instanceof Error?error.message:'source_unavailable';update(job);receipt={commandId:id,actorId:principal.actorId,state:'rejected',jobId,jobRevision:job.jobRevision,result:{},error:job.reason};}
    job.admission=receipt;put(job);db.prepare('INSERT INTO import_receipts VALUES (?,?,?,?)').run(id,principal.actorId,fingerprint,JSON.stringify(receipt));return receipt;
   });
  },
 };
};
