# Reflect and audit rebuild readiness after every round

**Requirement:** Accepted user direction, 2026-10-23

**Applies to:** Every completed upscaling step: 480p, 720p, 1080p and later rounds

## Reflection from actual product structure

After a round's engineering work, an assigned agent examines the actual code, subsystem structure, observed behavior and failures. Ask: **If rewriting the whole current product from scratch tomorrow, what design would be best now?** Evaluate whether responsibilities, data/command boundaries, lifecycle ownership and user experience still fit learned requirements. Explain useful alternatives and their tradeoffs; do not perform an unscoped rewrite merely because an alternative is interesting.

Update durable product design and knowledge from that reflection before accepting the round. Preserve accepted behavior, stories/UX, high- and low-level design decisions, invariants, public-interface meaning, lifecycle, concurrency, failure/recovery, rationale, decision-relevant rejected alternatives and verified limits. Separate observations, accepted design, proposals and unknowns. Repository documentation stores knowledge, not copied implementation or code dumps; diagrams and contract tables are appropriate when they explain meaning.

## Fresh docs-only audit

Assign a fresh independent auditor only the maintained `docs/product/` and applicable `docs/rules/` documents plus the question: **Can an agent rebuild the whole currently delivered product from these docs alone, without plans, chat or existing code?** Do not preload plans, implementation, old review transcripts or answer keys. The auditor may follow links only within that durable knowledge boundary; a required fact reachable only through plans is a gap.

The auditor returns missing or contradictory knowledge, exact document locations, affected behavior and a qualified readiness conclusion. Readability, a checklist or this audit alone does not prove an actual reimplementation. Use a bounded clean reimplementation experiment only when its evidence is useful and explicitly scoped; never claim deterministic generation from prose.

If material knowledge is missing, correct it in durable source first, have an independent auditor reassess the affected knowledge and only then accept round documentation readiness. Runtime/native/human acceptance remains separately open where unverified. This gate does not block independent engineering during a round; it blocks declaring that round accepted with material source gaps.

Record reflection findings and audit evidence under the owning round's `reviews/`, with links to the promoted product knowledge. Root coordinates agents; implementers provide code-informed learning, and the fresh auditor checks the docs without that implementation context. Flow skill availability or a disabled generic reflection skill does not waive this explicit project requirement; do not change global settings to satisfy it.
