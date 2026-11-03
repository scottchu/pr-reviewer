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

## Top-down card revision

Date: 2026-10-31.
Status: user-selected design direction for the standalone preview, not product implementation adoption.

Order the Change-centered reading unit as Explaining, Diff, Tests. Explaining offers an attributed, evidence-linked reading and explicitly separates source observations from purpose, assumptions, contradictions and unknowns; its first position must not turn it into a verdict. Diff provides Unified and Split source views so the reading can be challenged. Tests projects source-backed relevant Test identities, with changed/unchanged source status and Test above Assertions. Unchanged does not mean passed, adequate or behaviorally stable; changed code and tests can agree on undesired behavior.

The card is a projection over existing graph identities, not a new ownership relation or a change in canonical ontology. Shared tests or interpretations can appear in several cards. No related test is invented to fill the Tests area, and grouping several edits by behavioral purpose remains an interpretation requiring support. Test execution is not authorized or implemented by clicking a test in this design preview.

For the current real PR25 example, show a local source-backed explanation of the removed headers-object entry and preserve purpose/context as unestablished. No relevant-test association has been established by this preview preparation; the Changed and Unchanged test areas must expose that gap rather than invent counts, test names, coverage, policy verification or execution results.

## Whole-graph and shared-reader correction

Date: 2026-10-31.
Status: user correction to the preview scope.

The standalone single-card sketch did not validate composed projection across the whole graph. Its hand-written plain code rendering also dropped the established syntax highlighting. The request() example without prepared relevant tests was an unsuitable positive example for the selected Explaining/Diff/Tests design; empty test areas did not exercise the requested journey. Preserve these as failed preview choices, not accepted behavior.

Use the existing complete PR25 graph/session and renderer in a separate candidate preview. Preserve canonical entity/relation identities, path ordering, graph navigation and all unrelated node presentations. An optional presentation-only Change-body renderer may enrich a selected existing Change boundary; it is inactive for the normal product entry. Measure the composed header so nested source nodes and relation labels are placed below it. Do not replace the graph with the card or add a parallel graph model.

Use the existing FileDiffBody reader and its SyntaxCode/token pipeline and established source styles for both code and test readers in Unified and Split modes. Do not reconstruct a plain pre reader, duplicate syntax palettes or silently remove highlighting in a mockup. Preserve pinned path/side/line coordinates so the token/source equality guard can work.

The representative change is createGateway() in src/server/public.ts. Its pinned tests/gateway.test.ts contains a directly imported createGateway call within one added Test (16 Assertions) and two unchanged Tests (6 and 7 Assertions). Source call locations and declaration import establish a static source association, not runtime coverage or a verifies_policy edge. Expose Test then Assertions and open the same shared source reader on selection. The tests remain source/not-run until separately obtained execution evidence exists. Explanation must remain a bounded source account; purpose/context not supported by supplied sources stays unknown.

Composed reader continuity is protected: native Test disclosure, selected Test/Assertion, diff mode, inspected comparison and source reading/fold/scroll positions live outside culled components for the comparison lifetime, keyed by canonical source identity. Closing hidden DOM must not overwrite last-visible scroll with zero. The optional presentation supplies bounded known reader pins so open composed source remains spatially retained; semantic eligibility is never widened by pins. Normal product mounting supplies neither custom content nor pins.

Shared reader reuse must not import unrelated retired graph presentation policy. In particular, the old stylesheet enables a global SVG edge-path transition that the current minimum graph does not use. The composed preview restores the current graph's non-animated edge behavior while retaining shared source/syntax styles. This is a source-correctness boundary; no claim that this CSS difference caused a WebKit process failure is established without actual device evidence.


## Bootstrap measurement and paint

Measurement is not a display state. Full graph content may mount invisibly for geometry, but unpositioned/unselected measurement cards and labels must not paint or receive input. First paint waits for measured geometry plus a valid viewport selection, or an explicit worker-failure fallback; a pending/null selection is not failure. During remeasurement retain only the previous same-comparison paint membership, intersected with current semantic eligibility and reader/focus pins. The initial optional sample camera waits for established paint containing its target.

Existing source readers and their bounds remain unchanged. Hidden/inert measurement must not overwrite last-visible reading position. No source entity or relation is removed by the paint mask. The observed6904px maximum belongs to graph/container geometry; it is not evidence of an unbounded function-source reader. A temporary generic-source-pane proposal was withdrawn after inspecting the actual node contents. This change targets the source-confirmed startup flash and full-model paint; actual WebKit crash recovery remains a separate observed gate.

Geometry observations must not synchronously publish app layout changes inside ResizeObserver delivery. Coalesce observer measurements and controlled node dimensions per frame, keep the latest per-node measurement, ignore removed/disposed targets and unchanged dimensions, and preserve immediate drag updates. The containing graph boundary owns composed-body measurement; do not add a second observer with competing invalidation. Reader viewport styles update only for changed widths. These boundaries avoid app-owned observer feedback; they do not replace actual browser stability evidence.

## Recovery through validated stages

Repeated actual mobile failure supersedes source-only confidence in the composed preview. Rebuild its presentation incrementally from a minimal entry: static delivery/runtime baseline, one React Change, shared highlighted Diff, linked Tests/Assertions, a small graph, then the complete canonical graph. Each added responsibility requires the preceding actual runtime/reading gate; source/build/HTTP success cannot unlock a failed or unavailable device gate. Reduced stages are diagnostic probes, not accepted replacements for the complete graph or its ontology. Retain old candidates for comparison and recovery. The original product endpoint is separate from this isolated preview.

Stage1 of recovery adds only a React Change card in document flow: original canonical identity/name, source-change status, unit-scoped edit counts and pinned Before/After witnesses. A compact checked projection avoids importing the complete graph or full source fixture for this stage. It is a presentation of existing facts, not a parallel ontology. Source identity can be disclosed natively; diff, Tests, layout measurement, viewport machinery and graph dependencies remain absent until separately validated. The actual React event response, mobile reading/scrolling and30-second stability are a separate acceptance gate from the earlier plain-page baseline.

Local build output belongs in ignored `dist/`; execution logs/manifests belong in ignored `artifacts/`. The user's2026-11-02 instruction supersedes Flow's project-local `.decompozr/` storage default for this work. Preserve retained earlier files while active deployments or rollback still reference them; do not rewrite them or move product knowledge out of tracked docs.

Stage2 reuses the established FileDiffBody/SyntaxCode source reader in the single-card diagnostic. Unified and Split refer to the same pinned file data and preserve existing coordinate, folding and reading semantics. Compilation may project the fixture collections to the selected exact file and token arrays without changing them; this reduces payload without becoming a second source model or renderer. The syntax palette is shared. Scope reader layout to its container so importing source presentation cannot alter the page shell or activate graph styles. Its existing deferred width observer is isolated from graph layout. Tests and graph remain separately gated responsibilities.

Shared highlighting must preserve lexical meaning as well as every source byte. Template interpolation requires context-aware continuation rescanning; a bare scanner can swallow later code into a string while still reproducing the source exactly. Tests therefore check actual keyword/comment/string categories after template continuations in addition to the exact-text guard. Token correction changes presentation evidence only, not canonical source facts or graph relations.

## One selected edit per reading card

The2026-11-02 correction focuses the prototype on one concrete source edit. A Change identity may encompass several edits in a function; the card must disclose its exact selected Before/After range and show counts for that selection. Preserve the parent canonical identity/native hunk rather than minting a new semantic Change. Focus scrolling alone is insufficient: opt-in selection scope clips all hunk/context/fold rows and cannot expand into other edits. Whole-file reading remains unchanged by default.

The reading order is Explaining, Diff, Tests. Explain the selected source observation, cite available intent/context separately and expose the question still needing review. Do not imply policy/runtime correctness. Project related canonical Tests as evidence with Test above Assertions; source-call association to the enclosing function does not establish selected-branch coverage or execution. Added and unchanged source statuses stay distinct. Disclosure and source selection reuse the same highlighted reader and preserve exact identities/witnesses. The prototype's stage controls/counters do not belong in this reading card.

## Minimal graph interaction study

After the one-edit card, test the same projection as one existing canonical Change node with no edges before increasing graph complexity. The node has an explicit drag handle; its scrollable reading body owns text selection, keyboard/disclosure/source controls and wheel/touch reading. The graph background owns navigation. Uncontrolled framework node measurement avoids application measurement-to-layout feedback; no automatic camera or full-graph layout/culling is needed for this study. Preserve the document-flow card as a comparison entry. This validates an interaction hypothesis only; card-local Unified/Split placement and graph composition are still prototype choices, not adopted product design.

## Capture scope in the complete graph (2026-11-02 correction)

A change capture is a local presentation of one changed Function/Test subject within the larger graph. The surrounding graph, other changes, files, documents and relationships remain part of the screen. A standalone page or one-node canvas is insufficient design acceptance. Optimize captures for simultaneous graph reading, not full-page consumption.

Each Test is one change/readable source unit with its own diff. Assertion edits are line changes inside it; contains facts do not require independent Assertion graph nodes or a dumped list. Remove the earlier automatic Test/Assertion/unchanged collapse hierarchy and Read Test source step. Source identity/revision and line-edit dimensions should be composed without becoming redundant nested cards. PR identity stays at graph level. Compact captures begin with the actual change/subject, not implementation labels.

The position and necessity of Explaining is a design question under iteration, not a fixed first section. Available documents/intent may be supplied by graph context; any explanation still needs attributed evidence and explicit limits. Compare in-graph visual options before adopting a local layout. Retain existing prototype artifacts and verification limits while the redesign is selected and implemented.

## Uniform change group (latest selected structure)

The user specifies one uniform structure for File and Test changes: one Change group containing exactly two source nodes, Before and After. The subject's path/range distinguishes the capture, not a separate Test-specific hierarchy. Assertion edits remain ordinary changed source lines inside these witnesses. No separate Test child, Assertion node/list, contains evidence box, collapse layer or mandatory explanation block is required by this capture. Graph-level PR context is not repeated in its header. Keep surrounding graph entities and legitimate external relationships.
