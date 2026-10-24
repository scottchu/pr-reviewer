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
