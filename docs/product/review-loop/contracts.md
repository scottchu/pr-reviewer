# Review-loop contracts

**Parent:** [Question/reply behavior](README.md)

**Status:** First-slice design; derived schemas and implementation remain to be built

## Identities and persisted records

Use opaque application IDs, UUIDs where generated locally. Caller-supplied actor/session values never establish authorization. UTC timestamps describe observations, not ordering; revisions/cursors order committed state.

| Record | Required fields and invariants |
|---|---|
| Snapshot | snapshotId, repository identity, real PR URL/number, actual baseSha/headSha, source manifest with path, side (base/head), UTF-8 content hash, line count and prepared content. Pin source before question creation; retained content is immutable. Reject unsupported/binary selections explicitly. |
| Anchor | snapshotId, side, path, startLine/endLine (one-based inclusive). Nonempty bounded range in the selected source object; no mutable graph or viewport coordinates. |
| Attachment | attachmentId, reviewId, server-derived actorId, host (codex/claude), exact sessionId and local owner/connection identity, generation, capabilities and active/revoked state. Session ID comes from the initiating session and authenticated pairing, not arbitrary browser attribution. Replacement advances generation. |
| Question | questionId, reviewId, immutable anchor, trimmed nonempty text (at most 16 KiB UTF-8), user actorId, created revision/time. Persist before notification. |
| Reply | replyId, questionId, snapshotId, agent actorId, attachmentId/generation, nonempty body (at most 64 KiB UTF-8), source evidence anchors and explicitly stated limitations, created revision/time. Evidence references the pinned snapshot; wrong-side/path/span rejects. |
| Command receipt | commandId, actorId, canonical payload fingerprint, state (applied/rejected), resulting revision/event cursor and result IDs or typed rejection. Same ID/actor/payload returns the same receipt; changed payload rejects. |
| Addressed inbox item | eventId, questionId, attachmentId/generation, cursor, eligible recipient and consumption/read state. Own replies and receipts do not create wake events. Reading does not delete the question or the notification journal. |
| Notification attempt | invocationId distinct from commandId, addressed event IDs, destination attachment/generation, requested/notifying/notified/unknown/failed outcome and bounded diagnostic reason. Persist intent before CLI spawn; unknown retains the original identity. |

SQLite holds these logical records and revision counters, with foreign keys and unique command/event/invocation IDs. Use a short transaction for state, receipt, domain event and inbox/outbox changes. No transaction spans CLI, agent or MCP work. Snapshot files are stored beneath the task-local data root, hashed before import and never executed. Credentials remain in restrictive local runtime storage, outside Git and replies.

## Command and query surface

The authenticated gateway derives actor and attachment from the connection. All writes return receipts; queries support minimumRevision/event cursor, returning projection_pending rather than claiming stale data is current.

| Operation | Input / result |
|---|---|
| PrepareReview (bounded local setup) | Verified snapshot manifest and immutable Git content → reviewId/snapshotId and receipt. No install hooks, general remote import or repository execution. |
| AttachSession | One-use pairing challenge plus supported initiating session context → verified attachmentId/generation; unverified claims remain pending. A local user explicitly chooses the review and grants that session access. |
| AskQuestion | commandId, reviewId, anchor, text → questionId, eventId, revision/cursor. Validate current permission/source at apply. |
| SubmitReply | commandId, questionId, attachment generation, body, evidence, limitations → replyId and revision/cursor. Recheck active authorization/generation in the transaction. |
| RevokeAttachment | commandId and attachmentId → advanced generation/revoked state. Fence late delivery and stream emissions. |
| GetReview / GetQuestion | Scoped IDs and optional minimumRevision → immutable source, relevant discussion/attachment and truthful delivery/read-model state. |
| ReadInbox | Attachment-scoped cursor and bounded limit (default 20, maximum 100) → addressed question references and next cursor; preserve all eligible items under coalesced notifications. |

Canonical fingerprints use normalized validated payloads with deterministic field ordering. The same commandId cannot be reused across actors; changed-payload ID reuse returns command_conflict. Domain validation failures return durable rejected receipts where identity/request are valid. Unauthenticated or malformed envelopes reject before domain dispatch.

Errors are typed: invalid_request, unauthorized, stale_attachment, invalid_anchor, source_unavailable, command_conflict, projection_pending and delivery_unknown. They do not echo tokens or unrestricted conversation history. Unknown external effects are retained and reconciled, not relabeled failed merely on timeout.

## MCP surface: agent to app

Use a supported local MCP transport with attachment-scoped credentials: stdio is the initial transport; any HTTP bridge remains loopback with explicit authentication. A separate stdio process forwards to the same app-owned gateway/database owner, not its own competing review store.

- review_get: reviewId → scoped source manifest and review state.
- question_get: questionId → exact question, before/after source and evidence limits.
- inbox_read: cursor/limit → eligible requests for this authenticated attachment.
- reply_submit: commandId, questionId, generation, body, evidence and limitations → authoritative command receipt.

No MCP tool accepts trusted actorId/sessionId from model arguments. Schema validation, authorization and generation checks precede mutation. The server may expose its app-issued attachment identity through a read-only self/context result. A CLI message carries only IDs and instructions to use these tools; source text and bearer credentials are not command-line prompt content.

## Managed integration routes

Declare only review-committed → authorized view-store snapshots, addressed-question-committed → delivery scheduler, and attachment-revoked → route teardown/fencing. Register route ID, review/attachment scope, owner, cursor and teardown in one registry. UI uses the view-store bridge; neither components nor business modules subscribe to another subsystem's internals. Slow view updates may coalesce; accepted questions/inbox items never drop. Remounting/subscribing must not create another CLI notification.
