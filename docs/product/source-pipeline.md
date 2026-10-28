# Source understanding pipeline

Date: 2026-10-28.
Accepted direction: read → parse → extraction → enrich(s). Only enrichment requires interpretive intelligence; the rest is codified.
Accepted boundary correction: UI + UI Type + UI Projection; Experience Service (corrected name) uses Domain Types; Domain Service provides capabilities. Detailed use-case/pipeline ownership is critiqued below.
Status: user adopted the architecture and authorized refactoring with proper extraction/projection tests, preserved UI and deployment. Concrete implementation contracts are established below; delivery evidence belongs to the owning slice.

## Goal and boundary

Turn an immutable repository comparison into evidence-qualified knowledge that the existing React graph can present. Extraction correctness and reviewer comprehension are different outcomes. Preserve the ontology, one logical entity with revision witnesses, native entity presence versus scoped edit composition, unknown versus unchanged, TestDefinition versus TestRun, and the current accepted graph presentation. This design adds no runtime, dependency, package/SDK split, model/API call, ontology engine or UI change.

## Stage contracts

| Stage | Input → output | Responsibility and forbidden effects |
| --- | --- | --- |
| Read | Repository/base/head → immutable source snapshot | Read exact tree/blob/diff bytes through existing acquisition effects; verify object/content identity, inventory and supported absence. Preserve decoding/binary/nonregular dispositions. No parsing, matching, explanations or network permission expansion. |
| Parse | Snapshot → parsed source and native diff records | Produce TypeScript syntax/symbol-access substrate and native hunk/row coordinates with parser diagnostics and exact source anchors. No author intent, correspondence guesses or rendered cards. |
| Extraction | Parsed input → source-backed entities, qualified correspondence/relations, edit composition and unknown ledger | Apply deterministic supported policies for declarations, tests/assertions, lexical calls, cross-version identity and native scoped edits. Uniqueness and evidence determine admission; unresolved stays unresolved. Keep canonical identity/existence independent from edit composition. |
| Enrich(s) | Validated extraction plus permitted project knowledge → attributed enrichment records | Explain what/why/consequence, propose relevance or hypotheses, and attach reasoning to existing subjects. Record input identity, producer/version, source references, scope, status and uncertainty. Never overwrite extracted facts, invent source anchors/absence/TestRun, or promote an inferred call/coverage relationship to a verified fact. |

Validation runs at every boundary. After enrichment, deterministic validation checks references, source identities, relation contracts and scope. A failed enrichment is rejected or retained as an explicitly unsupported proposal; it cannot corrupt extraction. Deterministic projection then creates the view model, layout and labels consumed by React. Projection is downstream of this four-stage understanding pipeline, not another intelligence stage.

One logical entity stays one entity even when several enrichers discuss it. Enrichment output is separate from extracted evidence and rendering artifacts. Proposed enrichers may run sequentially only for declared dependencies; independent enrichers may run concurrently over the same immutable input. Coordination, retries, budgets, keyed results and cancellation belong to the existing application lifecycle/effect boundary, not UI components or business rules hidden inside stream operators. No reactive library is selected by this proposal.

## Service and UI boundaries

The accepted result path is Experience Service → Domain Type → UI Projection → UI Type → UI. The command path is UI intent → Experience Service → Domain Service capabilities. UI Projection may also take explicit experience progress/failure state to produce loading/error UI; application lifecycle state must not become source facts.

| Boundary | Owns | Does not own |
| --- | --- | --- |
| Domain Types | Comparison identity, logical entities/occurrences, typed relationships, source evidence, qualified status and unresolved reasons | UI card/edge components, pixel positions, React state, presentation-only color tokens |
| Domain Service | Explicit capabilities for source-fact admission, correspondence, relationship derivation, edit classification and evidence/enrichment validation | Pipeline execution scheduling, provider/network setup, UI types or visual composition |
| Experience Service | Coordinates read → parse → extraction → enrich(s), invokes domain capabilities and permitted effect adapters, owns use-case inputs/results and experience progress; the earlier assignment of all pipeline retries/cancellation/stage internals is under critique below | Canonical semantic policy, UI markup or a second independent ontology |
| UI Projection | Deterministically maps domain results and explicit application state to UI Types: node/group membership at the chosen disclosure, supported labels/explanations, provenance fields and presentation status | Inventing facts, deciding logical correspondence, interpreting source through a model, mutating canonical inputs |
| UI Types | Named view contracts consumed by the current React UI: node/card/edge/inspection content and permitted actions | Replacing domain identity/evidence with labels or making render count evidence of extraction |
| UI | Rendering, accessibility, local interaction, camera/gesture ownership and dispatch of user intent | Git/parser/model effects, extraction or status inference, direct access to domain internals |

Services name responsibilities and public functional capabilities; they do not prescribe classes or a dependency-injection framework. The experience coordinator is one application composition boundary, not a new shared core. Keep cross-subsystem event wiring through the existing managed integration layer. UI consumes the experience's public command/query boundary and projected view state; it does not invoke parser/domain internals directly. No reactive library or new subscription route is selected by this document.

Use ui/ for the responsibility boundary and components/ within it. React remains the implementation technology; it is not the owning responsibility name. React-specific hooks and library node types are allowed inside the UI boundary. This naming correction introduces no alternate-framework or portability requirement.

## Critique and proposed refinement of the service boundary

Naming correction: the user explicitly means Experience Service, not Experiment Service. The rename is accepted. The user subsequently adopted these refinements and authorized implementation. The exact API below remains bounded to existing product behavior.

The terse Experience Service → Domain Type → UI Type chain omits experience state. Domain Types represent source knowledge, but an actual reading journey also has active comparison/inspection, progress/failure, retry/cancel/return ownership and allowed next actions. Use a named ExperienceState containing immutable Domain Type references/results and use-case state. UI Projection then maps ExperienceState plus explicitly local UI state to UI Types. Do not duplicate canonical facts into a second mutable domain model.

Experience Service should organize user intentions such as opening a comparison, inspecting evidence and returning to the previous reading context. A plain pipeline runner owns read/parse/extract/enrich sequencing and stage execution mechanics; the experience service invokes and observes it through a declared capability. These responsibilities may begin as a few functional modules, not two elaborate frameworks. Keep camera, pointer gestures and local component focus within their existing UI owners; put cross-step reading/return coordination with the experience owner only where required by the accepted journey.

Domain Service must expose named domain capabilities rather than become a catch-all service. Group cohesive policies behind one public boundary initially; split services only when actual domain responsibility warrants it. Source admission, correspondence, relation qualification and edit classification remain codified domain policies, not experience/projection decisions. Effects stay behind permitted acquisition/enrichment adapters.

UI Projection is an immutable deterministic function, not another mutable state service or a convenient place to invent semantics. It maps experience/domain data into view contracts, retaining identity and evidence. The rejected default raw-diff cards show why valid extraction data does not authorize a new reading experience: default disclosure and composition must follow the accepted experience specification. Tests need independent domain oracles, explicit experience tasks, expected UI Types and actual rendered journeys; testing the four folders by themselves proves no user outcome.

Recommended flow: UI intent → Experience Service → pipeline/domain capabilities; Domain results + use-case state → ExperienceState → UI Projection → UI Type → UI. The bounded implementation must expose immutable domain results plus existing source disclosure/inspection use-case state, explicit intentions and deterministic UI projection; keep camera/gestures/local focus with current UI owners.

## Proportionate module proposal

Keep one React application and an ordinary subsystem folder, not multiple packages. Use these responsibility boundaries; introduce concrete files only for actual moved responsibilities:

```
src/review-graph/
  domain/
    types.ts
    service.ts
    extraction/
      source-units.ts
      bindings.ts
      correspondence.ts
      relations.ts
      edit-composition.ts
    validation.ts
  experience/
    types.ts
    service.ts
  pipeline/run.ts
  read/git-snapshot.ts
  parse/typescript.ts
  parse/native-diff.ts
  enrich/types.ts
  enrich/run-enrichers.ts
  ui/
    types.ts
    projection.ts
    components/
      ReviewGraph.tsx
      EntityNode.tsx
      ChangeGroup.tsx
      RelationEdge.tsx
      SourceChanges.tsx
```

The pipeline is the execution sequence; services/types/projection describe ownership. They are complementary, not competing architectures. Experience Service coordinates user use cases through the pipeline runner; the extraction stage invokes Domain Service's deterministic capabilities. Enrichment adapters supply attributed candidate records; Domain Service validates their admission without calling a model itself. The resulting Domain Types and explicit experience state then pass through UI Projection. Providers and pure domain policy remain separate.

Define named domain/stage/UI contracts independently of an effectful function's inferred return type. Domain code must not import UI Types, React, the prototype renderer or curated PR fixture modules. Preserve exact source/coordinate types, explicit diagnostics and input/version identities. Use current dependencies, functional immutable transforms and explicit effects. Preserve current public application interfaces and subscription ownership. Split ui/projection.ts further only when actual responsibilities require it; the diagram is not permission to create empty layers or a generic plugin framework.

## Observed current gaps

Baseline: main5944d3b, read-only source inspection.

- prepare-source-facts currently combines Git reading, decoding, calling extraction, coverage and artifact-related concerns.
- source-facts parses TypeScript, constructs a checker, identifies tests/assertions and admits lexical bindings in one function. Parse and extraction failures cannot be audited as cleanly separate stages.
- compile-source-graph combines correspondence, native edit policies, logical identity, call resolution, relation assembly and PR25-specific familiar aliases.
- prepare-app-graph combines graph assembly, prepared explanations, PR25/default test selection, comparison evidence and presentation grouping. Those decisions must be identified as preparation/enrichment/projection, rather than called one generic extractor.
- FactDocument is inferred from prepareSourceFacts; the core type boundary currently points toward the effectful producer. Graph type imports point toward the prototype's minimal-graph module.
- Some comparison tests create input units by invoking the same extractor, so they validate comparison integration but cannot independently establish extraction recall.
- Real pinned byte/hash checks and shadowing/unsupported-case tests exist. They do not establish arbitrary-repository completeness, independent precision/recall or actual UI understanding.

## Correctness strategy

| Layer | Independent expected basis | Required checks |
| --- | --- | --- |
| Read | Git tree/blob bytes and independently constructed temporary repositories | Exact inventory/bytes/hashes/base/head/absent sides; path quoting, Unicode, CRLF/BOM/no-final-newline, binary/nonregular dispositions and rejected effects. |
| Parse | Hand-authored syntax and diff cases with manually recorded coordinates | Exact source round trips, UTF-16 offsets/lines, hunk row counts and context; malformed/truncated/unsupported inputs remain explicit. |
| Extraction | Human-audited expected facts and forbidden facts, authored separately from production extraction | Entity kind/owner/span, aliases/shadowing/reassignment, overloaded/ambiguous names, relative imports, test factories/custom matchers. Every admitted fact has valid evidence; unsupported cases are measured separately. |
| Correspondence | Small independently authored before/head expected matches and nonmatches | Add/remove/mixed/unchanged, reordered declarations, whole replacements, same-name unrelated units, additions to existing entities, unchanged units beside same-line edits. No guessed identity or absence. |
| Relations | Hand-specified caller/callee/ownership/evidence expectations | Imports are not calls; unresolved dispatch stays unresolved; source tests do not imply execution or direct unit coverage. Qualify supported lexical relations rather than claiming a full runtime call graph. |
| Domain Service | Independent expected/forbidden facts and evidence invariants | Capability policies use Domain Types only; no UI/framework/provider dependency or implicit effect. No duplicate logical versions/dangling references. |
| Experience Service | Explicit user journeys with fake public domain/pipeline ports | Open/inspect/return/cancel/retry behavior, selected comparison identity, error recovery and scope replacement. No extraction or rendering-policy duplication. |
| Pipeline runner | Fake stage ports plus real bounded integration | Stage order, declared enrichment dependencies, error/timeout/cancellation, stale-input fencing and preserved successful source results when enrichment fails. |
| UI Projection | Hand-authored Domain Type inputs and expected UI Types | Immutable inputs, exact identity/anchor retention, correct status mapping, symmetric relationship reading, chosen disclosure and default semantic children. Same domain result may produce different allowed views without changing facts. |
| UI | Actual rendered React journey | Default composition, source-open/close, labels/interaction/accessibility and bounds. Domain/projection test success cannot substitute for actual UI evidence. |
| Enrichment | Accepted facts and explicit allowed/forbidden claim rubrics | Valid citations/scope, no unsupported new facts, no TestRun from source, rejected hallucinations, timeout/retry/cancellation and stale-input fencing. Text generation may vary; admission checks remain deterministic. |

Add metamorphic checks: prefixing neutral source shifts anchors without inventing facts; shadowing removes call admission; changing an unrelated expression preserves equal-body status; input ordering does not change canonical facts. Use an independent test oracle for source/row expectations instead of calling production extraction to generate expected data. Use small temporary Git repositories for read/diff verification; retain the pinned PR25 regression corpus as integration evidence, not the sole benchmark.

A future extraction corpus reports per-supported-kind true positives, false positives and false negatives, plus abstentions/unresolved reasons. Require zero known false admissions on a declared negative suite and exact evidence round trips. Measure recall on annotated supported cases rather than claiming universal coverage. The corpus and test entrypoints must be versioned; do not add a dependency or mutation-testing tool just to begin. Small deliberate local fault probes can confirm important assertions fail when anchors, sides, relation kinds or edit categories are corrupted.

## Ordered adoption proposal

1. Establish the contracts, independent fixture corpus, expected facts/forbidden facts and layer-specific tests before moving production behavior. First executable slice is a correctness baseline, not an extractor rewrite.
2. Separate Read/Parse and deterministic extraction responsibilities while preserving canonical output/evidence and current React behavior. Keep curated PR aliases and default selection in explicit fixture/projection adapters.
3. Add the first bounded enrichment only after its input/output authority and deterministic validation are ready. An enrichment outage must leave the verified source graph usable.
4. Integrate the validated result through the existing application boundary, then verify actual reviewer tasks at the authorized endpoint. UI/deployment acceptance is not inferred from source tests.

Implementation is now authorized for the existing source-comparison slice and UI-preserving boundary refactor. New enrichment execution, arbitrary-PR intake, ontology changes and UI redesign remain outside this scope. Preserve canonical behavior; record any discovered correctness defect explicitly rather than silently changing expectations during a move.


## Adopted bounded implementation acceptance

Domain Service exposes real named parsing/extraction/comparison/validation capabilities backed by moved production policies, with no import from UI or prototype/fixture modules. Named Domain Types replace inferred effect-return contracts and renderer-owned domain definitions. Read/Parse/extraction/enrichment coordination remains explicit; existing attributed enrichment is preserved with validation, not replaced by a model call. Fixture-specific familiar IDs/default selection remain in declared preparation adapters rather than generic domain policies; preserve the current prepared PR25 account at that adapter boundary.

Experience Service owns the existing comparison/source-disclosure or inspection intentions and immutable ExperienceState and is invoked by the actual current UI, not an unused wrapper. UI Projection maps that state/domain evidence into named UI Types consumed by the current UI. Presentation rules are implemented once in the projection; React keeps rendering, measurement, pointer/camera/local focus and native source disclosure behavior. Use ui/components naming for moved render components when useful; do not create empty directories or relocate unrelated retained application features. Compatibility entrypoints for existing scripts/tests may delegate into the new owning modules, but new owners must not import the old prototype internals back.

Preservation oracle: compare canonical source entities, relation endpoints/kinds/versions, source witnesses, qualified correspondence, edit composition, unknown ledger, initial/default projected membership, entity/edge text/status and source-disclosure controls against immutable main5944d3b. Exclude only explicitly named producer/module-location hashes from identity comparison; actual source hashes/anchors cannot change. UI markup/class/style/assets/layout/gesture policies remain unchanged except necessary type/import/owner wiring. Any intentional correctness correction needs separate evidence and documented acceptance.

New independent extraction fixtures include manually authored expected and forbidden facts/spans for positive supported declarations/tests/assertions/calls and negative shadowing/reassignment/unsupported/ambiguous cases, Unicode/newline coordinates and conservative cross-version correspondence. Expected output cannot be generated by invoking the production extractor. Test exact evidence round trips and independently authored projection outputs covering mixed/add/remove/unchanged/unresolved, temporal witnesses distinct from edits, Before/After explanation/provenance symmetry, semantic default children and explicit source reading. Experience tests cover actual disclosure intentions, comparison scope/inspection, immutable state and invalid/stale intent handling where implemented. Pipeline tests cover actual stage order and failure/enrichment separation with existing effects; no speculative scheduler is required.

All new tests are part of normal declared owning entrypoints. Check strict TypeScript and dependency direction, owning pure tests and production build. Preserve the exact-source native PR25 integration tests and all latest source/raw-card rejection regressions. Required actual React/browser UI-preservation checks stay separately reported; supported-browser unavailability is not a pass or permission to bypass that route. Existing user deployment authorization continues with such missing evidence explicit.


### Producer provenance and fresh artifact identity

Moving producer code changes producer.sourceHashes, and thus the SHA256 of the complete freshly produced FactDocument bytes. That artifact identity is not the identity of a source File/Function/Test. Preserve both raw artifacts and assert each inputArtifactHash against its own complete artifact bytes. Compare old/new semantic FactDocument content with only producer.sourceHashes excluded; parser version, actual source/content/patch hashes, units, source anchors, membership and status remain checked. Keep the frozen original2be6 corpus graph/projection oracle unchanged apart from the named module-producer hash keys. Fresh pipeline projection must independently preserve the same semantic result; provenance comparison follows the explicit artifact-hash dependency contract, never an arbitrary hash-field exclusion.
