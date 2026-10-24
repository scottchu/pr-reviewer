import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,rename,realpath,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestCanonical,headTestDefinition} from '../domain/public.ts';
import type {HeadTestResult,HeadTestArtifact} from '../domain/public.ts';
import type {Store,HeadTestGrant,HeadTestJournal} from '../storage/public.ts';
import {headDigest} from './source.ts';
import {readHeadRegular} from './files.ts';
import {readHeadLiveAttempt,readPreparedHeadTest} from './preparation.ts';
import {observeHeadTestProcessQuiescence} from './evidence.ts';
declare const outcomeBrand:unique symbol;
export type HeadTestOutcomeWitness=Readonly<{[outcomeBrand]:true}>;
export type HeadArtifactLocation=Readonly<{artifactId:string;path:string}>;
type Outcome=Readonly<{journal:HeadTestJournal;result:HeadTestResult;locations:readonly HeadArtifactLocation[];artifactBytes:number;deadline:number;control:Readonly<{authorized:boolean;cancelled:boolean;stopReason:string|null}>}>;
const outcomes=new WeakMap<object,Outcome>();
const publications=new WeakMap<object,{root:string;artifacts:HeadTestArtifact[];locations:HeadArtifactLocation[]}>();
export const readHeadTestOutcome=(witness:HeadTestOutcomeWitness):Outcome|null=>{const value=outcomes.get(witness);return value?structuredClone(value):null;};
const observedCollection=(text:string)=>{
 const files=headTestDefinition().argvTemplate.slice(4),summary=text.match(/\n\s*([0-9]+) pass\n\s*([0-9]+) fail\n(?:\s*[0-9]+ expect\(\) calls\n)?Ran ([1-9][0-9]*) tests? across 4 files\./);
 if(!files.every(file=>text.split('\n').some(line=>line.trim()===`${file}:`))||!summary)return null;
 const passed=Number(summary[1]),failed=Number(summary[2]),total=Number(summary[3]);return passed+failed===total?{passed,failed,total}:null;
};
/** Publishes observation only. Exact journal/control validation at admission remains mandatory. */
export const observeHeadTestOutcome=async({store,grant,artifactRoot}:{store:Store;grant:HeadTestGrant;artifactRoot:string}):Promise<HeadTestOutcomeWitness|null>=>{
 const attempt=readHeadLiveAttempt(grant);if(!attempt||attempt.active)return null;
 const input=store.tests.input(grant),journal=store.tests.journal(grant),control=store.tests.control(grant);
 if(input.job.jobId!==attempt.job.jobId||input.invocationId!==attempt.invocationId||!observeHeadTestProcessQuiescence(journal))return null;
 if(attempt.run&&!attempt.run.terminationConfirmed)return null;
 const prepared=attempt.prepared?readPreparedHeadTest(attempt.prepared):undefined,output=attempt.outputBudget.snapshot(),run=attempt.run;
 const testText=Buffer.concat(output.chunks.filter(chunk=>chunk.role==='test_root').map(chunk=>Buffer.from(chunk.data))).toString('utf8'),collection=run?observedCollection(testText):null,collected=collection!==null;
 let state:HeadTestResult['state']='error',reason=attempt.failure??run?.reason??'execution_not_observed';
 if(control.cancelled){state='cancelled';reason='test_cancelled';}
 else if(!control.authorized){reason='unauthorized';}
 else if(Date.now()>=attempt.started+120000){state='timed_out';reason='test_deadline';}
 else if(control.stopReason||attempt.failure){reason=control.stopReason??attempt.failure!;state=reason.includes('deadline')?'timed_out':reason.includes('unavailable')||reason.includes('incompatible')||reason.includes('qualification')?'unavailable':'error';}
 else if(output.overflow){reason='output_limit';}
 else if(prepared&&run&&attempt.postVerified&&collected&&run.signal===null&&run.exitCode!==null&&!run.reason){if(run.exitCode===0&&collection!.failed===0){state='passed';reason='tests_passed';}else if(run.exitCode!==0&&collection!.failed>0){state='failed';reason='assertions_failed';}else{reason='execution_exit_inconsistent';}}
 else if(!prepared){state='unavailable';reason='preparation_incomplete';}
 const blobs:{kind:HeadTestArtifact['kind'];label:string;data:Buffer}[]=[];
 if(attempt.source||attempt.closure||attempt.account)blobs.push({kind:'source_evidence',label:'source_evidence',data:Buffer.from(headTestCanonical({source:attempt.source?.manifest??null,closure:attempt.closure?.manifest??null,account:attempt.account?.account??null,metadata:attempt.closure?.metadata??null}))});
 for(const role of ['git_prepare','runtime_version','test_root'] as const)for(const channel of ['stdout','stderr'] as const){const chunks=output.chunks.filter(chunk=>chunk.role===role&&chunk.channel===channel);if(chunks.length)blobs.push({kind:'process_output',label:`${role}.${channel}`,data:Buffer.concat(chunks.map(chunk=>Buffer.from(chunk.data)))});}
 const artifactBytes=blobs.reduce((sum,blob)=>sum+blob.data.length,0);if(artifactBytes>2*1024*1024-32768)throw new Error('test_evidence_limit');
 attempt.sealed=true;attempt.active=true;try{
 let artifacts:HeadTestArtifact[]=[],locations:HeadArtifactLocation[]=[];
 if(blobs.length){
 const root=await realpath(artifactRoot),stat=await lstat(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('artifact_unavailable');
 const old=publications.get(attempt);if(old&&old.root!==root)throw new Error('artifact_root_conflict');
 artifacts=old?.artifacts??[];locations=old?.locations??[];
 if(!old){const publication=randomUUID(),staging=join(root,`.${publication}.staging`),destination=join(root,publication);await mkdir(staging,{mode:0o700});
 for(const blob of blobs){const artifactId=randomUUID(),path=join(staging,artifactId),sha256=headDigest(blob.data);await writeFile(path,blob.data,{flag:'wx',mode:0o600});const bytes=await readHeadRegular(path,2*1024*1024,()=>{});if(headDigest(bytes)!==sha256)throw new Error('artifact_integrity_error');artifacts.push({artifactId,kind:blob.kind,label:blob.label,bytes:blob.data.length,sha256});locations.push({artifactId,path:join(destination,artifactId)});}
 await rename(staging,destination);publications.set(attempt,{root,artifacts,locations});}
 for(const artifact of artifacts){const location=locations.find(item=>item.artifactId===artifact.artifactId)!;await readHeadTestArtifact(location,artifact);}
 }
 const body:Omit<HeadTestResult,'resultId'>={schema:'head-test-result-v1',jobId:input.job.jobId,invocationId:input.invocationId,intent:{reviewId:input.job.reviewId,snapshotId:input.job.snapshotId,actorId:input.job.actorId,repository:input.job.repository,baseSha:input.job.baseSha,headSha:input.job.headSha,targetDigest:input.job.target.digest,qualificationId:input.job.qualificationId??null},coverage:prepared?'prepared_execution':journal.invocation.processes!.length?'partial_preparation':'no_process_execution',stage:attempt.stage,evidence:{treeId:attempt.source?.manifest.treeId??null,sourceManifestId:attempt.source?.sourceManifestId??null,closureManifestId:attempt.closure?.closureManifestId??null,sourceAccountId:attempt.account?.sourceAccountId??null,runtimeSha256:attempt.runtimeSha256??null,environmentId:input.job.preparation?.environmentId??null,absentReason:'not_completed'},processes:journal.invocation.processes!.map(item=>({ordinal:item.ordinal,role:item.role,state:item.state,exitCode:item.exitCode??null,signal:item.signal??null})),state,reason,preparation:input.job.preparation??null,preparationAbsence:input.job.preparation?null:'not_completed',execution:run?{exitCode:run.exitCode,signal:run.signal,collectionObserved:collected,counts:collection}:null,executionAbsence:run?null:'not_started',output:{observedBytes:output.observedBytes,retainedBytes:output.retainedBytes,overflow:output.overflow},artifacts};
 const result:HeadTestResult={...body,resultId:headDigest(headTestCanonical(body))};
 if(headTestCanonical(journal)!==headTestCanonical(store.tests.journal(grant))||!observeHeadTestProcessQuiescence(journal))throw new Error('test_outcome_changed');
 const witness=Object.freeze({}) as HeadTestOutcomeWitness;outcomes.set(witness,{journal,result,locations,artifactBytes,deadline:attempt.started+120000,control:{authorized:control.authorized,cancelled:control.cancelled,stopReason:control.stopReason}});return witness;
 }finally{attempt.active=false;}
};
export const readHeadTestArtifact=async(location:HeadArtifactLocation,artifact:HeadTestArtifact):Promise<Buffer>=>{
 let bytes:Buffer;try{bytes=await readHeadRegular(location.path,2*1024*1024,()=>{});}catch{throw new Error('artifact_integrity_error');}if(bytes.length!==artifact.bytes||headDigest(bytes)!==artifact.sha256)throw new Error('artifact_integrity_error');return bytes;
};
