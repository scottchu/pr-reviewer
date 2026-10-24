# B4 public response codec amendment

Date: 2026-10-24
Status: accepted bounded extraction assigned; implementation and independent narrow review pending
Owner: `/root/plan_head_test_slice06`
Source: `9671b467661982eb0b9998e0ccb02055c3c1706e`
Parent: [B4 integration](integration-06b4.md), [consumer ports](consumer-ports-06b.md)

## Concrete gap and accepted repair

B4 passes independent integrated engineering review, but the B2 HTTP bridge cannot consume runtime response schemas through the domain public boundary: the schemas currently live privately in scripts/head-test-protocol.ts. The types alone are insufficient to validate untrusted HTTP responses. Root assigns this narrow extraction before B2 consumer implementation, while B2 owns its separate application/UI work and docs.

Expose headTestTargetsSchema, headTestReceiptSchema, headTestViewSchema and headTestArtifactViewSchema through src/domain/public.ts, implemented in a domain-owned response module. Preserve existing canonical target checks, bounds, strict object parsing and exact optional output types. Keep the CLI aliases cliTargets/cliReceipt/cliView/cliArtifact as re-exports of those same schema instances, eliminating duplicate policy. No Node/fs/crypto/Buffer runtime dependency in the browser-consumed schema module. Contextual scope/revision/result digest/artifact byte-integrity checks stay in each consumer; extraction does not claim structural parsing proves those identities.

## Writer and review handoff

Use isolated branch expose-head-test-response-schemas at /tmp/pr-reviewer-06-head-test-response-schemas. Editable: new domain response module/public exports, narrow CLI alias module, focused tests and normal test registration, owning test-execution knowledge and this amendment/consumer handoff. No B2 UI/application, gateway, MCP, package dependency/lock, main, pilot or native effects. Commit this accepted amendment before derived changes.

TDD: demonstrate missing public exports, then parse actual catalog/receipt/job read values and bounded artifact fixtures; reject unknown keys, changed fixed target, oversized/invalid nested values; preserve absent optional properties. Assert CLI aliases are the exact public schemas and browser-target bundling has no Node runtime dependency. Run strict TypeScript, subsystem boundaries, the new tests and existing CLI plus actual integrated gateway/CLI checks. Register the new tests in the normal entrypoint; no repeat of unchanged25-browser/full production qualification is required.

Root assigns an independent narrow reviewer to the committed extraction. Verify semantic equivalence against the original CLI codecs, browser suitability, exact optional behavior, contextual-validation limits and existing CLI regressions. Return precise committed export names immediately to root and B2; no uncommitted schema handoff. This amendment does not qualify a production head or accept the React/product slice.
