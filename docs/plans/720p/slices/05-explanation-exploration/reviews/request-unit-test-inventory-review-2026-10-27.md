# Bounded PR25 request/test inventory review

Status: source-only evidence review, 2026-10-27. No test execution, browser check, runtime action, or product edit.

Reviewed Git comparison: base `b096826e31c0927190806de91ed70b8b64aa93d8`, head `e3b270e5f49a9215452b0b86702946043e979059`. This concerns represented PR25 tests, not tests of the current graph implementation.

## Confirmed gap and cause

There are relevant non-E2E tests. Neither pinned revision has `.test.*` or `.spec.*` files under `src/application`; the relevant suites are under `tests/`, rather than colocated with `review.ts` or `local-access.ts`.

The current graph imports `reviews/request-test-evidence-v1.json` through `mockups/pr-file-tree/minimal-graph.ts:1`. That packet line 7 explicitly selects prepared exact function mappings and says “retain one review-owner-changed case and stop.” Thus E2E-only output follows a curated one-case selection boundary; it does not establish absence of unit/application tests. Searching only direct `accessHeaders`/`localOwnerSession` names misses tests entering through the public bridge.

## Actual test evidence

| Pinned source | Comparison | Exact relevance and limits |
| --- | --- | --- |
| `tests/application.test.ts:392–447` | Unchanged: both Git blobs `90fc45333960a14cf7f2dcbd2c387b875146e1dd` | Parameterized `disposed ignored-abort read settles ${obsoleteCompletion} without owning the reconnected lifetime`, with variants `before-new-read`, `after-new-read`, `failure-before-new-read` at line 391. Line 398 captures the actual fetch Authorization header; lines 404 and 415 login with old/fresh credentials; line 418 asserts `Bearer fresh-credential`. This is retained explicit-credential regression evidence, not a test of the new local-owner/no-header branch. |
| `tests/application.test.ts:38–78` | Same unchanged blob | `application preserves unknown command identity, reads accepted revision and disposes/remounts routes`: real bridge login and request flow, assertions about command identity, accepted readback and route disposal. Its fetch mock does not assert header selection. |
| `tests/recovery-application.test.ts:8–11` | Unchanged: both blobs `c1d41a39278e6b524d0070820210579f3b72ec7d` | Setup creates the real bridge/gateway; `S11 actual gateway commit then dropped ack survives new bridge; explicit same-credential replay retains one question` exercises recovery and same-credential replay. Application/integration context, not direct helper-branch verification. |
| `tests/gateway.test.ts:90–114` (head) | Newly added test in modified existing file | `single local owner reads and writes without a Bearer while explicit invalid credentials never escalate`. Lines 97–109 issue no-Authorization HTTP requests and assert owner reads/writes/readback; lines 110–112 assert invalid and inappropriate connection credentials remain 401. This verifies the related server policy, not a call to the client helper. |
| `tests/runtime.test.ts:14–108` (head) | Existing test modified | Added assertions at 39–44 and 88–97 cover no startup human credential, no userCredentialRef, no-auth reads, untrusted Host rejection, and retained legacy credential not required for restart. Supporting runtime-policy context; not client helper coverage. |

The source-backed client path is explicit: test import/wrapper `application.test.ts:3–8` → public re-export `src/application/public.ts:29` → `review.ts:99` login calls refresh → `review.ts:38` refresh calls request → `review.ts:30` request spreads `accessHeaders(captured)` → `local-access.ts:3` preserves Bearer for explicit credentials. Before refresh calls request at B37 and request constructs Bearer at B29. This is a static source chain, not execution evidence from this review.

A bounded pinned-head search under `tests/` found no direct mention of `accessHeaders` or `localOwnerSession`. This does not prove absence of indirect local-owner behavior coverage; the changed E2E/gateway tests must remain distinct evidence.

## Smallest truthful correction

1. Retain the already prepared modified `review-owner-changed` E2E comparison.
2. Prepare the unchanged application credential test definition with exact before/head occurrences and all three parameter variants. Use one logical test identity with unchanged comparison evidence; do not invent a TestChange. Connect the source-observed bridge/request chain and the explicit Bearer assertion with their actual scope.
3. Include the added gateway test as a genuine changed/added test case related to the same documented local-owner policy. Do not label its HTTP assertions as direct `accessHeaders` coverage. Record the modified runtime test as supporting context or an explicit remaining inventory frontier.
4. Replace the one-case-stop selection with a reproducible bounded inventory: direct symbol tests, public-entrypoint callers, and explicitly asserted policy behavior; record included and excluded suites with reasons. Preserve canonical source packets and compile a new versioned test-preparation artifact.
5. Preserve test definition/change/run distinctions. This review establishes source presence and assertion scope only; no new Run or PASS may be manufactured. Current graph implementation tests are outside represented PR25 test membership.

This is not a whole-repository coverage audit. It identifies concrete omitted unchanged and changed tests and the selection rule causing the current misleadingly narrow projection.

Machine-readable bounded evidence: `request-unit-test-evidence-v1.json` records fixed Git blobs, source/range SHA256, inclusive line ranges, UTF16 intervals, both unchanged application witnesses, the added gateway definition/native diff and indirect source chain. The exact Bearer assertion is line 418 (earlier dispatch said 419; corrected by numbered source readback).

## Fixed compilation source review

Reviewed fixed candidate `020c6897c694adbc6c8e4f23a9c13dd43702a179` against centered-port application `af4c2674bde2f702d850b49dd31098aecbc8412f`, with docs packet `7e16a28`. Independently read the new `mockups/pr-file-tree/prepared-test-coverage.ts` and its comparison composition, row projection and durable/slice docs diff. No semantic blocker found within this bounded correction.

The application test remains one unchanged definition with both revision witnesses and its line418 assertion; no TestChange is created. Its verification is explicitly retained credential behavior through an indirect source chain, not local-owner/helper-branch coverage. The added gateway test has an actual Change group, bounded named-definition Before absence and Head90–114 test/assertion/File evidence. Its source-declared HTTP-policy verification is separated from the client change’s inferred shared-policy relation. No false client call, measured goal or Run/PASS is introduced. The previous modified E2E remains. Runtime/recovery are explicitly outside this addition; supplemental source evidence does not claim retained Snapshot admission.

Author reports nine targeted tests, owning mockup strict compilation and build passing; this reviewer did not execute them. This source result does not establish actual layout/label readability, gesture preservation, published candidate identity or fresh UI comprehension; those require the separate actual-candidate review. Original source packets and existing model behavior are outside a new full audit here.


## Latest added-test projection correction (review pending fixed successor)

The user rejects a synthetic Before node for an added test and parent-group→own-child arrows. Read fixed b0a914a: prepared-test-coverage.ts:15 creates gateway-policy-before-absence from classification evidence; :19 emits gateway-test:before to it and gateway-test:after to the actual nested test; :28 emits gateway-absence:checked-in. minimal-projection.ts currently omits Before/After parent edges only for isPairedSubject, so a newly added test retains the unwanted branches.

The bounded correction preserves the source packet, full Base absence/native diff and addition basis as Change evidence, without fabricating a Before source entity or branch. Remove the compiled absence node and its before/absence_checked_in edges; group membership already expresses actual nested content, so omit parent-group→its own child structural comparison/containment arrows generically. Keep actual test→assertion contains, source-location, verification/policy/inference and not-run records. Do not suppress every contains relation or ordinary source Before/After evidence. Existing ontology already permits supported absence; it does not require absence to be a source entity. No new ontology/schema is necessary. Prior bounded source honesty review did not establish this subsequently clarified projection outcome; fixed-successor review remains pending.


### Fixed successor7681e27

Reviewed `7681e278dfd942638e49fefa1c55248b1ffc3cc1` versus b0a914a: compiled supplementary test data, generic projection filter, focused regression assertions and new owning pure-addition/membership docs. No blocker in the bounded correction. The synthetic absence entity, gateway-test:before and gateway-absence:checked-in are removed. Full pinned Base absence/native diff remain on Change.data; add classification and actual Head test/assertion/File/HTTP-policy evidence are retained. The original source packet is unchanged. Gateway-test:after remains a genuine comparison record but is not drawn because its actual target is the Change graph's child. The membership-based filter also omits other parent-graph→own-child arrows; test→assertion contains is explicitly retained and tested. No fake Before occurrence, TestRun or PASS is introduced. No new ontology/API/schema is required.

The focused pure-add test now asserts absence stays provenance, not a Before node/branch; the projection test checks every actual parent-child structural edge and retains genuine test→assertion containment. These are appropriate concrete counterexamples. Author reports19focused pure checks and owning strict compilation passing; this reviewer inspected source/test assertions only and ran none. Publication, actual no-fake-Before rendering, geometry and retained interactions still require their separate candidate-bound evidence. This source conclusion does not close unfamiliar-reviewer comprehension/full journey acceptance.
