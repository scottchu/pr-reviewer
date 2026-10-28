# MCP session-delivery experiment evidence

**Date:** 2026-10-24

**Packet:** [Plan v1](plan.md), committed as 484d9f9 before fixture creation

**Base source:** 1e356446f9477325f0f93eea6bc0c0d670b2d5f0

**Stage 1 disposition:** Primary-source matrix complete; existing-SDK protocol fixture PASS; native Codex and Claude outcomes INCONCLUSIVE

**Adoption status:** No production adoption or replacement of queue delivery

## Mechanism and host matrix

| Surface | Contract and required host behavior | Evidence / bounded conclusion |
|---|---|---|
| Installed SDK 1.32.2 resource subscription | `Client.subscribeResource` / `unsubscribeResource`; `resources/subscribe`, `notifications/resources/updated`, then a separate read. Server advertises resource subscription capability. | Local declared SDK source and [fixture](resource-subscription.test.ts) establish 2025-11-25 protocol receipt and controlled handling. No model context or automatic turn follows from the standard notification alone. |
| Newer SDK v2 `Client.listen` | `subscriptions/listen` under 2026-07-28, acknowledged before opening; `resourceSubscriptions` filters resource-update URIs. Closure is explicit; 2025 connections reject this API rather than transparently shimming. | [Primary API documentation](https://ts.sdk.modelcontextprotocol.io/v2/api/@modelcontextprotocol/client/client/client.html#listen) fetched. This mechanism exists. Installed 1.32.2 has no `listen` method or 2026 protocol support; v2 execution is UNRUN. No hand-written substitute or SDK upgrade was made. |
| ChatGPT plugin MCP Events | `events/list`, `events/subscribe`, `events/unsubscribe`; protocol 2026-07-28 and webhook delivery. ChatGPT supplies and verifies the callback destination. Documented for Work web chats, desktop Work with Cloud selected, and dots; events reach the subscribed chat and can trigger responses. | [Primary event integration documentation](https://developers.openai.com/plugins/build/mcp-events) fetched. It establishes a host-specific MCP route for automatic response, distinct from resource notifications/listen. Webhook acknowledgement and later task response are separate. This does not establish support in the current local Codex owner or Claude. No plugin, callback, secret or webhook was created. |
| Claude Code channels | Host-specific `claude/channel` experimental capability and `notifications/claude/channel` context injection. Documentation describes reaction in the existing open session and optional reply tools; research-preview opt-in/authentication/policy requirements apply. | [Channels overview](https://code.claude.com/docs/en/channels) and [reference](https://code.claude.com/docs/en/channels-reference) fetched. This is a separate host route, not standard `subscriptions/listen`. No enabled existing Claude connection was supplied. No restart, development flag, allowlist bypass, configuration or permission relay was attempted. |
| Current local Codex participant | Exact originating-session identity plus a supported connection that subscribes/handles events and delivers context to that owner must be demonstrated. | No native PR Reviewer subscription/catalog connection supplied. General [Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) is not exact-session subscription or wake evidence. No additional proxy/daemon probe was performed. Native E1-E6 UNRUN. |
| Current PR Reviewer server | Its existing authenticated tools continue to own reads/replies. | Inspected `src/mcp/public.ts` at the pinned base: tool registrations and stdio lifecycle; no resources, subscriptions/listen, event subscription or Claude channel registrations. No production code changed. |

MCP has subscription/listen/event mechanisms, and supported host integrations can react automatically. The unresolved question is which supported mechanism reaches THE existing initiating participant in this project. Switching to a Work chat, new Claude launch or controlled SDK client would change the measured host/session and cannot satisfy this experiment's native criterion.

## Local fixture method and actual results

**Fixture:** [resource-subscription.test.ts](resource-subscription.test.ts)

**Runtime:** Existing bundled Node v24.21.0

**Dependency:** Existing declared SDK 1.32.2 at `/tmp/pr-reviewer-source-analysis/node_modules/@modelcontextprotocol/sdk`; no installation or version change

**Transport:** SDK `InMemoryTransport`, one controlled SDK client and server in one process; no network, native owner or model

**Protocol:** Initialization response actually negotiated 2025-11-25; resource subscription capability observed

The fixture asserts subscription acknowledgement, no hint before subscription, rejection of another resource URI, URI-only update receipt, exact separate fixture-resource read, unsubscribe suppression, close cleanup and rejection of a read after close. The URI guard checks fixture scope only; it is not production authenticated attachment authorization. The resource content is fixture data, not the product's durable inbox/source. No model, meaningful answer, receipt persistence, revoke-generation race or restart acceptance is simulated or claimed.

**Result:** One test PASS, zero failures; first executing runtime run. Strict explicit TypeScript check PASS, exit 0.

**Initial environment failure:** `node` and the TypeScript launcher were not on the default shell PATH (exit 127, `command not found: node` / `env: node: No such file or directory`). The documented existing bundled-runtime PATH resolved this; no install or security change occurred. No fixture assertion failed and no correction loop was needed.

## Reproduction

The experiment has its own declared entrypoint below. It is not a production regression suite, and the repository's normal application test inventory is unchanged. The file is outside the production compiler include, so the explicit strict check is required.

From the task worktree, after confirming `node_modules/` is ignored, create a real task-local `node_modules` directory and link only the existing SDK scope as `node_modules/@modelcontextprotocol` to `/tmp/pr-reviewer-source-analysis/node_modules/@modelcontextprotocol`. This reuses installed dependencies; do not run an installer or link generated caches.

```sh
export PATH="/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:$PATH"
node --experimental-strip-types --test docs/plans/480p/slices/02-review-continuation/mcp-listen-experiment/resource-subscription.test.ts
/tmp/pr-reviewer-source-analysis/node_modules/.bin/tsc --noEmit --ignoreConfig --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --target ES2023 --module NodeNext --moduleResolution NodeNext --types node --typeRoots /tmp/pr-reviewer-source-analysis/node_modules/@types docs/plans/480p/slices/02-review-continuation/mcp-listen-experiment/resource-subscription.test.ts
```

## Gate disposition and smallest next input

| Gate | Controlled v1 fixture | Existing native Codex / Claude |
|---|---|---|
| E1 protocol | PASS for installed v1 subscription only | INCONCLUSIVE: no verified subscription connection |
| E2 client handling | PASS for controlled URI hint/read only | INCONCLUSIVE: no observed native handler |
| E3 session/context | N/A: no native session represented | INCONCLUSIVE: exact existing connection/context path missing |
| E4 automatic reaction | N/A: no model invoked | INCONCLUSIVE: no native event or causal action observed |
| E5 meaningful reply/persistence | UNRUN | INCONCLUSIVE: no native question/source/reply chain observed |
| E6 lifecycle | PASS for fixture URI guard, unsubscribe and close only | INCONCLUSIVE: native scope/revoke/teardown unrun |

**Required next input:** Root supplies a supported, already-authorized subscription/event connection bound to the exact initiating host/session, its negotiated protocol and capability acknowledgement, and permission for one genuine question event on that route. The host must expose enough evidence to distinguish receipt, context arrival, automatic reaction and persisted meaningful reply. For a webhook route, the supported host must supply an authorized verified callback; this experiment cannot invent one. Existing-session identity cannot be inferred from a fixture client name.

**Next bounded probe, only after readiness:** Pin one genuine question/event and source identity; subscribe once; commit the addressed inbox before emitting one IDs-only hint; retain event/subscription/session correlation; observe without CLI/manual steering; read authoritative question/source through the participant; verify the relevant source-backed reply and persisted readback; unsubscribe and confirm teardown. Measure active and idle behavior separately. No new conversation, owner replacement, global configuration, replay or automatic adoption follows.

**Stop:** Missing connection/version/identity or required permission keeps the native result INCONCLUSIVE. An inconclusive result does not establish impossibility or authorize bypass. The bounded Stage 1 investigation is complete; repeat capability loops are not needed.

## Preservation and review

Only this experiment directory is tracked. Existing application, queue behavior, pilot, native owner, dependencies and B1 files remain untouched. The task-local dependency link is ignored and removable; results are preserved here. Root owns independent review, next actual PR integration and any later product decision. No deployment is applicable to this isolated fixture.
