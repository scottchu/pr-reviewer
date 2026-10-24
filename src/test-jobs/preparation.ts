import {mkdir,writeFile,realpath} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestCanonical,HEAD_TEST_DEFINITION_DIGEST} from '../domain/public.ts';
import type {HeadTestJob} from '../domain/public.ts';
import type {Store,HeadTestGrant,HeadTestJournal} from '../storage/public.ts';
import {materializeHeadTestSource,headDigest} from './source.ts';
import {copyHeadTestClosure,inventoryHeadFiles} from './files.ts';
import {createHeadGitReader} from './git-process.ts';
import {createHeadBunRunner,verifyHeadBun} from './bun-process.ts';
import {accountHeadTestSource} from './source-account.ts';
import type {HeadBunRun} from './bun-process.ts';
declare const preparationBrand: unique symbol;
declare const configurationBrand: unique symbol;
export type HeadTestPreparationWitness=Readonly<{[preparationBrand]:true}>;
export type HeadTestConfiguration=Readonly<{[configurationBrand]:true}>;
type Source=Awaited<ReturnType<typeof materializeHeadTestSource>>;
type Closure=Awaited<ReturnType<typeof copyHeadTestClosure>>;
type Account=Awaited<ReturnType<typeof accountHeadTestSource>>;
export type HeadTestQualification=Readonly<{schema:'head-test-qualification-v1';repository:'scottchu/pr-reviewer';headSha:string;treeId:string;sourceManifestId:string;closureManifestId:string;sourceAccountId:string;runtimeSha256:string;runtimeVersion:'1.4.2';platform:'darwin-arm64';targetDigest:string;environmentPolicy:'head-test-env-v1';metadata:Closure['metadata'];provenance:'measured-existing-local-installation-not-vendor-attested'}>;
type ConfigurationData=Readonly<{qualification:HeadTestQualification;qualificationId:string;repository:string;donor:string}>;
type Prepared=Readonly<{journal:HeadTestJournal;jobId:string;invocationId:string;headSha:string;targetDigest:string;rootId:string;root:string;repository:string;donor:string;source:Source;closure:Closure;account:Account;runtimeSha256:string;version:HeadBunRun;qualificationId:string|null}>;
const preparations=new WeakMap<object,Prepared>(),configurations=new WeakMap<object,ConfigurationData>();
export const readHeadTestConfiguration=(value:HeadTestConfiguration):ConfigurationData|null=>{const record=configurations.get(value);return record?structuredClone(record):null;};
export const inspectHeadTestPreparation=(value:HeadTestPreparationWitness)=>{
 const record=preparations.get(value);if(!record)throw new Error('invalid_test_witness');
 return structuredClone({jobId:record.jobId,invocationId:record.invocationId,rootId:record.rootId,headSha:record.headSha,targetDigest:record.targetDigest,source:record.source,closure:record.closure,account:record.account,runtimeSha256:record.runtimeSha256,qualificationId:record.qualificationId});
};
export const isHeadTestPreparation=(value:HeadTestPreparationWitness,job:HeadTestJob,invocationId:string,rootIds:readonly string[],journal:HeadTestJournal):boolean=>{
 const record=preparations.get(value);return !!record&&headTestCanonical(record.journal)===headTestCanonical(journal)&&record.jobId===job.jobId&&record.invocationId===invocationId&&record.headSha===job.headSha&&record.targetDigest===job.target.digest&&rootIds.length===1&&rootIds[0]===record.rootId&&(job.provenance==='test_only_execution'||job.provenance==='qualified_local_configuration'&&job.qualificationId===record.qualificationId);
};
export const verifyHeadTestPreparedFiles=async(value:HeadTestPreparationWitness,check:()=>void)=>{
 const record=preparations.get(value);if(!record)throw new Error('invalid_test_witness');
 const entries=await inventoryHeadFiles(join(record.root,'source'),check),expected=[...record.source.manifest.entries.map(entry=>({path:entry.path,mode:entry.mode==='100755'?0o755:0o644,bytes:entry.bytes,sha256:entry.sha256})),...record.closure.manifest.packages.flatMap(pkg=>pkg.entries.map(entry=>({...entry,path:`node_modules/${pkg.entry}/${entry.path}`})))].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
 if(headTestCanonical(entries)!==headTestCanonical(expected))throw new Error('prepared_inputs_changed');await verifyHeadBun(check);
};
export const createHeadTestConfiguration=async(value:HeadTestPreparationWitness,trust:Readonly<{kind:'trusted-local-head';headSha:string;sourceAccountId:string}>):Promise<HeadTestConfiguration>=>{
 const record=preparations.get(value);if(!record||trust.kind!=='trusted-local-head'||trust.headSha!==record.headSha||trust.sourceAccountId!==record.account.sourceAccountId)throw new Error('qualification_required');
 const until=Date.now()+30000;await verifyHeadTestPreparedFiles(value,()=>{if(Date.now()>=until)throw new Error('qualification_deadline');});
 const qualification:HeadTestQualification={schema:'head-test-qualification-v1',repository:'scottchu/pr-reviewer',headSha:record.headSha,treeId:record.source.manifest.treeId,sourceManifestId:record.source.sourceManifestId,closureManifestId:record.closure.closureManifestId,sourceAccountId:record.account.sourceAccountId,runtimeSha256:record.runtimeSha256,runtimeVersion:'1.4.2',platform:'darwin-arm64',targetDigest:record.targetDigest,environmentPolicy:'head-test-env-v1',metadata:record.closure.metadata,provenance:'measured-existing-local-installation-not-vendor-attested'};
 const config=Object.freeze({}) as HeadTestConfiguration;configurations.set(config,{qualification,qualificationId:headDigest(headTestCanonical(qualification)),repository:record.repository,donor:record.donor});return config;
};
export const prepareHeadTestInputs=async({store,grant,executionRoot,fixtureInputs}:{store:Store;grant:HeadTestGrant;executionRoot:string;fixtureInputs?:Readonly<{repository:string;donor:string}>}):Promise<HeadTestPreparationWitness>=>{
 const {job,invocationId}=store.tests.input(grant),configured=store.tests.resolveHeadTestSource(grant);
 if(fixtureInputs&&job.provenance!=='test_only_execution')throw new Error('fixture_configuration_forbidden');
 const locators=job.provenance==='test_only_execution'?fixtureInputs:configured;if(!locators)throw new Error('source_unavailable');
 if(job.target.digest!==HEAD_TEST_DEFINITION_DIGEST||process.platform!=='darwin'||process.arch!=='arm64')throw new Error('runtime_unavailable');
 const rootId=store.tests.registerRoot(grant),root=join(await realpath(executionRoot),rootId),started=Date.now(),deadline=started+30000;
 const check=()=>{const control=store.tests.control(grant);if(!control.authorized||control.cancelled||control.stopReason)throw new Error(control.cancelled?'test_cancelled':'test_stopped');if(Date.now()>=deadline)throw new Error('prepare_deadline');};
 check();await mkdir(root,{mode:0o700});for(const child of ['empty','home','tmp','config','cache']){check();await mkdir(join(root,child),{mode:0o700});}await writeFile(join(root,'empty-bunfig.toml'),'',{flag:'wx',mode:0o600});
 const observer={journal:()=>store.tests.journal(grant),control:()=>store.tests.control(grant),recordStop:(reason:string)=>store.tests.recordStop(grant,reason),recordProcess:store.tests.recordProcess.bind(null,grant)};
 const read=createHeadGitReader({repository:locators.repository,headSha:job.headSha,ownedRoot:root,observer}),source=await materializeHeadTestSource({headSha:job.headSha,destination:join(root,'source'),read,check});
 const closure=await copyHeadTestClosure({source:join(root,'source'),donor:locators.donor,check}),runtimeSha256=await verifyHeadBun(check),version=await createHeadBunRunner({ownedRoot:root,observer,deadline})('runtime_version');
 if(!version.terminationConfirmed||version.reason||version.exitCode!==0||version.output.filter(item=>item.channel==='stdout').map(item=>item.text).join('').trim()!=='1.4.2')throw new Error('runtime_unavailable');
 const account=await accountHeadTestSource(join(root,'source'),source.manifest,check);check();
 const record:Prepared={journal:store.tests.journal(grant),jobId:job.jobId,invocationId,headSha:job.headSha,targetDigest:job.target.digest,rootId,root,repository:locators.repository,donor:locators.donor,source,closure,account,runtimeSha256,version,qualificationId:job.qualificationId??null};
 if(job.provenance==='qualified_local_configuration'){
  if(!configured)throw new Error('qualification_required');const q=configured.qualification;
  if(q.headSha!==job.headSha||q.sourceManifestId!==source.sourceManifestId||q.closureManifestId!==closure.closureManifestId||q.sourceAccountId!==account.sourceAccountId||q.runtimeSha256!==runtimeSha256||headTestCanonical(q.metadata)!==headTestCanonical(closure.metadata))throw new Error('qualification_changed');
 }
 if(Buffer.byteLength(headTestCanonical({source:source.manifest,closure:closure.manifest,account:account.account}))>1024*1024)throw new Error('test_evidence_limit');
 const witness=Object.freeze({}) as HeadTestPreparationWitness;preparations.set(witness,record);await verifyHeadTestPreparedFiles(witness,check);return witness;
};
