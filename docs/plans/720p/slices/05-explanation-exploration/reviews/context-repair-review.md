# Context repair independent engineering review

Date: 2026-10-25.
Reviewer: independent delegated reviewer; not the implementer.
Candidate: `e3104779f3ca50adff770abfb070de2079625fcb`.
Base: `7423292de2d0835d5a66c773adceb676f8efabc7`.
Scope: reading-journey-v1 independent-review handoff v2; F17 interaction clarification and canvas-panel close/return behavior. This is source-informed engineering/design conformance, not graph-first comprehension or product acceptance.

## Findings

No confirmed correctness findings in the assigned repair diff. The two earlier P2 paths have credible source fixes and targeted author regression evidence. This conclusion is bounded by the restrictions below; it does not independently verify runtime success.

## Requirement coverage

| Requirement | Inspected implementation | Evidence and assessment |
| --- | --- | --- |
| Narrow modal blocks background navigation | `mockups/pr-file-tree/main.tsx:815` and `:872` apply the same modal condition to header and main. The Context dialog remains their sibling. | The prior header hole is closed in source. `tests/journey-browser.spec.ts:83` attempts actual pointer input at Overview and Back, retaining expanded identity, camera and return availability. Author `r2-all.log` reports this case passed. |
| Context reading survives hide/unmount | `main.tsx:190` retains scroll in the App owner; `:864` passes it to the conditional panel. `review-context.tsx:14-27` restores in layout effect and captures the actual element in cleanup, with ordinary scroll updates at `:31`. | This addresses both owner lifetime and close-before-scroll-event timing. Author cases at test line 107 cover desktop/narrow close/reopen, citation and fullscreen at nonzero scroll. |
| Close returns focus without moving camera | `main.tsx:201-235` schedules invoker focus after the close commit, with `preventScroll`; close does not call graph navigation. | Existing keyboard modal case at test line 46 asserts invoker focus and identical camera after Escape. Header no longer remains interactive while narrow Context is foreground. |
| Keyboard evidence/Back focuses actual source or overview | `main.tsx:207-236` targets the reader by exact pinned path label, waits for ReactFlow DOM via an observer, and cleans up that observer. Citation/Back handlers publish keyboard focus intent using click detail. Readers are focusable in the retained file-diff implementation. | Test line 141 uses real Enter activation and checks DOM focus on source and main, with restored camera on the intermediate return. This covers the former semantic-focus-only defect in the narrow journey. No new source identity, domain model or cross-subsystem subscription is introduced. |
| Context excursions preserve prior function/test frames | `main.tsx:618-646` retains return priority and restores reading/mode/lens/focus/camera; `:690-705` saves older source/test frames in the Context frame before clearing their active slots. | Test line 198 traverses function → declared test → requirement → request and unwinds each level. It asserts restored camera, local vertical/horizontal reading, mode, folds, test-node count and final 50-file membership. Retained pure/browser tests also cover complete callable source and declared-test identity. |

The change is limited to React presentation/effect coordination and relevant docs/tests. It changes no dependencies, fixtures, source parser, persisted schema, authentication, participant ownership or public subsystem integration. Build/install/update/uninstall delivery is outside this repair review; the local candidate build is author evidence only.

## Evidence inspected

- Immutable candidate/base Git diff and necessary surrounding Context, navigation, fullscreen and file-reader lifecycle code; README, AGENTS, handoff v2, F17 and canvas-panels requirements.
- Existing `/tmp/pr-reviewer-reading-journey-evidence/r2-all.log`: 26 passed in 30.9s, including five new repair/compound cases.
- Existing `r2-pure.log`: 25 passed, zero failed. Existing `r2-strict-final.log` contains no diagnostic output; the handoff attributes successful strict compilation to it. Empty output alone does not establish its exit status.
- Existing `r2-build.log`: successful Vite build, retaining the approximately 2.86 MB bundle warning.
- Supplied `journey-context-390.png` and `r2-nested-return-390.png`. They support the visible narrow Context composition and retained graph state respectively; static images cannot establish inertness, focus or exact return behavior.

Logs and captures were supplied author artifacts. They do not embed an immutable candidate hash, so their association with this candidate relies on the committed handoff rather than independent build provenance. Historical lost artifacts were not treated as freshly verified.

## Limits and remaining risks

- No browser, server, process, network, test execution or configuration operations were performed. The retained independent-browser denial was respected. All source review used fixed Git objects, independent of subsequent root work.
- The new keyboard source/Back scenario and compound return scenario run at 390px. Desktop keyboard transfer, breakpoint transitions with retained scroll, rapid competing focus intents, enlarged text and assistive-technology behavior were not independently exercised. These are coverage limits, not observed failures.
- The focus observer checks for the expected element and calls focus; runtime evidence for delayed ReactFlow publication remains the author's narrow Chrome case. Physical touch, IME/software keyboard, safe areas and native delivery remain outside the evidence.
- No unfamiliar-reviewer UI-first account was formed. Source-informed reading and engineering test totals do not demonstrate understanding, cognitive ease, motivation comprehension or whole-PR acceptance. J2/J3 and full journey acceptance remain open.

Conclusion: no source-review blocker found for this bounded Context repair. The earlier two P2 fixes are supported by inspected code and reported author checks; independent interactive verification and product acceptance remain unclaimed. This report grants no publication, merge or deployment authority.
