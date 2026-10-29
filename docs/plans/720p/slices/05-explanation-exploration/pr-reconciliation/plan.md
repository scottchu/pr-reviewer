# Reconcile stale design and SDK pull requests

Date: 2026-10-29.
Status: reconciliation published as draft PR39; source review and reference correction recorded. Graph-first/own-PR acceptance is unrun, so main merge is blocked. Old PR retirement uses verified existing-main coverage and preserves this draft record; it does not accept the new documentation PR.
Owner: root.
Parent: [slice05](../plan.md), [720p round](../../../plan.md), [roadmap](../../../../roadmap.md).
Durable contract: [current design status](../../../../../product/review-loop/design-status.md).

## Intent, scope and acceptance

The user authorizes closing #27 if main covers it and reconciling #26/#29 with the current design. Preserve valuable requirements, immutable preview sources and evidence limitations, then retire obsolete PRs without merging obsolete code or deleting their branches. No application/dependency/configuration/runtime/data changes or deployment belong to this task.

- R1: Verify exact pinned PR heads against main, distinguishing equal, evolved and absent content. Close #27 only with transport/lock/test coverage evidence.
- R2: Preserve source-in-canvas goals, wider-product gaps and old preview provenance in maintained docs; resolve current-entry composition precedence.
- R3: Independently review the docs-only reconciliation, publish through a new PR, then update and close the old PRs with links to the published replacement and explicit draft/acceptance status. Report closed versus merged accurately; retain branches.
- R4: Do not turn fixture/source checks into host, browser, layout adoption or unfamiliar-reader acceptance.

## Exact audit and disposition

Comparison baseline: `2598a8006a385fb09b529d4cc6427a021b313c8a`.
Counts cover every path changed by each PR against its own original base, comparing its head blob with the baseline. Different content is not alone proof of coverage; the disposition also uses the retained contracts and later integration history.

| PR and pinned head | Blob audit against baseline | Retirement disposition |
|---|---|---|
| [26](https://github.com/scottchu/pr-reviewer/pull/26), `cc50132dab411a78141de0121dc8a42a5a9709be` | 15 docs: 1 identical, 14 later/different, none absent | Superseded design proposal. Retain source identity, explicit connected reading, drafts/return and the subsequently recovered original-reference evidence; current minimum entry supersedes old mandatory panel composition. Close without merging. |
| [27](https://github.com/scottchu/pr-reviewer/pull/27), `53b33801f668a96d2bf8393741e64f1826f8dd33` | 12 paths: 6 identical, 5 later/different, 1 historical receipt absent | Covered SDK migration. Close without merging; preserve the historical receipt link below. |
| [29](https://github.com/scottchu/pr-reviewer/pull/29), `245879aa8006ac576827cd7147cfa0c505d05cc2` | 31 paths: 8 identical docs, 5 evolved docs, 18 preview-source paths absent | Superseded fixture preview stacked on #26. Retain immutable source and goals; do not import it as production or mark it adopted. Close before #26, retaining branches. |

### SDK coverage proof

Main integration `05953cc` retains SDK client/server `2.4.0`. Exact head/main Git blobs match for `bun.lock`, `scripts/mcp-client.ts`, `src/mcp/public.ts`, `tests/mcp-subscription-fixture.ts`, `tests/semantic-mcp.test.ts` and `tests/story-mcp.test.ts`. The manifest retains those exact SDK versions with later additions; current end-to-end tests include later source identity and UI checks. Current participant/runtime docs contain later ownership and active-steering limitations; replacing them with #27 would regress knowledge.

Fresh baseline verification: `node --experimental-strip-types --test tests/semantic-mcp.test.ts tests/story-mcp.test.ts` — 6 passed, 0 failed, 0 skipped. These are controlled actual SDK stdio modern/legacy protocol checks, not native-host or live UI acceptance. The [original SDK delivery receipt](https://github.com/scottchu/pr-reviewer/blob/53b33801f668a96d2bf8393741e64f1826f8dd33/docs/plans/480p/slices/02-review-continuation/mcp-listen-experiment/sdk-main-delivery.md) remains pinned; its historical broader test counts are not rerun claims.

### Preserve the preview without adopting it

[Exact preview source and run instructions](https://github.com/scottchu/pr-reviewer/tree/245879aa8006ac576827cd7147cfa0c505d05cc2/previews/canvas-reading) remain in Git. Compiled/tested application source was `a2634828fae6eb8025194f5f4012131445f54a4b`; later head edits record documentation. The retained [handoff](../subsystem-preview-handoff-v1.md), [subsystem map](../subsystem-mockups.md), [evidence](../canvas-preview-evidence.md) and [review fixes](../subsystem-review-fixes.md) preserve the five scenarios plus connected composition.

The fixture pins PR25 base `b096826e31c0927190806de91ed70b8b64aa93d8` and head `e3b270e5f49a9215452b0b86702946043e979059`. Import jobs, participant responses/notifications and test runs are simulated; prose comment edits are memory-only. Historical route/port/process instructions are not active-task instructions and were not revalidated. Author checks and independent source rechecks remain historical; whole-preview UI-first understanding, human layout adoption, production integration and native-host acceptance remain unestablished.

## Implementation and independent-review handoff v1

Executor: root, branch `reconcile-stale-review-prs`, isolated worktree `/Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-pr-reconciliation`. Allowed writes: this reconciliation packet, durable design-status register, documentation index/precedence links and PR metadata after publication. Preserve all application/runtime/owner state and retained branches/artifacts.

Reviewer: fresh independent agent, read-only. Review the exact committed candidate and baseline above, this packet, linked durable contracts, original pinned PR diffs and coverage evidence as necessary. Check R1–R4: no lost unique requirements; no blanket claim that existing backend capabilities are missing; no obsolete panel restoration; no preview adoption or host/live claims; correct relative links and closure ordering. Return concrete severity/evidence, performed checks, unresolved limits and pass/changes-needed conclusion. No application/UI run is authorized or required for this docs-only diff. Graph-first unfamiliar-reader evidence is not supplied and must not be reported passed.

Root self-check evidence is in ignored task-owned `.decompozr/flow/run/pr-reconciliation/` (blob audit and focused protocol log). Git-pinned facts above are the portable receipt. [Draft PR39](https://github.com/scottchu/pr-reviewer/pull/39) preserves the reconciliation; it must remain unmerged until required graph-first/own-PR evidence is available. Existing-main coverage permits closing the old proposals independently without claiming PR39 acceptance. Final remote state is read back after those authorized metadata actions. The slice and round indexes link this receipt so future work consumes current-entry precedence and retained gaps rather than treating old preview assignments as ready implementation.

Review selection: `gpt-6.1-sol`, medium reasoning, fresh context. This is a bounded documentation/coverage audit with immutable inputs and no runtime mutation. Escalate only for an unresolved unique requirement or SDK coverage discrepancy; effective model/usage telemetry is unknown unless reported by the host.

## Review and delivery state

Independent read-only source review of candidate `61ebc8f` recomputed all three original-base blob audits with zero discrepancies, checked 210 local links and verified unchanged preview source between the compiled candidate and final preview head. It found one P2: an obsolete missing-original-images claim. Correction `e8e489d` now acknowledges the three recovered October 23 originals and links their evidence. Source review is separate from graph-first acceptance; recheck of the correction is recorded in the review return.

Actual browser access for the existing candidate endpoint returned `The browser access host is unavailable` on 2026-10-29. No graph for PR39 was loaded, no blind account was frozen, and no own-PR understanding run occurred. The project graph-first rule applies to documentation PRs; this gate is unrun, not waived. PR39 remains draft and cannot be reported merged or fully accepted. No alternative automation route or runtime change was used.

Publication and cleanup are separate: #27 is retired because existing main covers its SDK delivery; #29/#26 are retired as obsolete proposals with immutable source retained and current-main contracts already evolved. Closure comments identify the draft reconciliation and preserve open integration/acceptance gaps. Their branches are retained. The application source/runtime is untouched.
