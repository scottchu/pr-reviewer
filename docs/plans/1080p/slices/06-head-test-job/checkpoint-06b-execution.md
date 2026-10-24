# B1 fixed execution helper checkpoint

**Date:** 2026-10-24.

**Status:** Intermediate helper implementation; result admission/artifacts/coordinator/consumer ports remain open.

**Owner:** plan_head_test_slice06.

**Parent:** [I6 implementation assignment](execution-06b.md#i6-named-b1-implementation-assignment), [qualification checkpoint](checkpoint-06b-qualification.md).

The [durable derivation](../../../../product/review-loop/test-execution.md#b1-output-capture-and-fixed-execution-derivation) requires one shared bounded raw-output capture and one execution attempt per private preparation witness. Git data stdout retains its separate binary limits. Preparation, runtime-version and test-root diagnostics share1MiB/4096 chunks; byte overflow remains sticky. Private snapshots detach raw bytes. The fixed execution helper validates the current matching grant/execute phase, source/closure/runtime/empty config before and after the run, uses the original attempt deadline and refuses duplicate execution. It returns observation only; lease release and terminal admission are not delivered here.

## Observed evidence

The output-budget test was observed RED with its missing module, then passed. Eight focused tests pass (`execution-helper-green.log` under /tmp/pr-reviewer-06-execution/evidence): exact fixed four-file target actually ran against an isolated loose-object fixture and private copied fixture dependencies; stderr identifies all four files,4 pass and Ran4 tests across4 files, exit0 and observed group absence. The stored test-root observation is exited while job remains running/lease occupied; a competing import cannot claim until later admission. Changed empty config prevents target request, and a repeated helper invocation cannot replay. Runtime-version, preparation and original resolver regression also pass. Strict TypeScript passes. This is controlled engineering fixture execution, not a production head qualification, actual own-PR job, public result or slice acceptance. No test counts from the fixture are imposed on a real head.

## Remaining delivery

Discriminated early/partial/full completion witnesses, bounded retained artifacts and same-job atomic receipt/result/quota admission remain required. Then expose exact query/artifact/coordinator/gateway consumer contracts and independently review the full backend. Normal test registration will be reconciled under the root’s newly explicit package scripts.test ownership, preserving the Bun prefix and existing tests. Root owns later predecessor-doc integration, actual own-PR and all UI/CLI acceptance; no full B1 readiness is asserted here.

## Result admission derivation

The next bounded derivation delivers live-attempt tracking across no-process/partial/prepared execution, fresh quiescence observation, one private artifact publication, opaque outcome witnesses, store completion and authorized artifact reads. Accepted preparation fragments remain separately attributed when later preparation fails; missing identities and target exit are explicit. Observation seals an attempt against further execution; control changes require a renewed journal-bound witness while reusing the same artifacts. Public results exclude private paths/PIDs. Source/dependency post-inventory also rejects unexpected empty directories and changed empty config.

`complete(grant,witness)` atomically persists the same-job result, exact `test-result:<jobId>` receipt and retained-byte accounting, completes its invocation and releases the exact lease. Identical receipt retry does no process work. Artifact reads validate identity/hash/size and reauthenticate after asynchronous I/O; corruption reports integrity failure while the historical result remains unchanged.

26 owner/intent/outcome tests pass (`admission-regressions.log`), including actual fixed fixture execution→result/plain output, receipt retry, copied-witness rejection, competing import after admission, early copy failure, pre-prepare cancellation, late cancellation invalidating an earlier success witness, unauthorized artifact access and corruption. Five outcome cases were rerun after publication reuse/sealing (`admission-final.log`); strict TypeScript, boundaries and whitespace pass. These tests were added with the implementation; this receipt does not claim missing-port RED for the outcome machinery. Coordinator/gateway artifact wiring, full consumer contract, normal entrypoint registration and independent full-backend review remain open.

## Corrective packet after independent full B1 review

Date: 2026-10-24
Status: four accepted P2 corrections in progress; B2/B3 remain gated
Owner: `/root/plan_head_test_slice06`, sole backend and test-execution knowledge writer

Negative source: `1e356446f9477325f0f93eea6bc0c0d670b2d5f0` (code `098867e`). Independent report `/tmp/pr-reviewer-06-plan-review/review-1e35644.md`, SHA256 `48ced05c5ab8c5cd157469f00dff0c52a83a4bd39a95e7b103f97f0c3c32da0d`. Preserve that source and its passing bounded receipts as history; it is not consumer-ready.

The owning [test-execution contract](../../../../product/review-loop/test-execution.md) now specifies persisted post-admission cleanup/retry, exact base64 byte paging, bounded owned-directory overlay evidence, and actual process/verification observations. Implement only these corrections in the existing backend worktree. Reuse the review's cleanup/Unicode and overlay counterexamples as RED inputs; verify successful cleanup, deletion failure/restart retry, unknown exclusion, UTF-8 split boundaries, allowed Bun caches and rejected overlays, actual timestamps/role-substituted argv and explicit early-stage absence. Preserve source/runtime/qualification, receipts, old journals, authorization and lease fences. Run focused TDD first, then the combined registered suite/strict/boundaries; do not repeat full source qualification until the cohesive correction is ready. Return a committed candidate for the original reviewer; actual UI/CLI/own-PR acceptance remains open.
