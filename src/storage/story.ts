import type {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {storyCommandSchema,storyQuerySchema,storyContextQuerySchema,storyCanonical,storyReferences,validateStoryStructure,validateStorySemanticFocus} from '../domain/public.ts';
import type {Principal,Review,Snapshot,StoryCommand,StoryQuery,StoryContextQuery,StoryAuthor,StoryCapture,StoryVersion,StoryVersionSummary,StoryReceipt,StoryError,StoryEvidence,StoryEvidenceQuery,StoryView,StoryContextView} from '../domain/public.ts';
export type StoryLimits={retainedBytes?:number};
type Head={storyRevision:number;contextRevision:number;currentVersionId:string|null;seriesAuthor:StoryAuthor|null};
type Context={captureIds:string[]};
type Ports={db:DatabaseSync;tx:<T>(operation:()=>T)=>T;load:(id:string)=>Review;authenticate:(token:string)=>Principal;authorize:(principal:Principal,review:Review)=>void;resolveEvidence:(token:string,query:StoryEvidenceQuery)=>StoryEvidence;limits?:StoryLimits};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const encoded=(value:unknown)=>{const body=storyCanonical(value);return {body,bytes:Buffer.byteLength(body,'utf8')};};
const errors=new Set<StoryError>(['invalid_request','unauthorized','stale_attachment','source_unavailable','command_conflict','story_reference_invalid','story_structure_invalid','story_scope_invalid','story_context_conflict','story_conflict','story_author_conflict','story_storage_limit','story_version_unavailable','story_context_unavailable','revision_unavailable']);
const errorCode=(error:unknown):StoryError=>error instanceof Error&&errors.has(error.message as StoryError)?error.message as StoryError:'invalid_request';
const fail=(code:StoryError):never=>{throw new Error(code);};
const summary=(version:StoryVersion):StoryVersionSummary=>{const {story,...rest}=version;return {...rest,title:story.title};};
export const createStoryStore=({db,tx,load,authenticate,authorize,resolveEvidence,limits={}}:Ports)=>{
 const bodyLimit=limits.retainedBytes??8*1024*1024;if(!Number.isSafeInteger(bodyLimit)||bodyLimit<0||bodyLimit>8*1024*1024)throw new Error('invalid_request');
 db.exec(`CREATE TABLE IF NOT EXISTS story_heads(review_id TEXT NOT NULL REFERENCES reviews(id),snapshot_id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(review_id,snapshot_id));
 CREATE TABLE IF NOT EXISTS story_captures(id TEXT PRIMARY KEY,review_id TEXT NOT NULL REFERENCES reviews(id),snapshot_id TEXT NOT NULL,body TEXT NOT NULL,bytes INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS story_contexts(review_id TEXT NOT NULL REFERENCES reviews(id),snapshot_id TEXT NOT NULL,revision INTEGER NOT NULL,body TEXT NOT NULL,bytes INTEGER NOT NULL,PRIMARY KEY(review_id,snapshot_id,revision));
 CREATE TABLE IF NOT EXISTS story_versions(id TEXT PRIMARY KEY,review_id TEXT NOT NULL REFERENCES reviews(id),snapshot_id TEXT NOT NULL,revision INTEGER NOT NULL,body TEXT NOT NULL,bytes INTEGER NOT NULL,UNIQUE(review_id,snapshot_id,revision));
 CREATE TABLE IF NOT EXISTS story_receipts(id TEXT PRIMARY KEY,actor TEXT NOT NULL,fingerprint TEXT NOT NULL,body TEXT NOT NULL);`);
 const head=(reviewId:string,snapshotId:string):Head=>{const row=db.prepare('SELECT body FROM story_heads WHERE review_id=? AND snapshot_id=?').get(reviewId,snapshotId) as {body:string}|undefined;return row?JSON.parse(row.body) as Head:{storyRevision:0,contextRevision:0,currentVersionId:null,seriesAuthor:null};};
 const saveHead=(reviewId:string,snapshotId:string,value:Head)=>db.prepare('INSERT INTO story_heads VALUES (?,?,?) ON CONFLICT(review_id,snapshot_id) DO UPDATE SET body=excluded.body').run(reviewId,snapshotId,storyCanonical(value));
 const auth=(token:string,reviewId:string,snapshotId:string)=>{const principal=authenticate(token),review=load(reviewId);authorize(principal,review);const snapshot=(review.snapshots??[review.snapshot]).find(snapshot=>snapshot.snapshotId===snapshotId);if(!snapshot)fail('source_unavailable');if(principal.kind==='bootstrap')fail('unauthorized');return {principal:principal as StoryAuthor,review,snapshot:snapshot!};};
 const contextAt=(reviewId:string,snapshotId:string,revision:number):Context=>{if(revision===0)return {captureIds:[]};const row=db.prepare('SELECT body FROM story_contexts WHERE review_id=? AND snapshot_id=? AND revision=?').get(reviewId,snapshotId,revision) as {body:string}|undefined;if(!row)fail('story_context_unavailable');return JSON.parse(row!.body) as Context;};
 const captureAt=(reviewId:string,snapshotId:string,id:string):StoryCapture=>{const row=db.prepare('SELECT body FROM story_captures WHERE id=? AND review_id=? AND snapshot_id=?').get(id,reviewId,snapshotId) as {body:string}|undefined;if(!row)fail('story_context_unavailable');return JSON.parse(row!.body) as StoryCapture;};
 const versionAt=(reviewId:string,snapshotId:string,id:string):StoryVersion=>{const row=db.prepare('SELECT body FROM story_versions WHERE id=? AND review_id=? AND snapshot_id=?').get(id,reviewId,snapshotId) as {body:string}|undefined;if(!row)fail('story_version_unavailable');return JSON.parse(row!.body) as StoryVersion;};
 const series=(principal:StoryAuthor,current:Head)=>{if(principal.kind==='agent'&&current.seriesAuthor&&(current.seriesAuthor.kind!=='agent'||current.seriesAuthor.actorId!==principal.actorId||current.seriesAuthor.attachmentId!==principal.attachmentId||current.seriesAuthor.generation!==principal.generation))fail('story_author_conflict');};
 const quota=(reviewId:string,added:number)=>{let retained=0;for(const table of ['story_captures','story_contexts','story_versions'])retained+=(db.prepare(`SELECT COALESCE(SUM(bytes),0) AS bytes FROM ${table} WHERE review_id=?`).get(reviewId) as {bytes:number}).bytes;if(retained+added>bodyLimit)fail('story_storage_limit');};
 const context=(token:string,input:StoryContextQuery):StoryContextView=>{const query=storyContextQuerySchema.parse(input);auth(token,query.reviewId,query.snapshotId);const current=head(query.reviewId,query.snapshotId),revision=query.contextRevision??current.contextRevision,selection=contextAt(query.reviewId,query.snapshotId,revision),captures=query.captureId?[captureAt(query.reviewId,query.snapshotId,query.captureId)]:selection.captureIds.map(id=>captureAt(query.reviewId,query.snapshotId,id));return {reviewId:query.reviewId,snapshotId:query.snapshotId,currentContextRevision:current.contextRevision,selectedRevision:revision,selectedCaptureIds:selection.captureIds,captures,missingKinds:(['Epic','Ticket','PR'] as const).filter(kind=>!captures.some(capture=>capture.kind===kind))};};
 const validateContext=(reviewId:string,snapshotId:string,revision:number,story:Extract<StoryCommand,{type:'PublishStory'}>['story'])=>{const selection=contextAt(reviewId,snapshotId,revision);if(story.captureIds.some(id=>!selection.captureIds.includes(id)))fail('story_reference_invalid');for(const id of story.captureIds)captureAt(reviewId,snapshotId,id);for(const ref of storyReferences(story))if(ref.type==='capture'&&!story.captureIds.includes(ref.captureId))fail('story_reference_invalid');};
 const evidenceQuery=(command:Extract<StoryCommand,{type:'PublishStory'}>):StoryEvidenceQuery=>({reviewId:command.reviewId,snapshotId:command.snapshotId,...(command.story.analysisId?{analysisId:command.story.analysisId,corpusId:command.story.corpusId!}:{}),references:storyReferences(command.story)});
 const command=(token:string,input:StoryCommand):StoryReceipt=>{
  const parsed=storyCommandSchema.safeParse(input);if(!parsed.success)fail('invalid_request');const command=parsed.data!;
  const {principal,snapshot,review}=auth(token,command.reviewId,command.snapshotId);
  if(command.type==='PutStoryContext'&&principal.kind!=='user')fail('unauthorized');
  if(command.type==='PublishStory')series(principal,head(command.reviewId,command.snapshotId));
  const fingerprint=hash(storyCanonical({principal,command}));
  // Exact authorized retries bypass revalidation of mutable current context, never authority.
  const existing=db.prepare('SELECT actor,fingerprint,body FROM story_receipts WHERE id=?').get(command.commandId) as {actor:string;fingerprint:string;body:string}|undefined;
  let validationError:StoryError|undefined;
  if(!existing)try{
   if(encoded(command).bytes>(command.type==='PublishStory'?256*1024:128*1024))fail('invalid_request');
   if(command.type==='PublishStory'){
    validateStoryStructure(command.story,snapshot);validateContext(command.reviewId,command.snapshotId,command.contextRevision,command.story);
    if(command.story.questionId&&!review.questions.some(question=>question.questionId===command.story.questionId&&question.anchor.snapshotId===command.snapshotId))fail('story_reference_invalid');
    const evidence=resolveEvidence(token,evidenceQuery(command));if(evidence.basisUnavailable||evidence.invalid.length)fail('story_reference_invalid');
    validateStorySemanticFocus(command.story,new Map(evidence.facts.map(item=>[storyCanonical(item.reference),item])));
   }
  }catch(error){validationError=errorCode(error);}
  return tx(()=>{
   const {principal}=auth(token,command.reviewId,command.snapshotId),current=head(command.reviewId,command.snapshotId);
   if(command.type==='PutStoryContext'&&principal.kind!=='user')fail('unauthorized');if(command.type==='PublishStory')series(principal,current);
   const base:StoryReceipt={commandId:command.commandId,actorId:principal.actorId,state:'rejected',reviewId:command.reviewId,snapshotId:command.snapshotId,storyRevision:current.storyRevision,contextRevision:current.contextRevision,result:{}};
   const old=db.prepare('SELECT actor,fingerprint,body FROM story_receipts WHERE id=?').get(command.commandId) as {actor:string;fingerprint:string;body:string}|undefined;
   if(old)return old.actor===principal.actorId&&old.fingerprint===fingerprint?JSON.parse(old.body) as StoryReceipt:{...base,error:'command_conflict'};
   if(db.prepare('SELECT id FROM receipts WHERE id=?').get(command.commandId)||db.prepare('SELECT id FROM analysis_receipts WHERE id=?').get(command.commandId)||db.prepare('SELECT id FROM import_receipts WHERE id=?').get(command.commandId))return {...base,error:'command_conflict'};
   let receipt:StoryReceipt;
   db.exec('SAVEPOINT story_value');
   try{
    if(validationError)fail(validationError);
    if(command.type==='PutStoryContext'){
     if(command.expectedContextRevision!==current.contextRevision)fail('story_context_conflict');
     const previous=contextAt(command.reviewId,command.snapshotId,current.contextRevision);
     let selected:string[],capture:StoryCapture|undefined;
     if(command.action.type==='select'){
      selected=command.action.captureIds;if(new Set(selected).size!==selected.length)fail('story_structure_invalid');for(const id of selected)captureAt(command.reviewId,command.snapshotId,id);
     }else{
      const value=command.action.capture,supersedes=value.supersedesCaptureId;
      if(supersedes&&!previous.captureIds.includes(supersedes))fail('story_reference_invalid');
      capture={captureId:randomUUID(),kind:value.kind,title:value.title,text:value.text,...(value.originUrl?{originUrl:value.originUrl}:{}),...(value.supersedesCaptureId?{supersedesCaptureId:value.supersedesCaptureId}:{}),actorId:principal.actorId,createdAt:new Date().toISOString(),contentHash:hash(value.text),freshness:value.originUrl?'captured':'unknown'};
      selected=previous.captureIds.filter(id=>id!==supersedes).concat(capture!.captureId);if(selected.length>16)fail('invalid_request');
     }
     const body=encoded({captureIds:selected}),captureBody=capture?encoded(capture):null;
     quota(command.reviewId,body.bytes+(captureBody?.bytes??0));
     if(capture&&captureBody)db.prepare('INSERT INTO story_captures VALUES (?,?,?,?,?)').run(capture.captureId,command.reviewId,command.snapshotId,captureBody.body,captureBody.bytes);
     const next={...current,contextRevision:current.contextRevision+1};db.prepare('INSERT INTO story_contexts VALUES (?,?,?,?,?)').run(command.reviewId,command.snapshotId,next.contextRevision,body.body,body.bytes);saveHead(command.reviewId,command.snapshotId,next);
     receipt={...base,state:'applied',contextRevision:next.contextRevision,result:capture?{captureId:capture.captureId}:{}};
    }else{
     if(command.contextRevision!==current.contextRevision)fail('story_context_conflict');
     if(command.expectedStoryRevision!==current.storyRevision||command.replacesVersionId!==undefined&&command.replacesVersionId!==current.currentVersionId)fail('story_conflict');
     validateContext(command.reviewId,command.snapshotId,command.contextRevision,command.story);
     const version:StoryVersion={reviewId:command.reviewId,snapshotId:command.snapshotId,versionId:randomUUID(),storyRevision:current.storyRevision+1,contextRevision:command.contextRevision,contentHash:hash(storyCanonical(command.story)),author:principal,createdAt:new Date().toISOString(),previousVersionId:current.currentVersionId,story:command.story};
     const body=encoded(version);quota(command.reviewId,body.bytes);db.prepare('INSERT INTO story_versions VALUES (?,?,?,?,?,?)').run(version.versionId,command.reviewId,command.snapshotId,version.storyRevision,body.body,body.bytes);saveHead(command.reviewId,command.snapshotId,{...current,storyRevision:version.storyRevision,currentVersionId:version.versionId,seriesAuthor:current.seriesAuthor??principal});receipt={...base,state:'applied',storyRevision:version.storyRevision,result:{versionId:version.versionId}};
    }
    db.exec('RELEASE story_value');
   }catch(error){db.exec('ROLLBACK TO story_value; RELEASE story_value');receipt={...base,error:errorCode(error)};}
   db.prepare('INSERT INTO story_receipts VALUES (?,?,?,?)').run(command.commandId,principal.actorId,fingerprint,storyCanonical(receipt));return receipt;
  });
 };
 const query=(token:string,input:StoryQuery):StoryView=>{
  const query=storyQuerySchema.parse(input),{review}=auth(token,query.reviewId,query.snapshotId),current=head(query.reviewId,query.snapshotId);
  if(current.storyRevision<(query.minimumStoryRevision??0)||current.contextRevision<(query.minimumContextRevision??0))fail('revision_unavailable');
  const versions=(db.prepare('SELECT body FROM story_versions WHERE review_id=? AND snapshot_id=? ORDER BY revision').all(query.reviewId,query.snapshotId) as {body:string}[]).map(row=>JSON.parse(row.body) as StoryVersion),versionId=query.versionId??current.currentVersionId,version=versionId?versionAt(query.reviewId,query.snapshotId,versionId):null;
  const evidence=resolveEvidence(token,{reviewId:query.reviewId,snapshotId:query.snapshotId,...(version?.story.analysisId?{analysisId:version.story.analysisId,corpusId:version.story.corpusId!}:{}),references:version?storyReferences(version.story):[]});
  const broken=[...evidence.invalid];if(version)try{validateContext(query.reviewId,query.snapshotId,version.contextRevision,version.story);}catch{for(const ref of storyReferences(version.story))if(ref.type==='capture')broken.push({reference:ref,reason:'story_context_unavailable'});}
  const latest=versions.at(-1);return {reviewId:query.reviewId,snapshotId:query.snapshotId,currentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId,currentAnalysisId:evidence.selectedAnalysisId,storyRevision:current.storyRevision,contextRevision:current.contextRevision,seriesAuthor:current.seriesAuthor,currentVersion:latest?summary(latest):null,version,versions:versions.map(summary),newerVersion:!!version&&version.storyRevision<current.storyRevision,newerContext:!!version&&version.contextRevision<current.contextRevision,historicalAnalysis:!!version?.story.analysisId&&version.story.analysisId!==evidence.selectedAnalysisId,staticNeighborhoodAvailable:!!version?.story.analysisId&&!evidence.basisUnavailable,basisUnavailable:evidence.basisUnavailable,brokenEvidence:broken};
 };
 return {command,query,context};
};
