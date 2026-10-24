import type { Store, AnalysisGrant } from "../storage/public.ts";
import { acquirePreparedContext } from "../source-preparation/public.ts";
import type { AcquisitionEffects } from "../source-acquisition/public.ts";
import { createOwnedAcquisitionEffects, groupExists } from "../import-jobs/public.ts";
import { createRegistry } from "../integration/registry.ts";
import { runAnalysisWorker } from "./public.ts";
import type { AnalysisWorker } from "./contract.ts";
type ContextEffects = AcquisitionEffects & {
    terminationConfirmed: () => boolean;
};
export type AnalysisRunnerOptions = {
    contextEffects?: (grant: AnalysisGrant, signal: AbortSignal) => ContextEffects;
    worker?: AnalysisWorker;
};
export const createAnalysisRunner = (store: Store, options: AnalysisRunnerOptions = {}) => {
    const analysis = store.analysis, owner = analysis.beginOwner(), registry = createRegistry();
    let active = false, stopped = false, current: Promise<void> | null = null, abort: AbortController | null = null;
    let fenced=false,failure:string|null=null;
    let lastJobs:ReturnType<typeof analysis.diagnostics>=[];
    const noteFailure=(error:unknown)=>{const raw=error instanceof Error?error.message:"analysis_failed";failure=/^[a-z][a-z0-9_]{0,63}$/.test(raw)?raw:"analysis_failed";if(raw==="stale_execution_owner"||raw==="stale_analysis_runner")fenced=true;};
    const diagnosticSnapshot=()=>{
        if(!fenced)try{lastJobs=analysis.diagnostics(owner);}catch(error){noteFailure(error);}
        return {cursorMeaning:"route_publications" as const,disposition:fenced?"fenced" as const:"active" as const,failure,jobs:structuredClone(lastJobs)};
    };
    const pending: (() => void)[] = [];
    const admission = registry.register("verified-semantic-result-to-admission", "analysis-owner", () => !stopped, () => { while (pending.length)
        pending.shift()!(); });
    const tick = async () => {
        if (active || stopped || fenced)
            return;
        active = true;
        try {
            for (const job of analysis.unknown(owner)) {
                const processes = job.invocations.at(-1)?.processes ?? [];
                if (processes.every(process => process.state === "exited" && (process.pid === undefined || !groupExists(process.pid)) || process.state === "started" && process.pid !== undefined && !groupExists(process.pid)))
                    analysis.confirmQuiescent(owner, job.jobId);
            }
            while (!stopped && !fenced) {
                const claim = analysis.claim(owner);
                if (!claim)
                    break;
                const { job, grant } = claim, invocation = job.invocations.at(-1)!;
                abort = new AbortController();
                let effects: ContextEffects | null = null;
                try {
                    if (invocation.phase === "context") {
                        effects = options.contextEffects?.(grant, abort.signal) ?? createOwnedAcquisitionEffects({ observations: { launchLimit: () => analysis.launchLimit(grant), cancelled: () => analysis.cancelled(grant), recordProcess: observation => { if (observation.executable !== "git")
                                    throw new Error("analysis_phase_conflict"); analysis.recordProcess(grant, { ...observation, executable: "git" }); } }, signal: abort.signal });
                        const result = await acquirePreparedContext(analysis.contextInput(grant), effects);
                        if (!effects.terminationConfirmed())
                            throw new Error("termination_unknown");
                        if (stopped)
                            throw new Error("analysis_cancelled");
                        if (result.kind !== "prepared") {
                            analysis.fail(grant, result.issues[0]?.reason ?? "context_unavailable", true, result);
                            continue;
                        }
                        pending.push(() => analysis.finishContext(grant, { corpus: result.corpus, issues: result.issues }, result.witness));
                        admission.emit();
                    }
                    else {
                        const result = await (options.worker ?? runAnalysisWorker)(analysis.workerRequest(grant), { recordProcess: observation => analysis.recordProcess(grant, observation), cancelled: () => analysis.cancelled(grant) }, { signal: abort.signal });
                        if (stopped)
                            throw new Error("analysis_cancelled");
                        pending.push(() => analysis.finishWorker(grant, result.envelope, result.witness));
                        admission.emit();
                    }
                }
                catch (error) {
                    const raw = error instanceof Error ? error.message : "analysis_failed", reason = raw === "import_phase_limit" ? "phase_limit" : raw;
                    const confirmed = reason !== "termination_unknown" && (effects?.terminationConfirmed() ?? true);
                    try {
                        analysis.fail(grant, reason, confirmed, reason === "phase_limit" ? { kind: "unavailable", corpus: null, issues: [] } : undefined);
                    }
                    catch {
                        try {
                            analysis.fail(grant, "unresolved_process_observation", false);
                        }
                        catch { /* A committed terminal admission remains authoritative. */ }
                    }
                }
            }
        }
        finally {
            active = false;
        }
    };
    const requests = registry.register("analysis-request-committed-to-owner", "analysis-owner", () => !stopped, () => { if (active || stopped)
        return; current = tick(); void current.catch(noteFailure); });
    const timer = setInterval(() => requests.emit(), 200);
    requests.emit();
    return { wake: () => requests.emit(), idle: async () => { await current; }, diagnostics: () => {const routes=registry.diagnostics();if(!routes.length)return [];const snapshot=diagnosticSnapshot();return routes.map(route=>({...route,...snapshot}));}, stop: async () => { stopped = true; abort?.abort(); clearInterval(timer); pending.length = 0; registry.dispose(); await current?.catch(noteFailure); } };
};
