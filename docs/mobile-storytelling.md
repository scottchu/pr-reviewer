# Mobile storytelling proposal

Status: implemented prototype. Shared lesson/scene state drives explanation, graph focus and unified diff. Desktop navigation remains available.

## User story

A reviewer on a phone wants to follow a technical explanation while seeing the affected call and actual diff. They advance scenes through a floating bottom player, inspect source on demand, and return without losing the teaching position. Reading or inspecting must pause progression rather than move the evidence away unexpectedly.

## Proposed experience

Use a single focused story surface instead of stacking all desktop panes. A compact call trace provides orientation. Flow and Diff views share the same lesson/scene focus and retain scroll/selection. Explanation accompanies the current focus; source evidence is accessible from each explanation.

Floating bottom controls contain previous scene, play/pause and next scene, with lesson/scene progress and an expandable chapter list. Include bottom safe-area padding and content clearance so controls never cover diff lines. Targets are at least 44px. Reduced-motion mode uses static emphasis.

A lesson consists of narrated visual scenes: present the focused behavior, show an existing caller, highlight removed/added logic in unified diff, reveal a new caller, trace the consequence, then ask a verification question. Not every PR necessarily has every scene. Each claim requires evidence or an explicit unknown. A removed line is red because it is deleted, not because it is a failure.

Play demonstrates the visual trace within a scene, then pauses at a reading/checkpoint boundary. Do not advance long explanations on a fixed timer. Replay repeats the current scene. Exploring preserves the lesson and scene cursor; resume restores the relevant focus across Flow and Diff. Audio narration is not assumed.

## Observable acceptance

- At a narrow viewport, bottom controls remain reachable without covering content.
- A user can identify the focused method, its caller, exact diff and behavioral consequence.
- Switching Flow/Diff, inspecting evidence and returning keeps the same scene.
- Playback pauses for reading/exploration; replay and next are deterministic.
- Focus, scene explanation and evidence refer to the same pinned PR head.

## Verified and pending

Chrome responsive checks passed at 390×844 and 320×720: no page-width overflow, three primary controls at 44px height, same-scene view switching, colored-reference focus, playback returning to paused reading, and exploration/resume. The focused diff line was inspected above the floating player. Agent head-pinned lesson/scene commands were observed in the actual client. The viewport override was reset after testing. Physical-phone safe area, keyboard, gesture feel and reduced-motion checks remain pending.

Player scenes run why → what → how → example. Play demonstrates method → call → diff within the current scene and pauses; it does not advance the reading scene on a timer. Imported PRs without the pinned teaching model retain file-diff exploration and do not advertise a fabricated five-step lesson.

## Next experiment

The user found the graph more helpful than the narrative. Retain this prototype and defer further redesign until a more complicated representative PR can test graph-led comprehension.

## Minimal player refinement

The shared draggable player now uses icon-only operations, a 260px surface and compact step/scene metadata. Header actions, graph tools and mobile evidence switches use the same pinned Lucide family. Informational chapter names, narrative, code and change status remain text. See `docs/interface-audit.md` (from the experiment root) for current screenshot evidence and verification limits.

## Single-row player (2026-10-13)

The floating player is now one horizontal row: drag handle, previous, replay/pause, next and a scene counter (1/20 through 20/20). The counter opens the existing chapter menu. The separate chapter icon and progress bar were removed. Height is 54 CSS pixels including border and padding; operation targets remain 44px. Existing exploration/resume behavior is retained. The same row styles apply on mobile, with smaller bottom content clearance. Build passed; native Chrome live screenshot inspection and previous/next scene navigation passed after restoring the stopped task preview process. Mobile and physical-device acceptance were not repeated for this refinement. Evidence: ignored task screenshot `slim-player-desktop.png`.

## Whole-PR grouping update (2026-10-13)

Six groups now account for all 14 pinned PR files (452 added, 24 removed), with an expandable evidence list and synchronized group/scene/source focus. Setup, tests and docs are included in the eight-chapter, 32-scene story. The desktop caption shows only the current scene and the slim player remains one row. Same-agent coverage tests and Chrome 390px/desktop checks passed; physical-phone and teaching-effectiveness acceptance remain unverified. See the latest README section and ignored `behavior-groups-desktop.jpg` / `behavior-groups-mobile.jpg` captures.
