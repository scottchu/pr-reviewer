# Test above Assertions

Date: 2026-10-30.
Revision: test-assertion-stack-R1.
Status: implemented and locally checked; independent review/PR pending; actual browser unavailable.
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
