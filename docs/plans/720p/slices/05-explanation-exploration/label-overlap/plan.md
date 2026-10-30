# Repair overlapping labels and duplicate Assertion text

Date: 2026-10-30.
Revision: label-overlap-R1.
Status: docs-first correction; implementation pending.
Parent: [720p](../../../plan.md), [explanation/exploration](../plan.md).
Specification: [measured label ownership](../../../../../product/pr-file-tree-first.md#measured-label-ownership-and-single-assertion-text--2026-10-30).

## Feedback, observed failure and scope

User screenshots Screenshot2026-10-30 at1.55.59PM and1.56.25PM show overlapping relationship cards/Assertions and identical Assertion title/body. Base/deployed fb42899771309657231188ba6525050ae47125af. Fixed320-unit label gutter and140-unit row gaps did not account for real label sizes; automatic route scoring can accept collisions, then live per-label clamping can destroy earlier reservations. Identical source name/value are both projected. The screenshots are observed visible failures; previous tests/source review are not visual acceptance. This packet revises the geometry contract, rather than applying another spacing-only patch.

Root implements in branch fix-graph-label-overlap, isolated worktree pr-reviewer-label-overlap. Allowed: owning docs, UI content/geometry/routes/measurement wiring and regression coverage. Preserve canonical graph, source text, relation kinds/provenance, Test/Assertion order, native readers/filter/worker, theme and explicit manual input. No generic UX, ontology repair or source-pipeline change. PR43 merge/deploy permission was specific to PR43; publish a reviewable PR, do not silently replace live endpoint.

## Implementation handoff R1

L1 exact-equal Assertion title/value appears once, without changing distinct strings or source data. L2 measured internal labels have disjoint slots inside owned groups and clear of leaf nodes; group/root footprints include them. L3 final automatic external labels are outside all groups and disjoint from cards/other labels; boundary correction cannot undo shared reservations. L4 labels remain attached to own curve, source/manual/reader/filter lifecycle retained. Use literal dense scene/large-label/resize negatives and actual pinned topology with declared representative measurements; fixtures do not claim actual browser dimensions. Count final overlap rectangles after all constraints, not only route candidates. Update preservation oracle only for exact duplicate-row removal. Run normal graph tests, strict types/boundaries/build and authored React desktop/390 checks. Stop on infeasible ownership/space, reconcile capacity rather than hiding evidence.

## Independent-review handoff R1

After committed candidate/build, assign independent read-only source review under project rules. Inspect L1–L4, final rather than pre-clamp geometry, measured group/root capacity, active versus settled manual behavior, scene bounds, immutable source and bounded scheduling. Exact candidate and model/effort selection are pinned at dispatch. Return concrete findings and checks; source review cannot supply screenshot/actual graph-first evidence. Actual browser currently reports The browser access host is unavailable; retain this gap and use no alternative control route. Own-correction-PR intake remains fixed PR25/no selector. No new feature scope is unlocked by this defect.

## Evidence and disposition

Implementation/tests/build/review/PR pending. Preserve user attachments outside Git, task artifacts in ignored .decompozr/flow/run/label-overlap, and old handoffs/worktrees. Actual repaired pixels/interaction, unfamiliar review and device acceptance remain open. No successor is declared ready.
