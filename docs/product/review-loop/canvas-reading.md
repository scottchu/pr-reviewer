# Read source inside the review canvas

**Decision date:** 2026-10-24

**Direction:** Accepted user correction: overview and focused source reading remain presentations of the same persistent graph canvas

**Implementation status:** Required correction; the existing summary-card graph and separate inspector do not yet satisfy this contract

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

Zoom can trigger progressive disclosure around the focused selection; an explicit keyboard/touch-accessible Focus source action must reach the same reading state without precise wheel gestures. Zoom alone must not continually refit the whole graph, select another node, expand every file or turn text into unreadable scaled pixels. Keep code and controls readable at focused scale, constrain disclosure to the active group, and let the user intentionally expand context. Thresholds, sizes and transition timing are mockup decisions to evaluate, not assumed acceptance from a chosen numeric zoom value.

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

## Narrow layout and accessibility

A narrow viewport uses the same graph identities and reading lens. A focused comparison may stack before above after inside its graph group, keeping both labeled sides available and a compact neighborhood/return cue. The canvas can pan to neighbors; a labeled navigation list may focus those same nodes for keyboard and screen-reader use. Do not replace the graph model with a disconnected mobile file viewer or a before/after toggle that hides comparison meaning.

At focused reading size, code, line labels, question controls and status must be legible. Manage overflow inside source nodes rather than stretching the document horizontally. Preserve visible focus, text equivalents for color, accessible names and coarse-pointer targets. Inspect desktop and narrow screenshots for hierarchy, whitespace, readable code and preserved relationship context separately from automated interaction tests. A working wheel handler or passing browser test is not visual approval or comprehension evidence.

## Acceptance and implementation boundaries

The next [inspectable React mockup packet](../../plans/720p/slices/05-explanation-exploration/canvas-reading-mockup.md) demonstrates overview, focused inline diff, an unchanged neighbor, anchored questioning, exact return and a narrow alternative on one pinned real own-PR change. It must be shown before another production UI composition is adopted. The user correction establishes the model; the mockup establishes whether its concrete layout is usable.

Preserve current source acquisition/analysis, immutable storage, jobs, authentication, MCP/CLI, question/reply and recovery work. The correction changes their presentation and source-navigation destination. Keep isolated application checks running while the affected UI composition is paused. Do not relabel earlier engineering or bounded understanding receipts as proof of this newly clarified interaction. No new host capability, live execution result or human acceptance is established by this specification.
