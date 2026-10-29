# V37 changes-only floating toolbar

Date:2026-10-29. Status: implemented and locally tested; independent review, merged-main deployment and actual journey acceptance pending. Parent: [720p round](../../../plan.md), [slice recovery](../semantic-graph-recovery.md). Baseline main662efa29be1e200dfedc8d819b444e1ad24e08d1, PR36 deployed at existing HTTPS8478. The user now explicitly requests a stateful filter button in a restored floating toolbar after asking why unchanged test context dominated the graph. This is implementation authority; standing in-scope merge/deployment authority persists.

Source: [adopted filter contract](../../../../../product/pr-file-tree-first.md#changes-only-floating-graph-control), [pipeline](../../../../../product/source-pipeline.md), [viewport contract](../../../../../product/viewport-scene.md). Expected: one toggle removes unchanged clutter while retaining changed subjects and at most direct neutral relationships. Observed: selected PR25 tests automatically expose all assertions and their contains labels, including unchanged tests. Preserve the complete underlying account and reversible prior working view.

## Scope and acceptance

1. Implement immutable comparison-scoped changesOnly state and public intent, deterministic UI filter mask and named UI Types. Default off. Filter inside current semantic selection, no canonical/extraction/evidence mutation. Hide no-change subjects and edges; changed seeds plus eligible neutral one-hop neighbors only, no recursive context expansion. PR/required coordinate structure retained.
2. Add one compact dark floating toolbar/button over graph, bottom center with safe-area clearance; native aria-pressed/keyboard/touch behavior and isolated input. Existing header+graph remains. Do not restore old toolbar actions or panels.
3. Integrate the semantic mask with full geometry and viewport selection; preserve measured initialization, worker readiness/fallback and current camera/manual/source/reader state. Filter changes must not cause filtered-subset reflow. Semantic exclusion takes precedence over viewport/open/focus pins. Off restores working view.
4. Normal owning tests (baseline145), root/minimum strict, build and bounded mechanical UI detector; independent exact-source review, plus authored actual React desktop/390 checks. Supported browser unavailability stays UNRUN, with no alternate browser-control route.
5. One PR, exact reviewed merge, clean-main build, existing57943→HTTPS8478 deployment and full asset readback including worker. Retain rollback662efa2 and dependencies. Report implementation/local/source review/deployment/live/comprehension separately.

A1: toggle scope/default/typed immutable state. A2: strict no-change exclusion and independent one-hop policy (no fake status/evidence). A3: reversible full-geometry, camera/manual/readers and no source auto-expansion. A4: accessible responsive floating control with no graph gesture conflicts. A5: bootstrap/viewport/fallback correctness and stale intent/results. A6: independent fixtures+pinned corpus+normal checks and explicit actual UI limits. A7: exact-main deployment/readback.

## Implementation handoff v1

Sole implementation writer assigned after committed packet. Worktree /Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-change-filter, branch add-changes-only-toolbar. Allowed seams: review-graph experience/UI/integration, minimal CSS/bootstrap and owning tests, direct docs. No Domain/extraction/status reinterpretation, dependency/runtime addition, owner57944 recovery, global/network/security changes or unrelated UI.

Preserve full model/layout and existing source-unit/disclosure/ReaderStateCacheUI behavior. Prefer a separately projected semantic eligibility mask so filter changes do not erase geometry or auto-reflow. Pay special attention to pre-initialization toggles: full model measurement may need invisible retained elements before applying heavy-content culling. No hidden input or viewport pin may bypass semantic exclusion. Return stable application pin, results, exact artifacts and remaining gates; root owns review/publication/deployment. No independent browser process.

Fresh independent reviewer read-only fixed committed candidate against A1–A7. Check neutral-hop algorithm does not expand via unrelated changed File roots, no-change relationship semantics, initialization/measurement deadlock, focus/open reader pin precedence, no reflow/manual loss and actual UI Types consumed. Actual UI-first account only if supported host available; otherwise source-informed review with graph-first/comprehension UNRUN. Assigned source writer and reviewer/model choices recorded at dispatch.

Temporary checkpoint: new isolated worktree, no prior task artifacts. Raw logs/build/records use ignored .decompozr/flow/run/change-filter. Prior deployed artifacts, rollback and installed dependency targets retained. The user-visible reading benefit is less unchanged clutter; actual readability requires live evidence.

## Implementation evidence v1

Date: 2026-10-29.
Writer: sole delegated implementation executor in the assigned worktree, from packet8803af5. Exact committed candidate is supplied in the executor handoff and must be pinned by independent review before publication. Root owns PR37, review, merge and existing endpoint deployment.

Implemented: explicit comparison-scoped immutable set-changes-only intent, default off; GraphFilterUI and public session operation; deterministic eligibility over the current full view; one compact native pressed button. The documented explanatory-relation allowlist was clarified with the owner before deriving code. Location/contains metadata cannot expand neutral context from changed File/group seeds. Explicit no-change cards and relations remain excluded, including stable contains between changed subjects. No canonical status or witness is changed.

Preservation: filter-only updates reuse the exact full-view/layout input objects. The renderer keeps all coordinate wrappers, dimensions and route geometry, measures excluded content invisibly/inertly before full-scene readiness, then intersects semantic eligibility with spatial membership. Full-render worker fallback still filters. Native inline/unpaired-reader pins are reconstructed from cached disclosure while hidden; source-unit readers use experience disclosure. Matching native remount notifications do not trigger disclosure/reflow. No camera, expansion or layout command is issued by the toggle.

Local verification:

- TDD: the new independent fixtures first failed on absent filter state/public operation after normal graph preparation; seven focused cases now pass. They cover add/remove/change, unresolved direct context without promoting it, neutral second-hop exclusion, changed-File location counterexample, no-change edge between changed nodes, coordinate parents, stale/immutable/reset intents, reversible identity, rapid toggles/lazy source, semantic precedence over viewport/focus/reader pins and fallback, and retained offscreen native-reader cache pins/scroll.
- Pinned PR25 source check: the unchanged disposed-read Test and its assertions/contains routes are excluded on, restored off. Every current no-change subject/relation is excluded. Canonical generated graph SHA-256 remains0b5580423e394ea27e63a7b2d046898a2625c6f96cc31da09a8fcd3a1e14371d. Initial full view210 subjects; on-mask124. This is a source/pure check, not observed screen readability.
- Normal npm run test:reading-journey:152/152 PASS, including all seven new tests (baseline145).
- npm run check: PASS (root strict TypeScript and subsystem boundaries). npm run check:minimum-graph: PASS (strict application and browser-test source).
- npm run build:minimum-graph: PASS. Final task-scoped build uses --outDir with the absolute ignored task build directory. Separate worker remains scene.worker-CD3ness5.js. Existing large-main-chunk warning remains; no bundle-size or physical-device performance claim.
- git diff --check: PASS. One bounded Impeccable detector pass over ReviewGraph.tsx and minimal.css returned an empty finding list; this is mechanical evidence, not visual approval.
- Five actual React browser cases are authored in change-filter-browser.spec.ts and included by the normal minimum-graph E2E config: desktop/390 native button, keyboard/touch/wheel isolation, pressed state, geometry/camera retention; source/native/preview disclosure and scroll, manual node/route positions and source expansion; early toggles and worker fallback. Normal --list inventories17 tests across3 files without launching a browser.

Evidence files: ignored .decompozr/flow/run/change-filter/{tdd-red.log,filter-tests.log,reading-journey.log,root-check.log,minimum-check.log,build-scoped.log,impeccable-detect.json,browser-inventory.log,build/}. The first normal build also wrote the existing configured /tmp/pr-reviewer-reading-journey-evidence/build path; it is retained as uncertain shared generated output, not deployment or sole recovery evidence. Existing preview processes, deployed artifact, rollback, dependency targets, Tailscale and security settings were not changed.

Open gates: actual browser, visual, desktop/390 interaction, early-toggle measurement, own-PR37 dogfood and unfamiliar-reviewer comprehension remain UNRUN because the supported browser host is unavailable per the owner's retry. No independent browser process was launched. Source/local evidence does not waive these gates. Independent exact-source review is pending. Deployment is pending with root; HTTPS8478 still serves baseline662efa2 until the reviewed main candidate is built, deployed and read back.

Reader outcome: intended benefit is less unchanged context while retaining changed subjects and direct explanations. Evidence currently supports deterministic source eligibility and reversible state, not easier actual reading. The core gap is actual candidate interaction/readability and unfamiliar-reviewer understanding. The next step is fresh review of this fixed candidate, then exact-main endpoint delivery and the authored journeys; no ontology, source evidence or wider UI scope changes are needed.

## Independent-review handoff v2

Review the fixed commit supplied by the executor against A1–A7, adopted durable contract and this evidence; source writer stops writes except bounded review fixes. Concentrate on full-view identity and layout invalidation, no-change relationship semantics, one-hop seed boundaries, bootstrap measurement/inertness, mask precedence in fallback and stale spatial replies, native reader pins/scroll after hidden DOM removal, native remount toggle guards, focusability of excluded ReactFlow wrappers and labels, and accessible control/gesture ownership. Run relevant checks independently. Browser/source/understanding evidence remains separate. No successor slice is declared ready by these local results.

## Review correction v1 — layout ownership

Date: 2026-10-29.
Status: P1 confirmed at candidate1c23f82; repaired and locally retested in the follow-up candidate. Independent re-review and actual A3/A5 browser acceptance remain pending despite local PASS.

Expected: layout operates on the authoritative full model and accepts only measured geometry from the renderer. Observed by independent source review: InitialLayout passed ReactFlow.getNodes() directly into initialLayout, which spreads node/data/style. With an early toggle or a reflow while filtering, those nodes carry hidden/pointer/focus/measurement-only projections; apply persisted them into authoritative state and later off could return poisoned nodes. Existing tests did not exercise this renderer→layout feedback boundary.

Accepted bounded repair: pass the current full nodes to InitialLayout; import only exact-ID finite positive measured width/height from ReactFlow, then lay out that full model. Add independent early-on→layout→off and reflow-while-on→off regressions, including data/style/interaction ownership and geometry correctness, and author the corresponding actual React journeys. No semantic filter policy or unrelated UI changes. Repeat affected normal checks and return a new fixed candidate for independent review. Actual browser availability remains a separate gate.

Implemented correction: InitialLayout now receives the authoritative full nodes explicitly. withMeasuredGeometry imports only valid measured width/height from observed nodes by exact ID before initialLayout; observed data, style, position, focusability, dragging and culling/measurement flags are ignored. The same boundary protects source reflow after ordinary offscreen viewport culling. Durable viewport and filter contracts now both state this ownership rule.

Correction evidence: independent hostile observed-store fixtures cover early filter activation, reflow while on, and offscreen viewport cull followed by reflow/return. They assert exact authoritative data/style/interaction purity, expected layout coordinates and measured geometry, immutable inputs, and rejection of foreign IDs/nonfinite/nonpositive measurements. The missing boundary first failed before the helper existed; all11 focused tests pass. Normal reading-journey suite now156/156 PASS. Root strict/boundary check and minimum strict TypeScript pass; git diff --check passes. The task-scoped follow-up Vite build is retained at ignored change-filter/build-layout-fix/ with layout-fix-build.log; previous verification build is retained.

Actual browser source is strengthened: early-toggle off now frames the unchanged card and requires it to be visible with normal pointer/visibility styles, rather than checking only pressed state/coordinates. Added filtered disclosure+expansion reflow→off→visible unchanged card, and ordinary viewport-cull→source-reflow→visible return cases. Seven new-slice browser cases are inventoried through the normal E2E config (19 total across3 files); execution, visual review and comprehension remain UNRUN. The original mechanical detector receipt remains the single pass; this repair changes model/layout input ownership without new visual styling. Logs for the correction use layout-fix-*.log in the ignored task directory. Independent reviewer should rerun its masked-store repro against the new fixed source and verify the actual InitialLayout wiring, then report A3/A5 source evidence separately from unrun browser evidence.

## Final independent source-review receipt

Date: 2026-10-29.
Reviewed application source: ff2e7bb43974183d044330d15010e408740fc7da.
Status: independent source re-review PASS; no remaining source blocker. The P1 render-projection→authoritative-layout feedback defect is resolved at this exact source pin.

The owner relayed the final independent receipt:11/11 focused regressions and the normal156/156 reading-journey suite passed independently, together with root/minimum strict TypeScript, subsystem boundaries and diff checks. The reviewer did not independently rerun the browser journeys or Vite build. Executor build evidence remains scoped to the follow-up candidate and retained build-layout-fix artifacts; the coordinator owns the final merged-main build and asset comparison.

Acceptance limits remain explicit: A4 actual keyboard/touch/native-button/gesture behavior and visual conformance are UNRUN. Actual early-toggle/bootstrap measurement, reader disclosure/scroll restoration, camera/manual retention, live endpoint journeys, own-PR dogfood and unfamiliar-reviewer comprehension are UNRUN because the supported browser host remains unavailable. Source review and pure tests do not establish those outcomes. Deployment is still pending with the owner; the existing endpoint is not claimed to serve this candidate by this receipt.

Next owner action: publish the exact candidate through the existing PR, merge the reviewed source, build clean verified main, deploy through the established endpoint workflow and compare final assets with the retained candidate build. Preserve the unrun actual-journey and understanding gates separately from source acceptance. This receipt is docs-only; it changes no application source or test expectations.
