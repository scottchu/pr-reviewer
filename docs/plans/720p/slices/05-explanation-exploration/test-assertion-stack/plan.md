# Test above Assertions

Date: 2026-10-30.
Revision: test-assertion-stack-R1.
Status: implemented, locally checked and independently source-reviewed; draft PR43 published; actual browser acceptance blocked.
Parent: [720p](../../../plan.md), [explanation/exploration](../plan.md).
Specification: [Test and Assertion arrangement](../../../../../product/pr-file-tree-first.md#test-and-assertion-vertical-arrangement--2026-10-30).

## Intent and implementation handoff R1

User requests Test on top with Assertions immediately below and indented. Baseline main/deployed fbe175cc9cf6b21923759a9c7fbaedec51c87692. Current generic ranked layout puts sibling Assertions across a wide row; unchanged root Assertions are not kept with their Test. Root executes in branch stack-tests-above-assertions, isolated worktree pr-reviewer-test-assertion-stack. Change only owning docs, UI presentation metadata/layout wiring and regression coverage. No ontology/data/admission, source IDs, semantic membership, new UX, CSS/theme or unrelated geometry changes. PR42 merge/deploy authorization was specific to PR42; this slice publishes a reviewable PR without silently replacing the endpoint.

Acceptance: S1 actual contains relations determine stacks; S2 Test above one vertically ordered indented Assertion column in changed/add/remove groups and unchanged root scope; S3 measured heights, header clearance, root spacing, bounds and existing manual overrides remain valid through reflow; S4 canonical source graph and non-test geometry are preserved. No fake Change for unchanged tests. Unsupported/mixed ownership retains the generic layout. Use literal geometry/negative fixtures, pinned actual PR25 and the normal graph test entrypoint, strict types/boundaries/build. Author actual React desktop/390 arrangement/reflow coverage; browser unavailable means unrun, never alternate control. Existing fixed PR25 intake still blocks own-correction-PR graph-first dogfood.

## Independent-review handoff R1

After committed candidate/build/PR, assign a fresh source reviewer under project review rules. Required: this packet, owning product specification and actual diff. Check S1–S4, root/group footprint separation, typed ownership, input immutability, measured reflow and no semantic/UX expansion. Source review is narrower than actual UI/graph-first acceptance and must be labeled accordingly. Return concrete findings and checks. Model/effort selection and exact commit will be pinned at dispatch. No successor is declared ready; reconcile evidence into this packet and parent plan before acceptance.

## Status and remaining gates

Implementation/tests/build/review/PR pending. Existing deployed version remains fbe175c. Actual browser, own-PR graph-first and device evidence remain open. Task-owned ignored .decompozr/flow/run/test-assertion-stack retains logs/build/recovery; preserve previous worktrees and handoffs.

## Candidate verification checkpoint

Docs-first commit7301808. Implemented UI-only ownership families and measured vertical layout for grouped and unchanged root Tests. Assertions indent24units; existing140-unit row clearance remains, with a320-unit relation-label gutter. Root stacks are footprint calculations only, never new nodes or parent identities. Missing/ambiguous ownership and mixed groups keep generic layout; a hidden second owner also prevents guessing. Existing manual-position application is unchanged.

Normal graph suite181/181 PASS; five new focused tests PASS, covering typed ownership, grouped measured bounds/reflow, unchanged root stacks, ambiguous/mixed negatives and pinned PR25 immutability. Root/minimum strict TypeScript, subsystem boundaries and production build PASS. Canonical graph bytes exactly equal deployed fbe175c (SHA256946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a). Design detector reports no findings; it is not visual approval. Desktop/390 React source-disclosure reflow E2E is registered but UNRUN: supported CUA getBrowser({id:iab}) returned The browser access host is unavailable. No alternative browser route used.

Independent source-review selection: fresh gpt-6.1-sol/medium for bounded pure geometry, ownership and measured-footprint checks; escalate only on an unresolved correctness issue. Exact candidate/PR pinned at dispatch. Source review does not satisfy graph-first/actual UI acceptance. Live endpoint remains fbe175c, and this packet claims no merge/deployment.

## Review and publication reconciliation

[PR43](https://github.com/scottchu/pr-reviewer/pull/43) contains the product candidatec9dc4eb and browser-test correction53cb2df. [Independent source review](review.md) is PASS at53cb2df after resolving one asynchronous-reflow test issue; targeted9/9 passed. Owner normal suite181/181 and required local checks pass. Final documentation commits record evidence separately from the product/build identity. S1–S4 are verified within source/geometry scope; actual browser/dogfood/graph-first gates stay open. No direct successor is declared ready. Parent plans link here, and durable arrangement semantics are in the product specification.

## Authorized merge/deployment R2

Date: 2026-10-30. Revision: test-assertion-stack-R2. Scott explicitly requests PR43 merge, deployment to the existing HTTPS8478 endpoint and running-version verification, while keeping the actual-browser gap explicit. This supersedes the earlier no-merge/no-deploy limit only for this slice. Source/geometry acceptance remains separate from actual React, graph-first, own-PR and device acceptance; publication does not mark those unrun gates passed.

Recheck the exact reviewed PR head and hosted checks; merge through GitHub without bypassing protections; fast-forward clean primary main from origin/main; create a clean immutable main checkout; regenerate and rerun owning tests/types/boundaries/build; preserve and byte-check the existing fbe175c rollback; replace only its verified preview listener on127.0.0.1:57943; compare every build asset at loopback and existing HTTPS with the immutable-main manifest, and read back PID/start/cwd/command/source/remote main. No UX, ontology, gateway/store, network/security or installation changes. Keep rollback and retained handoffs/worktrees. On failure, use the verified owned rollback and report actual state. Operational receipts remain in the established private artifact location.
