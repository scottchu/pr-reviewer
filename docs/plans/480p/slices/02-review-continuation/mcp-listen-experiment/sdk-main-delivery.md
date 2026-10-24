# SDK v2 delivery on main

Date: 2026-10-24

Status: implementation transfer authorized; candidate verification pending.

Parent: [slice 02](../plan.md).

## Implementation handoff v1

Base: e3b270e5f49a9215452b0b86702946043e979059. Carry only the reviewed SDK migration from 96d0f9e31e9e6e65c2f1ccbed2a2c67ff7231b37..9a271e04b49df49f27401814e5d67df5a2b872cd. The source inherits unmerged test-job work; do not carry its ancestry, test-job interfaces, CLI changes or package scripts. Preserve main's owner-access behavior.

Exact client/server 2.4.0 replace SDK 1.32.2; core remains locked transitively to 2.4.0. Transfer fresh per-factory stdio server/capability state with an immutable original launch binding, explicit schema objects, modern owner-client negotiation and controlled modern/legacy protocol tests. Preserve source authorization, actor/generation guards, durable inbox and unknown-without-replay semantics. No production subscription/listen resource, native wake or replacement session is introduced.

Editable derived scope: package MCP entries and lockfile; src/mcp/public.ts; scripts/mcp-client.ts; semantic/story MCP tests, isolated subscription fixture and SDK imports/negotiation in existing React tests. Durable SDK behavior belongs in participant-adapters.md and review-loop/runtime.md. No UI, test-job, domain/storage or unrelated dependency/script changes.

## Verification and review handoff v1

Verify exact dependency/lock resolution and unchanged unrelated dependencies/scripts; run actual stdio semantic/story tests including modern probe to legacy fallback, denied preattach reads, trusted attachment, source/receipt/revocation, isolated listen/filter/cancel/EOF and legacy compatibility. Run strict TypeScript, boundary checks and main's normal test inventory; run the two affected controlled-host React journeys with existing Chrome where feasible. Use existing Node24/Bun and read-only entry links from the integrated SDK2 donor; all caches/artifacts remain task-private.

Source review of 9a271e was READY: /tmp/pr-reviewer-sdk-independent-review/recheck-9a271e0.md, SHA-256 392714a885721834104ba7d60355b6bb8d5eeeed6151f9f224dedfcad2f4ee76. This is prior source evidence, not acceptance of this main-based candidate. Root reviews the returned exact commit and code.diff, including owner-auth compatibility. No worker publishing, merging, deployment, live pilot, native configuration, notification or original-session attachment is authorized. Own-PR graph-first comprehension and native Codex/Claude listen/wake remain separate unproven gates.

Rollback: revert this bounded SDK change through the normal reviewed Git path. No installed pilot is changed.
