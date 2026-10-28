# Independent docs-only rebuild-readiness audit

Date: 2026-10-26

Auditor: fresh independent `reflection_docs_readiness` agent

Status: frozen independent account; changes needed; no whole-product rebuild-readiness pass

## Access and independence

The first attempted local read of docs/README.md, docs/rules/round-reflection.md and docs/rules/documentation.md failed before any document was read:

```text
exec_command failed: CreateProcess { message: "Rejected(\"Failed to create unified exec process: Too many open files (os error 24)\")" }
```

That attempt stopped immediately, with zero documents inspected and no audit pass. After explicit resumption, ordinary local reads worked. No alternate access, network, global cleanup or permission bypass was used.

The resumed audit inspected only durable product/rules documents; no plans, application code, runtime/test artifacts, browser, network, or other reviewers' conclusions. The account below was frozen before other reviewers' output. This is a bounded specification audit, not a rebuild experiment. Root subsequently authorized writing this already-frozen report to this one receipt file; no additional audit or plan/source read was performed for the write.

## Findings

1. **Material reconstruction gap — the current prepared call/test projection depends on unspecified packet inputs.**

   `docs/product/pr-file-tree-first.md:29` fixes 38 callable occurrences, 34 relations, 15 inter-file and 19 same-file relations. Lines 96–104 refer to immutable client/storage packets, exact packet hashes and selected seeds; lines 118 and 131–133 require exact function-to-test mappings and assertion summaries. Lines 165–167 require packet-to-retained-Snapshot crosswalks. The durable knowledge describes their meaning but does not identify a durable input contract containing the current prepared membership, test mappings, or reproducible preparation/selection rules. The general analyzer contract does not supply curated source-observed relations or test relevance; `source-analysis.md:75` expressly excludes test relevance ranking.

   **Effect:** A fresh implementer can build a suitable renderer and analyzer, but must rediscover curated knowledge or consult excluded packets/code to reproduce the described current product. Preserve the bounded prepared-input meanings, membership/selection decisions, provenance and validation interface in durable source; this need not copy application code or whole source blobs.

2. **Material specification inconsistency — older entry documents still prescribe gestures that the current reader forbids.**

   `docs/product/review-loop/canvas-reading.md:29` permits zoom-triggered disclosure; `canvas-panels.md:64` preserves source-region page magnification. In contrast, `docs/product/pr-file-tree-first.md:43` explicitly supersedes automatic disclosure, and lines 248–250 require page-scale preservation and soft wrapping. `protected-invariants.md:17–20` records the current wrap, framing and page-versus-graph rules.

   **Effect:** Following the owning canvas pages directly can reintroduce known superseded behavior. The latest correction makes the intended result inferable, so this is **reconciliation work, not an unresolved design decision**. Mark the old clauses historical or replace them with links to current requirements.

3. **Nonblocking but consequential ownership ambiguity — the presentation entry page assigns drafts too loosely to React-local state.**

   `docs/product/review-loop/presentation.md:11` says “Selection/draft are local presentation state.” The current contract instead gives StoryBridge draft/cursor ownership and ReviewBridge pending-command recovery in `review-loop/README.md:41`; `pr-file-tree-first.md:193–197` distinguishes those public owners from React's transient reading/camera frame.

   **Effect:** A rebuild starting from presentation guidance could introduce a second draft owner, undermining exact return and write-ahead recovery. Clarify which selection is renderer-local and explicitly route question drafts through the existing application owner. The detailed current owner contract already provides the answer.

## Clear boundaries in inspected material

Immutable snapshot/source versus graph/story identities; distinct source observations, interpretation and execution evidence; transactional commands and receipts; unknown-effect non-replay; exact existing-session attachment; explicit draft adoption; owner-first transactional return; transient supporting-answer checkpoint versus original Story return; bounded native, physical-device, adoption and comprehension claims are sufficiently clear in the inspected material. The auditor found no basis to call the unrun native/device/comprehension gates specification defects.

## Inspected inventory and limits

- Read: documentation map; product/rules indexes; documentation, round-reflection, development, own-PR and graph-first-review rules; vision; protected invariants; review-loop overview; runtime; presentation; test UI; ontology; canvas panels/comments/interaction constraints.
- Read substantial sections and targeted line checks: architecture, reactive design, participant adapters, review experience/reference pointers, PR25 whole-change graph and membership header, file workspace, review contracts/delivery/evolution, import jobs, acquisition, source analysis, semantic graph/storage/data, Story/exploration/recovery, configured tests and compatibility.
- **Coverage limits:** Some large combined reads truncated. Follow-up reads narrowed around findings but did not exhaustively verify every compatibility table/JSON vector, every import/test lifecycle clause, or all visual reference assets. This report cannot certify complete whole-product format compatibility even after the three findings are corrected.

## Qualified conclusion

Changes needed; no whole-product rebuild-readiness pass. Core source, authority, receipt and recovery boundaries are substantially specified. The prepared fact inputs and cross-page currentness remain gaps. A bounded audit is not evidence of a successful rebuild, implementation conformance, native delivery, physical-device acceptance or unfamiliar-reviewer comprehension.
