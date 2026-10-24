import type {AnalysisInput,AnalysisResult,DeclarationInventoryInput,DeclarationInventoryResult} from "../source-analysis/public.ts";
import type {AnalysisProcess} from "../domain/public.ts";
export type WorkerRequest = Readonly<{protocol:"analysis-worker-v1";invocationId:string} & (
 | {phase:"inventory";input:DeclarationInventoryInput}
 | {phase:"compute";input:AnalysisInput}
)>;
export type WorkerEnvelope = Readonly<{protocol:"analysis-worker-v1";invocationId:string;inputFingerprint:string} & (
 | {phase:"inventory";result:DeclarationInventoryResult}
 | {phase:"compute";result:AnalysisResult}
)>;
declare const workerBrand:unique symbol;
export type AnalysisWorkerWitness={readonly [workerBrand]:true};
export type VerifiedWorkerOutcome={envelope:WorkerEnvelope;witness:AnalysisWorkerWitness};
export type WorkerObservations={recordProcess:(observation:AnalysisProcess)=>void;cancelled:()=>boolean};
/** Owner construction only; all limits may lower their documented production ceiling. */
export type WorkerOptions={signal?:AbortSignal;timeoutMs?:number;inputBytes?:number;outputBytes?:number;stderrBytes?:number;executable?:string;entryPath?:string};
export type AnalysisWorker=(request:WorkerRequest,observations:WorkerObservations,options?:WorkerOptions)=>Promise<VerifiedWorkerOutcome>;
export type WorkerWitnessCheck=(witness:unknown,request:WorkerRequest,envelope:WorkerEnvelope)=>witness is AnalysisWorkerWitness;
