# Shared rules

These documents define development and acceptance rules across all delivery rounds. They are workflow requirements, not descriptions of implemented product behavior or proof that checks have passed. Where a document proposes a rubric, threshold or session, its proposal status remains explicit.

| Rule | Responsibility |
|---|---|
| [Round reflection](round-reflection.md) | Code-informed redesign reflection followed by fresh docs-only rebuild-readiness audit after every fidelity round. |
| [Documentation as source](documentation.md) | Durable product knowledge, derivation, slice learning and reimplementation completeness. |
| [Development](development.md) | Strict TypeScript, functional preferences, React-specific design and appropriate pattern selection; no chosen lint/format tool. |
| [Agent handoffs](agent-handoffs.md) | Implementation and independent-review assignments, scope, evidence, return and downstream contribution. |
| [Own-PR dogfood](own-pr-dogfood.md) | Real-PR acceptance, candidate versus reviewed-target identity and revalidation. |
| [Graph-first review](graph-first-review.md) | Actual UI/graph understanding before source inspection, preserved accounts and qualitative critique for every PR/MR. |
| [Comprehension](comprehension.md) | Prospective evaluation and evidence limits; default rubric and thresholds remain proposals. |

[AGENTS.md](../../AGENTS.md) remains the agent entry point for Git isolation, PR-only delivery and standing repository constraints. Product contracts such as attachment identity and stream ownership belong to [product knowledge](../product/README.md), and their workflow enforcement links here rather than duplicating them.

Round- and slice-specific tasks, assignments, evaluation packets and review results belong beside their owning [delivery plan](../plans/README.md). A review result is evidence about one named revision; it is not a new shared rule.
