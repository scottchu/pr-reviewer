# 05E journal-loss shared-exclusion correction

**Date:** 2026-10-24

**Revision:** 3

**Status:** Independent882 engineering and qualified knowledge retained; actual7b6 bounded comprehension/return and ea entrypoint closure accepted in the final receipt below. Root delivery and the final operational-knowledge narrow recheck remain pending; full native/human/round acceptance is open.

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

Documentation-first assignment commit: `6b36180a28d1b217ed4e4bb5870acaf85dca266f`. Corrective source candidate: `882e2b8e7be303965a7a7809a9ae6abf3fc10f3b`; the later closeout commit changes plans only and preserves that code and durable knowledge exactly. The full independent negative report was read and its SHA-256 verified: `/tmp/pr-reviewer-720p-reflection-evidence/af39-journal-question/report.md`, `dd5b7590f9825f0bd2329ff0ff17c69e879155ab5ed9cff726a811c215c47bf2`.

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

Independent bounded engineering review passed as recorded below; full05/720p and changed-head own-PR acceptance are not established. The ambiguous legacy barrier and both original coupled paths were independently checked; a missing PID cannot be treated as no launch. There is no public recovery override or guessed-PID kill. Positive absence establishes stopped effects only, not lost source/analysis success. Actual resource exhaustion/disk failure and every OS schedule were not exhaustively simulated; injected callback failures with real descendants establish this specific repaired boundary. New real own-PR candidate comprehension/D7, combined live gateway shutdown/reopen and deployment remain root-owned/unrun here.

06B must consume this additive evidence contract and the actual corrected candidate after independent review, while retaining its separate test-result/unknown semantics. No06 source is merged or implemented in this branch. Retain this clean candidate/worktree and evidence for independent reproduction and integration; root alone handles PR/main/delivery.


## Independent engineering closure at exact882

Report `/tmp/pr-reviewer-720p-reflection-evidence/05e-ready-882e2b8.md`, SHA-256 `0f16e6a92302ccc4d8cd449c339a689ead95ad4bd6232afbe5ccdbf2725486c6`, is **READY FOR BOUNDED CORRECTION**, with no remaining blocking E1–E4 finding. Root and this writer read the complete report; its hash was verified. The reviewer was the independent original finder/reproducer, not the implementer or fresh comprehension reviewer. Exact review worktree `/tmp/pr-reviewer-05e-independent-review` remained clean at882; negative af39 and its report/probes remain unchanged.

Independent strict/boundaries and all71 affected tests passed with serial file scheduling (approximately32.3s, distinct from the author's10.6s run). The original real context and worker probes were adapted to assert safe outcomes, and a separate actual import counterpart passed: a live owned descendant retained unknown and blocked the competing subsystem, writable terminal identity survived, and positive group absence later permitted a claim without replay. Additional independent reopened-store probes exercised eight family/journal combinations, seven malformed/reason-only eligibility cases, stale-epoch observation rejection and actual worker requested-write no-launch. Empty/explicit-not_spawned cases can recover; requested-only and legacy no-PID terminal records remain blocked. No SQL tamper was used in the original coupled reproductions.

Raw evidence is retained under `/tmp/pr-reviewer-720p-reflection-evidence/05e-882e2b8`, including SHA256.json, inspected-source-sha256.json, run metadata and post-run-state.json. Independent fixture cleanup records show leader/descendant absent and empty task TMPDIR. This closes the reproduced P1 **engineering defect** at882; it does not establish real disk-failure coverage, every OS schedule, a combined live gateway shutdown/reopen or a changed-head own-PR result.

## Actual-code rebuild reflection

The actual correction spans process observations, adapters, coordinators and the store guard. If rebuilding this behavior now, keep three separate responsibilities: a pure minimum-evidence predicate describes what a retained journal can mean; the effect owner observes actual group absence outside transactions; the store validates current ownership and rejects insufficient evidence before releasing its matching lease. Preserve the single shared owner/lease and existing grant families. This is the smallest boundary that makes the observed defect reconstructable without moving OS effects into SQLite transactions or turning output labels into authority.

The adapters must retain observed identity again at terminal write because the durable start write can fail independently of the process start. Adding only a reason-string check would miss the context reproduction's command_failed label. Treating every missing PID as harmless repeats the defect; permanently blocking every interrupted job would lose legitimate empty-claim, definitive nonlaunch and positive-absence recovery. The optional not_spawned evidence therefore carries one narrowly observed fact; absent legacy fields stay uncertain and existing receipts/source/history are preserved. No generalized process framework, public force-clear, new execution authority or guessed-PID termination is needed.

The coupled regression was necessary: adapter-only tests correctly rejected the immediate operation while later coordinator inference still released the shared slot. Future lifecycle verification should follow the retained observation through subsequent ticks/reopen and a competing subsystem claim, testing both safety while descendants live and recovery after verified absence. These conclusions and exact interfaces were already promoted in882's durable [import contract](../../../../product/review-loop/import-jobs.md#journal-loss-quiescence-correction-05e) and [semantic contract](../../../../product/review-loop/semantic-storage.md#journal-loss-exclusion-correction-05e); this closeout leaves them byte-identical to the audited knowledge.

## Independent whole-product knowledge recheck

Report `/tmp/pr-reviewer-05-docs-rebuild-audit/recheck-882e2b8.md`, SHA-256 `e7cde87fb89d6a3e70833351c9d46e3afc20a7b8e9065a33c2ed31d95cf95496`, concludes **qualified YES** for whole-current-product design rebuild readiness at882. The complete report was read and its hash verified. All35 exported durable/rule inputs,600168 bytes, independently matched the manifest; the two changed knowledge files were additive amendments and33 other files plus four normative JSON fixtures remained unchanged. The auditor found no new material normative gap, so no further durable correction is required.

The audit independently derived31 decision-table cases from documentation. Those are standalone calculations, not product tests or OS observations. Prior21-area whole-product coverage and122 earlier compatibility/schema calculations retain their original source pins; they were not relabeled or rerun as882 evidence. The auditor read no application/tests/plans/chat/author probes/runtime/native data and performed no actual rebuild. Knowledge sufficiency and engineering correctness remain separate conclusions; neither passes UI comprehension, meaningful attached answer, native/Claude/human or deployment gates.

## Direct06B successor handoff

| Delivered input at882 | Required06B reconciliation before its implementation |
|---|---|
| domain/public `ProcessQuiescenceRecord`, `processQuiescenceEligible` | Treat started/exited positive-safe-PID as eligibility for a fresh observation, not proof of absence. Explicit not_spawned is valid only for exited with no contradictory identity; unknown disposition, requested-only and ambiguous legacy no-PID remain ineligible. |
| import-jobs/public `processQuiescent` and both corrected adapters | Reuse the bounded read-only group-check semantics where appropriate, while preserving separate fixed test execution authority. Repeat actual terminal PID/startIdentity even when start persistence failed; never derive no-launch from an error reason. |
| Additive import/analysis `spawnDisposition?: not_spawned` and store guards | Preserve old receipts/history and conservative absent-field interpretation. Private evidence cannot arrive through public commands or child result JSON. Store checks minimum evidence/current owner; effect owner supplies fresh absence outside the transaction. |
| Real coupled tests and independent probes | Carry start/terminal-write loss across adapter→store→later coordinator tick/reopen→competing claim into test-job acceptance. Test empty/definitive nonlaunch/positive absence as well as live-descendant barriers. |
|06B's distinct outcome contract | Stopped effects do not establish test success. Keep the planned no-process/partial-preparation/prepared-execution result distinction, exact source/environment qualification and unknown-with-confirmed-quiescence semantics; do not copy import/analysis interrupted-failed presentation into a guessed test verdict. |

This nearby handoff is the directly dependent06B contribution; the06 worktree is not edited concurrently. Root must merge/select exact corrected source, update the06B packet's source/interface inputs and review any material compatibility change before dispatch. The retained06B design review is a separate gate, and source67 Q2 remains qualification of67 only. No06 execution,07/08 hierarchy, automatic successor readiness or full G1 acceptance follows from05E closure.

## Closeout identity and remaining delivery

This closeout changes only tracked05 plan/checkpoint records. Source/tests/configuration and durable product/rule knowledge are identical to reviewed/audited882. Documentation links and whitespace are checked; no redundant product test run or new runtime effect is claimed. Retain the task worktree/branch and independent evidence for root integration and reproduction. Root still owns new pinned actual own-PR graph-first understanding/meaningful-answer checks, any affected live lifecycle exercise, final05/720p reconciliation and PR/main/deployment. No push, merge or deployment occurred in this assignment.

## Normal regression entrypoint correction

**Status:** Normal entrypoint corrected and author-verified at exactea88318. Independent recheck and root delivery remain pending.

A fresh reviewer of immutable `7b6dc0330a1532184c061cd69ace5d2c219b9836` found that the normal `package.json` test command omitted `tests/journal-loss.test.ts`. Root independently confirmed it is the only omitted top-level test suite. The earlier targeted nine-case and71-case results remain valid at their exact pins; they do not prove normal-entrypoint coverage. The original7b6 negative is preserved rather than relabeled.

Root assigned sole executor `/root/plan_story_clarity_05d`, branch `fix-journal-regression-entrypoint`, isolated worktree `/tmp/pr-reviewer-05-regression-entrypoint`, from exact7b6. The durable [regression-entrypoint rule](../../../../rules/development.md#regression-test-entrypoints) is committed before the derived edit. Add only the missing journal-loss file to the literal Node test list; preserve the exact four Bun source-core files and every other script/manifest field, dependencies, lock and application. No discovery framework, runtime/UI/MCP/native action, main write, publication or deployment belongs to this assignment. Other06 worktrees/writers remain separate.

Acceptance: inventory reconciliation identifies no omitted top-level suite; a parsed manifest comparison proves only `scripts.test` changed by the one literal file insertion; actual existing direct Bun1.4.2 `bun run test` with task-local Node24 PATH executes all nine named journal-loss regressions and records final counts/exit; strict TypeScript and subsystem boundaries pass. Preserve full logs outside Git. No repeat Chrome is needed because no UI/application behavior changes. Return a clean committed candidate early for independent recheck, then reconcile exact results and any failures here. The script-only change fits06 qualification's existing rule that canonical manifest comparison excludes only scripts; it does not qualify another source/environment or unlock06 acceptance. New own-PR comprehension, native/human and delivery gates remain root-owned.

### Declared-entrypoint execution receipt

Documentation-first commit `4e94919` precedes derived manifest candidate `ea88318fa5a16f19a3bc55be62e853efd7dcf45f`. The only package change appends literal `tests/journal-loss.test.ts` to the existing Node command. Parsed comparison against7b6 proves every other script/manifest field unchanged; the fixed Bun prefix is byte-identical, `bun.lock` is unchanged, and all47 tracked top-level test suites are now declared with no omissions. Assertion artifact: `/tmp/pr-reviewer-05-regression-entrypoint-evidence/manifest-assertions.json`. This one-time inventory reconciliation adds no discovery/scaffold mechanism.

The actual declared `bun run test` ran from the clean candidate worktree using existing direct `/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun`, version1.4.2, and task-scoped PATH with Node `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node`, version24.21.0. Exit0; **47 Bun and302 Node tests passed,0 failed**, with all nine named05E regressions visibly executed in the normal Node output: six context/worker/import lost-started/lost-exited cases, two import/analysis legacy-journal families, and actual acquisition pre-spawn/requested-write no-launch. Node reported approximately23.2s. Full raw log: `/tmp/pr-reviewer-05-regression-entrypoint-evidence/declared-test.log`, SHA-256 `39140722a39c38f90bd97d1f83c071588573b92f047673a5228a9e85f38e68c9`; `result.json` retains the nine output rows, exact candidate, counts, exit and supporting log hashes. No failure was skipped or masked.

The actual declared `bun run check` also passed strict TypeScript and subsystem boundaries (`check.log` beside the full log). Document links and whitespace passed. Package-entry links reuse the existing donor while generated caches are real task-local ignored directories; no dependency installation or shared-cache mutation occurred. No Chrome rerun is claimed or needed for this package-only test registration: UI/application/backend source is identical to7b6. Existing native/Claude/human, actual own-PR understanding, live lifecycle and deployment limits remain unchanged. The original7b6 missing-entrypoint finding and earlier focused execution evidence stay preserved.

Root receives the clean local candidate early for independent inspection and observed declared-entrypoint recheck. This closeout adds only nearby plan evidence; it does not change the executed manifest identity, grant merge/deployment, rerun earlier knowledge calculations or qualify06's runtime/environment. The shared development rule promotes the durable maintenance knowledge, while this transient receipt supplies exact execution evidence. Retain this task branch/worktree and external logs for root integration/review; no unrelated worktree, runtime, credentials or settings were touched.

## Controlled composed gateway lifecycle at exact7b6

The complete report `/tmp/pr-reviewer-720p-reflection-evidence/7b6-gateway-lifecycle/report.md` was read and its SHA-256 verified: `d77a8110f389c35f9eef86b3e508165c00193519c08b8705102f2e2010c7b2ef`. **PASS for one controlled actual-gateway composition representative**, running exact7b6 with Node24.21.0, supported gateway listen/close, both default import/analysis owners and a fixture SQLite store. A task-owned acquisition helper starts an identity-matching TERM-resistant descendant; the private observation wrapper loses only the started write while requested/terminal writes delegate normally. No product fault route, DB mutation or production override was added.

Close completed within8ms while the import stayed unknown with retained terminal identity and live descendant; routes/HTTP stopped, competing analysis remained queued with no invocation. Reopening the same fixture store with a new actual gateway retained the barrier and helper launch count1. After exact owned fixture cleanup and verified group absence, reconciliation marked interrupted failure without replay and the semantic owner reached awaiting_declarations. Exit0, elapsed1.454s; the task TMPDIR was empty and recorded helper leader/descendant absent after cleanup. Raw probe, result/log/run metadata and checksums remain beside the report.

This closes the formerly unrun **controlled** gateway-close/uncertain-import/reopen composition check at7b6, not every uncertain semantic phase/OS/storage interleaving. The actual own-PR runtime, root MCP, pilot and native sessions were not faulted or stopped. Live own-PR combined shutdown and native fault acceptance remain explicitly unrun. Confirmed stopped effects are not successful recovered results.

## Final bounded outcome and operational clarity

[Combined7b6 bounded acceptance](acceptance-7b6.md) records fresh A/sourceB1/keyB2, actual meaningful same-original-session question/reply/reload/first-ResumeB3, and B4 independent closure of the only missing-entrypoint P2 atea. Root accepts the bounded engineering/agent-comprehension obligation; full rounds/native/Claude/human and root delivery remain incomplete. [Round reflection](../../reviews/reflection-7b6.md) revisits actual code and promotes the indefinite requested-only/legacy PID-less lane blockage and absence of public repair to owning durable import knowledge. Root's fresh docs-only narrow recheck must cover that paragraph before merge; prior qualifiedb0 audit and calculations keep their exact pins. No code, package, tests or06 docs changed in this final receipt.
