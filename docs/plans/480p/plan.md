# 480p: understand and discuss one real behavior

**Status:** Active planning; product implementation not started

**Parent:** [Product roadmap](../roadmap.md#480p-understand-and-discuss-one-real-behavior)

**Owner:** Maintainer owns material decisions; slice owners deliver and reconcile evidence

**Authorization:** Documentation only; this page does not authorize a probe, scaffold, installation or deployment

## Outcome and scope

Complete one rough real review in the originating Codex and Claude sessions, then continue it without losing questions, answers or immutable source identity. This is increasing product fidelity, not a screen-resolution target. Keep bounded source preparation; general import, semantic canvas, test execution and whole-PR narration remain later rounds.

## Slice sequence

| Slice | Plan and dependency | Required contribution to the next plan |
|---|---|---|
| 01: ask about one behavior | [Implementation and acceptance](slices/01-review-loop/plan.md); each host needs its own passing probe and product evidence | Supply slice 02 with actual snapshot/anchor, attachment generation, receipt/read-model and inbox/cursor contracts, restart evidence, per-host capabilities and remaining limitations. |
| 02: continue the same review | [Provisional plan](slices/02-review-continuation/plan.md); consumes 01 evidence before refinement | Supply slice 03's provisional plan with snapshot/history contracts, verified source preparation and recovery limits, so general import preserves those boundaries. |

Each slice has implementation and independent-review handoffs under the [shared contract](../../rules/agent-handoffs.md). 01-Codex and 01-Claude are separately verified host variants of the same slice, not separate horizontal UI/backend slices. Slice 02 must also prove continuation per host.

## Shared gates and exit evidence

- [Host probe](probes/00-host-contract.md): exact existing-session binding, actual MCP, invocation deduplication and reconciliation, independently per host. Currently unrun; not product acceptance.
- [Comprehension packet](evaluation.md), following the [shared evaluation rule](../../rules/comprehension.md): select the real task, source-backed expected account, evaluator and threshold before presentation implementation. Currently unresolved.
- [Own-PR dogfood](../../rules/own-pr-dogfood.md): every slice uses its real PR with candidate identity separate from pinned reviewed baseline/head; fixes require affected checks to run again.
- Named implementation/run target and execution authority, strict TypeScript, all-code testing/TDD, actual design-system E2E and managed subsystem boundaries remain required.

Exit requires both host variants of slice 01, slice 02 continuation for each, the agreed comprehension result, independent review and reconciled successor plans. Saved, delivered, turn complete and answered remain distinct. A new head cannot silently re-anchor old discussion. No host, product, dogfood or comprehension criterion has passed yet.

## Progress and next action

Planning pages and handoff structure exist; packets remain blocked by named inputs. Resolve the probe and evaluation inputs, then refine the authorized slice from actual evidence. Update this round when scope, sequencing or exit evidence changes; implementation details and observed results live in the responsible slice plan.

## Own-PR readiness

No own-PR target, candidate build, source snapshot or dogfood evidence is selected for slice 01. Resolve its planned PR/task and provenance inputs alongside the [evaluation packet](evaluation.md). Each slice records its own qualifying PR/task and evidence in its local plan under the [shared dogfood rule](../../rules/own-pr-dogfood.md).
