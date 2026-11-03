# Read a Test as one normal source change

Date: 2026-11-03.
Request revision: test-change-unit-R2.
Parent: [Explanation exploration](../plan.md).
Product source: [Normal Test change](../../../../../product/pr-file-tree-first.md#test-is-one-normal-source-change-unit--2026-11-03).
Status: R1 was merged/deployed as `a08fa42`, but the user's actual screenshot disproves its claimed structural consistency. R2 implementation in progress; root still serves `a08fa426e22ef947bac2459f56c2d6d3664c341a`.

## R2 accepted correction and handoff v2

The user explicitly requires actual Removed and Added code nodes, the same structure for Test and normal changes, merge and deployment to the existing endpoint, followed by verification. R1 only removed Assertion cards and left the Test's edits inside a nested summary-card diff. Its source PASS did not establish the requested graph structure.

Owner: root, sole writer in isolated `fix-change-code-nodes`, base `a08fa42`. Replace resolved changed Function/Test group contents with the nonempty Removed/Added code nodes. Keep the canonical group ID and source identity; name the source unit at the group once. Do not retain a redundant inner Test/Function summary card or the extracted header card as a substitute for actual edits. Primary code is immediately present, all edited rows are exact, shared syntax colors are reused, and optional native-hunk/source evidence stays at group level. Addition-only/removal-only and unchanged/unresolved scopes remain honest. No assertions, per-line change entities, execution/coverage claim, dependency or endpoint expansion.

UI-only endpoint mapping attaches existing external relations to their owning group, retaining original endpoint identity and complete evidence in named UI metadata; omit internal collapsed self-loops. Canonical graph/source oracles remain unchanged. Implement this as a named UI projection shared by Function and Test, not conditional Test markup or domain fact rewriting.

Independent-review handoff v2: first attempt the exact actual candidate graph through supported CUA and freeze that account before source; record the host error if unavailable, without a fallback browser route. Then review all removed/added rows, group child structure, native source/scroll ownership, syntax preservation, stable UI identity, relation endpoint provenance, filtering, pagination and fallback scopes. Root alone writes and deploys. The review must explicitly check the user's screenshot distinction, not merely the absence of Assertions.

Acceptance: reported Test has exactly Removed−4 and Added+8 code children; request uses the same code-node implementation with its exact −1/+1 rows; no inner Test/request summary or header substitute. Every code row/witness matches canonical composition; external calls/source locations remain evidenced and connected; no canonical facts/IDs change. Addition-only groups create no Removed node. Source controls, changes-only, Show/Hide, measured layout, hidden bootstrap and retained paint remain intact. Run strict types, graph regressions, independent source review, build exact merged-main, deploy original `:8478/` with rollback, and compare served HTML/JS/CSS/worker/fonts. Actual pixels, physical phone/touch, own-PR intake and unfamiliar-reviewer gates remain separate.

R2 source findings: actual React markup exposed the old lexical scanner classifying the Test's `const` and following code as one string after a template literal. Reuse the already retained lexical classifier correction with the existing declared TypeScript-analysis dependency and regenerate only its exact-text syntax index. Promote the existing shared syntax component/colors into the owning UI boundary and supply the prepared syntax lookup from the entry point; application UI must not import prototype policy or a runtime parser. Preserve all source text and colors as separate assertions; markup is not browser-pixel acceptance.

The first build also exposed unnecessary loading of the complete syntax index (main bundle about 27.3 MB versus 21.2 MB before syntax use). Prepare a compact index for every canonical Function/Test edited row and inject that lookup into this entry, while retaining the full index for the existing full-source reader. This is data selection for the same shared syntax component; no runtime parser, missing edited code or new UI feature. Compare compact lookup tokens against the full index and exact edited text. Preserve the old group-heading typography/icon selectors after introducing a measured header wrapper.

## R2 implementation and review evidence

Implementation `416abdf`, corrected followup `e847202`: shared source-edit projection, actual Removed/Added React nodes, original source-subject disclosure routing and explicit visual endpoint provenance. Request has literal −1/+1; reported Test has literal −4/+8; added-only helper has only Added. The old inner summary/header substitute is absent. All rows, including blank lines and line endings, are preserved; React static markup verifies code and syntax spans. Canonical source/compiled/graph oracles remain unchanged. Full graph regression suite: 199/199 PASS. Strict root/minimum TypeScript and subsystem boundaries: PASS. Build: PASS; compact syntax keeps the main asset near 21.6 MB rather than the first 27.3 MB attempt. Large resident graph/bundle remains a known limit, not a mobile performance claim.

Fresh independent source reviewer `actual_code_nodes_review` ran 43 focused tests and audited 591 pagination/filter/disclosure/hide states across 97 files: 25,050 literal row comparisons and 88,895 relation instances, with no source loss, duplicate/dangling UI IDs, canonical mutation or endpoint-evidence change. It found a P2 heading-selector regression; the followup restores all existing typography/icon/coarse-padding selectors and closes it. Delta source PASS at `e847202` also independently verifies all 349 projected rows/330 unique compact syntax keys against both full tokens and exact source bytes. No additional source defect was found.

Actual browser/graph-first account remains UNRUN: the fresh supported CUA inventory returned `Browsers: Error: The browser access host is unavailable`. Authored journeys now target actual code nodes, group-level source return and the current evidenced call route. Passing source/markup tests are not pixel, touch, native scrolling, reader comprehension or installed-version acceptance. Merge/deploy is explicitly authorized by R2; record exact merged-main/runtime/build/served-byte identity and rollback in the retained ignored runtime receipt, then retry actual supported UI verification. All previous worktrees, preview and evidence remain preserved.

## Intended outcome and observed gap

The user has repeatedly requested the same normal change graph for a Test and supplied the live `request() change` screenshot as the reference. The latest phone screenshot still shows one tall Test group with many Assertion and contains/source labels. The prepared data includes their ownership; the UI automatically expands them and also counts Assertions as file source units. Neither the PR45 design experiments nor PR46's paint fix delivered the requested Test correction.

Preserve the whole graph and existing normal Function/Test source UI. One Test is the reading unit; assertion edits stay exact lines within its full source scope. No invented Before/After identity pair, special Test card, assertion count/list, semantic relation or execution inference.

## Implementation handoff v1

Owner: root, sole writer in `fix-test-change-reading-unit`, isolated from main and PR45. Base: `250c19a`. Inputs: retained canonical graph hash `946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a` and current normal change renderer. Keep canonical facts/relations immutable; change visible membership, rendered group children and source-unit pagination/counts. Retain the shared existing source reader and exact Test witnesses.

First write a regression against the reported Test, prove it fails on the old presentation, then implement the bounded correction. Exercise default, file expansion, changes-only, source open/close and hide. Update historical projection expectations only for the explicit removal of Assertion reading nodes and incident relations; keep full source/compiled/canonical oracles intact. New evidence belongs in ignored `artifacts/test-change-unit/`, never project `.decompozr`.

## Independent-review handoff v1

Use a fresh separate read-only reviewer after a committed packet/candidate exists. First attempt actual candidate UI observation through supported tools; an unavailable host leaves graph-first review UNRUN, never replaced with graph JSON or another browser-control route. Then independently review the bounded source diff, exact full-Test source preservation, absence of Assertion cards at all pagination/filter states, retained normal change behavior and source facts. Return concrete defects and remaining evidence gaps. Root owns all writes/deployment.

## Acceptance and delivery

- Reported Test `unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f`: one Test source card in its existing Change group; zero Assertion children/nodes/contains labels in the reading graph.
- Added/changed/unchanged Test source identities, scopes, line edits and canonical assertion containment/location remain unchanged. Normal request/helper change account stays intact.
- Source-unit pagination skips assertion evidence and its counts agree; full source and canonical preservation oracles pass.
- Strict TypeScript/boundaries, graph regression suite, authored actual React journey, independent source review, PR and exact-main build/deployment to the existing root with rollback retained.
- Actual browser pixels, physical touch, own-PR intake (fixed PR25/no selector) and unfamiliar-reviewer comprehension remain distinct gates. Latest supported browser error: `The browser access host is unavailable`.

Authorization: continue the already requested Test simplification and existing-endpoint fix; do not stop after another source-only prototype. No new endpoint, dependency, network/security change or PR45 merge. Preserve prior worktrees, previews and recovery artifacts.

## Implementation and verification record

Candidate: `12619de`, [PR47](https://github.com/scottchu/pr-reviewer/pull/47).
Local status: 193/193 graph tests PASS; strict root/minimum TypeScript and boundary checks PASS; production build PASS with the retained approximately 21.2 MB bundle warning.

The regression first failed on the old reading graph's Assertion nodes and incorrect 89-unit file count. It passes after the correction: the reported Test remains one source card in its original Change group, exact source witnesses and 8 added/4 removed rows stay unchanged, and application-test-file has 16 reading units with all available on the first page. Default, expanded, changes-only, source disclosure and hide transitions preserve canonical data and never restore assertion cards.

The immutable original-main projection was independently read from `250c19a` and first matched to the original frozen oracle. Removing only Assertion nodes/group children and incident relations derives the new four-view oracle: 58 fewer reading nodes and 116 fewer relations in each retained default/20/40/hide comparison. Source facts, compiled identities and the complete canonical graph still match their original full oracles. Derivation and raw test logs are retained in ignored task artifacts. A synthetic layout check using 300 by 100 measured cards produces a 600 by 260 reported Test group with one Test child; these are synthetic dimensions, not observed browser pixels.

Authored actual React cases cover 390/1440 source open/close, changes-only and file Show/Hide; the old Assertion-stack browser selection is superseded. Browser execution, graph-first comprehension and actual phone acceptance remain UNRUN. No deployment success is inferred from these local results.

Independent read-only source reviewer `test_change_unit_review` returned PASS with no concrete defect. It independently ran 40 tests and checked all 97 file indexes across 333 pagination/filter/hide states: no Assertion reading nodes/children/incident labels, dangling endpoints or pagination mismatch. It verified exact canonical equality and the unchanged graph hash; the reported Test reader remains Before L146–244, After L140–242 with 4 removed/8 added rows. It reproduced the baseline-derived projection oracle and established that canonical assertion families reserve no layout footprint when those nodes are absent. These are independent source/synthetic checks, not actual UI acceptance. Its fresh supported CUA attempt returned `The browser access host is unavailable`; graph-first review remains UNRUN.

The correction makes the Test's actual change the reading unit. Canonical facts and the existing normal source reader support that source-level outcome; actual reading ease is unresolved until the deployed journey can be observed. Existing own-PR intake and unfamiliar-reviewer gates remain open. Operational deployment identity/readback belongs in the retained ignored runtime receipt, without treating asset delivery as visual verification.
