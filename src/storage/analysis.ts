import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { analysisCommandSchema, analysisQuerySchema, semanticSourceQuerySchema, semanticCanonical, snapshotFor, analysisDiagnosticCode } from "../domain/public.ts";
import {validateSemanticAnchor,analysisMarkerQuerySchema,analysisEvidenceQuerySchema} from "../domain/public.ts";
import type { AnalysisEvidence,AnalysisEvidenceQuery,AnalysisMarker,AnalysisMarkerQuery,AnalysisCommand, AnalysisReceipt, AnalysisView, AnalysisQuery, AnalysisJobView, AnalysisInvocation, AnalysisProcess, GraphClarification, SemanticAnchor, SemanticSourceQuery, SemanticSource, Principal, Review, CorpusAccount } from "../domain/public.ts";
import { contextIdentity, contextAnalysisInput, isPreparedContextWitness } from "../source-preparation/public.ts";
import type { PreparedContextWitness } from "../source-preparation/public.ts";
import type { ContextCorpus, ContextIssue, ContextResult } from "../source-acquisition/public.ts";
import type { AnalysisResult, DeclarationInventoryResult } from "../source-analysis/public.ts";
import { isAnalysisWorkerWitness } from "../analysis-jobs/public.ts";
import type { WorkerRequest, WorkerEnvelope, AnalysisWorkerWitness } from "../analysis-jobs/public.ts";
import type { ExecutionLease } from "./execution.ts";
declare const ownerBrand: unique symbol;
declare const grantBrand: unique symbol;
export type AnalysisOwner = {
    readonly [ownerBrand]: true;
};
export type AnalysisGrant = {
    readonly [grantBrand]: true;
};
export type AnalysisLimits = {
    maxContextLaunches?: number;
    maxRetainedBytes?: number;
};
type Job = AnalysisJobView & {
    credentialReference: string;
    actorId: string;
    worktree: string;
    sourceProject?: string;
    priorityPaths: Partial<Record<"base" | "head", readonly string[]>>;
    failureAccount: CorpusAccount | null;
};
type Graph = {
    generation: number;
    graphRevision: number;
    selectedAnalysisId: string | null;
};
type CorpusRecord = {
    corpus: ContextCorpus;
    issues: readonly ContextIssue[];
};
type Ports = {
    db: DatabaseSync;
    tx: <T>(operation: () => T) => T;
    load: (id: string) => Review;
    authorize: (principal: Principal, review: Review) => void;
    execution: ExecutionLease;
    limits?: AnalysisLimits;
};
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const terminalStates = new Set(["admitted", "unavailable", "failed", "cancelled", "superseded"]);
export const createAnalysisStore = ({ db, tx, load, authorize, execution, limits = {} }: Ports) => {
    const launchLimit = limits.maxContextLaunches ?? 2048, quota = limits.maxRetainedBytes ?? 64 * 1024 * 1024;
    if (!Number.isSafeInteger(launchLimit) || launchLimit < 1 || launchLimit > 2048 || !Number.isSafeInteger(quota) || quota < 1 || quota > 64 * 1024 * 1024)
        throw new Error("invalid_analysis_limit");
    db.exec("CREATE TABLE IF NOT EXISTS analysis_jobs(id TEXT PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS analysis_graphs(review_id TEXT NOT NULL,snapshot_id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(review_id,snapshot_id)); CREATE TABLE IF NOT EXISTS analysis_records(review_id TEXT NOT NULL,snapshot_id TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,bytes INTEGER NOT NULL,PRIMARY KEY(review_id,kind,id)); CREATE TABLE IF NOT EXISTS analysis_receipts(id TEXT PRIMARY KEY,actor TEXT NOT NULL,fingerprint TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS analysis_owner(id INTEGER PRIMARY KEY CHECK(id=1),generation TEXT NOT NULL); CREATE TABLE IF NOT EXISTS graph_clarifications(id TEXT PRIMARY KEY,review_id TEXT NOT NULL,snapshot_id TEXT NOT NULL,body TEXT NOT NULL);");
    const owners = new WeakMap<object, string>(), grants = new WeakMap<object, {
        ownerRunId: string;
        jobId: string;
        invocationId: string;
    }>();
    const all = () => (db.prepare("SELECT body FROM analysis_jobs ORDER BY rowid").all() as {
        body: string;
    }[]).map(row => JSON.parse(row.body) as Job);
    const get = (id: string) => { const row = db.prepare("SELECT body FROM analysis_jobs WHERE id=?").get(id) as {
        body: string;
    } | undefined; if (!row)
        throw new Error("analysis_job_unavailable"); return JSON.parse(row.body) as Job; };
    const put = (job: Job) => db.prepare("INSERT INTO analysis_jobs VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body").run(job.jobId, JSON.stringify(job));
    const update = (job: Job) => { job.jobRevision++; put(job); };
    const graph = (reviewId: string, snapshotId: string): Graph => { const row = db.prepare("SELECT body FROM analysis_graphs WHERE review_id=? AND snapshot_id=?").get(reviewId, snapshotId) as {
        body: string;
    } | undefined; return row ? JSON.parse(row.body) as Graph : { generation: 0, graphRevision: 0, selectedAnalysisId: null }; };
    const saveGraph = (reviewId: string, snapshotId: string, value: Graph) => db.prepare("INSERT INTO analysis_graphs VALUES (?,?,?) ON CONFLICT(review_id,snapshot_id) DO UPDATE SET body=excluded.body").run(reviewId, snapshotId, JSON.stringify(value));
    const credential = (reference: string) => { const row = db.prepare("SELECT body FROM credentials WHERE hash=?").get(reference) as {
        body: string;
    } | undefined; if (!row)
        throw new Error("unauthorized"); return JSON.parse(row.body) as Principal; };
    const auth = (reference: string, reviewId: string) => { const principal = credential(reference), review = load(reviewId); authorize(principal, review); return { principal, review }; };
    const owner = (value: AnalysisOwner) => { execution.assertCurrent(); const generation = owners.get(value), row = db.prepare("SELECT generation FROM analysis_owner WHERE id=1").get() as {
        generation: string;
    } | undefined; if (!generation || generation !== row?.generation)
        throw new Error("stale_analysis_runner"); return generation; };
    const grant = (value: AnalysisGrant) => { execution.assertCurrent(); const record = grants.get(value), row = db.prepare("SELECT generation FROM analysis_owner WHERE id=1").get() as {
        generation: string;
    } | undefined; if (!record || record.ownerRunId !== row?.generation)
        throw new Error("stale_analysis_runner"); const job = get(record.jobId), invocation = job.invocations.at(-1); if (!invocation || invocation.invocationId !== record.invocationId || invocation.state !== "running")
        throw new Error("stale_analysis_runner"); return { job, invocation }; };
    const release = (job: Job, invocation: AnalysisInvocation) => execution.release({ kind: "analysis", jobId: job.jobId, invocationId: invocation.invocationId, phase: invocation.phase });
    const ended = (invocation: AnalysisInvocation) => { if (invocation.processes.some(process => process.state !== "exited"))
        throw new Error("analysis_process_unresolved"); };
    const active = (job: Job) => { auth(job.credentialReference, job.reviewId); if (job.state === "cancel_requested")
        throw new Error("analysis_cancelled"); if (job.state === "superseded" || graph(job.reviewId, job.snapshotId).generation !== job.generation)
        throw new Error("analysis_superseded"); };
    const record = <T>(reviewId: string, kind: string, id: string): T => { const row = db.prepare("SELECT body FROM analysis_records WHERE review_id=? AND kind=? AND id=?").get(reviewId, kind, id) as {
        body: string;
    } | undefined; if (!row)
        throw new Error("analysis_record_unavailable");
        try{return JSON.parse(row.body) as T;}catch(error){if(error instanceof SyntaxError)throw new Error('analysis_record_unavailable');throw error;}
    };
    const prepareRecord = (value: unknown) => {const body=semanticCanonical(value);return {body,bytes:Buffer.byteLength(body,"utf8")};};
    const retain = (job: Job, kind: string, id: string, prepared: ReturnType<typeof prepareRecord>) => {
        const {body,bytes}=prepared;const old = db.prepare("SELECT body,snapshot_id FROM analysis_records WHERE review_id=? AND kind=? AND id=?").get(job.reviewId, kind, id) as {
            body: string;
            snapshot_id: string;
        } | undefined;
        if (old) {
            if (old.body !== body || old.snapshot_id !== job.snapshotId)
                throw new Error("analysis_identity_conflict");
            return;
        }
        const used = (db.prepare("SELECT coalesce(sum(bytes),0) AS bytes FROM analysis_records WHERE review_id=?").get(job.reviewId) as {
            bytes: number;
        }).bytes;
        if (used + bytes > quota)
            throw new Error("retained_semantic_limit");
        db.prepare("INSERT INTO analysis_records VALUES (?,?,?,?,?,?)").run(job.reviewId, job.snapshotId, kind, id, body, bytes);
    };
    const account = ({ corpus, issues }: CorpusRecord): CorpusAccount => ({ ...corpus, sources: corpus.sources.map(({ content, ...source }) => source), issues });
    const publicJob = (job: Job): AnalysisJobView => { const { credentialReference, actorId, worktree, sourceProject, priorityPaths, failureAccount, ...value } = job; return value; };
    const corpus = (job: Job) => { if (!job.corpusId)
        throw new Error("analysis_record_unavailable"); return record<CorpusRecord>(job.reviewId, "corpus", job.corpusId); };
    const matchesContextIntent = (job: Job, corpus: ContextCorpus) => corpus.budgets.filesPerSide === (job.contextFilesPerSide ?? 128) && (["base", "head"] as const).every(side => {
        const required = [...new Set(job.priorityPaths[side] ?? [])].sort();
        return required.length === corpus.priorityPaths[side].length && required.every((path, index) => path === corpus.priorityPaths[side][index]);
    });
    const workerRequest = (value: AnalysisGrant): WorkerRequest => {
        const { job, invocation } = grant(value);
        if (invocation.phase === "context")
            throw new Error("analysis_phase_conflict");
        const input = contextAnalysisInput(corpus(job).corpus), base = { protocol: "analysis-worker-v1" as const, invocationId: invocation.invocationId };
        if (invocation.phase === "inventory")
            return { ...base, phase: "inventory", input };
        if (!job.inventoryId)
            throw new Error("analysis_record_unavailable");
        const inventory = record<DeclarationInventoryResult>(job.reviewId, "inventory", job.inventoryId);
        if (inventory.status !== "available")
            throw new Error("analysis_record_unavailable");
        return { ...base, phase: "compute", input: { ...input, seeds: job.declarationIds.map(id => { const declaration = inventory.declarations.find(item => item.id === id); if (!declaration)
                    throw new Error("analysis_declaration_conflict"); const { side, path, contentHash, start, end } = declaration.declaration; return { side, path, contentHash, start, end }; }) } };
    };
    const anchorValidator = (corpus: ContextCorpus) => {
        const sources = new Map(corpus.sources.map(source => [`${source.side}:${source.path}`, source]));
        return (anchor: SemanticAnchor) => {const source=sources.get(`${anchor.side}:${anchor.path}`);return !!source&&validateSemanticAnchor({...source,snapshotId:corpus.snapshotId},anchor);};
    };
    const clarificationRows = (reviewId: string, snapshotId: string) => (db.prepare("SELECT body FROM graph_clarifications WHERE review_id=? AND snapshot_id=? ORDER BY rowid").all(reviewId, snapshotId) as {
        body: string;
    }[]).map(row => JSON.parse(row.body) as GraphClarification);
    const command = (token: string, input: AnalysisCommand): AnalysisReceipt => {
        const reference = hash(token), parsed = analysisCommandSchema.parse(input), fingerprint = hash(semanticCanonical(parsed));
        return tx(() => {
            let job: Job | undefined, reviewId = "reviewId" in parsed ? parsed.reviewId : "", snapshotId = "snapshotId" in parsed ? parsed.snapshotId : "";
            if ("jobId" in parsed) {
                job = get(parsed.jobId);
                reviewId = job.reviewId;
                snapshotId = job.snapshotId;
            }
            const { principal, review } = auth(reference, reviewId);
            if (parsed.type !== "PutGraphClarification" && principal.kind !== "user")
                throw new Error("unauthorized");
            const current = graph(reviewId, snapshotId), base = { commandId: parsed.commandId, actorId: principal.actorId, reviewId, snapshotId, analysisGeneration: current.generation, graphRevision: current.graphRevision };
            if(db.prepare('SELECT id FROM test_receipts WHERE id=?').get(parsed.commandId)||db.prepare('SELECT id FROM story_receipts WHERE id=?').get(parsed.commandId))return {...base,state:'rejected',result:{},error:'command_conflict'};
            const old = db.prepare("SELECT actor,fingerprint,body FROM analysis_receipts WHERE id=?").get(parsed.commandId) as {
                actor: string;
                fingerprint: string;
                body: string;
            } | undefined;
            if (old)
                return old.actor === principal.actorId && old.fingerprint === fingerprint ? JSON.parse(old.body) as AnalysisReceipt : { ...base, state: "rejected", result: {}, error: "command_conflict" };
            if(parsed.commandId.startsWith('test-result:'))return {...base,state:'rejected',result:{},error:'command_conflict'};
            let receipt: AnalysisReceipt;
            try {
                const snapshot = snapshotFor(review, snapshotId);
                if (!snapshot)
                    throw new Error("source_unavailable");
                let result: Record<string, unknown> = {};
                if (parsed.type === "RequestAnalysis") {
                    if (current.generation !== parsed.expectedAnalysisGeneration)
                        throw new Error("analysis_generation_conflict");
                    const pending = all().filter(item => !terminalStates.has(item.state));
                    if (pending.filter(item => item.state === "unknown" || item.reviewId !== reviewId || item.snapshotId !== snapshotId).length >= 8)
                        throw new Error("analysis_queue_full");
                    const identity = contextIdentity(snapshot, parsed.sourceProject);
                    let worktree = parsed.worktree;
                    if (!worktree && snapshot.candidate) {
                        const imports = (db.prepare("SELECT body FROM import_jobs ORDER BY rowid DESC").all() as {body:string}[]).map(row => JSON.parse(row.body) as import("../domain/public.ts").ImportJob);
                        worktree = imports.find(item => item.state === "admitted" && item.admission?.state === "applied" && item.admission.result.reviewId === reviewId && item.admission.result.snapshotId === snapshot.snapshotId && item.reviewId === reviewId && semanticCanonical(item.candidate) === semanticCanonical(snapshot.candidate))?.canonicalWorktree ?? undefined;
                    }
                    if (!worktree)
                        throw new Error("source_locator_required");
                    for (const older of pending.filter(item => item.reviewId === reviewId && item.snapshotId === snapshotId)) {
                        if (older.state === "unknown") continue;
                        older.state = "superseded";
                        older.reason = "new_analysis_generation";
                        update(older);
                    }
                    current.generation++;
                    job = { ...(parsed.contextFilesPerSide !== undefined ? { contextFilesPerSide: parsed.contextFilesPerSide } : {}), jobId: randomUUID(), reviewId, snapshotId, generation: current.generation, jobRevision: 1, state: "context_queued", reason: null, corpusId: null, inventoryId: null, analysisId: null, declarationIds: [], invocations: [], contextIssues: [], admission: null, credentialReference: reference, actorId: principal.actorId, worktree, sourceProject: identity.sourceProject, priorityPaths: { ...(parsed.priorityPaths?.base ? { base: parsed.priorityPaths.base } : {}), ...(parsed.priorityPaths?.head ? { head: parsed.priorityPaths.head } : {}) }, failureAccount: null };
                    put(job);
                    saveGraph(reviewId, snapshotId, current);
                    result = { jobId: job.jobId };
                }
                else if (parsed.type === "PutGraphClarification") {
                    if (current.graphRevision !== parsed.expectedGraphRevision || current.selectedAnalysisId !== parsed.analysisId)
                        throw new Error("graph_conflict");
                    const analysisJob = all().find(item => item.reviewId === reviewId && item.snapshotId === snapshotId && item.analysisId === parsed.analysisId && item.state === "admitted");
                    if (!analysisJob)
                        throw new Error("analysis_record_unavailable");
                    const source = corpus(analysisJob).corpus;
                    if (![parsed.primary, ...parsed.evidence].every(anchorValidator(source)))
                        throw new Error("invalid_analysis_anchor");
                    const rows = clarificationRows(reviewId, snapshotId), oldClarification = parsed.clarificationId ? rows.find(item => item.clarificationId === parsed.clarificationId) : undefined;
                    if (parsed.clarificationId && !oldClarification)
                        throw new Error("clarification_unavailable");
                    if (oldClarification && (oldClarification.analysisId !== parsed.analysisId || semanticCanonical(oldClarification.primary) !== semanticCanonical(parsed.primary) || oldClarification.supersedes !== parsed.supersedes))
                        throw new Error("clarification_anchor_immutable");
                    if (oldClarification && principal.kind === "agent" && oldClarification.authorId !== principal.actorId)
                        throw new Error("unauthorized");
                    if (parsed.supersedes && !rows.some(item => item.clarificationId === parsed.supersedes))
                        throw new Error("clarification_unavailable");
                    const clarification: GraphClarification = oldClarification ?? { clarificationId: randomUUID(), analysisId: parsed.analysisId, primary: parsed.primary, authorId: principal.actorId, history: [], ...(parsed.supersedes ? { supersedes: parsed.supersedes } : {}) };
                    clarification.history.push({ revision: clarification.history.length + 1, actorId: principal.actorId, actorKind: principal.kind as "user" | "agent", kind: parsed.kind, text: parsed.text, evidence: parsed.evidence, createdAt: new Date().toISOString() });
                    db.prepare("INSERT INTO graph_clarifications VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body").run(clarification.clarificationId, reviewId, snapshotId, JSON.stringify(clarification));
                    current.graphRevision++;
                    saveGraph(reviewId, snapshotId, current);
                    result = { clarificationId: clarification.clarificationId };
                }
                else {
                    if (!job || job.credentialReference !== reference || job.actorId !== principal.actorId)
                        throw new Error("unauthorized");
                    if (job.jobRevision !== parsed.expectedJobRevision)
                        throw new Error("analysis_job_conflict");
                    if (parsed.type === "CancelAnalysis") {
                        if (terminalStates.has(job.state))
                            throw new Error("analysis_terminal");
                        job.state = job.invocations.at(-1)?.state === "running" ? "cancel_requested" : job.state === "unknown" ? "unknown" : "cancelled";
                    }
                    else {
                        active(job);
                        if (job.state !== "awaiting_declarations" || job.corpusId !== parsed.corpusId || job.inventoryId !== parsed.inventoryId)
                            throw new Error("analysis_declaration_conflict");
                        const inventory = record<DeclarationInventoryResult>(reviewId, "inventory", parsed.inventoryId);
                        if (inventory.status !== "available")
                            throw new Error("analysis_declaration_conflict");
                        const selected = parsed.declarationIds.map(id => inventory.declarations.find(item => item.id === id));
                        if (selected.some(item => !item) || new Set(selected.map(item => item!.declaration.side)).size !== selected.length)
                            throw new Error("analysis_declaration_conflict");
                        job.declarationIds = [...parsed.declarationIds];
                        job.state = "compute_queued";
                    }
                    update(job);
                    result = { jobId: job.jobId };
                }
                receipt = { ...base, state: "applied", analysisGeneration: current.generation, graphRevision: current.graphRevision, ...(job ? { jobId: job.jobId, jobRevision: job.jobRevision } : {}), result };
            }
            catch (error) {
                receipt = { ...base, state: "rejected", ...(job ? { jobId: job.jobId, jobRevision: job.jobRevision } : {}), result: {}, error: error instanceof Error ? error.message : "invalid_request" };
            }
            db.prepare("INSERT INTO analysis_receipts VALUES (?,?,?,?)").run(parsed.commandId, principal.actorId, fingerprint, JSON.stringify(receipt));
            return receipt;
        });
    };
    return {
        command,
        marker: (token:string,input:AnalysisMarkerQuery):AnalysisMarker=>{
            const query=analysisMarkerQuerySchema.parse(input),{review}=auth(hash(token),query.reviewId);
            if(!snapshotFor(review,query.snapshotId))throw new Error('source_unavailable');
            const current=graph(query.reviewId,query.snapshotId);
            return {reviewId:query.reviewId,snapshotId:query.snapshotId,currentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId,analysisGeneration:current.generation,graphRevision:current.graphRevision,selectedAnalysisId:current.selectedAnalysisId};
        },
        evidence: (token:string,input:AnalysisEvidenceQuery):AnalysisEvidence=>{
            const query=analysisEvidenceQuerySchema.parse(input),{review}=auth(hash(token),query.reviewId);
            if(!snapshotFor(review,query.snapshotId))throw new Error('source_unavailable');
            const admitted=all().find(job=>job.reviewId===query.reviewId&&job.snapshotId===query.snapshotId&&job.analysisId===query.analysisId&&job.state==='admitted');
            if(!admitted?.corpusId)throw new Error('analysis_record_unavailable');
            return {reviewId:query.reviewId,snapshotId:query.snapshotId,analysisId:query.analysisId,corpus:account(corpus(admitted)),analysis:record<AnalysisResult>(query.reviewId,'analysis',query.analysisId),clarifications:clarificationRows(query.reviewId,query.snapshotId).filter(item=>item.analysisId===query.analysisId)};
        },
        query: (token: string, input: AnalysisQuery): AnalysisView => {
            const query = analysisQuerySchema.parse(input), { review } = auth(hash(token), query.reviewId);
            if (!snapshotFor(review, query.snapshotId))
                throw new Error("source_unavailable");
            const current = graph(query.reviewId, query.snapshotId), jobs = all().filter(job => job.reviewId === query.reviewId && job.snapshotId === query.snapshotId);
            if (current.graphRevision < (query.minimumGraphRevision ?? 0))
                throw new Error("revision_unavailable");
            const pending = jobs.findLast(job => job.generation === current.generation);
            const selected = query.analysisId ?? current.selectedAnalysisId, chosen = selected ? jobs.find(job => job.analysisId === selected && job.state === "admitted") : jobs.findLast(job => job.generation === current.generation);
            if (((query.analysisId ? chosen : pending)?.jobRevision ?? 0) < (query.minimumJobRevision ?? 0)) throw new Error("revision_unavailable");
            if (query.analysisId && !chosen)
                throw new Error("analysis_record_unavailable");
            return { reviewId: query.reviewId, snapshotId: query.snapshotId, currentSnapshotId: review.currentSnapshotId ?? review.snapshot.snapshotId, analysisGeneration: current.generation, graphRevision: current.graphRevision, selectedAnalysisId: current.selectedAnalysisId, jobs: jobs.map(publicJob), preparation: pending ? { jobId: pending.jobId, corpus: pending.corpusId ? account(corpus(pending)) : pending.failureAccount, inventory: pending.inventoryId ? record<DeclarationInventoryResult>(query.reviewId, "inventory", pending.inventoryId) : null, result: pending.analysisId ? record<AnalysisResult>(query.reviewId, "analysis", pending.analysisId) : null } : null, corpus: chosen?.corpusId ? account(corpus(chosen)) : chosen?.failureAccount ?? null, inventory: chosen?.inventoryId ? record<DeclarationInventoryResult>(query.reviewId, "inventory", chosen.inventoryId) : null, analysis: chosen?.analysisId ? record<AnalysisResult>(query.reviewId, "analysis", chosen.analysisId) : null, clarifications: clarificationRows(query.reviewId, query.snapshotId).filter(item => item.analysisId === selected) };
        },
        source: (token: string, input: SemanticSourceQuery): SemanticSource => {
            const query = semanticSourceQuerySchema.parse(input), { review } = auth(hash(token), query.reviewId);
            if (!snapshotFor(review, query.snapshotId))
                throw new Error("source_unavailable");
            const source = record<CorpusRecord>(query.reviewId, "corpus", query.corpusId).corpus;
            if (source.snapshotId !== query.snapshotId)
                throw new Error("source_unavailable");
            const found = source.sources.find(item => item.side === query.side && item.path === query.path && item.contentHash === query.contentHash);
            if (!found)
                throw new Error("source_unavailable");
            return { ...found, snapshotId: query.snapshotId, corpusId: query.corpusId };
        },
        beginOwner: (): AnalysisOwner => tx(() => { execution.assertCurrent(); const generation = randomUUID(); db.prepare("INSERT OR REPLACE INTO analysis_owner VALUES (1,?)").run(generation); for (const job of all()) {
            const invocation = job.invocations.at(-1);
            if (invocation && (invocation.state === "running" || job.state === "unknown")) {
                execution.retain({ kind: "analysis", jobId: job.jobId, invocationId: invocation.invocationId, phase: invocation.phase });
                invocation.state = "unknown";
                job.state = "unknown";
                job.reason = "interrupted_invocation";
                update(job);
            }
        } const value = Object.freeze({}) as AnalysisOwner; owners.set(value, generation); return value; }),
        claim: (value: AnalysisOwner): {
            job: AnalysisJobView;
            grant: AnalysisGrant;
        } | null => tx(() => {
            const ownerRunId = owner(value);
            for (const job of all()) {
                const phase = job.state === "context_queued" ? "context" : job.state === "inventory_queued" ? "inventory" : job.state === "compute_queued" ? "compute" : null;
                if (!phase)
                    continue;
                try {
                    active(job);
                }
                catch (error) {
                    job.state = "failed";
                    job.reason = error instanceof Error ? error.message : "unauthorized";
                    update(job);
                    continue;
                }
                const invocation: AnalysisInvocation = { invocationId: randomUUID(), ownerRunId, phase, state: "running", processes: [] };
                if (!execution.acquire({ kind: "analysis", jobId: job.jobId, invocationId: invocation.invocationId, phase }))
                    return null;
                job.invocations.push(invocation);
                job.state = phase === "context" ? "context_running" : phase === "inventory" ? "inventory_running" : "compute_running";
                update(job);
                const token = Object.freeze({}) as AnalysisGrant;
                grants.set(token, { ownerRunId, jobId: job.jobId, invocationId: invocation.invocationId });
                return { job: publicJob(job), grant: token };
            }
            return null;
        }),
        contextInput: (value: AnalysisGrant) => { const { job, invocation } = grant(value); if (invocation.phase !== "context")
            throw new Error("analysis_phase_conflict"); return { jobId: job.jobId, review: load(job.reviewId), snapshotId: job.snapshotId, worktree: job.worktree, ...(job.sourceProject ? { sourceProject: job.sourceProject } : {}), ...(job.contextFilesPerSide !== undefined ? { contextFilesPerSide: job.contextFilesPerSide } : {}), priorityPaths: job.priorityPaths }; },
        launchLimit: (value: AnalysisGrant) => { if (grant(value).invocation.phase !== "context")
            throw new Error("analysis_phase_conflict"); return launchLimit; },
        workerRequest,
        cancelled: (value: AnalysisGrant) => { const { job } = grant(value); try {
            active(job);
            return false;
        }
        catch {
            return true;
        } },
        recordProcess: (value: AnalysisGrant, observation: AnalysisProcess) => tx(() => {
            const { job, invocation } = grant(value);
            if (observation.state === "requested")
                active(job);
            if (observation.executable !== (invocation.phase === "context" ? "git" : "node"))
                throw new Error("analysis_phase_conflict");
            const old = invocation.processes.find(process => process.ordinal === observation.ordinal);
            if (observation.state === "requested") {
                if (old || observation.ordinal !== invocation.processes.length + 1 || invocation.processes.length >= (invocation.phase === "context" ? launchLimit : 1) || invocation.processes.some(process => process.state !== "exited"))
                    throw new Error("analysis_process_limit");
                invocation.processes.push({ ...observation });
            }
            else {
                if (!old || old.executable !== observation.executable || observation.state === "started" && old.state !== "requested" || observation.state === "exited" && !["requested", "started"].includes(old.state))
                    throw new Error("invalid_analysis_observation");
                Object.assign(old, observation);
            }
            update(job);
        }),
        finishContext: (value: AnalysisGrant, body: CorpusRecord, witness: PreparedContextWitness) => {
            const observed = grant(value), snapshot = snapshotFor(load(observed.job.reviewId), observed.job.snapshotId);
            const verified = snapshot && isPreparedContextWitness(witness, observed.job.jobId, observed.job.reviewId, snapshot, body.corpus, body.issues), prepared=prepareRecord(body);
            return tx(() => { const { job, invocation } = grant(value); if (invocation.phase !== "context" || !verified || body.corpus.snapshotId !== job.snapshotId || !matchesContextIntent(job, body.corpus))
                throw new Error("source_identity_conflict"); ended(invocation); active(job); retain(job, "corpus", body.corpus.corpusId, prepared); release(job, invocation); invocation.state = "completed"; job.corpusId = body.corpus.corpusId; job.contextIssues = body.issues; job.state = "inventory_queued"; update(job); });
        },
        finishWorker: (value: AnalysisGrant, envelope: WorkerEnvelope, witness: AnalysisWorkerWitness) => {
            const request = workerRequest(value), verified = isAnalysisWorkerWitness(witness, request, envelope);
            if(!verified)throw new Error("analysis_identity_conflict");
            const prepared=prepareRecord(envelope.result),fingerprint=hash(semanticCanonical({request,envelope}));
            return tx(() => {
                const { job, invocation } = grant(value);
                if (!verified || invocation.phase !== envelope.phase)
                    throw new Error("analysis_identity_conflict");
                ended(invocation);
                active(job);
                const result = envelope.result, id = "inventoryId" in result ? result.inventoryId : result.analysisId;
                retain(job, envelope.phase === "inventory" ? "inventory" : "analysis", id, prepared);
                if (envelope.phase === "inventory") {
                    job.inventoryId = id;
                    job.state = result.status === "available" ? "awaiting_declarations" : "unavailable";
                }
                else {
                    job.analysisId = id;
                    if (result.status === "analyzed") {
                        const current = graph(job.reviewId, job.snapshotId);
                        current.graphRevision++;
                        current.selectedAnalysisId = id;
                        saveGraph(job.reviewId, job.snapshotId, current);
                        job.state = "admitted";
                    }
                    else
                        job.state = "unavailable";
                }
                release(job, invocation);
                invocation.state = "completed";
                update(job);
                if (envelope.phase === "compute") {
                    const current = graph(job.reviewId, job.snapshotId), receipt: AnalysisReceipt = { commandId: `analysis-admit:${job.jobId}`, actorId: job.actorId, state: "applied", reviewId: job.reviewId, snapshotId: job.snapshotId, analysisGeneration: job.generation, graphRevision: current.graphRevision, jobId: job.jobId, jobRevision: job.jobRevision, result: { analysisId: id, status: result.status } };
                    job.admission = receipt;
                    put(job);
                    db.prepare("INSERT INTO analysis_receipts VALUES (?,?,?,?)").run(receipt.commandId, job.actorId, fingerprint, JSON.stringify(receipt));
                }
            });
        },
        fail: (value: AnalysisGrant, reason: string, terminationConfirmed: boolean, contextResult?: ContextResult) => tx(() => { const { job, invocation } = grant(value); if (terminationConfirmed) {
            ended(invocation);
            release(job, invocation);
        } invocation.state = terminationConfirmed ? "completed" : "unknown"; job.state = !terminationConfirmed ? "unknown" : job.state === "cancel_requested" ? "cancelled" : job.state === "superseded" ? "superseded" : contextResult ? "unavailable" : "failed"; job.reason = reason; if (contextResult) {
            job.contextIssues = contextResult.issues;
            if (contextResult.corpus)
                job.failureAccount = account({ corpus: contextResult.corpus, issues: contextResult.issues });
        } update(job); }),
        diagnostics: (value: AnalysisOwner) => {
            owner(value);
            const latest=db.prepare("SELECT body FROM analysis_jobs ORDER BY rowid DESC LIMIT 1").get() as {body:string}|undefined;
            const effect=db.prepare("SELECT body FROM analysis_jobs WHERE json_extract(body,'$.state')='unknown' OR json_extract(body,'$.invocations[#-1].state')='running' ORDER BY rowid DESC LIMIT 1").get() as {body:string}|undefined;
            const jobs=new Map([effect,latest].flatMap(row=>row?[JSON.parse(row.body) as Job]:[]).map(job=>[job.jobId,job]));
            return [...jobs.values()].map(job=>({reviewId:job.reviewId,snapshotId:job.snapshotId,jobId:job.jobId,invocationId:job.invocations.at(-1)?.invocationId??null,analysisGeneration:job.generation,jobRevision:job.jobRevision,graphRevision:graph(job.reviewId,job.snapshotId).graphRevision,phase:job.invocations.at(-1)?.phase??null,state:job.state,reason:analysisDiagnosticCode(job.reason)}));
        },
        unknown: (value: AnalysisOwner) => { owner(value); return all().filter(job => job.state === "unknown").map(publicJob); },
        confirmQuiescent: (value: AnalysisOwner, jobId: string) => tx(() => { owner(value); const job = get(jobId), invocation = job.invocations.at(-1); if (job.state !== "unknown" || !invocation)
            throw new Error("invalid_request"); execution.clearQuiescent("analysis", job.jobId, invocation.invocationId); job.state = "failed"; job.reason = "interrupted_invocation_not_replayed"; update(job); }),
    };
};
