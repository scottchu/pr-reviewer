# Slice agent handoffs

**Applies to:** Every product slice in every delivery round

**Parent:** [Plans and slices](../plans/README.md)

## One authoritative plan, role-specific assignments

Each slice page is the Git-tracked execution handoff packet. Keep it at `docs/plans/<round>/slices/<slice>/plan.md`; if separate handoff or review files become useful, keep them in that same slice directory (for example handoffs/implementation.md and reviews/<candidate>.md) and link them from the plan. Round-wide review records stay under the owning round’s reviews/ directory. The maintained product docs outside plans are the durable specification; a packet coordinates work against them and does not replace them. Keep implementation and independent-review sections in that page, linking shared architecture, protocols and its parent round rather than copying them. Track packet revisions with Git; the dispatch identifies the exact committed plan revision, assigned role and permitted work. Refresh the packet when decisions, dependencies or candidate evidence change. A template or unresolved field is not a ready assignment.

For each assigned agent, identify its owner/role, repository and exact task worktree/branch, permitted writes or read-only scope, required source documents, dependencies, observable outcome, stop conditions and required return. Do not rely on access to the original chat. No packet grants broader runtime, session, merge or installation authority than the current task. Do not put credentials or private conversation content in Git.

## Implementation packet

Before product implementation, the slice owner fills:

| Item | Required content |
|---|---|
| Intent and traceability | User outcome, parent round, authoritative product-specification revisions, accepted decisions, exclusions and acceptance IDs. |
| Inputs and readiness | Predecessor packet/source revisions, delivered public interfaces and evidence, unresolved choices with owners, and explicit ready/blocked status per dependency or host variant. |
| Assignment | Named executor, task branch/worktree, allowed writes, execution/run-target authority and boundaries shared with other writers. |
| Delivery approach | Bounded steps through public subsystem interfaces, TDD/test strategy, actual React E2E and design-principle review, own-PR task and stop conditions. |
| Required return | Candidate commit/PR and environment, acceptance-to-test results, actual evidence and limitations, changed contracts, recovery notes, promoted durable specification updates and contributions to each direct successor plan. |

Resolve material inputs before dependent code. Update docs before changing derived artifacts. An implementer returns observed results, including failures and unknowns, rather than only a completion claim.

## Independent-review packet

Before assigning review, the slice owner fills:

| Item | Required content |
|---|---|
| Review target | Exact candidate source/build identity, PR and diff base/head, committed plan revision and acceptance IDs. Keep candidate identity distinct from the PR being dogfooded. |
| Review assignment | Reviewer other than the implementer, read-only scope by default, required documents and applicable interfaces, risk areas and explicit questions. |
| Evidence and checks | Implementer results/artifact locations, executed versus unrun checks, real-host/E2E/dogfood/comprehension limits, and appropriate checks to independently reproduce under authorized scope. |
| Required return | Concrete findings with source/evidence, severity and affected acceptance; checks actually performed, remaining gaps and pass/changes-needed/blocked conclusion. |

The reviewer checks actual changes against the authoritative plan and subsystem boundaries, not just the implementation summary. Fixtures cannot prove native host behavior; same-agent checks cannot be labeled independent review or unfamiliar-reviewer comprehension. An unavailable reviewer or required evidence is a recorded gate, not a pass. Fixes update the packet and require review/checks of affected behavior against the new candidate.

## Close the slice and prepare its successors

Reconcile findings and observed acceptance into the slice. Before acceptance, promote all relevant learning and design into durable product docs outside plans, including user stories, observable acceptance, architecture, public interfaces, low-level semantics, rationale, failure/recovery and verified limits. Check that a fresh agent can derive the accepted delivered behavior and tests without the old plan, chat or application; explicitly record specification gaps rather than claiming an unperformed rebuild. Link the maintained source updates and supporting evidence from the slice. Then update every directly dependent slice plan with actual delivered interfaces, source identity, verified evidence, limitations, changed assumptions, reusable test assets and unresolved gates. Record the destination and effect of that contribution in the completed slice. The successor owner reconciles it before implementation and revises its own handoffs. Propagate material round/roadmap changes, without treating predecessor success as successor acceptance.

Product slice acceptance requires the documented tests, own-PR dogfood and independent review, plus any applicable host/comprehension gates. Publish through the standing PR-only workflow; packet readiness is not new authorization. Preserve blocked or unrun criteria visibly, and never use packet completeness as evidence that the product works.
