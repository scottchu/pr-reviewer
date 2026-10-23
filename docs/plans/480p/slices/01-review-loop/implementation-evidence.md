# Slice 01 implementation evidence

**Date:** 2026-10-23

**Status:** Local implementation milestone; slice acceptance pending

**Owner:** Assigned implementation worker; root owns independent review and Git delivery

**Source packet:** `cf179ac1eeb9073c08e4e82c950cb53bdc681c72`

**Candidate:** The committed milestone containing this record; root supplies its exact Git object in review dispatch. Worktree and branch are recorded in the [plan](plan.md). The development checks ran against the then-uncommitted task tree; root must verify the pinned committed candidate for publication. Runtime manifests record `sourceCommit` and `sourceDirty` separately. This is a task-branch test build, not a deployed release.

## Delivered behavior

React renders manually prepared immutable PR 14 before/after source, exact-span controls, saved questions, separate delivery outcomes, persisted answers, actor/generation attribution and source links. One Node SQLite owner commits state/receipts/inbox atomically and returns before any host effect. MCP bootstrap cannot read source; single-use five-minute pairing is bound to independently owner-provisioned exact host/session/connection. Revoked/replaced generations cannot apply late writes. Normal MCP tools forward to the same authenticated gateway. Stable notification claims survive crash as unknown without replay. UI lifetimes use managed scoped routes and never dispatch CLI effects.

The pure comparison handles repeated line identity and text-labeled removals/additions/modifications. Business policy remains in domain/application rather than React. Runtime scripts require private external task data, bind loopback, report readiness and stop only verified owned processes. Vite runs under the existing Bun child after the signed Node host rejected its native addon; no signing/security changes were made.

## Executed checks

Environment: macOS, Bun 1.4.2, Node 24.21.0 from the ChatGPT app, Chrome from `/Applications/Google Chrome.app`. Dependencies are pinned in `bun.lock`. Tests use task-owned temporary roots, not global user configuration or real user sessions.

| Check | Observed result | Scope |
|---|---|---|
| `bun run check` | Passed strict TypeScript and subsystem import checks | Application, tests, scripts and allowed subsystem interfaces |
| `bun run test` | Passed 16 tests: 4 Bun domain/registry and 12 Node application/storage/gateway/delivery/runtime tests | Anchors, canonical fingerprint/text bounds, duplicate lines, route disposal/reconnect, retry identity, read/answer versus unknown state, own-turn command progress, pairing/replay/expiry/revoke, content hash, owned process stop/occupied-port preservation Claude interface refusal, idempotent preparation/export recovery, definitive rejection/readback recovery and same-session re-pair inbox recovery |
| `bun run test:e2e` | Passed one actual Chrome/React journey | Real PR 14 source → UI keyboard save → controlled CLI argv process → actual stdio MCP attach/inbox/question/reply → receipt/readback → rendered answer/evidence link → restart/no replay → revoke |
| Screenshot self-check | Inspected generated full-page output | Neutral hierarchy, before/after source, selected range, question/answer/evidence/limits visible; separate from automated checks |

The first pure-domain test was authored and run before implementation and failed on the missing derived module; it passed after deriving the module. Storage/application/process and browser tests exercised real boundaries as implementation proceeded. The first browser run failed on hardened Node's addon policy; the owned Bun UI child repaired this and the complete journey passed. This is scoped TDD evidence, not a claim that every implementation line had an independently observed red test.

Controlled-host screenshot: `/Users/scottchu/.codex-workspaces/artifacts/pr-reviewer-slice01-implementation-2026-10-23/controlled-host-pr14-answer.png`; SHA-256 `c755e88359e597a92bfe6229b81ee54c99d358667118848197ed27d158a282e7`. Root independently inspected this artifact; root live browser interaction was not verified because its browser route was rejected by the browser URL security policy. The browser-policy boundary was preserved.

## Own-PR task and evidence boundary

Reviewed target: [PR 14](https://github.com/scottchu/pr-reviewer/pull/14). Actual baseline `a6d63c1e46424cb979ee912aa993ad964835c287`; head `fd6c5fb26a325c8318087c0f058de247a55e6c07`; path `docs/README.md`; anchor head lines 5–13. Manual Git-object acquisition executes no target code. Snapshot ID is content-derived and recorded in `snapshot.json` and authoritative review queries; candidate source identity is separate.

The browser asked the predeclared bootstrap question. The controlled MCP participant read the exact pinned source and submitted a persisted answer identifying durable product knowledge outside plans, prior documentation authority and the limit that no rebuild was demonstrated. The browser displayed that answer with source attribution; receipt retries returned the original receipt, restart retained it and no second notification launched. This validates the real own-PR source and controlled adapter path, not real Codex/Claude dogfood acceptance. The task's implementation PR must also receive its actual own-PR use when root publishes it; no PR URL is fabricated here.

## Acceptance disposition

| Acceptance | Current evidence and remaining gate |
|---|---|
| 01-A | Real React + actual MCP protocol + SQLite path passed with controlled host. Exact native-host CLI/tool integration remains unrun. |
| 01-B | MCP/domain reply completed during an active controlled notification; no transaction spans it. Actual native turn/tool progress remains unrun. |
| 01-C | Idempotency/conflict, restart, retained inbox/read state and browser restart/no replay passed. Full continuation is deferred to slice 02. |
| 01-D | Anchor/hash, actor/generation and bootstrap/pairing negative checks passed. Native provisioning responsibility remains explicit. |
| 01-E | Unknown notification remains unknown after read/reply; no replay or reply-triggered wake passed. Provider-side exactly-once is neither required nor claimed. |
| 01-F | Keyboard/source-link React checks and screenshot self-review passed. Unfamiliar-reviewer comprehension remains unrun. |
| 01-G | PR 14 controlled-host source task passed. Actual native-host own-PR use and the implementation PR task remain unmet. |

Claude interface/argument/refusal tests passed; actual Claude executable, trusted metadata setup, existing-owner delivery and MCP product journey are unrun. No Codex proof is reused for Claude.

Root's bounded native diagnostic archive is `/Users/scottchu/.codex-workspaces/artifacts/pr-reviewer-native-mcp-diagnostic-2026-10-23`, with verified `sha256.json`. MCP process launch was observed with no inherited thread/session variables, but Code Mode tool negotiation timed out and zero product reply persisted. Removing inherited routing context was not a sufficient fix. This evidence must not be relabeled successful native tool integration. Owner-operated SDK MCP checks are a separate possible protocol result, not dynamically registered native tools.

## Knowledge and recovery

Learning is promoted to durable [contracts](../../../../product/review-loop/contracts.md), [runtime](../../../../product/review-loop/runtime.md), [presentation](../../../../product/review-loop/presentation.md) and [behavior](../../../../product/review-loop/README.md). The direct [slice 02 contribution](../02-review-continuation/plan.md#slice-01-implementation-contribution) identifies delivered interfaces, reusable tests and open gates. Native host and human gaps remain open; no new later-slice scope was implemented.

Stop preserves SQLite, immutable source, credentials and unresolved effects. Retain unknown attempts for original invocation inspection; never create a fresh invocation to replay uncertainty. Test-created roots are cleaned after their owned processes close; root's live data and archived evidence remain retained for review. Root owns publication/merge/cleanup and exact candidate binding. Independent review must inspect actual source and current evidence before acceptance.

## Independent-review repair milestone

The initial independent candidate was `8c3b714e91997cecad4cee5f060fb678bd51b480`. Review reproduced a database-committed/export-missing preparation gap and an outstanding inbox lost on same-session re-pair. Additional UI review identified definitive envelope rejection and accepted-but-unavailable readback recovery. Each repair was specified in durable contracts before code and received a regression test observed failing before the implementation change.

Preparation now reconstructs pinned objects every time, idempotently checks the same persisted snapshot and regenerates an export without overwriting discussion. Re-pair moves unanswered items to the active generation retaining event IDs and original notification history; an unknown original attempt remains unknown and no second claim is created. The MCP attach result explicitly returns initial `inboxCursor: 0`. Definitive HTTP 400/401/403 rejection releases the pending UI identity; transport uncertainty retains it. Draft/identity survive an accepted receipt whose required revision cannot yet be read.

The focused repair reran strict checks, all 16 tests and the controlled-host Chrome journey successfully. Its exact candidate commit is supplied by root for delta review. Screenshot archive above remains the initial controlled-host visual artifact, not a claim of a new native-host or human run. Full native-host, Claude, own-PR and comprehension acceptance remains open.
