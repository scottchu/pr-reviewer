# B3: credential-free thin owner HTTP CLI

Date: 2026-10-24
Status: implementation assigned; controlled HTTP engineering only until auth integration
Packet revision: B3.1
Owner: `/root/plan_head_test_slice06`
Parent: [slice06](plan.md), [consumer contracts](consumer-ports-06b.md), [durable CLI specification](../../../../product/review-loop/test-execution.md#execution-amendment3-cli-and-react-consumer-contract)

## Accepted intent and exact inputs

A local owner can request/cancel a configured test and inspect the same durable job/result/artifact without a manual app token or a second execution authority. Root consumed the independent `7ef680f` backend recheck and accepted the bounded B1 gate. Start from `e9f107df593b19f5126bdcfaca3ed0200c6e45f0`; preserve its exact-source engineering receipts. Latest single-local-owner direction supersedes the prior credential-reference CLI paragraph. The parallel auth writer confirms unchanged runtime.json.gatewayUrl and HTTP route locations; credential-free gateway behavior is pending separate integration. No runtime/credential file needs to be read for this bounded CLI: use explicit loopback --gateway.

## Named implementation scope

Executor: `/root/plan_head_test_slice06`, branch `implement-head-test-cli`, worktree `/tmp/pr-reviewer-06-head-test-cli`.

Editable: `scripts/head-tests.ts` and directly needed CLI script modules, `tests/head-test-cli.test.ts` and private fixtures if needed, `package.json` scripts.head-tests and scripts.test registration only, owning test-execution CLI knowledge, this B3 packet and its slice link. No B1 domain/storage/server/process behavior changes; no UI/application, MCP, dependency/lock, native/pilot, global configuration or GitHub writes. Existing Node24 only; reuse declared installed dependencies through task-local package links, no installation or shared generated cache mutation. Root owns integration and live delivery; parallel writers retain auth/UI and SDK dependency ownership.

## Vertical checks and independent review

| ID | Observable behavior | Required verification |
|---|---|---|
| C01 | targets/request/status/result use exact scope and command/revision, returning the same job/stored result | Spawn actual CLI processes against a controlled loopback HTTP contract fixture; inspect exact requests and outputs, including stored failure with exit0 |
| C02 | cancel is one explicit command and preserves intent versus stopped distinction | Exact commandId/job/CAS; no automatic replay or state inference |
| C03 | artifacts retain exact byte identity and optional lossless streamed Unicode text | Split CJK/emoji at 65,536 boundary; page metadata consistency, hash/limits, JSON escaping; corrupted page rejects without partial output |
| C04 | malformed arguments, response schemas, errors and transport uncertainty are bounded/honest | No request for invalid args, no credentials/Authorization, no redirects, no mutation retry after socket loss, schema/identity rejection, oversized body/output/error sanitization |

TDD: establish failing actual-CLI checks before implementation, then focused tests, strict TypeScript and boundaries. Register the new suite in the normal test entrypoint and run that entrypoint with existing Node24/Bun. Controlled HTTP responses are labeled fixtures, not real store/runner/qualification or auth evidence. Existing B1 runtime probes are not repeated for this client-only change. After clean auth/backend integration, root assigns actual gateway + CLI same-result checks and React/own-PR acceptance separately.

Independent reviewer: root assigns an agent other than the implementer to the final committed B3 candidate, diff base `e9f107d`. Read owning CLI contract, this packet and public domain types; inspect only CLI/contract/tests/registration changes. Reproduce C01–C04, scrutinize no-token/no-runner authority, mutation uncertainty, strict response identity and artifact decoding/bounds. Return concrete severity/evidence and bounded ready/changes-needed conclusion; do not infer auth, React or actual own-PR acceptance from fixtures. No publication or live runtime authority is delegated.

Required return: clean candidate hash, changed files, scope-to-test evidence including RED/GREEN, normal entrypoint/strict/boundary results, endpoint contract for auth integrator, exact unresolved integration gates, and maintained durable knowledge. Stop affected work for a material endpoint/schema mismatch or new authority requirement; continue independent fixture work. No extra generic approval gate.
