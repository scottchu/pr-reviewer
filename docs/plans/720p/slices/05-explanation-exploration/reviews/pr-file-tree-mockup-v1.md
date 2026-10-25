# PR25 filename tree mockup — implementation/review handoff v1

Date: 2026-10-24.
Status: implemented with bounded author checks; independent source/visual review pending. This is a deliberately simple file tree, not semantic/product acceptance.

Parent: [05 explanation/exploration](../plan.md). Source: [file-tree-first product contract](../../../../../product/pr-file-tree-first.md). This latest explicit user scope temporarily simplifies the larger spatial overview. The actual October23 Dependency Lens and Scope Microscope references were viewed; no new style or generated image is introduced.

Base EXACTba4a872e15a540065d5a71dbdfde8d7b267a1148. Isolated worktree /tmp/pr-reviewer-pr-file-tree, descriptive branch mockup-pr25-filename-tree. Editable implementation only mockups/pr-file-tree/ plus these scoped docs/map. Production src/config/package/backend/schema/dependencies and all earlier worktrees/runtimes remain unchanged.

## Concrete outcome

All50 exact PR25 changed paths become stable full-path file nodes under directory branches. Visible text is basename/directory component only, one compact unboxed line. Full-path tooltip/accessibility disambiguates duplicates. Containment edges define the base tree; the latest amendment below adds only selected-file static relative imports. Whole tree exists before interaction; pan/zoom exposes offscreen nodes at readable scale. Main window is the canvas, no page scroll. One quiet reset-view control; no function cards, body prose, badges, Focus buttons, story/player, subsystem navigation, detail or comment panel.

PR: https://github.com/scottchu/pr-reviewer/pull/25. Baseline b096826e31c0927190806de91ed70b8b64aa93d8; head e3b270e5f49a9215452b0b86702946043e979059. Fixture generated from git diff --name-only -z on these exact objects, not the moving checkout. Fixture hash and complete path count recorded after generation. Pure tree model is independent of React presentation; existing ReactFlow/installed donor dependencies only, task-private caches, no install.

## Proportionate acceptance/checks

TDD pure checks: complete50-path coverage, stable distinct IDs for duplicate basenames, segment-safe directory prefixes, one exact parent/contains edge per node except root, deterministic readable non-overlapping layout. Actual authored Chrome: all50 file nodes exist, pan changes viewport, graph zoom changes scale, reset restores readable initial framing,390px canvas remains usable with no outer page scroll and filenames do not become full-width cards. Strict task TypeScript and mock build. Capture desktop and390px actual rendered tree; evaluate typography/density/containment against the stated simple view separately from click success. No old broad baseline or semantic checks.

## Independent review handoff

After ready, root reviews source membership/identity and visual simplicity. Confirm all50 exact paths are present, duplicate filenames remain independent, edges have containment meaning only, no large cards/prose/panels appear, readable framing and full-window pan/zoom work. The separately denied independent UI-browser gate remains unrun; no alternate browser route or permission bypass. Author Chrome captures are engineering evidence, not unfamiliar-reader comprehension or physical pinch acceptance.

## Launch/stop

New private loopback127.0.0.1:56677, strictPort, exact allowed host mac-mini.duckbill-ionian.ts.net. Root alone assigns authorized Serve8477 after local health. Worker changes no network configuration. Preserve8472–8476 and their source/runtime/data. Return quick local milestone then clean source/build/fixture pins, desktop390 captures, checks/knownlimits and minimal manifest. Stop at this filename tree; no feature expansion or production integration/merge/deploy.


## Latest bounded change-signal amendment

Root confirmed the filename-only geometry in actual1440/390captures. The next correction preserves it: exact Git A/M/D prefix/color (actual4A46M), full-path/status accessibility; no badges/cards/body text. A following bounded selected-file relative static-import overlay may use existing TypeScript tooling on immutable Git objects, with side/line/specifier/source and target hashes. It is fixture preparation, not new backend analysis capability. Membership diff colors are file-level imports, never call/runtime claims. Preserve all50changed nodes; optional one-hop unchanged targets remain gray source-pinned filenames. No broad pipeline or hidden source claims. If import preparation is not quick, expose the clean status tree first and record that gap.

One actual touch-pinch check initially did not change scale: touch emulation was enabled only after the graph had initialized. The bounded browser fixture will establish touch capability before navigation, preserving the pinch assertion; this does not establish physical touch acceptance. Desktop drag/scroll/Control-wheel/reset already passed. No unrelated browser suite is involved.


## Clean delivered source and running milestone

Final rendered/build/browser source: **25c51b0f361216a92ba0bfc4599e4cb6f6531043**. Task branch mockup-pr25-filename-tree, isolated /tmp/pr-reviewer-pr-file-tree, exact baseba4a872e15a540065d5a71dbdfde8d7b267a1148. The current closeout is docs-only. Earlier eddb4b5 recorded scope before code;3c43070 documented the change/import amendment;ddace3575e7acecc9c72b30f72432952bfa7a085 was the useful clean change-colored tree with imports explicitly pending. No production src/backend/schema/config/package or dependency changes.

Local runtime: Bun PID79743, existing Bun1.4.2/Vite8.0.3, bound127.0.0.1:56677 with strictPort and exact allowed host. http://localhost:56677/ and exact-host local request returned200. Root separately exposed https://mac-mini.duckbill-ionian.ts.net:8477/ and reported HTML/client/main200 with no8477Funnel; the worker changed no network settings. All earlier preview/product runtimes are preserved.

Own PR25 comparison baselineb096826e31c0927190806de91ed70b8b64aa93d8 → heade3b270e5f49a9215452b0b86702946043e979059 remains separate from mock source. paths.json SHA-256 **ecc1e8b23548babef8f8fade4dc2a0183a67fd288ab856de47b7dc14a9f1c2e3** records exact50changed paths/statuses,4A46M0D. imports.json SHA-256 **388b74421bd88ec6414d0cec5157edaf46719326221e18f131be7cabc17329e6** records240static-relative citations across56code-source sides,0unresolved in this fixture. Source/type imports are not runtime/call evidence. All50changed nodes stay fixed while selected import context/edges appear; repeated basenames retain distinct full-path IDs.

Current manifest: /tmp/pr-reviewer-pr-file-tree-evidence/manifest-25c51b0.json, SHA-256 **719d7b4d75cd7eb94059c67387429250543aa19dd2375bfeed174eed9107fbc3**. It separates final source-bound captures/checks/build hashes from historical moving uncolored captures and prior milestones. Build output is /tmp/pr-reviewer-pr-file-tree-build; emitted JS/CSS/font hashes are in the manifest. The build passes with the tool's504.09kB mock-JS chunk warning; no chunk limit/config suppression or dependency change was made.

## Exact observed checks

- Eight pure tree/import tests PASS: exact Git paths/statuses, duplicate filenames/prefix-safe containment, non-overlap/determinism, invalid-path handling, all240source/target citation hashes/ranges, selected helper/retained module/context membership and unresolved-target behavior. Raw pure-imports.log. This ran after final pure-module changes and before the final renderer-only curve refinement; pure modules are unchanged at25c51b0.
- Task strict TypeScript and mock build PASS on the exact25c51b0contents. Raw strict-imports.log/build-imports.log.
- Three actual authored Chrome journeys PASS at clean25c51b0 in2.8s. Desktop verifies all50paths/filename-only geometry, drag/scroll/Control-wheel/Overview.390px verifies pre-enabled synthetic touch pinch, readable scale, keyboard pan/zoom/root Overview and no page scroll. Selected review.ts verifies5static module links, added helper citation, retained imports, two distinct public.ts context nodes, all50changed paths retained and Escape clearing only temporary context. Raw browser-imports-clean.log.
- Earlier aca7fd4 had4purePASS, desktopPASS and synthetic pinchFAIL under late touch emulation;ddace35 had5purePASS and2ChromePASS with imports pending. Those logs are historical and are not relabeled as final import checks. The import TDD missing-module RED is retained in imports-red.log; generator record output is import-preparation.log. No forced actions or altered independent browser policy were used.

## Final authored visual evidence and critique

Six final capture files under /tmp/pr-reviewer-pr-file-tree-evidence/ are source-bound in the manifest: desktop.png, desktop-panned-zoomed.png,390.png,390-panned-zoomed.png,desktop-selected-imports.png,390-overview.png.1440-first.png and390-first.png remain earlier uncolored moving-source captures, explicitly historical.

The first view is finally the requested simple spatial file tree: unboxed single-line names, narrow containment branches, full-window canvas and one quiet Overview control. No cards, descriptions, source bodies, Focus buttons, story/player, subsystem tabs or discussion panels occupy it. The October23 dark editor/Inter/quiet-chrome foundation is retained, while the later explicit filename-only scope deliberately omits its larger node content. Git prefixes/color expose the actual changed/added distinction without adding bodies/badges. The selected-file overlay adds a small source-grounded module account instead of fictional function arrows. Reading geometry is preserved; the renderer routes existing-file import curves outside their text rather than covering names. Gray same-basename targets remain distinguishable by exact full-path/source tooltip/accessibility.

Limits: filenames are legible at initial100% scale; not all50fit the first viewport and no tiny fit-all is claimed. Narrow initial framing emphasizes actual source filenames; Overview restores the PR root/parents, and pan reaches all members. Selected import edges may cross each other; only one changed file's outgoing relations are displayed. Type imports do not establish runtime dependency. The static fixture omits dynamic/package imports, exports, callers/callees and behavior inference. It is not a full semantic graph or an explanation of every change. Synthetic touch/keyboard journeys and author screenshots do not establish physical-device or unfamiliar-reader comprehension. The independent UI-browser gate remains denied/unrun, with no retry or alternate route. Root owns subsequent source/visual critique and user inspection; no new review/adoption is claimed here.

No further features are planned in this task. Durable observed responsibility/provenance/limits are reconciled in pr-file-tree-first.md. Stop at this reviewable filename/change/import map; production composition and broader semantics remain outside the delivered scope.


## File-object/diff and external-import amendment before derived changes

Latest user rejects bare filename text as sufficient nodes. Continue the same isolated mock/runtime: compact bounded file surface with filename+change mark only at overview; semantic zoom/explicit activation reveals that file's real pinned Before/After hunks in place, same ID and attached header connectors. Whole50-file membership and neighboring relations remain. One detail file near the zoom focal point; zoom out collapses. No body/prose cards at overview, new page/modal/panel/story or production scope. For proposed local space reservation, keep the file header origin fixed and push downstream rows enough to avoid expanded-body overlap; keep directory identity and root frame, no automatic refit. Native source selection and inner scroll do not pan.390px stacks Before/After within the same node.

Prepare all50 files' exact native Git diff hunks from the pinned comparison, recording full-source side hashes and exact line/range provenance. Pure checks cover hunk bytes/line inventories, one-file semantic-detail hysteresis/focal choice and compact/expanded membership/space reservation. Actual React checks cover same-file overview→zoom/explicit diff→zoom out with context retained, red/green true source lines, native selection/local scroll, desktop/390. This is the bounded first milestone, not full production semantic zoom or a new parser/backend.

Root's exact source finding: scripts/dev.ts baseline line4 imports readFileSync/existsSync from node:fs and head removes that entire static module import. The previous relative-only fixture correctly had0removed relative modules but omitted this real external removal. Extend the existing prepared static-import fixture to built-in/package identities with typed external nodes and exact side citations; never resolve them as repository files or invent a target hash. Add a regression for the removed node:fs edge and preserve the50changed-file set. Source/import scopes and earlier evidence remain historically attributed rather than relabeled.

Explicit-focus geometry clarification: gesture disclosure preserves the camera; explicit file activation may translate once at its existing scale to reveal the requested header/detail, especially on390px. This is the focused reading action, not an automatic fit-all or a new route.
