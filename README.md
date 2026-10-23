# PR Reviewer

Help reviewers understand what a PR changes, why it matters, and what evidence supports that understanding.

The first local review loop is implemented as a test candidate. Start with the [product vision](docs/product/vision.md): why the product exists and what understanding a PR should feel like.

Continue with the [high-level design](docs/product/architecture.md) and [product roadmap](docs/plans/roadmap.md).

Run the bounded React/SQLite review workspace using the [local run guide](docs/product/review-loop/runtime.md). It reads a manually pinned PR 14 source snapshot, saves anchored questions and accepts source-backed MCP replies. Native-host and unfamiliar-reviewer acceptance remain separate open gates.

Use the [documentation map](docs/README.md) to distinguish product knowledge, shared rules and delivery plans.
