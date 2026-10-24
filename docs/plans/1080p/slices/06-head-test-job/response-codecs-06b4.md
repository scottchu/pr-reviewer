# B4 public response codec amendment

Date: 2026-10-24
Status: bounded extraction implemented and verified; independent narrow review pending
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

## Delivered exports and bounded verification

Docs-first commit: `baec41f`.

The domain public export names are exactly headTestTargetsSchema, headTestReceiptSchema, headTestViewSchema and headTestArtifactViewSchema. They are ZodType instances for the existing HeadTestTargets, HeadTestReceipt, HeadTestView and HeadTestArtifactView types. Each supports parse/safeParse. The implementation is src/domain/head-test-responses.ts, with only Zod and same-subsystem pure head-tests imports; external consumers import domain/public. The CLI compatibility module now re-exports these exact instances under its old aliases. No consumer-specific identity/hash/page-integrity logic moved from scripts/head-tests.ts.

A mechanical comparison against9671b46 confirms the entire schema body is identical after only import path, exported names and explanatory comment substitution. New focused regressions verify actual store values, CLI alias identity, strict/changed-target/bound violations, optional-property absence, existing structural-only limits, and successful browser-target bundling through the public exports. The new test is registered in scripts.test; all65 current top-level suites are registered exactly once. No dependency/lock or B2 file changed. Existing B4 node_modules was used through a task-local symlink for read-only test dependencies; no install or shared cache mutation was needed.

Evidence root: `/tmp/pr-reviewer-06-execution/evidence/response-codecs`.

| Check | Result | SHA256 |
|---|---|---|
| RED public response import | missing headTestArtifactViewSchema export before extraction | red.log:f7a23c62995a6abc4a7e72a565c7d3c966a6022cb5bdb3afa2e18d4fefef8c1a |
| Shared response, existing CLI and actual gateway/CLI tests |17 pass | green.log:bfcd6bac7d71a75549e0902394f4a4522c47001dd3fe18af6941e183c46b4c0c |
| Existing four-file pure Bun stage |47 pass | bun.log:77f0f45441d2215f7a3cc282bd9dafcba18455827a1f8e3c75b37601e82de607 |

Strict TypeScript, subsystem boundaries, normal-entrypoint inventory and diff checks pass. The actual gateway/CLI test retained test_only_execution provenance, used ephemeral loopback56761 and closed its owned runtime/roots. No new production qualification, full unchanged browser rerun, native-session proof or B2 acceptance is claimed. B2 can consume the committed export names after root's narrow review gate, retaining its separate request correlation/revision/result/artifact integrity duties.
