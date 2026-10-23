# One anchored question and reply

**Direction:** Accepted first 480p product behavior

**Implementation:** Local test candidate implemented; controlled-host React/MCP journey tested; native-host and human acceptance pending

**Architecture:** [Subsystem responsibilities](../architecture.md)

## User story and boundaries

As a reviewer, I open one pinned before/after source change in our own real PR, select a source span, ask its responsible agent a question, and inspect the agent's persisted source-backed answer. I can distinguish the source, author, delivery state and uncertainty behind that answer. The existing Codex or Claude session initiating attachment is the responsible session; the app does not replace it.

The first task uses [PR 14](../../plans/480p/slices/01-review-loop/bootstrap-task.md), including its actual base/head and historical source path. Its documentation claim is a valid first bounded source question, not evidence of executable code behavior. Source is manually prepared from immutable Git objects; general import, semantic graphs, repository jobs, player/narration and new-head continuation are later slices.

## Interaction

1. Open the local app and the prepared review. Show PR identity, comparison base/head, both source sides and labeled additions/removals/modifications. Missing baseline context is visible, not invented.
2. Attach from the already-running responsible session using the app's MCP operation surface. The local connection and one-use pairing challenge establish the actor/session binding; a browser cannot assign an arbitrary actor by submitting a string. Confirm the attached session before delivery.
3. Select a nonempty exact source span. The composer states its side/path/line span and snapshot; editing or changing selection does not silently move an already-saved question.
4. Submit once. Persist the question before attempting CLI delivery. Show saved, delivery-pending, notified, working, answered or delivery-unknown using distinct labels; do not claim the agent started solely because CLI exited successfully.
5. The agent receives a CLI notification, reads the review through MCP and submits its reply through MCP. The app renders the authoritative persisted reply and evidence links. Agent stdout and transcripts are diagnostics, not replies to paste into the UI.
6. Open a reply's source link at its immutable side/path/span. Restart preserves accepted questions/replies and pending work. Full reopen/follow-up and switching to a new head are slice 02.

## Public interfaces and ownership

[Contracts](contracts.md) define IDs, data, commands, MCP and error semantics. [Delivery](delivery.md) defines CLI notification and recovery. [Local runtime](runtime.md) defines operational setup and evidence limits. [Presentation](presentation.md) defines React UI and design-guideline conformance. UI owns local selection and draft; domain owns validation and durable review state; command processing owns atomic receipts/events; delivery owns CLI effects; the MCP adapter validates credentials and delegates domain operations. Managed integration routes own subscriptions and teardown. No adapter writes around ingress.

## Observable acceptance

A saved anchored question produces one correctly attributed persisted answer from the exact attached session via MCP, visible through the app read model. Identical command retries do not duplicate state; altered payload reuse, invalid anchors and stale/revoked attachment generations reject without partial writes. Agent MCP calls progress during its own turn. Unknown notification outcomes never trigger blind redispatch. Tests cover these behaviors plus keyboard interaction, React controls following the design guidelines and principles and own-PR use. An unfamiliar-reviewer evaluation remains separate evidence; no engineering result is labeled human comprehension.

The [slice plan](../../plans/480p/slices/01-review-loop/plan.md) sequences delivery and records 01-A through 01-G results. Its checklist is not a substitute for this maintained product specification. Learning and detailed interface changes return here before slice acceptance.
