# Plans and slices

Follow the [documentation-as-source contract](../README.md). Plans and slices are part of the source from which the agent derives implementation and tests.

Keep all project plans and individual slices here, tracked in Git. Plans connect the product intent to a bounded sequence of work. Individual slice documents link back to their plan and make each piece independently understandable and verifiable.

For each plan, record its goal, scope, decisions, sequence and current status. For each slice, record its intended outcome, dependencies, acceptance criteria, test approach, progress, verification evidence and remaining gaps. Update the existing documents as decisions and results change. Retain completed plans and slices as project history.

All code must be tested; prefer TDD. Include end-to-end coverage for implemented user journeys. UI work uses decompozr/design-system, and its actual integration belongs in that coverage. Distinguish planned tests from executed tests and record unresolved acceptance explicitly.

Create plans and slices as their scope is established, following the product vision. This directory is the durable planning location; .decompozr/ and chat are not substitutes.

Start with the [product roadmap](roadmap.md). It contains ordered, provisional vertical-slice inventories within every round, with outcome, predecessor, scope/exclusions and observable checks. Detail later individual slices only when their prerequisites establish the scope.

The next feasibility gate is the [host contract probe](probes/00-host-contract.md), which requires no product UI or comment domain and is not itself a user slice. Establish the [comprehension task and expected account](comprehension.md) before presentation implementation. The first detailed product slice is [one real question/reply loop](slices/01-review-loop.md). The [current planning review reconciliation](reviews/slicing-revision.md) records why these boundaries changed.

Every product slice must be [dogfoodable on our own real PR](own-pr-dogfood.md), with a task, separately identified candidate and pinned target, observations, gaps and pass condition. This applies from the first runnable slice. Same-agent dogfood and unfamiliar-reviewer comprehension are separate evidence.

Current authority is documentation only. A proposed inventory, experiment or test is not implementation authorization or observed acceptance. Keep planned, executed, failed, inconclusive and unrun evidence explicit.
