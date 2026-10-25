# PR25 filename tree mockup — implementation/review handoff v1

Date: 2026-10-24.
Status: implementation authorized; author checks and independent source/visual review pending. This is a deliberately simple file tree, not semantic/product acceptance.

Parent: [05 explanation/exploration](../plan.md). Source: [file-tree-first product contract](../../../../../product/pr-file-tree-first.md). This latest explicit user scope temporarily simplifies the larger spatial overview. The actual October23 Dependency Lens and Scope Microscope references were viewed; no new style or generated image is introduced.

Base EXACTba4a872e15a540065d5a71dbdfde8d7b267a1148. Isolated worktree /tmp/pr-reviewer-pr-file-tree, descriptive branch mockup-pr25-filename-tree. Editable implementation only mockups/pr-file-tree/ plus these scoped docs/map. Production src/config/package/backend/schema/dependencies and all earlier worktrees/runtimes remain unchanged.

## Concrete outcome

All50 exact PR25 changed paths become stable full-path file nodes under directory branches. Visible text is basename/directory component only, one compact unboxed line. Full-path tooltip/accessibility disambiguates duplicates. Containment edges are the only relationship. Whole tree exists before interaction; pan/zoom exposes offscreen nodes at readable scale. Main window is the canvas, no page scroll. One quiet reset-view control; no function cards, body prose, badges, Focus buttons, story/player, subsystem navigation, detail or comment panel.

PR: https://github.com/scottchu/pr-reviewer/pull/25. Baseline b096826e31c0927190806de91ed70b8b64aa93d8; head e3b270e5f49a9215452b0b86702946043e979059. Fixture generated from git diff --name-only -z on these exact objects, not the moving checkout. Fixture hash and complete path count recorded after generation. Pure tree model is independent of React presentation; existing ReactFlow/installed donor dependencies only, task-private caches, no install.

## Proportionate acceptance/checks

TDD pure checks: complete50-path coverage, stable distinct IDs for duplicate basenames, segment-safe directory prefixes, one exact parent/contains edge per node except root, deterministic readable non-overlapping layout. Actual authored Chrome: all50 file nodes exist, pan changes viewport, graph zoom changes scale, reset restores readable initial framing,390px canvas remains usable with no outer page scroll and filenames do not become full-width cards. Strict task TypeScript and mock build. Capture desktop and390px actual rendered tree; evaluate typography/density/containment against the stated simple view separately from click success. No old broad baseline or semantic checks.

## Independent review handoff

After ready, root reviews source membership/identity and visual simplicity. Confirm all50 exact paths are present, duplicate filenames remain independent, edges have containment meaning only, no large cards/prose/panels appear, readable framing and full-window pan/zoom work. The separately denied independent UI-browser gate remains unrun; no alternate browser route or permission bypass. Author Chrome captures are engineering evidence, not unfamiliar-reader comprehension or physical pinch acceptance.

## Launch/stop

New private loopback127.0.0.1:56677, strictPort, exact allowed host mac-mini.duckbill-ionian.ts.net. Root alone assigns authorized Serve8477 after local health. Worker changes no network configuration. Preserve8472–8476 and their source/runtime/data. Return quick local milestone then clean source/build/fixture pins, desktop390 captures, checks/knownlimits and minimal manifest. Stop at this filename tree; no feature expansion or production integration/merge/deploy.
