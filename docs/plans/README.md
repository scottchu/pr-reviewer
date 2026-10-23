# Plans and slices

This area is delivery coordination and retained history. For product behavior use [product knowledge](../product/README.md); for shared requirements use [rules](../rules/README.md).

Follow the [documentation-as-source contract](../rules/documentation.md). Plans and slices coordinate delivery from the durable product specification. They are transient execution plans and retained history, not the sole source of product behavior or design.

Keep all project plans and individual slices here, tracked in Git. Plans connect the product intent to a bounded sequence of work. Individual slice documents link back to their plan and make each piece independently understandable and verifiable.

For each plan, record its goal, scope, decisions, sequence and current status. For each slice, record its intended outcome, dependencies, acceptance criteria, test approach, progress, verification evidence and remaining gaps. Update the existing documents as decisions and results change. Retain completed plans and slices as project history.

All code must be tested; prefer TDD. Include end-to-end coverage for implemented user journeys. UI work uses decompozr/design-system, and its actual integration belongs in that coverage. Distinguish planned tests from executed tests and record unresolved acceptance explicitly.

Create plans and slices as their scope is established, following the product vision. This directory is the durable planning location; .decompozr/ and chat are not substitutes.

## Planning hierarchy and agent handoffs

Use roadmap → round plan → individual slice plan throughout delivery, not only for 480p. Group by ownership: `docs/plans/<round>/plan.md` and `docs/plans/<round>/slices/<slice>/plan.md`. Put round reviews/probes in that round directory and slice-specific handoffs, reviews and evidence beside that slice plan. Cross-round rules remain in docs/rules/; do not recreate global slices, rounds or reviews folders. The roadmap compares rounds; each round page owns its outcome, slice sequence, shared gates and exit evidence. Each slice page owns one testable vertical outcome and its implementation and independent-review handoffs. Link both ways, with one authoritative location per acceptance contract rather than copied competing versions.

Create a round page when that round is actively planned and a page for every slice before implementation. Later pages may be provisional; missing predecessor evidence is explicit and does not authorize implementation. The current round is [480p](480p/plan.md), with [slice 01](480p/slices/01-review-loop/plan.md) and provisional [slice 02](480p/slices/02-review-continuation/plan.md).

Follow the [agent handoff contract](../rules/agent-handoffs.md) for every product slice and every assigned implementation/review agent. The slice document itself holds role-specific packets; a chat message points to its committed revision and exact assignment. Independent review inspects the actual candidate, not just the implementer's report.

### Each slice improves its successors

Before accepting a slice, its owner first promotes learned behavior and design into durable product docs outside plans under the [source contract](../rules/documentation.md), then updates each directly dependent slice plan with the delivered public interfaces and source identity, observed tests/dogfood and review evidence, limitations, changed assumptions, reusable fixtures or migration needs, and remaining decisions. Record where each finding was incorporated and which gates remain blocked. Propagate material effects to the round and roadmap where their scope or order changes. Do not copy private runtime state or credentials into plans.

The successor owner reads and reconciles that contribution, revises scope, acceptance and test strategy where needed, and records readiness before implementation. A predecessor pass does not prove the successor works. If the next slice page does not exist yet, create its bounded provisional plan as part of this contribution; do not invent unobserved interfaces or fill readiness gaps with assumptions. Fixes after review or a changed predecessor contract require checking affected downstream plans again.

Start with the [product roadmap](roadmap.md). It contains ordered, provisional vertical-slice inventories within every round, with outcome, predecessor, scope/exclusions and observable checks. Detail later individual slices only when their prerequisites establish the scope.

The next feasibility gate is the [host contract probe](480p/probes/00-host-contract.md), which requires no product UI or comment domain and is not itself a user slice. Establish the [comprehension task and expected account](../rules/comprehension.md) before presentation implementation. The first detailed product slice is [one real question/reply loop](480p/slices/01-review-loop/plan.md). The [current planning review reconciliation](480p/reviews/slicing-revision.md) records why these boundaries changed.

Every product slice must be [dogfoodable on our own real PR](../rules/own-pr-dogfood.md), with a task, separately identified candidate and pinned target, observations, gaps and pass condition. This applies from the first runnable slice. Same-agent dogfood and unfamiliar-reviewer comprehension are separate evidence.

Current authority is documentation only. A proposed inventory, experiment or test is not implementation authorization or observed acceptance. Keep planned, executed, failed, inconclusive and unrun evidence explicit.
