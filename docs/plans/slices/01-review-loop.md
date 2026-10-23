# Slice 01: ask about one real behavior (480p)

**Status:** Planned; blocked on named readiness inputs; implementation not started

**Parent:** [480p round plan](../rounds/480p.md)

**Design:** [High-level design](../../architecture.md)

**Owner:** Implementing agent owns the slice; maintainer resolves material product, host and execution-scope decisions

**Authorization:** Documentation only. This contract does not start implementation, installation or deployment.

## Outcome and gap

A reviewer sees one pinned real before/after behavior change, posts a question on its exact source context, and receives a source-backed reply from the responsible agent in the exact attached conversation. The reviewer can explain the difference, a relevant consequence and the evidence and uncertainty behind the answer. This first runnable slice must be dogfoodable on our own real PR under the [per-slice dogfood contract](../own-pr-dogfood.md).

There is no application or observed host/product behavior in this repository. The [host contract probe](../probes/00-host-contract.md) establishes capability before this product path is built; it is not the comment/reply acceptance test. The [comprehension protocol](../comprehension.md) establishes the task and expected account before presentation implementation.

## Two independently testable host deliveries

Deliver **01-Codex** and **01-Claude** as bounded variants of this same end-to-end contract, following the [participant adapter plan](../../participant-adapters.md). The initiating existing session is THE attached session; neither path may silently create or fork a replacement. Each gets its own passing probe, own-PR dogfood record, candidate/target/session identity and 01-A through 01-G evidence. Shared domain/UI checks can be reused; real-host evidence cannot. Either may go first when ready. Both are required before calling the dual-host slice complete, and slice 02 repeats continuation per host. Supporting both types does not allow simultaneous owners of one attachment.

The [functional/reactive design](../../reactive-design.md) governs domain/effect boundaries. Library evaluation must not become a prerequisite for the host-only probe.

## Readiness inputs

| Required input | Current status | Owner / next action |
|---|---|---|
| Probe evidence for real binding, MCP, invocation deduplication and uncertain-outcome reconciliation | Unrun; blocks product integration | Executor runs only after host/target and probe scope are established; fail/inconclusive does not unlock this slice. |
| Own real PR/task, baseline/head, one source span and input/trigger | Unselected; planned slice PR may be named before it exists, but acceptance needs a real PR | Maintainer selects task; agent verifies source access and records candidate identity separately from target baseline/head. No fake PR or unsupported source identity. |
| Expected account, evaluator and comprehension threshold | Proposed protocol; packet absent | Complete and accept the [evaluation packet](../comprehension.md) before implementation. |
| Bounded local run target, host access and implementation scope | Unselected / not authorized | Maintainer establishes destination and scope. Existing technology direction alone is not runtime authority. |

These inputs can be prepared in documentation without a scaffold. Source selection does not require a general language analyzer or configured repository test runner; those belong to later slices. Product tests for this slice still need an explicit test strategy before code is derived.

## Included path and boundaries

1. Load one bounded real source snapshot prepared from verified baseline/head objects: enough before/after context for the chosen behavior and consequence, with immutable snapshot/side/path/span anchors. Show both sides, labeled additions/removals/modifications and explicit missing context. General PR import and semantic graph analysis are excluded.
2. Present readable source and a question/reply surface using actual decompozr/design-system controls. Include basic keyboard access, focus and readable labels. UI collects intent and renders queries; review rules live in domain/application interfaces.
3. Bind the authenticated user and responsible agent to the verified host conversation and attachment generation. Persist the anchored question through durable command ingress; atomically commit state, receipt and addressed event/outbox. Attachment, inbox and reply mutations use the same domain-write boundary. Reads use the authorized read model.
4. Deliver only the eligible addressed request through a durable inbox and the verified host adapter. Persist a stable invocationId distinct from commandId before the external effect. Release the dispatcher transaction before host work; serialize conversation turns only. The turn must be able to issue MCP queries and commands without waiting on a lock it holds.
5. Let that exact conversation read the pinned source/question through supported MCP and submit a source-backed reply through the same permitted domain actions. Recheck identity, permissions and attachment generation when the queued write applies. Do not trust caller-supplied actor strings.
6. Read the reply from authoritative persisted state and display it with its source evidence and limitations. A receipt/query must meet the resulting revision/cursor or explicitly expose projection pending. A local optimistic echo or host transcript alone is not reply acceptance.

Persist basic inbox items, cursors, consumption and causal references so restart cannot lose accepted questions. Own replies and delivery receipts are ineligible wake triggers. Ordinary graph updates and subscribed terminal jobs are not implemented here; their wake policy remains governed by the architecture when introduced. Product labels distinguish saved, pending/delivered, turn started/completed and answered. Turn completion alone does not mean a reply exists.

Cross-subsystem updates between the review read model, view-store and participant delivery use declared public-port routes in the managed integration layer. Keep registration, scoped ownership, teardown and diagnostics together; no component or business module subscribes directly to another subsystem’s internals. The first slice tests duplicate registration, dispose/reconnect, revoked scope and late emissions alongside its real journey. Start with the few routes this path needs, not a generic stream platform.

## Acceptance and verification

Use domain and adapter tests, preferably TDD, then the actual user journey. All code must be tested. Record the source version, host/environment, test commands, artifact references, observations and limits in this document as evidence arrives.

| Acceptance | Required evidence |
|---|---|
| **01-A — A real anchored question gets an authoritative reply.** UI save → exact host turn → MCP source/question read → reply command → persisted query → browser display all refer to the same immutable anchor and attachment. | E2E with the actual design-system integration and real selected host; inspect the saved receipt and readback, not only rendered text. Separately identify accepted command, delivery, turn and answered states. |
| **01-B — The agent can make progress during its own turn.** A real MCP read/reply command completes while that same host turn is active. | Real-turn evidence plus transaction/locking tests show no transaction or participant-wide command lock spans the host/MCP wait. A controlled slow adapter can test local lock behavior only; it cannot prove real-host progress or independent long-job behavior. |
| **01-C — Retry and restart preserve one accepted mutation and every eligible item.** Identical command retry returns the original receipt; changed-payload commandId reuse is rejected. | Domain/adapter tests and persisted restart readback around comment/reply commit and inbox consumption. Recover cursors and coalesced addressed items without duplicate writes or lost questions. Slice 02 later expands this into the complete reopen/new-head user journey. |
| **01-D — Invalid identity, generation and anchors cannot mutate the review.** Revoke permission or replace attachment while a write is queued; the old write fails at apply time. Wrong snapshot/side/path/span is rejected. | Negative domain/interface tests and authenticated boundary checks; reply remains attributed to the verified actor and original source. Rejections leave no partial state. Comments use anchor validation, not an unrelated graph-wide revision. |
| **01-E — Uncertain wakeups remain honest.** Lost acknowledgement is queried/reconciled by invocationId or shown as unknown/pending, never blindly relaunched. Replies/receipts do not wake the agent again. | Product adapter fault tests using the proven host contract, real-host reconciliation evidence from the probe plus the integrated invocation/readback, and inbox eligibility tests. A fixture cannot establish missing host capabilities. |
| **01-F — The reviewer can inspect and explain the result.** Keyboard navigation reaches source, question and answer; diff labels work without color alone; evidence links reach the original source. | Actual browser/design-system E2E for interaction plus the separately recorded unfamiliar-reviewer session against the predeclared [rubric](../comprehension.md). Unsupported/wrong substantive claims fail. Implementer self-check is separate evidence. |
| **01-G — We can use the candidate to review our own PR.** Ask about one implemented behavior or source-backed changed-document claim in our actual slice PR and inspect the persisted answer and its source. | Record the real PR URL and exact baseline/head, candidate source/build/runtime identity, acquisition method, observed question/reply/readback, pass condition and gaps using the [dogfood record](../own-pr-dogfood.md). Manual pinned-source preparation is allowed; it proves neither a general importer nor unsupported code analysis/test execution. Fixes or head changes require relevant revalidation. Same-agent dogfood does not satisfy 01-F's unfamiliar-reviewer evidence. |

## Deferred acceptance and exclusions

- **Slice 02:** Full user-facing reopen/follow-up and a new pinned head, with old discussions retained historically. Basic persistence/restart correctness of this slice remains required now.
- **Slice 03:** General PR import, whole-change coverage and the first real independent background job. Prove comments progress during that real job there. A simulated delay here is no substitute.
- **Slice 04:** Semantic relationships, React Flow, shared graph annotations and atomic graph CAS/conflict behavior. No graph mutation exists here to claim tested; source anchors and comment concurrency remain required.
- **Slice 06:** Configured repository tests, real process execution, job cancellation and terminal-outcome evidence. Slice 01 does not need a fake long-running job or a repository runner to prove the question/reply path.
- **Later slices:** Whole-PR narration/player, enrichment, advanced zoom/mobile refinement, additional hosts/languages and mature performance. No production deployment, hosted agent runtime or external PR posting.

These are feature deferrals, not architecture exceptions. Short atomic dispatch, independent jobs when introduced, action-specific CAS, turn-only serialization, apply-time authorization, stable external invocation identities and explicit unknowns remain required by the [design](../../architecture.md).

## Delivery order, evidence and stop conditions

After readiness and implementation authorization: (1) derive failing tests for the bounded source/command/attachment interfaces; (2) implement the minimum source-to-question-to-reply path through those public interfaces; (3) exercise the real host and design-system E2E, then the comprehension session; (4) reconcile observed gaps here before expanding into slice 02. Tests cover the responsible domain and application policies independently of UI adapters. The internal build steps are not separate horizontal product slices.

The effort boundary is one behavior, one snapshot, one responsible conversation and one complete question/reply journey. Stop dependent work and revise the source contract if host behavior contradicts the probe, identity/source evidence cannot be verified, or the agreed expected account is wrong or incomplete. Preserve accepted questions and unknown invocation references for reconciliation; do not broaden into a new host, analyzer, runner or permissions workaround to finish the slice.

All 01-A through 01-G evidence is currently **unrun/unmet**. No UI, MCP integration, database or runtime has started. No host probe, own-PR dogfood or comprehension session has passed. The next ready action is documentation of the required inputs, not application scaffolding. Deployment is N/A for the current documentation endpoint; any later implementation contract must name its authorized target and actual live acceptance.

## Agent handoffs and successor contribution

Follow the [implementation and independent-review packet contract](../agent-handoffs.md). This slice plan and acceptance 01-A through 01-G are the source packet, linked to the 480p round. Implementation assignment is **blocked**: readiness inputs above remain unresolved; no executor/worktree/run target or product implementation scope is assigned. At dispatch, record the committed plan revision, role, allowed writes and exact task workspace, then derive bounded TDD steps from the included path.

Independent review is **not assigned / not ready**: no candidate commit, PR, build or executed product evidence exists. Once available, supply its exact identity/diff, acceptance mapping and evidence with limitations to a reviewer other than the implementer. Return concrete findings and checks performed; do not infer acceptance from this plan or earlier architecture review.

Before acceptance, promote the actual question/reply user story, source/attachment/receipt/inbox interfaces, state transitions, authorization/failure/recovery semantics and relevant design rationale into durable product docs outside plans. Record the specification updates and evidence here; the source must support reimplementation without this execution plan or prior application. This promotion is currently **pending**.

Then update [slice 02](02-review-continuation.md) with the actual snapshot/anchor and attachment-generation contracts, receipt-aware reads, persistence/inbox/cursor interfaces, per-host probe/product results, reusable tests and recovery gaps. Record the delivered commit and where each finding changed slice 02's scope or tests. This contribution is currently **pending**; slice 02 must reconcile it before implementation.
