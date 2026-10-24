# Configured-test durable knowledge reconciliation

Date: 2026-10-24.

Status: author documentation correction complete; fresh whole-product docs-only audit remains required. This is not slice, runtime, graph-comprehension, production qualification or deployment acceptance.

Source pin: `79ab8b09817b0d7eae8a2052d3ef6ff72ad17631`. Isolated branch: `document-test-persistence-contract`. Application, dependencies, configuration and tests are unchanged. Effective inherited model/effort telemetry is unavailable. Configured-test engineering belongs to this integration candidate; test jobs are not on main `e3b270e`.

Input audit: frozen docs snapshot `e568ff9ffed285368c933559e2db1e75b629adbd`; `/tmp/pr-reviewer-focused-canvas-docs-audit/report.md`. Its qualified NO identifies configured-test knowledge gaps R1–R4, not a canvas defect. This correction addresses those findings only.

## Finding map

| Finding | Durable correction |
|---|---|
| R1: physical and identity-bearing values missing | [Test compatibility](../../../../../product/review-loop/test-compatibility.md): exact tables/keys, private/public/nested shapes, optional/null rules, artifact locators/raw bytes, reservation/cleanup/journal semantics and canonical identity recipes. Complete [nonsecret whole-record vectors](../../../../../product/review-loop/test-compatibility-values.json) cover queued, unfinished, quiescent unknown, admitted result/artifact and pending cleanup, with reproducible environment, qualification and result digests. |
| R2: separate private recovery protocol missing | Same contract: sessionStorage key, exact owner-scope recipe, envelope, receipt-derived phases, no additional whole-record byte cap, write/read/clear behavior, corrupt/unknown/legacy scope preservation, complete uncertain/receipt-present examples and synthetic legacy scope hash. Actual distinctions from question recovery are preserved without inventing migration or stronger persistence guarantees. |
| R3: unspecified exact qualifying config | Same contract: complete strict JSON value, absence allowed, explicit defaults required, accepted/rejected examples and package/config scan policy. |
| R4: contradictory current inventory/status | Product indexes, test execution/UI, persistence extension and reactive inventory distinguish candidate engineering from historical checkpoints/main and remaining product gates; current route names, 200ms owner observation, 500ms consumer polling and 10000ms request bound are explicit. |

## Direct source readback

The fixed source was consulted to recover behavior, rather than treating historical plans as normative formats:

- `src/domain/head-tests.ts`, `src/domain/head-test-responses.ts`: exact target/command/public codecs, canonical digest and strictness rules.
- `src/storage/head-test-contracts.ts`, `src/storage/head-tests.ts`, `src/storage/head-test-owner.ts`: physical rows, private journals/owner fencing, quota, cursor, admission and cleanup.
- `src/test-jobs/public.ts`, `outcome.ts`, `evidence.ts`, `files.ts`, `source.ts`, `source-account.ts`, `preparation.ts`, `git-process.ts`, `bun-process.ts` within that directory: source/closure/qualification/environment/result preimages, raw artifacts, verification accounts and launch environment.
- `src/application/head-test-session.ts`, `src/application/head-tests.ts`, `src/application/private-session.ts` and responsible workspace/coordinator registration sections: private lifecycle, authority/read generations, public consumption, routes and defaults.
- `tsconfig.json` and the supported compiler configuration literal in source-account: exact observable equality policy.

Relevant source sections were read; this was not a whole-codebase independent review. No new format, migration, replay, cleanup or process authority is introduced. Serialized witnesses remain insufficient to recreate branded in-memory authority. The separately assigned application correction is outside this packet.

## Validation and retained evidence

Existing Node24 `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node` ran a task-local read-only validator using fixed source codecs and an in-memory private storage adapter. Only a task-local ignored zod entry link references the existing integration donor; no installation or shared dependency mutation occurred.

Passed: four public job projections; receipt/artifact codecs; canonical environment/qualification/result hashes and canonical strings; artifact raw SHA-256/base64; exact private key/envelope save/read/clear; five malformed/mismatch cases preserving raw records; compiler JSON equality with pinned repository value; existing credentialScope against the synthetic UTF-8 preimage; command fingerprint using existing canonicalization; exact physical table/column strings against initializers.

There is no whole-private-job runtime schema in this source: private jobs have TypeScript contracts. Their public projections and the real private-session reader were checked, not a claimed private admission-schema pass. These are representation checks, not storage admission, process observation or qualification. Synthetic values do not create witnesses. No unchanged application suites, browser, pilot, native host, network operation or live execution were run. Local documentation-link and whitespace checks pass.

The coordinator integrates this docs-only commit with the sole product author, then supplies a new durable-docs-only snapshot to the fresh auditor. This receipt and source are excluded from that auditor's rebuild-readiness inputs.

## Evidence hashes

- Input audit: `/tmp/pr-reviewer-focused-canvas-docs-audit/report.md`; SHA-256 `e0dbb4c9ab6ef83cdd74dd152c2c9f2039d2dc5432b0c133180f558d881fd49b`.
- Validator: `/private/tmp/pr-reviewer-test-knowledge-evidence/validate.mjs`; SHA-256 `adb52b81e1cea279da433423bcce2d6a5151137281d033b846d0bd19c623d210`.
- Validation log: `/private/tmp/pr-reviewer-test-knowledge-evidence/validation.log`; SHA-256 `3f078872c9ff0c2d7c124a44f37e0ec93ecd00d31a5a442c2cdea4f7a17a440b`.
- Normative JSON: `docs/product/review-loop/test-compatibility-values.json`; SHA-256 `89b9949a1bc76e343df4ebcf1ff115a9ad471488158ed6583538bc8827cc05de`.
