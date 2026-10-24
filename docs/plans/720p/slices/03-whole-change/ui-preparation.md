# Slice 03 import presentation preparation

**Packet revision:** 1

**Date:** 2026-10-23

**Status:** Scoped implementation ready; integration and slice acceptance remain open

**Parent:** [Integration v3](integration.md), [slice plan](plan.md)

**Authoritative product source:** [Import jobs v1](../../../../product/review-loop/import-jobs.md), [React presentation](../../../../product/review-loop/presentation.md)

## Implementation handoff v1

Executor: `/root/implement_import_panel`. Branch: `present-durable-import-job`. Worktree: `/tmp/pr-reviewer-import-panel`. Base: `320f78f309e665e72c761e20ceb5fa26b384508d`.

Allowed writes: this record, new `src/ui/import-panel.tsx` and new `tests/import-panel.e2e.ts`. Shared owner retains existing UI, styles, bridge, application, runtime, source, storage and test registration. No dependency, pilot, credential, agent-session, network-route or production-runtime changes. A controlled loopback test fixture with cleanup is permitted. No publication/merge or delegation.

Intent: extract a thin React presentation for path entry, candidate choice, status, cancellation/recovery and opening an admitted review. Presentation consumes immutable display values and explicit available actions. Application owns authorization, state transitions, selection/admission policy, subscriptions and effects. Rendering must not infer actions from job status, retry, launch work or switch the open review.

Reference: shared owner's uncommitted `src/ui/imports.tsx`, SHA-256 `85cc5eeaea45ee29dd76471d194eeca3c6df453681bfa37bcc5b3b24d2b83dcc`. This is implementation reference, not source authority. Preserve its existing flow while extracting rendering; do not introduce another import route. Existing `src/ui/style.css` supplies neutral hierarchy, typography, focus and coarse-pointer targets. Design-system guideline source: `6cfe720df1a981e8ce8bb053927aea20d12f105d`, `docs/design/governance/principles.md`.

### Proposed public presentation interface

`ImportPanelProps`: authenticated flag; controlled path and onPathChange; immutable requestActions; immutable jobs; optional error and acknowledgementRecovery. Request actions contain id, label, onInvoke(path), optional disabled. First request action is the form submit; remaining actions are explicit buttons. All callbacks emit intent only. The parent supplies availability and disabled state.

`ImportPanelJob`: id, title, status, optional detail/comparison, immutable choices, immutable actions and optional immutable evidence strings. Each choice contains id, label, optional detail/comparison and explicit actions. `ImportPanelAction`: id, label, onInvoke(), optional disabled. No job/domain/application imports, live streams, fetch, timers, host calls or policy tables.

The shared owner reviews this projection before code. Changes to this proposal are recorded here before implementation. Human statuses and truthful reasons are supplied by application, not fabricated percentages or elapsed-time guesses. Evidence stays in a disclosure. Unauthenticated presentation is absent. Form has a visible path label, required value and native keyboard submission; rerenders do not move focus or emit an action.

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
