# Slice 01 implementation evidence

## Private tailnet access followup

**Verification date:** 2026-10-23

**Status:** Host-side HTTPS and authentication verified; another-device browser use unverified

At the user's request, the existing main-source pilot was exposed through the device's private Tailscale Serve HTTPS port 8472, proxying only loopback UI 5184. The exact MagicDNS hostname is allowlisted using Vite's documented environment option. Existing Serve handlers and Funnel configuration were compared with a retained baseline and remained unchanged; the new mapping has no Funnel access. The rollback removes only port 8472.

Host-side HTTPS checks returned 200 for the app and JavaScript resources, 401 for an unauthenticated review query and 200 with the existing local-user credential for pinned PR 19 source. An unrelated Host header remained rejected with 403. Credentials were neither logged nor placed in URLs. The accepted runtime instructions are in [private tailnet preview](../../../../product/review-loop/runtime.md#optional-private-tailnet-preview). Private configuration/readback evidence is retained with the active pilot's runtime record and in the task artifact archive; it is not product source.

This is network-access verification, not native participant, complete own-PR journey or unfamiliar-reviewer acceptance. The repository-path PR/MR entry requirement is captured in [the product story](../../../../product/review-loop/README.md#repository-path-entry); no new path/provider lookup or in-app discovery implementation is claimed.

**Date:** 2026-10-23

**Status:** Code delivery independently accepted at e24ce7c; full slice acceptance pending

**Owner:** Assigned implementation worker; root owns independent review and Git delivery

**Source packet:** `cf179ac1eeb9073c08e4e82c950cb53bdc681c72`

**Code candidate:** `e24ce7c465857f5f277f3926b01342628b7ddee7`, independently accepted. This final record is a documentation-only followup; runtime/code checks remain attributed to that exact candidate. Worktree and branch are recorded in the [plan](plan.md). The development checks ran against the then-uncommitted task tree; root must verify the pinned committed candidate for publication. Runtime manifests record `sourceCommit` and `sourceDirty` separately. This is a task-branch test build, not a deployed release.

## Delivered behavior

React renders manually prepared immutable PR 14 before/after source, exact-span controls, saved questions, separate delivery outcomes, persisted answers, actor/generation attribution and source links. One Node SQLite owner commits state/receipts/inbox atomically and returns before any host effect. MCP bootstrap cannot read source; single-use five-minute pairing is bound to independently owner-provisioned exact host/session/connection. Revoked/replaced generations cannot apply late writes. Normal MCP tools forward to the same authenticated gateway. Stable notification claims survive crash as unknown without replay. UI lifetimes use managed scoped routes and never dispatch CLI effects.

The pure comparison handles repeated line identity and text-labeled removals/additions/modifications. Business policy remains in domain/application rather than React. Runtime scripts require private external task data, bind loopback, report readiness and stop only verified owned processes. Vite runs under the existing Bun child after the signed Node host rejected its native addon; no signing/security changes were made.

## Executed checks

Environment: macOS, Bun 1.4.2, Node 24.21.0 from the ChatGPT app, Chrome from `/Applications/Google Chrome.app`. Dependencies are pinned in `bun.lock`. Tests use task-owned temporary roots, not global user configuration or real user sessions.

| Check | Observed result | Scope |
|---|---|---|
| `bun run check` | Passed strict TypeScript and subsystem import checks | Application, tests, scripts and allowed subsystem interfaces |
| `bun run test` | Passed 19 tests: 4 Bun domain/registry and 15 Node application/storage/gateway/delivery/runtime tests | Anchors, canonical fingerprint/text bounds, duplicate lines, route disposal/reconnect, retry identity, read/answer versus unknown state, own-turn command progress, pairing/replay/expiry/revoke, content hash, owned process stop/occupied-port preservation, Claude interface refusal, idempotent preparation/export recovery, definitive rejection/readback recovery and same-session re-pair inbox recovery, blob/UTF-8 validation and foreign-Git data-root rejection |
| `bun run test:e2e` | Passed two actual Chrome/React journeys | Real PR 14 source → UI keyboard save → controlled CLI argv process → actual stdio MCP attach/inbox/question/reply → receipt/readback → rendered answer/evidence link → restart/no replay → revoke; explicit manual PR 19 source/path/span save |
| Screenshot self-check | Inspected generated full-page output | Neutral hierarchy, before/after source, selected range, question/answer/evidence/limits visible; separate from automated checks |

The first pure-domain test was authored and run before implementation and failed on the missing derived module; it passed after deriving the module. Storage/application/process and browser tests exercised real boundaries as implementation proceeded. The first browser run failed on hardened Node's addon policy; the owned Bun UI child repaired this and the complete journey passed. This is scoped TDD evidence, not a claim that every implementation line had an independently observed red test.

Controlled-host screenshot: `/Users/scottchu/.codex-workspaces/artifacts/pr-reviewer-slice01-implementation-2026-10-23/controlled-host-pr14-answer.png`; SHA-256 `c755e88359e597a92bfe6229b81ee54c99d358667118848197ed27d158a282e7`. Root independently inspected this artifact; root live browser interaction was not verified because its browser route was rejected by the browser URL security policy. The browser-policy boundary was preserved.

## Own-PR task and evidence boundary

Reviewed target: [PR 14](https://github.com/scottchu/pr-reviewer/pull/14). Actual baseline `a6d63c1e46424cb979ee912aa993ad964835c287`; head `fd6c5fb26a325c8318087c0f058de247a55e6c07`; path `docs/README.md`; anchor head lines 5–13. Manual Git-object acquisition executes no target code. Snapshot ID is content-derived and recorded in `snapshot.json` and authoritative review queries; candidate source identity is separate.

The browser asked the predeclared bootstrap question. The controlled MCP participant read the exact pinned source and submitted a persisted answer identifying durable product knowledge outside plans, prior documentation authority and the limit that no rebuild was demonstrated. The browser displayed that answer with source attribution; receipt retries returned the original receipt, restart retained it and no second notification launched. This validates the real own-PR source and controlled adapter path, not real Codex/Claude dogfood acceptance. The separate implementation PR 19 task below pins its actual base/head; controlled preparation/question save and owner-operated source reads do not satisfy full native-host dogfood.

## Acceptance disposition

| Acceptance | Current evidence and remaining gate |
|---|---|
| 01-A | Real React + actual MCP protocol + SQLite path passed with controlled host. Exact native-host CLI/tool integration remains unrun. |
| 01-B | MCP/domain reply completed during an active controlled notification; no transaction spans it. Actual native turn/tool progress remains unrun. |
| 01-C | Idempotency/conflict, restart, retained inbox/read state and browser restart/no replay passed. Full continuation is deferred to slice 02. |
| 01-D | Anchor/hash, actor/generation and bootstrap/pairing negative checks passed. Native provisioning responsibility remains explicit. |
| 01-E | Unknown notification remains unknown after read/reply; no replay or reply-triggered wake passed. Provider-side exactly-once is neither required nor claimed. |
| 01-F | Keyboard/source-link React checks and screenshot self-review passed. Unfamiliar-reviewer comprehension remains unrun. |
| 01-G | PR 14 controlled-host task and PR 19 manual source/question save passed. Root independently paired/read PR 19 via owner-operated stdio MCP. Actual native-host UI/CLI/question/reply dogfood remains unmet. |

Claude interface/argument/refusal tests passed; actual Claude executable, trusted metadata setup, existing-owner delivery and MCP product journey are unrun. No Codex proof is reused for Claude.

Root's bounded native diagnostic archive is `/Users/scottchu/.codex-workspaces/artifacts/pr-reviewer-native-mcp-diagnostic-2026-10-23`, with verified `sha256.json`. MCP process launch was observed with no inherited thread/session variables, but Code Mode tool negotiation timed out and zero product reply persisted. Removing inherited routing context was not a sufficient fix. This evidence must not be relabeled successful native tool integration. Owner-operated SDK MCP checks are a separate possible protocol result, not dynamically registered native tools.

## Knowledge and recovery

Learning is promoted to durable [contracts](../../../../product/review-loop/contracts.md), [runtime](../../../../product/review-loop/runtime.md), [presentation](../../../../product/review-loop/presentation.md) and [behavior](../../../../product/review-loop/README.md). The direct [slice 02 contribution](../02-review-continuation/plan.md#slice-01-implementation-contribution) identifies delivered interfaces, reusable tests and open gates. Native host and human gaps remain open; no new later-slice scope was implemented.

Stop preserves SQLite, immutable source, credentials and unresolved effects. Retain unknown attempts for original invocation inspection; never create a fresh invocation to replay uncertainty. Test-created roots are cleaned after their owned processes close; root's live data and archived evidence remain retained for review. Root owns publication/merge/cleanup and exact candidate binding. Independent review must inspect actual source and current evidence before acceptance.

## Independent-review repair milestone

The initial independent candidate was `8c3b714e91997cecad4cee5f060fb678bd51b480`. Review reproduced a database-committed/export-missing preparation gap and an outstanding inbox lost on same-session re-pair. Additional UI review identified definitive envelope rejection and accepted-but-unavailable readback recovery. Each repair was specified in durable contracts before code and received a regression test observed failing before the implementation change.

Preparation now reconstructs pinned objects every time, idempotently checks the same persisted snapshot and regenerates an export without overwriting discussion. Re-pair moves unanswered items to the active generation retaining event IDs and original notification history; an unknown original attempt remains unknown and no second claim is created. The MCP attach result explicitly returns initial `inboxCursor: 0`. Definitive HTTP 400/401/403 rejection releases the pending UI identity; transport uncertainty retains it. Draft/identity survive an accepted receipt whose required revision cannot yet be read.

The focused repair reran strict checks, all 16 then-current tests and the controlled-host Chrome journey successfully. Its exact candidate commit is supplied by root for delta review. Screenshot archive above remains the initial controlled-host visual artifact, not a claim of a new native-host or human run. Full native-host, Claude, own-PR and comprehension acceptance remains open.

## Implementation-PR manual-source task

Root verified actual [PR 19](https://github.com/scottchu/pr-reviewer/pull/19), baseline `cf179ac1eeb9073c08e4e82c950cb53bdc681c72` and pinned target head `4dae178a4302bfdd161fca5be78144c63f562c30`. The predeclared question selects head `docs/product/review-loop/contracts.md:93-99`: after same-session re-pair, how do outstanding questions remain accessible, and does a new attachment generation make an earlier unknown notification delivered or safe to replay?

Expected account: preserve original question/event IDs and attempt history, expose unanswered work to the new authorized generation starting inbox cursor zero, retain the original unknown outcome and avoid a fresh dispatch of an already-claimed uncertain event. Current authorization/generation still gate writes. The document defines this contract; controlled tests and actual runtime observations have their separate scopes. No native exactly-once or human-comprehension claim follows.

The owner can now select this exact local source with `REVIEW_SOURCE_SPEC` and a fresh data root. Manual-source and React tests verify immutable preparation, retained target input, target-derived UI path/title/selection and saved question attribution for PR 19. General import, native-host browser dogfood and owner-operated actual MCP task remain separate. The later application candidate and this reviewed target head are intentionally distinct. The initial independent review receipt is [recorded separately](reviews/implementation-4dae178.md); the new source-selection delta requires focused review.

The explicit-source delta passed strict checks, all 17 domain/interface/process tests and both Chrome journeys. PR 14 retains the complete controlled-host reply/restart path; PR 19 separately verifies the manual source and question save path. Neither browser test invokes the actual native host.

## Source/data boundary repair

The [independent manual-source review](reviews/manual-source-98e0032.md) of `98e00325e5fd55f3d6c146c76cfc1055fb63cb73` reproduced accepting a tree listing as text and a runtime data root inside another Git checkout. Both regressions were observed failing before correction. Preparation now requires commit/path blobs and strict UTF-8, with an isolated malformed-byte Git fixture confirming no persisted review; data-root checks reject any Git worktree/metadata ancestor before creation. Strict checks, all 19 tests and both Chrome journeys passed after the repair. Root supplies the focused commit for independent revalidation.

## Root owner-operated protocol observation

Root ran clean candidate `98e00325e5fd55f3d6c146c76cfc1055fb63cb73` with `sourceDirty: false`, a genuine external PR 19 data root and gateway health 200. Owner pairing independently compared its native process context to existing session metadata, then the actual stdio SDK client called session_attach and review_get. Attachment generation 1, the durable receipt and initial inbox cursor zero were returned without a model-visible capability. The source query returned PR 19 base `cf179ac1eeb9073c08e4e82c950cb53bdc681c72`, head `4dae178a4302bfdd161fca5be78144c63f562c30`, snapshot `4be4da3b32375e25cef6756841c0f7dac707e4cb9f6d770240b87e47c5fab363` and line 99 supporting the predeclared recovery account. Root stopped the verified owned runtime cleanly and retained its accepted data for recovery.

Five noncredential raw evidence files are SHA-verified in `/Users/scottchu/.codex-workspaces/artifacts/pr-reviewer-slice01-implementation-2026-10-23`, prefixed `root-98e-` with manifest `root-98e.sha256.json`. Native thread IDs and owner metadata remain outside Git. This observation establishes trusted local-owner pairing and an actual MCP source read. It does **not** establish native dynamically registered tools, CLI wake, a UI loop, a persisted question/reply or full dogfood. The native Code Mode negotiation and browser-policy limits remain unchanged. It is historical evidence for 98e, not an unperformed run of the repaired candidate.

## Final independent code acceptance and handback

Independent Astra review accepted code delivery at `e24ce7c465857f5f277f3926b01342628b7ddee7` with no remaining blocking engineering findings. The reviewer independently passed strict checks, all 19 tests and both Chrome journeys and reproduced blob/strict-UTF-8 and other-repository/metadata/symlink data-root boundaries. The exact disposition and limits are in the [final review receipt](reviews/implementation-e24ce7c.md). This final documentation-only commit adds no code/test changes and does not claim a new runtime run.

The implementer releases sole product writer ownership to root. Root owns PR 19 publication/merge and the authorized runnable milestone/local pilot. All full native Codex/Claude integration, complete native implementation-PR dogfood and unfamiliar-reviewer gates remain open. Slice 02 remains blocked. Accepted code delivery is not full slice acceptance.
