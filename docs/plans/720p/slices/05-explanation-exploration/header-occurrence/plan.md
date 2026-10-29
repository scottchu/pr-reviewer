# Header occurrence correction

Date: 2026-10-29. Parent: [720p round](../../../plan.md), [source-comparison slice](../plan.md). Baseline: main2598a80. Executor: current delegated Codex task. Branch: bind-header-removal-occurrence. Worktree: /Users/scottchu/Documents/Codex/2026-10-29/task/pr-reviewer.

## Intent and observed gap

Latest user correction authorizes fixing `remove Authorization` while rethinking, without implementing, `verifies policy`. The lowest-level projection must describe exact source facts; interpretation/story and execution are separate concerns. The [durable source contract](../../../../../product/source-pipeline.md#header-construction-occurrence-presentation) specifies this correction.

Observed: the compiler already binds header-value to the sole Before property occurrence using canonicalId/sourceWitnesses and a Before constructs edge. The edge has Direct request construction only / Not global header removal, but the actual card says Authorization + remove. The card therefore hides the semantic referent despite the correct underlying evidence. After call data already identifies accessHeaders(captured), e3b270e L30. Do not add a second identity model or infer helper behavior.

## Implementation handoff v1

Allowed seams: header card UI projection and its tests, bounded preservation-oracle exception for that intentional card delta, tracked specs/plan. Preserve Domain extraction/admission, all canonical graph IDs/relations/hashes, source disclosure, layout/viewport/filter and current test/policy edges. No network/security/data changes, live restart, merge or deployment authority. Dependencies are available locally; reuse copied installed dependencies without changing the running checkout.

Plan: (1) commit accepted docs and acceptance; (2) add independent inline-to-helper fixtures, exact PR25 projection regression and negative/missing-evidence controls, observe RED; (3) derive scoped header card wording/location from existing witnesses, retain separate After call; (4) run owning tests, strict/boundary checks, build and actual local candidate UI; (5) independent review, durable evidence and draft PR if established access permits. No live endpoint mutation.

Acceptance: A1 card subject names the property construction and removal of the source occurrence, with exact Before identity. A2 an inline-to-helper fixture retains After call evidence without claiming global header removal or helper output; missing evidence is explicit. A3 source canonical graph and all other projected cards/relations stay unchanged (frozen oracle, narrowly declared header-card exception). A4 actual candidate UI shows scoped card and request source disclosure Before/After. A5 issue1 analysis describes actual prepared relation and offers source-level semantics without code change.

Negative example: a before inline Authorization assignment replaced by an After helper call that can itself contain Authorization must never mean Authorization disappeared globally. Raw enum/status/color is preserved, wording is scoped. Tests are engineering evidence, not unfamiliar-reader acceptance.

## Independent-review handoff v1

Reviewer other than executor: read-only after candidate is committed. Inspect actual candidate graph first and freeze a scoped account of what the request/header change establishes before CLI source review. Then inspect this plan, source delta, regressions, exact preserved canonical graph and explicit header presentation exception. Report concrete issues and checks, distinguish UI/engineering/comprehension evidence. Actual own-PR graph ingestion may remain unavailable in the bounded PR25-only preparation; retain that gate explicitly rather than inventing support.

## Status

Documentation/plan prepared. Implementation, checks and candidate UI pending. Existing live service remains2598a80 at HTTPS8478/backend57943; publication/deployment requires the owner's separate authority. Preserve worktree for handoff/review.

## Candidate engineering checkpoint

Docs-first baseline packet committed b99b236. Three new regressions first failed on the bare header title; scoped projection now passes them. Generic inline-to-helper case preserves a helper function whose syntax still contains Authorization, proving that source construction removal does not require system-wide absence. PR25 default card uses its existing exact witness and separate After call; Domain source/model/compiler is unchanged. A legacy test prohibiting card-level scope was superseded by this accepted correction. Frozen source-pipeline oracle remains unchanged; its presentation comparison substitutes only header-value's exact old card, while independent tests assert the new card. Canonical entities/relations/facts and all other projected fields still match the frozen oracle.

Initial root strict/boundary check and minimum strict TypeScript pass. Production Vite build passes using --configLoader native and a task-owned output. The default loader attempted its copied absolute .vite-temp dependency symlink and hit filesystem EPERM; native config loading avoids that external cache write. Task-only preview57945 requires normal host escalation for loopback listen and is running independently of live57943. No security or live service changes.

[Issue1 analysis](policy-analysis.md) records actual prepared relation/code and three proposals; no test/policy code change. Updated full suite and actual candidate UI checks in progress.

## Verified local result and review

[Evidence](evidence.md) maps A1–A5 to actual observations. Full owning pure suite162/162 PASS; root/minimum strict TypeScript, boundaries, build and whitespace PASS. Desktop local actual UI passed via supported IAB; independent graph-first reviewer subsequently confirmed the bounded fact account in Chrome, then reviewed source and ran10/10 focused tests. No blocking correctness findings. Desktop/mobile E2E specs are in the normal minimum graph entrypoint; automation/mobile execution remains unrun. Whole-PR comprehension remains burdensome/unaccepted; own-task-PR graph dogfood remains unrun. This does not block preparing the requested reviewable draft, and does not establish release acceptance.

Durable source contract updated; exact model identities/source/relations/status and filter/layout behavior preserved by the unchanged canonical oracle. Current source test/policy relation remains unchanged; separate proposal awaits selection. Task worktree/build/raw receipts retained for owner handoff and pending publication. No live service update authorized or performed. Parent owner retains merge/deployment and end-to-end live verification responsibility.

Draft publication: [PR40](https://github.com/scottchu/pr-reviewer/pull/40), remote head5282a8b read back, main base, draft/open, no hosted checks reported. Subsequent receipt-only commit does not alter the tested application. Local verification preview stopped; retained task source/build/receipts support owner review and pending authorized delivery. Owner's next action remains review/gates then separately authorized merge/deployment/live verification; issue1 selection is separate.
