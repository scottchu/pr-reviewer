# Reflect and audit rebuild readiness after every round

**Requirement:** Accepted user direction, 2026-10-23

**Applies to:** Every upscaling milestone and completed step: 480p, 720p, 1080p and later rounds

## Reflection from actual product structure

At each engineering milestone and after a round's engineering work, an assigned agent examines the actual code, subsystem structure, observed behavior and failures. Ask: **If rewriting the whole current product from scratch tomorrow, what design would be best now?** Evaluate whether responsibilities, data/command boundaries, lifecycle ownership and user experience still fit learned requirements. Explain useful alternatives and their tradeoffs; do not perform an unscoped rewrite merely because an alternative is interesting.

Update durable product design and knowledge from that reflection before accepting that milestone or round. Preserve accepted behavior, stories/UX, high- and low-level design decisions, invariants, public-interface meaning, lifecycle, concurrency, failure/recovery, rationale, decision-relevant rejected alternatives and verified limits. Separate observations, accepted design, proposals and unknowns. Repository documentation stores knowledge, not copied implementation or code dumps; diagrams and contract tables are appropriate when they explain meaning.

## Fresh docs-only audit

Assign a fresh independent auditor only the maintained `docs/product/` and applicable `docs/rules/` documents plus the question: **Can an agent rebuild the whole currently delivered product from these docs alone, without plans, chat or existing code?** Do not preload plans, implementation, old review transcripts or answer keys. The auditor may follow links only within that durable knowledge boundary; a required fact reachable only through plans is a gap.

The auditor returns missing or contradictory knowledge, exact document locations, affected behavior and a qualified readiness conclusion. Readability, a checklist or this audit alone does not prove an actual reimplementation. Use a bounded clean reimplementation experiment only when its evidence is useful and explicitly scoped; never claim deterministic generation from prose.

If material knowledge is missing, correct it in durable source first, have an independent auditor reassess the affected knowledge and only then accept milestone or round documentation readiness. Runtime/native/human acceptance remains separately open where unverified. This gate does not block independent engineering during a round; it blocks declaring that round accepted with material source gaps.

Record reflection findings and audit evidence under the owning round's `reviews/`, with links to the promoted product knowledge. Root coordinates agents; implementers provide code-informed learning, and the fresh auditor checks the docs without that implementation context. Flow skill availability or a disabled generic reflection skill does not waive this explicit project requirement; do not change global settings to satisfy it.

The audit question concerns the entire currently delivered product tomorrow, including retained earlier behavior. Resolve contradictions between actual behavior and accepted design by correcting the responsible design or implementation, documenting the reason. Copying source code into docs does not satisfy the knowledge requirement. A checkpoint commit may preserve incomplete work, but must not be represented as stage acceptance before these gaps close.

Distinguish a specification gap from implementation divergence. Write the accepted design decision and its reasons/tradeoffs first; where required behavior differs, close the implementation and test gap. Describing accidental implementation as intended behavior is not closure. Missing native or human observations remain unrun evidence, not invented specification defects.
