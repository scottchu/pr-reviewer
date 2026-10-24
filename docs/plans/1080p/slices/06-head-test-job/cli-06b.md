# B3: credential-free thin owner HTTP CLI

Date: 2026-10-24
Status: implementation and controlled HTTP checks passed; independent review and auth integration pending
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


## Implementation evidence and return

The committed candidate adds only the CLI entrypoint/response codec, actual-process CLI test suite, script registration, and owning CLI knowledge/handoff reconciliation. The response codec is explicitly typed against domain public values, including strict optional-field handling; it is a client boundary, not a second job domain or runner. Current CLI references in the older consumer/integration/execution handoffs now point to B3 rather than retaining contradictory credential-reading instructions.

- RED: five initial actual-process cases failed with the entrypoint absent; `/tmp/pr-reviewer-06-execution/evidence/cli-red.log`, SHA256 `4a0846e2ef11dd4f1a6dbbdeb47515ffe7df3e6d0004d1e56b9b307eb7da94e0`.
- GREEN: nine final CLI process cases passed, including single request/cancel, stored failed-result exit0, byte/Unicode/control-character rendering, malformed original UTF-8 preservation, changed artifact identity/hash, minimum revision/result identity, malformed/oversized responses, endpoint restrictions/redirects, typed errors, dropped acknowledgement and10-second deadline with no retry. `/tmp/pr-reviewer-06-execution/evidence/cli-final-focused.log`, SHA256 `611ce7b8977858d6853f27e99df0fcbae51d3d3fe8bf8ddf237b0cf54fd17168`.
- Normal declared entrypoint passed47 Bun +365 Node, zero failures; `/tmp/pr-reviewer-06-execution/evidence/cli-normal.log`, SHA256 `21f993ae58b7331cae04e1354ec2a297af1a7ba9f755fd52f406cc50b17d040e`. All63 top-level suites are registered. The final focused run additionally strengthens rejection of non-loopback/path/query endpoints; implementation is unchanged from the normal run.
- Strict TypeScript, subsystem boundaries and whitespace checks passed. Package comparison confirms only scripts.head-tests and scripts.test changed; dependency metadata, other scripts and lock remain unchanged. `bun run head-tests -- ...` forwards the documented arguments; a deliberately unavailable loopback endpoint returned a typed transport error, not an executed job.
- The CLI response codec accepted the retained exact7ef public job/result as a read-only compatibility check. No gateway request, real test execution or fresh source qualification was performed for this CLI change.

All controlled HTTP servers and actual CLI child processes completed and closed. The task worktree and external logs remain retained for independent review/integration; no disposable runtime service remains. No native/pilot/MCP/GitHub operations occurred. Root must integrate the credential-free auth branch before actual gateway + CLI acceptance; future SDK integration requires fresh qualification of the final source/closure. B2 React and real own-PR same-result/question/cancel/comprehension gates remain separately open. No fixture is labeled a production job.
