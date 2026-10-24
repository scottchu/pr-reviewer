# SDK v2 delivery on main

Date: 2026-10-24

Status: transferred and locally verified; root independent review and delivery pending.

Parent: [slice 02](../plan.md).

## Implementation handoff v1

Base: e3b270e5f49a9215452b0b86702946043e979059. Carry only the reviewed SDK migration from 96d0f9e31e9e6e65c2f1ccbed2a2c67ff7231b37..9a271e04b49df49f27401814e5d67df5a2b872cd. The source inherits unmerged test-job work; do not carry its ancestry, test-job interfaces, CLI changes or package scripts. Preserve main's owner-access behavior.

Exact client/server 2.4.0 replace SDK 1.32.2; core remains locked transitively to 2.4.0. Transfer fresh per-factory stdio server/capability state with an immutable original launch binding, explicit schema objects, modern owner-client negotiation and controlled modern/legacy protocol tests. Preserve source authorization, actor/generation guards, durable inbox and unknown-without-replay semantics. No production subscription/listen resource, native wake or replacement session is introduced.

Editable derived scope: package MCP entries and lockfile; src/mcp/public.ts; scripts/mcp-client.ts; semantic/story MCP tests, isolated subscription fixture and SDK imports/negotiation in existing React tests. Durable SDK behavior belongs in participant-adapters.md and review-loop/runtime.md. No UI, test-job, domain/storage or unrelated dependency/script changes.

## Verification and review handoff v1

Verify exact dependency/lock resolution and unchanged unrelated dependencies/scripts; run actual stdio semantic/story tests including modern probe to legacy fallback, denied preattach reads, trusted attachment, source/receipt/revocation, isolated listen/filter/cancel/EOF and legacy compatibility. Run strict TypeScript, boundary checks and main's normal test inventory; run the two affected controlled-host React journeys with existing Chrome where feasible. Use existing Node24/Bun and read-only entry links from the integrated SDK2 donor; all caches/artifacts remain task-private.

Source review of 9a271e was READY: /tmp/pr-reviewer-sdk-independent-review/recheck-9a271e0.md, SHA-256 392714a885721834104ba7d60355b6bb8d5eeeed6151f9f224dedfcad2f4ee76. This is prior source evidence, not acceptance of this main-based candidate. Root reviews the returned exact commit and code.diff, including owner-auth compatibility. No worker publishing, merging, deployment, live pilot, native configuration, notification or original-session attachment is authorized. Own-PR graph-first comprehension and native Codex/Claude listen/wake remain separate unproven gates.

Rollback: revert this bounded SDK change through the normal reviewed Git path. No installed pilot is changed.


## Transfer evidence and review handoff v2

Docs-first commit: ef78a04. Implementation is the subsequent commit containing this receipt; resolve its exact hash from Git. Review the complete diff from e3b270e5f49a9215452b0b86702946043e979059, not the original migration ancestry.

The runtime boundary, owner client, semantic/story MCP tests, isolated fixture and lock are byte-identical to reviewed 9a271e. The React test conflict was resolved from main by applying only SDK imports and modern/legacy negotiation options; its resulting file also matches integrated reference 9671b467. Existing owner-access behavior remains unchanged. No B1/test-job/CLI interface was required. Unrelated manifest declarations and every package script are unchanged.

Verification used Node v24.21.0 at /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node and existing Bun 1.4.2. Dependencies are read-only per-package links to /tmp/pr-reviewer-06-head-test-integration/node_modules; task node_modules/cache and browser artifacts are private. Installed and locked client/server/core versions are each 2.4.0; no package install or runtime/global configuration change occurred.

- Actual stdio protocol suites: 6/6 passed, including modern discovery to legacy fallback. Log: /private/tmp/pr-reviewer-sdk-main-focused.log.
- Strict TypeScript: passed via Node running node_modules/typescript/bin/tsc --noEmit. Log: /private/tmp/pr-reviewer-sdk-main-strict.log. Subsystem boundaries passed via bun scripts/check-boundaries.ts.
- Unchanged normal entrypoint: PATH prefixed with the declared Node24, bun run test passed; 310 Node tests, zero failures. Bun suite totals are retained in /private/tmp/pr-reviewer-sdk-main-tests.log.
- Actual React controlled-host journeys: PR14 modern question/source/reply/restart and PR21 legacy historical-source/two-head journey both passed, 2/2. Run Node24 node_modules/@playwright/test/cli.js test tests/review.e2e.ts --grep '01-A/C/F/G|02B real PR21' with REVIEW_E2E_ARTIFACT_DIR=/private/tmp/pr-reviewer-sdk-main-browser. Log: /private/tmp/pr-reviewer-sdk-main-browser.log. Existing Chrome from playwright.config.ts was used. These are controlled-host journeys, not native registered-tool or unfamiliar-reviewer acceptance.
- Whitespace diff and bounded dependency/script/source comparisons passed. Only the declared SDK/doc/test files changed.

Root receives the clean commit plus /private/tmp/pr-reviewer-sdk-main-code.diff and this handoff. Review auth preservation and exact source isolation first; prior READY applies to the migration source, not independently to this transfer. Native Codex/Claude listen/wake, graph-first comprehension, actual host delivery, publication, merge and deployment remain unclaimed. No live pilot, session attachment, notification or native/global setting was touched. No further worker writes are planned after freeze.
