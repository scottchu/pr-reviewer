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
