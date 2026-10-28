# Source understanding pipeline

Date: 2026-10-28.
Accepted direction: read → parse → extraction → enrich(s). Only enrichment requires interpretive intelligence; the rest is codified.
Status: architecture proposal and acceptance design. Existing implementation has not been reorganized to this structure.

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

## Proportionate module proposal

Keep one React application and an ordinary subsystem folder, not multiple packages. These are proposed responsibilities, not an instruction to create empty files in advance:

```
src/review-graph/
  contracts.ts
  read/git-snapshot.ts
  parse/typescript.ts
  parse/native-diff.ts
  extract/source-units.ts
  extract/bindings.ts
  extract/correspondence.ts
  extract/relations.ts
  extract/edit-composition.ts
  enrich/contracts.ts
  enrich/run-enrichers.ts
  validate/evidence.ts
  validate/graph.ts
  pipeline.ts
  projection/entities.ts
  projection/relationships.ts
  projection/visibility.ts
  projection/layout.ts
  react/ReviewGraph.tsx
  react/EntityNode.tsx
  react/ChangeGroup.tsx
  react/RelationEdge.tsx
  react/SourceChanges.tsx
```

Define named stage contracts independently of an effectful function's inferred return type. Domain contracts must not import the prototype renderer or curated PR fixture module. Preserve exact source/coordinate types, explicit diagnostics and input/version identities. Use current dependencies, functional immutable transforms and explicit effects. Introduce a file only when moving an actual responsibility, and preserve current public application interfaces and subscription ownership. Actual enricher implementations are later bounded work; this proposal does not create a generic plugin framework.

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
| Graph/projection | Ontology invariants plus expected semantic tasks | No duplicate logical versions/dangling endpoints, correct source anchors, same canonical input across projection/expansion, symmetric relationship reading, default semantic children and explicit source inspection. |
| Enrichment | Accepted facts and explicit allowed/forbidden claim rubrics | Valid citations/scope, no unsupported new facts, no TestRun from source, rejected hallucinations, timeout/retry/cancellation and stale-input fencing. Text generation may vary; admission checks remain deterministic. |

Add metamorphic checks: prefixing neutral source shifts anchors without inventing facts; shadowing removes call admission; changing an unrelated expression preserves equal-body status; input ordering does not change canonical facts. Use an independent test oracle for source/row expectations instead of calling production extraction to generate expected data. Use small temporary Git repositories for read/diff verification; retain the pinned PR25 regression corpus as integration evidence, not the sole benchmark.

A future extraction corpus reports per-supported-kind true positives, false positives and false negatives, plus abstentions/unresolved reasons. Require zero known false admissions on a declared negative suite and exact evidence round trips. Measure recall on annotated supported cases rather than claiming universal coverage. The corpus and test entrypoints must be versioned; do not add a dependency or mutation-testing tool just to begin. Small deliberate local fault probes can confirm important assertions fail when anchors, sides, relation kinds or edit categories are corrupted.

## Ordered adoption proposal

1. Establish the contracts, independent fixture corpus, expected facts/forbidden facts and layer-specific tests before moving production behavior. First executable slice is a correctness baseline, not an extractor rewrite.
2. Separate Read/Parse and deterministic extraction responsibilities while preserving canonical output/evidence and current React behavior. Keep curated PR aliases and default selection in explicit fixture/projection adapters.
3. Add the first bounded enrichment only after its input/output authority and deterministic validation are ready. An enrichment outage must leave the verified source graph usable.
4. Integrate the validated result through the existing application boundary, then verify actual reviewer tasks at the authorized endpoint. UI/deployment acceptance is not inferred from source tests.

No implementation refactor is authorized by this proposal alone. The accepted pipeline direction is durable; concrete module names, extraction corpus size and enricher implementations remain proposed until the next bounded slice is established.
