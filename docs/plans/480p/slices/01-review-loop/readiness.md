# Slice 01 readiness

**Status:** Ready for bounded implementation; independently reviewed source design; product implementation and acceptance not run

**Parent:** [Slice plan](plan.md)

## Resolved inputs

- The app notifies the existing session through CLI; the agent reads/submits replies through MCP. [Delivery](../../../../product/review-loop/delivery.md) reuses known CLI and Playground mechanisms instead of treating session-targeted messaging as an unknown invention.
- [Our PR 14](bootstrap-task.md) is selected with actual immutable base/head and source account. Own-PR selection belongs to the implementing agent, not a new user approval gate.
- [Durable product design](../../../../product/review-loop/README.md) now specifies behavior, public interfaces, data, pairing, authorization, status, recovery and managed routes.
- [Execution](execution.md) identifies local Node/Bun/Chrome, dependency/test choices, task-local start/data/stop and 01-A–G mapping. [Experiment results](experiments.md) retain observed scope and failures.
- UI is React only, guided by design-system guidelines and design principles. No Svelte, component bridge, Biome requirement, prescribed render props or framework portability work.
- [Evaluation](../../evaluation.md) fixes the prospective criterion; actual human comprehension is a later acceptance observation, not a reason to block coding.

## Dispatch

Give an implementer [this packet](handoffs/implementation.md) at the exact committed source revision. It defines the task workspace creation, scope, tests, returns and stop conditions. Routine tooling/design choices have been resolved. Record assigned agent/worktree when dispatch occurs; do not create an idle worktree solely to fill a field.

After code exists, supply its exact candidate/PR/evidence to a different reviewer using [the review packet](handoffs/review.md). Missing future candidate/results today is normal. The reviewer inspects actual changes and source contracts; passing preparation does not pass the product.

## What remains acceptance work

Implement and test the actual app/SQLite/MCP/CLI/UI path; exercise Codex and Claude independently in the actual supported environments; run real own-PR product dogfood; obtain unfamiliar-human evaluation; resolve findings; update durable product knowledge and [slice 02](../02-review-continuation/plan.md). Known unsupported exact-session proof or uncertain external effects must remain visible rather than inventing a pass or launching another session.

The earlier audit incorrectly turned basic CLI mechanics and own-PR selection into prerequisite research/user choices. This revision corrects that classification. Concrete environment failures in experiments remain recorded; they do not erase prior working mechanisms or justify a new generic host gate.

## Source review

[Independent design-readiness review](reviews/design-readiness.md) checked the contracts, source task and handoffs; bounded findings were corrected. [Experiment evidence](experiments.md) separately records actual passed checks and the fresh-process CLI tool-discovery failure without inflating either into product acceptance.
