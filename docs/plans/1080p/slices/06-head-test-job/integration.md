# Slice 06 integration and role handoffs

**Date:** 2026-10-24

**Handoff revision:** 1; exact source input `67b24f31dd322d034c0a2ec6b73006c009fba310` plus the commit containing this packet.

**Status:** Ready for independent plan review only. No implementation agent is assigned or authorized by this file alone.

**Parent:** [Slice plan and gates](plan.md).

**Normative knowledge:** [head-test-v1](../../../../product/review-loop/test-execution.md). Existing [reactive ownership](../../../../product/reactive-design.md), [development](../../../../rules/development.md), [handoff](../../../../rules/agent-handoffs.md), [graph-first review](../../../../rules/graph-first-review.md) and [own-PR](../../../../rules/own-pr-dogfood.md) rules apply.

## Versioned boundary and composition

The following are exact proposed interface responsibilities, not an already delivered export inventory. Implementers may choose local helper names but cannot change values/authority/evidence meanings without first updating the durable specification and this handoff.

| Owner / public surface | Inputs, outputs and boundary |
|---|---|
| Domain/public | Strict RequestTest/CancelTest, TestReceipt, ConfiguredTarget, TestJobView/TestResult and artifact query values from head-test-v1; canonical target/manifest identity and deterministic transitions. No process, filesystem, database or UI work. |
| Store/public test owner | Authenticated test command/query methods under the existing store; globally colliding receipts, snapshot membership, active credential recheck, short atomic job/reservation/result transactions; private TestOwner/TestGrant. Existing source resolver becomes a narrow owner-composition/public value port, never another subsystem's SQL/internal import. |
| Store/private execution lease | Add test kind and startup unresolved test occupancy to the same epoch/lease. Test job effect disposition distinguishes unknown-unresolved from unknown-confirmed-quiescent. All import/analysis/test claims use that predicate atomically; old owners cannot journal/lookup/admit/release. |
| Test jobs/public | One gateway-owned runner over store public ports, injected qualified target/runtime/environment/source locator and owned artifacts. `wake`, `stop`, bounded diagnostics; no-op wake retains actual active promise. Fixed test process policy is separate from acquisition commands and semantic worker framing. |
| Test jobs/private preparation/artifacts | Raw complete Git object tree and verified copied closure; task-owned path factory; immutable manifest/log artifact ports. Witness construction private to verified preparation. This may stay within test jobs; no generic materializer/SDK/storage framework. |
| Server/public | Existing commands plus strict authorized POST test read routes; compose one test runner with existing owners. Signal all owners before awaiting shutdown; no UI-bound runner. Runtime root/config remains owner supplied and private. |
| Application/public | TestBridge immutable authorized state, exact request/cancel/readback intent, pending identity, lifecycle fences and bounded polling; workspace owns selected source/story/drafts as before. Connect after review authorization without parallelizing analysis/story hydration. |
| Integration registry | Three declared test routes and bounded diagnostic projections from head-test-v1; no direct internal subscriptions. |
| React UI | Configured target/select/run/cancel/history/evidence components use application public ports. Inert output, keyboard/focus/status affordances, stable source context; no policy or command fabrication in components. |
| Owner CLI | Thin TypeScript HTTP client using same schemas, credential reference and receipts. No native participant utility reuse as execution authority, second store, shell runner or token stdout. |

Initial storage support is additive: existing records/receipt meanings are retained, test tables/columns are created under the owning store, and legacy DBs without tests still initialize. Initialize one epoch before all runners. The migration/check order must allow the shared unresolved scan to find test occupancy before any runner claims. Pure domain validation and heavy source/closure/result hashing occur outside transactions; apply-time authority, limits, cancellation and immutable identity conflicts are checked again inside them.

Boundary checker additions are only the test-owned edges needed above. The gateway may import test-jobs/public; application/UI may not import storage/process internals. Any extraction of existing process helpers must preserve fixed acquisition and semantic authorities and their independently tested behavior. No widening of `Command` to a public arbitrary executable is permitted. Maintain explicit functional/immutable inputs and testable effect ports; no new reactive library or package split.

## Implementation handoff I1

**Requested endpoint:** Complete T01–T09 and provide evidence for T10 through06A–06C; do not accept the slice or deliver main/pilot yourself.

**Assignment state:** Unassigned. Root must name the executor, exact packet/source commit, descriptive task branch and isolated worktree in a committed amendment before dispatch. Root may retain one executor across these sequential chunks. The sole integration writer owns shared files and durable knowledge; bounded helpers may be delegated only with separate nonoverlapping committed scopes.

**Required source reads:** README/AGENTS; this packet and parent; head-test-v1; owning import/semantic/story/reactive public contracts; applicable development/documentation/handoff rules. Read current immutable source only where needed to reconcile actual seams. The external readiness memo is historical rationale, not an additional authority.

**Editable scope after assignment:** New test domain/storage/runner/application/CLI and React components/tests; narrow existing store/shared lease/gateway/workspace/integration boundary checker changes; this slice and its owning durable docs. Existing package scripts may change only for an explicitly required CLI/check/test entry under the sole integration writer; no new dependency/runtime/lock change without documented need. Do not edit05 evidence or another agent's worktree. No native adapters/auth/passkey/pilot/global configuration changes.

**Inputs/readiness:** G0 review and committed assignment, reconciled G1 source/owner boundaries;06A can retain G2/G3 unavailable explicitly.06B requires qualified exact runtime flags, source/dependency copy/environment contract and amended definition digest.06C requires06B committed interfaces and real result/termination observations. No source fallback, install or external effects to satisfy a blocked environment.

**Steps:** Implement the numbered vertical chunks in the parent sequentially, with public values and short owner transitions tested before effects. Each commit updates the slice's observed outcome and durable design before the next consumer begins. At each chunk exercise actual React behavior stated in its row, plus strict checks/relevant tests. Reserve full actual own-PR comprehension for the fresh reviewer; implementer dogfood does not consume that role.

**Run authority:** Candidate/test-only data root and loopback runtime provided by root's assignment; owned source/dependency/temp copies beneath its declared execution root; existing Bun/Node only; reviewed local Git raw reads. A root path/port not yet assigned is a missing dispatch input, not an invitation to reuse pilot/old data. Use test-only registry injection for controlled child fixtures; ensure it cannot be selected via production target IDs or public fields. Never expose credentials in fixture output.

**Stop conditions:** New network/install/runtime/native/global/security/destination need; missing source object or unverifiable closure; broken predecessor auth/source/atomicity; unknown ownership that cannot be reconciled; tests revealing arbitrary source/config execution or shared mutation. Preserve precise evidence and pause dependent effects, continue independent authorized validation. Do not weaken an acceptance criterion to match code.

**Required return:** Committed candidate/head; changed contracts and owned paths; T01–T09 trace with commands/outcomes and actual versus fixture labels; actual React/CLI screenshots/readbacks; exact source/target/runtime/environment/artifact identities; process fault/quiescence evidence and limits; regression results; promoted durable knowledge; blockers and next consumer inputs. No bare test counts or ready claim without source/environment identity.

## Independent plan-review handoff P1

**Role:** Fresh reviewer other than this planning author. Read-only. Root assigns the exact planning commit/worktree and receives findings; no product writes or implementation dispatch.

**Question:** Can the proposed source/target/environment/authority/lifecycle contracts be implemented as one bounded useful head-test journey without weakening predecessor guarantees or requiring ungranted effects? Does durable knowledge suffice to derive the behavior without the temporary proposal or old plans?

Review G0–G5 readiness honestly, registry literal matching, script-only metadata rule, direct runtime-option gate, complete source vs bounded snapshot, dependency isolation/provenance, atomic shared unknown occupancy, result/cancel/receipt/epoch races, artifact/quota semantics, exact CLI identity and React-owned state. Evaluate whether T01–T10 and chunk scopes establish observable acceptance with appropriate effort limits. Identify any unresolved policy masquerading as executable readiness. Read immutable67 source only to validate actual public seam feasibility; do not run target/pilot/native effects or mutate dependency donor.

Return PASS FOR DESIGN REVIEW, CHANGES NEEDED or BLOCKED with concrete document location, rationale, severity, affected gate/acceptance and proposed minimal repair; distinguish plan readiness from implementation dispatch and product acceptance. A passed plan review does not fill missing runtime qualification, real PR or named executor inputs.

## Independent engineering handoff R1

**Assignment state:** Not ready until candidate/evidence exists. Root assigns a reviewer other than the implementer, exact clean candidate commit/build, packet revision, diff base/head and isolated read-only source. Reproduction runtime authority/root is explicit in that dispatch.

**Scope:** All T01–T09 and relevant T10 code/spec consistency, no edits by default. Reproduce highest-risk real process/transaction/fault evidence through public ports; inspect effective target/environment/source preparation and artifact admission, not only mocks or output snapshots. Read actual diff against accepted durable spec and packet. Check existing import/analysis/schema migration and05C story/question/startup regressions. Test fixtures, real target, native/user evidence remain separately attributed.

**Required attacks:** Extra command fields and cross-family IDs; target revision drift; old/revoked owner/attachment reads and grants; shared lease row missing at restart; quiescent unknown versus unresolved unknown; cancel/exit/admission order; source/dependency donor mutation; symlink/path/config/autoinstall escape; truncation/invalid artifacts/quota reservation races; reused PID/TERM-resistant descendants/inherited pipes; loss between intent/spawn/start/result publication/DB acknowledgement; stale UI/CLI readback against a newer job; subscriber disposal without duplicate effects.

**Return:** Concrete source/evidence-backed findings with affected acceptance and severity; actual independent checks and limits; READY FOR BOUNDED ENGINEERING, CHANGES NEEDED or BLOCKED. Missing actual React/CLI/process evidence cannot be converted to pass by API-only verification. Fixes require new pinned candidate and affected rechecks.

## Independent product/graph handoff U1

This role must remain fresh: do not preload this implementation boundary table, candidate diff, source answer key or engineering report. Root supplies only actual UI access, pinned own-PR/candidate identities, the neutral task in the plan, supported scope and the graph-first protocol. Source-informed verification is a different role.

First freeze A using actual story/graph; then source/diff B and ease critique. Retain immutable A and timestamps, observed interactions and gaps. Review the actual configured run/result UI and same CLI evidence, and ask a meaningful anchored question without inferring host causality from a fixture. Report fast-run/queued-cancel/unknown limitations exactly. Required result is a bounded understanding disposition, not control coverage or graph edge count. Visual design critique uses decompozr/design-system guidelines separately from React E2E and comprehension.

## Acceptance and successor handback

Root reconciles engineering and product findings, promotes learning to durable knowledge and assigns fresh whole-current-product docs-only rebuild audit after the milestone. An auditor reads maintained product/rule docs only, not this packet/plans/code/chat; the audit is knowledge readiness, not an actual rebuild or native outcome.

After06 acceptance, update the1080p07/08 dependency rows with delivered exact target-definition schema/revision, source/environment manifests, job/result/artifact IDs and query/CLI semantics, lease/quiescence and authority interfaces, verified limits/test assets and remaining gates.07 must establish two separately qualified pinned environments and explicit incompatibility;08 must design subscribed terminal-event eligibility later. No base/head comparison, terminal-event inbox, agent wake, correction workflow or automatic successor readiness is implemented here. Create their individual slice plans only when root plans those actual deliveries.

Root alone records PR/merge/pilot version/health/use and retained rollback. The planning author returns a locally committed docs-only packet and retained worktree for review/integration; publication/deployment is not part of this handoff.
