# Documentation is the source code

The docs/ directory is the authoritative source for this repository. It defines why the product exists, its intended behavior, boundaries, decisions, plans and acceptance. The agent derives and compiles everything else from this source: application code, tests, schemas, configuration and delivery artifacts.

## Durable product knowledge versus delivery plans

Maintain product knowledge under docs/product/: user stories and observable behavior, UX and interaction rules, high-level architecture, subsystem responsibilities and public interfaces, low-level design decisions, data and lifecycle semantics, failure/recovery behavior, and acceptance criteria. Evolve the appropriate documents as the product is learned and designed; do not pre-create a speculative documentation tree.

Plans under docs/plans/ coordinate a delivery round or slice: sequence, assignments, transient tasks, readiness gates, evidence and review handoffs. They may be retained as history, but are not the only home of a product requirement or design decision. Chat and implementation are not substitutes for durable specifications.

After every slice, reconcile what was learned and designed into the durable product docs under docs/product/ before accepting it. Capture accepted behavior, interfaces, rationale, rejected alternatives when decision-relevant, verified limits and unresolved questions. Distinguish intended behavior from observed evidence; experimental findings do not silently become accepted requirements. Link the specification changes, candidate source and supporting results from the slice record, then update dependent plans from that knowledge.

A fresh agent must be able to reimplement the accepted, delivered behavior from the maintained product docs and referenced external contracts without reconstructing old plans, chat or the previous application. The docs describe inputs, outputs, invariants, errors, lifecycle and observable acceptance at enough detail to derive a new implementation and tests. Historical plans and code may provide evidence, but cannot supply missing normative behavior. An execution plan may be newly derived for the rebuild; an old plan is not a prerequisite. This is a specification-completeness requirement, not a promise of identical generated code or proof that a rebuild has already passed.

## From source to delivery

1. Capture accepted intent and corrections in the relevant documents. Refine the next authorized slice with observable acceptance and a test approach before implementation.
2. Derive the implementation and tests from those documents. Keep their relationship to the requirements explicit so a reviewer can trace what was built and why.
3. Verify the derived result against documented acceptance and actual behavior. Record results, evidence, discoveries and remaining uncertainty back in docs.
4. Promote slice learning and design into the durable product specification, then reconcile discrepancies at their source. Fix an implementation that violates the intended behavior; revise the documents when an accepted decision changes or new evidence invalidates a design assumption. Do not silently redefine success to match an implementation defect.
5. Keep the documents and their derived changes consistent in the same pull request whenever they change together.

Compilation here includes the agent interpreting requirements, designing within the documented constraints, implementing and verifying. It does not imply an existing automatic generator or deterministic rebuild. Missing material decisions remain explicit and are resolved before dependent work.

Documents state intent and preserve knowledge; observed behavior and test evidence establish what actually happened. A written requirement or generated implementation is not proof of acceptance. Chat is input to the source, and derived code can reveal gaps, but neither silently replaces the documented contract.

## Convert feedback into feed-forward signals

Before planning or deriving code, reconcile relevant feedback with requirements, source evidence and unknowns. Record provenance/context, affected scope, intended behavior and rationale, accepted versus proposed versus observed status, and any explicit supersession. Translate accepted direction into a small example, counterexample and observable acceptance signal; consult these signals while choosing the implementation, not only after it exists. Feedback is one input, not automatic authority for a universal rule, invariant or unrelated redesign. Promote accepted protected constraints to the existing invariant register; retain unresolved interpretations as proposals. Verification then reports actual conformance and returns new learning to these same documents.

## Navigation

Use the [documentation index](../README.md) to find product knowledge, shared rules and round-local delivery plans.

At each upscaling milestone, inspect actual code and structure and state the best design for rebuilding the whole current product now, with rationale and decision-relevant alternatives. Reconcile durable knowledge and actual behavior, then use a fresh docs-only independent audit of the entire delivered product. Missing material knowledge blocks milestone acceptance until corrected. The source preserves stories, behavior, interfaces, invariants, decisions, reasons and limits; copying implementation code or requiring old plans/chat to reconstruct behavior fails this contract.

## Preservation checklist for bounded changes

Use the [protected invariant register](../product/protected-invariants.md). Before derived edits, name allowed seams, protected behavior, any latest-user supersession and observable preservation checks in the existing slice packet. At review, record each affected invariant as preserved, corrected, pending or unverified with scoped evidence. Actual visual/interaction violations override mechanical PASS; proposals and probes do not become delivered behavior. Update the durable status and dependent readiness after verification.


## Graph-first recovery gates

For graph work, semantic entities/identities, typed assertions, evidence basis and unknowns precede projection. A projection cannot authorize new meaning or coverage. The bounded packet names the user's learning task, negative example, control/command scopes, state owners/lifetimes, allowlist and protected exceptions before derived edits. Tests derive from that contract; do not encode an unadopted composition such as two floating bars merely not overlapping. Separate engineering/source/visible-task/comprehension/device evidence. Repeated same-kind perceptual or ownership failure stops local patches and returns to the responsible contract; it does not authorize broad CSS/model/backend changes. Blocked review is incomplete. Reconcile conflicting owning norms before projection implementation, then obtain the required fresh whole-product docs reassessment.


## Simplification does not remove required semantics

When stripping a presentation or implementation to its minimum, record an explicit keep/remove map. Keep every accepted semantic and behavioral requirement unless the user explicitly changes it. Map each retained requirement to its model structure, derived code and observable acceptance; fewer panels/imports is not a smaller semantic contract. Missing evidence is unfinished preparation, not a scope waiver. A simplified projection must still expose the required identity-bearing graphs, typed relations and evidence. Verify these structures/tasks directly before declaring delivery; render counts or absence of chrome do not substitute.


## Make plans reconstructible in both directions

Retain links among previous/current observed reality, intent, expected reality, gap, overall plan, slice plan and resulting MR code+docs. Forward: reality→expected gap→plan→slice→MR. Backward: MR→observed outcome→slice→overall plan→gap→expected reality→previous reality. Record which statements are planned, observed or inferred reconstruction, with source/context/status. Do not infer runtime success or original intent solely from a diff. New unexpected gaps are inputs to the next plan; reconcile them rather than revising history to make prior delivery appear complete. This is a documentation responsibility, not a new planning implementation.
