# Slice 01: ask about one real behavior (480p)

**Status:** Runnable code delivery independently accepted at e24ce7c; full native-host, dogfood and human slice acceptance pending

**Parent:** [480p round plan](../../plan.md)

**Design:** [High-level design](../../../../product/architecture.md)

**Owner:** Implementing agent owns the slice; maintainer resolves material product, host and execution-scope decisions

**Authorization:** Dispatched bounded local implementation, dependencies, tests and loopback runtime authorized; PR-only delivery; no production deployment.

## Readiness and preparation

Use the [readiness audit](readiness.md) for missing pre-implementation inputs versus later review/acceptance evidence. The [selected bootstrap task](bootstrap-task.md) pins our real PR 14, source spans and source-backed account. [Execution](execution.md), [implementation handoff](handoffs/implementation.md) and [independent-review handoff](handoffs/review.md) make the next assignment concrete.

## Outcome and gap

A reviewer sees one pinned real before/after behavior change, posts a question on its exact source context, and receives a source-backed reply from the responsible agent in the exact attached conversation. The reviewer can explain the difference, a relevant consequence and the evidence and uncertainty behind the answer. This first runnable slice must be dogfoodable on our own real PR under the [per-slice dogfood contract](../../../../rules/own-pr-dogfood.md).

The local React/SQLite/MCP candidate now exists; [implementation evidence](implementation-evidence.md) distinguishes controlled-host checks from native-host and human acceptance. The [existing-session integration checks](../../probes/00-host-contract.md) reuse known CLI/MCP mechanisms and verify the product adapter as it is built. The [comprehension protocol](../../../../rules/comprehension.md) establishes the task and expected account before presentation implementation.

## Two independently testable host deliveries

Deliver **01-Codex** and **01-Claude** as bounded variants of this same end-to-end contract, following the [participant adapter plan](../../../../product/participant-adapters.md). The initiating existing session is THE attached session; neither path may silently create or fork a replacement. Each gets its own actual CLI/MCP integration evidence, own-PR dogfood record, candidate/target/session identity and 01-A through 01-G evidence. Shared domain/UI checks can be reused; real-host evidence cannot. Either may go first when ready. Both are required before calling the dual-host slice complete, and slice 02 repeats continuation per host. Supporting both types does not allow simultaneous owners of one attachment.

The [functional/reactive design](../../../../product/reactive-design.md) governs domain/effect boundaries. Library evaluation must not become a prerequisite for the host-only probe.

## Prepared implementation inputs

| Input | Current disposition |
|---|---|
| App/agent direction | App → CLI → exact existing session; agent → MCP → authoritative app state. Reuse established queue/Playground mechanisms; [integration checks](../../probes/00-host-contract.md) replace generic host feasibility research. |
| Real source and account | Selected [PR 14](bootstrap-task.md), pinned base/head, before/after spans, concrete question and expected answer. No maintainer example-selection blocker. |
| Product behavior and detailed design | [Maintained review-loop specification](../../../../product/review-loop/README.md): user story, data/public/MCP contracts, pairing, notification, recovery and React UI principles. |
| Run and test approach | [Execution plan](execution.md): actual local Node/Bun/Chrome locations, task-local data, start/stop behavior, TDD sequence and 01-A–G checks. [Experiments](experiments.md) preserve actual results and limits. |
| Evaluation criterion | [480p packet](../../evaluation.md) fixes the prospective task/rubric. Actual human observation follows a runnable candidate; missing human results are not a code-start blocker. |
| Agent assignments | [Implementation](handoffs/implementation.md) and [review](handoffs/review.md) packets define roles, reads, scope, checks, return and stop conditions. Dispatch adds exact agent/worktree/source revision; implementation later supplies the real review candidate. |

No product test is claimed before the product exists. A concrete failing host route blocks that route's acceptance, not all independently ready implementation. Full dual-host, own-PR and human acceptance remain required at the end.

## Included path and boundaries

1. Load one bounded real source snapshot prepared from verified baseline/head objects: enough before/after context for the chosen behavior and consequence, with immutable snapshot/side/path/span anchors. Show both sides, labeled additions/removals/modifications and explicit missing context. General PR import and semantic graph analysis are excluded.
2. Present readable source and a question/reply surface using React controls following the referenced design guidelines and principles. Include basic keyboard access, focus and readable labels. UI collects intent and renders queries; review rules live in domain/application interfaces.
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
| **01-A — A real anchored question gets an authoritative reply.** UI save → exact host turn → MCP source/question read → reply command → persisted query → browser display all refer to the same immutable anchor and attachment. | E2E with the React UI behavior and design-guideline conformance and real selected host; inspect the saved receipt and readback, not only rendered text. Separately identify accepted command, delivery, turn and answered states. |
| **01-B — The agent can make progress during its own turn.** A real MCP read/reply command completes while that same host turn is active. | Real-turn evidence plus transaction/locking tests show no transaction or participant-wide command lock spans the host/MCP wait. A controlled slow adapter can test local lock behavior only; it cannot prove real-host progress or independent long-job behavior. |
| **01-C — Retry and restart preserve one accepted mutation and every eligible item.** Identical command retry returns the original receipt; changed-payload commandId reuse is rejected. | Domain/adapter tests and persisted restart readback around comment/reply commit and inbox consumption. Recover cursors and coalesced addressed items without duplicate writes or lost questions. Slice 02 later expands this into the complete reopen/new-head user journey. |
| **01-D — Invalid identity, generation and anchors cannot mutate the review.** Revoke permission or replace attachment while a write is queued; the old write fails at apply time. Wrong snapshot/side/path/span is rejected. | Negative domain/interface tests and authenticated boundary checks; reply remains attributed to the verified actor and original source. Rejections leave no partial state. Comments use anchor validation, not an unrelated graph-wide revision. |
| **01-E — Uncertain wakeups remain honest.** Lost acknowledgement is queried/reconciled by invocationId or shown as unknown/pending, never blindly relaunched. Replies/receipts do not wake the agent again. | Product adapter fault tests, available owner/queue correlation and actual integrated MCP readback, and inbox eligibility tests. A fixture cannot establish missing host capabilities. |
| **01-F — The reviewer can inspect and explain the result.** Keyboard navigation reaches source, question and answer; diff labels work without color alone; evidence links reach the original source. | Actual React browser E2E for interaction plus the separately recorded unfamiliar-reviewer session against the predeclared [rubric](../../../../rules/comprehension.md). Unsupported/wrong substantive claims fail. Implementer self-check is separate evidence. |
| **01-G — We can use the candidate to review our own PR.** Ask about one implemented behavior or source-backed changed-document claim in our actual slice PR and inspect the persisted answer and its source. | Record the real PR URL and exact baseline/head, candidate source/build/runtime identity, acquisition method, observed question/reply/readback, pass condition and gaps using the [dogfood record](../../../../rules/own-pr-dogfood.md). Manual pinned-source preparation is allowed; it proves neither a general importer nor unsupported code analysis/test execution. Fixes or head changes require relevant revalidation. Same-agent dogfood does not satisfy 01-F's unfamiliar-reviewer evidence. |

## Deferred acceptance and exclusions

- **Slice 02:** Full user-facing reopen/follow-up and a new pinned head, with old discussions retained historically. Basic persistence/restart correctness of this slice remains required now.
- **Slice 03:** General PR import, whole-change coverage and the first real independent background job. Prove comments progress during that real job there. A simulated delay here is no substitute.
- **Slice 04:** Semantic relationships, React Flow, shared graph annotations and atomic graph CAS/conflict behavior. No graph mutation exists here to claim tested; source anchors and comment concurrency remain required.
- **Slice 06:** Configured repository tests, real process execution, job cancellation and terminal-outcome evidence. Slice 01 does not need a fake long-running job or a repository runner to prove the question/reply path.
- **Later slices:** Whole-PR narration/player, enrichment, advanced zoom/mobile refinement, additional hosts/languages and mature performance. No production deployment, hosted agent runtime or external PR posting.

These are feature deferrals, not architecture exceptions. Short atomic dispatch, independent jobs when introduced, action-specific CAS, turn-only serialization, apply-time authorization, stable external invocation identities and explicit unknowns remain required by the [design](../../../../product/architecture.md).

## Delivery order, evidence and stop conditions

At implementation dispatch, follow the execution and handoff packets: (1) derive failing tests for the bounded source/command/attachment interfaces; (2) implement the minimum source-to-question-to-reply path through those public interfaces; (3) exercise the real host and React E2E, then the comprehension session; (4) reconcile observed gaps here before expanding into slice 02. Tests cover the responsible domain and application policies independently of UI adapters. The internal build steps are not separate horizontal product slices.

The effort boundary is one behavior, one snapshot, one responsible conversation and one complete question/reply journey. Stop dependent work and revise the source contract if host behavior contradicts the probe, identity/source evidence cannot be verified, or the agreed expected account is wrong or incomplete. Preserve accepted questions and unknown invocation references for reconciliation; do not broaden into a new host, analyzer, runner or permissions workaround to finish the slice.

The [implementation evidence](implementation-evidence.md) records passing strict checks, domain/interface/process tests and a controlled-host React/stdio MCP journey against PR 14. Full 01-A through 01-G acceptance remains unmet: actual native-host tool integration, real-host own-PR dogfood and unfamiliar-reviewer comprehension remain explicit gates. Independent code delivery is accepted for `e24ce7c465857f5f277f3926b01342628b7ddee7` in the [final review receipt](reviews/implementation-e24ce7c.md). This is a task-branch test candidate, not a deployed release.

## Agent handoffs and successor contribution

The [implementation packet](handoffs/implementation.md) and [independent-review packet](handoffs/review.md) follow the [shared handoff contract](../../../../rules/agent-handoffs.md). The dispatcher supplies the exact committed packet and assigned task workspace. Candidate identity and executed product results are furnished after implementation, before review; they are not prerequisites to writing code.

Before acceptance, promote the actual question/reply user story, source/attachment/receipt/inbox interfaces, state transitions, authorization/failure/recovery semantics and relevant design rationale into durable product docs outside plans. Record the specification updates and evidence here; the source must support reimplementation without this execution plan or prior application. Derived decisions, observable behavior, interfaces, runtime/recovery semantics and verified limits are now promoted to the maintained review-loop product documents; acceptance remains pending.

Then update [slice 02](../02-review-continuation/plan.md) with the actual snapshot/anchor and attachment-generation contracts, receipt-aware reads, persistence/inbox/cursor interfaces, per-host probe/product results, reusable tests and recovery gaps. Record the delivered commit and where each finding changed slice 02's scope or tests. The implementation contribution is now recorded in slice 02; its owner must reconcile the actual reviewed candidate and remaining host/review gates before implementation.

## Current implementation assignment

**Authorization:** User requested implementation and independent review after preparation. Local task-scoped code, dependencies, configuration, tests and loopback app operation are in scope; preserve global settings and existing user sessions.

**Owner:** Root coordinates delivery; one assigned implementation agent writes product artifacts. Independent reviewer remains read-only.

**Source baseline:** cf179ac1eeb9073c08e4e82c950cb53bdc681c72

**Branch:** implement-480p-slice01-review-loop

**Task worktree:** /var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-slice01-u3qgyrnv/worktree

**Model selection:** gpt-6.1-sol, high effort, fresh context; cohesive full-stack slice with explicit source contracts. Escalate concrete contract/security defects to owner; do not invent weaker acceptance.

## Writer handback and milestone disposition

The assigned implementer releases sole product/code writer ownership to root after the documentation-only final review receipt. The exact independently reviewed code candidate is `e24ce7c465857f5f277f3926b01342628b7ddee7`; 19 domain/interface/process tests, strict checks and both Chrome journeys independently passed. Root owns PR 19 delivery, the authorized runnable milestone/local pilot and remaining acceptance. No full slice acceptance or slice 02 readiness is granted.
