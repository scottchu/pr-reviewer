# Raw projection correctness repair

Date: 2026-10-30.
Request revision: raw-projection-correctness-R1.
Status: docs accepted; implementation pending.
Parent: [720p round](../../../plan.md), [explanation/exploration slice](../plan.md).
Specification: [raw projection correctness](../../../../../product/raw-projection-correctness.md), [source pipeline](../../../../../product/source-pipeline.md), [TBox](../../../../../product/project-repository-tbox.md).

## Intent, reality and authority

User requests docs first, then repair and verification of five source-reviewed defects, remaining in raw projection with no new UX features. Facts must be correct now; understanding acceptance is separate. Baseline main/source 2638d159d7ed5f6faed1e8da0423e446e902df63; reviewed comparison b096826e31c0927190806de91ed70b8b64aa93d8 → e3b270e5f49a9215452b0b86702946043e979059. Observed: 8 duplicate constructs IDs, 84/684 edited rows across 27 files unavailable through current readers, permissive enrichment endpoints/evidence, missing related_policy provenance and UI assertion paraphrases. Source witnesses and all 50 changed File memberships matched pinned Git.

Executor: root. Branch: fix-raw-projection-correctness. Worktree: /Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-raw-projection-correctness. Allowed: owning docs, review-graph domain/preparation/experience/UI projection, existing renderer disclosure seam, regressions and generated candidate artifacts. No unrelated UX, parser expansion, owner data/session/config/network/security changes. Preserve deployed checkout, old worktrees and handoffs. Earlier follow-up prohibited deployment/restarts/merge; this request authorizes repair and verification, not silently changing the running endpoint. Publish a reviewable PR; retain deployment/merge as unperformed unless separately authorized and required gates pass.

## Versioned implementation handoff R1

Ready inputs: pinned source, existing dependencies and documented three-layer boundary. Steps: commit specification → failing regressions → bounded fixes → pure/integration/types/boundaries/build and supported-browser checks → independent source review and PR readback. Existing View source changes is extended to File evidence; no new UX composition. Acceptance:

- A1: unique entity/relation IDs; Before/After constructs witnesses preserved; duplicate IDs rejected.
- A2: every native edited row is available through existing changed File disclosure, including CSS/top-level/type/import and Markdown sources; source identity and pagination preserved.
- A3: supported interpretation endpoint kinds, attributed basis and exact in-bounds source references enforced, including direct assembly; invalid enrichment preserves source-only graph with failure status.
- A4: policy context has inspectable exact supporting source; no verifies_policy/replacement relation, PASS or TestRun.
- A5: Assertion source expression remains verbatim; UI does not interpret substrings.
- A6: immutable inputs, full source witness checks, retained header/call/filter/reader/worker behavior, actual React E2E and independent review evidence reported separately.

Required return: commit/PR identities, acceptance results, independently reviewed findings, limitations and remaining gates. Later slice scope is provisional; no successor is declared ready by this repair.

## Versioned independent-review handoff R1

Assign a fresh reviewer other than implementer after candidate commit/build/PR are pinned. Read-only owning scope: this packet, durable specification, actual diff and tests; check A1–A6, source-only failure behavior, typed endpoints and no UX expansion. Return concrete severity/location/reproduction, checks and pass/changes-needed/blocked. Actual graph-first task precedes source review when supported UI and own-PR intake are available. Current supported CUA reports The browser access host is unavailable; fixed PR25/no selector blocks intake of this correction PR. Record those gates unrun; independent source review is narrower and never substitutes for them.

## Progress and evidence

Docs-first milestone pending commit. Tests/build/review/PR pending. Live endpoint retains baseline; no deployment claim. Temporary artifacts will be retained under ignored .decompozr/flow/run/raw-projection-correctness with owner/status metadata. No old artifact is cleaned up. No whole-round acceptance claimed.
