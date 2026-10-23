# PR Reviewer

Next-version architecture: [Agent-attached React / React Flow change canvas](docs/system-design.md), with Node.js/TypeScript and SQLite plus evidence files. The architecture is accepted direction, not an implemented migration. The retained prototype is React/Vite/Three.js. See [project transfer](docs/project-transfer.md) for import provenance and current validation.

## Question and scope

Can a synchronized, step-by-step lesson teach a reviewer where a PR changes behavior, who calls a method, and how the change propagates, while keeping the actual diff visible?

Implemented prototype: the selected dark lesson/graph/diff layout, live GitHub PR import, source diff, exploration/resume, and an agent focus stream. The Flow #32 lesson is manually grounded in head `4e1e59bf0a0808d10a56817d2021703aadd4d266`. General imports show file changes; automatic semantic reconstruction is not implemented.

## User story

A reviewer unfamiliar with a PR wants to understand important behavior before making a review decision. They follow numbered lessons, see synchronized graph nodes/calls and a focused diff hunk, explore files, and resume the saved lesson. Added, removed, modified and context states have text labels as well as colors. Import errors preserve the current PR. Missing patches and unmodeled callers remain explicit. Acceptance requires the reviewer to trace a changed caller through actual code, identify a failure condition and return from exploration without losing their position.

## Setup and run

Requires existing Bun and authenticated GitHub CLI (`gh`). No AI API credentials are used. No new system runtime is installed.

```sh
bun install
bun --bun run dev --port 4173 --strictPort
bun --bun run build
bun test
```

The local development app uses `http://127.0.0.1:4173/`. The dev server binds loopback. Import PR uses GitHub CLI read-only calls with strict GitHub PR URL parsing and argument arrays. It preserves base/head, paginated files, status, rename paths and nullable patches. Raw PR data stays in memory; the optional CLI exporter should write private output under ignored `.decompozr/` rather than tracked files.

```sh
bun scripts/import-pr.mjs https://github.com/owner/repo/pull/123 /absolute/ignored/output.json
```

Production static builds do not provide import/focus APIs; those are local Vite middleware. Hosting is outside this experiment's delivery scope.

## Historical source Tailscale preview

Historical source-worktree preview (preserved, not moved or reverified by this transfer): `https://mac-mini.duckbill-ionian.ts.net:8466/`, proxying loopback port 4173. Existing Serve handlers were preserved and Funnel is not enabled for this port. The exact HTTPS origin is allowed for PR import; arbitrary origins remain rejected. On 2026-10-11, HTTPS returned 200 and the proxied importer returned Flow #32 with 14 files and a complete file list. This is same-machine network/API evidence, not remote-device or visual acceptance. The detached task preview process and its log are recorded under ignored `.decompozr/flow/run/pr-diff-teacher/`; no login/startup daemon was installed.

Disable only this task proxy with `tailscale serve --https=8466 off`.

## Design system

Reuses DecompozR Design System `0.0.0` source commit `d065f955b20d961d3f8291414f1fb7b41d843eeb`: unchanged `semanticColors.ts` and `palettes.ts`, bundled Inter and its OFL license. These source snapshots live in `src/design-system/` and `public/fonts/`. The React starter uses those actual foundation tokens; Svelte controls are not imported. Custom application controls follow the documented density, 4px control radius, 6px surface radius and quiet separator grammar. Functional graph connectors represent relationships, rather than decorative image assets. Diff status and review risk are separate meanings.

Visual target: selected third concept refined with synchronized teaching focus, stored at `/Users/scottchu/.codex/generated_images/01a1280a-3618-7c41-b70d-71d40fafd60f/exec-b32a6ac2-4f1f-4503-9f5d-19c989924bd3.png`. Generated mocks contain illustrative code; the implementation renders actual GitHub patches.

## Agent focus contract

A local agent can send a pinned-head focus command to the running preview:

```sh
curl -H 'X-Pr-Teacher-Agent: 1' -H 'Content-Type: application/json' \
  --data '{"head":"4e1e59bf0a0808d10a56817d2021703aadd4d266","lessonId":"decision"}' \
  http://127.0.0.1:4173/api/focus
```

Lesson IDs: `dispatch`, `caller`, `decision`, `guard`, `failure`. The client rejects a command for a different imported head. A command with `path`, `nodeIds`, optional `edgeId` and literal `match` can focus arbitrary imported source. No code is evaluated. The browser receives server-sent events and dispatches `pr-teacher:focus`; the same head-pinned CustomEvent is also the client adapter. `deliveredTo` counts stream connections, not proven UI adoption. Commands are ephemeral and do not replay after reconnect. The lesson is manually authored; no agent runtime is automatically connected.

## Step explanations

Each pinned lesson explains behavior in plain English, in why → what → how → example order. Active narration lives in `src/story-copy.js`; the UI automatically focuses matching graph nodes and unified diff evidence. Colored references can refine that focus. The player and scene progression are described in `docs/mobile-storytelling.md`.

## Observable acceptance

- Eight steps synchronize lesson position, highlighted method/call and source diff location.
- Previous, next, replay, exploration and resume preserve intended teaching state.
- Green `+`, red `−`, amber `~` and gray context remain labeled in all relevant views.
- Unified diff retains deleted lines; no before/after view is used.
- A second PR imports without reusing the pinned Flow method model.
- Invalid URL and cross-origin import fail without losing the current lesson.
- Desktop and narrow layouts, keyboard focus, reduced motion and client focus adoption are inspected in a real browser.

## Results and limitations

Verified by same-agent source/build/API checks on 2026-10-11:

- Bun dependency install and full Vite/Sites-artifact build passed.
- Flow #32 imported 14 files at the pinned head; the full file count agreed with GitHub metadata.
- Flow #33 imported one file with a complete file list; it does not match the curated head.
- Invalid URL and cross-origin import rejection passed.
- Focus POST delivered the exact head/lesson command to one test SSE connection. This is transport evidence only.

Initial browser verification was blocked by unavailable browser surfaces and `cgWindowNotFound`. Chrome access later recovered. Responsive browser checks at 390×844 and 320×720 verified player controls, same-scene Flow/Diff switching, semantic-reference focus, focus playback stopping for reading, exploration/resume, and live agent lesson/scene adoption. Desktop 1440×1024 was inspected alongside the selected visual target. No captured error-level console messages were observed. Four player state tests (53 assertions) and the final build passed. Physical-phone safe areas, software keyboard, touch feel and reduced-motion device behavior remain unverified. See `design-qa.md`.

GitHub patches may omit binary or large diffs or truncate a textual patch. A complete file list does not prove complete patch content. No general AST/call graph, automatic lesson synthesis, backend persistence, hosted import, automatic approval or measured review-quality improvement is claimed.

## Next step

Evaluate a more complicated representative PR and add a validated semantic teaching model before claiming general method-level teaching. Physical-phone acceptance remains pending.

## User feedback and experiment disposition

The user reported that the current narrative still did not establish much understanding; the top call-flow graph provided the most immediate understanding. The current prototype is good enough to retain until a more complicated example PR is available. This is evidence for a graph-led next experiment, not evidence that the teaching hypothesis passed. Further graph redesign and narration polish are deferred.

Narration clarification: evidence is already focused by the UI. Removed locate/find/look instructions and renamed the first chapter to "How requests are handled". Build passed and live Chrome readback confirmed the new heading/title and absence of the locate wording.

## Graph and minimal operation controls (2026-10-11)

Implemented an orthographic Three.js call graph with actual node-port connections, arrows, pan, zoom, fit and focus. Accessible DOM labels use the same projected coordinates as rendered geometry. The graph is lazy loaded and renders on changes; GPU resources are disposed on teardown. Generic imports keep a file map without invented caller edges. The left information pane is 260px on desktop. `decideTaskStop()` is marked as the core change.

The draggable floating player is centered across the whole page and is now 260px wide. Previous, replay/pause, next, chapter selection and drag use icons. Header actions, graph navigation, follow-focus, explore/resume, file drawer close and mobile Flow/Diff use the same pinned Lucide geometry as the DecompozR design system. Each operation retains its accessible name and native title tooltip. Story, file, step and change labels remain text because they carry review information. Chapter choices retain descriptive names.

Same-agent verification: build passed; seven state/layout tests passed with 87 assertions. Chrome desktop 1440×1024 and mobile 390×844 checks confirmed icon controls, scene synchronization, replay/pause, keyboard player movement/reset, chapter navigation, Flow/Diff, zoom/fit, importer opening and file drawer closing. No error-level console messages were captured. Temporary viewport override was reset. No physical-phone or screen-reader acceptance is claimed. Three.js produces a 545.64kB minified lazy chunk (139.91kB gzip); the build retains its size warning.

See `docs/interface-audit.md` for the findings and evidence. Teaching effectiveness remains unproven; these changes address interface clarity, not measured comprehension.

## Single-row player (2026-10-13)

The floating player is now one horizontal row: drag handle, previous, replay/pause, next and a scene counter (1/20 through 20/20). The counter opens the existing chapter menu. The separate chapter icon and progress bar were removed. Height is 54 CSS pixels including border and padding; operation targets remain 44px. Existing exploration/resume behavior is retained. The same row styles apply on mobile, with smaller bottom content clearance. Build passed; native Chrome live screenshot inspection and previous/next scene navigation passed after restoring the stopped task preview process. Mobile and physical-device acceptance were not repeated for this refinement. Evidence: ignored task screenshot `slim-player-desktop.png`.

## Whole-PR behavior context (2026-10-13)

The pinned Flow #32 model now assigns all 14 changed files exactly once to six groups: handle requests, decide whether to continue, remember the attempt, support local setup, check the behavior, and explain use and limits. Group totals are computed from imported GitHub metadata (452 additions, 24 removals); they are file-change totals, not semantic proof or a claim of complete patch bytes. Large documentation additions are explicitly distinguished from executable implementation, including source examples reproduced in docs.

A compact overview replaces the duplicate sidebar step list. Each group shows an icon, descriptive information label and change totals, with one short explanation and an expandable file list. Group selection chooses its guided step and source; scene navigation keeps the active group in sync. Exploring a group's file preserves the current story position. All changed lines in the displayed group file retain status color and a group rail, with stronger emphasis on the current source anchor. The graph still represents only verified source call relationships; setup, tests and docs do not invent method edges.

The guide now includes setup, test and documentation chapters: eight chapters and 32 reading scenes. Desktop narration shows only the current scene; the slim player stays one row. On mobile the group strip scrolls horizontally and keeps its active item visible. New behavior descriptions are manually curated for the exact pinned head. Other PRs receive an explicit file-only group; unexpected files are shown as unmapped rather than silently excluded.

Same-agent verification: 10 state/layout/coverage tests passed with 133 assertions; the build passed. Chrome checks exercised decision-group selection (all 33 added lines marked), test chapters, both test file diffs, resume, documentation chapter, Next and mobile Flow/Diff. At 390×844, page width was 390px and player height 54px. The active group stayed visible; native graph labels had no vertical overflow on desktop. No error-level console entries were captured. Viewport override was reset. Physical-phone, full screen-reader and measured comprehension acceptance remain pending. The lazy Three.js build size warning remains.

Evidence: ignored runtime captures `behavior-groups-desktop.jpg` and `behavior-groups-mobile.jpg`; coverage tests live in `tests/behavior-groups.test.js`. User story: a reviewer first understands the whole PR's categories, selects a behavior, follows its explanation/calls/source, then explores all supporting files or resumes the story. Acceptance requires conserved totals, no missing files, synchronized focus and no invented behavior for an unmodeled PR.

## Second real branch example: Surface navigation repair (2026-10-14)

The default example is now [Surface PR #70](https://github.com/decompozr/surface/pull/70), pinned to commit `61d6352195e78757790eb284cdda93ffdd348664` from `fix-navigation-and-design-mount`, against base `dc55fa88fc7661a518bd99aed369fe07dfecc800`. GitHub PR metadata and local immutable Git source were inspected; the head is the real navigation/package repair commit. Flow #32 remains selectable in the importer via the Example change menu. This uses the existing PR importer for the commit's matching PR; arbitrary standalone commit URLs are not yet supported.

The model in `src/surface-example.js` covers all nine files exactly once: navigation behavior, Design package alignment, regression checks, and evidence/limits. Metadata totals are 119 additions and six removals. Most additions (104 lines) define regression checks rather than new UI behavior. All eight source anchors were independently checked against the imported pinned patch. The binary provider archive remains explicitly patch-unavailable.

The graph shows the verified SurfaceShell → AppShell configuration relationship, labeled `configures`. It does not invent Flow callers or infer the provider implementation from its binary package. The story explains the removed responsive setting, added push setting, frame sampling, Escape/focus, package identity, mounted routes and historical evidence boundaries. Historical reported acceptance is distinguished from checks performed on this viewer today.

User story: a reviewer selects a real branch change, understands why a one-line UI fix accompanies many test/package lines, follows each group into source, inspects binary limitations, and switches back to the original Flow case. Grouping and narrative remain manually authored and gated by repository, PR number and exact head; this is not automatic semantic extraction.

Same-agent verification: build and 11 tests / 196 assertions passed. Chrome verified Surface import, configuration graph, removed-line focus, grouped package files, binary omission, Flow → Surface switching, default Surface reload, and a 390×844 story/Diff check with no page-width overflow and a 54px player. No error-level console messages were captured during the inspected interaction sequence. Viewport override was reset. Surface's own historical regression suite was not rerun, and no physical-device or measured comprehension acceptance is claimed. Evidence: ignored `surface70.json`, `surface70-desktop.jpg`, `surface70-mobile.jpg` in the task runtime directory. The existing lazy Three.js size warning remains.
