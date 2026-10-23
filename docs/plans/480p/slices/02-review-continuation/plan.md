# Slice 02: continue the same review (480p)

**Status:** Provisional; awaiting slice 01 evidence; implementation not started

**Parent:** [480p round plan](../../plan.md)

**Predecessor:** [Slice 01](../01-review-loop/plan.md)

**Owner:** Slice executor to be assigned; maintainer resolves material choices

**Authorization:** Documentation only; no product execution or deployment authorized

## Outcome and boundaries

Reopen an existing discussion after restart, follow up, and inspect a second pinned head of the same real PR without misattributing the old answer. Preserve original snapshot/side/path/span identity and historical source access. Use the bounded source preparation from slice 01. General import, automatic anchor migration, semantic analysis and repository jobs remain excluded.

Both Codex and Claude continuation paths require their own observed evidence. This is the next user journey, not a substitute for slice 01's basic persistence checks.

## Inputs to refine before implementation

| Input | Status and required contribution |
|---|---|
| Actual public snapshot, attachment, receipt/read-model and inbox/cursor contracts | Awaiting slice 01 delivered commit, durable design updates and interface evidence; do not invent implementation details. |
| Per-host continuation/recovery limitations and reusable tests | Awaiting slice 01 probe/product/review results; one host's evidence does not establish the other. |
| Selected real PR, second head and explicit snapshot-switch behavior | Unselected; pin actual baseline/head identities and establish how old versus current discussions are presented. |
| Candidate/run target, execution scope and test strategy | Unassigned; refine from predecessor evidence and current authority. |
| Expected account and evaluation criteria | Complete the relevant [comprehension packet](../../evaluation.md) before presentation implementation. |

## Acceptance and test direction

- **02-A:** Save an addressed question, restart before delivery, recover it once, reply, reopen and follow up. Domain/adapter tests and actual per-host E2E demonstrate no lost inbox item, duplicate mutation or blind relaunch of an uncertain invocation.
- **02-B:** Select a new pinned head and inspect the old answer labeled with its original snapshot; open historical source and ask on the new span. No silent re-anchoring or source identity substitution.
- **02-C:** Replaced/revoked attachments cannot write via stale generation; queries expose authoritative persisted results or explicit projection-pending state. Managed subscriptions tear down and ignore late emissions.
- **02-D:** React controls following the design guidelines and principles support keyboard access and truthful pending/history labels. The agreed reviewer evaluation distinguishes which source each answer describes.
- **02-E:** [Own-PR dogfood](../../../../rules/own-pr-dogfood.md) performs the continuation/new-head task on this slice's real PR, recording candidate identity separately from reviewed baseline/head and rerunning affected checks after fixes.

Derive TDD steps, exact commands and evidence locations after the inputs are reconciled. None of these checks has run.

## Agent handoffs

Follow the [handoff contract](../../../../rules/agent-handoffs.md). The implementation packet is **blocked** on the inputs above: no executor/worktree or runtime scope is assigned. Read the maintained product specification first, then the predecessor's delivered evidence and this provisional plan; revise the plan before code.

The independent-review packet is **not ready**: no candidate, diff or product evidence exists. Supply exact source/plan revisions and acceptance 02-A through 02-E with actual per-host test/dogfood/evaluation results when dispatching a reviewer other than the implementer. Return concrete findings, checks performed and remaining gates.

## Knowledge and downstream contribution

Before acceptance, promote implemented user behavior, snapshot/history semantics, public interfaces, recovery decisions and verified limits into the appropriate durable product docs outside plans. Link those source updates and their verification here. This promotion is **pending**.

Then create/refine slice 03's bounded provisional page from its [roadmap inventory](../../../roadmap.md#720p-understand-the-whole-pr), linking a 720p round plan when that round is activated. Contribute actual source-preparation, immutable-history and recovery contracts, test assets, evidence and gaps to the importer plan. Do not claim general import or background-job acceptance from continuation evidence. Downstream contribution is **pending**; the successor must reconcile it before implementation.
