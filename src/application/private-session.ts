import {z} from 'zod';
import {anchorSchema,commandSchema,storyReferenceSchema,semanticAnchorSchema} from '../domain/public.ts';
import type {Receipt} from '../domain/public.ts';
export const PENDING_QUESTION_KEY='pr-reviewer:pending-question:v1';
export const PRIVATE_VIEW_KEY='pr-reviewer:private-view:v1';
export type SessionStoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const id=z.string().min(1).max(128),digest=z.string().regex(/^[a-f0-9]{64}$/),finite=z.number().finite();
const point=z.object({x:finite,y:finite}).strict(),viewport=point.extend({zoom:finite.min(.1).max(4)}).strict();
export const draftSchema=z.object({id,anchor:anchorSchema.nullable(),comparisonKey:z.string().max(4096).optional(),parentQuestionId:id.optional(),text:z.string(),submitted:z.boolean()}).strict();
export type QuestionDraft=z.infer<typeof draftSchema>;
const cursor=z.object({versionId:id,chapterId:id,stepId:id,index:z.number().int().min(0).max(31)}).strict();
const structural=z.object({fileKey:z.string().max(4096),context:z.boolean(),spans:z.boolean(),spanId:z.string().max(4096),viewport}).strict();
const semantic=z.object({analysisId:id.nullable(),focus:z.string().max(4096),viewport,fullSource:z.boolean(),sourceAnchor:semanticAnchorSchema.nullable(),corpusId:id.nullable()}).strict();
export const graphFramesSchema=z.object({structural:structural.nullable(),semantic:semantic.nullable()}).strict();
export type GraphFrames=z.infer<typeof graphFramesSchema>;
export const returnFrameSchema=z.object({snapshotId:id,versionId:id.nullable(),cursor:cursor.nullable(),elapsedMs:finite.min(0).max(8000),surface:z.enum(['flow','diff']),position:point,pageScroll:finite.min(0),maps:graphFramesSchema,originalDraftId:id,evidence:storyReferenceSchema.nullable()}).strict();
export type StoryReturnFrame=z.infer<typeof returnFrameSchema>;
export const privateViewSchema=z.object({reviewId:id,snapshotId:id,versionId:id.nullable(),cursor:cursor.nullable(),elapsedMs:finite.min(0).max(8000),surface:z.enum(['flow','diff']),position:point,pageScroll:finite.min(0),maps:graphFramesSchema,activeDraftId:id,drafts:z.array(draftSchema).min(1).max(2),returnFrame:returnFrameSchema.nullable()}).strict().refine(value=>{const active=value.drafts.find(draft=>draft.id===value.activeDraftId),frame=value.returnFrame;return new Set(value.drafts.map(draft=>draft.id)).size===value.drafts.length&&Boolean(active)&&(!active?.anchor||active.anchor.snapshotId===value.snapshotId)&&(!value.cursor||value.cursor.versionId===value.versionId)&&(!frame||value.drafts.some(draft=>draft.id===frame.originalDraftId)&&frame.originalDraftId!==value.activeDraftId&&(!frame.cursor||frame.cursor.versionId===frame.versionId));},'inconsistent_private_view');
export type PrivateStoryView=z.infer<typeof privateViewSchema>;
const receiptSchema=z.object({commandId:id,actorId:id,state:z.enum(['applied','rejected']),revision:z.number().int().nonnegative(),cursor:z.number().int().nonnegative(),result:z.union([z.object({questionId:id,eventId:id.nullable()}).strict(),z.object({}).strict()]).transform(value=>value as Record<string,unknown>),error:z.string().max(256).optional()}).strict();
export const pendingQuestionSchema=z.object({schema:z.literal(1),origin:z.string().min(1).max(4096),scope:digest,reviewId:id,draftId:id,phase:z.enum(['awaiting_ack','accepted_awaiting_readback']),request:z.string(),fingerprint:digest,receipt:receiptSchema.optional()}).strict();
export type PendingQuestion=z.infer<typeof pendingQuestionSchema>;
const viewEnvelopeSchema=z.object({schema:z.literal(1),origin:z.string().min(1).max(4096),scope:digest,submitted:z.array(id).max(64),omitted:z.array(id).max(2),value:privateViewSchema.nullable()}).strict();
export type PrivateViewEnvelope=z.infer<typeof viewEnvelopeSchema>;
export type QuestionRecovery=Readonly<{state:'none'|'locked'|'quarantined'|'awaiting_ack'|'accepted_awaiting_readback'|'storage_unavailable';message:string;busy:boolean;reviewId?:string;snapshotId?:string;draftId?:string;commandId?:string}>;
export type PrivateSession=ReturnType<typeof createPrivateSession>;
export const encodedBytes=(text:string)=>new TextEncoder().encode(text).length;
export const requestFingerprint=async(request:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request))),value=>value.toString(16).padStart(2,'0')).join('');
export const credentialScope=(origin:string,credential:string)=>{const bearer=credential.trim();return requestFingerprint(`pr-reviewer-credential-scope-v1\0${encodedBytes(origin)}:${origin}${encodedBytes(bearer)}:${bearer}`);};
export const parsePendingCommand=(record:PendingQuestion)=>{
 const command=commandSchema.parse(JSON.parse(record.request));
 if(command.type!=='AskQuestion'||command.reviewId!==record.reviewId)throw new Error('pending_quarantined');
 if(!command.text.trim()||encodedBytes(command.text.trim())>16384)throw new Error('pending_quarantined');
 if(record.phase==='accepted_awaiting_readback'&&(!record.receipt||record.receipt.state!=='applied'||record.receipt.commandId!==command.commandId||typeof record.receipt.result.questionId!=='string'||record.receipt.result.eventId!==null&&typeof record.receipt.result.eventId!=='string'))throw new Error('pending_quarantined');
 return command;
};
const browserStorage:SessionStoragePort={getItem:key=>sessionStorage.getItem(key),setItem:(key,value)=>sessionStorage.setItem(key,value),removeItem:key=>sessionStorage.removeItem(key)};
export const createPrivateSession=(options:{storage?:SessionStoragePort;origin?:string;limits?:{requestBytes?:number;pendingBytes?:number;viewBytes?:number}}={})=>{
 const storage=options.storage??browserStorage,origin=options.origin??(typeof location==='undefined'?'unavailable-origin':location.origin);
 const limit=(value:number|undefined,maximum:number)=>{if(value===undefined)return maximum;if(!Number.isInteger(value)||value<1||value>maximum)throw new Error('invalid_private_limit');return value;};
 const limits={requestBytes:limit(options.limits?.requestBytes,128*1024),pendingBytes:limit(options.limits?.pendingBytes,256*1024),viewBytes:limit(options.limits?.viewBytes,64*1024)};
 const get=(key:string)=>{try{return storage.getItem(key);}catch{throw new Error('recovery_storage_unavailable');}};
 const write=(key:string,raw:string)=>{try{storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw new Error('equality');}catch{throw new Error('recovery_storage_unavailable');}};
 const pendingValue=(raw:string)=>{
  if(encodedBytes(raw)>limits.pendingBytes)throw new Error('pending_quarantined');
  const record=pendingQuestionSchema.parse(JSON.parse(raw));if(encodedBytes(record.request)>limits.requestBytes)throw new Error('pending_quarantined');parsePendingCommand(record);return record;
 };
 const viewValue=(raw:string)=>{if(encodedBytes(raw)>limits.viewBytes)throw new Error('view_quarantined');return viewEnvelopeSchema.parse(JSON.parse(raw));};
 const putView=(record:PrivateViewEnvelope)=>{const raw=JSON.stringify(viewEnvelopeSchema.parse(record));if(encodedBytes(raw)>limits.viewBytes)throw new Error('view_record_too_large');write(PRIVATE_VIEW_KEY,raw);};
 const readView=(scope:string):{kind:'none'|'record'|'locked'|'quarantined'|'storage_unavailable';record?:PrivateViewEnvelope}=>{
  let raw:string|null;try{raw=get(PRIVATE_VIEW_KEY);}catch{return {kind:'storage_unavailable'};}if(raw===null)return {kind:'none'};
  try{const record=viewValue(raw);if(record.origin!==origin||record.scope!==scope)return {kind:'locked'};return {kind:'record',record};}catch{return {kind:'quarantined'};}
 };
 return {
  origin,limits,
  scope:(token:string)=>credentialScope(origin,token),
  readPending:async():Promise<{kind:'none'|'record'|'quarantined'|'storage_unavailable';record?:PendingQuestion}>=>{
   let raw:string|null;try{raw=get(PENDING_QUESTION_KEY);}catch{return {kind:'storage_unavailable'};}if(raw===null)return {kind:'none'};
   try{const record=pendingValue(raw);if(await requestFingerprint(record.request)!==record.fingerprint)return {kind:'quarantined'};return {kind:'record',record};}catch{return {kind:'quarantined'};}
  },
  writePending:(input:PendingQuestion)=>{
   const record=pendingQuestionSchema.parse(input);parsePendingCommand(record);if(encodedBytes(record.request)>limits.requestBytes)throw new Error('question_request_too_large');
   const raw=JSON.stringify(record);if(encodedBytes(raw)>limits.pendingBytes)throw new Error('pending_record_too_large');
   const existing=get(PENDING_QUESTION_KEY);if(existing!==null){let previous:PendingQuestion;try{previous=pendingValue(existing);}catch{throw new Error('pending_quarantined');}if(previous.fingerprint!==record.fingerprint||previous.scope!==record.scope||previous.request!==record.request||previous.draftId!==record.draftId||previous.origin!==record.origin||previous.reviewId!==record.reviewId)throw new Error('submission_unknown');}
   write(PENDING_QUESTION_KEY,raw);
  },
  clearPending:(record:PendingQuestion)=>{const raw=get(PENDING_QUESTION_KEY);if(raw===null)return;let current:PendingQuestion;try{current=pendingValue(raw);}catch{throw new Error('pending_quarantined');}if(current.scope!==record.scope||current.fingerprint!==record.fingerprint||current.draftId!==record.draftId||current.request!==record.request||current.origin!==record.origin||current.reviewId!==record.reviewId||current.phase!==record.phase||JSON.stringify(current.receipt)!==JSON.stringify(record.receipt))throw new Error('submission_superseded');try{storage.removeItem(PENDING_QUESTION_KEY);if(storage.getItem(PENDING_QUESTION_KEY)!==null)throw new Error('equality');}catch{throw new Error('recovery_storage_unavailable');}},
  readView,
  saveView:(scope:string,value:PrivateStoryView):{saved:boolean;message:string;omitted:string[]}=>{
   const loaded=readView(scope);if(loaded.kind==='quarantined'||loaded.kind==='locked'||loaded.kind==='storage_unavailable')return {saved:false,message:`view_${loaded.kind}`,omitted:[]};
   const submitted=loaded.record?.submitted??[],omitted:string[]=[];let unavailable=false;
   const drafts=value.drafts.map(draft=>{if(submitted.includes(draft.id))return {...draft,text:'',submitted:true};if(encodedBytes(draft.text)>8192||loaded.record?.omitted.includes(draft.id)&&draft.text===''){omitted.push(draft.id);if(draft.text==='')unavailable=true;return {...draft,text:''};}return draft;});
   try{putView({schema:1,origin,scope,submitted,omitted,value:{...value,drafts}});return {saved:true,message:unavailable?'Saved oversize draft text is unavailable after reload. Enter replacement text or reset the ordinary saved view.':omitted.length?'Oversize drafts remain in memory; their text cannot recover after reload.':'',omitted};}catch(error){return {saved:false,message:error instanceof Error?error.message:'view_storage_unavailable',omitted};}
  },
  invalidateDraft:(scope:string,draftId:string)=>{
   const loaded=readView(scope);if(!['none','record'].includes(loaded.kind))throw new Error(`view_${loaded.kind}`);
   const previous=loaded.record,value=previous?.value??null,all=[...(previous?.submitted??[]).filter(id=>id!==draftId),draftId],referenced=new Set(value?.drafts.map(draft=>draft.id)??[]);const protectedIds=all.filter(id=>referenced.has(id)),submitted=[...protectedIds,...all.filter(id=>!referenced.has(id)).slice(-(64-protectedIds.length))];
   putView({schema:1,origin,scope,submitted,omitted:(previous?.omitted??[]).filter(id=>id!==draftId),value:value?{...value,drafts:value.drafts.map(draft=>draft.id===draftId?{...draft,text:'',submitted:true}:draft)}:null});
  },
  clearView:()=>{try{storage.removeItem(PRIVATE_VIEW_KEY);if(storage.getItem(PRIVATE_VIEW_KEY)!==null)throw new Error('equality');}catch{throw new Error('view_storage_unavailable');}},
  parseReceipt:(value:unknown):Receipt=>{const parsed=receiptSchema.parse(value),{error,...required}=parsed;return {...required,...(error===undefined?{}:{error})};}
 };
};
