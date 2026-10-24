import {createHash} from "node:crypto";
import {loadSourceContext} from "../source-acquisition/public.ts";
import type {ContextCorpus,ContextIdentity,ContextInput,AcquisitionEffects} from "../source-acquisition/public.ts";
import {canonical,snapshotFor} from "../domain/public.ts";
import type {Review,Snapshot} from "../domain/public.ts";
import type {DeclarationInventoryInput,AnalysisBudgets} from "../source-analysis/public.ts";
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const records=new WeakMap<object,{jobId:string;reviewId:string;snapshot:string;corpus:string}>();
declare const contextBrand:unique symbol;
export type PreparedContextWitness={readonly [contextBrand]:true};
export const contextIdentity=(snapshot:Snapshot,sourceProject?:string):ContextIdentity=>{
 if(snapshot.candidate){const {provider,host,targetProject,number,sourceProject}=snapshot.candidate;return {provider,host,targetProject,number,sourceProject};}
 if(!sourceProject)throw new Error("source_project_required");
 const url=new URL(snapshot.prUrl);if(url.username||url.password)throw new Error("source_identity_conflict");
 return {provider:"github",host:url.host,targetProject:snapshot.repository,number:snapshot.prNumber,sourceProject};
};
export const isPreparedContextWitness=(value:unknown,jobId:string,reviewId:string,snapshot:Snapshot,corpus:ContextCorpus):value is PreparedContextWitness=>{
 if(!value||typeof value!=="object")return false;
 const record=records.get(value);return Boolean(record&&record.jobId===jobId&&record.reviewId===reviewId&&record.snapshot===canonical(snapshot)&&record.corpus===canonical(corpus));
};
export const acquirePreparedContext=async(input:{jobId:string;review:Review;snapshotId:string;worktree:string;sourceProject?:string;priorityPaths?:ContextInput["priorityPaths"]},effects:AcquisitionEffects)=>{
 const snapshot=snapshotFor(input.review,input.snapshotId);if(!snapshot)throw new Error("source_unavailable");
 const identity=contextIdentity(snapshot,input.sourceProject);
 const result=await loadSourceContext({worktree:input.worktree,snapshotId:snapshot.snapshotId,identity,commits:{base:snapshot.baseSha,head:snapshot.headSha},...(input.priorityPaths?{priorityPaths:input.priorityPaths}:{})},effects);
 if(result.kind!=="prepared")return result;
 const {corpus}=result,{corpusId,...data}=corpus;
 if(hash(JSON.stringify({...data,sources:corpus.sources.map(({content,...metadata})=>metadata)}))!==corpusId||canonical(corpus.identity)!==canonical(identity)||corpus.snapshotId!==snapshot.snapshotId||corpus.commits.base!==snapshot.baseSha||corpus.commits.head!==snapshot.headSha)throw new Error("source_identity_conflict");
 const keys=new Set<string>();
 for(const source of corpus.sources){
  const key=canonical([source.side,source.path]);if(keys.has(key)||hash(source.content)!==source.contentHash)throw new Error("source_identity_conflict");keys.add(key);
  const bytes=Buffer.from(source.content,"utf8"),object=createHash(source.objectId.length===64?"sha256":"sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
  if(object!==source.objectId)throw new Error("source_identity_conflict");
 }
 for(const source of snapshot.sources){const overlap=corpus.sources.find(item=>item.side===source.side&&item.path===source.path);if(overlap&&(overlap.content!==source.content||overlap.contentHash!==source.hash||("objectId" in source&&source.objectId!==overlap.objectId)))throw new Error("source_identity_conflict");}
 const witness=Object.freeze({}) as PreparedContextWitness;records.set(witness,{jobId:input.jobId,reviewId:input.review.reviewId,snapshot:canonical(snapshot),corpus:canonical(corpus)});
 return {kind:"prepared" as const,corpus,issues:result.issues,witness};
};
// This value does not load TypeScript into the gateway. The worker revalidates all limits.
const budgets:AnalysisBudgets={inventoryPathsPerSide:4096,inventoryBytes:2*1024*1024,filesPerSide:128,fileBytes:256*1024,totalBytes:4*1024*1024,seeds:64,astNodes:200000,invocationSites:10000,outputNodes:2000,outputSites:4000,aliasPatterns:32,aliasTargets:4,reExportLinks:32};
export const contextAnalysisInput=(corpus:ContextCorpus):DeclarationInventoryInput=>({
 contract:"source-neighborhood-v1",snapshotId:corpus.snapshotId,change:{repository:corpus.identity.targetProject,provider:corpus.identity.provider,changeId:String(corpus.identity.number)},commits:corpus.commits,
 corpus:{base:{commit:corpus.commits.base,inventory:corpus.accounts.base.enumeration==="complete"?"repository-enumeration":"selected-context",acquisition:corpus.contract},head:{commit:corpus.commits.head,inventory:corpus.accounts.head.enumeration==="complete"?"repository-enumeration":"selected-context",acquisition:corpus.contract}},
 sources:corpus.ledger.filter(row=>row.kind==="source").map(row=>{const source=corpus.sources.find(item=>item.side===row.side&&item.path===row.path);return {side:row.side,path:row.path,commit:row.commit,role:row.role,selected:row.selected,...(source?{source:{content:source.content,contentHash:source.contentHash,objectId:source.objectId}}:{exclusion:row.preparation==="prepared"?"missing" as const:row.preparation})};}),profile:{name:"repository-static-v1"},budgets:{...budgets},
});
