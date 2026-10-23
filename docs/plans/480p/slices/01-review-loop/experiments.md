# Slice 01 preparation experiments

**Status:** Bounded experiments completed with explicit passed and failed outcomes

**Parent:** [Slice plan](plan.md)

**Source:** [Product contract](../../../../product/review-loop/README.md)

## Scope and identities

User authorized experiments in isolated branches. Used experiment-slice01-cli-mcp-and-react, separate from the documentation task. Only diagnostic code/dependencies were created there; no root application scaffold, Svelte, global runtime/install, user-session takeover, credential change or production deployment. Code is retained separately for reproducibility; record its exact commit/PR below when published.

Bun 1.4.2; Node v24.21.0 (existing App-bundled executable); React/React DOM 19.3.1; TypeScript 7.0.2; MCP SDK 1.32.2; Zod 4.6.7; Playwright 1.64.1 and existing Chrome. Source question uses real PR 14 Git objects/spans, not a fake PR. Guidelines/principles reference design-system commit 6cfe720df1a981e8ce8bb053927aea20d12f105d. No component package or Svelte dependency is used.

## Observed checks

| Check | Result and evidence boundary |
|---|---|
| TDD | Transport test first failed on missing store module; React browser test first failed on missing fixture entrypoint. Then implemented the diagnostic code. |
| bun test | Passed: 3 tests, 17 assertions. JSON persistence survives restart; identical command stays single, changed payload/stale generation/wrong nonce reject. Actual SDK MCP client/server child exchanges question_get/reply_submit and authoritative persisted reply. This is real MCP wire evidence, not proof a model used MCP. |
| React browser | Passed in actual Chrome: labeled question input, keyboard submission, one recorded intent, immutable source label, remount with one further intent, no page errors and no overflow at 390×844. React only. Diagnostic UI does not claim a product answer was delivered. |
| bun run check | Passed strict TypeScript. No Svelte dependency in manifest or lockfile. |
| Node SQLite runtime | Existing Node 24 successfully created, wrote and read an in-memory node:sqlite table. This confirms runtime availability, not product transaction correctness. |
| Fresh Codex model/MCP attempt | Failed/inconclusive native integration: ephemeral CLI turns could not discover/call the diagnostic MCP tools due to Code Mode host negotiation timeouts. No reply persisted. Host-disable diagnostic failed closed; matched helper/Node process-local PATH did not establish success. CLI exit 0 was explicitly not counted as a reply. No global settings changed and no existing user session was resumed/replaced. |
| Existing mechanisms | Verified installed codex queue/exec resume help. Reviewed retained transfer queue evidence and Playground same-thread bridge source/recorded live results at 5c0659d79a6ca89919a7d06af08b081b0380d0f5. These are reused starting points, not new product results. |

## Design consequence

Keep App → CLI → exact existing session and agent → MCP → app, with authoritative receipts/state. Do not parse stdout as domain reply or demand a generic host-feasibility research project. Actual product-host integration still needs its own results, and the specific fresh-process tool-negotiation failure is retained for diagnosis rather than hidden. A known working queue mechanism does not make every fresh CLI tool environment equivalent.

Use React directly and apply design guidelines/principles; no component-framework bridge. Local data, tests and runtime choices are now concrete in [execution.md](execution.md). Preparation is sufficient for bounded coding and source review; none of these checks passes full 01-A–G, actual own-PR product dogfood or unfamiliar-human comprehension.

## Preservation

Experimental source has a SHA-256 manifest; raw diagnostic output and the browser screenshot remain private outside Git. Private evidence is retained at /Users/scottchu/.codex-workspaces/artifacts/pr-reviewer-slice01-preparation-2026-10-23-cdf35f91, with SHA-256 readback verification. It contains failed native diagnostic transcripts and the React screenshot; it is not a product delivery receipt. Experimental source is preserved at commit `9909fc6bf4725a143a17927a47cbbd3fbb6fe27f` in [PR 17](https://github.com/scottchu/pr-reviewer/pull/17), branch experiment-slice01-cli-mcp-and-react. It is a reproducibility artifact, intentionally not merged into main; retain its remote branch. Temporary worktrees are removed only after source/evidence preservation; historical failures remain represented here.
