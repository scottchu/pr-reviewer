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

### Corrected B1 candidate evidence

Status: engineering candidate; original-reviewer recheck pending

The three original counterexamples were rerun against the negative code with only import-root relocation: all three failed as reported (`/tmp/pr-reviewer-06-execution/evidence/review-repair-red.log`). The correction registers `head-test-corrections.test.ts` in the normal Node entrypoint, preserving the four-file Bun prefix and every existing suite. It adds seven cases: actual terminal cleanup with lossless CJK/emoji/65,536-byte paging and complete process evidence; unexpected HOME evidence retained after cleanup; failed cleanup surviving an actual database reopen and retry without replay; unknown root exclusion; allowed cache and incomplete overlay accounting; zero-exit source mutation; and root creation without captured ownership identity remaining unknown.

The combined normal entrypoint passed 47 Bun and 355 Node cases before the final conservative root-identity guard/test. The final affected correction/outcome/runner/preparation set passed 17/17; strict TypeScript and subsystem boundaries passed. A final registered run and exact-head qualification receipt follow separately. These are fixture/engineering observations, not independent acceptance or React/CLI/own-PR evidence. Retained earlier qualification pins cannot authorize the changed source, nor the separately assigned future SDK dependency integration.

Public consumer changes are confined to `HeadTestArtifactView` (base64 data plus explicit byte nextOffset), additive result process execution/verification observations, and optional job cleanup status. Internal cleanup ports require a current owner, exact terminal record and adapter-produced opaque observation. The result/receipt identity is immutable across cleanup progress; pending cleanup pauses new test claims without blocking independent review comments or reopening uncertain process authority. No UI, CLI, native, dependency or lock changes are included.

Final registered correction run: 47 Bun + 356 Node cases passed, zero failures, including all seven new correction cases (`/tmp/pr-reviewer-06-execution/evidence/review-repair-final-normal.log`; Node duration 50.2 seconds). All 62 top-level suites are registered. Final strict TypeScript, subsystem boundaries and whitespace checks passed; 31 local file links across the four changed docs resolve (anchor coverage not claimed). The source is ready for the original reviewer's bounded four-finding recheck. Exact-source engineering qualification remains a separate next receipt.

### Exact corrected-source engineering observation

Date: 2026-10-24
Status: exact-source engineering PASS; independent recheck and product acceptance pending
Source: `7ef680f60fa506629d8a42803a7f60220aea58b6`
Owner: sole B1 backend writer

One fresh qualification and actual job used the unchanged direct Bun binary, fixed four-file argv, primary local Git objects and private real copied existing closure. Source tree `9ec69994019fcad7b81b64d3f3faf51012046a33` contains 264 files / 3,141,900 bytes. Source manifest `8afb861c17f2fee33d6f90d54f7d7724facb2308830d949ac685b22d1a1a2b33`; copied closure `1533684bf324dcdf02be928b17c7f3d7f331e337eb5ad4e7d62127180f6d741f`; source account `27e7271ae3c104338179df25a9d4eb688139ea9987fd1bef4cda12fafb30cee5`; qualification `2c66d12be11568748cce1f5837988b96f887b5753fd6c9400d648cef437605ae`; environment `9687d8265acf3ab9b8fee309a7226645e74c14d3f3fb3ca8c6247d9adf522d30`. Existing donor metadata/content measurements are not vendor-archive attestation.

Job `9ff727d2-90c1-4cf4-b049-4f189d1a7d40` admitted result `a293a98c3840e01fd34347d7e52238eaa00f207a9f5c3248b31af514a7f6a144`: 47 passed, zero failed, exit 0, 6,732 retained output bytes without overflow. Pre/post source inventory digests match (`db39938afec39379ac6ac223deef5e27a1829b103824a223df313b29cb331b7a`), with zero changed entries. Pre overlays were empty; post overlays were exactly 86 expected Bun cache files / 11,680,213 bytes. Actual adapter vectors and attempt/spawn/close observations are in the result. Verification absenceReason labels apply only to null observation slots, not to present verified observations.

Cleanup persisted `complete`, attempts 1, reason null; the disposable execution directory is empty after coordinator close. All 11 recorded qualification/job process groups were freshly observed absent. Loopback gateway port 52586 was closed by awaited gateway shutdown. One meaningful source/runtime/dependency question committed while actual preparation was in progress (before/after both `preparing`), without a slow fixture or held lease. Qualification source material and immutable artifacts remain in the private evidence root; job disposable files do not.

Evidence: `/tmp/pr-reviewer-06-execution/evidence/qualified-run-7ef680f.{ts,json,log}` and `qualified-run-7ef680f-readback.{ts,json}`. JSON SHA256 `9666314a6e7b6d9c7f8448af509071087666839c121c74bf853627909fda0775`. The probe uses an isolated engineering review snapshot, not the actual own-PR UI, React journey or CLI. It authorizes no later head or SDK closure automatically. This receipt is a docs-only successor to the immutable code review pin; independent recheck remains required before consumer dispatch.
