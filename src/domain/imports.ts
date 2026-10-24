import {z} from 'zod';
import type {ProviderCandidate,Snapshot} from './public.ts';
export const importTargetSchema=z.object({reviewId:z.string().min(1),expectedCurrentSnapshotId:z.string().min(1)}).strict();
export const importCommandSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('RequestImport'),commandId:z.string().min(1).max(128),path:z.string().min(1).max(4096),target:importTargetSchema.optional()}).strict(),
 z.object({type:z.literal('ChooseImportCandidate'),commandId:z.string().min(1).max(128),jobId:z.uuid(),discoveryRevision:z.number().int().positive(),candidateIndex:z.number().int().nonnegative(),target:importTargetSchema.optional()}).strict(),
 ...(['CancelImport','ReverifyImportResult'] as const).map(type=>z.object({type:z.literal(type),commandId:z.string().min(1).max(128),jobId:z.uuid()}).strict()),
 z.object({type:z.literal('AdmitImportResult'),commandId:z.string().min(1).max(128),jobId:z.uuid(),target:importTargetSchema.optional()}).strict(),
]);
export type ImportCommand=z.infer<typeof importCommandSchema>;
export type ImportTarget=z.infer<typeof importTargetSchema>;
export type ImportState='queued'|'discovering'|'choosing'|'acquisition_queued'|'acquiring'|'result_ready'|'admitted'|'admission_conflict'|'needs_reverification'|'reverify_queued'|'reverifying'|'cancel_requested'|'cancelled'|'unknown'|'unavailable'|'failed';
export type ArtifactReference={artifactId:string;jobId:string;invocationId:string;digest:string;bytes:number;schema:'import-result-v1'};
export type ProcessObservation={ordinal:number;executable:'git'|'gh'|'glab';state:'requested'|'started'|'exited';pid?:number;startIdentity?:string;exitCode?:number|null;signal?:string|null;reason?:string;requestedAt?:string;startedAt?:string;endedAt?:string};
export type ImportInvocation={invocationId:string;phase:'discovery'|'acquisition'|'reverification';generation:string;state:'running'|'completed'|'unknown'|'cancelled';startedAt:string;artifact?:ArtifactReference;processes:ProcessObservation[]};
export type ImportJob={jobId:string;actorId:string;credentialReference:string;path:string;canonicalWorktree:string|null;state:ImportState;jobRevision:number;createdAt:string;updatedAt:string;reviewId:string;target:ImportTarget|null;candidate:ProviderCandidate|null;candidates:ProviderCandidate[];discoveryRevision:number;discovery:unknown;existingReviews:{reviewId:string;currentSnapshotId:string;candidateIndex?:number}[];invocations:ImportInvocation[];artifact:ArtifactReference|null;admissionCommandId:string;admission:ImportReceipt|null;reason:string|null};
export type ImportReceipt={commandId:string;actorId:string;state:'applied'|'rejected';jobId:string|null;jobRevision:number;result:Record<string,unknown>;error?:string};
export const importWaitingStates:readonly ImportState[]=['queued','choosing','acquisition_queued','result_ready','needs_reverification','reverify_queued','admission_conflict'];
export const canCancelImport=(state:ImportState)=>!['admitted','cancelled','failed','unavailable'].includes(state);
export const importStableIdentity=(candidate:ProviderCandidate)=>JSON.stringify([candidate.provider,candidate.host,candidate.targetProject,candidate.number]);
/** Initial review creation is a domain operation; source trust is established at the owning boundary. */
export const createImportedReview=(reviewId:string,snapshot:Snapshot)=>({reviewId,snapshot,snapshots:[snapshot],currentSnapshotId:snapshot.snapshotId,revision:1,attachment:null,questions:[],replies:[],inbox:[],attempts:[]});
