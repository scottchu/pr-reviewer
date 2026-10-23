# Slice 01 readiness

**Status:** Preparation may proceed; product implementation handoff is not ready

**Parent:** [Slice 01 plan](plan.md)

**Basis:** Repository documentation at main commit `80c36b59aa827580e56d2461afe8811b1edf48e5`; no product or host execution

**Scope:** Identify and prepare missing inputs; no application scaffold, dependencies, session changes or probe execution

## Already established

The [slice plan](plan.md) defines one real before/after span → anchored question → exact originating session → MCP read/reply → authoritative UI answer, with acceptance 01-A through 01-G. Scope excludes general import, semantic canvas and repository execution. React, strict TypeScript, domain/effect separation, managed stream integration, actual design-system E2E, own-PR dogfood, independent review and durable specification updates are established requirements. Codex and Claude are independently verified variants; both are required for full slice acceptance.

These are enough to assign bounded preparation, not enough to claim host feasibility or delegate an unspecified full implementation.

## Missing before implementation dispatch

| Gap | Concrete deliverable | Owner / consequence |
|---|---|---|
| Actual host capability | Name each exact existing host/version/session surface and allowed probe target; run [probe 00](../../probes/00-host-contract.md), recording binding, actual MCP, safe duplicate suppression and lost-ack reconciliation per host. | Maintainer supplies actual session/access; probe executor records results. Unrun, failed or inconclusive blocks that host integration. One passing host may proceed without claiming the other passed. |
| Real source task and answer key | Select a real own PR with actual baseline/head and before/after path/span, one concrete question, evidence-backed expected answer and explicit limits. [PR 14 is a verified proposal](bootstrap-task.md), not a selected or executed target. | Slice owner prepares; maintainer resolves material selection. No UI work against an undefined expected account. |
| Concrete product specification | Add the bounded question/reply story and design under docs/product/, linked from its index: visible states/interactions, public command/query/MCP and host ports, identities, minimum persisted state, atomic transition boundaries, error/retry/reconnect semantics, and the few declared stream routes. Include decisions and observable acceptance. | Slice owner derives the smallest design from accepted architecture and probe findings. Plans alone must not become the only product specification; do not prebuild unrelated subsystems or invent unproven host APIs. |
| Runnable scope and test approach | Name local start/stop/run target, data/artifact location and cleanup, existing-session connection scope, package manager/test tools, actual design-system package/source revision and exports, and mapping from 01-A–G to unit/interface, real-host E2E and evaluation checks. Confirm current execution authority when assigning work. | Slice owner resolves routine tooling from actual project integration; maintainer resolves material destination/access choices. Existing technology direction is not an installed scaffold. No Biome, prescribed render-prop pattern or reactive-library adoption is required. |
| Prospective comprehension evaluation | Fill the [480p evaluation packet](../../evaluation.md): source-informed answer-key check, selected rubric/threshold, evaluator and permitted assistance/time. The shared numerical rubric/session remain proposals. | Slice owner prepares; maintainer resolves outstanding criteria/evaluator choices. Required real evaluation happens after a candidate exists; no unfamiliar reviewer is silently invented. |
| Concrete implementation assignment | Record the committed product-spec/plan revisions, executor and host variant, task branch/worktree, allowed writes/run scope, delivery steps, stop conditions and required return under the [handoff contract](../../../../rules/agent-handoffs.md). | Slice owner dispatches only the ready bounded assignment. A generic template is not a packet ready for implementation. |

A design-system integration choice and test strategy are preparation tasks, not reasons to ask the user to choose every library. The review owner may be planned now; a review candidate cannot exist before implementation.

## Review readiness is a later gate

An independent reviewer can review the source design before code exists. Implementation review additionally needs the exact candidate commit/build, real PR and diff base/head, environment/run instructions, acceptance-to-test mapping, actual results/artifacts and known gaps. The reviewer must differ from the implementer and inspect actual changes. Record its assignment and findings under this slice's directory, using the [handoff contract](../../../../rules/agent-handoffs.md).

A missing candidate or passing product test today is expected, not a reason to require completed implementation before assigning implementation. Conversely, defining the review procedure does not mean review passed. Host-probe evidence is a pre-integration gate; integrated host E2E, product dogfood and reviewer comprehension are post-implementation acceptance.

## Bounded preparation order

1. Prepare supported-host contracts and the concrete probe assignment. Proposed first delivery: Codex in the existing initiating session; this is sequencing advice, not verified attachment or permission to replace a session. Claude retains its independent gate and full-slice requirement.
2. In parallel with host preparation, choose the source task/answer key and prospective evaluation criteria. PR 14 avoids relying on a not-yet-written product PR, while explicitly testing a documentation claim rather than code behavior.
3. Incorporate host results into the minimum durable product specification and concrete test/run design; reconcile scope before dispatching the ready host variant.
4. Commit the exact implementation packet, deliver via task-worktree PR, then supply the actual candidate/evidence packet to an independent reviewer. Fixes require affected rechecks.
5. Before acceptance, promote learned behavior/design to product docs and contribute actual interfaces, evidence and gaps to [slice 02](../02-review-continuation/plan.md).

## Evidence and current disposition

Read the current slice, probe, evaluation, architecture, adapter and handoff documents. Verified PR 14 metadata and its merge parents, and read the proposed source spans from both immutable Git objects. This establishes source availability and documentation gaps only. No host probe, scaffold, runtime test, product dogfood, independent review of an implementation, comprehension session or reimplementation was performed. The current handoff remains blocked on the table above; preparation can progress without claiming those outcomes.
