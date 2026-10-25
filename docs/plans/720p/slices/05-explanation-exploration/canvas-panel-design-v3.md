# Canvas panel design v3: intake, decisions and review handoff

Date: 2026-10-24. Status: integrated source design awaiting bounded role readback; no UI implementation dispatch, mock launch or runtime acceptance.

Source base: `740dabe377779722fa928895f13d33a6ae59194f`. Branch: `recover-whole-pr-spatial-graph`. Parent: [slice05](plan.md). Prior v2 whole-map review remains useful scope evidence; composition readiness is superseded by the latest direct user correction.

## Exact intake and goal

User: “No top down page. Context left open panel. Detail explaining right slide on panel. Comment bottom slide up panel. Main window zoomin/outusinggesture. Startfromgoal thinkdifferentaspects, agentsreviewwithrolesandcomeback.”

Goal: a tired unfamiliar reviewer understands the whole PR, investigates exact evidence and asks in context without losing either the graph or the question. Integrate the roles before implementing; do not mechanically add controls/panels or ask the owner to resolve routine geometry.

Durable source: [canvas panels](../../../../product/review-loop/canvas-panels.md), [reviewer experience](../../../../product/review-experience.md), [whole PR25 graph](../../../../product/pr25-whole-change-graph.md), [comments](../../../../product/review-loop/canvas-comments.md), [interaction constraints](../../../../product/review-loop/canvas-interaction-constraints.md). All50 files/163 hunks, exact B/H callers AND callees with unchanged context or explicit gaps, and actual source inside the graph remain required. v3 changes extended-reading composition, not graph scope, backend authority or dependencies.

## Independent role decisions

Three reports were read; their recommendations are integrated here rather than remaining temporary-only product knowledge. Report paths are source review evidence, not new runtime results.

| Role / report | Adopted decisions and reason | Deliberate difference / deferred evidence |
|---|---|---|
| Tired reviewer / product comprehension; `/tmp/pr-reviewer-panel-design-reviews/product-reviewer.md` | Left gives known goal/context; right explains exact target with evidence; bottom holds exact discussion. Default story off; whole-map arbitrary entry. Preserve short connected claims. Evaluate wrong turns, repeated reopening and mistaken target identity, not button counts. | Do not require a new Explain button before every detail read: meaningful node/claim activation opens detail. Do not always collapse right when commenting: wide coexistence supports source investigation; constrained readers retain hidden state. Geometry/comprehension need a future mock. |
| State ownership / subsystem boundaries; `/tmp/pr-reviewer-panel-design-reviews/state-boundaries.md` | Independent graph selection, right target and bottom anchor; guarded adoption; immutable uncertain commands; close is visibility only; late reads/replies cannot navigate; existing public owners and managed routes. Reconcile canonical inline-thread wording. | Closed right may open on deliberate meaningful activation, unlike report's mandatory explicit Explain. Incidental source selection/citation excursions never adopt its target. No new schema, general prose persistence or unlimited draft collection is inferred. |
| Spatial gestures / mobile / accessibility; `/tmp/pr-reviewer-panel-design-reviews/spatial-interaction.md` | Full-window shell, usable central rectangle, right full-height/bottom central-column proposal; one constrained foreground reader; focal-point pinch, trackpad pan, native source/panel input ownership; semantic navigator and reduced motion. | Close always preserves current camera, even without intervening pan: predictable dismissal beats automatic rollback. Only explicit opening may translate minimally before typing; Back restores a frame. Approximate sizes/floors/thresholds are inspection hypotheses. Physical gestures, keyboard/IME/safe areas and screen readers remain unknown. |

These choices reduce mandatory action cost while protecting discussion: on a constrained active bottom reader, deliberate graph activation retains a requested detail target behind a named cue, never interrupts typing or automatically replaces the foreground. The right and bottom headings always identify their independent targets. No async event opens or retargets a reader.

## Bounded readback assignments

Return this committed packet and durable changed sections to the same three roles; no new agent or UI job is requested by this document.

- Product role: check goal/first-open, deliberate detail entry, independent target legibility, constrained discussion exploration and unscripted PR25 tasks. Check that panels help understanding rather than reintroducing a control wall.
- State role: check action table, delayed A/B publication, guarded dirty/uncertain adoption, close versus Back/Resume, source-version identity and managed ownership. Confirm old inline-thread geometry is superseded without new persistence claims.
- Spatial role: check wireframe/unoccluded rectangle, narrow modal/peek rules, camera-close policy, gesture ownership, accessible alternatives and explicitly unverified physical behavior.

Each returns accept-for-next-mock-design, bounded correction or inconclusive with exact references. This is design readback, not UI-first graph comprehension or product acceptance. Coordinator consumes all results before any new implementation dispatch.

## Next mock only after reviewed dispatch

The [v2 packet](whole-pr-graph-mockup-v2.md) still supplies immutable PR25 content, eight whole-map gates and source scope. Replace its in-group long explanation/thread composition with this v3 contract. Preserve old8476. Do not launch or claim reserved ports available from this document.

Required new composition cases: desktop default; G3 arbitrary entry with right detail; before-A comment plus B citation excursion; wide independent detail/thread targets; constrained foreground switching with dirty draft; delayed response after target change/close; source selection/scroll versus graph pan/zoom; close preserving newer camera; unavailable explanation/no agent and failed return; keyboard navigation to G7/G8 and unchanged context. Measure the actual graph rectangle and local scroll, not merely panel existence. All eight whole-map gates still apply.

No code, test, dependency, server, browser, network, native-host or configuration work was performed for this revision. No new layout was observed live. Source checks cover document links, whitespace and docs-only scope. Physical device/native delivery/unfamiliar-reader evidence remains open; previous engineering receipts cannot close it.
