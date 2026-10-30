# Raw projection correctness

Date: 2026-10-30.
Status: accepted correction; implementation and verification tracked in the [slice packet](../plans/720p/slices/05-explanation-exploration/raw-projection-correctness/plan.md).

## Three responsibilities

The PR contains source, including documentation and documentation changes. Pinned source and native diffs are the source layer. Deterministically extracted occurrences, comparison facts and typed relations form the fact layer. Attributed explanations connect source knowledge and facts without becoming extracted facts. Projection presents these identities and evidence; it must not introduce an interpretation through string matching or silently discard source changes. We remain in raw projection mode. Search, Story, new navigation, reading guides, alternate layouts and broader import support are outside this correction.

Factual correctness is mandatory now, independently of later comprehension acceptance. A duplicate relation identity or inaccessible native change is a defect, not merely missing usability evidence. Passing source checks establishes only their declared fact/projection scope; it does not establish actual rendered behavior.

## Relation identity

Every entity ID and relation ID is unique in its graph, including nested graphs. Every relation endpoint resolves. Two version-qualified facts may share endpoints, but not an ID. Before and After constructs edges retain separate unique IDs qualified by version; they do not invent a new logical Header entity. A comparison edge can instead carry both witnesses only where that existing relation contract explicitly admits it. Graph validation rejects duplicate edge IDs as well as entity collisions and missing endpoints.

## Complete native source disclosure

Every changed text File retains its native diff and exact Before/After witnesses, including Markdown, CSS, imports, types and top-level statements that have no admitted structural unit. The existing View source changes disclosure accepts File subjects through the same Experience Service intent used for Function/Test. Reuse existing source preview, all-hunk reading, scroll retention and comparison scope. Keep File source-unit pagination separate. Do not add a new panel, control system, entity kind or interpretation. Default file disclosure remains closed; existing document evidence remains present.

Each native added/removed row in the pinned comparison must be reachable through a changed File disclosure, independent of parser support, logical matching or unit pagination. A failed/unavailable native parse stays explicitly unresolved and must never claim complete coverage. File disclosure is evidence access, not proof of semantic extraction completeness.

## Admitted interpretation

The supported kinds remain Reason, Goal and Behavior. Each admitted record requires a nonempty attributed basis and at least one exact source reference qualified by repository, side, pinned commit, content hash and positive in-bounds line range. Admission requires matching source bytes; missing bytes or invalid attribution reject enrichment while preserving source facts. Exact references establish the input basis, not the truth of the interpretation or execution of the described behavior.

The existing relation contracts are Change motivated_by Reason; Change intended_to_achieve Goal; Reason impedes Goal; Change related_policy Behavior. Validate actual endpoint kinds and nonempty relation basis. Do not temporarily substitute a Function for the Change subject to pass validation. Candidate interpretation cannot override source identities, contain nested facts, duplicate IDs or admit arbitrary predicates. Validate at the final assembly boundary too; supplying a candidate directly does not bypass admission. Invalid enrichment is unavailable with a retained failure reason, never a partial successful explanation.

The prepared local-owner policy cites the exact pinned runtime policy prose and gateway assertion source as separately attributed context. It remains related_policy, not policy verification, a formal clause resolver, PASS or TestRun. UI edge provenance exposes those sources. Source Assertion titles/values remain verbatim; remove substring-based paraphrases from UI projection. An interpretation, if later wanted, belongs in the attributed layer with its own evidence.

## Verification boundary

Use literal negative fixtures for duplicate versioned edges, wrong endpoint kinds, absent basis/references, stale source identity, out-of-range references and direct-assembly bypass. Check actual pinned inventory and witness hashes against Git, and native-row disclosure coverage against the complete patch inventory. Verify the existing React File disclosure and close/reopen behavior when the supported browser is available. Browser failure is unrun, not permission to use an alternate control route. Fixed PR25 intake still blocks own-correction-PR graph dogfood; source self-checks do not satisfy independent graph-first understanding.
