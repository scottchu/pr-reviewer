# Slice 01 implementation handoff

**Status:** Ready for bounded implementation from the maintained design; product acceptance not yet run

**Role:** Implementer assigned at dispatch; slice owner integrates delivery and evidence

**Task:** Implement one pinned own-PR source question → existing agent session through CLI → MCP source read/reply → authoritative persisted UI answer

## Read these source inputs

1. [Product story and acceptance](../../../../../product/review-loop/README.md), [contracts](../../../../../product/review-loop/contracts.md), [CLI/MCP delivery](../../../../../product/review-loop/delivery.md) and [React presentation](../../../../../product/review-loop/presentation.md).
2. [Slice plan](../plan.md), [selected bootstrap source/question](../bootstrap-task.md), [execution and test design](../execution.md) and [observed experiment evidence](../experiments.md).
3. [Development rules](../../../../../rules/development.md), [handoff contract](../../../../../rules/agent-handoffs.md), [own-PR dogfood](../../../../../rules/own-pr-dogfood.md) and [evaluation packet](../../../evaluation.md).

The dispatch must identify the committed source/packet revision. Read actual current docs; do not reconstruct requirements from old chat or prototype code. Host mechanisms and own-PR selection are resolved design inputs, not questions to send back to the user.

## Workspace, authority and scope

Create a dedicated isolated worktree from the dispatched commit on a descriptive branch such as implement-480p-slice01-review-loop. Record the actual worktree/branch and executor identity in the slice before writes; these are dispatch metadata, not an unresolved product decision. Main stays clean/on main. At implementation dispatch, scope runtime, dependencies, configuration and tests to this bounded local slice and its task-owned data under the established PR-only delivery workflow. This preparation packet does not itself start product implementation. Preserve existing user sessions, credentials and global settings. Do not restore old src/worker code or introduce unrelated features.

Build React only, guided by design-system guidelines/principles. No Svelte, component bridge, Biome mandate, prescribed render props or framework-portability layer. Keep domain policy out of UI and stream operators, use managed cross-subsystem routes, short transactions and one durable command path.

Deliver Codex and Claude variants independently. Start with Codex and reuse existing-session queue delivery. Implement Claude's declared adapter/interface tests and run its live path in an actual Claude environment; report unrun environment evidence honestly. Neither a new substitute session nor a passing other-host fixture satisfies the exact-session contract. No provider-side exactly-once claim is required or inferred.

## Execution and expected return

Follow the [numbered TDD sequence and acceptance mapping](../execution.md). Keep scope to manual immutable source preparation, pairing, source/question UI, durable question/inbox/receipt/reply, CLI notification, MCP and truthful state. No general importer, semantic graph, repository jobs, narration/player, remote service or generalized agent platform.

Return the candidate commit and real PR, packet revision, actual run target/environment, source hashes, acceptance-to-check results/artifacts, host-specific tested/unrun outcomes, unknown effects and recovery references. Produce actual own-PR evidence; a receipt/query, not stdout prose, establishes a reply. Supply the [review packet](review.md) with the exact candidate after implementation.

Before acceptance, reconcile all learned user behavior, interfaces and detailed decisions into product docs, then contribute actual contracts/evidence/gaps to [slice 02](../../02-review-continuation/plan.md). A separate independent reviewer and applicable real-host/human-use evidence remain acceptance gates after code exists.

Stop affected work on source/identity contradictions, authorization/generation failures or an unsupported specific route; report the narrow finding and continue independent in-scope work. Do not request blanket confirmation for routine choices already established here, or bypass permissions to force a pass.
