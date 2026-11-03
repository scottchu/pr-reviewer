# Read a Test as one normal source change

Date: 2026-11-03.
Request revision: test-change-unit-R1.
Parent: [Explanation exploration](../plan.md).
Product source: [Normal Test change](../../../../../product/pr-file-tree-first.md#test-is-one-normal-source-change-unit--2026-11-03).
Status: implementation in progress. Existing root serves merged main `250c19acfe47b6a7090faac258789151ce6eb051` with PR46's first-load paint correction; it still has the rejected Assertion inventory.

## Intended outcome and observed gap

The user has repeatedly requested the same normal change graph for a Test and supplied the live `request() change` screenshot as the reference. The latest phone screenshot still shows one tall Test group with many Assertion and contains/source labels. The prepared data includes their ownership; the UI automatically expands them and also counts Assertions as file source units. Neither the PR45 design experiments nor PR46's paint fix delivered the requested Test correction.

Preserve the whole graph and existing normal Function/Test source UI. One Test is the reading unit; assertion edits stay exact lines within its full source scope. No invented Before/After identity pair, special Test card, assertion count/list, semantic relation or execution inference.

## Implementation handoff v1

Owner: root, sole writer in `fix-test-change-reading-unit`, isolated from main and PR45. Base: `250c19a`. Inputs: retained canonical graph hash `946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a` and current normal change renderer. Keep canonical facts/relations immutable; change visible membership, rendered group children and source-unit pagination/counts. Retain the shared existing source reader and exact Test witnesses.

First write a regression against the reported Test, prove it fails on the old presentation, then implement the bounded correction. Exercise default, file expansion, changes-only, source open/close and hide. Update historical projection expectations only for the explicit removal of Assertion reading nodes and incident relations; keep full source/compiled/canonical oracles intact. New evidence belongs in ignored `artifacts/test-change-unit/`, never project `.decompozr`.

## Independent-review handoff v1

Use a fresh separate read-only reviewer after a committed packet/candidate exists. First attempt actual candidate UI observation through supported tools; an unavailable host leaves graph-first review UNRUN, never replaced with graph JSON or another browser-control route. Then independently review the bounded source diff, exact full-Test source preservation, absence of Assertion cards at all pagination/filter states, retained normal change behavior and source facts. Return concrete defects and remaining evidence gaps. Root owns all writes/deployment.

## Acceptance and delivery

- Reported Test `unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f`: one Test source card in its existing Change group; zero Assertion children/nodes/contains labels in the reading graph.
- Added/changed/unchanged Test source identities, scopes, line edits and canonical assertion containment/location remain unchanged. Normal request/helper change account stays intact.
- Source-unit pagination skips assertion evidence and its counts agree; full source and canonical preservation oracles pass.
- Strict TypeScript/boundaries, graph regression suite, authored actual React journey, independent source review, PR and exact-main build/deployment to the existing root with rollback retained.
- Actual browser pixels, physical touch, own-PR intake (fixed PR25/no selector) and unfamiliar-reviewer comprehension remain distinct gates. Latest supported browser error: `The browser access host is unavailable`.

Authorization: continue the already requested Test simplification and existing-endpoint fix; do not stop after another source-only prototype. No new endpoint, dependency, network/security change or PR45 merge. Preserve prior worktrees, previews and recovery artifacts.
