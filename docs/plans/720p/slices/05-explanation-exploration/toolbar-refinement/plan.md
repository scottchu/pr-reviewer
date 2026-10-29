# V38 draggable icon toolbar

Date:2026-10-29. Status: implementation ready. Parent: [720p round](../../../plan.md) and [V37 filter](../change-filter/plan.md). Baseline mainc7a2b25808e419a2d7423043d52742a9edb198aa / PR37 deployed at existing HTTPS8478. User feedback: toolbar is not draggable; controls should be icons only, with names limited to hover/aria. [Durable contract](../../../../../product/pr-file-tree-first.md#changes-only-floating-graph-control) now captures the correction before code.

Owner: root implements this bounded follow-up directly on branch make-graph-toolbar-draggable in /Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-toolbar-refinement. No changes to filter semantics, Domain, evidence, geometry/layout/worker behavior or reader state. No new dependencies, network/security settings, owner57944 actions or legacy controls.

1. Extract the small toolbar UI with named local position/bounds/gesture types, pointer-captured grip movement and pure CSS-coordinate clamping. Default bottom-center safe-area placement, resize clamping and cleanup; keyboard arrows on grip. No graph-zoom division or camera commands.
2. Remove visible filter text; supply accessible label/native hover title, retain pressed styles and44px targets. Grip is a separate icon so dragging cannot activate filter.
3. Meaningful drag/clamp/cancel unit checks, authored desktop/390 interaction/resize/keyboard/toggle/camera checks; normal owning suite (baseline156), root/minimum strict, build and bounded mechanical UI detector. Actual browser remains UNRUN if supported host unavailable, with no alternate browser-control route.
4. Fresh independent exact-source review then one PR, authorized exact-head merge, clean-main build, existing57943→HTTPS8478 deployment and complete asset readback. Retain rollbackc7a2b25 and required donor/worktree/evidence. Report engineering/deployment/actualUI/comprehension separately.

Acceptance: grip dragging in CSS pixels stays within available layer bounds and never changes filter/camera; pointer cancellation/lost capture ends movement; keyboard repositioning and resize remain usable; filter icon has no visible text and retains hover/aria/pressed semantics; native reader/full geometry and all filter cases remain intact. State lasts for the current mounted UI, without account/browser persistence.

Independent-review handoff v1: fresh reviewer read-only fixed committed candidate vs these requirements and baseline. Check pointer capture/lost/cancel, drag versus click separation, coordinate basis and responsive bounds, observer cleanup, keyboard/native accessibility and filter-state retention. Actual UI-first/graph-first only through supported browser; otherwise explicitly source-informed review with actual gestures/visual/comprehension UNRUN. Root owns publication/deployment.

Temporary checkpoint: fresh isolated worktree, no prior runtime artifacts. Logs/build/records under ignored .decompozr/flow/run/toolbar-refinement; existing deployment/rollback/dependencies preserved. Reader benefit: reposition the control so it does not obstruct evidence, while keeping chrome compact. Actual benefit awaits actual UI evidence.
