# Slice 01 preparation experiment

**Purpose:** Test actual MCP stdio plus a React-only control journey before product implementation.

**Source:** PR Reviewer review-loop product design and latest user direction: App → CLI → existing session; agent → MCP → app. Design-system guidelines/principles only; no Svelte.

**Scope:** Diagnostic store/standard MCP server and React browser fixture. The JSON receipt journal is an experiment, not the product SQLite/domain/identity implementation. No current user session is resumed/replaced, no global configuration changes and no deployment.

## Run

Use existing Bun 1.4.2 and Chrome at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome. Run bun install --frozen-lockfile, bun test and bun run check in this directory. Tests read PR 14's immutable Git objects from the repository. Temporary stores are created outside Git and cleaned after tests; the browser screenshot is written outside the task worktree.

Tests were first observed failing because store and fixture entrypoints did not exist, then implemented and passed. Three tests / 17 assertions cover persisted restart/idempotency/conflicting payload/stale generation/nonce guard, actual MCP SDK client/server stdio with wrong-target rejection and authoritative reply readback, and actual Chrome React keyboard/click submission, source label, remount and 390px no-overflow. Strict TypeScript passed. The UI is diagnostic and does not pretend to show a real delivered product answer.

Separately, ephemeral Codex model turns were attempted with process-local MCP configuration and bounded timeouts. The model could not access tools because Code Mode discovery/negotiation failed; no MCP reply persisted. A process-local host-disable diagnostic correctly failed closed; PATH checks with bundled/matched helpers did not establish a successful native round trip. No native success, provider exactly-once behavior or exact user-session binding is claimed. Prior known CLI queue/Playground behavior remains separate evidence.

This experimental branch is retained for reproducibility; application source is not restored on main. The main slice's experiment record contains the accepted findings, limits and source identities.
