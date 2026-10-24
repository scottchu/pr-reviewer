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
