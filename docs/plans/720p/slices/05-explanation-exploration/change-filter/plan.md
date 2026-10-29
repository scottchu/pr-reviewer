# V37 changes-only floating toolbar

Date:2026-10-29. Status: implementation ready. Parent: [720p round](../../../plan.md), [slice recovery](../semantic-graph-recovery.md). Baseline main662efa29be1e200dfedc8d819b444e1ad24e08d1, PR36 deployed at existing HTTPS8478. The user now explicitly requests a stateful filter button in a restored floating toolbar after asking why unchanged test context dominated the graph. This is implementation authority; standing in-scope merge/deployment authority persists.

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
