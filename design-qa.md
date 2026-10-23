# Design QA — responsive prototype

Historical source prototype result: passed within the scope below. This is not fresh destination browser acceptance.

Scope: same-agent responsive implementation and requested semantic narration refinement. This result does not establish physical-phone acceptance or user comprehension.

## Source and comparison evidence

Source visual truth: selected desktop reference `/Users/scottchu/.codex/generated_images/01a1280a-3618-7c41-b70d-71d40fafd60f/exec-b32a6ac2-4f1f-4503-9f5d-19c989924bd3.png`, plus the user's supplied screenshot of the plain-text explanation and explicit requests for numbered/colored source references and a mobile player. The mobile contract is `docs/mobile-storytelling.md`; no independent mobile mock was selected.

Browser implementation captures retained in the source worktree (SOURCE_PLAYGROUND is defined in docs/project-transfer.md; not destination-relative paths):

- `SOURCE_PLAYGROUND/.decompozr/flow/run/pr-diff-teacher/mobile-story.jpg`, 390×844 CSS and image pixels, dark, step 1 scene 1, Flow.
- `SOURCE_PLAYGROUND/.decompozr/flow/run/pr-diff-teacher/mobile-diff.jpg`, 390×844, step 1 scene 2, focused removed condition.
- `SOURCE_PLAYGROUND/.decompozr/flow/run/pr-diff-teacher/desktop-story.jpg`, 1440×1024, step 2, graph and source.

The mobile Flow capture was refreshed after the final plain-English wording change and its DOM confirmed why-first narration. The desktop and Diff captures preceded that wording-only change; layout/controls are unchanged and the final build passed. Selected source and desktop capture were opened in the same comparison input. Source 1488×1056 and desktop 1440×1024 have approximately the same aspect ratio; comparison was of region proportions and component hierarchy rather than pixel identity. Focused mobile screenshot/DOM checks inspected colored narrative, numbering, the removed line and the player. Actual GitHub source replaces illustrative mock code; longer explanation and source-specific graph labels are intentional changes requested by the user.

## Comparison history

- Earlier gate: blocked because browsers were unavailable. Chrome access subsequently recovered.
- [P2 fixed] Diff auto-scroll used incompatible offset coordinate systems. Rect-based scroll now reveals the selected token/line. In 390px Diff view the inspected focused row was at y=474–496, above player y=694.5.
- [P2 fixed] Longer desktop explanation pushed focused source below the initial view. The explanation now has a keyboard-focusable bounded scroll region; recapture shows graph, explanation and the focused source together.
- No remaining observed P0/P1/P2 issues in this responsive prototype scope.

## Fidelity surfaces

- Fonts/typography: bundled Inter, readable 16px mobile narration, monospace source, no body text selection suppression. Rendered and inspected.
- Spacing/layout: mobile single evidence view, fixed player, content clearance and 44px primary controls. Measured page width equals viewport at 390 and 320. Desktop retains side lesson and graph/diff structure.
- Colors/tokens: DecompozR dark foundations retained. Red removed, green added, yellow modified references include symbols and accessible labels; numbered focus agrees across story, graph and diff.
- Assets: bundled font/license retained. No decorative image assets were introduced; graph is functional interactive data.
- Copy/content: final narration uses behavioral examples and plain English, in why/what/how/example order. Source method names remain available as evidence. Rationale is tied to the PR description, and declared evidence is distinguished from semantic completion.

## Primary checks

Observed in Chrome: scene Next, chapter selection, Flow/Diff switch, colored reference → correct removed diff, Play → method/call/diff → paused without reading-scene advance, explore → resume same scene, valid agent head/lesson/scene command adopted. Console logs captured after playback contained Vite informational/debug messages and no observed error-level entries. Four reducer/content tests passed (53 assertions), final build passed. Temporary viewport override reset.

## Remaining evidence and feedback

Physical iPhone/Android safe areas, keyboard-open layout, touch feel and reduced motion require real-device verification. Full keyboard journey and screen-reader review were not performed. The user reported that the graph helped more than the narrative and still did not understand much from the current text. Teaching effectiveness is therefore unproven; the user accepted retaining this prototype until a more complicated example PR is available. Further visual/narrative refinement is deferred, not required polish silently claimed as verified.

## Minimal player refinement

The shared draggable player now uses icon-only operations, a 260px surface and compact step/scene metadata. Header actions, graph tools and mobile evidence switches use the same pinned Lucide family. Informational chapter names, narrative, code and change status remain text. See `docs/interface-audit.md` (from the experiment root) for current screenshot evidence and verification limits.

## Whole-PR grouping update (2026-10-13)

Six groups now account for all 14 pinned PR files (452 added, 24 removed), with an expandable evidence list and synchronized group/scene/source focus. Setup, tests and docs are included in the eight-chapter, 32-scene story. The desktop caption shows only the current scene and the slim player remains one row. Same-agent coverage tests and Chrome 390px/desktop checks passed; physical-phone and teaching-effectiveness acceptance remain unverified. See the latest README section and ignored `behavior-groups-desktop.jpg` / `behavior-groups-mobile.jpg` captures.

## Surface real-commit case (2026-10-14)

Surface #70 at 61d6352 is the new default; the import menu retains Flow #32. Real 9-file diff, four groups, removed responsive/added push mode, component configuration edge and binary omission were inspected. Group/source and mobile story/Diff switching passed; tests for this viewer passed. Historical Surface test claims were not rerun. See README for provenance, coverage and current evidence.
