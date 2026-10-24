# Slice 03: discover and account for the whole change

**Packet revision:** 1

**Status:** Acquisition preparation ready for parallel dispatch; vertical integration waits on reviewed slice 02 interfaces

**Parent:** [720p round](../../plan.md)

**Predecessor:** [Slice 02](../../../480p/slices/02-review-continuation/plan.md)

**Source:** [Import boundary v1](../../../../product/review-loop/evolution.md#import-boundary-v1), [repository-path story](../../../../product/review-loop/README.md#repository-path-entry)

## Outcome and bounded readiness

Give the agent/app a repository/worktree path, resolve the corresponding GitHub PR or GitLab MR with existing authenticated tooling, explicitly choose among multiple candidates, pin the actual comparison base/head and inspect every changed part including unsupported material. No branch switching, user checkout modification, global tool installation or target code execution occurs during source acquisition.

The full route is a real durable import job; source preparation alone is not slice acceptance. History admission and graph UI integration depend on actual 02 interfaces. Acquisition can proceed independently because it returns immutable values and does not write the review database. Source/baseline identity uncertainty blocks admission, not unrelated parser fixtures or contract tests.

## Implementation handoff v1: acquisition preparation

Root assigns an acquisition executor to its own isolated descriptive task branch/worktree from the exact committed packet and records both in dispatch. **Permitted writes:** new `src/source-acquisition/` public module and implementation, focused `tests/source-acquisition.test.ts`, and this slice's plan/evidence. It may propose product-contract corrections, but serializes edits to shared evolution docs through root/02 owner. It may not edit package/lockfile, domain, storage, server, application, integration registry, UI or runtime scripts while 02 owns those. Use existing libraries/Node subprocesses; return a requested dependency change for the integration owner if truly necessary.

1. Read boundary v1 and inspect available Git/provider command declarations/tooling. Define strict TypeScript public values for discovery outcome (none/unique/ambiguous/unavailable) and validated immutable import result. Expose functions accepting immutable inputs and an injected effect adapter; no generic SDK/package split.
2. Write failing tests for correct source/target projects in forks, self-hosted GitLab, wrong-host matches, multiple/no matches, detached/default branch ambiguity, sanitized remote identities, argument-array safety and unavailable auth/tooling. Never print credentials or silently pick the newest PR.
3. Derive bounded Git blob/patch acquisition and full changed-path/hunk dispositions with strict UTF-8/text/hash validation and explicit binary/rename/delete/add/submodule/oversized/missing cases. Use local pinned objects initially; network missing-ref retrieval is separately bounded to task-owned storage and verified refs. Never execute target hooks/tests/install scripts.
4. Exercise existing authenticated provider metadata on this repository where available, recording exact provenance and supported route limits. GitHub live checks do not establish GitLab acceptance; unavailable GitLab tooling/access remains explicit. Fixtures prove parsing only.
5. Return a clean committed acquisition module/tests plus exact interface/fixtures/results and integration notes. Root/02 owner reviews compatibility before incorporation. This checkpoint may be code-reviewed independently but cannot claim a product slice or merge without required actual graph review of its PR.

## Vertical integration after prerequisite reconciliation

The assigned integration owner receives actual reviewed 02 snapshot admission/history/graph signatures and the acquisition patch. Update this packet with exact candidate/source revisions and interface differences before touching shared files. Add durable import request/job/result commands through existing ingress, separate launch identity from command receipt, release transactions before subprocess work and retain unknown effects without blind relaunch. Registered public-port routes project job results and completion state. The result enters initial preparation or AddSnapshot through the domain boundary, never direct database writes.

Present path input/candidate selection and complete ledger with raw source drilldown. While a real import job runs, existing comments remain usable. Pin a real own PR with several source, test and documentation files; the planned slice's own PR qualifies once opened. The prospective initial task can use PR 19's exact source metadata from slice01 evidence to inspect implementation/test/documentation scope; verify current provider provenance and declare exact baseline/head/account before presentation work. Candidate/target/answer key are supplied separately to the blind reviewer. Do not claim the final actual own-PR run before that PR exists.

## Acceptance and tests

- **03-A:** Unique GitHub/GitLab candidate discovery is correct; multiple matches are listed and explicitly selected, no match/unavailable routes are truthful. Contract tests and actual provider metadata evidence remain separately labeled.
- **03-B:** Every changed path/hunk has one primary inspectable coverage disposition; shared context does not double count. Blob/text/rename/delete/unsupported boundaries are tested against pinned Git fixtures and real own-PR source.
- **03-C:** Request acceptance, launch and admitted result are separate; comments progress during a real import process, restart/uncertain-launch behavior is honest. Domain/process tests and actual React E2E exercise the full route.
- **03-D:** History/anchors remain immutable, imports cannot overwrite earlier discussion and source query authorization holds. Test through public integration with 02 rather than a competing store.
- **03-E:** Actual UI/graph own-PR review yields a frozen graph-first account and source-corrected scope/relationship critique. A complete ledger alone does not pass understanding. Human evidence remains separate.

Run strict checks and focused acquisition tests during preparation; full `bun run check`, `bun run test`, `bun run test:e2e` plus real import/comment journey after integration. Root owns package/shared edits and candidate runtime credentials. All new checks are planned, not observed.

## Independent-review handoff v1

Preparation review: an engineer other than the implementer inspects the exact committed acquisition diff, boundary v1, tests/results and live-provider limitations. Focus on ambiguous match selection, fork/host identity, baseline correctness, shell/path/ref injection, bounded acquisition and no target execution or database bypass. Return findings and clear readiness for integration; no full-slice acceptance.

Full product review: after integration and an actual PR/candidate exist, dispatch a fresh graph-first reviewer with task and candidate UI access, withholding code/diff and answer key until its account is frozen. Then inspect source and evaluate scope, unresolved relationships and effort using the shared rubric. An independent engineer verifies actual tests/process/E2E, provenance and history compatibility. Root pins exact packet/source/diff/candidate/build at each dispatch. Missing inputs block that review, not independent preparation.

## Required return and successors

Return commit/worktree, public result schema, actual command/environment/test outcomes, provider-specific evidence, complete own-PR record, graph critique, unsupported conditions and recovery guidance. Promote accepted import/coverage/job contracts into durable product docs. Create/refine slice 04 from actual snapshot/job/provenance facts and select the narrow TypeScript/TSX analyzer before its implementation. No import/history/native-host/human acceptance is claimed by this packet.

## Delivered predecessor engineering contribution: 02B

**Status:** Candidate ports implemented and tested; independent 02B review and actual new own-PR task pending. See [checkpoint contract/evidence](../../../480p/slices/02-review-continuation/checkpoint-02b.md). Reconcile the reviewed final commit before shared integration.

AddSnapshot now accepts owner command identity, reviewId, expectedCurrentSnapshotId, declared identity scheme and immutable snapshot. Storage requires a nonserialized review/exact-manifest verification witness for new source, then applies permission/review membership/CAS atomically; queries accept optional retained snapshotId and return selected source plus history summaries/current ID. Question reads/replies use the question's original snapshot. Source addition never wakes a participant or retargets a draft/question. Setup persistence and original preparation input are recovery metadata, not import jobs/history admission.

The new source-preparation public boundary owns manual schema, pinned Git builder, explicit-selection reconstruction and manual_git_v1 verification. Gateway invokes verification outside transactions; raw HTTP input is not a trusted acquisition result. Acquisition-v1 needs its own verified adapter through that boundary before admission; do not recompute IDs from parsed JSON order or import source-acquisition internals into storage. Preserve the independently reviewed acquisition algorithm, provider host/source+target projects/change/baseline identity, source object IDs, rename/copy paths/modes, per-side dispositions, hunks/coverage/counts. Shared schemas represent those fields but the manual adapter intentionally does not verify the acquisition scheme.

Encoded command JSON is bounded to 8 MiB including metadata/overhead; this differs from acquisition content budgets. An oversized prepared result needs a deliberately specified artifact/result boundary, never silent truncation. Complete inventory, selected input, prepared source and analyzed links remain distinct. Global first-120 manual reference analysis has no exact omitted-path/link-count ledger. Maintain complete immutable facts/anchors while rendering bounded readable file/span/context focus; expansion cannot shrink everything into miniature fit-all graphs. Full03 job/UI/provider/native/human evidence remains unrun.
