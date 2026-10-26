# Documentation map

| Area | Purpose | Start here |
|---|---|---|
| Product knowledge | What the product is and how it behaves: user stories, UX, architecture, interfaces and design decisions. Durable source for reimplementation. | [Product index](product/README.md) |
| Shared rules | How agents develop, test, review, preserve knowledge and accept work. Applies across rounds; proposed criteria are labeled. | [Rules index](rules/README.md) |
| Delivery plans | What to deliver next: roadmap, per-round sequence, slice assignments, readiness, review and observed evidence. Transient coordination and retained history. | [Plans index](plans/README.md) |

[AGENTS.md](../AGENTS.md) is the agent entry point. The [documentation source contract](rules/documentation.md) explains how product knowledge drives derived artifacts and how slice learning returns to the specification.

Keep related delivery material together. Each round lives under `docs/plans/<round>/` with plan.md, slices, probes and round reviews. Each slice has its own directory with plan.md and any slice-specific handoffs, reviews or evidence records it needs. Do not create empty directories or speculative pages. Cross-round rules live once under docs/rules/; durable product knowledge lives under docs/product/ and is grouped by subsystem as it grows.

- [Exact-head test workspace](product/review-loop/test-ui.md): React test intent, progress, recovery and plain artifact presentation.

- [Change-centered PR file workspace](product/pr-file-tree-first.md): whole-PR file map, continuous source reader, bounded direct-call context and relevant declared-test lens; imports off by default, no runtime/whole-PR semantic acceptance.
- [Project and repository ontology](product/project-repository-ontology.md): TBox concepts/constraints and concrete PR25 ABox evidence; Project, Repository, source occurrences, calls and declared tests remain distinct.

- [Protected product invariants](product/protected-invariants.md): authoritative preservation/status register; every bounded change declares allowed seams and protected behavior.
