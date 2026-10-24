# Internal06A intent/store/gateway checkpoint

**Date:** 2026-10-24.

**Status:** Implemented candidate for independent R3 engineering review. No full-slice acceptance.

**Assignment:** [Root sequencing decision](plan.md#root-sequencing-decision-06a-internal-backend-checkpoint), committed before derived code as `01def717880b89c331f90dc7f3153f910afed835`. Sole executor `plan_head_test_slice06`; branch `implement-head-test-intent-core`, worktree `/tmp/pr-reviewer-06-head-test-core`, source base `0117de999b6562f63e2ca959567abe67ef122474` carrying independently reviewed stable67 interfaces and Q2 recipe. The commit containing this record is the candidate; root pins its exact SHA for R3.

**Owning specification:** [Internal06A contract](../../../../product/review-loop/test-execution.md#internal06a-backend-checkpoint-contract). [Versioned roles](integration.md#r3-independent-internal06a-review-handoff).

## Delivered behavior and boundaries

The fixed target catalog exposes revision2 definition/digest. Production remains unavailable and rejects before queuing; a constructor-only, captured-by-value TEST-ONLY option enables controlled queued intent without a runner. Strict RequestTest/CancelTest schemas admit no executable, argv, cwd, environment, raw path or caller-supplied head. Stored jobs bind the retained review/snapshot/head, actor and complete target identity. Current token/attachment authorization precedes accepted receipt replay. Read projections omit private credential/quota data.

`store.tests.targets`, `command` and `query` are the public ports. Request/cancel/receipts and reservations commit in existing short transactions. Queued cancellation leaves durable cancelled history without invocation. Exact retries retain the same receipt/job; failed preconditions create neither. Reciprocal command-ID guards preserve review/import/analysis/story receipt meanings, including exact old receipts whose IDs predate the newly reserved `test-result:` prefix. Pagination returns at most32 jobs and an exact-scope cursor.

The existing execution owner adds test occupancy, without another epoch or scheduler. Recovery retains unfinished invocation identity as unknown/unresolved and restores missing lease occupancy. One pure predicate drives recovery, pending accounting and shared claim exclusion. A misleading overall quiescent flag cannot clear unresolved invocation evidence. Confirmed-quiescent unknown history remains unknown but permits a new unrelated claim; no public endpoint proves quiescence. Existing import/analysis authority and grants are unchanged.

POST `/api/commands` dispatches the two strict test commands. POST `/api/tests/targets` and `/api/tests/jobs` read the same store. There is no test runner, launch/claim/grant/result admission port, managed test wake route, participant notification, source materializer, artifact reader, CLI or React change. Anchored questions continue while test work is queued or unresolved.

## Verification and TDD findings

New intent tests first failed for missing public schemas/store behavior, and gateway tests failed with404 before routes existed. Later adversarial tests exposed mutable fixture options, inconsistent quiescence disposition and retroactive reserved-prefix rejection of legacy receipts. The implementation now captures configuration, shares the conservative occupancy predicate and resolves authenticated legacy receipts before rejecting newly reserved IDs. One intermediate strict check also caught an overbroad persisted-record cast; the test branch now parses its own declared value separately from unchanged import/analysis values.

Final verification on the candidate working tree:

| Check | Outcome and meaning |
|---|---|
| Node24 strict TypeScript `node node_modules/typescript/bin/tsc --noEmit` | Passed; all source/tests included by current compiler configuration |
| Existing subsystem boundary checker `bun --no-install scripts/check-boundaries.ts` | Passed; no additional subsystem edge or boundary rule needed |
|13 new Node intent/gateway tests | Passed; T01/T02/T06/T08/T09 internal portions: unavailable/fixed definition, strict authority and receipt/retry, queued cancellation/reopen, bounds, pagination, stale epochs/attachments, recovery exclusion, comments and HTTP readback |
|53 existing relevant Node regressions | Passed; review history/migration, import limits and restart faults, semantic store/quota/authority/history, story storage/limits and all three relevant gateways |
| Combined final Node run |66 passed,0 failed,0 skipped; approximately9.6s |
| `git diff --check` and changed Markdown file links | Passed; local file targets verified, not whole-repository anchor validation |

The reproducible Node command is:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test tests/head-test-intent.test.ts tests/head-test-gateway.test.ts tests/storage.test.ts tests/history.test.ts tests/import-jobs.test.ts tests/import-limits.test.ts tests/import-faults.test.ts tests/semantic-storage.test.ts tests/semantic-quota.test.ts tests/semantic-authority.test.ts tests/semantic-history.test.ts tests/story-storage.test.ts tests/story-limits.test.ts tests/gateway.test.ts tests/story-gateway.test.ts tests/semantic-gateway.test.ts
```

Raw local test output is retained at `/tmp/pr-reviewer-06-head-test-core-evidence/node-tests.log`. Tests create private temporary SQLite/source fixtures and ephemeral loopback API servers, then clean their own fixtures. Existing regression tests exercise their controlled import/semantic processes and faults; no new test process runner or actual configured product job ran. Existing package-entry links supply declared dependencies from `/tmp/pr-reviewer-source-analysis/node_modules`; no install, package/lock change or shared cache link was introduced. These links are engineering-check dependencies, not the qualified isolated execution closure required by06B.

## Remaining gates and next action

Root assigns R3 independent review against assignment commit01def717 and the exact candidate head. No further implementation dispatch is implied. The separate Q2 raw-source/runtime/closure recipe remains qualified only for67, not this candidate's actual production environment. This checkpoint does not use Q2 as a production configuration.

Full G1 predecessor acceptance remains open under the root sequencing exception;05D presentation is separately owned. Actual06A React unavailable/queued/cancel behavior,06B isolated source/environment/process/artifacts and same CLI result,06C real cancellation/restart/descendant fault evidence, actual own-PR graph-first comprehension, meaningful active-process question, visual critique and final knowledge acceptance remain open. Controlled database records cannot establish OS quiescence or a real test outcome. No PR, push, merge, deployment, native session or successor07/08 implementation occurred.
