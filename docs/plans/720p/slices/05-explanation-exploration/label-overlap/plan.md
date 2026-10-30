# Repair overlapping labels and duplicate Assertion text

Date: 2026-10-30.
Revision: label-overlap-R1.
Status: implemented, locally checked and independently source-reviewed; draft PR44 published; actual repaired pixels unverified.
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

## Engineering checkpoint

Docs-first commit6a55728. Exact-equal Assertion value rows are suppressed only when the verbatim heading already presents them; distinct source strings and canonical fields are unchanged. Internal label slots use measured widths/heights and expand group capacity before root columns. External final placement applies boundaries and shared leaf/label obstacles together, with a bounded event-boundary search and guaranteed exterior fallback on the unbounded canvas. Impossible internal geometry retains its relation with an observable blocked placement marker, never an overlap-free success claim. This marker is diagnostic DOM metadata, not a new user feature. Active manual bends/positions are retained; source disclosure, positive node/label measurement changes and movement completion trigger the existing bounded reflow owner.

Normal graph suite186/186 PASS, including five screenshot-derived/large-label/resize/impossible-space/actual-topology regressions. The pinned topology check uses explicitly declared420x230stress label measurements, not actual browser dimensions. Dense27-Assertion scenarios and final live-route constraints have zero label/card and label/label intersections in those checks; label midpoint remains on its own curve. Canonical graph bytes exactly match deployedfb42899: SHA256946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a. Root/minimum strict TypeScript, subsystem boundaries and build pass. Historical oracle inversely restores only removed exact duplicate display rows; all other canonical/projection fields stay frozen.

Independent source-review selection: fresh gpt-6.1-sol/high, justified by coupled measured-layout/routing/lifecycle correctness and screenshot-proven prior failure. Escalate unresolved capacity/state/geometry defects; do not substitute source checks for actual pixels. Supported CUA still reports The browser access host is unavailable. Authored desktop/390 font-ready, duplicate-text, final visible rectangles and disclosure/reflow E2E is UNRUN. The screenshot failure is observed; repaired visual acceptance is still unverified. No live deployment/merge performed.

## Final review/publication reconciliation

Product candidateb5d4bae resolves the independent review's settled manual/header regression; [review record](review.md) is SOURCE PASS with17/17 independent targeted checks. Owner final normal suite187/187, strict types/boundaries/build PASS. [PR44](https://github.com/scottchu/pr-reviewer/pull/44) is draft; no hosted check is reported, not a CI pass. Documentation-only reconciliation heads differ from the reviewed product pin. L1–L4 are supported within source/declared-geometry scope; actual screenshot/React/browser acceptance remains unrun. No dependent successor is ready, no merge/deployment authorized by this repair. The owning product contract is reconciled, with parent plans linked and all old state retained.

## Authorized merge/deployment R2

Date: 2026-10-30. Revision: label-overlap-R2. Scott explicitly requests PR44 merge, deployment to the existing HTTPS8478 endpoint and running-version verification while keeping actual browser verification incomplete. This supersedes the earlier no-merge/no-deploy limit for this repair only. The prior screenshots remain evidence of a visible failure; neither publication nor served-byte verification establishes repaired pixels, actual React operation, graph-first understanding or device acceptance.

Recheck reviewed PR head and hosted status, merge through GitHub without bypassing protections, fast-forward clean primary main from origin/main, build from a clean immutable main checkout and rerun owning tests/types/boundaries. Verify and preserve currentfb42899rollback bytes and exact process identity before replacing only its existing127.0.0.1:57943preview. Read back new process/start/cwd/command/source and all static responses at loopback/existing HTTPS against the build manifest and current remote main. No gateway/store, credentials, network/security settings, installation, ontology or new UX changes. Retain original attachments, old worktrees and handoffs. Failed cutover requires bounded owned rollback, with truthful state and remaining gaps. Operational receipts use the established private artifact location.
