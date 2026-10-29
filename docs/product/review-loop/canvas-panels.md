# Canvas workspace and contextual panels

> Current-entry precedence (2026-10-29): [design status](design-status.md) distinguishes the delivered minimum graph from this wider canvas proposal. Retain its source/evidence, anchor, draft and return requirements; older panel defaults are not current-entry implementation instructions. Historical status/evidence below is preserved.

Date: 2026-10-24. Status: accepted user composition, with explicit proposed interaction defaults for the next reviewed mock. No new implementation, physical-device validation or unfamiliar-reviewer acceptance is claimed.

The goal is to understand a whole PR, investigate its evidence and ask a precise question without losing the map or the question. The latest user direction is: no top-down page; context in an open left panel; detailed explanation in a right slide-on panel; comments in a bottom slide-up panel; gesture zoom in the main window. This supersedes older inline-thread and long-explanation placement. It does not supersede [whole-PR membership](../pr25-whole-change-graph.md), exact source identity or [comment anchors](canvas-comments.md).

## One spatial workspace

The graph fills the available application window. There is no outer page scroll through context, graph and conversation. Reading surfaces scroll locally. Desktop opens with left context visible, right detail and bottom discussion closed, and story off. All eight PR25 groups and all hunk homes exist immediately; collapsed bodies, culling and story emphasis never change membership. Actual before/after diff, unchanged callers/callees and related test source remain connected graph members. Short attributed claim nodes retain their source connections; extended explanation is read at the right.

Left context answers what review this is and what goal is actually known: pinned PR identity, captured rationale/ticket context, attributed understanding and missing context. It is neither a mandatory orientation step nor a duplicate file inventory. Right detail answers what a particular change means and why the account is credible: exact target/author/version, short consequence, reasoning, citations and limitations. Bottom discussion answers what is being asked about this exact source/prose: anchor/quote, human/agent identities, transcript, independent draft and honest command/delivery state. Merely opening it sends nothing.

The following geometry is a proposal to inspect, not measured acceptance or a new theme choice: left about240px; right about360px at full workspace height; bottom about280px high within the central graph column. The unoccluded graph rectangle excludes open reserved panels, safe areas and chrome. About480×320px is an initial readability floor to inspect, not a guarantee. Fit overview and Frame selection use this rectangle. Source bodies need not all fit simultaneously. The dark October23 editor foundation remains the visual baseline.

Wide windows may retain all three panels when graph and composer remain usable. Constrained width, enlarged text or reduced height uses one foreground reader and retained named edge cues for the others, not a vertical page or several unreadable slivers. Context opens from the left, detail from the right, discussion from below. Opening a different reader explicitly changes foreground; resizing or incoming content does not hop between panels while typing. Narrow first-open shows the graph with a named Context cue rather than sacrificing it to a mandatory full-width drawer. Left-open is the desktop default.

A peek that leaves graph interaction available is nonmodal. An expanded overlay blocking it is modal, with contained focus and explicit Collapse/Return to graph. Phone keyboard input may require the composer to cover the graph: retain its exact quote/side/path/range or prose version, Reveal origin and draft return. Do not claim simultaneous readable source, explanation, transcript and keyboard at320px. Before/after may stack *inside one graph group*, never as application sections. Actual visual-viewport/safe-area handling needs device evidence.

## Window composition (screen space around stable world space)

```text
┌────────────────┬───────────────────────────┬──────────────────┐
│ LEFT CONTEXT   │ CENTER: PERSISTENT GRAPH  │ RIGHT DETAIL     │
│ PR goal/source │ world-space groups,       │ explanation for  │
│ and unknowns   │ inline before/after,      │ its named target │
│ local scroll   │ claims/tests/neighbors    │ local scroll     │
│                ├───────────────────────────┤                  │
│                │ BOTTOM DISCUSSION         │                  │
│                │ exact anchor + draft      │                  │
└────────────────┴───────────────────────────┴──────────────────┘
```

Panels are screen-space surfaces; the graph keeps world positions. Default desktop: left open, right/bottom closed, story off, so the center expands into available space. The diagram shows the permitted wide coexistence state, not mandatory simultaneous panels. Constrained: one foreground reader from its named edge, other readers retain named cues and state over the same graph. No section flows beneath another as a scrollable application page.

## Predictable actions and independent targets

Inspected graph identity, right explanation target and bottom thread/draft anchor are independent. Each surface names its target, including when they differ. The following defaults intentionally avoid a mandatory extra Explain button while protecting exploration and typing.

| Explicit user action or event | Graph and right detail | Bottom discussion / focus |
|---|---|---|
| Activate a meaningful node title or short claim cue | Select that identity and open/update right detail. No automatic zoom/refit. Expanding source remains a separate semantic-detail action. | Preserve exact thread/anchor/draft. On wide layout, coexist. While a constrained bottom reader is active, retain the requested detail target with a named pending-detail cue; do not foreground it until the reviewer explicitly opens that cue. |
| Hover, pan, zoom, select/copy source text, scroll or blank-canvas tap | Never opens or retargets right detail. Source selection changes inspected span only; manual zoom changes detail without adopting a narrative. | Never opens, sends, adopts or retargets a question. Native text interaction keeps focus. |
| Follow a citation from explanation or discussion | Inspect exact cited source in the same graph, with an excursion/return cue. Preserve right target and scroll. Historical navigation uses existing guards. | Preserve original discussion and draft; evidence inspection is not question adoption. |
| Comment on selection / open a marker | Keep graph anchor highlight; detail target remains independent. Right may remain visible on wide layout; constrained layout retains it behind its cue. | Explicitly open bottom with exact validated anchor. A different dirty draft requires existing keep/replace or retained-draft choice; pending/unknown commands cannot be retargeted. No new unlimited multi-draft capability is implied. |
| Use selection for an existing draft | Application validates exact source eligibility and the existing replacement guard. Declining leaves every field unchanged. | Only this explicit permitted adoption changes its anchor. A submitted uncertain command remains immutable. |
| Open another retained thread | Reveal its exact identity without moving the old thread. | Reconcile/preserve an existing draft through the responsible owner before switching; never overwrite it with the new thread. |
| Close/collapse a panel | Hide only; preserve target/local reading state for this owner lifetime. No automatic refit or camera restoration. | Preserve text, command identity and anchor. Return keyboard focus to invoker or semantic same-identity fallback. Close is not Discard, Back or Resume. |
| Back / Resume | Restore the existing validated exploration/story frame transactionally; Resume stays paused. Restore failure retains frame and drafts. | Existing original/exploration draft semantics apply; no submission, invented persisted panel fields or silent adoption of newer source. |
| Explanation/reply/publication arrives, including after closing | Update only the authorized matching retained target. Never open, foreground, retarget, move camera or steal focus. | Update its own thread/account; no auto-scroll of an actively read transcript or focus on composer. A discoverable arrival indicator is not delivery proof. |

Keyboard activation may focus the requested panel heading; pointer activation need not steal focus from the graph. Comment explicitly moves focus into its requested interaction. No incidental selection steals a focused composer. A constrained reader cue is explicit navigation, not an extra required Explain action on every node.

Delayed A cannot overwrite a newer B target. Publication uses exact review/snapshot/access generation, target/content version, connection lifetime and latest intent fences. Previous text may remain visibly labeled previous/loading; never put B's heading over A's prose. Hidden readers remain hidden when loads settle. Unavailable explanation preserves navigable source and explicit relation gaps. No-story/no-agent opening remains useful: inspect actual source now, show missing rationale honestly, and use existing attachment/question paths only when requested. Prepared mock prose/replies remain labeled, not evidence of automatic analysis or native delivery.

## Camera and input ownership

Panel changes never regenerate node positions or alter graph membership. No automatic Fit. On explicit user opening only, if the chosen anchor would be occluded, allow one smallest translation at the existing scale into the usable rectangle, before typing begins. If it cannot fit, keep the honest anchor summary and explicit Reveal origin rather than shrinking source. Record that adjustment separately from navigation. Closing always preserves the current camera, including any newer exploration; Back is the explicit way to restore a prior frame. Resize, async content and keyboard changes never chase the anchor or repeatedly recenter it.

| Start surface/input | Owner and behavior |
|---|---|
| Blank graph mouse/one-finger drag | Pan. Movement cancels pending activation; releasing over a node does not select it. Nodes are not accidentally rearranged. |
| Graph background/nontext frame pinch | Zoom around the moving centroid, preserving the world point under it; centroid translation pans. No end-of-gesture snap. |
| Graph trackpad two-finger scroll / mouse wheel | Pan both axes / vertical pan, with optional Shift-horizontal. Canvas pinch/Ctrl-wheel zooms at the pointer; browser keyboard/menu zoom stays available. Physical delivery remains unverified. |
| Source body, native selection, local scroll | Native text selection and source scrolling. No scroll chaining to graph/page at either end. App-owned source pinch must not scale the browser page or graph; single-finger vertical reading and native text selection remain. Graph pinch starts outside source. Physical Safari/trackpad enforcement remains unverified; viewport hints are not proof. |
| Context/detail/transcript scrolling | That surface scrolls only; never pans graph or dismisses a panel at its end. |
| Sheet/drawer explicit handle | Resize/collapse that panel only. Transcript/composer drag is not dismissal. No global edge-swipe takeover of browser/OS Back. |
| Text input, IME, selection handles | Native editing owns input. Canvas shortcuts/Escape do not intercept composition. Pointer cancellation/focus loss never submits or navigates. |

The start surface owns the gesture until completion/cancellation. A 6–8px drag threshold and semantic-detail hysteresis are initial inspection hypotheses, not accepted physical constants. During pinch/pan, avoid reflow under the fingers; explicit expansion reaches the same detail without gestures. Local source scroll, selection and graph identity survive detail simplification. Controls/player/minimap occupy the usable graph area, above the sheet; compact optional player never covers source or composer.

## Ownership and accessible alternatives

Existing authorized graph/semantic read models own facts; SourceCanvas/AnalysisBridge public ports own exact source inspection; application canvas/story owners own navigation and return frames; existing draft/recovery/discussion owners own anchor eligibility, guarded adoption and durable outcomes. Retained context/story read models supply left context and right claims. React owns panel geometry/visibility and emits explicit public intents; it does not invent business policy, new persistence or per-panel polling. Cross-subsystem reads/updates go through the managed integration registry with authorized bounded teardown. Unsubscribe is not external cancellation. This is a conceptual composition, not a new schema or subsystem.

Provide a same-identity semantic navigator for all groups, nodes and typed relationships, including culled members. Keyboard users can enter G3 or an unchanged helper, follow incoming/outgoing relations, expand actual source, open detail/comment and return. Do not place163 hunks into one initial tab wall. Native source remains selectable; side/change/absence/unknown meanings have text labels, not color-only encoding. Markers have named actions and anchors, visible focus and coarse-pointer targets; tiny ports/hover are never the sole route.

Use predictable graph/context/detail/discussion landmarks and skip actions. Graph-focused arrow pan and explicit zoom/Fit/Frame controls do not override list navigation, source reading or input editing. Closing returns to the invoking identity even when culled, using semantic focus rather than unsolicited camera motion. Modal focus follows actual blocking behavior. Escape dismisses only the engaged transient reader when native editing/composition does not own it; it never discards. Reduced motion removes travel/slide animation while retaining direct manipulation, static emphasis and all content. Browser200% zoom/enlarged text invokes compact composition rather than clipped controls.

## Design acceptance and limits

The eight whole-map gates still apply. In addition, the next authorized mock must demonstrate: arbitrary G3 entry and G4/G6 reverse tracing; actual inline source with right claim detail; comment on before A while inspecting B with independent headers/draft; delayed A after B and reply after close without focus/camera theft; dirty close/reopen and failed return preserving state; wide coexistence with a genuinely usable rectangle; narrow overlays without outer page scroll; source versus canvas versus panel gesture ownership; keyboard traversal to supporting groups and unchanged context.

Inspect390×844 and320×720 plus enlarged text/reduced height, recording actual available viewport. Physical pinch, touch selection, IME/software keyboard/safe areas, OS edges and screen-reader traversal remain unverified until separately exercised on suitable hardware/software. Synthetic events/screenshots are not physical-device or unfamiliar-reader evidence. A fresh reviewer must independently explain multiple PR responsibilities and an unchanged neighbor before seeing the source comparison; record wrong turns, repeated panel reopening and unwanted movement as comprehension burden, separate from engineering test totals.
