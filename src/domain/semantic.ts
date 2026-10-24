import { z } from "zod";
import type { ContextCorpus, ContextIssue } from "../source-acquisition/public.ts";
import type { AnalysisResult, DeclarationInventoryResult, Anchor as SemanticAnchor } from "../source-analysis/public.ts";
export type { SemanticAnchor };
const id = z.string().min(1).max(128);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const path = z.string().min(1).max(1024).refine(value => !value.startsWith("/") && !value.includes("\\") && !value.split("/").some(part => part === ".." || part === "." || !part) && !value.includes("\0"));
export const semanticAnchorSchema = z.object({ snapshotId: id, side: z.enum(["base", "head"]), path, contentHash: digest, start: z.number().int().nonnegative(), end: z.number().int().nonnegative(), startLine: z.number().int().positive(), endLine: z.number().int().positive() }).strict();
const revision = z.number().int().nonnegative();
export const analysisCommandSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("RequestAnalysis"), commandId: id.refine(value => !value.startsWith("analysis-admit:")), reviewId: id, snapshotId: id, expectedAnalysisGeneration: revision, priorityPaths: z.object({ base: z.array(path).max(64).optional(), head: z.array(path).max(64).optional() }).strict().optional(), worktree: z.string().min(1).max(4096).optional(), sourceProject: z.string().min(1).max(512).optional() }).strict().refine(value => (value.priorityPaths?.base?.length ?? 0) + (value.priorityPaths?.head?.length ?? 0) <= 64),
    z.object({ type: z.literal("SelectAnalysisDeclarations"), commandId: id.refine(value => !value.startsWith("analysis-admit:")), jobId: id, expectedJobRevision: revision, corpusId: digest, inventoryId: digest, declarationIds: z.array(id).min(1).max(2) }).strict(),
    z.object({ type: z.literal("CancelAnalysis"), commandId: id.refine(value => !value.startsWith("analysis-admit:")), jobId: id, expectedJobRevision: revision }).strict(),
    z.object({ type: z.literal("PutGraphClarification"), commandId: id.refine(value => !value.startsWith("analysis-admit:")), reviewId: id, snapshotId: id, analysisId: digest, expectedGraphRevision: revision, clarificationId: id.optional(), text: z.string().trim().min(1).max(4000), kind: z.enum(["interpretation", "question", "correction"]), primary: semanticAnchorSchema, evidence: z.array(semanticAnchorSchema).max(8), supersedes: id.optional() }).strict(),
]);
export type AnalysisCommand = z.infer<typeof analysisCommandSchema>;
export type AnalysisState = "context_queued" | "context_running" | "inventory_queued" | "inventory_running" | "awaiting_declarations" | "compute_queued" | "compute_running" | "admitted" | "unavailable" | "failed" | "cancel_requested" | "cancelled" | "superseded" | "unknown";
export type AnalysisPhase = "context" | "inventory" | "compute";
export type AnalysisProcess = {
    ordinal: number;
    executable: "git" | "node";
    state: "requested" | "started" | "exited";
    pid?: number;
    startIdentity?: string;
    exitCode?: number | null;
    signal?: string | null;
    reason?: string;
};
export type AnalysisInvocation = {
    invocationId: string;
    ownerRunId: string;
    phase: AnalysisPhase;
    state: "running" | "completed" | "cancelled" | "unknown";
    processes: AnalysisProcess[];
};
export type AnalysisJobView = {
    jobId: string;
    reviewId: string;
    snapshotId: string;
    generation: number;
    jobRevision: number;
    state: AnalysisState;
    reason: string | null;
    corpusId: string | null;
    inventoryId: string | null;
    analysisId: string | null;
    declarationIds: string[];
    invocations: AnalysisInvocation[];
    contextIssues: readonly ContextIssue[];
    admission: AnalysisReceipt | null;
};
export type AnalysisReceipt = {
    commandId: string;
    actorId: string;
    state: "applied" | "rejected";
    reviewId: string;
    snapshotId: string;
    analysisGeneration: number;
    graphRevision: number;
    jobId?: string;
    jobRevision?: number;
    result: Record<string, unknown>;
    error?: string;
};
export type GraphClarificationRevision = {
    revision: number;
    actorId: string;
    actorKind: "user" | "agent";
    kind: "interpretation" | "question" | "correction";
    text: string;
    evidence: SemanticAnchor[];
    createdAt: string;
};
export type GraphClarification = {
    clarificationId: string;
    analysisId: string;
    primary: SemanticAnchor;
    supersedes?: string;
    authorId: string;
    history: GraphClarificationRevision[];
};
export type CorpusAccount = Omit<ContextCorpus, "sources"> & {
    sources: readonly Omit<ContextCorpus["sources"][number], "content">[];
    issues: readonly ContextIssue[];
};
export type AnalysisView = {
    reviewId: string;
    snapshotId: string;
    currentSnapshotId: string;
    analysisGeneration: number;
    graphRevision: number;
    selectedAnalysisId: string | null;
    jobs: AnalysisJobView[];
    preparation: {
        jobId: string;
        corpus: CorpusAccount | null;
        inventory: DeclarationInventoryResult | null;
        result: AnalysisResult | null;
    } | null;
    corpus: CorpusAccount | null;
    inventory: DeclarationInventoryResult | null;
    analysis: AnalysisResult | null;
    clarifications: GraphClarification[];
};
export const analysisQuerySchema = z.object({ reviewId: id, snapshotId: id, analysisId: digest.optional(), minimumGraphRevision: revision.optional(), minimumJobRevision: revision.optional() }).strict();
export type AnalysisQuery = z.infer<typeof analysisQuerySchema>;
export const semanticSourceQuerySchema = z.object({ reviewId: id, snapshotId: id, corpusId: digest, side: z.enum(["base", "head"]), path, contentHash: digest }).strict();
export type SemanticSourceQuery = z.infer<typeof semanticSourceQuerySchema>;
export type SemanticSource = ContextCorpus["sources"][number] & {
    snapshotId: string;
    corpusId: string;
};
/** Semantic/worker canonical JSON deliberately preserves legacy domain canonical unchanged. */
export const semanticCanonical = (value: unknown): string => {
    if (Array.isArray(value))
        return `[${value.map(semanticCanonical).join(",")}]`;
    if (value !== null && typeof value === "object")
        return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${semanticCanonical(item)}`).join(",")}}`;
    return JSON.stringify(value) ?? "null";
};
export type {FunctionNode as SemanticFunctionNode,CallEdge as SemanticCallEdge,Neighborhood as SemanticNeighborhood,NeighborhoodDeclaration as SemanticDeclaration,AnalysisResult as SemanticAnalysisResult,DeclarationInventoryResult as SemanticInventoryResult} from '../source-analysis/public.ts';

const analysisDiagnosticCodes = new Set([
    "analysis_failed", "unauthorized", "stale_attachment", "stale_execution_owner", "stale_analysis_runner",
    "analysis_cancelled", "analysis_superseded", "new_analysis_generation", "interrupted_invocation", "interrupted_invocation_not_replayed",
    "source_unavailable", "source_identity_conflict", "source_project_required", "source_locator_required",
    "analysis_phase_conflict", "analysis_process_limit", "analysis_process_unresolved", "analysis_identity_conflict",
    "analysis_record_unavailable", "analysis_job_unavailable", "analysis_declaration_conflict", "retained_semantic_limit",
    "invalid_analysis_observation", "unresolved_process_observation", "context_unavailable", "phase_limit", "termination_unknown",
    "tool_missing", "authentication", "command_failed", "output_limit", "timeout", "invalid_input", "invalid_metadata",
    "inventory_limit", "missing_object", "stale_candidate", "required_source_unavailable", "binary", "invalid_utf8",
    "symlink", "submodule", "object_type", "hash_mismatch", "tree_limit", "tree_byte_limit", "inventory_metadata_limit",
    "invalid_tree", "file_limit", "total_byte_limit", "source_limit",
    "analysis_worker_frame", "analysis_worker_input_limit", "analysis_worker_json", "analysis_worker_output_limit",
    "analysis_worker_request", "analysis_worker_schema", "analysis_worker_validation", "analysis_worker_limit",
    "analysis_worker_owner_option", "analysis_worker_observation", "analysis_worker_cancelled", "analysis_worker_failed", "analysis_worker_timeout",
]);
export const analysisDiagnosticCode = (value: string | null): string | null => value === null ? null : analysisDiagnosticCodes.has(value) ? value : "analysis_failed";
