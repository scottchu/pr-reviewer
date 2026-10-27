# Deterministic source-fact foundation: independent source review

Date: 2026-10-27. Fixed candidate: `e8ee6223a07a251e8ac3496dcaca28553a83cf67`; implementation packet `f5c637e3b20c0245cd94ebdfde8a4c68c3f96695` / v22. Scope: independent read-only source review of the six-file foundation change. Only this review report is written by the reviewer. No source generator, tests, browser, deployment, network or runtime action was executed by this reviewer.

## Conclusion

No remaining blocker found for this bounded Git/AST occurrence foundation. It may proceed to scope-confirmed compilation/integration. It is NOT an application-graph delivery gate: the renderer still uses application7681e27; cross-file call-target binding and logical cross-version correspondence are explicitly not performed by this syntax stage. The later integrated candidate must actually consume generated structural facts rather than retain manual structural truth with an added provenance label, and requires its own fixed source gate before deployment and affected actual-candidate acceptance.

Root has stated the current working scope as all PR25 changed Files plus parseable test-source coverage. Full native File membership, AST occurrence coverage, supported semantic relationships and explanation completeness remain separate. A large occurrence count neither requires one root card per AST record nor proves full source/call/test relevance.

## Actual review and fixed counterexamples

Read fixed `prepare-source-facts.ts`, `source-facts.ts`, `tests/source-facts.test.ts`, the commit file list and package/docs scope. Earlier uncommitted writes were originally UNVERIFIED after OS24 blocked process creation; later successful local reads established their existence. Findings reported on moving source were early feedback, not fixed-candidate passes.

- Git acquisition now uses the existing **public** source-acquisition effects with bounded output/time, no optional locks/lazy fetch, literal pathspecs, disabled textconv/external diff and existing runner environment policy. Blob bytes are read by object ID and checked against their actual Git object hash. No global setting or new network route is introduced.
- Source SHA256 is calculated from raw bytes; fatal UTF8 decoding preserves valid text, and binary/invalid UTF8/non-regular objects receive explicit unsupported dispositions rather than fabricated source or checked absence. Tree parsing retains tabs inside filenames and mode/type/object identity. Present-side versus missing-side state stays distinct.
- TypeScript syntax/type-checker lexical symbols identify source units and imported test/assertion patterns. Exact source substrings, UTF16 start/end and inclusive line coordinates retain repository/commit/side/path/content hash. Hash mismatch and syntax failure reject rather than guess. Occurrence IDs include revision and anchor; this is not logical entity matching.
- Shadowed/unimported test/assertion names do not qualify. The real false-positive counterexample `assert.equal.bind(...)` is no longer admitted as an Assertion. Supported negated matchers are recognized; unsupported imported matcher/API patterns remain callsites with a diagnostic ledger. Constructors and unnamed functions are not mislabeled anonymous callbacks. Namespace/custom test factories remain explicitly unassessed, not absence or completed discovery.
- Test definitions/assertion source are not TestRuns or coverage. No new assertion-target binding, direct test-to-function verification, goal proof or absent-run placeholder is emitted. Explanations are expressly separate attributed input.

The focused source tests include determinism/Unicode coordinates, imported-name shadowing, hash/syntax rejection, unsupported source kinds, raw decoding/tree paths, assertion-bind/negation/custom matching and safe Git command flags. These are meaningful counterexamples for the reported issues rather than only expected counts. The current declared normal reading-journey pure-test entry includes these tests; this reviewer did not execute it.

## Evidence limits and next gate

Executor reports six focused tests and owning renderer strict compilation passing, and an actual generation with50changed Files,47unchanged test-context Files,150AST source sides,39533occurrences,668test-definition occurrences and5007assertions; application line418 is retained on both sides and eight unsupported assertion patterns are disclosed. These are **executor results**, not independently rerun checks or runtime outcomes. The generation artifact itself is not independently hash-certified by this review.

The foundation inventory can support full-file graph membership, but not automatically source-level status rollups, identity matching, call binding, test-to-code coverage or all-goal explanations. Compiler/integration must preserve one logical entity with exact occurrence correspondence and fail closed on ambiguity, use actual native File status, keep meaningful smaller-unit granularity (including the required Before expression/After callsite), and leave unsupported bindings explicit. Relevant source tests must remain discoverable without manufacturing assertion-target edges. Keep all current graph semantics, Reason/Goal inference and evidence boundaries while replacing manual structural inputs. No fixed integration or live acceptance is implied here.
