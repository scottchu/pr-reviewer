# High-level design

**Status:** Accepted direction, documented for further refinement

**Implementation:** Not started in this repository

## From vision to system

The [product vision](vision.md) calls for a connected understanding of changed behavior, with inspectable evidence and room for questions. The system brings source facts, agent interpretation and execution evidence into one review while keeping their identities and limits distinct.

The reviewer can enter at a behavior or a source detail, follow relationships and return without losing context. A compact context rail separates Epic/Ticket/PR source material from agent understanding, with provenance, freshness and explicit missing information. Behavioral groups account for the whole PR, including supporting configuration, documentation and tests.

Within a group, before-left and after-right source nodes expose colored changes alongside unchanged context, source-anchored explanations and related tests. Red means removal, green addition and yellow modification, with labels beyond color. There is no before/after mode toggle. One-hop callers and callees include unchanged dependencies and both source sides; unresolved relationships remain distinct from confirmed leaves.

The graph leads the explanation. Plain-English narration explains the already-highlighted behavior with a brief why, what/how and concrete example. Semantic zoom and manual expansion reveal detail without changing identity or losing selection. There is no API/Helpers orientation selector.

Preserve the slim, draggable bottom-center player: drag, previous, replay/pause, next and step count/chapter selection in one row. Mobile Flow/Diff shares the story cursor, reading pause and exploration/resume state. Icons serve operations with accessible names/tooltips; text carries review information. These are experience constraints for progressive delivery, not claims about an existing app.

## Technology direction

**Frontend:** React 19

**Canvas:** React Flow

**Frontend tooling:** Vite

**UI foundations:** decompozr/design-system

**Backend runtime:** Node.js

**Backend language:** TypeScript

**Durable data:** SQLite

**Evidence storage:** Referenced source snapshots, patches and execution artifact files

These choices retain the earlier agreed direction. No dependencies or application scaffold are introduced by this document.

## System diagram

```mermaid
flowchart TB
  User[User participant] --> UI[React UI / React Flow]
  Agent[Agent participant] --> MCP[MCP adapter]
  CLI[CLI] --> Gateway[Authenticated gateway]
  UI --> Gateway
  MCP --> Gateway
  Gateway -->|Authorized queries| Read[Read model]
  Gateway -->|Domain commands| Queue[Durable command ingress]
  Queue --> Dispatcher[Dispatcher / short transactions]
  Dispatcher -->|Atomic commit| DB[(SQLite: state / receipts / events / outbox / jobs)]
  DB --> Read
  Read -->|Committed updates| UI
  Read -->|Query results| Gateway
  DB -->|Durable jobs| Workers[Independent analysis / test workers]
  Workers --> Artifacts[Isolated worktrees / evidence files]
  Workers -->|Authenticated result commands| Queue
  DB -->|Eligible addressed events| Inbox[Durable participant inbox]
  Inbox --> Scheduler[Turn scheduler / host adapter]
  Scheduler -->|Verified binding / invocationId| Conversation[Exact attached conversation]
  Conversation -->|Executes a turn| Agent
```

## Subsystem boundaries

| Subsystem | Owns | Boundary |
|---|---|---|
| Review presentation | Canvas, context rail, story controls, exploration and private viewport | Renders read models and submits intent. Business rules remain outside UI components. |
| Review domain | Snapshots, coverage, groups, anchors, annotations, comments and shared focus | Validates domain commands through explicit interfaces, independent of transport and renderer. |
| Command processing | Durable ingress, receipts, deduplication and short atomic dispatch | UI, MCP, CLI and worker results use the same write path; jobs execute elsewhere. |
| Source analysis | Pinned source facts, diff coverage and candidate relationships | Returns evidence-backed results; cannot declare agent interpretation as parsed fact. |
| Execution and evidence | Configured test targets, durable jobs, process outcomes and artifacts | Returns result commands; cannot equate request acceptance with a passing test. |
| Participant delivery | Attachments, durable inbox and conversation-turn scheduling | A host adapter proves actual conversation delivery and reconciles uncertain wakeups. |
| Persistence adapters | Transactions, projections and artifact storage | Expose contracts to the responsible subsystem; no UI, agent or worker writes around domain ingress. |

These are logical boundaries, not a requirement for separate services. A subsystem exposes a narrow public interface; consumers do not reach into its internals. Domain policy is tested independently of UI and transport adapters.

## Commands, jobs and conversation turns

User and agent are authenticated participants using the same permitted actions through different entry points. Server-derived identity determines the actor; a supplied participant or conversation string is not proof of identity. Workers use scoped execution identities.

Every domain write uses durable command ingress: comments, replies, graph edits, shared focus, test requests, cancellation, attachment/inbox changes and internal results. Authorized reads go directly through the read model. Local hover and viewport stay private.

The dispatcher atomically commits domain state, a command receipt, events/outbox and any job creation. Transactions end before network calls, process execution or agent turns. Queue ordering follows consistency boundaries; it is not a global serial worker. Long jobs do not block comments.

Serialize conversation turns only. An agent awaiting MCP or a job must not hold a participant-wide command lock or domain transaction needed to satisfy its own request.

A successful test-request command means a job exists. Job launch, execution and terminal outcome require separate evidence. Cancellation records intent; cancelled requires confirmed termination. Missing launch or exit evidence remains unknown. External launches and wakeups use stable invocationId distinct from commandId, with host deduplication/query/reconciliation. Outbox replay does not guarantee exactly-once external effects. Unknown launch outcomes cannot be blindly retried; reuse of commandId with changed payload is rejected.

Attachments bind a verified host/conversation, generation and capabilities. Authorization and generation are rechecked when queued writes apply. Stale agent writes are rejected; independently authorized older jobs may retain correctly attributed historical results. A turn, a job and a participant have separate identities.

Wakeups come from addressed user requests or subscribed terminal job events. Own replies, ordinary graph changes and delivery receipts do not wake the agent again. Durable inbox items, cursors, consumption records and causal links survive restart. Coalescing wakeups retains every event. Saved, delivered, turn started, completed and answered remain distinct; unsupported wakeup is visibly pending/degraded.

Concurrency is action-specific: comments validate snapshot/anchor, resource edits use their own revision, and atomic graph patches use graph CAS. Unrelated comments do not invalidate graph edits. Receipts expose resulting revisions/cursors so queries provide read-your-writes or explicit projection-pending state.

## Source and evidence boundaries

Pin the PR head and the actual comparison baseline. Prepare an isolated head worktree and read-only baseline view; use a baseline execution worktree only for an actual comparison run. Resolve callers/callees from both sides, including removed callers and unchanged dependencies. Missing source and binary patches stay explicit. Import does not execute installation hooks.

Source anchors identify snapshot, side, path and span independently of graph layout. A new head creates a new snapshot; old comments/results remain historical. Coverage counts primary changed hunks once even when groups share context.

Keep parsed facts, agent interpretation and execution evidence separate. Role, mock/stub technique and reasoned risk are independent dimensions. Helpers are not inherently low-risk; request/response adapter describes repetitive mapping more precisely than assuming generated code. Human corrections survive enrichment.

Test source changes, relevance and execution results are different claims. Results identify actual worktree content/dirty state, environment, configured command, exit outcome and artifacts; a head SHA alone does not describe modified files. Base/head comparisons preserve separate results and environment differences.

## Delivery and validation

Follow the [progressive roadmap](plans/roadmap.md), beginning with one real review loop. All code is tested, preferably through TDD. End-to-end checks exercise the real user journey and actual design-system integration; fixtures do not establish native host delivery, physical-device behavior or comprehension.

The first material unknown is the exact external conversation host: authenticated attachment, supported MCP transport, wakeup, deduplication and outcome-query capabilities must be proven. The first supported source language and configured repository test runner also need explicit selection. The earlier Playground prototype is a reference, not a running implementation in this repository.

Hosted agent runtime, Decisions integration, generalized multi-agent ownership, remote workers and automatic external PR posting are deferred. This document defines a design-only endpoint; it does not authorize runtime implementation, installation or deployment.
