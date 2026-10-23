# Slice 01 execution and test plan

**Status:** Concrete implementation target; experiment results recorded separately

**Parent:** [Slice plan](plan.md)

**Source:** [Review-loop specification](../../../../product/review-loop/README.md)

## Run target and dependencies

Use an isolated task worktree in this repository. Target local macOS with Node 24, React 19, TypeScript strict, Vite for UI, @modelcontextprotocol/sdk with stdio, and SQLite through Node's built-in node:sqlite. Use Bun for dependency management and the test runner, and Playwright with the existing Chrome executable for browser E2E. Do not install Svelte, design-system components, Biome, a reactive library or a new global runtime.

Observed local runtimes: Bun 1.4.2; Node v24.21.0 at /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node; codex-cli 0.164.0 at /opt/homebrew/Caskroom/codex/0.164.0/bin/codex, with matching codex-code-mode-host alongside it. Use an execution-local PATH containing these directories, preserving existing configuration; never mix a newer CLI with the older bundled CLI helper. Claude is not on this shell's PATH, so its live result must be obtained in the actual Claude environment rather than invented here.

The preparation experiment resolved React 19.3.1, React DOM 19.3.1, TypeScript 7.0.2, MCP SDK 1.32.2, Zod 4.6.7 and Playwright 1.64.1 in its own branch. Pin the implementation's lockfile and check compatible releases; no package manifest currently exists on main. Guidelines reference: decompozr/design-system commit 6cfe720df1a981e8ce8bb053927aea20d12f105d, DESIGN.md and DESIGN-REVIEW.md. Apply their principles using React; external component-use instructions are not adopted.

## Start, data and stop contract to implement

Provide package scripts check, test, test:e2e, dev and stop. check runs strict TypeScript and subsystem import checks; test runs domain/interface/process tests; test:e2e runs Playwright against the real local app. dev starts the Node gateway and Vite UI with loopback binding only, initially UI 5184 and gateway 5185, allowing explicit port overrides. An occupied port causes a clear startup failure; never kill an unrelated process.

Require REVIEW_DATA_DIR pointing to a unique task-owned temporary directory. Store SQLite, prepared source, restrictive runtime/credential references and test artifacts there, outside Git and .decompozr. Emit a runtime manifest after health/readiness checks. stop reads that manifest, verifies owned process identity, gracefully closes only those processes/listeners and preserves accepted content and unresolved effects. Tests create and clean their own temporary roots; no global/user service installation or production deployment.

Prepare PR 14 source by reading the exact immutable Git objects listed in [bootstrap-task.md](bootstrap-task.md). Verify content hashes and source bounds; do not run target code/install hooks. Candidate source/build identity is recorded separately from the reviewed PR's base/head. For the later own implementation PR, select a question about its actual new behavior and define the expected answer before its run.

## TDD and delivery order

1. Domain: failing tests for source/anchor validation, question/reply transitions, command fingerprint/idempotency, rejection atomicity and generation/permission checks; implement pure transitions.
2. Storage/gateway: actual Node/SQLite transaction and restart tests, durable receipts/inbox/outbox, apply-time auth, minimum-revision queries and pending projections; implement the public application ports.
3. Pairing/MCP/delivery: test challenge consume/replay/concurrency, bootstrap access limits, credential transition and exact-session corroboration. Implement app → existing-session CLI notification and agent → MCP reads/reply. Test durable attempt claims, manual polling after lost acknowledgement, unknown without replay, and no locks across the agent's own MCP turn.
4. React: implement the bounded view and actual application bridge using design principles. Test source selection, accessible input/submission, status/source attribution and managed subscription disposal/reconnect/remount.
5. Real journey: Playwright against the real Node app, own-PR source and actual session/MCP reply. Run each supported host path separately. Inspect authoritative receipts/state, not only rendered text or CLI exit.
6. Independently review exact candidate and evidence; fix/retest affected behavior; promote learning into product docs and update slice 02. Human comprehension is evaluated separately after a runnable candidate exists.

## Acceptance mapping

| Slice acceptance | Required checks |
|---|---|
| 01-A | Actual React → committed question → CLI notification → same-session MCP question read/reply → persisted query → UI. |
| 01-B | Actual agent issues MCP while its own turn is active; transaction/locking tests confirm no held self-blocking lock. |
| 01-C | Repeated same command, changed-payload conflict, DB/process restart and inbox/cursor recovery. |
| 01-D | Wrong actor/source/anchor, expiry/replayed/concurrent pairing, wrong session and revoked/replaced generation leave no partial mutation. |
| 01-E | Durable dispatch claim, lost acknowledgement, polling/reply with still-unknown notification, no reply/receipt wake loops and no blind replay. |
| 01-F | Keyboard and source-link browser checks plus design-principle visual review; separately recorded unfamiliar-reviewer task. |
| 01-G | Real own-PR task with pinned target, separately identified candidate, receipts/artifacts and affected revalidation. |

The exact scripts and implementation artifacts are derived outputs, not already-running commands in this docs-only checkout. Preparation experiments do not count as completed product E2E, host acceptance or human understanding. Unsupported exact-session corroboration or a failed real route stays visible and blocks that host's acceptance, not all code or the independent host variant.
