# Bounded unchanged source context preparation

**Date:** 2026-10-23

**Packet revision:** 1

**Status:** Implementation-ready; no whole-slice acceptance

**Parent:** [Slice 03](plan.md)

**Source:** [Pinned source acquisition](../../../../product/review-loop/source-acquisition.md), accepted `source-neighborhood-v1` in source-analysis preparation commit `20cc65a` (implementation `fa4b92a`)

**Starting source:** `6127f760b2fd0da609d088241c65c7c51c1f89c6`, clean acquisition task worktree and branch

## Intent and current gap

Changed-file acquisition does not retain unchanged callers/callees. The accepted analysis port consumes only supplied immutable bytes and cannot read Git or the checkout to repair that gap. Add one public Git context-loading port while durable job/UI integration waits on reviewed 02B interfaces. No analyzer or shared admission behavior is implemented in this checkpoint.

## Implementation handoff v1

Assigned owner uses `/tmp/pr-reviewer-source-acquisition`, branch `discover-pinned-change-from-repository`, from the exact starting source. Writable scope is `src/source-acquisition/**`, `tests/source-context.test.ts`, existing acquisition tests only if needed, this slice directory and new durable `docs/product/review-loop/source-acquisition.md`. No package/lock, shared runtime/domain/storage/application/UI, scripts, maps, evolution or source-analysis docs writes. No delegated agents, installation, fetch, PR/push/merge, pilot/auth/session/runtime changes.

1. Commit this handoff and durable specification before deriving tests/code.
2. Define typed immutable input/result values for explicit provider identity and base/head pins, separate inventory/selection/preparation ledger, retained source and corpus digest. Expose through the existing acquisition public port.
3. Write failing tests, then enumerate verified Git tree bytes and prepare bounded TS/TSX context with required priority paths. Reuse the safe production effect; no live text, source config or helper execution.
4. Exercise actual disposable repositories and scoped strict TypeScript; rerun all acquisition tests. An optional actual repository observation is read-only and separately labeled.
5. Commit clean source, reconcile policy/results/limits into durable acquisition knowledge and this packet, and hold for root's independent recheck/integration.

## Acceptance and tests

- Both pinned sides retain unchanged TS/TSX and declaration-only candidates, with exact text/hash/object/commit and separate side identity.
- All known paths have explicit selection/preparation/exclusion meaning; partial traversal reports unknown unvisited counts, never complete inventory.
- Default 128 prepared entries/side, 256 KiB/file and 4 MiB combined may only be lowered. Priority paths are available or fail explicitly.
- Missing promised objects cannot fetch/execute a fixture helper; symlink/submodule/binary/UTF-8/type/hash/missing/budget cases are honest.
- Canonical ordering, normalized-priority corpus identity and checkout-independent retained bytes are tested; existing changed-file import behavior stays passing.

## Independent-review handoff v1

Root assigns another engineer the exact clean implementation commit, this v1 packet and durable acquisition specification. Review verified commit/tree/blob provenance and no lazy fetch/helper/config execution; bounded inventory/selection and priority semantics; immutable retained identities; complete versus partial corpus accounts; per-known-path failures; strict types/tests and preservation of import behavior. Reproduce meaningful negatives in disposable repositories. Return findings and bounded integration readiness, not 03/04/UI/own-PR acceptance.

## Integration inputs and unresolved gates

Root reconciled the accepted analysis contract: inventory is separately bounded at 4096 known rows per side and 2 MiB combined ledger metadata; the 128-entry limit counts prepared-text sources, not content-less exclusions. The loader returns the complete bounded known ledger separately from retained prepared source. 04I maps both without silently narrowing scope; exact analyzer public changes remain owned by its assigned executor. Snapshot identity and both pinned commits must match the authorized selected review. Keep corpus identity separate, retain the actual bytes for future anchors and route jobs/results only through public integration and domain admission.

03 durable job/launch/restart/UI and 04 scheduling/analysis/admission/graph remain root-owned later gates. No pure-module result proves actual source-graph comprehension.

## Evidence

Pending implementation.
