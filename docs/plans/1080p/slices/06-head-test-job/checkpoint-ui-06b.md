# B2 application checkpoint and paused composition

Date: 2026-10-24
Status: preserved local engineering checkpoint; not B2 READY or product acceptance
Implementation pin: dc06aad4174c41acfa78a8bcf084efbb9cd0cd43
Branch: implement-head-test-react
Worktree: /tmp/pr-reviewer-06-head-test-react
Owner: implement_head_test_react
Parent: [B2 packet revision2](ui-06b.md), [durable consumer knowledge](../../../../product/review-loop/test-ui.md)

## Direction and retained scope

The user required everything in one canvas, with zoom/focused lens revealing inline diff/code while preserving graph context. Root paused new UI composition and visual polish. The standalone HeadTests panel is superseded as a final composition. Preserve it and its tests as engineering material until root reconciles mocks/spec. No canvas redesign, source acceptance, final visual approval, new production qualification, deployment or own-PR acceptance is claimed.

The retained application bridge provides separate managed catalog/history, exact-job, mutation and artifact slots; immutable command persistence and explicit unchanged retry; accepted receipt recovery by original scope/minimum revision; scoped access replacement and abort/generation fences; canonical result identity/digest verification; streaming base64-byte UTF-8 artifact decoding with complete-artifact SHA256 verification. The test-specific private key includes origin, review and owner scope and never alters question/story keys. Existing explicit legacy access uses its own fingerprint/header with no fallback to local-owner authority. Workspace adds one managed review-scope route and keeps existing question/draft/story ownership.

The public codec amendment660843f was consumed through a task merge; no backend/domain/CLI/package edits were derived by B2. New application exports are createHeadTestsBridge and its HeadTestsBridge/HeadTestsState/TestArtifactState types. Workspace exposes tests. There is no new gateway, storage, process, target-configuration, terminal or participant-wake authority.

## Actual checks and limits

| Check | Observed result | Evidence |
|---|---|---|
| Persistence TDD | Missing-module RED, then3 focused checks pass: reload identity, quota/clear retention, corrupt/cross-origin isolation | New head-test-recovery.test.ts; original RED remains in task conversation |
| Bridge TDD | Missing-module RED, then8 checks pass: durable receipt/cancel, lost ack unchanged retry, stale-scope fencing, mismatched response uncertainty, fail-closed quota, real fixture runner and split UTF-8, accepted-read recovery, explicit invalid-access no-fallback | New head-test-application.test.ts |
| Final application regression |73 pass,0 fail (11 new plus62 inherited) | /tmp/pr-reviewer-06-react-evidence/application-final.log SHA256 e167c89bbaa12fb0cc954a17a1855efd020e0d4e0f17514c327e816534d49671 |
| Final static gates | Strict TypeScript, subsystem boundaries and git diff --check pass | Node24 tsc --noEmit; direct Bun scripts/check-boundaries.ts |
| Provisional actual Chrome journey |5 pass,0 fail in7.1s: real controlled pass/lost ack/reload/question/artifact, unavailable twice, assertion failure/counts, queued cancellation and owner-loss unknown history | /tmp/pr-reviewer-06-react-evidence/e2e.log SHA256 e008c21821c24db7faa1c74eb0688b114783028933dae4d15ce0332f4bb44b6b |
| Provisional screenshot/detector | Desktop1440×1080 and narrow390×844 screenshots captured; no horizontal document overflow in tested narrow case; detector returned[] | e2e/*/head-tests-{desktop,narrow}{,-panel}.png; design-detect.json SHA25637517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |

The Chrome receipt is a dirty engineering-tree observation before the last explicit-access/session fencing and selected-job history update. It is not a frozen dc06aad browser acceptance. No final browser rerun or complete visual critique was performed after the direction correction. Initial screenshot inspection showed the existing neutral hierarchy, wrapping captured identities and separate job/evidence areas; it does not approve their standalone placement. Full-page narrow screenshots are long, and a canvas-specific composition must be designed/reviewed separately. Detector absence of findings is not visual approval.

The final application command is the existing Node24 binary with --experimental-strip-types --test --test-timeout=15000 and tests/head-test-recovery.test.ts, tests/head-test-application.test.ts, tests/recovery-application.test.ts, tests/semantic-application.test.ts and tests/story-application.test.ts. Package-entry dependency links point read-only at the integration donor; .vite/.cache are real task-local ignored directories. No install/new dependency/global configuration occurred.

The provisional passing browser fixture used gateway127.0.0.1:52348 and UI52349. Job9c39f35d-9ea4-4302-a762-e411f8cfff59 retained result910f3ff7922f29cc14ba43b66c324733c1e018b07aec7b616e08b0dd35a30e80 and test_root.stderr artifact52448cc4-3ecf-4e11-a67b-b0c07962d80b, SHA256517501d5eb01fe2777bc1286ebdd84ae5f64ba56defca4f2b28382a09453215f. Public reads observed preparing before the independent anchored question action, with no artificial delay/held lease and zero participant notifications. This is test_only_execution, not a real product PR qualification. The final unit bridge run separately exercised one-byte pages containing Chinese/emoji and inert script-like text. Unknown-history uses a controlled requested journal/owner replacement without launching a process; it is not actual host-crash evidence. Queued cancellation is not actual running-process stop evidence.

## Open gates and known limits

- Root-owned canvas spec/mockup reconciliation, final UX implementation and fresh visual critique remain required. Keep the provisional panel out of any final-UX acceptance claim.
- New Node suites are direct-only: the sole backend/root integrator must register head-test-recovery.test.ts and head-test-application.test.ts in the normal entrypoint if adopted. New head-tests.e2e.ts also requires the responsible config owner to register it in Playwright testMatch. The temporary external config used only this file; B2 did not edit package.json or playwright.config.ts.
- No broad declared normal suite or all inherited Chrome journeys were rerun for this B2 checkpoint. A route-inventory expectation in recovery-application.test.ts changes4→5 for the new declared workspace route; all other inherited application tests remain intact.
- Pagination exists but multi-page history/late external CLI publication, timeout/abort during active mutation, bridge-level post-dispatch storage failure, malformed final byte-page/hash negative cases and exhaustive scope/access teardown still need adversarial independent coverage. The initial history port is ascending; Load more jobs is deliberately neutral. No stronger history completeness is claimed.
- Artifact inspection caps display at1MiB and labels incomplete larger artifacts. Complete-artifact verification applies only when the complete bounded artifact was read. Final decoder replacement for malformed UTF-8 is presentation, not original-byte identity.
- Independent B2 engineering review, combined06C faults, exact integrated-source production qualification, actual own-PR/CLI same-identity evidence, unfamiliar comprehension, whole-product rebuild knowledge and deployment remain root-owned/open.

## Preservation and recovery

The worktree and branch retain unique committed work for root reconciliation and are not disposable. Task fixture helpers join gateway/process teardown and remove their owned ephemeral roots. Raw logs/screenshots and the temporary Playwright config remain at /tmp/pr-reviewer-06-react-evidence for the root's current review dependency. Earlier manually bounded application runs were terminated after a changed route-count assertion prevented its test cleanup and, later, an asynchronous access-fingerprint attempt reordered a legacy login fixture; both are corrected in final73-pass evidence. No shared/pilot runtime was stopped. Final task source has no uncommitted changes after this receipt; ignored node_modules is retained for continued checks. Root can reproduce final application checks and read this tracked record without relying on chat; screenshots remain external review evidence.
