# B1 public consumer checkpoint

**Date:** 2026-10-24.

**Status:** Implemented backend candidate for independent review; production qualification, full B1 and product acceptance remain open.

**Owner:** plan_head_test_slice06.

**Parent:** [I6](execution-06b.md#i6-named-b1-implementation-assignment), [execution evidence](checkpoint-06b-execution.md), [durable contracts](../../../../product/review-loop/test-execution.md#b1-gateway-composition-and-managed-owner).

## Exact delivered consumer values

| Consumer action | Public interface | Returned authority/read model |
| --- | --- | --- |
| Catalog | POST `/api/tests/targets` with reviewId/snapshotId | HeadTestTargets, fixed target definition/revision/digest and exact-head availability reason |
| Run | POST `/api/commands`, RequestTest with commandId/reviewId/snapshotId/targetId/expectedTargetRevision | HeadTestReceipt, same durable jobId and jobRevision; no executable/path/env fields |
| Read/history | POST `/api/tests/jobs` with reviewId/snapshotId and optional jobId/minimumJobRevision or cursor | HeadTestView; selected HeadTestJob now optionally includes stored HeadTestResult |
| Cancel | POST `/api/commands`, CancelTest with commandId/jobId/expectedJobRevision | Same receipt schema; intent remains distinct from observed stopped/quiescent |
| Plain artifact | POST `/api/tests/artifact` with reviewId/snapshotId/jobId/artifactId, optional offset and length1–65536 | HeadTestArtifactView with immutable artifact hash/totalBytes, byte offset/bytes/nextOffset, complete, encoding=base64 and exact data; no filesystem path |

HeadTestResult v1 records resultId/jobId/invocationId, full captured intent (actor/review/snapshot/repository/base/head/target/qualification), no_process_execution/partial_preparation/prepared_execution coverage, reached stage, available source/closure/account/runtime identities with explicit null/not_completed values, safe process-role/ordinal/state/exit observations plus nullable actual attempted argv/cwd and attempt/spawn/close timestamps, pre/post verification and overlay digests/counts, outcome/reason, optional complete preparation/target exit with explicit absence, output totals/overflow and artifacts. Artifact descriptors identify kind, fixed role/channel label, bytes and SHA256. Runtime output artifacts contain raw bytes rendered as plain text; source evidence is bounded canonical JSON. Result/query values are committed records, not caller assertions or recomputed success.

The owner-only `createTestRunner` uses current store configuration and private execution/artifact roots. `createGateway` optionally composes it through testExecution options; default gateway does not create test effects. Applied Run/Cancel wakes registered routes;200ms polling handles shared-slot availability. Shutdown records stop intent and joins owned work. Test jobs never invoke participant wakes. Artifact integrity/read authorization errors preserve historical job/result identity.

## Consumer assignment boundaries

B2 React/application and B3 thin owner HTTP CLI remain root-assigned roles after the backend review gate. Consumers may import only domain public values and use the existing authorized gateway. They must not open SQLite, create owners, accept opaque grants/witnesses, run commands, construct qualification, or resolve artifact paths. Application owns business-independent managed request/poll/read routes, cancellation and teardown; React presents the returned state, collects target intent, retains concurrent question/draft/navigation behavior and uses plain text output. CLI sends the identical strict HTTP inputs and reads the same job/artifact identity; [B3](cli-06b.md) supersedes credential-reference handling with explicit loopback endpoint and no token input. Existing application/UI/delivery/participant files remain outside this author's scope.

## Current evidence and limits

Nine focused gateway/outcome checks pass (`consumer-checkpoint.log` in /tmp/pr-reviewer-06-execution/evidence), including actual fixed fixture preparation/run→same-job result→plain artifact through HTTP. A legitimate question was sent after a read observed preparing/running during actual work; no artificial wait, held lease or slow target was introduced. It retained the question and no participant notification was requested. Owner stop during actual preparation settled or preserved uncertainty without test-root replay. Strict TypeScript and diff checks pass. This is controlled fixture gateway engineering evidence, not actual own-PR/React/CLI acceptance or production-head qualification.

Normal entrypoint integration, fresh exact-source copied-closure qualification and actual fixed target, independent backend/process-fault review, B2/B3 consumers, real own-PR graph-first A/B and meaningful question/reply/CLI checks, separate visual critique and docs rebuild audit remain required. Historical69d resolver failure and9714 correction/review pins remain separate. No auto-acceptance or publication authority is implied.

## Authorized normal-entrypoint reconciliation

Root assigned this sole backend integrator `package.json` scripts.test ownership only. At clean f786422, task merges consumed mainb096 plus docs87562cd and steerdocsb22a3fd without conflicts; combined merge head c6abc7a4bc6a0ba26bdc8050321d04660ceb8a65. These inputs preserve the05E journal regression registration and current operational/steering limits. The14 head-test Node suites are appended to the existing explicit Node command, preserving every previous entry and the exact four-file Bun prefix. No dependency, lock or other script changes are authorized. Full declared-entrypoint outcome is recorded after execution below.

The declared `bun run test` completed exit0 with47 Bun pass/0 fail and348 Node pass/0 fail. Its actual command/output includes all14 head-test suites and inherited journal-loss regressions; log /tmp/pr-reviewer-06-execution/evidence/normal-entrypoint.log. The entrypoint used the existing direct Bun1.4.2 and Node24 paths, no install or global configuration. Configured strict TypeScript and whitespace checks passed after the clean merges/registration. This broad engineering pass is not React E2E, visual or own-PR comprehension evidence.

## Exact322 engineering source execution

Source `32272352763e67527c73a4a5d919f8fadb1ce3ca`, tree `2bb6b8583ab82ca2a0816ef25f8db00d3710f15f`, was freshly materialized twice (qualification and configured job):261 files/3,092,211 bytes. Source manifest a3cf3f8ae28ea46613ac49d3920f93bbbee995e7af155518eb632e47baa61e61; closure1533684bf324dcdf02be928b17c7f3d7f331e337eb5ad4e7d62127180f6d741f; source-account6e8dc504b4e3361d37ea1d55cab694ba5dd6513abf3b6a659d9c79443f9dab77; qualification60d9473e681b394ffc0c9cce28bdfe6b3a8cbfe07741f770b8c23fac5837cb16. This consumes the resolver correction and current exact source, not67 qualification reuse.

Isolated configured-provenance job1f05d6ae-9a1d-4805-9246-7a3c787efe6d passed47 tests/0 fail/495 expects across4 named files; observed exit0/no signal,6,733 raw output bytes/no overflow. Result e0a133eb8cbcf5eb4ac4f2632becf7c669ac17fad9c40433621a311f96834132 and four retained artifacts were read through the same HTTP gateway on ephemeral127.0.0.1:51300. That gateway was closed. Question readback before and after submission both observed preparing during genuine preparation; no artificial wait/slow target/held lease and no participant notification. All11 qualification/job process groups were freshly absent after close.

Full record /tmp/pr-reviewer-06-execution/evidence/qualified-run-3227235.json SHA25614eb3b07a58cbb38578625788bc2ec585e3dec617781daec4c915e2be7c6216c; source/log share the basename. Private roots and SQLite remain under /tmp/pr-reviewer-06-execution/jobs/qualified-run-3227235. Credentials were kept internal and not printed. This review/DB uses engineering snapshot scaffolding and is explicitly not a real own-PR import, React journey, CLI acceptance or final source qualification after further code/doc changes. Measured installed closure provenance remains local, not vendor attestation.

A subsequent controlled assertion-failure fixture adds explicit pass/fail/total counts and confirms nonzero assertion exit is failed; copied-closure failure remains unavailable and unresolved process state remains unknown. Eight focused outcome/runner tests pass in outcome-counts.log. Full independent review and final-source qualification remain required.

## Final source checkpoint for independent B1 review

**Source/code pin:** 2f1a37fa306f080cb9d6e90e6a9fa866f1736294.

**Status:** Author engineering candidate complete; independent full B1/process review and root consumption pending. This receipt is a docs-only successor to that code pin.

The final normal entrypoint passes47 Bun plus349 Node tests,0 failures (`normal-final-2f1a37f.log`); all top-level tests are reachable and all14 head-test Node suites remain registered. Configured strict TypeScript and subsystem boundaries pass. Eleven slice/owning documents have73 resolving local file links; this is not a whole-repository anchor audit. No dependencies, lock, UI, CLI, delivery/native implementation or pilot state were changed by this backend work.

Fresh exact2f qualification and configured HTTP execution also passed: tree6d02847aaaa82ce40bde21b6eb86f8e3933a86b9,261 files/3,099,147 bytes; source manifest25334f5f03d0bfc643522d7f3cc6c289ba267e5b1651f5bd8206d75282c24178; unchanged measured closure1533684bf324dcdf02be928b17c7f3d7f331e337eb5ad4e7d62127180f6d741f; source-accounta5ba7a9170c234f94801e331f9ee8abdc6775f1772c43ed220774406e1890e42; qualification13ee7f2c05b35015e4ac7b2e22af6fd6e08a15a8e1b7907a781172d0aeb03678. Verified normalized environment identity839b8ecfd01b3773dd107c7228d717f20c1f7cf74a4145a773524842fca250e3 is present on both preparation and result.

Job8b7131b7-db31-4b22-9883-ed9777ee28bb admitted result526f9213e6d3caa6cedb95402240691c2b2f132819ae2dbe1e1f31cd3f35cb6d:47 pass/0 fail/47 total across4 files, exit0/no signal,6,738 raw output bytes/no overflow. Question before/after states were both preparing. Ephemeral gateway127.0.0.1:57355 was closed; all11 recorded qualification/job process groups were freshly absent. Full external record qualified-run-2f1a37f.json SHA256ee78094d8b06201bd8f4301e7862e98c50c637d6e945c98f83d5007ddf82cc13; source/log and readback JSON share that basename under /tmp/pr-reviewer-06-execution/evidence. Private jobs/data/artifacts are retained under /tmp/pr-reviewer-06-execution/jobs/qualified-run-2f1a37f. This remains an isolated engineering review, not actual-ownPR acceptance, and qualifies only the exact source pin, not this later docs-only tree.

**Independent-review handoff:** Review the delivered domain/storage/owner/process/preparation/qualification/outcome/artifact/coordinator/gateway boundaries from the actual2f source, with the normative test-execution knowledge and this exact consumer packet. Preserve69d alias negative,9714 narrow correction,17b owner replay and2bd materialization reviews as separate scoped receipts. Adversarially test revocation/epoch/cancel/admission ordering, missing/ambiguous journals, unknown-root recovery/no replay, receipt collision/quota, output and malformed evidence limits, artifact integrity, same-lease exclusion and control responsiveness. Review normal-entrypoint coverage and inherited05E semantics. Controlled fixture failure/cancel/stop evidence is separate from the passing real-source engineering run. Do not infer OS sandboxing, kernel network denial, hostile-code parser completeness, vendor provenance, hard RSS/cache-disk bounds, actual own-PR understanding or React/CLI/visual success.

**Remaining root-owned gates:** consume independent B1 review and any corrections before B2/B3 dispatch; assign actual React application bridge and thin HTTP CLI against these committed interfaces; run06C crash/fault and actual user journeys, graph-first real-ownPR A/B plus meaningful answer/CLI same-job evidence and separate visual critique; then whole-product docs rebuild/acceptance. Production startup configuration remains an explicit owner qualification/composition action. Original qualification cannot be replayed from JSON after restart; ambiguous registered roots retain exclusion and require supported reconciliation. No merge/publication/delivery authority is claimed.

## Closeout recovery correction

Author readback found that a no-process/no-output outcome unnecessarily created an empty artifact directory without a registered preparation-root obligation. The correction performs no artifact filesystem access when there are no artifacts; nonempty artifact publication still has the existing persisted preparation obligation and joined live-attempt tracking. The early-cancel regression now supplies a nonexistent artifact root: it failed before correction (ENOENT, no-artifact-red.log) and passes after it. Eight outcome/runner checks, strict TypeScript, boundaries and whitespace pass (no-artifact-green.log). This is a narrow required recovery correction after2f; the2f exact-source run remains historical and is not relabeled as proof of the successor source.

## Superseding final098 source receipt

**Source/code pin:** 098867ecb2cd23c66a449c6fad0a768b86bfa161.

**Status:** Current author candidate for independent full B1 review; supersedes2f only for the explicit empty-artifact recovery correction.

The final declared entrypoint again passed47 Bun plus349 Node tests,0 failures (`normal-final-098867e.log`). Fresh exact-source qualification and configured HTTP execution passed47/0/47 across4 files, exit0/no signal; question before/after states both preparing. The run retained6735 raw output bytes without overflow. All11 recorded process groups were freshly absent; ephemeral loopback61856 was closed. No native/pilot/global/external-network/install action occurred.

Source treed0e67216e36d22737357005740c30e53730ae7a4 has261 files/3104331 bytes; source manifest311737f3469e1fd1f782130d812b69b160de3761aad0882f4e08690dbaea7a6a; closure1533684bf324dcdf02be928b17c7f3d7f331e337eb5ad4e7d62127180f6d741f; source accountb19d3106065d634825b8b7ad28152e71a53f069cb2a0aaaed251c36f50d2d686; qualification44bda777d97a71f14c9feb9c50987661ba5a98302200d16adec6c7002d733314; environmentd6c47814c6eb3b2110f3ed7268f3d743df0c07075eb439c4d5f846180c1e71c8. Job6c55f468-3e3d-4d56-95fe-577b3ce3325c admitted resulte3d9f9ac7ebed3bf6c505c4021b792b14096a7d2fc1a839462533fe30de3e7aa.

External record /tmp/pr-reviewer-06-execution/evidence/qualified-run-098867e.json SHA256ace1c4bdd2ebdaa6dc41d11ba326ed9a67539878ea73f08ce2940a600e0d6b3f; source/log/readback JSON share its basename. Private evidence/data roots remain under /tmp/pr-reviewer-06-execution/jobs/qualified-run-098867e. This final receipt is docs-only over unchanged098 code; the exact098 source qualification does not automatically qualify its documentation successor. The earlier independent-review handoff and remaining root-owned gates apply to098.

### Pending corrective consumer revision

Status: not frozen; independent review found four required corrections against `1e35644`.

Artifact pages return exact base64 bytes (`encoding`, `data`, `offset`, `bytes`, `nextOffset`, `complete`) instead of independently decoded text. Consumers must stream-decode or assemble bytes. Canonical result process observations and pre/post verification evidence are included; public job cleanup status separately exposes pending/complete/error without changing the historical result. B2/B3 must consume the committed and independently rechecked successor contract, not this negative candidate.
