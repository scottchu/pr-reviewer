# Change-node projection study

Date: 2026-10-31.
Status: accepted reader goal; proposed visual treatment; standalone design preview only.

## Reader goal and evidence boundary

Help a reviewer read and understand a PR and spot unintended or undesired changes. The reviewer should be able to identify the stated or inferred purpose, inspect what actually changed, find mismatches or missing explanations, and reach the exact source needed to judge a concern. Agreement between code and an edited test does not establish desirable behavior.

Context can include versioned documents, their changes, tickets, epics, PR descriptions, plans and other obtained sources. Attribution, revision, relevance and conflicts remain explicit. Background knowledge and assumptions can inform an interpretation but cannot silently become facts or author intent. Context and change facts can support, contradict or fail to establish an intent interpretation. Missing context does not by itself establish an unintended change. These reading distinctions do not replace the [existing ontology](project-repository-ontology.md) or authorize automatic enrichment.

## Proposed Change node

A Change node identifies the affected source and scope, shows the exact changed text once, and offers Before/After witnesses with pinned revisions, path and line ranges. The title locates the source rather than repeating its source expression. A removal-only edit has no invented replacement line. Additional context is expandable. Facts and interpretations are not combined in an unqualified title such as “improves security.” Relations to requirements, tests or context need independent evidence; proximity and matching words do not establish them.

The standalone preview uses the existing PR25 request() edit in scripts/pair.ts, b096826e31c0927190806de91ed70b8b64aa93d8 to e3b270e5f49a9215452b0b86702946043e979059. It presents the direct Authorization construction removed at Before L64 and both exact hunk witnesses. It does not claim global header absence, absence of helper construction, runtime behavior, policy compliance or test execution.

## Exploration disposition

The user requested graph layers, not three reading columns. A subsequent Z-axis spatial-layer experiment separates Context, Changes and Intent interpretation while preserving within-layer and cross-layer links. That concept is parked, not adopted. No renderer replacement, grouping scheme, 3D implementation or semantic model change follows from this preview request. Earlier local diagrams remain drafts, not acceptance evidence.

## Preview boundary and acceptance

The [preview plan](../plans/720p/slices/05-explanation-exploration/change-node-preview/plan.md) owns the bounded source and reading task. A standalone, dependency-free HTML/CSS sketch is inspectable without changing the application or existing endpoint. Native disclosure exposes both witnesses. Presentation uses existing source facts; the sketch is not a second graph implementation or importer.

Success for design discussion: the reviewer can name the source edit, read the changed line without duplication, inspect both witnesses, and distinguish the local edit from any broader intent or runtime conclusion. Actual supported-browser reading, own-preview-PR graph intake and unfamiliar-reviewer comprehension remain separate gates. File/HTTP checks establish delivery of the sketch only.
