# CLI notifications and MCP replies

**Parent:** [Review-loop behavior](README.md)

## Two directions

App → CLI → exact existing agent session. Agent → MCP → app. The app renders persisted MCP/domain state, not parsed agent prose from stdout. CLI exit, queued input, started turn and submitted answer are distinct observations.

Codex uses the installed existing-session notification command `codex queue --thread <session-id> --message <notification>`, without model, settings, sandbox or owner overrides. Use argument arrays, never shell-interpolated message text. It is an established local mechanism, not a new feasibility research project. The retained transfer packet records its earlier use; installed CLI 0.164.0 exposes it. `codex exec resume` and JSON events are also documented mechanisms, but a second resume process must not seize a session already owned by Desktop.

Claude Code supports session-targeted resume and print output. Its adapter uses the existing initiating session's supported CLI delivery route, with serialized notification and no fork. If a surface cannot accept input while its existing process owns it, report that specific conflict and use its supported owner/queue interface; do not silently start another conversation. This machine currently has no claude executable on PATH; that is an environment fact, not evidence that Claude cannot resume sessions. Validate the Claude path in the actual Claude environment when implementing that variant.

## Notification and reply flow

Persist AskQuestion and addressed inbox item; schedule a notification only after commit. Write an invocation intent, bind its attachment generation and claim it atomically before external dispatch. A notification names the app/review/question/event identities and requests inbox_read/question_get followed by reply_submit. It does not embed source instructions as authority or include credentials.

One scheduler owns notification attempts per attachment. It may coalesce several durable addressed items into one notification. It serializes delivery attempts, not the MCP command path or a whole participant. Notifications, MCP reads and replies never share a lock that deadlocks the agent's active turn.

CLI acceptance marks notified, not answered. MCP inbox/question reads may establish app-observed work; only a committed SubmitReply marks answered. A host completion without a reply leaves a visible request requiring attention.

## Retry, restart and uncertainty

Before any spawn, intent is durable. A crash before the durable claim is safe to claim later. Once a claim records an attempt that could have launched, a lost acknowledgement or crash is unknown unless existing CLI/owner history or an app-observed tool call proves its disposition. Do not claim CLI queue supports a provider idempotency key merely because the app stores invocationId.

Reconcile using the original attempt and observable owner/queue history or MCP correlation; never generate a new invocation identity to replay an uncertain notification. If evidence cannot resolve it, retain delivery_unknown for explicit inspection. App command retries remain idempotent, so repeated MCP submission cannot duplicate a reply. Local fault tests verify claim/restart behavior; they do not establish provider-side exactly-once turns.

Revocation/replacement fences pending and late writes at apply. An old CLI call may finish externally, but cannot reply with a stale attachment generation. Disconnect stops view observation; it is not evidence that an agent turn was cancelled. No automatic reply/receipt-triggered notification loops.

## Existing evidence and fresh acceptance

Playground's agent-native-markdown-editor bridge has source and recorded live results for thread resume, turn start, real scoped edits/comments, result capture and restart of the same thread. Its dedicated editor thread is not proof of attaching to this current chat, and its fallback-new-thread behavior must not be copied here. The retained PR Reviewer transfer used a queue to this existing receiver. Reuse these mechanisms and test the product adapter as implementation work; do not block all development on a standalone generic host probe.

Each supported host still requires actual product CLI notification → MCP read/reply → authoritative UI evidence before its acceptance. Tests must identify destination, command/event/invocation IDs and persisted reply. A fault may correctly remain unknown; that passes the truthful handling case, not proof of successful delivery.
