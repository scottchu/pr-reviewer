# Shared Change independent review

Date: 2026-11-03. Implementation candidate: 6c94b0f4f0ab6ed1b22f5b7f46dc4accc4c466b5. Reviewed target: [PR25](https://github.com/scottchu/pr-reviewer/pull/25), base b096826e31c0927190806de91ed70b8b64aa93d8, head e3b270e5f49a9215452b0b86702946043e979059. Parent: [U1 plan](plan.md).

## Frozen graph-first account

Fresh reviewer used real candidate Chrome MCP screenshots and requested UI source drilldowns mediated by the implementer, before reading project docs/diff/model/source. The original account remains retained with the operational browser artifacts. Its supported account:

- The changed controlled-host Test removes two manual token-fill/Open-review pairs, including after stop/start/reload. It adds API Authorization collection before navigation, assertions that token/logout/local-user state is absent, and a final nonempty/all-empty-header collection assertion. Eight added native rows include blank rows, not eight behavioral assertions.
- The normal refresh caller still lexically invokes request with review/snapshot/revision parameters and signal. request's edited line replaces direct Bearer construction with the independent accessHeaders helper result, preserving Content-Type/body/method/signal construction. Helper source returns an empty object for localOwnerSession and Bearer for other session strings. This is source behavior, not executed runtime evidence or global header removal.
- Native hunks, full pinned commits, paths, source hashes and side line ranges were readable inline. Closing the same source disclosure returned to the Test graph. Source Test assertions do not establish execution, pass, coverage or policy verification.

Confidence: high for literal edits, medium for broader rationale attributed by prepared interpretation nodes. Unknown: localOwnerSession definition, complete caller/server policy and actual target test execution. The UI cannot reveal the new shared-model implementation because it intentionally preserves the existing reading and displays pinned PR25.

## Presentation critique and evidence boundary

The route required panning: no search/fit/locate control. Synthetic Chrome MCP wheel moved the camera but left card bodies culled until a one-pixel resize refreshed selection; this mediated-route limitation is observed, ordinary-user failure is not established. Dense crossing edges and narrow clipped/wrapped source made discovery difficult; exact reading relied on actual accessible UI text. No UX redesign is included in this ontology correction.

Actual candidate checks exercised File, Function and Test source readers, Test source open/close/return, literal Removed/Added rows and directed bottom-to-top connectors. Candidate Test rows are exactly 4 removed/8 added; both side cards remain below the Test after disclosure reflow. The console's only observed error is missing favicon404; document/JS/CSS/worker responses succeeded. This is desktop Chrome evidence, not native built-in browser access, physical Safari/touch or unfamiliar-human acceptance.

## Source review and corrections

Initial source verdict supports C1/C3/C4/C5, including a single shared constructor/resolver, prepared model, Experience lifetime, all three reader paths and unchanged source/request preservation oracles. Three P2 findings remained before delivery: checked absence admitted contradictory present-blob metadata; context-only witnesses and gapped physical source lines were incompletely checked; one connector markup test retained obsolete renamed attributes. The earlier 210-test pass predates that rename and does not establish this later candidate's full test status.

Correction: strengthen maintained contract and shared Domain validation, add explicit negative reproductions, correct the markup expectation, then rerun the full graph suite/types and fresh candidate build. Corrected-candidate independent source readback and live delivery remain pending at this record revision.

## Remaining gates

Own implementation PR intake remains blocked by fixed PR25 bootstrap/no selector; it is not passed by this supplemental existing-PR run. Independent human comprehension, physical device/touch and broad mobile reliability are unrun. Docs-only independent readiness audit closed the normal-Test-contract/UTF-16 findings and confirmed the qualified row-reference/known-presence delta; it does not establish implementation or runtime acceptance.
