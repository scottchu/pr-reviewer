# MCP SDK v2 upgrade

**Packet revision:** 4

**Date:** 2026-10-24

**Status:** P2 factory-lifetime correction implemented; six affected MCP tests and strict/boundary checks pass. Original reviewer recheck pending. Prior full regression/React evidence remains attributed to its earlier candidate; own-PR and native delivery acceptance remain open

**Parent:** [MCP experiment](plan.md); [480p slice 02](../plan.md)

**Base source:** 96d0f9e31e9e6e65c2f1ccbed2a2c67ff7231b37

## Accepted intent and published inputs

The user explicitly authorized upgrading the SDK after the subscription/listen experiment. Upgrade the actual MCP runtime and controlled client to the supported published v2 line while preserving all existing attachment, authorization, source, command and receipt behavior. New production resources, native wake, webhook event delivery and replacing CLI are excluded.

Direct primary registry reads on this date returned `@modelcontextprotocol/sdk` latest 1.32.2; the split `@modelcontextprotocol/client`, `@modelcontextprotocol/server` and `@modelcontextprotocol/core` latest tags are 2.4.0 (published 2026-10-23, Node >=20). Existing Node 24 satisfies the engine. The upgrade is to those exact split packages, not an invented monolithic 2.x version. Sources: npm registry package records for [client](https://registry.npmjs.org/@modelcontextprotocol%2fclient), [server](https://registry.npmjs.org/@modelcontextprotocol%2fserver) and [core](https://registry.npmjs.org/@modelcontextprotocol%2fcore).

Official [v2 migration](https://ts.sdk.modelcontextprotocol.io/v2/migration/upgrade-to-v2.html), [stdio](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio.html) and [client listen](https://ts.sdk.modelcontextprotocol.io/v2/api/@modelcontextprotocol/client/client/client.html#listen) docs establish the new package APIs and 2026-07-28 capability. A package-only import rename does not adopt modern serving: use the supported modern stdio entrypoint with compatibility for older clients. Tool schemas become explicit Standard Schema objects; connection scope and teardown stay explicit.

Durable source: [participant adapters](../../../../../product/participant-adapters.md), [runtime](../../../../../product/review-loop/runtime.md), [delivery](../../../../../product/review-loop/delivery.md).

## Implementation handoff v1

**Executor:** codex_steer_delivery; root coordinates publication/review/deployment. No nested agents.

**Worktree:** `/tmp/pr-reviewer-upgrade-mcp-sdk`

**Branch:** `upgrade-mcp-sdk-listen`

**Editable scope:** `src/mcp`, `scripts/mcp-client.ts`, MCP protocol tests and their isolated fixture, owning durable MCP docs, this experiment directory, package MCP dependency entries and resulting lockfile. Migrate MCP imports in actual React controlled-host E2E without changing UI behavior. Preserve package scripts exactly as base; B1 owner owns test-inventory edits. Prefer extending existing registered MCP test files. No domain/storage/test-job/UI or other B1 edits.

**Authorized dependencies:** Replace monolithic SDK with exact published client/server/core 2.4.0 as public imports require; task-local package installation and resulting lock resolution only. Preserve unrelated declared versions, scripts and package manager. No global install/runtime/settings/native configuration, callback destination, session replacement or live pilot action. Existing CLI remains unchanged.

**Sequence:** Commit source packet first. Add failing compatibility/listen tests before migration. Install exact published packages task-locally, migrate public APIs and supported modern stdio lifecycle, verify focused actual stdio tests, strict/boundary checks and declared normal test entrypoints. Record lock changes and actual versions. Reconcile results before candidate freeze. An isolated `listen` fixture is not a production resource or native delivery feature.

## Acceptance and tests

| ID | Required result |
|---|---|
| U1 | Exact split 2.4.0 versions resolve and are locked; obsolete monolith imports removed from live code/tests; old experiment evidence remains historically labeled. No unrelated version/script change. |
| U2 | Existing MCP tool catalog and attachment challenge, denied pre-attach/source reads, exact-source replies, idempotent receipts, revocation and non-waking story/semantic operations still pass actual protocol tests. |
| U3 | Modern 2026-07-28 controlled stdio connection succeeds; isolated listen fixture observes acknowledgement, filtered URI update, separate read, cancellation/closure and teardown. Legacy resource subscribe/unsubscribe compatibility remains tested under explicit 2025 negotiation. No native model/wake claim. |
| U4 | Existing normal tests, strict TypeScript and boundary checks pass on the candidate. Actual React E2E preserves controlled-host journey; classify any environment failure separately. New regression cases are reachable through existing normal test inventory. |
| U5 | Durable docs state versions, negotiated capabilities, lifecycle, compatibility and native limits. Independent review, own-PR graph-first review, root integration/merge/deployment remain separate gates. |

## Independent-review handoff v1

Root assigns another reviewer against exact candidate/base and this committed packet, read-only by default. Reproduce dependency/strict/boundary/normal and focused protocol checks; inspect lock/source preservation, modern-vs-legacy wire handling, attachment state per connection, schema validation, cancellation, EOF and stale authorization. Confirm fixture evidence is not native session receipt/context/turn/reply proof. Root supplies real own-PR identities and candidate UI for graph-first review before delivery. No reviewer native write or pilot change is authorized here.

## Required return and stop conditions

Return exact candidate/versions, tests and failures, dependency/script comparison, runtime limits, review packet, rollback/recovery and directly affected durable knowledge. Missing native connection remains INCONCLUSIVE and does not block isolated SDK compatibility work. Repeated network permission denial stops the affected action without bypass. Unavailable published packages would block migration; actual registry evidence currently establishes publication. Preserve existing source/data/processes and unrelated work.


## Implementation reconciliation

Direct dependencies are client/server 2.4.0; core 2.4.0 is an exact transitive dependency. Public server/client reexports supply protocol/error/fixture APIs, so no direct core or internal import is required. The old monolith is removed from live source/tests. Historical v1 fixture/evidence remains pinned to its original base/dependency instructions; it is not a current normal regression entrypoint. New listen and legacy checks live in the already registered semantic MCP suite, with an adjacent isolated fixture, so package scripts stay byte-identical to base.

The real stdio server uses `serveStdio` and explicit schema objects; the owner utility pins modern protocol; story and historical browser clients retain explicit legacy negotiation. Future resources/native wake remain excluded. [Final upgrade evidence](sdk-upgrade-evidence.md) retains actual commands, failures, corrected fixture assumptions, source identities and remaining root-owned gates.


## Independent-review handoff v2: frozen candidate

**Implementation candidate:** e3e847b36cfb7252520fbd7e686c4b3f8c512e2c

**Diff base:** 96d0f9e31e9e6e65c2f1ccbed2a2c67ff7231b37

**Docs-first packet:** 79d2e19

**Review scope:** U1-U5, exact frozen source above and its evidence, read-only; root assigns a fresh reviewer. The following receipt update changes only documentation metadata. Reproduce the normal entrypoint and focused protocol/React checks as appropriate; preserve the disclosed first browser reload failure and cancellation-race limitation. Production code and dependencies are frozen at the implementation candidate. Own-PR/native acceptance and root delivery remain open, not implied by this readiness packet.

**Worker checkpoint:** Knowledge reconciled to participant-adapters.md and runtime.md and local links verified. Unique candidate and review dependencies remain in this clean task worktree; private node_modules and external test/E2E logs are retained for root review. No worker process remains active. Writer is released to root after final status readback.


## Factory-lifetime correction handoff v3

**Review target:** 59850be5863fad3000b2480fa321763ee5f2916c, implementation e3e847b36cfb7252520fbd7e686c4b3f8c512e2c

**Independent finding:** P2. Reusing one mutable SDK server from `serveStdio` fails modern discovery followed by legacy initialization on the same transport: the disposed modern probe leaves `initialize` missing (-32601). Direct modern and legacy tests did not cover this negotiation sequence.

**Accepted repair:** Construct/register a fresh server and fresh unattached capability state for every SDK factory invocation, all from the same explicit launch/session binding. Keep transport start/close ownership outside the factory. Apply the same lifetime to the isolated subscription fixture. This is not a new user/native session, attachment replacement, gateway/UI/auth-policy change or callback route.

**TDD and acceptance U2-F:** Add an actual production-stdio probe → legacy regression to the already registered semantic MCP suite; reproduce the reviewed failure before repair. After repair, require a successful 2025-11-25 initialization, expected catalog, denied pre-attachment read and normal trusted attachment/read on that same connection. Preserve direct modern/legacy, listen, JSONL utility and source/revocation/receipt tests. Rerun the focused MCP suites and strict/boundary checks; the unchanged whole regression/E2E run remains attributed to its earlier candidate unless a new finding requires broader execution.

**Review evidence:** `/tmp/pr-reviewer-sdk-independent-review/report-59850be.md`, SHA-256 f782ea67cc28b8fbbc5debd69d94849edcc9e0c1aa93330a0821425844571c30. Original reproduction/log: `/tmp/pr-reviewer-06-plan-review/sdk-fallback-59850be.mjs` and `.log`. Root assigns the original reviewer a narrow recheck of the new exact correction commit; worker does not claim independent acceptance or deployment.


## Factory correction result

**Docs-first correction source:** 5387201

**TDD result:** New registered U2-F production-stdio regression failed before repair with `initialize` error -32601, matching the independent reproduction. It passes after fresh factory construction, including successful legacy negotiation, expected tools, denied pre-attachment read and trusted same-session attachment/read.

**Changed boundary:** The outer MCP wrapper copies/freezes the original launch binding and owns only transport start/close. Every SDK factory call constructs/registers a fresh internal server with fresh capability/attached state. The former eagerly created `.server` object had no repository consumer and is no longer exposed; callers retain start/close. The isolated fixture likewise constructs its server/subscription set inside the factory.

**Narrow verification:** Six MCP cases PASS; strict TypeScript and subsystem boundaries PASS. Raw log `/tmp/pr-reviewer-sdk-fallback-fix.70EWHL`. No dependency/script, HTTP/UI/auth-policy, native owner or pilot change. Full regression and React reruns were not repeated for this bounded correction; their prior evidence remains historical. Root pins this correction's exact committed head for the original reviewer, then owns remaining acceptance and deployment.
