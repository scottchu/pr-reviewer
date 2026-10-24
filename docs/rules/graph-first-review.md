# Graph-first understanding review

**Requirement:** Accepted user direction, 2026-10-23

**Applies to:** Every new project PR/MR, including planning/documentation changes

**Evidence status:** Prospective protocol; no graph review is claimed by this document

## Purpose and order

A reviewer must use the actual candidate UI and graph to understand the change, then compare that understanding with source and criticize how easy the graph made the task. UI interaction is an operational check; a visible graph, clicked node, coverage count or passing E2E alone is not understanding evidence.

1. The slice owner records the real PR/MR, immutable comparison base/head, candidate source/build/runtime identity, supported graph scope, task and a source-backed expected account **before** the run. Keep the answer key separate from the fresh reviewer assignment. A source-informed verifier checks the key; do not expose it to the blind reviewer before the first account is frozen.
2. Assign a reviewer other than the implementer who has not read this change's implementation diff or answer key. Give the product task and candidate access, not the intended answer. Record prior familiarity honestly. Start in the real UI/graph: inspect relationships, labels, unknowns and source identities without direct code/diff inspection.
3. Freeze a graph-first account: purpose, before/after behavior, relevant consequence, supporting versus central changes, evidence anchors offered by the graph, unresolved questions and confidence. Record what the graph could not establish; unsupported edges must not be guessed. Preserve this account unchanged, with an observation time and artifact reference.
4. Use the UI's source/diff drilldown to verify or correct that account. Engineering review may then inspect source/tests via CLI. Retain the original account beside a corrected account and cite exact source evidence for every substantive correction. The expected account may now be revealed for comparison.
5. Critique what the graph made easier, harder, missing or misleading. Examine scope coverage, meaningful navigation and explanation, caller/callee evidence or its explicit absence, and whether the route to evidence was understandable. Record wrong beliefs, extra investigations and useful navigation steps when informative. Distinguish poor presentation from missing analysis capability.
6. Return pass, changes needed or inconclusive for the bounded understanding task, with concrete findings and remaining misconceptions. Fix materially false attribution/relationships and rerun affected checks with the new candidate and target identities before delivery. Unavailable actual UI/graph evidence keeps this review unrun. A controlled real browser may render the actual candidate/immutable PR and supply captured graph views, followed by reviewer-requested UI navigation/drilldown performed by an executor. Record this mediated route and its limits; fixtures, graph-model JSON and invented screenshots do not substitute for actual rendered product evidence. It does not prove live personal-browser control or human interaction.

The predeclared task determines the required account. A source-backed finding that the current graph cannot convey the required behavior is a product finding, not an automatic pass because controls work. A bounded bootstrap can pass its explicitly limited document/source-navigation task while leaving semantic understanding unestablished. Never lower the task retrospectively to fit the output.

## Tired-reviewer criterion

The reviewer is experienced and tired of reading PRs all day: the change should be ready to understand, not require reconstructing its story from code. Before source drilldown, ask for a three-sentence account and concrete before/after example, one important decision traced to a consequence/consumer/risk, the remaining PR scope, the distinction between test presence and execution, and one uncertain claim plus what would resolve it.

Rate orientation, whole-change scope, meaningful relationships/risk, evidence distinction, investigation/source-and-return and cognitive effort as **easy**, **workable with effort**, **burdensome** or **blocked**. Rate confidence separately as **supported**, **provisional** or **unresolved**. Record which facts were ready to understand versus manually assembled. Return **accept presentation**, **changes needed** or **inconclusive** separately from engineering acceptance. A correct final account can still reveal a burdensome graph.

## Evidence and independence

Keep each record beside its owning slice, or under the round's reviews directory for a planning PR. Record graph-first and corrected accounts, candidate/target identities, task, familiarity, actual route, source citations, critique, findings, revalidation and gaps. Keep private credentials/session metadata outside Git. Link the [own-PR evidence](own-pr-dogfood.md) rather than duplicating its provenance.

A fresh independent agent review gives independent qualitative critique. Same-agent sequential graph-to-code review is a disclosed self-check. Neither establishes causal improvement over code-only review nor unfamiliar-human comprehension. The [human evaluation](comprehension.md) remains a separate gate. Both may reveal that the graph did not help.

## Bootstrap

Before slice 04, labels may describe file/hunk containment, before/after comparison or a source-backed document reference. An edge must carry its kind and evidence. Absence of analysis is unresolved/not analyzed, never a confirmed leaf. Do not call these a call graph or infer calls from import names. Read-only bootstrap graph structure does not establish shared graph-write/CAS acceptance.

Use a clean committed task-branch candidate to review the immutable PR that adds the first graph. The source-planning commits may be ancestry of that same combined implementation PR. If a separate planning PR exists, review it with the versioned candidate after bootstrap. Each actual PR is reviewed before delivery; root may coordinate draft PRs and local integration without claiming that main already has a graph. This is an ordering mechanism, not a waiver of actual graph review.
