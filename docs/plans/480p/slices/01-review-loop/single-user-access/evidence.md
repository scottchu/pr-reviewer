# Single-owner access candidate evidence

**Date:** 2026-10-24

**Status:** Coordinator accepted the bounded access change; graph presentation changes needed; retained-data deployment/live pilot pending

**Parent:** [Versioned correction packet](plan.md)

## Candidate and preserved boundaries

**Source:** 5cf0bc67f2db4d17c4653a55cc66493445e4b03a.

**Base:** b096826e31c0927190806de91ed70b8b64aa93d8.

**Workspace:** `/tmp/pr-reviewer-single-user-access`, branch `remove-manual-access-token`.

The docs-first commit1f1aad1 records accepted intent. The tested implementation commit5cf0bc6 opens the workspace/imports automatically, omits browser owner Authorization, derives local-user at the gateway, and uses an identity-checked in-process storage capability. It removes runtime/pair/admission/capture dependence on a user credential file. Existing low-level login(token) methods remain programmatic compatibility seams, absent from the product flow.

No dependency, SDK, lockfile, MCP protocol, reviewed source, pilot process/data, Tailscale handler, listener bind, allowed-Host policy, Funnel or global setting was changed. Existing explicit credentials still resolve their actual participant identity; bad explicit headers cannot fall back to the owner. Stored credentials and receipts remain unmodified. Trusted local-owner access can manage its retained legacy import/analysis jobs, and new local-owner jobs survive restart without a token row.

## Acceptance evidence

| Acceptance | Observed evidence | Result |
|---|---|---|
| SU-A | Existing real PR14 React journey begins in a clean browser with no local-user.json, no token control and no logout; all observed browser API requests omit Authorization. Graph/source/history and reply UI are visible. | Passed |
| SU-B | Gateway no-Bearer self/review/story/context/analysis/import reads, question write and exact retry/readback; actual React question/reply restart and real two-head history/follow-up; import/review switch and semantic/story commands. | Passed |
| SU-C | Full gateway/storage/MCP suites retain bootstrap-before-attachment denial, explicit bad credential rejection, revocation/generation/anchor fences and existing-session attachment behavior. Controlled MCP protocol evidence is not native-host acceptance. | Passed within test scope |
| SU-D | Runtime checks retain occupied-port/owner lock/stop behavior and raw HTTP wrong-Host403; no network configuration changed. | Passed within local test scope |
| SU-E | Fresh runtime creates no owner credential file/reference; restart ignores and byte-preserves a deliberately unrecognized legacy file; retained credential rows remain valid; old/new jobs survive local-owner use/reopen. | Passed |

**Normal source entrypoint:** `bun run test` on the frozen candidate:47Bun tests and306Node tests passed, zero failures. New gateway, local-owner semantic/import, private-scope and runtime cases are reached through that existing entrypoint.

**Static check:** `bun run check`: strict TypeScript and subsystem public-import boundaries passed. `git diff --check` passed.

**Actual browser entrypoint:** `playwright test` on the frozen clean candidate:25/25 passed in2.7minutes using installed Chrome. Includes React/import/history, controlled attached MCP reply, source navigation, semantic worker, story/exploration and explicit dropped-ack/lost-readback recovery across reload. No pilot or real user session is used.

**Environment:** Existing Node24 at `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node`, Bun1.4.2 at `/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun`, and existing declared package-entry links. `.vite` and `.cache` are real task-local ignored directories. No installation or shared cache mutation was performed.

## Failures and corrections retained

The initial gateway red case returned unauthorized without Bearer before implementation. A retained semantic-job regression then exposed its old credential-reference-only action check; trusted same-owner access now succeeds while explicit credential checks remain.

The first full source run passed302/303Node cases: the new Host probe used fetch, which did not send its intended custom Host, observing200. A raw node:http request establishes the intended wrong-Host403 without changing server policy; focused runtime and later full source checks passed.

The first full browser run passed23/25. Two view-only probes supplied fake review models without corresponding semantic/story models for the composed workspace. Their bounded empty read-model fixtures were completed; the history probe also waits for composer readiness. No production behavior was weakened. Both targeted probes passed, then the final full25 passed on5cf0bc6. This records a current fixture correction, not an independently established baseline failure.

The implementer inspected the actual full-page PR14 browser screenshot: retained identity, graph, source, question and attributed reply remain readable with no credential form/control. This is implementer visual inspection, not independent art direction or unfamiliar-reviewer comprehension.

## Retained artifacts, recovery and remaining gates

Final source log: `/tmp/pr-reviewer-single-user-access-tests-frozen.log`.

Final browser log: `/tmp/pr-reviewer-single-user-access-e2e-frozen.log`.

Final browser artifacts: `/tmp/pr-reviewer-single-user-access-e2e-frozen` (including PR14 answer, PR20 graph/source and history captures).

The earlier failure log/artifacts remain at `/tmp/pr-reviewer-single-user-access-e2e.log` and `/tmp/pr-reviewer-single-user-access-e2e-all`; the earlier source failure is `/tmp/pr-reviewer-single-user-access-tests.log`. They are task-owned raw evidence, retained for coordinator/reviewer use during the active delivery task. The isolated worktree and commits remain the recovery location; do not remove them while root delivery/review depends on them. No app/test writer or isolated test runtime remains after checks.

Root owns independent graph-first source review, actual own-PR dogfood, GitHub delivery, merge and preserving-data deployment/live readback through the existing private8472URL. Those were not performed by this implementer. The existing query reviewId/snapshotId selection policy is unchanged; the coordinator must verify the retained target URL. Source/browser passes do not claim a live Tailscale update, another-device use, native automatic Codex turn/catalog registration, Claude or unfamiliar-reviewer understanding.

Private legacy credential-scoped browser recovery/view records remain preserved and locked if incompatible with the new origin/local-owner scope. The product does not request the original token, automatically rekey or replay an unresolved command. Authoritative stored review/history still opens. Explicit current-scope recovery retains original bytes and requires readback.

## Coordinator acceptance and independent evidence

**Date:** 2026-10-24

**Decision owner:** Root coordinator. The implementer read all three reports below in full and verified their SHA-256 values before recording this supplied acceptance. Earlier pending-review statements above describe the implementation handoff; this receipt records the later coordinator decision.

| Report | Exact retained identity | Conclusion and limit |
|---|---|---|
| Independent engineering | `/tmp/pr-reviewer-single-user-independent-review/review-5cf0bc6.md`; SHA-256 `38a1b2d5983c2c7a77600ac8fc8cbcd22955d6262dc87ae2baf5649800f887b2` | READY within assigned engineering scope; no blocking correctness finding. Independently executed focused 22-case gateway/storage/MCP checks, 91 application cases, HTTP/SQLite restart, affected runtime and strict/boundary checks. It attributes the author's full-suite results rather than claiming a second full run; graph-first UI evidence was outside that assignment. |
| Frozen Account A | `/tmp/pr-reviewer-pr25-understanding/phase-a.md`; SHA-256 `8afe368a35d1109396b636ca9b260a1a1faeba49288a89cef5dee65719ea0e08` | Actual UI/graph account froze before source inspector, repository diff, PR description or expected-account access. Core access purpose was correct; retained jobs and browser recovery remained uncertain. Graph presentation CHANGES NEEDED. |
| Source-corrected Account B | `/tmp/pr-reviewer-pr25-understanding/phase-b.md`; SHA-256 `ca4e297fb5c23e13e805bd37715d99895407d7f7eacda242e1716025b04b8906` | Pinned source resolved job actor/reference and locked legacy-recovery semantics before expected-key comparison. Bounded scope understanding sufficient after correction; no new blocking source finding. Actual no-token own-PR read path passed with explicit semantic errors retained. Graph cognitive burden still CHANGES NEEDED. |

**Pinned own-PR target:** PR 25, snapshot `845d21e3cf8780248524faaa773ffa01fddf2e196022d165ffc379b97603b4e3`, base `b096826e31c0927190806de91ed70b8b64aa93d8`, implementation head `5cf0bc67f2db4d17c4653a55cc66493445e4b03a`. Account A stayed frozen; source and expected-account comparison followed in Account B. These identities remain pinned despite subsequent documentation-only commits. The separate SDK/B1 candidates are excluded.

**Observed read-path evidence:** Account B reloaded only its assigned fresh task-local PR 25 candidate. No token input or logged Authorization header was needed; review/import/story/context requests returned 200, the pinned review/graph/source were readable, and opening the added local-access source then returning to the map preserved the focused file. No question, participant, import, story or analysis mutation was executed by that reviewer. This observed pass does not independently prove writes, cross-review switching, original-session activation, production retained-data migration or live pilot behavior.

**Retained failures and presentation limits:** Account A had no published story and no admitted semantic facts; preparation reported budget_exceeded with the outputSites limit 4000. Its structural inventory and honest coverage labels did not establish behavioral understanding. Flat scope, clipped source snippets, unavailable behavioral relationships and voluminous diagnostics left the reviewer to assemble the account manually. Account B then observed `analysis_record_unavailable` and repeated `/api/analysis` 400 responses. No access-diff causality was established. Do not report an error-free whole-page journey. Presentation improvements and failed semantic-selection diagnosis remain OPEN for B2/next graph work; no diagnosis or repair was performed in this receipt.

**Root acceptance:** SU-A–E are accepted for the bounded access correction, supported jointly by the frozen candidate's 25 E2E, 47 Bun and 306 Node passes, independent engineering review and the scoped actual no-token own-PR reading. Source-corrected understanding does not convert Account A into a graph-comprehension pass. Graph presentation remains CHANGES NEEDED; full graph, 720p, native and unfamiliar-human acceptance are not claimed.

**Delivery state:** PR 25 remains open as a draft at the supplied remote head `a63293d` before this final documentation receipt. Root owns reconciliation and publication of the final docs head, PR merge, preserving-data deployment and live readback. Production retained-data/live pilot acceptance is PENDING. This closeout changes only this file and its plan, adds no tests/audits/network actions, and performs no push. The task branch/worktree and raw evidence remain retained for root delivery; sole documentation-writer ownership returns to root after this committed handoff.
