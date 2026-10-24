# B4: integrated single-owner test consumer ports

Date: 2026-10-24
Status: integration assigned; independent combined review and B2/product acceptance pending
Packet revision: B4.1
Owner: `/root/plan_head_test_slice06`
Parent: [slice06](plan.md), [B3 CLI](cli-06b.md), [B1 consumer ports](consumer-ports-06b.md)

## Accepted inputs and boundaries

Create `integrate-head-test-consumers` at `/tmp/pr-reviewer-06-head-test-integration` from clean CLI `c7111d1cc04d7598b39da1d1aac25655764cfea7` (including B1 delivery `e9f107d`). Merge released auth `a63293df0873ab37ee689a5c8989b51546b82df6` and SDK `9a271e04b49df49f27401814e5d67df5a2b872cd`. Root has consumed bounded B1 readiness, single-owner source/browser readiness and SDK correction readiness; CLI review is concurrent on frozen c711. These receipts do not prove the combined tree. Auth PR25/main/pilot remain root-owned; no remote/primary writes or live runtime changes here.

The latest single-user policy uses the auth subsystem's trusted in-process `store.localOwner` identity object. It creates no browser credential or replacement login. Test HTTP endpoints use the same gateway-selected `StorageAccess` as review/import/analysis/story. Explicit invalid/participant Bearer input never falls back to local-owner authority. Test public read/command/artifact ports accept StorageAccess; new local-owner intents retain the existing stable private owner reference, while legacy hashed credential references retain their previous lookup/revocation semantics. Restart resolution uses the shared localPrincipal resolver, never a guessed token or serialized copy of the identity object. Actor/review/snapshot, participant attachment-generation and mutation restrictions stay in force.

The SDK integration retains exact client/server2.4.0 declarations and locked core2.4.0, all modern/legacy factory-instance regressions and exact-session boundaries. Preserve every B1/CLI/SDK test in the normal entrypoint and all unrelated dependencies. Task-local frozen install of these already authorized declarations is permitted; no new runtime/global setting/dependency choice. Source/closure qualification is invalidated by changed source/dependencies and must be measured afresh only after the combined candidate freezes.

## Sole integrator scope and sequence

Permitted: task merges and semantic conflict reconciliation; narrow test-specific gateway/storage access compatibility; directly supporting tests; package scripts.test inventory and frozen lock coherency; owning test-execution and round/slice integration knowledge. Retain the auth UI/application baseline exactly, with no new test panel or B2 implementation. Preserve all process journals/minimum quiescence, receipts, budgets, cleanup and lease policy; no runner redesign. No new native wake, base/head comparison, pilot, MCP runtime or GitHub actions.

1. Commit this source packet before merges/derived repairs. Record actual merge conflicts and preserve both parents' intent.
2. Run strict/boundaries and targeted access/CLI/MCP regressions against the merged tree; preserve concrete RED compatibility failures. Derive only the specified StorageAccess adaptation.
3. Exercise actual credential-free gateway + actual CLI process through request/status/stored result/artifact and cancel using controlled execution fixtures; assert same IDs, no credentials and independent questions. Fixtures remain labeled test_only_execution; no production qualification claim.
4. Run the combined registered normal suite and relevant actual React E2E for merged auth/SDK behavior. Return a clean committed typed consumer checkpoint before B2 dispatch. Any later exact-source qualification is a separately pinned receipt after source freeze, never reuse67/7ef or an old dependency donor automatically.

## Observable acceptance and independent handoff

| ID | Observable requirement |
|---|---|
| I1 | No-header test catalog/command/job/artifact use local owner. Invalid header/Bearer/copy of owner object cannot acquire user authority. Participant reads retain attachment scope; test mutations remain user-only. |
| I2 | Local-owner test intents survive store reopen without a credential row, retain exact actor/source/target/receipt identity and preserve original unknown/no-replay recovery. Legacy credential revocation behavior is unchanged. |
| I3 | Actual CLI process against actual gateway returns the identical stored fixture job/result/artifact with lossless byte identity; queued cancel is explicit and questions remain independent. |
| I4 | Combined strict/boundaries/normal inventory and auth/SDK React journeys pass, with all unchanged process/lease/cleanup regressions retained. |
| I5 | Durable public ports and B2 readiness inputs name actual delivered scope/identities, tests and limits; independently reviewed backend interfaces do not imply product acceptance. |

Root assigns a fresh independent reviewer to the committed combined candidate, read-only by default, with this packet and owning [test-execution contract](../../../../product/review-loop/test-execution.md). Inspect merge semantics, private owner reference versus old credentials, explicit Bearer no-fallback, same-job CLI evidence, SDK locked versions/regressions, test inventory, and preservation of B1 authority/cleanup. Return exact findings/evidence and bounded readiness, not UI/own-PR acceptance. B2 remains root-assigned after this stable checkpoint; no writer is dispatched by this document.
