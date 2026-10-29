# Viewport-driven graph presentation

Status: adopted bounded implementation. Date: 2026-10-28.

## Reader outcome and scope

Readers must be able to pan, zoom, inspect source and move existing graph items without preparing and mounting every offscreen detail for each interaction. Preserve the existing source-comparison account, exact evidence, semantic colors, file ordering/indentation, document groups, test lane, camera and gesture ownership. This presentation optimization does not change extraction, ontology, comparison or admission policy. The [source pipeline](source-pipeline.md) remains authoritative for those responsibilities.

The initial delivery adds an independently testable scene index, a real dedicated browser worker, bounded viewport scheduling, conservative rendering selection, incremental preparation and on-demand source-reading work. Aggregate zoom summaries, GPU rendering, remote spatial storage and arbitrary-repository intake remain later design choices; do not introduce them merely to demonstrate performance. Existing zoom levels continue to expose the same content.

## Responsibilities and inputs

UI owns camera, CSS-pixel viewport size, device-pixel ratio, native input/focus, live drag feedback and DOM measurements. Camera movement must not wait for a worker, rerun extraction or trigger global layout. Experience Service owns comparison/disclosure intentions. UI Projection owns presentation content; renderer inputs and state use named UI Types.

A scene query worker owns only deterministic spatial selection over a supplied UI geometry snapshot. The integration boundary manages worker creation, scoped messages, replacement, failure and teardown. No direct cross-subsystem subscription, new reactive library or generic worker framework is needed. Its wire messages contain serializable UI data, never GraphSessionUI callback closures or Domain objects.

Each geometry replacement has comparison and layout identity. Viewport queries carry request identity, camera translation/zoom, viewport width/height and pixel ratio; CSS pixels determine world bounds, pixel ratio determines raster quality only. Reject nonfinite/invalid geometry. Results are scoped to the active scene and latest applicable request. A late result cannot revive an old comparison, geometry, disclosure or movement state.

## Spatial selection and lifecycle

Build a reusable spatial index when geometry changes, not on every viewport query. Query conservative world bounds including a screen-space overscan margin. Keep the current scene usable while a bounded latest-request scheduler prepares replacement; coalesce superseded input rather than allowing an unbounded message queue. Keep camera updates outside expensive React scene state updates. Retain stable references when membership/content do not change.

Select node rectangles, group ancestry, route bounds and edge-label rectangles separately. A curve crossing the viewport must remain available even when both endpoints are outside. Include required endpoint/ancestor metadata without forcing their full offscreen content to mount. Bounds may conservatively overselect; they must not miss visible strokes or labels. Pin focused, inspected and actively dragged items as required to preserve keyboard/input and native disclosure state. Ancestor coordinates and manual overrides remain authoritative.

The existing layout needs DOM dimensions. Preserve its cold-start measurement phase before enabling spatial rendering selection; do not position offscreen nodes with invented sizes or rebuild layout from the visible subset. Measurements remain cached across culling. Source-open/close, file expansion and manual movement invalidate their affected scene geometry; pan/zoom alone does not invalidate layout. This initial measurement limit must be reported separately from steady-state improvements.

On worker startup/error/timeout/unsupported environment, retain the full existing renderer as a correctness fallback and release worker resources. Scene replacement and unmount dispose prior subscriptions, listeners and pending work. Do not leave stale visibility hiding newly changed or moved content. Rapid camera movement outside a result's coverage must retain a safe presentation until a valid replacement is ready.

## Incremental and demand-driven work

Reuse projected content by immutable entity/evidence identity; disclosure changes must not remap every unrelated entity. Prepare full source-reading views only when requested, retain exact witnesses and preserve close/reopen behavior. Closed native details must not mount all hunk rows. Keep preview rows and existing document summaries available as needed by the unchanged UI. Cache within the comparison lifetime, bound retained working state, and discard obsolete scene indexes.

Distinguish download/parse, projection, layout/routing, worker query and DOM rendering costs. Keeping the canonical prepared corpus resident is permitted in this initial slice and is an explicit loading limit; lazy DOM or projection is not proof of reduced network bytes. Later source-asset partitioning must preserve evidence hashes and get its own delivery acceptance.

## Correctness and performance evidence

Independently authored tests compare indexed queries with a brute-force geometric oracle over negative coordinates, nested parents, zero/large zoom, resizes, outside endpoints/crossing curves, labels, overscan boundaries and invalid inputs. Exercise serializable worker messages, scene replacement, out-of-order responses, coalescing, timeout/failure, disposal and safe fallback. Verify source rows, disclosures, pinning, manual positions and domain graph remain unchanged.

Record a repeatable synthetic benchmark at increasing scene sizes plus the pinned PR25 corpus. Report index construction, query time, candidates visited, selected elements and transport size separately. Use operation-count/scaling checks for regression acceptance; machine-specific timings are descriptive. No FPS, device smoothness or browser memory claim follows from Node timing. A spatial query should avoid scanning the complete separated scene when only a small region is visible.

Actual React checks cover desktop/touch pan/zoom, viewport resize, edge/label crossing, source open/close, Show/More/Hide, focus and movement retention, worker fallback and unchanged camera. Supported-host unavailability is UNRUN, not PASS; existing deployment authorization does not convert asset readback into journey evidence.
