# Raw projection correctness repair

Date: 2026-10-30.
Request revision: raw-projection-correctness-R1.
Status: implemented, locally verified and independently source-reviewed; draft PR published; actual UI/dogfood acceptance blocked.
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

Docs-first milestone committed as b89b323. Implementation/local tests/build passed as recorded below; independent review and PR readback pending. Live endpoint retains baseline; no deployment claim. Temporary artifacts will be retained under ignored .decompozr/flow/run/raw-projection-correctness with owner/status metadata. No old artifact is cleaned up. No whole-round acceptance claimed.

## Local verification checkpoint

Docs-first commit: b89b323. R1 repairs implemented. Declared npm run test:reading-journey: 176/176 PASS, including eight focused raw-correctness cases. npm run check (root strict TypeScript and subsystem boundaries): PASS. Minimum graph strict TypeScript: PASS. Vite native-loader production build: PASS; existing large-bundle warning retained. Frozen source/canonical/default/20/40/hide oracle uses explicit inverse normalization only for versioned constructs IDs, qualified interpretation refs and verbatim assertion rows; all other fields remain frozen. Historical fixture is retained, not blindly regenerated.

Supported CUA getBrowser({id: iab}) still returned The browser access host is unavailable. New CSS File disclosure/close/reopen React E2E is registered in the minimum-graph suite but UNRUN; no alternate browser route used. Source/pure checks establish all 684 native edited rows are exposed by File UI Types; they do not establish actual React interaction. Own-correction-PR graph intake remains blocked by fixed PR25/no selector. Live endpoint remains the old deployed candidate; no restart, deployment or merge performed.

Independent source-review dispatch: requested gpt-6.1-sol / high, fresh context. Rationale: bounded multi-layer correctness review with negative evidence/assembly cases and no visual implementation work. Escalate only for unresolved source/identity/admission correctness. Read-only packet R1; source review is explicitly narrower than blocked graph-first understanding. Candidate commit and PR will be pinned in the dispatch and reconciliation below.

## Final source-review and publication reconciliation

Product candidate: 0811d73a61b40c43f857747e0ba49e5c3acaaae2. Draft [PR42](https://github.com/scottchu/pr-reviewer/pull/42), base2638d159d7ed5f6faed1e8da0423e446e902df63, remote product head read back as0811d73. No hosted status checks reported (empty rollup), not a CI pass. [Independent review](review.md) records SOURCE PASS and the resolved source-edge collision finding; final independent targeted checks18/18, owner normal suite176/176. A1–A5 and A6 source scope verified; actual React/browser, graph-first, own-correction-PR and device gates remain unrun.

Documentation reconciliation commits after the product pin change the PR head, not the reviewed product build. Durable raw-projection and TBox/source-pipeline contracts preserve all repaired behavior, evidence responsibilities and limits. Parent round/slice link to this packet; no dependent successor is declared ready. Current fixed PR25 intake and unavailable browser require a future authorized verification step, not a new UX feature in this repair. Retain this task worktree/build/logs for open review and recovery; preserve all old worktrees/handoffs. Git push initially hit unavailable keychain credentials; publication succeeded with the existing gh credential helper scoped to that command, without persistent credential/config changes.

## Authorized merge and existing-endpoint deployment R2

Date: 2026-10-30. Request revision: raw-projection-correctness-R2. Scott explicitly requests merge of PR42, deployment to the existing HTTPS8478 endpoint and running-version verification while retaining the actual-browser gap. This supersedes the earlier no-merge/no-deploy limitation for this task only. Product scope and raw-projection acceptance A1–A6 are unchanged. Graph-first/own-PR/browser/device gaps remain unrun rather than waived or marked passed; user-authorized publication is not full product acceptance.

Execution: recheck exact PR head/base, local source review and hosted status → merge through GitHub without bypassing protections → refresh clean primary main by fast-forward only → create a clean immutable main checkout and build with existing dependencies → validate relevant tests/types/boundaries and artifact identities → preserve and byte-check the current2638d15 rollback → replace only the owned existing preview listener on127.0.0.1:57943 → compare HTML/JS/CSS/worker responses at loopback and HTTPS with the main-build manifest, and read back PID/start/cwd/command/source. No gateway, owner data, network/security setting, listener destination, installation or UX feature changes. Runtime/build/rollback receipts remain private operational artifacts. Failure requires bounded recovery to the preserved build, not a silent completion claim.

The final report distinguishes merge, main source, local checks, deployment, served-version verification and actual React/browser acceptance. Supported browser checks remain separately blocked when the host is unavailable; no alternate control route is authorized. Retain the active deployed checkout and rollback.
