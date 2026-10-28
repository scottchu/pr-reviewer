# Read source inside the review canvas

Composition is governed by [canvas panels](canvas-panels.md): viewport-filling graph, default open left context, right explanation and bottom discussion, independent targets and no outer page scroll. Actual diff remains inside the graph.

**Decision date:** 2026-10-24

**Direction:** Accepted user correction: overview and focused source reading remain presentations of the same persistent graph canvas

**Implementation status:** Preproduction structural source/inspection candidate implemented and author-tested; semantic and other subsystem presentations remain separate. The complete canvas contract, fresh UI-first understanding and layout adoption remain unaccepted.

**Parents:** [Vision](../vision.md), [architecture](../architecture.md), [semantic neighborhoods](semantic-graph.md), [story and exploration](story-and-exploration.md)

## Purpose and non-negotiable interaction

A reviewer starts from a change, follows its relationships and reads the actual before/after diff without leaving the graph to open a file viewer. Zooming into a node or choosing a focused reading lens reveals source inside that node's graph group. The reviewer can still see where the change belongs, follow an unchanged neighbor, ask about exact lines and return to the previous overview.

A lens changes detail and framing, not source, graph meaning or participant authority. One canvas is the primary review surface. Context, story controls and small utility panels may surround it; ordinary source reading, related explanations, evidence and anchored question context stay graph-connected. A separate file page, drawer or inspector must not be the required path to read the selected diff. Supplemental complete-file/export tools cannot substitute for this journey.

This is core source reading for the existing neighborhood/story experience, not optional 4K polish. Large-dataset optimization, sophisticated transition animation and broad device tuning remain later refinements. React and the existing React Flow integration remain the chosen presentation stack; no framework, dependency or backend rewrite is implied.

## Three detail states, one identity model

| State | Content and action | Preserved context |
|---|---|---|
| Overview | Behavior/file groups summarize a concrete change, its before/after availability, primary scope and relevant connections. Select any node as an entry point; no API/Helpers orientation selector. | Selected group/node, snapshot and graph/analysis identity; changed and unchanged roles; explicit unknowns. |
| Neighborhood | The selected change and its bounded before/after callers, callees or evidenced source relationships remain legible. Show nearby related tests/explanation only where source or attributed evidence supports them. | Stable node/edge IDs and direction labels, comparison relation, visible nearest neighbors and exact remaining-scope counts. |
| Focused reading | Expand the selected graph group into readable before-left/after-right source nodes with line numbers and inline red removal, green addition, amber modification and unchanged context. Reveal a bounded relevant hunk/body, expand more context in place, select exact lines and ask a question. | The same group identity, comparison basis, source provenance, anchor and visible connections back to the neighborhood. A return action restores the saved framing and prior focus. |

Zoom/pan changes camera only; it never expands/collapses a file. Explicit pointer/keyboard/touch file activation reveals its continuous source comparison and can frame it at unchanged zoom. Expanded state survives zoom-out. Earlier automatic semantic disclosure thresholds are superseded, not current implementation targets. Preserve identity, selection and intentional context expansion.

Use a stable canvas scene with presentation-level reflow as a group expands. Reflow may move neighbors to avoid overlap, but cannot regenerate domain node/edge IDs or imply a new call relation. Before/after connections are labeled comparison relations, not runtime arrows. For long source, scrolling inside the focused source node reads additional lines; panning the canvas moves the graph. Selecting text or operating controls must not drag/pan the graph accidentally. Provide explicit navigation controls and keyboard equivalents.

## Source truth and unknowns

- Display retained source from the selected immutable snapshot or admitted semantic corpus. Show side, path, line range and commit; expose full snapshot/corpus/analysis identities on demand without flooding the first view.
- Preserve structural file/comparison identity separately from semantic declaration identity. Show source-only files as source groups when semantic facts are unavailable; do not invent callers to make the canvas look connected.
- Use the existing explicit comparison partner. Same name/path is not proof of equivalence, especially for renamed/copied/ambiguous declarations. If a partner is missing or not selected, show that state inside the group; never fabricate an empty matching function.
- Show changed lines and enough unchanged context to understand the selected claim. Expanding context does not change its anchor or claim that unprepared source was analyzed. An unavailable/binary/oversized side remains a visible unavailable node with its reason.
- Distinguish static bindings, authored explanations, comparison links and unknown relationships visually and in accessible labels. No geometry, arrow or green addition establishes execution, test success or causal intent.
- An unchanged caller/dependency remains a reachable source node. Related test source and actual execution outcomes remain separate evidence; an unrun test must stay unrun at every lens.

## Selection, questions and return

Keep these states distinct: graph focus, inspected source span, explicitly selected question anchor and saved story return frame. Reading or zooming never silently retargets an existing draft. A line selection offers an explicit Ask about these lines action with side/path/range visible; applying it obeys the existing draft and unresolved-command protections. A semantic-only context span that cannot use the current question-anchor contract stays readable with that question limitation explicit; do not fabricate a snapshot anchor or silently broaden backend authority.

A source-backed explanation or reply link focuses the exact retained node/span in this canvas. If the link belongs to a different retained snapshot or analysis, offer explicit historical navigation with that identity; do not splice its source into the current graph. Unavailable references report the gap rather than substitute current checkout bytes.

On entering a focused lens or following a neighbor, capture the prior viewport, selected identity, expanded groups and story cursor/version. Return restores those values and the original draft/anchor. Back navigation through nested exploration restores one frame at a time; Resume restores the story's saved frame. Do not equate merely zooming out with resetting the story. New analysis, story publication, import completion and background reads never steal the user's frame or automatically replace selected history.

Lens and viewport are private presentation state, not domain graph edits. Reuse existing application-owned frame/draft/recovery semantics and managed subscriptions. Any additional persisted frame field requires a documented compatibility update and tests before implementation; this contract does not introduce an unversioned storage shape. Domain authorization, command deduplication, graph CAS, durable inbox, host delivery and external-effect recovery remain unchanged.

## Contextual comments on selected content

The [canvas comment contract](canvas-comments.md) applies to selected review prose as well as code. Show the Comment action beside the selection, then an anchor-adjacent floating thread marker with human/agent author identity. Open the thread/reply in the bottom discussion panel, retaining its exact graph anchor; pan, zoom, lens changes and return never change that anchor. Use a reserved marker lane and counted clusters to prevent overlap, with keyboard/touch and narrow-layout access. Prose requires stable owning content/version/selection identity; unsupported prose persistence stays explicitly preview-only, not a fabricated source anchor or Saved result.

## Narrow layout and accessibility

A narrow viewport uses the same graph identities and reading lens. A focused comparison may stack before above after inside its graph group, keeping both labeled sides available and a compact neighborhood/return cue. The canvas can pan to neighbors; a labeled navigation list may focus those same nodes for keyboard and screen-reader use. Do not replace the graph model with a disconnected mobile file viewer or a before/after toggle that hides comparison meaning.

At focused reading size, code, line labels, question controls and status must be legible. Manage overflow inside source nodes rather than stretching the document horizontally. Preserve visible focus, text equivalents for color, accessible names and coarse-pointer targets. Inspect desktop and narrow screenshots for hierarchy, whitespace, readable code and preserved relationship context separately from automated interaction tests. A working wheel handler or passing browser test is not visual approval or comprehension evidence.

## Acceptance and implementation boundaries

The [subsystem mockup map](../../plans/720p/slices/05-explanation-exploration/subsystem-mockups.md) assigns separate inspectable scenarios for canvas/source, story, import/history, discussion/participants and tests/evidence, joined by this same model. The current canvas preview continues without waiting for all other scenarios.

The next [inspectable React mockup packet](../../plans/720p/slices/05-explanation-exploration/canvas-reading-mockup.md) demonstrates overview, focused inline diff, an unchanged neighbor, anchored questioning, exact return and a narrow alternative on one pinned real own-PR change. It must be shown before another production UI composition is adopted. The user correction establishes the model; the mockup establishes whether its concrete layout is usable.

Preserve current source acquisition/analysis, immutable storage, jobs, authentication, MCP/CLI, question/reply and recovery work. The correction changes their presentation and source-navigation destination. Keep isolated application checks running while the affected UI composition is paused. Do not relabel earlier engineering or bounded understanding receipts as proof of this newly clarified interaction. No new host capability, live execution result or human acceptance is established by this specification.

## Learned interaction constraints

The local subsystem previews identified exact-version prose lookup, active-offset highlighting, explicit read-to-pause behavior, source-scoped private drafts and measured reflow as essential constraints. See [canvas interaction constraints and preview limits](canvas-interaction-constraints.md) for durable behavior and rationale. Their author-informed Chrome/source checks do not establish production integration, unfamiliar-reviewer comprehension or layout adoption.

## Application inspection and transactional restoration

The preproduction structural reading candidate adds a separate application inspection owner. It accepts authorized immutable snapshot/graph values, then validates the exact snapshot, comparison occurrence, side, path, inclusive LF line span and original SHA256 before publishing bounded source context. Renames and copies use the existing comparison occurrence; ambiguous copies require an explicit key. Opposite source is the exact file-level comparison partner, not a matched function or line-alignment claim. Each side can scroll independently; its displayed range is explicit. Missing, empty and unprepared sides have no selectable anchor. Inspection, focus, viewport, context expansion and bounded Back are private presentation intents, separate from explicit guarded question selection.

An unchanged document context node can lie outside the changed-file ledger. Its inspection retains the originating changed-file occurrence and the exact context anchor/hash. The application re-proves a direct document-reference edge from that occurrence under the exact target snapshot/side; transitive reachability or a same-path guess is insufficient. An opposite context source is included only through an existing comparison edge. These are retained document links, not caller/callee or execution facts.

The optional structural private-frame inspection contains the exact anchor, original content hash and optional bounded context-expansion flag. Legacy absence restores overview with no source verification read. The existing strict envelope and scope checks remain; incompatible records are preserved/quarantined, not migrated or erased. Before publishing private startup state, the read-only canvas validation port validates both the current inspection and saved return inspection against each exact retained snapshot. Resume awaits the same validation before consuming its first return frame. Failure, cancellation or supersession preserves the frame and both drafts under existing checkpoint/recovery guards. No validator read publishes canvas state, captures a frame or changes drafts.

Managed workspace routes alone synchronize authorized review→inspection, inspection→private frame and Story→inspection restore. Capture requires ready access, matching review/story/canvas snapshot and settled source with no error. Initial/busy restore values cannot overwrite a validated saved map. If a user focus supersedes a held restore, a newer settled revision belonging to that exact restore/scope/credential/serial becomes the capture source before same-turn exploration freezes its return frame. Older completions cannot flush into replacement access. Renderer mount and programmatic viewport application do not write a second structural frame; genuine user movement and explicit focus delegate to the inspection owner.

Observed candidate scope is structural snapshot reading, exact source links, document context, explicit anchored questions and existing Story recovery. Semantic rendering and the other subsystem presentations remain separate checkpoints; this source candidate does not establish the whole canvas contract, unfamiliar-reviewer comprehension, physical-device acceptance or layout adoption.

## Public inspection values and bounded intents

The React-specific application boundary exports createSourceCanvas, SourceCanvas/SourceCanvasView, CanvasFrame/CanvasReading/CanvasSide and the pure canvasProjection. SourceCanvasView contains the authorized snapshot and graph, current private structural frame, verified reading or null, bounded Back frames, busy/error and restore revision. CanvasReading names its originating comparison fileKey and labeled side values; each side carries an exact available SourceView/anchor or explicit null/reason, bounded lines and omitted count. The projection exposes the selected file, existing primary nodes, direct document-reference neighbors and an available focused anchor; it creates no domain graph identity.

The owner accepts setReview, inspect, restore, readFocused, inspectNeighbor, focusFile, Back, viewport, context, expansion and disposal intents. inspect requires an exact retained snapshot line anchor plus an explicit file occurrence for ambiguous copies; inspectNeighbor accepts an existing directly reachable graph node ID. Restore consumes the validated optional inspection or legacy overview frame. Workspace inspectSource is a read intent; workspace openSource remains the older guarded question-selection port. Authored snapshot-source reference inspection additionally verifies the supplied original content hash and captured access generation before navigation. Missing/foreign references never choose a current substitute.

Ordinary source detail shows at most48 lines starting up to8 lines before the selected start; explicit larger context shows at most200. Omitted count remains visible, and the anchor itself does not change. Back retains at most16 prior frames in the current owner lifetime; the persisted Story return frame remains separate. Raw source verification rejects mismatched LF line count, mismatched SHA256 or a side over1MiB; reads have a10-second bound and caller/generation publication fencing. Canceling a browser digest means fencing its result, not proof of CPU termination. Viewport values must be finite with zoom0.1–4. No per-node timer, source parser, HTTP command, participant/session or worker runs in this owner.

Unavailable/ambiguous comparison, exact saved occurrence loss, raw checksum mismatch and canceled/superseded reads remain distinct observable failures. The renderer uses loading/error/reason text and retains prior valid frame/drafts where applicable; the readonly Story preflight publishes nothing. Absence of an inspection field is valid legacy overview, not an error to repair by guessing a span. These interfaces are implemented in the reversible candidate; their existence is not evidence of final whole-product presentation acceptance.

Every explicit authored-reference inspection reserves its latest-intent generation before an awaited evidence/source read. Capturing the current epoch without advancing it is insufficient: two references would share ownership and an older continuation could later supersede the newer request. Recheck that reserved generation and credential before source navigation. A displayed primary origin card delegates exact primary inspection with its originating comparison key; a context-neighbor card delegates only the neighbor intent. Being an origin does not make the node a directly linked neighbor of itself. Both actions preserve the distinct question draft and allow Back to the prior exact inspection.

## Changed-span metadata and explicit reading

The complete existing hunk inventory remains selectable for the exact comparison occurrence. Public canvas projection exposes all current-file hunk nodes and its exact selected hunk metadata; the owner validates every nonempty hunk ID against that fileKey/side/path membership. focusSpan is metadata focus, separate from inspectSpan, which is explicit source reading with snapshot/span/hash verification. Story graphFocus carries its existing exact fileKey/hunkId through the managed route. New Story intent may change that focus; restored map identity has priority until a genuinely newer intent. No renderer invents a counterpart function, line mapping or extra graph fact.

Legacy structural maps with spans/spanId but no inspection still restore overview and their selected metadata with zero inspection verification reads. They do not acquire a fabricated source anchor/hash. Their chooser can show the saved hunk; only an explicit user reading/zoom/source action verifies and opens its byte context. New inspected-hunk frames retain both the metadata ID and independently exact inspection, and existing transactional validation still covers both startup maps and Resume. The complete chooser does not truncate to the bounded visible source/node budget. Invalid/stale/copied-foreign hunk metadata is unavailable rather than silently selecting a first span. The older empty spanId remains an unselected metadata state.

## Reviewer-experience design correction

The [reviewer experience](../review-experience.md) and [reference dissection](../review-reference-dissection.md) now govern the proposed information hierarchy for the next design review. The 8474 functional preview is rejected as a UX target; existing engineering checks remain historical functional evidence. Basic same-canvas reading is accepted, but neither this candidate nor a list of its controls establishes an adopted layout. The next step is independent specification review, then an explicitly authorized inspectable mockup.


## Whole-PR membership and spatial navigation

The controlling October23 contract is explicit in [the whole PR25 graph](../pr25-whole-change-graph.md): all changed hunks have persistent group/file homes, with before/after one-hop callers AND callees including unchanged context or explicit side-specific gaps. Source, short explanation claims and tests are connected graph members inside/adjacent to their groups; extended explanation is in the right panel and full discussion in the bottom panel. Compact support/document groups remain canvas members, not an inventory hidden behind the current story.

Story is optional attention over this map; it never replaces membership or gates arbitrary entry. Free pan/zoom and manual semantic-detail expansion must work before playback. Focus may change framing/detail, not swap the graph for a slide. The8476 locked-pan/single-group mock is rejected as a product-fit target; its functional checks do not weaken this contract. Exact graph facts, public state boundaries, anchors and recovery remain unchanged.


Explicit function or exact-range navigation selects the existing changed comparison hunk overlapping that range on its source side for the current-source explanation. Programmatic focus scrolling must not replace that selection with an unrelated earlier visible hunk. A subsequent deliberate reading scroll/gesture or change-dot selection transfers comparison selection back to ordinary reading; an old evidence anchor must not permanently override it. An unchanged inspected range does not invent a changed hunk.


The active SourceCanvas renderer exposes this existing metadata contract through `Show selected file’s changed spans`, the complete `Changed span` chooser and `Focused changed span` metadata. Choosing metadata delegates exact occurrence validation to the public owner and keeps the question anchor/draft independent; it is not source inspection. `Read selected changed span` (or existing Focus source) is the separate explicit read and verifies the selected source bytes/range/hash. A span-only saved frame may display its metadata in overview with no invented inspection. The complete chooser is not truncated to the bounded rendered source budget.
