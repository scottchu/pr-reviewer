# CLI notifications and MCP replies

**Parent:** [Review-loop behavior](README.md)

## Two directions

App → CLI → exact existing agent session. Agent → MCP → app. The app renders persisted MCP/domain state, not parsed agent prose from stdout. CLI exit, queued input, started turn and submitted answer are distinct observations.

Codex delivery must append the notification to the active turn of the exact attached session through the existing owner's supported `turn/steer` route. Capture the owner-observed active turn ID and send it as `expectedTurnId` with the exact `threadId`; the accepted response must name that same turn. This preserves the initiating session and does not start a new turn. A CLI schema supporting steering does not establish a working route to a particular live Desktop owner. Do not launch another app-server, resume process, daemon, fork or replacement conversation to obtain control.

The installed CLI 0.164.0 exposes `queue` and `app-server proxy`, but has no `steer` subcommand or queue steering flag. The former unconditional `codex queue --thread <session-id> --message <notification>` behavior is historical and does not meet active-turn delivery. A verified owner route may use queue for an idle thread only after authoritative, pre-effect evidence establishes no active turn. No queue fallback is allowed after a possibly accepted steer, lost acknowledgement, stale turn precondition, or uncertain owner observation. Without a verified existing-owner route, fail before sending and retain the durable inbox; do not disguise queue as steering. Use argument arrays and IDs-only text, with no model, settings, sandbox, owner overrides, credentials or source instructions.

The host request contract is documented in [Codex app-server](https://learn.chatgpt.com/docs/app-server). Steering has an active-turn precondition and does not emit a new turn-start event. Provider-side idempotency is unverified: invocation IDs remain local causal evidence, not a guarantee of safe replay.

Claude Code supports session-targeted resume and print output. Its adapter uses the existing initiating session's supported CLI delivery route, with serialized notification and no fork. If a surface cannot accept input while its existing process owns it, report that specific conflict and use its supported owner/queue interface; do not silently start another conversation. This machine currently has no claude executable on PATH; that is an environment fact, not evidence that Claude cannot resume sessions. Validate the Claude path in the actual Claude environment when implementing that variant.

## Notification and reply flow

Persist AskQuestion and addressed inbox item; schedule a notification only after commit. Write an invocation intent, bind its attachment generation and claim it atomically before external dispatch. A notification names the app/review/question/event identities and requests inbox_read/question_get followed by reply_submit. It does not embed source instructions as authority or include credentials.

One scheduler owns notification attempts per attachment. It may coalesce several durable addressed items into one notification. It serializes delivery attempts, not the MCP command path or a whole participant. Notifications, MCP reads and replies never share a lock that deadlocks the agent's active turn.

CLI acceptance marks notified, not answered. MCP inbox/question reads may establish app-observed work; only a committed SubmitReply marks answered. A host completion without a reply leaves a visible request requiring attention. Reply existence and notification-attempt outcome are separate fields, so manual polling after a lost acknowledgement does not rewrite external-delivery history.

## Retry, restart and uncertainty

Before any spawn, intent is durable. A crash before the durable claim is safe to claim later. Once a claim records an attempt that could have launched, a lost acknowledgement or crash is unknown unless existing CLI/owner queue history explicitly correlated to that attempt proves its disposition. Do not claim CLI queue supports a provider idempotency key merely because the app stores invocationId.

Reconcile delivery acknowledgement only from owner/queue history explicitly tied to the original invocation/message. An MCP call may echo notification invocationId, which supports correlation but does not independently prove which CLI attempt caused the call. Manual inbox polling or a reply can make the question working/answered while the notification remains unknown. Never upgrade notification acceptance merely because the question was read or answered. Never generate a new invocation identity to replay an uncertain notification. If evidence cannot resolve it, retain delivery_unknown for explicit inspection. App command retries remain idempotent, so repeated MCP submission cannot duplicate a reply. Local fault tests verify claim/restart behavior; they do not establish provider-side exactly-once turns.

Revocation/replacement fences pending and late writes at apply. An old CLI call may finish externally, but cannot reply with a stale attachment generation. Disconnect stops view observation; it is not evidence that an agent turn was cancelled. No automatic reply/receipt-triggered notification loops.

## Existing evidence and fresh acceptance

Playground's agent-native-markdown-editor bridge has source and recorded live results for thread resume, turn start, real scoped edits/comments, result capture and restart of the same thread. Its dedicated editor thread is not proof of attaching to this current chat, and its fallback-new-thread behavior must not be copied here. The retained PR Reviewer transfer used a queue to this existing receiver. Reuse these mechanisms and test the product adapter as implementation work; do not block all development on a standalone generic host probe.

Each supported host still requires actual product CLI notification → MCP read/reply → authoritative UI evidence before its acceptance. Tests must identify destination, command/event/invocation IDs and persisted reply. A fault may correctly remain unknown; that passes the truthful handling case, not proof of successful delivery.


## Definitive failure and retry policy

A spawn error before CLI execution, unverified Codex steering/Claude-owner route, or revoked attachment before dispatch is failed with a bounded reason. A nonzero exit, signal, timeout or thrown delivery error after durable claim remains unknown because external acceptance cannot be excluded. Exit zero is notified, not working/answered. Process restart changes in-flight notifying to unknown. All claimed events retain their invocation and attempt, including definitively failed ones; no automatic retry is implemented for either failed or unknown outcomes. The user sees attention/reconciliation information, and the original inbox remains queryable. A future explicit retry command needs its own policy; reconnect alone does not authorize relaunch.
