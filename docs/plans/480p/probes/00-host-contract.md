# Existing-session CLI and MCP integration checks

**Kind:** Product adapter checks using established mechanisms; not a generic host-feasibility prerequisite

**Status:** Earlier mechanisms/source reviewed; current product acceptance remains unrun

**Parent:** [480p plan](../plan.md)

**Consumer:** [Slice 01](../slices/01-review-loop/plan.md)

## Established starting point

App → CLI → exact existing agent session. Agent → MCP → app. The app uses its persisted MCP/domain reply, not stdout prose, as the authoritative answer.

Installed codex-cli 0.164.0 provides `codex queue --thread <id> --message <text>`. The retained transfer packet records earlier queue use to this existing receiver. Playground's editor bridge has implementation and recorded live results for same-thread resume, real turns, scoped edit/comment results and restart. This is established engineering knowledge to reuse, not a new research question.

References: Playground commit `5c0659d79a6ca89919a7d06af08b081b0380d0f5`, `experiments/agent-native-markdown-editor/bridge/codex.ts` and `docs/agent-bridge.md`; retained private transfer archive `/Users/scottchu/.codex-workspaces/artifacts/pr-diff-teacher-2026-10-23`. Do not access the retired source worktree. Editor dedicated-thread results do not prove live-owner attachment to arbitrary sessions; its replacement-thread fallback must not be copied.

## Check the product integration

During implementation, use the [delivery contract](../../../product/review-loop/delivery.md) and the exact supported session route. Per host, verify:

1. The initiating existing session is bound to the authorized review and generation; wrong destination/actor rejects.
2. A committed question triggers a CLI notification to that session. Queue acceptance, started turn and committed reply are distinct.
3. That agent reads source/question and submits reply via actual MCP. Its commands progress while its own turn runs; no dispatcher transaction spans external waits.
4. App command retries are idempotent and attachment replacement fences old writes. Persist invocation intent before CLI dispatch; do not treat app invocationId as a provider idempotency guarantee.
5. A lost acknowledgement/restart reconciles from available owner/queue/MCP evidence or remains visibly unknown without a second blind launch. An honest unknown satisfies the uncertainty-handling case, not successful delivery.

A new generic experiment is not required before any product code. Reuse sufficient prior evidence and run bounded checks only for a concrete remaining integration question. A specific unsupported route blocks that route; independently ready domain/UI work and the other host may proceed. Full product acceptance still needs actual per-host CLI → MCP → authoritative UI evidence.

## Scope and evidence limits

User authorizes isolated task-branch experiments to resolve design/run/test details. Preserve active user sessions, credentials and global settings; use disposable diagnostic contexts for new provider turns. Do not take over this active session or launch replacement product participants. Record failure causes, tested source/runtime identity and exact limits in the slice-local [experiment record](../slices/01-review-loop/experiments.md).

Historical CLI/bridge evidence is not this product's test result. Fixtures or an actual MCP test client are not proof that a model used MCP; a completed CLI turn alone is not a persisted app reply. No general provider exactly-once guarantee, physical-device result or reviewer comprehension is claimed.
