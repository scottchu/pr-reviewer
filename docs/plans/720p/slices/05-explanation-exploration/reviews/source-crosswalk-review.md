# Source crosswalk independent engineering review

Date: 2026-10-25.
Candidate: `09bd14de208693d5b8be65876b72f13123c5cb77`.
Base: `e3104779f3ca50adff770abfb070de2079625fcb`.
Role: independent read-only follow-up reviewer under handoff v3; no implementation ownership.

## Findings

No confirmed correctness findings in the assigned source-crosswalk prerequisite. The projection preserves packet evidence and produces a separate existing public snapshot-source reference. No new ontology, persistence operation, participant authority or question-eligibility grant is implemented.

## Coverage and assessment

- `mockups/pr-file-tree/journey-source.ts:31-40` checks the exact PR25 repository/number/base/head, then exact source path/side and admitted source hash. Missing source remains `source_unprepared`; neither another side nor a guessed counterpart is substituted.
- Lines 42-52 validate integer, nonempty, bounded UTF-16 offsets; reject surrogate-pair splits at both boundaries; and derive LF line coordinates from the selected interval, excluding one trailing LF from its inclusive end line. The derived coordinates must equal the evidence coordinates and stay within the admitted source line count.
- Lines 54-67 preserve the original `CallAnchor` as `evidence` while returning `Extract<StoryReference, { type: 'snapshot_source' }>` with the actual Snapshot ID. No packet locator is renamed. The public StoryReference contract is line-based, so the exact offset interval remains in evidence rather than being invented as a new reference field.
- Trusted source admission is a stated prerequisite, not silently provided by this function. Inspected existing preparation/storage code validates UTF-8 bytes, source hashes, LF line counts and source-key uniqueness. Given that boundary, comparing the admitted hash is appropriate; this UI projection is not a second source-admission implementation.
- The three new tests cover unchanged evidence identity, separate retained ID, source-side preservation, comparison/missing-source/hash/coordinate failures, oversized offsets and valid versus split-surrogate ranges. The normal `test:reading-journey` script includes this suite through the existing `*.test.ts` pattern. The E2E entrypoint delegates to the existing config's three current suites and does not start a server.
- Durable docs and mock README distinguish preparation from persistence/publication/question eligibility, retain the two unavailable unchanged anchors, and leave actual story/question composition and native/comprehension gates open.

## Inspected evidence

Read fixed Git objects for the new module/tests, package entrypoints, documentation changes and necessary public contracts/source-admission code. No candidate files were edited.

Existing author `r3-normal-entrypoint.log` shows the declared normal command and 28 passing pure tests, zero failures, including all three new cases. `r3-strict.log` is empty; the handoff reports strict success, but empty diagnostic output alone does not establish the command exit status. Neither command was rerun by this reviewer.

Read the supplied `r3-source-crosswalk-summary.json` and `r3-unmapped-proof.json`: they report 96 matched fixture sides, 181 distinct serialized anchors, 179 mapped anchors and two unavailable base/head `src/application/public.ts` anchors whose hashes match pinned Git. Their exhaustive byte/anchor audit is supplied author evidence, not independently rerun evidence.

Read only bounded metadata from private `snapshot.json`: Snapshot ID `22009f2925f56fed2ca29f3b8a16a147c586f38f61d1c391a7abbd579d5193b2`, expected repository/PR/base/head, 128 prepared source sides and no `src/application/public.ts` source. This independently confirms the artifact's comparison metadata and the missing-source condition; it does not independently establish storage retention or replay every mapping. No full source or credentials were printed.

## Limits and remaining risks

- No browser, service, process, network, configuration or test operations were performed. The pending gateway/proxy decision was not interpreted as authorization. Only this report was written.
- This module is a pure preparation boundary and is not yet wired into a live Workspace/Story/SourceCanvas/question journey. Future callers must obtain an admitted Snapshot and continue to use existing owners for reference validation, publication, question eligibility, actor attribution and guarded return state. A `ready` result alone establishes none of those outcomes.
- The new regression fixture is a constructed Snapshot derived from immutable source fixtures, not a storage-readback integration test. Missing source is tested generally; the actual two private missing anchors are established by the summary plus inspected private metadata. Full crosswalk reproduction and exhaustive boundary cases were not independently executed.
- No unfamiliar-reader account, actual question/reply, persisted StoryVersion, live participant delivery, UI comprehension or production acceptance follows from this review. The previous Context review remains separate and unchanged.

Conclusion: no source-review blocker found for this bounded identity prerequisite. Existing public identity and uncertainty boundaries are preserved in the inspected candidate; author checks support readiness for the next authorized composition step, with live integration and product acceptance still open.
