import {z} from "zod";

const definition = {
  "schema": "head-test-target-v1",
  "targetId": "review-source-core-v1",
  "revision": 2,
  "repository": {
    "host": "github.com",
    "targetProject": "scottchu/pr-reviewer",
    "sourceProject": "scottchu/pr-reviewer"
  },
  "argvTemplate": [
    "test",
    "--no-install",
    "--no-env-file",
    "--config=<owned-empty-bunfig>",
    "tests/domain.test.ts",
    "tests/registry.test.ts",
    "tests/graph.test.ts",
    "tests/source-analysis.test.ts"
  ],
  "cwd": ".",
  "runtime": {
    "role": "qualified-existing-bun",
    "version": "1.4.2",
    "sha256": "35d20dd0263e5c950194434b925454fdfa9ba6e4467da960410fa05b08a7a5b5"
  },
  "config": {
    "role": "owned-empty-bunfig",
    "bytes": 0,
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "closure": {
    "recipe": "existing-copy-v1",
    "packages": {
      "zod": "4.6.7",
      "typescript-analysis": "typescript@6.0.3"
    },
    "metadata": "exact-lock-and-entire-package-minus-scripts"
  },
  "environmentPolicy": "head-test-env-v1",
  "limits": {
    "prepareMs": 30000,
    "totalMs": 120000,
    "sourceFiles": 8192,
    "sourceFileBytes": 8388608,
    "sourceBytes": 67108864,
    "closureFiles": 32768,
    "closureFileBytes": 33554432,
    "closureBytes": 67108864,
    "outputBytes": 1048576,
    "encodedResultBytes": 2097152,
    "gitLaunches": 32,
    "runtimeVersionLaunches": 1,
    "testLaunches": 1
  }
} as const;

export const headTestDefinition = () => structuredClone(definition);
export type HeadTestDefinition = ReturnType<typeof headTestDefinition>;
export const HEAD_TEST_DEFINITION_DIGEST = "c8b3c8001ff71830ccf50405d6a50fe671c9943a4f5a4934616ce82dc043a940";
export const headTestCanonical = (value: unknown): string => JSON.stringify(value, (_key, item: unknown) =>
  item !== null && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)) : item);
const id = z.string().min(1).max(128);
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const commandId = id.refine(value => !["test-result:", "analysis-admit:", "import-admit:", "story-internal:", "attach:"].some(prefix => value.startsWith(prefix)));
export const headTestCommandSchema = z.discriminatedUnion("type", [
  z.object({type: z.literal("RequestTest"), commandId, reviewId: id, snapshotId: id, targetId: id, expectedTargetRevision: revision}).strict(),
  z.object({type: z.literal("CancelTest"), commandId, jobId: id, expectedJobRevision: revision}).strict(),
]);
export const headTestScopeSchema = z.object({reviewId: id, snapshotId: id}).strict();
export const headTestQuerySchema = z.object({reviewId: id, snapshotId: id, jobId: id.optional(), minimumJobRevision: revision.optional(), cursor: z.string().min(1).max(1024).optional()}).strict()
  .refine(value => value.minimumJobRevision === undefined || value.jobId !== undefined, "minimumJobRevision requires jobId")
  .refine(value => value.cursor === undefined || value.jobId === undefined, "cursor cannot accompany jobId");
export type HeadTestCommand = z.infer<typeof headTestCommandSchema>;
export type HeadTestScope = z.infer<typeof headTestScopeSchema>;
export type HeadTestQuery = z.infer<typeof headTestQuerySchema>;
export type HeadTestTarget = Readonly<{targetId: string; revision: number; digest: string; definition: HeadTestDefinition}>;
export type HeadTestTargets = Readonly<HeadTestScope & {headSha: string; targets: readonly (HeadTestTarget & {availability: "available" | "unavailable"; reason: "test_only_configuration" | "execution_not_configured" | "repository_not_configured" | "qualification_required" | "qualified_local_configuration" | "test_only_execution"})[]}>;
export type HeadTestInvocation = Readonly<{invocationId: string; phase: "prepare" | "execute"; state: "running" | "unknown" | "completed"; quiescence: "unresolved" | "confirmed"; processCount?: number}>;
export type HeadTestJob = Readonly<{
  schema: "head-test-job-v1"; jobId: string; reviewId: string; snapshotId: string;
  repository: string; sourceProject: string; baseSha: string; headSha: string;
  actorId: string; target: HeadTestTarget; provenance: "test_only_configuration" | "test_only_execution" | "qualified_local_configuration"; qualificationId?: string; preparation?: Readonly<{sourceManifestId:string;closureManifestId:string;sourceAccountId:string;treeId:string;runtimeSha256:string}>;
  createdAt: string; updatedAt: string; jobRevision: number;
  state: "queued" | "preparing" | "running" | "cancel_requested" | "cancelled" | "passed" | "failed" | "timed_out" | "unavailable" | "error" | "unknown";
  reason: string | null; effectDisposition: "none" | "unresolved" | "quiescent";
  cancellation: Readonly<{commandId: string; actorId: string; requestedAt: string}> | null;
  invocations: readonly HeadTestInvocation[]; result?: HeadTestResult;
}>;
export type HeadTestReceipt = Readonly<{commandId: string; actorId: string; reviewId: string; snapshotId: string; jobId: string; jobRevision: number; state: "applied"; result: Readonly<{disposition: "queued" | "cancelled" | "cancel_requested" | "already_terminal"}>}>;
export type HeadTestView = Readonly<HeadTestScope & {jobs: readonly HeadTestJob[]; selectedJob: HeadTestJob | null; nextCursor: string | null}>;

/** Uncertainty is exclusion, including inconsistent retained state. No process effect occurs here. */
export const headTestEffectOccupiesSlot = (job: Pick<HeadTestJob, 'state' | 'effectDisposition' | 'invocations'>): boolean => {
  if (job.invocations.some(item => item.state === 'running' || item.quiescence !== 'confirmed')) return true;
  if (['preparing', 'running', 'cancel_requested'].includes(job.state) || job.effectDisposition === 'unresolved') return true;
  if (job.state === 'unknown') return !(job.effectDisposition === 'quiescent' && job.invocations.at(-1)?.quiescence === 'confirmed');
  return job.state === 'queued' && job.invocations.length > 0;
};

export type HeadTestArtifact=Readonly<{artifactId:string;kind:'source_evidence'|'process_output';label:string;bytes:number;sha256:string}>;
export type HeadTestResult=Readonly<{
 schema:'head-test-result-v1';resultId:string;jobId:string;invocationId:string;
 intent:Readonly<{reviewId:string;snapshotId:string;actorId:string;repository:string;baseSha:string;headSha:string;targetDigest:string;qualificationId:string|null}>;
 coverage:'no_process_execution'|'partial_preparation'|'prepared_execution';stage:string;
 evidence:Readonly<{treeId:string|null;sourceManifestId:string|null;closureManifestId:string|null;sourceAccountId:string|null;runtimeSha256:string|null;absentReason:'not_completed'}>;
 processes:readonly Readonly<{ordinal:number;role:string;state:string;exitCode:number|null;signal:string|null}>[];
 state:'passed'|'failed'|'cancelled'|'timed_out'|'unavailable'|'error';reason:string;
 preparation:HeadTestJob['preparation']|null;preparationAbsence:'not_completed'|null;
 execution:Readonly<{exitCode:number|null;signal:string|null;collectionObserved:boolean}>|null;executionAbsence:'not_started'|null;
 output:Readonly<{observedBytes:number;retainedBytes:number;overflow:boolean}>;
 artifacts:readonly HeadTestArtifact[];
}>;
export type HeadTestAdmissionReceipt=Readonly<{commandId:string;jobId:string;jobRevision:number;resultId:string;state:'applied'}>;
export const headTestArtifactQuerySchema=z.object({reviewId:id,snapshotId:id,jobId:id,artifactId:z.string().uuid(),offset:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),length:z.number().int().min(1).max(65536).optional()}).strict();
export type HeadTestArtifactQuery=z.infer<typeof headTestArtifactQuerySchema>;
export type HeadTestArtifactView=Readonly<{jobId:string;artifactId:string;sha256:string;totalBytes:number;offset:number;bytes:number;complete:boolean;text:string}>;
