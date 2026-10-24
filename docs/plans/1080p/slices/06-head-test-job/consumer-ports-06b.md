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
| Plain artifact | POST `/api/tests/artifact` with reviewId/snapshotId/jobId/artifactId, optional offset and length1–65536 | HeadTestArtifactView with immutable artifact hash/totalBytes, byte offset/bytes, complete and inert text; no filesystem path |

HeadTestResult v1 records resultId/jobId/invocationId, full captured intent (actor/review/snapshot/repository/base/head/target/qualification), no_process_execution/partial_preparation/prepared_execution coverage, reached stage, available source/closure/account/runtime identities with explicit null/not_completed values, safe process-role/ordinal/state/exit observations, outcome/reason, optional complete preparation/target exit with explicit absence, output totals/overflow and artifacts. Artifact descriptors identify kind, fixed role/channel label, bytes and SHA256. Runtime output artifacts contain raw bytes rendered as plain text; source evidence is bounded canonical JSON. Result/query values are committed records, not caller assertions or recomputed success.

The owner-only `createTestRunner` uses current store configuration and private execution/artifact roots. `createGateway` optionally composes it through testExecution options; default gateway does not create test effects. Applied Run/Cancel wakes registered routes;200ms polling handles shared-slot availability. Shutdown records stop intent and joins owned work. Test jobs never invoke participant wakes. Artifact integrity/read authorization errors preserve historical job/result identity.

## Consumer assignment boundaries

B2 React/application and B3 thin owner HTTP CLI remain root-assigned roles after the backend review gate. Consumers may import only domain public values and use the existing authorized gateway. They must not open SQLite, create owners, accept opaque grants/witnesses, run commands, construct qualification, or resolve artifact paths. Application owns business-independent managed request/poll/read routes, cancellation and teardown; React presents the returned state, collects target intent, retains concurrent question/draft/navigation behavior and uses plain text output. CLI sends the identical strict HTTP inputs and reads the same job/artifact identity; token stays internal. Existing application/UI/delivery/participant files remain outside this author's scope.

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
