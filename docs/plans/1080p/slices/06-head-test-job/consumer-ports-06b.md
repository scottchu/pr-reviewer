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
