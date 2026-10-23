# 480p: understand and discuss one real behavior

**Status:** Active planning; product implementation not started

**Parent:** [Product roadmap](../roadmap.md#480p-understand-and-discuss-one-real-behavior)

**Owner:** Maintainer owns material decisions; slice owners deliver and reconcile evidence

**Authorization:** Source design and isolated preparation experiments authorized; implementation follows its dispatched packet. No production deployment.

## Outcome and scope

Complete one rough real review in the originating Codex and Claude sessions, then continue it without losing questions, answers or immutable source identity. This is increasing product fidelity, not a screen-resolution target. Keep bounded source preparation; general import, semantic canvas, test execution and whole-PR narration remain later rounds.

## Slice sequence

| Slice | Plan and dependency | Required contribution to the next plan |
|---|---|---|
| 01: ask about one behavior | [Implementation and acceptance](slices/01-review-loop/plan.md); each host needs its own actual CLI/MCP product evidence | Supply slice 02 with actual snapshot/anchor, attachment generation, receipt/read-model and inbox/cursor contracts, restart evidence, per-host capabilities and remaining limitations. |
| 02: continue the same review | [Provisional plan](slices/02-review-continuation/plan.md); consumes 01 evidence before refinement | Supply slice 03's provisional plan with snapshot/history contracts, verified source preparation and recovery limits, so general import preserves those boundaries. |

Each slice has implementation and independent-review handoffs under the [shared contract](../../rules/agent-handoffs.md). 01-Codex and 01-Claude are separately verified host variants of the same slice, not separate horizontal UI/backend slices. Slice 02 must also prove continuation per host.

## Shared gates and exit evidence

- [Existing-session integration checks](probes/00-host-contract.md): reuse established CLI notification and MCP reply mechanisms; verify exact binding, authorization and truthful recovery in each product host path. No generic feasibility experiment blocks coding.
- [Comprehension packet](evaluation.md), following the [shared evaluation rule](../../rules/comprehension.md): select the real task, source-backed expected account, evaluator and threshold before presentation implementation. Currently unresolved.
- [Own-PR dogfood](../../rules/own-pr-dogfood.md): every slice uses its real PR with candidate identity separate from pinned reviewed baseline/head; fixes require affected checks to run again.
- Named implementation/run target and execution authority, strict TypeScript, all-code testing/TDD, actual React E2E and design-principle review and managed subsystem boundaries remain required.

Exit requires both host variants of slice 01, slice 02 continuation for each, the agreed comprehension result, independent review and reconciled successor plans. Saved, delivered, turn complete and answered remain distinct. A new head cannot silently re-anchor old discussion. No host, product, dogfood or comprehension criterion has passed yet.

## Progress and next action

The [first slice implementation packet](slices/01-review-loop/handoffs/implementation.md) has concrete product design, selected own-PR task and execution/test approach. At dispatch, assign the worktree/executor and source revision. Product and human-use evidence is gathered after the candidate exists. Update this round when scope, sequencing or exit evidence changes; implementation details and observed results live in the responsible slice plan.

## Own-PR readiness

The [PR 14 bootstrap task](slices/01-review-loop/bootstrap-task.md) is selected and its source verified; candidate build and actual product dogfood evidence are produced by implementation, not invented during planning. Each slice records its own qualifying PR/task and evidence in its local plan under the [shared dogfood rule](../../rules/own-pr-dogfood.md).
