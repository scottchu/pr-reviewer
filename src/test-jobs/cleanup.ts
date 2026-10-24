import {lstat,readdir,unlink,rmdir,realpath} from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';
import type {Store,HeadTestOwner,HeadTestJournal} from '../storage/public.ts';
import {observeHeadTestProcessQuiescence} from './evidence.ts';
export type HeadCleanupLocation=Readonly<{rootId:string;path:string;parent:string;device:number;inode:number;parentDevice:number;parentInode:number}>;
export type HeadCleanupInput=Readonly<{jobId:string;invocationId:string;resultId:string;attempts:number;location:HeadCleanupLocation;journal:HeadTestJournal}>;
declare const cleanupBrand:unique symbol;
export type HeadCleanupWitness=Readonly<{[cleanupBrand]:true}>;
const witnesses=new WeakMap<object,Readonly<{input:HeadCleanupInput;state:'complete'|'error';reason:string|null}>>();
export const readHeadCleanup=(witness:HeadCleanupWitness)=>{const value=witnesses.get(witness);return value?structuredClone(value):null;};
const absent=(error:unknown)=>(error as NodeJS.ErrnoException).code==='ENOENT';
/** Only admitted registered roots reach this adapter. No recursive delete follows links. */
const removeOwnedRoot=async(input:HeadCleanupInput,check:()=>void)=>{
 const {location}=input,deadline=Date.now()+10000;let count=0;const files:string[]=[],directories:string[]=[];
 const bounded=()=>{check();if(Date.now()>=deadline)throw new Error('cleanup_deadline');};
 bounded();if(dirname(location.path)!==location.parent||basename(location.path)!==location.rootId||!(/^[a-f0-9-]{36}$/).test(location.rootId)||await realpath(location.parent)!==location.parent)throw new Error('cleanup_identity_changed');
 const parent=await lstat(location.parent);if(!parent.isDirectory()||parent.isSymbolicLink()||parent.dev!==location.parentDevice||parent.ino!==location.parentInode)throw new Error('cleanup_identity_changed');
 try{const root=await lstat(location.path);if(!root.isDirectory()||root.isSymbolicLink()||root.dev!==location.device||root.ino!==location.inode)throw new Error('cleanup_identity_changed');}catch(error){if(absent(error))return;throw error;}
 if(!observeHeadTestProcessQuiescence(input.journal))throw new Error('cleanup_process_unresolved');
 const visit=async(path:string,depth:number):Promise<void>=>{
  bounded();if(++count>50000||depth>132)throw new Error('cleanup_limit');const stat=await lstat(path);
  if(stat.isSymbolicLink()||!stat.isDirectory()&&!stat.isFile())throw new Error('cleanup_identity_changed');
  if(stat.isDirectory()){const children=await readdir(path);if(children.length>50000)throw new Error('cleanup_limit');for(const child of children)await visit(join(path,child),depth+1);directories.push(path);}else files.push(path);
 };
 await visit(location.path,0);
 for(const path of files){bounded();const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink())throw new Error('cleanup_identity_changed');await unlink(path);}
 for(const path of directories){bounded();const stat=await lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('cleanup_identity_changed');await rmdir(path);}
};
export const cleanupHeadTestRoots=async(store:Store,owner:HeadTestOwner)=>{
 for(const input of store.tests.cleanupPending(owner)){
  const check=()=>store.tests.checkCleanup(owner,input);let state:'complete'|'error'='complete',reason:string|null=null;
  try{await removeOwnedRoot(input,check);}catch(error){state='error';reason=error instanceof Error&&/^[a-z][a-z0-9_]{0,63}$/.test(error.message)?error.message:'cleanup_failed';}
  const witness=Object.freeze({}) as HeadCleanupWitness;witnesses.set(witness,{input,state,reason});store.tests.recordCleanup(owner,witness);
 }
};
