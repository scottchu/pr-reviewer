import type {HeadCleanupLocation} from '../test-jobs/public.ts';
import type {HeadTestJob, HeadTestInvocation, ProcessQuiescenceRecord,HeadTestProcessExecution} from '../domain/public.ts';
declare const ownerBrand: unique symbol;
declare const grantBrand: unique symbol;
export type HeadTestOwner = Readonly<{[ownerBrand]: true}>;
export type HeadTestGrant = Readonly<{[grantBrand]: true}>;
export type HeadTestProcess = ProcessQuiescenceRecord & Readonly<{
 ordinal: number; role: 'git_prepare' | 'runtime_version' | 'test_root'; intentDigest: string;
 execution?:HeadTestProcessExecution; inputCount: number; inputBytes: number; exitCode?: number | null; signal?: string | null;
}>;
export type HeadTestPrivateInvocation = HeadTestInvocation & Readonly<{
 processJournalVersion?: 1; processes?: readonly (HeadTestProcess & Readonly<{observationDigest?: string}>)[]; filesystemRoots?: readonly string[];
}>;
export type HeadTestStoredJob = Omit<HeadTestJob,'invocations'> & Readonly<{
 cleanupLocation?:HeadCleanupLocation; cleanupAfter?:number; credentialReference: string; reservedBytes: number; retainedBytes: number;
 invocations: readonly HeadTestPrivateInvocation[]; stopReason?: string; artifactLocations?: readonly Readonly<{artifactId:string;path:string}>[];
}>;
export type HeadTestJournal = Readonly<{
 jobId: string; jobRevision: number; invocation: HeadTestPrivateInvocation;
}>;
