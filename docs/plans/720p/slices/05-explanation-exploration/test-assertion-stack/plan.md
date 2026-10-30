# Test above Assertions

Date: 2026-10-30.
Revision: test-assertion-stack-R1.
Status: docs-first; implementation pending.
Parent: [720p](../../../plan.md), [explanation/exploration](../plan.md).
Specification: [Test and Assertion arrangement](../../../../../product/pr-file-tree-first.md#test-and-assertion-vertical-arrangement--2026-10-30).

## Intent and implementation handoff R1

User requests Test on top with Assertions immediately below and indented. Baseline main/deployed fbe175cc9cf6b21923759a9c7fbaedec51c87692. Current generic ranked layout puts sibling Assertions across a wide row; unchanged root Assertions are not kept with their Test. Root executes in branch stack-tests-above-assertions, isolated worktree pr-reviewer-test-assertion-stack. Change only owning docs, UI presentation metadata/layout wiring and regression coverage. No ontology/data/admission, source IDs, semantic membership, new UX, CSS/theme or unrelated geometry changes. PR42 merge/deploy authorization was specific to PR42; this slice publishes a reviewable PR without silently replacing the endpoint.

Acceptance: S1 actual contains relations determine stacks; S2 Test above one vertically ordered indented Assertion column in changed/add/remove groups and unchanged root scope; S3 measured heights, header clearance, root spacing, bounds and existing manual overrides remain valid through reflow; S4 canonical source graph and non-test geometry are preserved. No fake Change for unchanged tests. Unsupported/mixed ownership retains the generic layout. Use literal geometry/negative fixtures, pinned actual PR25 and the normal graph test entrypoint, strict types/boundaries/build. Author actual React desktop/390 arrangement/reflow coverage; browser unavailable means unrun, never alternate control. Existing fixed PR25 intake still blocks own-correction-PR graph-first dogfood.

## Independent-review handoff R1

After committed candidate/build/PR, assign a fresh source reviewer under project review rules. Required: this packet, owning product specification and actual diff. Check S1–S4, root/group footprint separation, typed ownership, input immutability, measured reflow and no semantic/UX expansion. Source review is narrower than actual UI/graph-first acceptance and must be labeled accordingly. Return concrete findings and checks. Model/effort selection and exact commit will be pinned at dispatch. No successor is declared ready; reconcile evidence into this packet and parent plan before acceptance.

## Status and remaining gates

Implementation/tests/build/review/PR pending. Existing deployed version remains fbe175c. Actual browser, own-PR graph-first and device evidence remain open. Task-owned ignored .decompozr/flow/run/test-assertion-stack retains logs/build/recovery; preserve previous worktrees and handoffs.
