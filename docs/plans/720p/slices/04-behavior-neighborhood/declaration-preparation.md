# 04D declaration inventory preparation packet

**Revision:** 1

**Date:** 2026-10-24

**Status:** Contract committed before tests/code; implementation and independent review pending

**Parent:** [Slice 04](plan.md)

**Authority:** Root-assigned pure amendment from `47e8b503196160daba0b33f70175f0d36d040deb`, `integration.md` implementation handoff 04D v1 and durable semantic-graph declaration-selection contract. Exact independently accepted analyzer base: `04e30e5b965f1ab06914fbdc9ffa6683f105b557`.

**Maintained contract:** [Declaration inventory](../../../../product/review-loop/source-analysis.md#bounded-declaration-inventory).

**Assignment:** One exclusive executor in `/tmp/pr-reviewer-declaration-inventory`, branch `list-pinned-neighborhood-declarations`. Writable scope: source-analysis subsystem, focused test file, durable source-analysis knowledge, preparation evidence and this packet. No dependency/shared-registration/runtime/UI/storage/acquisition changes, publication or deployment. Existing installed module dependencies are used through a task-owned read-only `node_modules` symlink; preserve its target. No existing runtime records were present before task writes. Main and all other worktrees remain untouched.

## Implementation handoff v1

1. Freeze every existing focused-fixture analyzer request/result before changing code, run all 26 existing tests and reproduce unchanged IDs/facts/results after amendment.
2. Write failing tests for public inventory, exact spans, nested/TSX/anonymous/signature/declaration-only exclusions, both-side/shadowed names, syntax failure, Unicode/CRLF/BOM, deterministic full identity and immutability.
3. Reuse virtual host/preflight/AST declaration rules. Verify 2,000/2,001 declarations, lowered AST/source/metadata/count budgets and no selectable partial results. Preserve complete coverage and distinguish parsed/scanned/selected/prepared.
4. Run focused tests and strict checks; manually inspect new subsystem boundary because shared registration is outside scope. Reconcile actual evidence and limits into durable knowledge and preparation evidence; return clean commits/public values to root.

## Independent-review handoff v1

Root assigns a fresh reviewer the exact candidate, this committed packet, authority commit and analyzer base. Reproduce focused tests/strict checks and frozen analyzer compatibility. Challenge exact declaration spans, independent identity recomputation, whole-index limits and no effect/resolution fallback. Review only preparation readiness; no UI, full04, real-PR comprehension, acquisition, process, publication or deployment acceptance follows. Full integration remains separately gated by accepted03 ports and root-owned wiring.

## Baseline

Existing Bun 1.4.2 focused suite at exact base: 26 pass, 0 fail, 322 assertions. No runtime/package installation was performed. Compatibility and new-test evidence will be recorded after implementation.
