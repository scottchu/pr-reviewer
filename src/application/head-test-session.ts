import {headTestCommandSchema,headTestScopeSchema} from '../domain/public.ts';
import type {HeadTestCommand,HeadTestReceipt,HeadTestScope} from '../domain/public.ts';
export type TestRecovery=Readonly<{scope:HeadTestScope;command:HeadTestCommand;receipt:HeadTestReceipt|null}>;
export type TestIntentStorage={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void};
export const createTestIntentSession=(reviewId:string,options:{storage?:TestIntentStorage;origin?:string}={})=>{
 const origin=options.origin??(typeof location==='undefined'?'local':location.origin),key=`pr-reviewer:test-intent:v1:${encodeURIComponent(origin)}:${encodeURIComponent(reviewId)}`;
 const storage=()=>options.storage??globalThis.sessionStorage;
 const read=():TestRecovery|null=>{
  let raw:string|null;try{raw=storage().getItem(key);}catch{throw new Error('test_storage_unavailable');}if(raw===null)return null;
  try{
   const value=JSON.parse(raw) as {version?:unknown;origin?:unknown;reviewId?:unknown;command?:unknown;scope?:unknown;receipt?:HeadTestReceipt|null};
   if(value.version!==1||value.origin!==origin||value.reviewId!==reviewId)throw new Error();
   const command=headTestCommandSchema.parse(value.command),scope=headTestScopeSchema.parse(value.scope);
   if(scope.reviewId!==reviewId)throw new Error();
   if(command.type==='RequestTest'&&(command.reviewId!==scope.reviewId||command.snapshotId!==scope.snapshotId))throw new Error();
   const receipt=value.receipt;
   if(receipt!==null&&(!receipt||receipt.commandId!==command.commandId||receipt.reviewId!==reviewId||receipt.state!=='applied'||!Number.isSafeInteger(receipt.jobRevision)||receipt.jobRevision<0||typeof receipt.jobId!=='string'||typeof receipt.snapshotId!=='string'||typeof receipt.actorId!=='string'||!['queued','cancelled','cancel_requested','already_terminal'].includes(receipt.result?.disposition)))throw new Error();
   if(receipt&&command.type==='RequestTest'&&receipt.snapshotId!==command.snapshotId)throw new Error();
   if(receipt&&command.type==='CancelTest'&&receipt.jobId!==command.jobId)throw new Error();
   return {scope,command,receipt};
  }catch{throw new Error('test_recovery_invalid');}
 };
 return {read,save:(value:TestRecovery)=>{try{storage().setItem(key,JSON.stringify({version:1,origin,reviewId,...value}));}catch{throw new Error('test_storage_unavailable');}},clear:()=>{try{storage().removeItem(key);}catch{throw new Error('test_storage_unavailable');}}};
};
export type TestIntentSession=ReturnType<typeof createTestIntentSession>;
