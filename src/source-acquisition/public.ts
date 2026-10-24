/** Source: docs/product/review-loop/evolution.md#import-boundary-v1. No admission effects. */
export type Provider = "github" | "gitlab";
export type IssueReason = "tool_missing" | "authentication" | "command_failed" | "output_limit" | "timeout" | "invalid_input" | "invalid_metadata" | "inventory_limit" | "missing_object" | "stale_candidate";
export type Issue = Readonly<{ reason: IssueReason; provider?: Provider; host?: string }>;
export type Command = Readonly<{ executable: "git" | "gh" | "glab"; args: readonly string[]; cwd: string; maxBytes: number; timeoutMs: number }>;
export type CommandResult = Readonly<{ kind: "ok"; stdout: Buffer }> | Readonly<{ kind: "unavailable"; reason: IssueReason }>;
export type AcquisitionEffects = Readonly<{ run: (command: Command) => Promise<CommandResult> }>;
export type ChangeReference = Readonly<{ provider: Provider; host: string; targetProject: string; number: number }>;
export type Candidate = ChangeReference & Readonly<{
  sourceProject: string; sourceBranch: string; targetBranch: string; url: string; title: string; state: string;
  baseSha: string; headSha: string; targetTipSha: string;
  baselineMethod: "github_compare_merge_base" | "gitlab_diff_refs";
}>;
export type LookupResult = Readonly<{ kind: "resolved"; candidate: Candidate }> | Readonly<{ kind: "unavailable"; issues: readonly Issue[] }>;
export type Discovery = Readonly<{
  kind: "none" | "unique" | "ambiguous" | "unavailable";
  canonicalWorktree: string | null; branch: string | null; upstream: string | null;
  remotes: readonly Readonly<{ host: string; project: string }>[];
  candidates: readonly Candidate[]; issues: readonly Issue[];
  reason: "resolved" | "no_match" | "detached" | "incomplete";
}>;
export type Budgets = Readonly<{ maxFiles: number; maxBlobBytes: number; maxTotalBytes: number; maxHunks: number; maxInventoryBytes: number; timeoutMs: number }>;
export type SourceText = Readonly<{ side: "base" | "head"; path: string; content: string; hash: string; objectId: string; lineCount: number }>;
export type Disposition = Readonly<{ side: "base" | "head"; path: string; state: "prepared" | "unsupported" | "missing"; reason: "text" | "empty" | "binary" | "invalid_utf8" | "submodule" | "symlink" | "object_type" | "missing_object" | "blob_limit" | "total_byte_limit" | "hunk_limit" | "patch_unavailable"; objectId: string }>;
export type Hunk = Readonly<{ id: string; oldStart: number; oldLines: number; newStart: number; newLines: number }>;
export type ChangedPath = Readonly<{ status: "modified" | "added" | "deleted" | "renamed" | "copied" | "type_changed"; oldPath: string | null; newPath: string | null; oldMode: string; newMode: string; dispositions: readonly Disposition[]; hunks: readonly Hunk[]; coverage: "text" | "unsupported" }>;
export type ImportValue = Readonly<{ snapshotId: string; candidate: Candidate; sources: readonly SourceText[]; changedFiles: readonly ChangedPath[]; counts: Readonly<{ changedPaths: number; preparedSides: number; unsupportedSides: number; missingSides: number; hunks: number; bytes: number }> }>;
export type ImportResult = Readonly<{ kind: "imported"; value: ImportValue }> | Readonly<{ kind: "unavailable"; issues: readonly Issue[] }>;
export { parseRemote, discoverChange, lookupChange } from "./provider.ts";
export { importChange, defaultBudgets } from "./git.ts";
export { createNodeEffects } from "./runner.ts";

/** Bounded context values; provider identity is declared, Git object provenance is verified. */
export type ContextSide = "base" | "head";
export type ContextRole = "changed" | "context" | "declaration-only";
export type ContextIdentity = ChangeReference & Readonly<{sourceProject:string}>;
export type ContextBudgets = Readonly<{filesPerSide:number;fileBytes:number;totalBytes:number;inventoryEntriesPerSide:number;inventoryMetadataBytes:number;treeObjectsPerSide:number;treeBytesPerSide:number;timeoutMs:number}>;
export type ContextInput = Readonly<{worktree:string;snapshotId:string;identity:ContextIdentity;commits:Readonly<Record<ContextSide,string>>;priorityPaths?:Readonly<Partial<Record<ContextSide,readonly string[]>>>;budgets?:Partial<ContextBudgets>}>;
export type ContextReason = "text" | "empty" | "not_selected" | "source_limit" | "file_limit" | "total_byte_limit" | "binary" | "invalid_utf8" | "symlink" | "submodule" | "missing_object" | "object_type" | "hash_mismatch" | "tree_limit" | "tree_byte_limit" | "inventory_limit" | "inventory_metadata_limit" | "invalid_tree";
export type ContextLedgerEntry = Readonly<{side:ContextSide;path:string;commit:string;objectId:string;mode:string;kind:"source"|"tree"|"submodule";role:ContextRole;change:"changed"|"unchanged"|"unknown";priority:boolean;selected:boolean;preparation:"prepared"|"excluded"|"missing"|"unsupported";reason:ContextReason}>;
export type ContextSource = Readonly<{side:ContextSide;path:string;commit:string;role:ContextRole;selected:true;content:string;contentHash:string;objectId:string;lineCount:number}>;
export type ContextAccount = Readonly<{commit:string;inventory:"repository-enumeration"|"selected-context";enumeration:"not_started"|"complete"|"incomplete";knownSourcePaths:number;knownBoundaryPaths:number;observedTreeEntries:number;treeObjectsRead:number;treeBytesRead:number;unvisitedPaths:0|null;preparedSources:number;excludedSources:number;missingSources:number;unsupportedSources:number}>;
export type ContextIssue = Readonly<{reason:ContextReason|"invalid_input"|"required_source_unavailable";side?:ContextSide;path?:string;limit?:keyof ContextBudgets}>;
export type ContextCorpus = Readonly<{contract:"pinned-typescript-context-v1";profile:"pinned-typescript-context-v1";provenance:"declared-provider-verified-git";snapshotId:string;identity:ContextIdentity;commits:Readonly<Record<ContextSide,string>>;budgets:ContextBudgets;priorityPaths:Readonly<Record<ContextSide,readonly string[]>>;corpusId:string;accounts:Readonly<Record<ContextSide,ContextAccount>>;ledger:readonly ContextLedgerEntry[];sources:readonly ContextSource[];observed:Readonly<{sourceBytes:number;ledgerMetadataBytes:number}>}>;
export type ContextResult = Readonly<{kind:"prepared";corpus:ContextCorpus;issues:readonly ContextIssue[]}> | Readonly<{kind:"unavailable";corpus:ContextCorpus|null;issues:readonly ContextIssue[]}>;
export { loadSourceContext, DEFAULT_CONTEXT_BUDGETS } from "./context.ts";
