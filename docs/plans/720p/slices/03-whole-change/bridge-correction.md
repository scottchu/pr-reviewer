# Import bridge lifetime correction

**Packet revision:** 2

**Date:** 2026-10-24

**Status:** Implemented and locally verified; root independent targeted recheck and integration acceptance remain required.

**Parent:** [Slice 03 plan](plan.md)

## Accepted intent and observed gap

The authoritative source is [import jobs](../../../../product/review-loop/import-jobs.md), especially “Corrected bounded integration decisions” at source commit `aaf57915520d8bc55d0705bf123df9a28c9c21c2`. Reads and command publications belong to their credential generation and connection lifetime. Explicit login clears the prior view and pending intent recovery. Disposal invalidates owned reads; reconnect reads authorized state. Polling cannot replace an explicit login read. A sent command can still commit on the server; changing credentials never replays it.

Independent actual-HTTP evidence at `/tmp/pr-reviewer-03-independent-review/integrated-0a86/import-credential-race.ts` and `.log` shows a delayed old-credential GET overwriting the new credential's jobs on candidate `0a86a755bb6606fcb504ee8f56bdacec0a562ecc`. This is an application publication defect; server authorization remains effective.

## Implementation handoff v1

**Owner:** `/root/fix_import_bridge_lifetime`, delegated exclusively by root.

**Source:** `aaf57915520d8bc55d0705bf123df9a28c9c21c2`; initial `src/application/imports.ts` Git blob `7c6fcee63a68cb77a185aeaa62dce1fd59fca3d5`.

**Workspace:** `/tmp/pr-reviewer-import-bridge-lifetime`, branch `fence-import-bridge-lifetimes`.

**Editable scope:** Only `src/application/imports.ts`, new `tests/import-application.test.ts`, and this record. The shared integration owner reserves those paths for this executor. No API, domain, server, storage, UI, dependency, configuration, runtime, authentication or product-doc changes.

**Approach:** Preserve the existing public bridge and presentation API. Capture token/generation/lifetime ownership for effects, independently identify each read and active command, and fence success/error/finally publications. Abort owned reads where useful; do not treat abort as server command rollback. Keep unknown-command retry identity under the same credential and make disposal idempotent so an old disposer cannot terminate a replacement connection. Use the existing managed registry, native promises and AbortController.

**Acceptance:**

- B1: Delayed old-token reads cannot overwrite a newer login's jobs or errors, including same-token explicit relogin and logout.
- B2: Late command receipt/error/finally cannot clear or publish into a newer credential's pending command; prior intent cannot retry with a new token.
- B3: Disposal fences pending read/command publications; reconnect rereads authorized state without replaying an old command. An old disposer is idempotent and cannot tear down a newer connection.
- B4: Polling does not supersede explicit reads; current ordinary sends, definitive rejections, unknown retries and exact idempotent command receipts remain compatible.
- B5: Focused actual-HTTP tests fail first on baseline, then pass on corrected code; strict TypeScript, subsystem boundaries and affected application tests pass.

Use existing Node 24 and Bun. Actual-HTTP fixtures may bind random loopback ports and use task-owned temporary SQLite roots. Existing dependencies may be linked read-only from `/tmp/pr-reviewer-02-graph-history/node_modules`; remove only this task's link before handoff. No installs or delegates. Preserve all external evidence. Return clean local commits; root owns integration/publication and targeted independent recheck.

## Independent-review handoff v1

**Reviewer:** Root assigns a reviewer other than this implementer after the candidate commit is available.

**Scope:** Read-only comparison of this three-file change against source `aaf5791` and B1–B5. Inspect generation/token/read/command/lifetime ownership, stale catch/finally effects, retry identity, and old-disposer behavior. Reproduce focused actual-HTTP races using the supplied tests and independently inspect the original credential-race evidence.

**Required return:** Exact candidate SHA, performed checks and observed results, concrete findings by acceptance ID, limits and pass/changes-needed/blocked conclusion. Fixture success does not establish React/E2E, own-PR, deployment or unfamiliar-reviewer acceptance; root/shared owner retain those integration gates.

## Execution evidence

Baseline actual-HTTP run (Node 24): 11 tests, 10 failed and 1 passed. Failures reproduce old-credential job replacement, same-token login view retention, old command ownership, disposal/reconnect and polling/read ordering, plus login retaining unknown recovery. The passing case covers ordinary definitive/domain rejection recovery. Raw task log: `/tmp/pr-reviewer-import-bridge-lifetime-red.log`. No implementation or test change preceded packet commit `40ed731`.


## Implemented result and review handoff v2

The bridge captures the original token and generation for each request. Login (including explicit same-token login) advances ownership, resets the view and pending recovery, and aborts the owned read. An empty login leaves an unauthenticated empty view without a new read. Read identity prevents a late response/error/finally from publishing or clearing a replacement read. Polls skip an active read or command; an explicit command supersedes an older poll before its own readback.

Each command attempt has independent ownership in addition to its retained submission identity. Receipt/error/finally publication requires that exact active attempt and generation. A sent command keeps its original credential and is not aborted or rolled back on disposal. Disposal releases local busy state and conservatively retains its exact pending command for explicit same-credential retry; reconnect only reads. Explicit login clears that recovery rather than retrying with a different credential. A disposed bridge rejects new sends until reconnect/login. Disposers are idempotent and only invalidate their own current connection.

The existing returned method names/signatures and `importFrom`, `ImportViewJob`, `ImportAction`, and `describeImportJobs` remain structurally compatible. Presentation mapping is unchanged. A stale command promise still returns its own receipt/error to its initiating caller; it cannot publish into the current bridge state.

| Acceptance | Observed evidence |
|---|---|
| B1 | Real gateway GET held across credential replacement cannot replace jobs. Same-token relogin clears the view synchronously and fences an old read error. Empty login clears authenticated state. |
| B2 | Held old receipt, transport error and definitive401 response cannot clear a new command's busy state. A late definitive failure cannot clear a newer unknown retry. New login does not retain old retry intent. |
| B3 | Pending read/command disposal prevents publication, including after reconnect. Old disposer does not remove the new route. Reconnect reads a committed job without POST replay. Explicit same-credential retry retains one command ID even while the original attempt completes late. |
| B4 | Slow explicit login survives polling; older same-token poll cannot rewind command readback. Lost acknowledgement retries the exact command ID and creates one durable job. Changed intent blocks until reconciliation; definitive HTTP/domain rejection allows corrected intent. |
| B5 | Final Node24 run:14 new import HTTP tests plus8 existing application tests,22 passed/0 failed. Strict TypeScript and subsystem boundaries pass. Git whitespace checks pass. |

**Environment:** Node24.21.0 at `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node`; existing Bun1.4.2 at `/Users/scottchu/.asdf/shims/bun`. No dependencies or runtime configuration changed.

**Executed checks:** `node --experimental-strip-types --test tests/import-application.test.ts tests/application.test.ts`; `bun run check`; `git diff --check`. Final test output is retained at `/tmp/pr-reviewer-import-bridge-lifetime-application.log`; initial11-case green output is `/tmp/pr-reviewer-import-bridge-lifetime-green.log`. The initial failing-first output remains at `/tmp/pr-reviewer-import-bridge-lifetime-red.log`.

**Evidence limits:** Reads use the actual production gateway and real SQLite store. Command tests use a task-owned random-loopback HTTP fixture invoking the real store command ingress, deliberately without starting provider/Git effects. They establish bridge publication and persisted idempotency behavior, not production command parsing/runner or UI acceptance. Existing application tests use their established fixtures. This executor did not run React/E2E, own-PR, deployed-client or independent comprehension checks. Root/shared integration owner owns normal-test-script registration, full integration validation, product/successor reconciliation and publication. The durable contract at `aaf5791` remains accurate; no new product policy or source format was introduced.

**Recovery and cleanup:** This task's dependency symlink is removed before handoff; no dependency directory is staged. All successful fixtures close their owned gateways/HTTP servers/stores and remove their exact temporary roots. One added test harness initially deadlocked because it checked a shared counter after an await; the fixture now captures its ordinal before waiting. That run's owned Node process was stopped and its identified temporary SQLite root removed. Final tests terminate normally. Raw logs and the clean committed worktree remain for root's independent recheck; no source archive, shared runtime or independent evidence was changed. Shared-owner `imports.ts` remained baseline blob `7c6fcee63a68cb77a185aeaa62dce1fd59fca3d5` at final pre-handoff readback.
