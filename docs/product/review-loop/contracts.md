# Review-loop contracts

**Parent:** [Question/reply behavior](README.md)

**Status:** Derived local implementation and controlled-host tests exist; native binding and acceptance limits are explicit below

## Identities and persisted records

Use opaque application IDs, UUIDs where generated locally. Caller-supplied actor/session values never establish authorization. UTC timestamps describe observations, not ordering; revisions/cursors order committed state.

| Record | Required fields and invariants |
|---|---|
| Snapshot | snapshotId, repository identity, real PR URL/number, actual baseSha/headSha, source manifest with path, side (base/head), UTF-8 content hash, line count and prepared content. Pin source before question creation; retained content is immutable. Reject unsupported/binary selections explicitly. |
| Anchor | snapshotId, side, path, startLine/endLine (one-based inclusive). Nonempty bounded range in the selected source object; no mutable graph or viewport coordinates. |
| Pairing challenge | challengeId, reviewId, expected host/session destination and authorized local user, expiry (five minutes), challenge hash, pending/consumed state and expected credential/connection binding. Single-use; no review source access from bootstrap credentials. |
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

## Attachment bootstrap

The authenticated local app user creates a one-use pairing challenge for a review and intended host/session destination. Bootstrap access is narrowly scoped to session_attach only and reaches the initiating session through its supported MCP registration/launch setup; it grants no question, inbox, reply or general app access. Do not write bootstrap/attachment tokens into chat, source files, screenshots or CLI notification arguments.

session_attach receives challengeId/proof plus the session's routing claim. The server separately corroborates the exact session against trusted native MCP-client/launch context and the existing owner's metadata; MCP transport session ID is not assumed to equal the agent thread ID. A model argument, environment string provided by the model, thread-name match or challenge possession alone cannot establish the destination. Unsupported corroboration leaves attachment pending with the precise missing proof; the adapter may not silently create/resume a substitute owner.

Validate expiry, authorized review/user, expected host/session, exact expected connectionId and the corroborated connection. In one short command transaction, consume the challenge once, create the attachment/generation, bind a newly generated attachment capability and record its receipt. Concurrent/replayed consumes cannot create a second binding. Wrong-session attempts reject and never gain review access.

Provision the attachment capability to the trusted MCP connection/server session, not as model-visible tool text. The stdio adapter retains it in process memory; reconnect uses a restrictive local credential reference (mode 0600) or repeats authorized pairing, and the app stores its verifier. Activate normal tools only for that binding. Revocation invalidates credentials and advances generation. Tests include challenge expiry/replay, concurrent consume, wrong session, bootstrap denial of read/reply, reconnect and revoked capabilities.

## MCP surface: agent to app

Use a supported local MCP transport with attachment-scoped credentials: stdio is the initial transport; any HTTP bridge remains loopback with explicit authentication. A separate stdio process forwards to the same app-owned gateway/database owner, not its own competing review store.

- session_attach (bootstrap only): challenge proof plus routing claim → pending or verified attachment metadata; credential provisioning stays out of model-visible output.
- review_get: reviewId → scoped source manifest and review state.
- question_get: questionId → exact question, before/after source and evidence limits.
- inbox_read: cursor/limit → eligible requests for this authenticated attachment.
- reply_submit: commandId, questionId, generation, body, evidence and limitations → authoritative command receipt.

No MCP tool accepts trusted actorId/sessionId from model arguments. Schema validation, authorization and generation checks precede mutation. The server may expose its app-issued attachment identity through a read-only self/context result. A CLI message carries notification invocationId plus event/question IDs and instructions to use these tools; source text and bearer credentials are not command-line prompt content.

## Managed integration routes

Declare only review-committed → authorized view-store snapshots, addressed-question-committed → delivery scheduler, and attachment-revoked → route teardown/fencing. Register route ID, review/attachment scope, owner, cursor and teardown in one registry. UI uses the view-store bridge; neither components nor business modules subscribe to another subsystem's internals. Slow view updates may coalesce; accepted questions/inbox items never drop. Remounting/subscribing must not create another CLI notification.

## Local transport and process boundaries

The Node app owns the SQLite connection and command dispatcher. Bind HTTP to 127.0.0.1 only. Use POST /api/commands for authorized domain writes, GET /api/reviews/:id and /api/questions/:id for scoped queries, and GET /api/inbox with cursor/limit for an attached participant. Local UI authentication and MCP attachment capabilities have separate scopes. The stdio MCP process forwards to that same loopback gateway with its scoped credential; it never opens a competing writable database.

Start/stop instructions create task-local state and a restrictive runtime manifest containing app/gateway addresses and credential file references. No production network exposure, global MCP settings overwrite or shared user database is required. Source preparation only reads pinned Git objects. Retain user content and unknown attempts until explicitly reconciled; shutdown removes listeners and closes owned processes, not unrelated sessions.

## Derived local implementation decisions

**Status:** Implementation in progress; native-host acceptance remains separate

The bounded implementation uses one SQLite-owned JSON aggregate per review plus normalized receipts and credentials. All aggregate, revision, inbox and notification mutations share a synchronous `BEGIN IMMEDIATE` transaction; the transaction returns before external delivery. This keeps atomic recovery simple without introducing a second writer or event projection. Queries read authoritative aggregates and report `projection_pending` for a requested revision greater than the committed revision.

The gateway issues a local-user bearer credential to a mode-0600 file. The Vite origin exchanges that credential through an explicit login field; no credential is built into source or notification arguments. Native MCP connection evidence is provisioned separately by the authenticated owner: a host/session/connection tuple, native owner metadata corroboration and a restrictive launch credential reference. This is a transport binding, not proof inferred from a model's routing claim. Until trusted native launch evidence is provided, attachment remains pending. Tests provision controlled trusted launch evidence and are explicitly not native-host acceptance.

MCP stdio launches with a bootstrap credential reference, connects to the loopback gateway, and retains the resulting attachment capability in process memory. A reconnect can repeat pairing; no attachment token is included in tool results. User revocation advances generation and invalidates existing capabilities. The server checks host/session/connection against the registered launch binding, independently of tool arguments.

The UI uses authenticated bounded polling through its application bridge and a managed route registry. Polling coalesces view snapshots only; delivery is scheduled from committed inbox state at the gateway, independently of React lifetimes. Source files are retrieved from pinned Git objects during local preparation, SHA-256 hashed, persisted in the aggregate and exported to restrictive task-local snapshot files. This is manual preparation, not general PR import.

**Runtime correction:** The bundled Node 24 executable enforces native-addon library validation and rejected Vite 8's Rolldown binding. The gateway and SQLite remain under Node 24. The owned supervisor starts Vite 8 under the already-installed Bun runtime as a separate child and verifies both listeners before publishing runtime readiness. No signature, security or global setting is changed. Shutdown closes the gateway and only that owned UI child. The existing Vite requirements support this Node generation; the observed issue is its signed host's addon loading policy, not package absence.

**Source presentation:** A pure domain longest-common-subsequence comparison assigns exact line identities, including repeated lines. Contiguous replacement blocks are labeled modified on both sides; pure removals/additions retain their own labels. The application builds this presentation model; React only displays the statuses. This bounded prepared-document comparator rejects oversized comparisons rather than introducing a general importer/diff engine.

**Native binding provenance:** Codex owner setup reads only `session_meta` from the supplied existing rollout, verifies its exact ID against the owner process's native `CODEX_THREAD_ID`, and checks explicit `REVIEW_SESSION_CWD`. The attached session's cwd may be the primary repository while app code runs in its isolated worktree. Owner setup, its native context and restrictive launch reference are trusted within the same OS-user boundary; this is not remote attestation. The MCP child need not inherit native thread variables. The owner must register/provision the generated launch capability to that exact existing session's transport. Claude cannot receive this Codex proof; its trusted setup remains unrun in the absent Claude environment.
