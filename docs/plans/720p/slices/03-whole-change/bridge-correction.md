# Import bridge lifetime correction

**Packet revision:** 1

**Date:** 2026-10-24

**Status:** Ready for scoped implementation; independent recheck remains required.

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

Not yet run. No implementation or test change preceded this committed packet.
