# PR25 ABox: concrete project and source account

Date:2026-10-27. Status: bounded prepared instance/evidence account, not a new schema, general extraction, runtime result or whole-product acceptance. This instantiates the [TBox](project-repository-tbox.md), which owns definitions and constraints. [Ontology index](project-repository-ontology.md).

## ABox: concrete PR Reviewer project, repository and review

The following are human-readable instance labels, not newly allocated persisted IDs or an invented storage format.

```text
Project: PR Reviewer
  goal: help reviewers understand change, rationale and evidence
  usesRepository → Repository: github.com/scottchu/pr-reviewer
  hasSpecification → docs/product/pr-file-tree-first.md
  hasRule → docs/rules/development.md (readable multi-line implementation)

Repository: github.com/scottchu/pr-reviewer
  hasReviewSubject → PR #25
  hasRevision → b096826e31c0927190806de91ed70b8b64aa93d8 (base)
  hasRevision → e3b270e5f49a9215452b0b86702946043e979059 (head)

Review subject: PR #25
  examinedAs → Comparison(base, head above)
  hasChange → request behavior Change account
  changes → File: src/application/review.ts (comparisonStatus: change)
  changes → File: src/application/local-access.ts (comparisonStatus: add)
```

These explicit Project and Repository boxes can appear in a project-knowledge view. They represent distinct entities connected by `usesRepository`, not two decorative names for the same object. The same repository is both where PR Reviewer is developed and the subject of its own PR25 dogfood review. These are two roles of one repository; the product project, review session, candidate build and pinned comparison remain distinct. There is no circular “the UI verified itself” acceptance implication.

| Concrete instance account | Basis and limit |
|---|---|
| Requirement F06: even a one-line edit initially shows its entire responsible changed callable on each available side; unrelated intervals may fold | Current `pr-file-tree-first.md` F06. This is a normative requirement instance, not evidence the UI implements it. Appropriate inner callable and honest module/declaration fallback are part of it. |
| Requirement F16: selected changed function → relevant test assertion summaries → same-canvas full-test diff | Current F16. Source-backed mapping includes relevant unchanged tests. No concrete TestRun/PASS is invented for the mock. |
| Rule: readable multi-line function bodies, conditions, object literals, operations and SQL | `docs/rules/development.md:7`. A project policy instance; original reviewed fixtures keep their exact bytes. This rule is not a function relation, and it selects no formatter/dependency. |
| FileOccurrence: `src/application/local-access.ts` at PR25 head; added callable `accessHeaders` | Current F10/F13 and the retained whole-PR source account. Base has no corresponding file/helper; head request callsite in review.ts calls it. Exact hash/range must come from the retained source record before creating an executable anchor. |
| Unchanged `refresh` occurrences before/after the request change | F10 retains both exact source occurrences and identical-body evidence. Its source is unchanged; downstream behavior may differ. Do not merge occurrences solely by name or infer behavior equivalence. |
| Comparison membership:50 changed paths,4 added/46 modified, +492/−192 lines | F13 pins the source.126 native -U3 hunks and163 -U0 blocks are different diff representations of that comparison, not different PRs or contradictory ontology facts. |
| Explanation: local-owner access is recognized before credential lookup; explicit credentials continue through lookup | Prepared account in F09 with source citations required. This does not prove blanket security or execution. Evidence status remains visible separately from explanation text. |
| Historical worktree locator: `/tmp/pr-reviewer-pr-file-tree` | Observed author working-copy location. Its moving HEAD is not PR25 head and is not a durable identity for Project, Repository or Comparison. |

## PR25 units: top-down and bottom-up

Within the pinned PR25 Comparison, the logical review File contains the actual request declarations (Before24–32/After25–33). Its Before29 direct Authorization construction and After30 accessHeaders(captured) callsite explain the request Change at smaller granularity; their Before/After link is comparison, not an execution step between revisions. The After callsite targets accessHeaders at local-access.ts Head3 through the evidenced call relation. That helper belongs to another File: dependency across Files is not containment inside request or review.ts.

Read bottom-up from these exact expressions/sites to request's header-behavior comparison, its changed File's role in PR25, and the prepared intended goal of opening review without manual token entry. The last step is an attributed intent/contribution explanation, not a proven source call, executed outcome or certified author intent. The unchanged refresh→request Before37/After38 path supplies affected caller context without claiming unchanged runtime behavior. Read top-down through the same evidence and logical identities to check those distinctions.

Relevant test contexts remain separately supported: the unchanged application's explicit-credential assertion418, added gateway HTTP-policy test90–114 and modified E2E each have their own scope and not-run limits. Neither those source definitions nor this local contribution account explains every changed File or proves the PR goal. Scope/frontier remains the prepared example; do not silently turn it into whole-PR impact coverage. This concrete account instantiates the separate TBox contract; neither document is a formal deployed ontology.


### Concrete relation and evidence crosswalk

Comparison repository: scottchu/pr-reviewer. Base: `b096826e31c0927190806de91ed70b8b64aa93d8`. Head: `e3b270e5f49a9215452b0b86702946043e979059`. Source witnesses below use those immutable revisions, exact side/path/range and hashes retained in the linked records. Short B/H labels are reading aliases, not replacement source identity.

| Unit / existing typed statement | Exact source / limit |
| --- | --- |
| PR25 `changes` review File and local-access File | Explicit comparison-qualified relation, admitted by native File diff evidence below; statuses change/add respectively. Not lexical containment or whole-PR effect coverage. |
| request `defined_in` review File | Before declaration24–32 / After25–33; two witnesses of ONE logical function/File. Metadata declaration provenance is distinct from changed-content evidence. |
| request Before `constructs` direct Authorization | review.ts Base29. Removed direct construction only, not global removal of Bearer headers. |
| request After `contains_call` accessHeaders(captured) site | review.ts Head30. This is the actual caller's callsite, not the callee definition. |
| After callsite `calls` accessHeaders | Resolved target is local-access.ts Head3. Cross-file dependency, never lexical ownership by request/review.ts. |
| Header/site `located_in` SAME logical review File | Header Base29–29; callsite Head30–30. Commit/range/side/hash belong to the respective relationship evidence. |
| Helper `located_in` local-access File | Head3–3. Do not relocate it to review.ts to simplify a diagram. |
| refresh `calls` request; refresh `located_in` review File | Call witnesses Base37/Head38; declaration witnesses Base34–44/Head35–45. Neutral source equality does not prove unchanged runtime behavior. |
| Changed/unchanged tests and policy context | Modified E2E, unchanged application assertion418, added gateway definition90–114; precise direct/indirect/policy scopes, all not run. Checked missing side stays provenance, never a fake Before entity. |

Read top-down: PR scope → changed File role → request comparison → exact Before construction / After callsite. Then follow the existing call to the external helper and its own File evidence. Read bottom-up through those same statements to explain how the smaller source change contributes to the request/File account and prepared intended goal; this does not materialize extra direct edges, status aggregation or proof of goal achievement. A Change can crosscut these Files, and the same entity can have multiple views without duplicate identity. Spatial membership does not require parent→child arrows; real Test→assertion relations remain distinct.

### Underlying evidence and authority

- [Core request semantic/evidence account](../plans/720p/slices/05-explanation-exploration/reviews/core-request-graph-v1.json): exact occurrence/call IDs, native Change ranges, source hashes/text/range/UTF16 witnesses, named-import binding, Claim/Explanation support and bounded selection frontier. Its original no-test scope is historical, not current absence of tests.
- [Logical occurrence-to-entity mapping](../plans/720p/slices/05-explanation-exploration/reviews/logical-entity-mapping-v1.json): explicit prepared comparison matching, not name deduplication or general repository inference.
- [Modified E2E evidence](../plans/720p/slices/05-explanation-exploration/reviews/request-test-evidence-v1.json) and [application/gateway evidence](../plans/720p/slices/05-explanation-exploration/reviews/request-unit-test-evidence-v1.json): exact definition/assertion provenance, relevance and not-run limits. Supplemental pinned-Git evidence is not automatically retained-Snapshot-admitted evidence.
- [Owning source/evidence/composition contract](review-loop/semantic-graph.md#relationship-composition-and-inference-limits): no runtime/PASS/author-causation or goal-transition inference from paths.

Markdown owns accepted meaning, constraints and the explanation/status of this bounded ABox. Versioned JSON carries concrete prepared facts and evidence used by the current compilation; it is not an alternative ontology authority or a finalized persisted API. Observed source, prepared intent, source-derived inference and unknown execution remain separate. No app/UI changes or formal reasoning implementation follow from this document split.


## PR25 changes File facts and full core graph

This uses the explicitly accepted [PR→File changes contract](project-repository-tbox.md#pr-changes-file--comparison-qualified-relation). Both endpoints are logical identities, qualified by the repository and exact Base/Head Comparison above. The existing request Change account is a separate subject, not the File endpoint.

| Direct fact | Comparison status | Native evidence at the pinned base/head |
| --- | --- | --- |
| PR25 `changes` File src/application/review.ts | change | `git diff --name-status` reports M. Base blob9da077b77bc0571d46a3805e5304f80bb56a442d → Head44b1953f925827b492fecace0925e5fe4eec87cd; native request hunk/expression witnesses remain in the core account. |
| PR25 `changes` File src/application/local-access.ts | add | Native diff reports A; Base tree has no this path, Head blob99533c827fb57c291757dd27b54367ddb6185082. Checked absence is provenance, not a Before File/helper entity. |

Evidence pointer: the exact [prepared native comparison/diff](../../mockups/pr-file-tree/diffs.json) pins the same base/head and File records; the [core request evidence](../plans/720p/slices/05-explanation-exploration/reviews/core-request-graph-v1.json) supplies granular source identities/hashes/anchors. A local read of those pinned Git trees/name-status diff confirms the two rows. This does not infer PR membership just from the function Change or admit all50 Files' effects.

```mermaid
flowchart TD
  pr["PR25 · pinned comparison"]
  reviewFile["src/application/review.ts · change"]
  helperFile["src/application/local-access.ts · add"]
  subgraph change["request() Change graph"]
    request["request() · change"]
    header["Direct Authorization construction · remove"]
    request -->|"Before constructs · B29"| header
  end
  helper["accessHeaders() · add"]
  pr -->|"changes · change"| reviewFile
  pr -->|"changes · add"| helperFile
  request -->|"defined_in · B24–32 / H25–33"| reviewFile
  header -->|"located_in · B29"| reviewFile
  request -->|"After calls via H30 site · projection"| helper
  helper -->|"located_in · H3"| helperFile
  classDef changed fill:#fff0bd,stroke:#b79b43,color:#5c4918
  classDef added fill:#e3f3e8,stroke:#76ac89,color:#25543a
  classDef removed fill:#fae5e4,stroke:#ca7e7b,color:#642b29
  class request,reviewFile changed
  class helper,helperFile added
  class header removed
```

The PR remains in the complete **core teaching graph**, not a claim that this diagram contains all PR25 facts. There is one request and one logical File per path. Spatial Change membership draws no parent→child arrow. The reduced After call arrow is a projection of the existing request `contains_call` H30 site → `calls` helper path, not a newly materialized direct binding. The canonical callsite and its review.ts H30 `located_in` witness stay explicit in the crosswalk/evidence above; helperH3 belongs to local-access.ts. Before/After are comparison evidence, not goal transition or execution order.

Unchanged refresh, relevant test definitions, intent/inference and their unknown runtime results remain in the account above, without being invented as changed Files or deleted to simplify this diagram. No tests ran, goal was proven or app/UI changed by defining these facts.
