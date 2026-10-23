# Proposed bootstrap review task

**Status:** Source verified; task proposal only; not selected or executed

**Parent:** [Slice 01 readiness](readiness.md)

**Evaluation:** [480p evaluation packet](../../evaluation.md)

## Immutable own-PR target

**PR:** [PR 14 — slice handoffs and durable product knowledge](https://github.com/scottchu/pr-reviewer/pull/14)

**Comparison baseline:** `a6d63c1e46424cb979ee912aa993ad964835c287`

**Reviewed head:** `fd6c5fb26a325c8318087c0f058de247a55e6c07`

**Source path:** `docs/README.md` in those pinned objects, not today's reorganized checkout

**Before context:** Lines 3–15

**After context:** Lines 3–25; newly explicit requirements are concentrated in lines 5–13

Verified the GitHub PR head and merged state, then checked merge commit `36aced38af008f4d51c4de901fd4bccb46b2445e` has the baseline and reviewed head above as its parents. Read both source spans directly from the immutable objects. The future candidate build identity is separate and does not yet exist.

## Proposed question and expected account

Question: What did this PR make explicit about where a completed slice's knowledge belongs, and can a future agent depend on old execution plans to rebuild the product?

Expected account, for source-informed checking before adoption:

- Before: docs were already authoritative and discrepancy/evidence reconciliation was required. Do not claim that documentation-as-source was first introduced by this PR.
- After: durable product knowledge is explicitly separated from transient delivery plans/history; user stories, behavior, architecture, interfaces and detailed decisions must survive outside plans.
- Completion: consolidate accepted behavior, rationale, limits and open questions into the durable specification, then update dependent plans from that knowledge.
- Consequence: a fresh agent can derive accepted delivered behavior and tests without reconstructing old plans, chat or the previous application. It may derive a new execution plan.
- Limit: these are documented requirements. The PR does not demonstrate a successful product rebuild, host integration or running application.

The before/after source supports these claims. No repository code behavior, general import or test execution is established. Manual pinned-source preparation is allowed by slice 01's bootstrap contract. This question is a candidate for both actual own-PR dogfood and the separate unfamiliar-reviewer task, with their evidence kept distinct.

## Still unresolved

Task adoption, immutable snapshot/anchor assignment in the future implementation, accepted answer-key review, evaluator/rubric/session criteria, candidate identity and all actual product results remain pending. Complete the evaluation packet and implementation design before using this proposal as acceptance input. If selecting another target, record its own source-grounded account prospectively.
