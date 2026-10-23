# Slice 01 preparation experiments

**Status:** Authorized; execution in isolated experimental task worktree pending

**Parent:** [Slice plan](plan.md)

**Source:** [Product contract](../../../../product/review-loop/README.md)

## Questions and bounds

1. Can a real CLI-invoked Codex agent read a bounded question and submit a correlated answer using an actual MCP server, with result acceptance based on the MCP receipt rather than stdout? Use an ephemeral diagnostic run, not this active user session or a replacement product participant. Existing queue-to-thread operation is established by source/CLI evidence and is not re-probed by taking ownership of the current session.
2. Can React mount actual Svelte design-system input/button controls, receive one intent and cleanly remount/unmount? Use actual pinned source, not copied controls or tokens-only mocks.

Use the existing Bun runtime in a separate experiment branch; task-local dependencies and browser contexts are allowed by the user's experiment instruction. No global installation, credentials/settings changes, unrelated source edits or production deployment. Node.js is the product backend target; current shell has no node executable on PATH, so experiments use Bun and record the limit.

Before derived harness code, write failing transport/interop checks. Pass requires actual MCP request/result correlation for question read/reply and actual browser control/callback/teardown observations. Fail requires a concrete protocol/control mismatch; missing runtime access or unsupported interface is inconclusive, never a fictional pass. Bound diagnostic turns and keep private raw logs outside Git. Record versions, source/experiment commits, commands, checks and limits here, then update durable design and implementation/review handoffs.

These tests establish preparation mechanisms only. They do not satisfy product UI/domain/host E2E, own-PR product dogfood, unfamiliar-reviewer comprehension or full slice acceptance.
