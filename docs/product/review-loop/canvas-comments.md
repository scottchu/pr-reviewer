# Anchored comments in the canvas

> Current-entry precedence (2026-10-29): [design status](design-status.md) distinguishes the delivered minimum graph from this wider canvas proposal. Retain its source/evidence, anchor, draft and return requirements; older panel defaults are not current-entry implementation instructions. Historical status/evidence below is preserved.

Current composition follows [canvas panels](canvas-panels.md): floating markers remain anchor-adjacent; full thread and composer slide up from the bottom. Earlier inline-thread geometry is superseded. Selection, detail target and draft anchor remain independent.

**Decision date:** 2026-10-24

**Direction:** Accepted: selecting review prose or code offers a contextual comment, with floating anchor-adjacent human/agent markers and a thread/reply view

**Delivery status:** Interaction design; source-comment backend support is bounded by current contracts, and arbitrary prose-selection persistence is not implemented or implied

**Parents:** [Canvas reading](canvas-reading.md), [question/reply contracts](contracts.md), [story and exploration](story-and-exploration.md), [participant identity](../participant-adapters.md)

## Select, comment, inspect and reply

A reviewer selects text in review code or prose and receives a small Comment action beside that selection. Activation captures the selected content identity and opens a contextual draft with the quotation and its source/version visible. Selecting text alone does not submit, wake an agent or replace another draft. Preserve the selection while moving focus into the composer; provide an explicit replace/keep choice if another unresolved draft would be affected.

After a thread exists, a compact floating comment marker sits beside its anchored line/span or prose block. It stays attached to that content as the canvas pans, zooms or changes lens. Opening the marker reveals its contextual thread and reply composer in the bottom slide-up discussion panel, with the original quotation highlighted in the graph and an exact anchor summary plus return/close action in the panel. The reading destination remains the graph, not a separate discussion page. Replying stays in the thread; creating a comment on a different selection creates a distinct anchor rather than silently moving the thread.

All review-owned selectable prose and code are eligible interaction targets: source/diff, explanation claims, captured context and discussion text. Navigation labels and controls are not review content. A target without a durable supported anchor may still be demonstrated in an explicitly labeled mock state, but production must expose the limitation rather than pretend that the comment was saved.

## Stable anchoring: source and prose differ

| Content | Identity and selection requirement | Existing support boundary |
|---|---|---|
| Pinned source/diff code | Use the retained snapshot, side, path and valid source range; semantic context also retains its corpus/content hash and native coordinate semantics. A partial-character selection may be highlighted privately, but a line-based persisted anchor must be labeled as covering those lines. | Reuse current supported question anchors, validation and immutable source; semantic-only context cannot be converted into a fabricated legacy snapshot anchor. New precision requires a separate documented backend contract. |
| Review prose | Stable owning content ID and immutable version/content hash plus exact selection in its retained canonical plain text; include quoted text for inspection, not as the identity. Captured context, story claim and discussion body retain their own owning identities. | Arbitrary selected-prose comments are a new design requirement, not an implemented extension of AskQuestion. Preview-only until versioned command/storage/auth/readback contracts and tests are approved and implemented. |

For the interactive mockup, use immutable prose strings with stable content IDs/version IDs, content hashes and zero-based start-inclusive/end-exclusive UTF-16 offsets into those exact strings. Do not count DOM markup, visual line wraps or trimmed/reformatted text. Validate the quote and code-point boundaries; repeated identical quotes at different offsets remain distinct. A selection spanning multiple content blocks is an ordered set of ranges, each with its own identity, rather than an invented combined source span. This is a precise preview representation, not a newly shipped persistence schema.

A prose revision creates new content identity/version evidence. Keep the old thread attached to its retained version, labeled historical, with an explicit open-original action. Do not fuzzy-match a quote and silently re-anchor it to current text. Missing/corrupt original content shows unavailable context. The same principle applies to new source snapshots: screen position and nearest matching line are never authority.

Zoom, lens, layout reflow and source-node scrolling affect only where a marker is drawn. The underlying anchor, thread, draft and author never change. When the anchor is collapsed, show a counted group marker that opens/focuses the exact original span. When it is outside the viewport, provide an accessible locate action; do not imply the marker belongs to whichever node happens to be visible. Restore the previous viewport/story/draft frame when returning.

## Human and agent identity

Each thread marker identifies its initiating author using an avatar/initial or icon plus an accessible name and explicit human/agent kind. Show message authors individually inside the thread, including display name and role/kind; a mixed conversation must not be represented as if all messages came from its latest participant. The current reply identity is visible beside the composer. Initial-author identity and aggregate thread count are different information.

Names, icons and colors are presentation; the server derives actual actors from the existing authorized local-user or attached-agent context. The UI cannot choose an actor by changing a label. Agent messages retain attachment/generation and source attribution. Showing an agent marker does not prove a session is attached, notified, working or answered; those existing delivery states remain separate. In the mockup, sample participants and replies are explicitly fictional preview records, not real user statements, native delivery or persisted domain results.

## Density, placement and input

Reserve a small marker lane beside source/prose content. Keep the selection action and markers beside their anchors without covering selected text, code line numbers, graph ports, essential edges or controls. Thread bodies/composers belong in the bottom panel, not docked inside a source group; retain a truthful anchor summary and Reveal origin there. Panning and text selection must not fight over the same gesture.

Cluster overlapping inactive markers by visible block/group when zoomed out. Counts represent threads in that current view/filter, not message counts or invented unread status. Expanding a cluster lists its threads with author and source/version; selecting one reveals its exact anchor. Mixed human/agent clusters show mixed participants rather than choosing an arbitrary identity. Opening one thread may collapse another panel but cannot discard its draft. Do not open a wall of overlapping bubbles by default.

Provide keyboard focus for markers and a named Comment on selection command, a keyboard-selectable source-range alternative, and focus restoration to the originating marker/selection after close. Touch selection retains native handles and offers an explicit action without requiring hover. Controls use the accepted coarse-pointer target size, visible focus and non-color labels. On narrow layouts discussion opens from the bottom as the foreground reader, preserving other reader targets behind named cues; dismissal preserves text and anchor. It never becomes a below-source application page. Marker geometry cannot be the only way to discover discussions: a scoped accessible thread list focuses the same anchored records.

## Public boundaries and persistence honesty

Presentation consumes content/anchor/thread/actor/status read models and emits explicit selection, open-thread, comment and reply intent through the application boundary. The application owns drafts, return frames and permitted command selection. Domain/participant boundaries own authorization, identity, revision and durable outcome; managed integration routes own subscriptions and teardown. Do not add direct database access, per-marker streams or notification side effects to React rendering.

Existing code-backed questions continue through durable ingress, CLI notification and MCP replies with their current correlation, deduplication, generation and unknown-effect rules. A general prose thread/reply model may require new public domain and persistence contracts. That is separate future work: this design does not reinterpret existing question/reply payloads or receipts to claim support. Preview sample replies must use a visible local-only/mock label; no Saved, Delivered or Answered status is borrowed from the real backend without authoritative readback.

The [canvas mockup](../../plans/720p/slices/05-explanation-exploration/canvas-reading-mockup.md) demonstrates the first selected-code and selected-prose interactions now. The [separate discussion mockup](../../plans/720p/slices/05-explanation-exploration/subsystem-mockups.md#d-discussion-and-participants) explores full identity, density, version and failure states next. Neither waits for all subsystem mockups, nor establishes production persistence or native-host acceptance.

Exact-version locate and active-range highlighting constraints, including repeated equal quotations, independent version availability and source-scoped history, are maintained in [canvas interaction constraints](canvas-interaction-constraints.md). These local preview learnings do not extend the backend's prose persistence authority.
