# Participant adapters for existing work

**Requirement:** Support Codex and Claude participants in existing project work

**Session rule:** The session initiating attachment is the attached session

**Status:** Bounded PR Reviewer CLI/MCP adapters and controlled-host tests exist; bounded original-owner Codex SDK reply/UI evidence exists; automatic native delivery/tool registration and full Codex/Claude acceptance remain open. Earlier Playground evidence is historical context.

## Start from the current session

Clone this project on the machine where the work happens. From the existing Codex or Claude session, connect to the local review operation surface and initiate attachment to a review. That originating session becomes THE attached conversation. The reviewer can then ask a question in the canvas and the same responsible session reads the context and replies through the shared MCP/domain contract.

The product must not require starting a new agent conversation, copying a transcript into another runtime or moving the work to a hosted model service. The user has clarified that session initiation defines the intended destination; selecting a brand-specific UI is not a prerequisite for this product flow. Actual session identity, connection capabilities and supported delivery routes still require verification.

This is local-first per clone. A copied repository does not imply synchronized SQLite state, artifact files, credentials or cross-machine conversation access. Resolve the local service/artifact location in the implementation slice; no new machine, network exposure or settings change is inferred by this design.

## One contract, two integrations

| Layer | Owns | Must not own |
|---|---|---|
| Codex participant adapter | Codex-origin attachment context and supported session delivery/query bridge | Review business policy or a second conversation owner |
| Claude participant adapter | Claude-origin attachment context and supported session delivery/query bridge | An implicit replacement session or unverified session identity |
| Shared MCP operation adapter | Authenticated bounded reads and durable command submission | Separate vendor-specific review actions or direct database writes |
| Participant delivery subsystem | Durable inbox, turn ordering, binding generation, invocation intent and reconciliation | Global participant locks held while a turn calls MCP |
| Review domain | Permissions, anchors, graph/resource revisions, comments and receipts | Host lifecycle or model-specific prompts as policy |

Codex and Claude are host integration choices, not participant permissions. Their actors use the same authorized domain commands. Independent jobs retain their own scoped identities. One conversation is responsible for a given attachment at a time; supporting two host types does not introduce collaborative multi-agent ownership. Replacing an attachment is an explicit durable command and advances generation; it never silently redirects existing replies.

## Attachment and capability handshake

1. The already-running session initiates attachment through its supported connection. It identifies the local project/review/snapshot and intended session. Server derives the actor from authenticated connection context.
2. Bind host type and version, actual host/owner instance, opaque session ID, project/working-directory identity and attachment generation. A caller-supplied ID is a routing claim until verified; a model repeating it is not identity evidence.
3. Use a supported authenticated host/connection handshake and scoped challenge/readback to corroborate that the initiating session can actually invoke the review tools. Record how that proof maps to the host's identity surface. If it cannot establish the required binding, attachment remains pending rather than inventing verification.
4. Negotiate tool access, event delivery, busy/idle observation, invocation deduplication/query, reconnect and outcome evidence independently. Record capability states as supported, unsupported or unverified for the exact host/version/session surface.
5. Commit the verified attachment through common ingress. Subsequent commands recheck actor authorization and generation at apply. Persist inbox/receipts before delivery attempts; preserve causation/correlation and stable invocationId distinct from commandId.

A supported MCP read is not evidence that an idle session can be woken. A queued delivery is not a started turn, and a completed turn is not a persisted reply. Unsupported push delivery may expose durable pending work for explicit reads; it does not pass automatic comment-to-conversation acceptance. Unknown invocation outcomes are reconciled or retained as unknown, never blindly resumed/launched again.

## Official integration candidates and limits

These sources were inspected on 2026-10-23. They identify candidate interfaces, not a successful attachment or cross-client ownership guarantee.

| Host | Documented candidate surface | Required local proof |
|---|---|---|
| Codex | MCP tools and app-server thread resume/read/turn operations. | Reuse the existing host owner for the originating session. Prove binding, actual MCP use, delivery and uncertain-invocation reconciliation. Do not launch another app-server to seize an active Desktop thread. Stored-thread continuation is not proof of safe attachment to a currently owned session. |
| Claude | MCP tools; Claude Code documents session-targeted resume and opt-in channel delivery. | Discover the initiating session's actual supported surface. A resumed process is not automatically the same live owner; a channel capability must actually be enabled and usable. Neither implies verified idempotent external delivery or permission to modify a running session's settings. Other Claude surfaces require their own capability evidence. |

Sources: [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Codex app-server](https://learn.chatgpt.com/docs/app-server), [Claude MCP and channel delivery](https://code.claude.com/docs/en/mcp#push-messages-with-channels), [Claude session continuation](https://code.claude.com/docs/en/headless#continue-conversations).

## Delivery and acceptance

Both adapters are required in the 480p round, rather than deferred as an additional host in 4K. Slice 01 has two independently testable host deliveries: **01-Codex** and **01-Claude**. Each implements the same bounded source → anchored question → originating session → MCP read/reply → authoritative UI answer journey on our own real PR. Either may be implemented first using the established CLI route and scoped integration checks; one passing adapter does not claim the other works. These are variants of the existing capability slice, not horizontal adapter scaffolds.

Use the [existing-session integration checks](../plans/480p/probes/00-host-contract.md) independently for each actual host. Capability evidence is keyed by host/version/surface and binding; a concrete incompatible route blocks that route, not independently ready domain/UI work or the other host. Both host deliveries and slice 02's continuation checks are required before claiming the full dual-host 480p outcome. Shared UI/domain tests can be reused; actual host-path acceptance cannot.

| Conformance check | Codex | Claude |
|---|---|---|
| Originating session initiates verified attach in its current project | Observed bounded local-owner metadata/provisioning; native tool-catalog registration unverified | Unrun |
| Real own-PR question reaches that exact session and MCP reply appears in UI | Actual UI Save/CLI enqueue acknowledgement, existing-owner live SDK MCP reply and UI evidence readback observed; automatic queued-turn delivery unobserved | Unrun |
| Commands progress during own turn; no self-deadlock | Existing-owner SDK MCP inbox/question/reply completed; automatic native-turn/catalog path unverified | Unrun |
| Duplicate/changed payload, wrong actor/session and stale generation handled correctly | Unrun | Unrun |
| Disconnect/restart and uncertain invocation reconcile without a second owner or blind replay | Unrun | Unrun |
| Existing work, permissions, configuration and session history preserved | Unrun | Unrun |

Record own-PR and candidate provenance, session/attachment identity, capability evidence and missing results per delivery. Do not store credentials or raw unrelated conversation history in docs. Later slices identify affected host regression checks; changed host paths require actual own-PR revalidation. Shared presentation improvements do not require duplicating every unit test, but support claims remain bounded to exercised integrations.

## Current capability and next evidence

The local candidate implements the shared contracts, controlled CLI notification and actual MCP protocol read/reply. A real own-PR operation also observed UI Save, native CLI enqueue acknowledgement, actual existing-owner live SDK MCP inbox/question/reply and authoritative UI answer/evidence readback. The owner answered after explicit steering; no automatic queued turn was observed, and native tool-catalog registration remains unverified. SDK protocol operations cannot be relabeled as native registered-tool invocation or proof that the CLI caused the reply. Codex owner pairing corroborates its exact existing metadata within the local-user trust boundary; Claude owner provisioning remains unavailable in the observed environment. Continue actual host-path verification independently; do not replace unknown native capability with fixture success. The runtime guide and contracts define current operation without requiring historical plans.


## Active Codex delivery and MCP subscription feasibility

**Decision date:** 2026-10-24

**Accepted direction:** Use existing-owner active-turn steering as specified in [delivery](review-loop/delivery.md). The original attached session remains the destination. Unconditional queue delivery is not active-turn steering.

**Observed host limit:** Codex CLI 0.164.0 generates `turn/steer` with required `expectedTurnId`, but the default `app-server proxy` did not answer bounded read-only initialization probes. No supported owner route or active-turn observation was established by those probes. No live message was submitted. Read-only `app-server daemon version` reported a running 0.163.0 daemon and CLI 0.164.0, but this does not map that daemon to the current Desktop owner. The existing queue adapter remains unchanged pending a verified replacement route. A schema is protocol evidence; a working authenticated owner connection and matching active-turn readback remain separate prerequisites.

**MCP feasibility:** The declared SDK 1.32.2 supports the 2025-11-25 protocol and `subscribeResource` / `unsubscribeResource`, corresponding to `resources/subscribe` and `resources/unsubscribe`. A server may advertise resource subscriptions and emit `notifications/resources/updated`. The current PR Reviewer server registers tools only; it does not register resources or subscription handlers. A bounded future seam could expose an authorized review-inbox resource and emit a change hint after the addressed inbox transaction commits. The client then reads the durable inbox and authoritative question/source, and submits a reply through the existing command/receipt boundary. The hint must not become authoritative payload or a second work queue.

The newer SDK v2 `listen(filter)` API uses `subscriptions/listen` under protocol 2026-07-28, resolves after an acknowledgement, and rejects on a 2025 protocol connection. It is not available merely because a current documentation page describes it. No SDK upgrade, new dependency, resource implementation or new wake service is adopted here. Sources: [SDK v1](https://ts.sdk.modelcontextprotocol.io/), [v2 subscriptions](https://ts.sdk.modelcontextprotocol.io/v2/clients/subscriptions.html), [v2 Client.listen](https://ts.sdk.modelcontextprotocol.io/v2/api/@modelcontextprotocol/client/client/client.html#listen).

Any future subscription belongs in the declared integration layer and managed subscription registry, scoped to authenticated attachment/review/generation with bounded state, teardown on disconnect/revoke, and independent diagnostics. Resource-change delivery does not prove that native Codex subscribes, wakes an idle conversation, starts a model turn, or exposes the native MCP tool catalog. Those host capabilities require independent negotiated and observed evidence. Explicit inbox reads remain available when hints are unsupported.
