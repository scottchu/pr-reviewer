# MCP SDK v2 upgrade evidence

**Date:** 2026-10-24

**Packet:** [Upgrade v1](sdk-upgrade-plan.md), docs-first commit 79d2e19

**Base source:** 96d0f9e31e9e6e65c2f1ccbed2a2c67ff7231b37

**Status:** Engineering candidate verified locally; independent review, own-PR, publication and deployment remain root-owned gates

**Native status:** Existing-session event receipt/context delivery/automatic reaction/meaningful native reply remain INCONCLUSIVE

## Published dependency result

Primary npm registry reads returned stable latest client/server/core 2.4.0, published 2026-10-23 with Node >=20. The monolithic SDK latest remains 1.32.2. The candidate declares exact `@modelcontextprotocol/client` and `@modelcontextprotocol/server` 2.4.0; each locks core 2.4.0 transitively. Public client/server exports provide protocol/error/fixture types; no direct core or internal imports are needed. Node v24.21.0 and Bun 1.4.2 are existing runtimes.

`bun install --frozen-lockfile` passes, checks 66 installs across 116 packages and makes no changes. Lock comparison against the base adds exactly the three v2 packages, removes 84 obsolete monolith/transitive entries, and changes zero retained package entries. All unrelated dependency/devDependency declarations are unchanged. The package scripts block is byte-identical to base, preserving the B1 owner's test-inventory ownership. No global installation or runtime/settings change occurred.

## Delivered compatibility

- Production MCP uses supported `serveStdio`, preserving one server and attachment state per connection. The close handle and pipe EOF tear down the instance and transport. Existing tool registrations use explicit schema objects; gateway command/source authority is unchanged.
- The owner JSONL utility pins 2026-07-28 and preserves its single trusted MCP connection, pairing, bounded tool calls, per-line errors and EOF cleanup.
- Actual semantic stdio tests explicitly use 2026-07-28; story stdio and historical browser clients explicitly use legacy 2025-11-25. The main React question/reply journey pins modern protocol. These are controlled clients, not native host acceptance.
- New listen/legacy tests are inside the already registered `tests/semantic-mcp.test.ts`, using `tests/mcp-subscription-fixture.ts`. The fixture creates resources only in its isolated SDK server, over the supported stdio entrypoint with the SDK in-memory transport. It adds no production resource, event subscription, webhook, CLI replacement or native wake feature.

## Verification

| Check | Actual result |
|---|---|
| TDD modern connection before migration | FAIL as expected: `ERA_NEGOTIATION_FAILED`, old server did not offer pinned 2026-07-28 via `server/discover`. Recorded before derived server changes. |
| Focused MCP suites | PASS, five tests: real modern stdio attachment/source/receipt/revocation/no-wake; modern listen lifecycle; legacy subscribe/unsubscribe and typed listen rejection; owner JSONL subprocess; legacy story protocol. |
| `bun run check` | PASS: strict TypeScript and subsystem import boundaries. |
| Final declared `bun run test` | PASS: 47 Bun tests and 352 Node tests, zero failures. New listen and utility cases appear in actual normal-entrypoint output. |
| Relevant actual React E2E | PASS: two tests in real Chrome. Modern PR14 question → CLI fixture → MCP source/read/reply → authoritative UI/restart; legacy historical PR21 reply/follow-up after restart. |
| Frozen install and dependency/scripts comparison | PASS as described above. |
| Documentation links and diff whitespace | Checked before final delivery; results reconciled in the packet. |

Commands used the documented bundled Node PATH. Final normal-test raw log: `/tmp/pr-reviewer-mcp-sdk-final-test.Pd8sab`; prior 351-test run before adding the utility case: `/tmp/pr-reviewer-mcp-sdk-test.AdVFmc`. Successful E2E artifact directory: `/tmp/pr-reviewer-mcp-sdk-modern-e2e.CKMpA2`.

```sh
export PATH="/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:$PATH"
bun install --frozen-lockfile
node --experimental-strip-types --test tests/semantic-mcp.test.ts tests/story-mcp.test.ts
bun run check
bun run test
REVIEW_E2E_ARTIFACT_DIR=<fresh-external-directory> bun run test:e2e tests/review.e2e.ts --grep '01-A/C/F/G|02B real PR21'
```

## Findings and corrected assumptions

The initial fixture imports exposed actual v2 API differences: shared protocol/transport types are public client/server exports, while core's root does not export them; `InvalidParamsError` is a type, so runtime rejection uses `ProtocolError` and its code. Those fixture import/type failures were corrected and strict/runtime checks rerun.

After `AbortController.abort()`, `McpSubscription.closed` reports local termination before remote cancellation necessarily finishes. An immediate emitted event was observed arriving during that interval. The final test explicitly performs a subsequent ordered resource-read round trip before asserting that future server events are suppressed. It also tests awaited explicit close, idempotent close, cancellation notification, exact filter acknowledgement and graceful server shutdown. No claim is made that local close is remote acknowledgement or that in-flight events cannot arrive. Future production subscriptions require the existing registry/attachment-generation late-event guards; none are introduced here. `ping` is not part of the modern protocol; a trial using it as the barrier correctly rejected with `METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION` and was replaced by the supported read operation.

The first supplemental historical E2E failed during browser reload with `net::ERR_ABORTED` before MCP attachment. Its artifacts remain at `/tmp/pr-reviewer-mcp-sdk-e2e.xiTyoF`. The next targeted run passed both journeys without a browser/product behavior fix. This earlier failed run is retained separately and does not negate its result or establish universal browser stability.

## Review, adoption and recovery boundaries

The [experiment evidence](evidence.md) for SDK 1.32.2 remains historical at its pinned base. Its fixture imports the old dependency according to its documented reproduction setup; it is not a current normal regression target. The SDK v2 upgrade supersedes the earlier unavailable-installed-listen limitation, not the native evidence gate.

Root must still perform independent engineering and graph-first own-PR review, integrate any concurrent B1 test-inventory changes without replacing scripts, publish/merge and deploy through the established supported route. No current pilot or native configuration was touched. Actual native tool catalog, exact originating-session subscription capability, context delivery, automatic active/idle reaction and meaningful native reply remain unrun. A controlled subscription or a React fixture reply cannot pass those gates.

Rollback is the pinned base dependency/source state and lockfile through the same reviewed Git delivery path. No deployment was performed, so there is no installed version to roll back from this worker. Task-local node_modules and external validation artifacts remain retained for independent review; shared dependencies, other worktrees and live processes are untouched. Root owns later cleanup after integration/recovery dependencies are satisfied.
