import {createHash} from 'node:crypto';
import type {Principal} from '../domain/public.ts';

// A trusted in-process owner capability, never a serialized browser credential.
export const localOwnerAccess=Object.freeze({principal:Object.freeze({kind:'user' as const,actorId:'local-user'})});
export type StorageAccess=string|typeof localOwnerAccess;
const ownerReference='local-owner:v1';
export const accessReference=(access:StorageAccess)=>{
 if(typeof access==='string')return createHash('sha256').update(access).digest('hex');
 if(access!==localOwnerAccess)throw new Error('unauthorized');
 return ownerReference;
};
export const localPrincipal=(reference:string):Principal|null=>reference===ownerReference?localOwnerAccess.principal:null;
export const isLocalOwner=(access:StorageAccess)=>access===localOwnerAccess;
