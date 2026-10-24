# Checkpoint 02A: source graph bootstrap

**Date:** 2026-10-23

**Status:** Engineering checkpoint; independent presentation/engineering review and own implementation-PR task pending. This is not slice or round acceptance.

**Packet:** 773ce21b61b95f16b722d72ecd4824c079fe52b7

**Workspace:** `/tmp/pr-reviewer-02-graph-history`, branch `build-review-history-and-graph`.

## Delivered behavior

The existing immutable source format remains valid. Explicit multi-file preparation verifies the complete pinned Git changed-path inventory, strict text blobs and one-hop Markdown link targets. The application derives file, changed-span, comparison, containment and document-reference evidence with immutable anchors; unresolved links and unavailable material remain visible. The actual React Flow view has before-left/after-right nodes, change labels/excerpts, keyboard source controls, a textual relationship list and return navigation. Callers/callees remain not analyzed. Nonempty drafts hold source selection.

New public fields are optional `Snapshot.changedFiles` and `Snapshot.documentReferences`; existing source identity is unchanged for legacy single-path preparation. `projectGraph(snapshot)`, `sourceViews(snapshot)` and the application's `View.graph` expose the read-only projection. No graph event wakes an agent or writes the database. History admission is still 02B, not this checkpoint.

## Verification

Strict TypeScript and subsystem boundary check passed. Seven Bun domain/registry/graph tests and sixteen Node application/delivery/gateway/runtime/storage tests passed. Three real Chrome journeys passed: prior controlled-host PR14 MCP reply/restart, prior PR19 question, and PR20 graph → keyboard source → anchored question → return. The new journey verifies missing-anchor rejection, unauthenticated access denial, draft selection hold, no attachment/no notification, changed-span expansion and unresolved references. Original controlled/native evidence distinctions remain intact.

The actual PR20 comparison is base `aeadce0ace7f509160d0630ee18c75d74e4537b2`, head `df171b2ce8aee0c2e72249fc68138cf2f0e507d6`, with all three changed Markdown paths and six changed-file sides. The implementer inspected the rendered graph: neutral hierarchy, readable labels, distinct dashed document links and textual uncertainty. This is visual inspection, not unfamiliar-reviewer understanding.

Raw test/capture evidence is outside Git at `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-02A-final-e2e.rwp3RLjGQQ`. Graph-only captures exclude separate source/diff and expected-answer material. These test runs disclose a dirty engineering candidate; the committed runtime/capture identity is supplied separately after this checkpoint commit. `scripts/capture-review.ts` supplies repeatable actual-browser graph/source views on the committed candidate.

## Knowledge and remaining gates

Durable graph/derivation/rebuild rationale is in product evolution.md, source/runtime/capture bounds in runtime.md, discussion/inbox/reply semantics in contracts.md and definitive delivery/retry behavior in delivery.md. Every-upscaling-milestone reflection and whole-product docs-only audit are explicit in AGENTS.md and shared documentation/reflection rules. Baseline docs-only audit gaps were reconciled from actual responsibility/behavior inspection; an independent docs-only reassessment remains required before stage acceptance.

The best rebuild design now retains a pure immutable source domain, one transaction owner and application query projection, with private graph view state. A second graph store or parser framework would add unsupported mutable identity/semantic claims. Required history migration, late historical replies, own implementation PR, fresh graph-first account, independent engineering review, native Codex/Claude and human comprehension remain open. The retained pilot code/data/processes/routes were not modified. Root owns publication and delivery.


## Independent review corrections

**Status:** Fixes derived; independent recheck and updated graph-first account pending.

The independent engineering review of frozen `5019175` found four concrete provenance/recovery defects despite passing checks: lost multi-file input after database-only commit, encoded `#` path misresolution, incorrect fence closure, and false addition/removal inference for unavailable comparisons. New failing-first tests reproduced these cases; corrections retain owner preparation input in the same SQLite transaction, use one pure URL/Markdown provenance resolver, and keep unavailable comparison lines explicitly not analyzed. Earlier aggregate recovery without setup metadata uses original prepared-side provenance. Discussion/receipts are retained.

A related private promisor-object probe reproduced implicit Git lazy-fetch executing a configured helper. The corrected read wrapper disables lazy fetch/replacements/configuration/helpers/prompts, bounds time/output, and a sentinel regression proves no helper execution or object retrieval. Missing source remains unavailable; no fetch authorization was introduced. Attribute-driven patch-hunk behavior belongs to the separate acquisition subsystem; this bootstrap computes line statuses from immutable text and requests only a complete Git name/status inventory.

The actual own PR21 graph-first review at the forty-path pinned comparison found the fit-all overview unreadable and understanding burdensome. The correction adds a complete keyboard file index with a readable focused pair, bounded context neighbors, explicit complete-vs-visible counts, and independent graph focus. Actual browser assertions cover draft/source retention while changing graph focus and nonoverlapping file/span cards. Source-derived excerpts remain orientation material rather than semantic narration. The frozen first account and its critique remain valid history; a new candidate needs a new graph-first freeze before source drilldown.

Frozen-candidate PR20 source/relationship/navigation drilldown evidence remains at `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-pr20-phaseB.zdCdoMO1Qm`; both frozen candidate runtimes were gracefully stopped before edits. No mixed-source live capture is claimed. Corrected dirty-source regressions are at `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-02A-corrected-final.J3rD4c1FbL`. Exact clean candidate/target and subsequent capture identity are supplied separately.

The independent docs-only reassessment of `5019175` found the six baseline substantive knowledge gaps closed for a bounded equivalent rebuild, with minor status/scope wording corrections now reconciled. This qualified docs-only result is neither actual reimplementation nor engineering/native/human acceptance. The actual-code reflection still favors one store owner and pure graph projection; the focused graph fixes an observed presentation failure without adding semantic analysis or a second graph store.

**Correction verification:** Strict TypeScript/boundaries passed; eleven Bun and nineteen Node checks passed; all three actual Chrome journeys passed on the corrected source, including focus-with-draft retention and rendered node nonoverlap. Raw final regression/capture evidence: `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-02A-recheck-ready.0pNcPoPwts`. Native hosts, independent recheck and updated graph-first understanding remain unrun at this correction commit.
