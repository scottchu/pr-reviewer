# Slice 03 import presentation preparation

**Packet revision:** 2

**Date:** 2026-10-23

**Status:** Scoped implementation ready; integration and slice acceptance remain open

**Parent:** [Integration v3](integration.md), [slice plan](plan.md)

**Authoritative product source:** [Import jobs v1](../../../../product/review-loop/import-jobs.md), [React presentation](../../../../product/review-loop/presentation.md)

## Implementation handoff v1

Executor: `/root/implement_import_panel`. Branch: `present-durable-import-job`. Worktree: `/tmp/pr-reviewer-import-panel`. Base: `320f78f309e665e72c761e20ceb5fa26b384508d`.

Allowed writes: this record, new `src/ui/import-panel.tsx` and new `tests/import-panel.e2e.ts`. Shared owner retains existing UI, styles, bridge, application, runtime, source, storage and test registration. No dependency, pilot, credential, agent-session, network-route or production-runtime changes. A controlled loopback test fixture with cleanup is permitted. No publication/merge or delegation.

Intent: extract a thin React presentation for path entry, candidate choice, status, cancellation/recovery and opening an admitted review. Presentation consumes immutable display values and explicit available actions. Application owns authorization, state transitions, selection/admission policy, subscriptions and effects. Rendering must not infer actions from job status, retry, launch work or switch the open review.

Reference: shared owner's uncommitted `src/ui/imports.tsx`, SHA-256 `85cc5eeaea45ee29dd76471d194eeca3c6df453681bfa37bcc5b3b24d2b83dcc`. This is implementation reference, not source authority. Preserve its existing flow while extracting rendering; do not introduce another import route. Existing `src/ui/style.css` supplies neutral hierarchy, typography, focus and coarse-pointer targets. Design-system guideline source: `6cfe720df1a981e8ce8bb053927aea20d12f105d`, `docs/design/governance/principles.md`.

### Accepted public presentation interface

`ImportPanelProps`: authenticated flag; controlled path and onPathChange; immutable requestActions; immutable jobs; optional error and acknowledgementRecovery. Request actions contain id, label, onInvoke(path), optional disabled. First request action is the form submit; remaining actions are explicit buttons. All callbacks emit intent only. The parent supplies availability and disabled state.

`ImportPanelJob`: id, title, status, optional detail/comparison, immutable choices, immutable actions and optional immutable evidence strings. Each choice contains id, label, optional detail/comparison/href and explicit actions. `ImportPanelAction`: id, label, onInvoke(), optional disabled. No job/domain/application imports, live streams, fetch, timers, host calls or policy tables.

Shared owner accepted this projection before code. The path remains controlled by the wrapper. A choice may carry the actual provider href; all text is rendered as plain React text. Non-submit buttons use type button. Existing imports/import-jobs/sha classes are retained; shared owner owns overflow/spacing styles. Human statuses and truthful reasons are supplied by application, not fabricated percentages or elapsed-time guesses. Evidence stays in a disclosure. Unauthenticated presentation is absent. Form has a visible path label, required value and native keyboard submission; rerenders do not move focus or emit an action.

### Acceptance and tests

- Scope I03/I17: real React renders path entry and explicitly supplied choice/actions. Keyboard submission invokes exactly one request; choice/open/cancel/recovery callbacks invoke only the selected action.
- I02 presentation boundary: props updates and remounts do not emit intents. Status changes announce politely and preserve focused input/draft.
- I10/I13/I14 truthful uncertainty: unknown/working/cancel/completed/unavailable/error text is rendered from props; missing actions are absent. Disabled actions cannot invoke callbacks.
- Error is an alert associated with input; evidence is secondary. Native controls and inherited focus/coarse-pointer styles are used.

Use existing React/Vite/Playwright/strict TypeScript only. The focused browser fixture is presentation evidence, not full I17 import E2E, live provider, process cancellation, dogfood, independent comprehension or slice acceptance. Shared owner owns application wiring and those remaining gates.

## Independent-review handoff v1

Reviewer: root-assigned agent other than implementer; read-only these three files plus referenced source. Candidate identity and results will be appended after implementation. Check no business policy or effects leak into React, supplied actions are the only authority, keyboard intent is singular, updates/remounts are passive and uncertainty/error copy stays truthful. Reproduce focused strict/browser checks with existing tooling. Report findings and actual evidence separately from full product acceptance. Root/shared owner must promote any newly accepted public presentation knowledge into durable docs and reconcile dependent plans before accepting slice 03.

## Evidence and remaining work

Before implementation: primary checkout main remained clean; new isolated worktree created from assigned exact base. This worktree had no ignored runtime records. No existing temporary artifacts were removed. No implementation or tests run yet. Material integration-policy/API ambiguity returns to root/shared owner; independent presentation preparation can continue.

## Implementation evidence

**Status:** Implemented and tested presentation module; full slice 03 acceptance remains open

The accepted public types are exported directly from `src/ui/import-panel.tsx`. It imports React only. The path is controlled; the first request action submits the form and all other controls explicitly use button type. Native required input prevents empty primary submission. Availability and disabled state are supplied by the wrapper. No status-to-policy table, domain/application import, host call, subscription, timer or acquisition effect exists in the panel. React useId scopes labels across panel instances. Status uses a polite native status role; errors use an alert and input description association.

Focused tests are in `tests/import-panel.e2e.ts`. Existing Playwright configuration only selects `review.e2e.ts`, so root/shared owner must register this new focused file when integrating; this worker cannot edit configuration. Independent reproduction uses a temporary Playwright config with testDir set to this worktree's tests, testMatch `import-panel.e2e.ts`, workers1, Chromium headless and the existing Chrome executable. The fixture builds actual React/TSX with existing Bun and serves only its generated index/JS/CSS through a Node server on loopback port0. Its private temporary fixture directory and HTTP server are removed in afterAll. It performs no provider calls or product commands.

### Executed checks

- Node24 `node node_modules/typescript/lib/tsc.js --noEmit`: passed, whole assigned-base source plus new module/test.
- Bun `bun scripts/check-boundaries.ts`: passed.
- Node24 `node node_modules/@playwright/test/cli.js test --config=/tmp/pr-reviewer-import-panel-playwright.config.mjs`: 3 passed in1.4s. Keyboard path submission emitted one intent; explicit continuation, candidate, cancellation and open callbacks fired only when selected. Supplied status changes preserved path/focus and supplied no implicit actions; recovery invoked only its callback. Native empty validation, disabled actions, unauthenticated hiding and real root unmount/remount emitted no intent.
- Environment: Node24.21.0, Bun1.4.2, Google Chrome156.0.8078.48; existing dependency tree reused read-only through a task-local symlink authorized by root. No install, lock, dependency or global configuration changes.
- Final controlled fixture endpoint: `http://127.0.0.1:53862`. Temporary root `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-import-panel-BUObwl` removed by fixture afterAll; server closed. Earlier failed fixture roots likewise removed by afterAll.
- Implementer inspected screenshot `/tmp/pr-reviewer-import-panel-browser-results/import-panel.e2e.ts-keyboa-b8af4-g-emit-only-selected-intent/import-panel.png`: neutral text hierarchy, plain source comparison and secondary evidence are readable. Assigned base has no `.imports`/`.import-jobs` CSS; request buttons touch and spacing is sparse. Shared owner retains existing draft styles and must inspect final integrated spacing, overflow, responsiveness and coarse-pointer geometry. This screenshot is not independent visual approval.

### Failures corrected and limits

Initial fixture attempts: bundled Node/Vite cannot load Rolldown's native binding because of host Team-ID validation; no signing/install/bypass attempted. Bun-hosted Vite served untransformed fixture TSX, so that fixture was replaced using the existing supported Bun builder and standard Node HTTP. Bun outfile collided with CSS output; outdir fixed it. Initial remount fixture used a scheduled null render that React could batch; actual root unmount/recreation fixed the test harness. Final code/tests pass as recorded above.

No full product I17/I18 journey, live provider, real process cancellation, own-PR dogfood, unfamiliar-reviewer comprehension, screen-reader, physical-touch or production deployment is claimed. Parent/shared owner owns final action/status projection policy, wiring, style integration, product E2E and durable-spec promotion before acceptance. Publication/merge/deployment are N/A to this scoped worker assignment. Exact candidate commit is supplied in the worker dispatch after preservation.

## Review dispatch and recovery

**Implementation candidate:** `c207c67` (public module and focused tests); pre-code handoff `0c1cdac`.

**Review status:** Pending root's independent assignment. Source comparison base is `320f78f309e665e72c761e20ceb5fa26b384508d`. Review only this scoped presentation change, keeping full I17 and policy evidence separate. Root/shared owner should cherry-pick the handoff and implementation commits plus this final evidence update before wiring.

**Cleanup checkpoint:** Task-local `node_modules` symlink removed with unlink; target tree was not modified. Final fixture process exited, loopback server closed and fixture directory removed. Worktree/branch retained because local commits are the parent's integration/recovery input. Screenshot/browser results and temporary Playwright config are retained at the recorded `/tmp/pr-reviewer-import-panel-*` locations for independent review; no credentials or source import results are present. Root can remove these owned review artifacts after reconciliation. Reproduction requires a task-local runtime-only dependency symlink as authorized by root, or integration into the shared worktree's existing dependencies. No unrelated artifacts were inspected or removed.
