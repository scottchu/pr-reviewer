# B4: integrated single-owner test consumer ports

Date: 2026-10-24
Status: combined typed consumer checkpoint implemented; independent combined review, browser verification and B2/product acceptance pending
Packet revision: B4.2
Owner: `/root/plan_head_test_slice06`
Parent: [slice06](plan.md), [B3 CLI](cli-06b.md), [B1 consumer ports](consumer-ports-06b.md)

## Accepted inputs and boundaries

Create `integrate-head-test-consumers` at `/tmp/pr-reviewer-06-head-test-integration` from clean CLI `c7111d1cc04d7598b39da1d1aac25655764cfea7` (including B1 delivery `e9f107d`). Merge released auth `a63293df0873ab37ee689a5c8989b51546b82df6` and SDK `9a271e04b49df49f27401814e5d67df5a2b872cd`. Root has consumed bounded B1 readiness, single-owner source/browser readiness and SDK correction readiness; CLI independent READY is consumed at frozen c711 (9 CLI plus4 added edge checks, strict/boundaries; report SHA25692258fc570b3fd119c5485ce92c340f32a2c4f58d2ae8f0fb05a280619bdda1a). These receipts do not prove the combined tree. Auth PR25/main/pilot remain root-owned; no remote/primary writes or live runtime changes here.

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

## Delivered reconciliation and verification

Auth task merge: `652981a733e929467d451595a433bf114ed5c39c`.
SDK task merge: `05953cc8bfb3b9cc924602ec1d9266e84522b31d`.

The auth merge reconciled storage/public imports (retain both B1 test-store and shared access imports) and adjacent continuation-plan appendices (retain both accepted intents). The SDK merge reconciled runtime knowledge (retain current credential-free workspace handoff plus SDK compatibility) and historical React MCP setup (retain no-token restart plus explicit legacy negotiation). No auth UI/application behavior was rewritten. The installed package closure is task-local, created with existing Bun1.4.2 `install --frozen-lockfile --ignore-scripts`, isolated home/temp/cache under `/tmp/pr-reviewer-06-execution/b4-install`;66 packages installed, exact lock unchanged. This is an engineering install, not fixed-target production closure qualification.

The merged RED strict check found four possibly-undefined Authorization uses in test HTTP routes. Three new observable RED cases failed: local-owner intent hashed an object; no-header catalog returned400; actual CLI failed against that catalog. The repair touches only test ingress access types/reference capture, private job-authority resolution and the four gateway test calls. Legacy string references still use the original credentials lookup; no local-owner fallback is applied to token-created jobs. No process/journal/lease/result/cleanup code changed.

| Check | Observed result | Retained evidence SHA256 |
|---|---|---|
| Merged strict RED | Four undefined Authorization errors | `merged-strict-red.log`:1f1cdc29872777e671f78babdf7e47e78b1e355998b3303973960e240832bb46 |
| New access/CLI RED |3 fail before repair | `access-red.log`:909c9e3ced71fb49f7627be1be74ff5d70385f81b2d93e8af79cc71baec3a9b6 |
| Targeted legacy/new access, owner, gateway, runner, CLI, MCP |44 pass | `targeted.log`:fa258f0d9d88b67e7e5ec615fc03ea03bfb9860fba97e9fa841fa5b7c43630e8 |
| Normal entrypoint |47 Bun +377 Node pass;64 unique top-level test files all registered | `normal.log`:619b6ab453cd4c0f0bd248db4983797e1f69cbfb14c90adebc9fa707ae462fa7 |
| Final integrated access tests with safe identity diagnostic |4 pass; behavior unchanged from normal run, adds diagnostic only | `access-final.log`:7331c0e173372334f8c6a479485ef72a54066b2781c376634fbbbdcafc1767fe |

Evidence root: `/tmp/pr-reviewer-06-execution/evidence/b4`. Strict TypeScript, subsystem boundaries and diff whitespace checks pass. Package changes after merges register only the new single-owner test; existing47-test Bun prefix, all CLI/B1/SDK cases, unrelated dependency declarations and lock are preserved.

The final actual CLI/gateway fixture used ephemeral loopback58890, job42ceb18b-9634-427a-afed-0e611373a173 and resultc9fbf7b93fc87cb943f9003568c8b66cf40fb6bfe970c81d4d026ab192fb1591. Its synthetic raw-object head da2be17cb46bf6e8395d8610213d1e4ba9ad781d executed the fixed four-file target (4 pass/0 fail); provenance remains test_only_execution. CLI status/result matched the stored job/result, and both artifact byte page and text matched the stored stderr, including Chinese/emoji. Artifact SHA256861b6a926f44f6ac3ab9904ba305ca952d0710cd1db57fe1c779f8119b58c762. A question was committed after observing actual preparing/running, without a held lease/slow target; no participant notification occurred. The no-runner fixture separately exercised actual CLI queued cancellation. Fixtures close their gateway/store/processes and remove only owned roots. This evidence is neither an actual product PR run nor a production qualification.

The current25-test actual Chrome E2E run is pending at this checkpoint, with a separate task artifact root; its final outcome will be appended without changing this implementation pin. Full integrated source qualification, B2 UI/application, visual critique, actual own-PR graph-first comprehension and slice acceptance remain open. B2 may consume the stable [public port table](consumer-ports-06b.md) only after root consumes independent combined review; no automatic assignment follows from this checkpoint.
