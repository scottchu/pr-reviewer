# Read code and its source relationships together

Date: 2026-11-04.

Status: accepted correction; implementation and delivery evidence remain separate.

Parents: [shared Change](source-change-model.md), [raw projection](raw-projection-correctness.md), [minimum graph](pr-file-tree-first.md).

## Reading contract

A reviewer must read actual removed/added source and determine which exact source occurrence supports each displayed relationship. File, Function and Test share the Change model and qualified native evidence. A source-unit's kind does not justify hiding code behind named symbols. Retain existing source entities/relations and attributed interpretation; neither names nor interpretation replace literal native evidence.

For each existing source-unit Change frame, keep its original subject above the nonempty native Removed/Added code sides. The same composition applies to Function and Test. Existing symbol/context children remain below the code row and existing relationships keep their identities, kinds, endpoints, labels and evidence. Room and layout reflow may change to accommodate code; the earlier complete normal-graph visual freeze and Test-only edit-card restriction are superseded only by this additive correction. Canonical source graph data is unchanged. Whole-File readers retain full native source reading and use the same qualified evidence contract; no new default File-group inventory is introduced.

A relationship attached to an edited row identifies its existing canonical relation IDs, relation kind, target identity, source side/commit/path/hash and exact source range. UI may expose these references beside that literal row and retain its original context edge; these are two presentations of one evidenced relation, not two facts. Source calls may use the existing exact owner→callsite→callee path; collapse only admitted source facts. Binding evidence is required, never display-name matching. Where the qualified native evidence includes the call's physical source line, its exact call text must agree with that line; contradictory copied call metadata is unavailable. Missing native text alone does not erase independently supplied source relationships. Incoming/unchanged context remains in the existing graph even when its witness is outside edited rows.

Call expressions, property construction and native line edits remain different facts. A removed source property is not global Authorization removal. A helper declaration is a separate Change; the calling unit's Added code contains its call expression. Calls are lexical source relations, not execution, test coverage or policy verification. Attributed purpose/policy remains separately attributed.

## Unavailable relationships

A source-unit Change with no supplied, qualified outgoing call target must explicitly say its implementation relationship is not established. This does not assert that no target exists or that source has no calls. File location and Test/assertion containment do not establish a Test-to-implementation relationship. Assertions remain inline native code, with no restored Assertion inventory or extra collapse/detail pane.

The absence notice is derived from the same Domain source-relationship account for all source-unit Change anchors. Native code and unknown relationships coexist. No new call analyzer, HTTP integration inference, runtime evidence or fabricated edge is introduced in this correction.

## Fixed paired case

The same immutable PR25 comparison is used for both cases: base b096826e31c0927190806de91ed70b8b64aa93d8, head e3b270e5f49a9215452b0b86702946043e979059.

- request(): exact native Removed row is review.ts Before L29; Added row is After L30. The Before direct Authorization construction is supported by its source occurrence and constructs relation; After accessHeaders(captured) has an admitted callsite/callee path to accessHeaders(). Show both literal rows with shared syntax rendering, plus exact side/line relationship references. Preserve the original normal caller/context graph.
- Controlled-host Test in tests/review.e2e.ts: Removed rows150/151/234/235; Added143/144/146/147/148/149/232/241. Existing canonical relationships contain assertions and locate the Test in its File. There is no supplied resolved outgoing Test-to-implementation call edge. State this gap. The callback parameter named request in page.on is not the application request() function; no relation may be inferred from that spelling. Source assertions do not prove execution or pass.

## Verification

A reviewer first answers through the actual candidate: what literal source changed, which exact source supports each relationship, and what remains unknown. Then compare those answers with the pinned source. Tests assert exact native row inventories, qualified source/relationship reference matching, rejection of wrong side/commit/path/hash/range and same-name targets, plus honest unavailable evidence. Preserve all canonical entities/relations and existing context identities/content; only additive code, reference annotations, absence notice and necessary layout reflow are allowed.

Exercise source open/close/return, both native sides and their directed ownership connections, filter/pagination and syntax/scroll preservation. Literal byte/source checks, same-agent UI verification, independent source review, independent graph-first understanding, exact-main deployment and served asset identity are separately reported. Fixed PR25/no selector, unfamiliar-human and physical touch gates remain explicit.
