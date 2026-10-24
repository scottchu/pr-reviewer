# Review continuation, graph bootstrap and source-import boundary

**Direction:** Accepted bounded implementation scope derived from the 2026-10-23 autonomous delivery request

**Implementation:** Graph bootstrap engineering checkpoint exists on the task branch; continuation/history remains planned. Slice acceptance and native/human gates remain open.

**Parents:** [Review loop](README.md), [architecture](../architecture.md)

## User outcomes

Reopen the same review, retain its original question and answer, inspect a newer pinned head explicitly, and ask a new question without moving old evidence. Use a small graph to orient within the prepared source and inspect the precise evidence behind its relationships. Subsequently enter a repository/worktree path to discover and import the corresponding GitHub PR or GitLab MR, preserving every changed-file disposition.

The first graph is intentionally limited to source structure. Full before/after one-hop callers/callees arrive in slice 04. No edge may imply more than its actual evidence. A graph-review account and a source-corrected account remain distinct under the [review protocol](../../rules/graph-first-review.md).

## Immutable snapshot history

A review has one stable identity tied to provider host/project/change identity. It retains immutable snapshots keyed by snapshotId; each records actual comparison base/head and content-hashed source manifest. Adding a snapshot never overwrites source, questions, replies, graph evidence or notification history. Different provider/project/change identity rejects as a different review, even if the branch or number matches.

The server exposes currentSnapshotId plus snapshot summaries. The existing single-snapshot query shape remains a compatibility projection: `snapshot` is the selected immutable snapshot, defaulting to currentSnapshotId. An explicit snapshotId query selects retained history; absent IDs return a typed missing-source result. All questions retain their original anchor; the UI filters/labels historical discussion visibly. Question reads and reply validation resolve the question's snapshot, not the current selection. An authorized late answer on an old snapshot is valid if its original attachment/generation and evidence remain valid.

`AddSnapshot` accepts an immutable verified manifest, command identity and expectedCurrentSnapshotId. Source acquisition/hash verification happens outside the dispatcher transaction; commit validates repository/change identity, records snapshot and atomically advances currentSnapshotId with a receipt. An identical existing snapshot is idempotent and does not silently rewind current selection. A different concurrent expected-current value rejects with a typed conflict and no partial mutation. The authoritative store never trusts only an external export file. Adding a snapshot produces no agent wake event.

Selecting history in the browser is private view state, not shared graph focus or a new domain command. Preserve selection/draft until an explicit choice; never carry an unresolved question submission onto a different snapshot. Follow-up uses a new anchored question with an optional immutable parentQuestionId in the same review; cross-snapshot follow-up states both identities rather than moving the parent's anchor. Existing command retries, receipts, cursor and unknown notification identity survive restart and source addition.

Migrate a pre-history aggregate by retaining its one snapshot and all original IDs, credentials, receipts, cursor and attempts. Migration is additive/idempotent and runs under the existing owner; a failed migration leaves recoverable original data. Test on copies before any owner-approved update of the active pilot. Never delete or reset the pilot database to make migration pass.

## Bootstrap graph

Expose a read-only graph projection through the review application's public query boundary. Stable node IDs derive from snapshot/side/path and optional exact hunk/span, never viewport positions. Nodes show before-left/after-right and change labels in text as well as color; each opens the immutable source view and preserves discussion identity. React Flow is the accepted renderer. Keyboard-accessible source/relationship controls and a textual relationship list offer the same evidence path.

Bootstrap edges are `comparison`, `contains` or `document_reference`, with an explicit label, source anchors and evidence method. Comparison links pair verified old/new paths (including rename metadata when available); containment references manifest/hunk ownership; document references need an actual link span and resolved target in the pinned repository objects. Missing, external or unavailable targets stay unresolved. Manually curated relationships are labeled as such, checked against pinned source and never presented as parser-produced call facts. Unsupported material remains an inspectable disposition. No source edge means not analyzed unless the relevant analyzer explicitly established a leaf.

The bootstrap may use a bounded owner-prepared multi-file manifest, built from verified Git objects without provider discovery, fetch or target execution. Include the complete changed-path inventory for its selected PR; show unsupported, missing or deliberately unprepared content with reason. Preparation is not general import and does not claim semantic coverage. Render an honest useful document graph for documentation PRs and file/hunk structure for code PRs. A graph incapable of explaining the selected task produces a review finding.

Read-only projection changes require no graph mutation protocol. Slice 04 later introduces annotations with a graph revision independent of unrelated discussion revisions, atomic CAS and source validation. Keep provenance-kind fields extensible without treating future semantic analysis as already delivered.

## Import boundary v1

The source-acquisition subsystem owns a pure validated import result; review-domain commands own admission. Import code must not open the review database or write UI state. Public inputs are a canonical local worktree path and an explicit resolved provider candidate when discovery is ambiguous. Public results carry provider kind (`github`/`gitlab`), host, source/target project, PR/MR number/URL/state, comparison base/head, content-derived snapshot identity, source entries and complete changed-file/hunk dispositions with unsupported reasons. Paths are repository-relative; provider credentials, remote URL credentials and host session metadata never enter the manifest.

Resolve path/branch/remotes through Git read-only commands and existing authenticated `gh`/`glab` or existing connector capabilities. Never interpolate repository values into shell programs; pass argument arrays. Do not silently install tools or assume a host. For forks, match both source project/branch and target project. Return explicit zero, one or multiple matches; show candidates and require an explicit selection when ambiguous. Detached/default branches without a unique association remain unresolved. Authentication/tool availability gates only the affected provider route. Never guess the latest PR/MR.

Use the provider's actual comparison baseline semantics, not a guessed branch tip. Verify available commit objects and object type; fetch only missing verified refs into task-owned source storage when authorized and supported, without switching or changing the user's checkout. Read blobs without executing hooks, submodules or source code. Enforce bounded file/byte/hunk budgets; retain a truthful oversized/binary/submodule/missing disposition rather than silently dropping coverage. Strict UTF-8/blob rules from slice 01 remain applicable to selectable text.

The importer may produce a validated result while history/graph work proceeds. Only the integration owner maps it to `AddSnapshot`/initial preparation through durable ingress after contract tests agree. Import itself becomes a durable bounded job in slice 03: accepted request, process launch and result admission are separate. A job cannot hold a database transaction while acquiring source. Stable invocation identity and uncertain-launch reconciliation apply from first use.

## Preserved authentication boundary

Passkey usability is a known issue deferred to the final follow-up after slices 01–08. Preserve existing login, credentials, stored reviews and exact-session pairing now. No authentication redesign or iCloud-plugin modification is a prerequisite for graph, history, import, story or evidence work. Deferral does not authorize disabling existing access controls.

## Bootstrap derivation contract (02A)

Manual preparation accepts the legacy single `path`, or explicit unique `paths` to prepare multiple changed paths. Multi-file preparation reads the complete `git diff --name-status --no-renames` inventory between the pinned commits. Each entry retains status, old/new path, per-side disposition and reason; unselected, absent, binary, non-text and over-budget material stays visible. Added/deleted files have only their existing side; they must never receive invented empty source objects. Legacy single-path preparation continues to reject unavailable selected blobs rather than silently changing its snapshot identity.

The source manifest may additionally retain bounded inline Markdown references. Each reference includes the literal link destination, exact link-line anchor, resolution method and either a validated same-side target anchor or an unresolved reason. Only a conservative subset of inline Markdown links outside fenced/inline/indented code is analyzed; reference-style/HTML links, container text and executable semantics are not analyzed. Relative destinations resolve from the source document directory in the pinned object, with URI decoding and repository containment checks. External URLs, missing paths/fragments, unavailable text and limits remain unresolved. Reading a referenced target is one-hop evidence acquisition, not recursive graph traversal. Prepared referenced files outside the changed inventory are labeled context. If a link prepares another changed side, its disposition becomes prepared with referenced-blob provenance. Identity includes the inventory and references as well as source hashes.

The public application query derives a read-only source graph from that manifest: file nodes, contiguous changed-span nodes, comparison edges for verified pairs, containment edges and document-reference edges. Every node has exact source anchors or a visible unavailable disposition. Every edge carries evidence kind/method and source anchors. Stable IDs derive from snapshot/side/path/span. The graph carries `not analyzed` for callers/callees and unsupported Markdown forms, never a semantic leaf assertion. Comparison work is bounded; over-budget line analysis remains an explicit unknown while complete prepared source stays inspectable.

React renders a file overview before-left/after-right with a selected-file change-span expansion to avoid shrinking the whole graph into unreadable text. The same graph has a keyboard-accessible node and relationship evidence list. Opening source updates explicit path/span selection, preserves question identity and offers return to graph. Missing sides show an absence disposition. Selection across files does not silently move a nonempty draft: the reviewer must clear/save it before choosing a new source. No graph action schedules a notification.


## Current structure reflection

**Observation:** The bounded implementation has a pure source/anchor domain, one transactional store, an authenticated gateway, a public React application bridge and a managed integration registry. Source acquisition remains an external immutable input. This is sufficient for the current product and keeps browser rendering from scheduling external work.

**Best rebuild design now:** Retain those responsibility boundaries and a single authoritative database owner. Derive the source graph from immutable source facts at the application query boundary, keep viewport/expansion private, and keep the graph renderer ignorant of delivery policy. An independent graph store would create duplicate identity and mutation machinery for a read-only projection; a semantic parser abstraction would falsely expand this bootstrap's analyzed scope. Neither is justified now. Before adding history, retain snapshots explicitly rather than overloading the displayed source selection as mutable review identity.

**Verified limits:** Current graph nodes use bounded source-heading/change excerpts rather than authored explanation. File relationships show structural evidence and do not establish why the change exists. A fresh reviewer must judge whether that orientation actually reduces assembly work; screenshots and click tests cannot establish it. The whole-product docs-only audit and independent engineering review remain separate acceptance gates.

## Review-driven bootstrap corrections

**Accepted correction:** A Markdown fence retains its opening marker and length; only a closing fence of the same marker with at least that length ends it. Inline code, indented code and fenced examples are outside analyzed document-reference text. Graph projection checks the same parsed provenance, so a plausible anchor inside code cannot become an edge.

A prepared side of a modified/type-changed file whose comparison side is unavailable is `not analyzed`, never all-added/all-removed. Those labels are valid only for an inventory-proven addition/deletion or an actual bounded comparison. Such a file has no inferred changed-span nodes. The source remains inspectable with an explicit comparison limitation.

Preparation retains its validated owner input atomically with the authoritative database preparation, allowing database-only recovery after either export fails. For earlier multi-file aggregates without that setup record, recover the original explicit selection from prepared-side provenance; referenced context must not become the selected input. Regenerate the same snapshot before restoring exports. Preserve discussion/receipts and reject conflicting inputs rather than resetting state.

The initial fit-all graph was observed unreadable on the forty-path implementation PR. Replace that layout with a complete scrollable changed-file index and a focused before/after file pair. Graph focus is private view state independent of source selection/drafts; choosing an index row does not retarget a question. Optional source-context expansion includes bounded directly related nodes, labels omitted visual neighbors, and retains the full evidence list. Scope is complete through the inventory; a focused view does not assert that other files are irrelevant. Source-open and return preserve focus and immutable source identity. This correction improves legibility without claiming semantic grouping or authored story narration.


Read-only Git preparation must disable automatic lazy fetch and replacement objects at both process environment and command level, use no system/global configuration, prompts, optional locks, hooks or filesystem monitors, and retain bounded time/output. A missing promisor object is unavailable evidence; it may never invoke a repository-configured fetch/upload-pack helper. Changed inventory is literal, rename-disabled and independent of relative/order/submodule-ignore settings; no external diff/text conversion runs. This repairs an actual reproduced helper-execution gap, not a permission to fetch missing source.

URL path and fragment syntax is separated before percent-decoding each component. An encoded `%23` identifies a literal `#` in a Git blob path; only a literal URL `#` introduces a fragment. Preparation and graph provenance validation use the same resolver and exact target/heading check.
