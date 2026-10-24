/** Bounded source-neighborhood-v1 value port. No compiler objects cross this port. */
export type Side = "base" | "head";
export type SourceRole = "changed" | "context" | "declaration-only";
export type Anchor = Readonly<{
  snapshotId: string; side: Side; path: string; contentHash: string;
  start: number; end: number; startLine: number; endLine: number;
}>;
export type SourceEntry = Readonly<{
  side: Side; path: string; commit: string; role: SourceRole; selected: boolean;
  source?: Readonly<{ content: string; contentHash: string; objectId?: string }>;
  exclusion?: "excluded" | "missing" | "unsupported";
}>;
export type Seed = Readonly<Pick<Anchor, "side" | "path" | "contentHash" | "start" | "end">>;
export type ResolutionProfile = Readonly<{
  name: "repository-static-v1";
  configuration?: Readonly<{
    source: Anchor;
    paths: Readonly<Record<string, readonly string[]>>;
    extends?: readonly string[];
    packageImports?: boolean;
    packageExports?: boolean;
  }>;
}>;
export type AnalysisBudgets = Readonly<{
  filesPerSide: number; fileBytes: number; totalBytes: number; seeds: number;
  astNodes: number; invocationSites: number; outputNodes: number; outputSites: number;
  aliasPatterns: number; aliasTargets: number; reExportLinks: number;
}>;
export const DEFAULT_BUDGETS: AnalysisBudgets = Object.freeze({
  filesPerSide: 128, fileBytes: 256 * 1024, totalBytes: 4 * 1024 * 1024,
  seeds: 64, astNodes: 200_000, invocationSites: 10_000, outputNodes: 2_000,
  outputSites: 4_000, aliasPatterns: 32, aliasTargets: 4, reExportLinks: 32,
});
export type AnalysisInput = Readonly<{
  contract: "source-neighborhood-v1"; snapshotId: string;
  change: Readonly<{ repository: string; provider: string; changeId: string }>;
  commits: Readonly<Record<Side, string>>;
  corpus: Readonly<Record<Side, Readonly<{
    commit: string; inventory: "changed-only" | "selected-context" | "repository-enumeration";
    acquisition: string;
  }>>>;
  sources: readonly SourceEntry[]; seeds: readonly Seed[];
  profile: ResolutionProfile; budgets: AnalysisBudgets;
}>;
export type FunctionNode = Readonly<{
  id: string; name: string;
  kind: "function" | "const-arrow" | "const-function" | "module" | "callback";
  declaration: Anchor; body: Anchor; role: SourceRole;
}>;
export type CallEdge = Readonly<{
  id: string; caller: string; callee: string; target: Anchor;
  sites: readonly Readonly<{
    anchor: Anchor; conditional: boolean; linkage: readonly Anchor[]; signatures: readonly Anchor[];
  }>[];
  method: "ts-static-binding-v1"; certainty: "resolved_static";
}>;
export type UnresolvedReason = "unsupported_dispatch" | "dynamic_invocation" | "mutable_binding"
  | "missing_module" | "external_module" | "alias_configuration_gap" | "declaration_only"
  | "ambiguous_implementation" | "parse_obstruction" | "semantic_obstruction"
  | "excluded_source" | "missing_binding" | "unsupported_binding" | "cyclic_resolution"
  | "reexport_limit";
export type UnresolvedSite = Readonly<{
  id: string; caller: string; anchor: Anchor; syntax: string; reason: UnresolvedReason;
  candidates: readonly Anchor[];
}>;
export type SourceCoverage = Readonly<{
  side: Side; path: string; role: SourceRole; selected: boolean; prepared: boolean;
  parseStatus: "not_parsed" | "parsed" | "failed";
  status: "not_selected" | "excluded" | "missing" | "unsupported" | "pending"
    | "parse_failed" | "scanned" | "budget_exceeded";
  examined: number | null; resolved: number | null; unresolved: number | null;
  reason?: string;
}>;
export type AnalysisDiagnostic = Readonly<{
  side: Side; path: string; start: number; code: string; message: string;
}>;
export type Neighborhood = Readonly<{
  seed: Seed; nodeId: string | null;
  unresolvedSeed: "source_unavailable" | "hash_mismatch" | "invalid_range" | "unsupported_or_absent" | null;
  incoming: readonly string[]; outgoing: readonly string[]; unresolved: readonly string[];
  outgoingAssessment: "No explicit invocation sites in this function body under the supported syntax scan."
    | "invocations_present" | "not_fully_analyzed";
  incomingAssessment: "No resolved callers found in these supplied files" | "resolved_callers_found";
  incomingScope: "supplied_files_only";
  limitations: readonly string[];
}>;
export type AnalysisMetadata = Readonly<{
  analyzer: "source-neighborhood-v1.0.0"; parser: string;
  snapshotId: string; corpusDigest: string; analysisId: string;
  corpus: AnalysisInput["corpus"]; coverage: readonly SourceCoverage[];
  diagnostics: readonly AnalysisDiagnostic[];
  observed: Readonly<{ bytes: number; astNodes: number; invocationSites: number }>;
}>;
export type AnalysisResult = AnalysisMetadata & (
  | Readonly<{ status: "analyzed"; nodes: readonly FunctionNode[]; edges: readonly CallEdge[];
      unresolved: readonly UnresolvedSite[]; neighborhoods: readonly Neighborhood[] }>
  | Readonly<{ status: "unavailable"; reason: "invalid_identity" | "invalid_input" | "budget_exceeded" | "parser_failure";
      detail: string; limit?: keyof AnalysisBudgets; triggeringSource?: Readonly<{ side: Side; path: string }> }>
);

export { analyzeNeighborhood } from "./analyze.ts";
