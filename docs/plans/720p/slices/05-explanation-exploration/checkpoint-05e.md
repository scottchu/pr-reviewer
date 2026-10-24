# 05E journal-loss shared-exclusion correction

**Date:** 2026-10-24. **Revision:**1. **Status:** Assigned corrective implementation; no acceptance yet.

**Parent:** [Slice05](plan.md). **Durable contract:** [journal-loss quiescence](../../../../product/review-loop/import-jobs.md#journal-loss-quiescence-correction-05e) and [semantic correction](../../../../product/review-loop/semantic-storage.md#journal-loss-exclusion-correction-05e).

Root accepts the P1 correction discovered through actual af39 graph-review questioning. Immutable negative source is `af39fa0e430600cea5557b5be7e8991a2dde05d8`. Independent controlled context and Node-worker probes used actual adapters, runner and store, without DB mutation: requested persisted, started callback threw, later exited persisted without pid, a TERM-resistant owned descendant remained alive, and coordinator reconciliation changed unknown to failed and allowed a competing import claim. Raw evidence: `/tmp/pr-reviewer-720p-reflection-evidence/af39-journal-question/`, with probe/context-result.json, probe/worker-result.json and corresponding logs. The prior five targeted tests missed this coupled path. Preserve the negative source/evidence; af39 cannot merge on those checks.

## Assignment and bounded approach

Sole executor `plan_head_test_slice06`, branch `fix-journal-loss-lease-exclusion`, worktree `/tmp/pr-reviewer-05-journal-quiescence-fix`, exact base af39. Commit this contract before derived edits. Scope: owned acquisition and Node-worker adapters, import/analysis coordinators, narrowly required process values/storage observation/reconciliation guards, direct regression tests and owning process knowledge/this nearby handoff. Preserve06 worktrees unchanged. No application/UI/package/lock/native/config/runtime/private-key/MCP/live-browser/PR/main changes. Root owns actual reviewer reply, D7, later fresh-candidate dogfood, integration/PR/merge/deployment.

1. Reproduce both original adapter→store→analysis-coordinator faults as failing repository tests, with real fixture descendants and a competing shared-slot claim. Add the import coordinator equivalent because it uses the same faulty predicate. Clean only exact owned fixture processes and roots.
2. Retain actual terminal pid/start identity after start-write failure. Add narrowly typed definitive pre-spawn failure evidence and conservative legacy interpretation. Share journal eligibility between effect coordinators and storage's minimum guard; no guessed absence/kill or public force-clear.
3. Verify requested-write failure prevents launch; claimed empty journal, definitive missing executable and positively absent groups may settle; requested-only/legacy exited-no-pid remain blocked. Exercise terminal-write failure, old owner/epoch and cancel/stop through existing relevant regressions plus focused additions where needed.
4. Strict TypeScript/boundaries and affected import/semantic/process/fault tests; promote observed results and exact limits here. Commit candidate early for independent engineering review. No API-only test can replace the actual descendant regression.

## Observable acceptance and review handoff

| ID | Required observation |
|---|---|
| E1 | Real context and Node-worker started-journal failures retain unknown and refuse competing import while the actual owned descendant lives, across repeated coordinator ticks. No DB tamper. |
| E2 | Import coordinator has identical conservative behavior; terminal identity is retained when observed; no extra effect is launched after uncertainty. |
| E3 | Requested-only and legacy ambiguous exited/no-pid records cannot auto-clear; contradictory not_spawned fields reject. Claimed-empty, definitive pre-spawn failure and positively absent owned groups can settle without replay. |
| E4 | Failed requested write launches no child; terminal write failure, cancellation/stop and replaced owner/epoch preserve barriers/ownership. Existing receipts, source/history and successful flows regress cleanly. |

Root assigns a reviewer other than this executor to exact candidate/diff base and this packet. Review read-only by default; reproduce real process E1/E2 and attack E3/E4 with isolated fixtures and existing tools. Inspect all coordinator and store paths that infer quiescence, not just adapter rejection. Return concrete findings/severity/evidence and READY FOR BOUNDED CORRECTION, CHANGES NEEDED or BLOCKED. Native/live-own-PR/visual outcomes remain root gates; no same-agent acceptance claim.

06B successor input: consume the corrected process-journal evidence rules before implementing test-owner recovery. Its retained design at0b9002f remains separate and no06 code dispatch occurs here. Root reconciles the exact delivered interface/compatibility changes into the06B packet after this correction's independent review.

## Candidate implementation and observed verification

Documentation-first assignment commit: `6b36180a28d1b217ed4e4bb5870acaf85dca266f`. The next commit containing this record is the corrective candidate; root pins its exact SHA for independent review. The full independent negative report was read and its SHA-256 verified: `/tmp/pr-reviewer-720p-reflection-evidence/af39-journal-question/report.md`, `dd5b7590f9825f0bd2329ff0ff17c69e879155ab5ed9cff726a811c215c47bf2`.

Both actual adapters now repeat observed pid/startIdentity in terminal observations, and emit optional `spawnDisposition: not_spawned` only on definitive pre-start spawn failure without a PID. The pure domain/public `processQuiescenceEligible` and import-jobs/public `processQuiescent` separate journal eligibility from live group absence. Import and analysis coordinators share that predicate; stores independently reject incomplete minimum journal evidence and contradictory not_spawned writes. No lease format, existing receipt, source/history value or authority is replaced. No reason string is used to infer quiescence.

| Evidence | Outcome and scope |
|---|---|
| E1/E2 initial RED | Three new actual adapter→store→coordinator regressions failed on af39-derived source: context, Node worker and import all changed unknown→failed while their owned descendant remained alive. `/tmp/pr-reviewer-05e-evidence/initial-red.log`. No DB tampering; requested/terminal callbacks delegated normally, started callback alone failed. |
| E1/E2 corrected real-process coverage | Six cases cover lost started and lost terminal writes for all three paths. Across repeated ticks, the actual live descendant retains unknown and blocks the competing subsystem claim; terminal identity is retained when writable. After verified fixture cleanup/group absence, a later tick permits an unrelated claim without replay. All pass. |
| E3/E4 focused coverage | Two family cases exercise empty, requested-only, legacy exited/no-PID, definitive not_spawned and contradictory evidence through public owner ports. Actual missing executable produces explicit not_spawned; a requested-write failure produces no helper marker/launch. Existing worker missing-executable assertion now checks the new field. All nine focused tests pass. |
| Existing expectation correction | The first affected run had67 passes/1 failure: an existing semantic-storage test called confirmQuiescent on a requested-only row and expected release. That expectation contradicted the accepted write-ahead/uncertainty boundary. It now expects process_unresolved and a blocked import; separate explicit/real-positive tests establish supported release. The failed run remains at `affected-tests.log`. |
| Final affected suite |71 passed,0 failed,0 skipped, approximately10.6s. Covers nine focused cases plus existing acquisition/worker cancellation, descendants/inherited pipes, runner stop, import/semantic owner crash, process limits, shared store grants, replaced epoch, result admission and diagnostics. Log `/tmp/pr-reviewer-05e-evidence/affected-final.log`. |
| Strict/boundary/docs | Strict TypeScript, existing import-boundary checker, `git diff --check` and changed-document local file links passed. No package/lock/config changes. |

Final affected command, from the isolated corrective worktree:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --unhandled-rejections=strict --experimental-strip-types --test tests/journal-loss.test.ts tests/import-process.test.ts tests/import-jobs.test.ts tests/import-faults.test.ts tests/import-limits.test.ts tests/import-runner.test.ts tests/analysis-worker.test.ts tests/semantic-faults.test.ts tests/semantic-storage.test.ts tests/semantic-authority.test.ts tests/semantic-runner.test.ts tests/semantic-diagnostics.test.ts
```

Tests used existing Node24 and package-entry links from the designated existing dependency donor, with no install/shared-cache links. New fixtures record exact owned process identities, stop their runner, kill only their identity-matching fixture processes when needed, await absence and remove their own root. Successful assertions verify group absence before the later claim. No live own-PR runtime, native session, browser, MCP, network installation, global setting or shared donor was changed. The original probe artifacts and06 worktrees remain retained unchanged.

## Remaining review and successor gates

Ready for independent bounded engineering review, not accepted. Review must retain the ambiguous legacy barrier and reproduce both original coupled paths; a missing PID can no longer be treated as no launch. There is no public recovery override or guessed-PID kill. Positive absence establishes stopped effects only, not lost source/analysis success. Actual resource exhaustion/disk failure and every OS schedule were not exhaustively simulated; injected callback failures with real descendants establish this specific repaired boundary. New real own-PR candidate comprehension/D7, combined live gateway shutdown/reopen and deployment remain root-owned/unrun here.

06B must consume this additive evidence contract and the actual corrected candidate after independent review, while retaining its separate test-result/unknown semantics. No06 source is merged or implemented in this branch. Retain this clean candidate/worktree and evidence for independent reproduction and integration; root alone handles PR/main/delivery.
