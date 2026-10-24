# Slice 03: discover and account for the whole change

**Packet revision:** 3

**Date:** 2026-10-24 UTC

**Status:** Full integration implementation dispatched from merged main a5043c5; bounded 02B and acquisition prerequisites reconciled, product acceptance pending

**Parent:** [720p round](../../plan.md)

**Predecessor:** [Slice 02](../../../480p/slices/02-review-continuation/plan.md)

**Durable source:** [Import jobs v1](../../../../product/review-loop/import-jobs.md), [source history/import boundary](../../../../product/review-loop/evolution.md), [repository-path story](../../../../product/review-loop/README.md#repository-path-entry)

**Owner:** Root coordinates inputs, assigns the integration executor and independent reviewers, and owns publication/merge/pilot delivery

## Outcome and current gap

Enter a repository/worktree path, explicitly resolve ambiguity, acquire the actual PR/MR comparison and inspect a complete changed-file/hunk ledger with truthful unsupported material. Existing comments remain usable while real acquisition runs. Initial import creates an authenticated durable review; continuation adds an immutable snapshot without retargeting old discussion, draft or session.

Reviewed acquisition preparation exists at `6127f760b2fd0da609d088241c65c7c51c1f89c6`, with provider/base/head/source/object/disposition/hunk/count public values. Its independent integration-ready disposition was supplied by root; this planning task inspected the pinned interface and fixes, not reran that review. Root subsequently reported context-loader `d2def8823c5249808ac83b4cdc35a7f71efa7bb7` independently module-integration-ready. It remains outside basic slice03 scope and is not a prerequisite for whole-change import; any later context integration consumes its exact reviewed public port.

02B code `e0685025218b52d506adc5b7351f055dcd7ea7dd` has independent cumulative engineering, whole-current-product docs-only sufficiency and actual PR22 continuation/navigation acceptance. Final docs-only receipt `3ba33b07b6ebea014ade934acc40f23f222fa066` is merged through PR22 into main `a5043c5f8a5c6ceeaceca42937f3c1aa6b12b263`. [Accepted predecessor receipts](../../../480p/slices/02-review-continuation/review-receipts-02b.md) retain precise source/candidate/journey identities and native/human/semantic limits. Polling cannot interrupt an explicit source selection; selected/current/question identities stay separate. Full job lifecycle, acquisition-v1 verification, authenticated initial creation and provider ledger UI are still new work.

## Readiness and selected design

Use the [complete implementation/review handoff v3](integration.md). Root dispatched the sole shared integration executor from verified merged a5043c5. The actual accepted 02B source/receipts and reviewed acquisition checkpoint are reconciled below before shared code. Missing native/human evidence does not block unrelated verified engineering, but an unresolved source/auth/storage defect blocks its dependent integration. Pure fixture/design preparation may proceed while reviews run.

Selected design is one existing SQLite owner and a bounded asynchronous import runner using public injected acquisition effects. Journal request/claim/invocation/process/result/admission separately, use private internal grants, release transactions before effects and preserve unknown launches without replay. A fresh retry is explicit new work after old-effect quiescence, not automatic redispatch. No new daemon, worker HTTP auth, stream library or native CLI probe is needed.

Source-preparation adds an explicit acquisition-v1 adapter preserving the existing provider identity algorithm; it must not reinterpret provider input as manual_git_v1. Add provider-specific support for empty/zero-line/all-unsupported results and up to1,024 source sides while preserving existing manual checks/IDs. New CreateReview enters through verified domain ingress/receipts; setup store.prepare remains setup-only. Continuation retains AddSnapshot authorization, immutable membership, CAS and no-rewind semantics.

Keep the8MiB public JSON envelope unchanged. Use owned generated artifact IDs and integrity-checked local result references with a separate16MiB encoded result cap and64MiB retained-source budget per review; reject excess explicitly without truncation/ID changes/eviction. Credentials and arbitrary supplied paths never become artifact data/capabilities. These bounds and recovery rules are detailed in durable source, not only the plan.

## Acceptance

| ID | Outcome / verification |
|---|---|
| 03-A | Correct unique/ambiguous/none/unavailable path discovery and explicit candidate selection, preserving fork/host/base/head identity. Existing gh live route and missing glab remain separate from fixtures. |
| 03-B | Every changed path/hunk has one primary inspectable disposition with exact provider metadata, source hashes/object IDs and empty/unsupported/mode/rename/copy cases. Complete inventory, selected input, prepared/context source and analyzed relationships remain distinct. |
| 03-C | Durable request, process observation, result and admitted source are separate; comments progress during actual acquisition. Cancel/crash/restart/unknown and receipt retry cases have real-process evidence and no blind replay. |
| 03-D | Verified initial creation and continuation preserve all historical anchors/replies/credentials; foreign source, forged witness/grant, stale expected-current and artifact tampering reject atomically. |
| 03-E | Actual React path-choice-progress-ledger-source/graph journey and new-head continuation work on a real own PR; readable bounded focus retains the full ledger without moving drafts. |
| 03-F | Fresh independent graph-first reviewer freezes a source-anchored account before source inspection, then corrects it and critiques ease of understanding. Inventory counts/screenshots/E2E are insufficient alone; no semantic callers/callees or human proof is implied. |
| 03-K | Whole-current-product reflection promotes actual behavior/interfaces/rationale/limits to durable source; a fresh docs-only audit closes material knowledge gaps before milestone acceptance. |

The [I01–I20 matrix](integration.md#predeclared-test-and-fault-matrix) maps concrete tests and review tasks to these outcomes. It is planned, not executed. Independent review and real own-PR dogfood remain required; applicable native-host/GitLab/human gaps stay explicitly open.

## Own-PR task readiness

Initial source target is [PR19](https://github.com/scottchu/pr-reviewer/pull/19), baseline `cf179ac1eeb9073c08e4e82c950cb53bdc681c72`, head `66cd9e0038459026d3788460c6e940f89382c14b`. This planning task freshly read GitHub PR metadata and compare merge-base: closed/merged in `aeadce0ace7f509160d0630ee18c75d74e4537b2`; provider comparison listed45 changed files. Local pinned diff confirms eight modified and37 added paths. No import/UI task was run by the planner.

Before presentation implementation, use the verifier-only source account in integration.md and independently validate its ledger expectations; the graph-first reviewer receives the task only. Final own-PR acceptance should use the actual integration PR with separately pinned candidate/build/base/head and a source-informed account declared before the run. If target identity changes, rerun affected checks; historical PR19 counts never become evidence for the new PR.

## Exact predecessor contribution and adapter gaps

- Public source-preparation owns manual schema, pinned Git builder and nonserialized review/exact-manifest witness. Raw transport data cannot authorize source admission. Acquisition-v1 is a new adapter, not an existing accepted scheme.
- AddSnapshot accepts local-user identity, commandId, reviewId, expectedCurrentSnapshotId, identityScheme and snapshot; current candidate schema only allows manual_git_v1. Its current store validates before short transaction, then checks source membership/CAS atomically and keeps receipts. Provider addition must preserve that boundary and extend schema deliberately.
- Review queries expose selected `snapshot`, currentSnapshotId and summaries; historical question reads/replies resolve original source. Imports must not duplicate all historical bodies into view queries or retarget private selection.
- Existing setup preparation-input persistence is recovery metadata, not import job state. Product CreateReview must add authorization and receipts rather than expose setup prepare.
- Acquisition may have512 changed paths and up to1,024 existing source sides, empty prepared blobs and no selectable text. Current manual schema limits/line assumptions require explicit provider-only compatibility work, not lossy mapping.
- Current full command envelope and snapshot validation use8MiB encoded limits; artifact ingress needs separately bounded provider validation/storage rather than bypassing every size check.
- Bootstrap file/hunk graph and manual first120 links do not analyze calls or provide complete omitted-link attribution. Basic import does not wait for04 context/call analysis; no-edges is not a semantic leaf.

## Required return, successors and reflection

Return clean candidate/branch/worktree, actual final predecessor/acquisition IDs, public job/preparation/admission/effect/artifact contracts, commands/environment/results, actual own-PR/React/process evidence, independent findings, promoted source knowledge and recovery notes. Root handles actual publication, merge and authorized pilot update. Preserve current pilot/auth/routes throughout candidate work.

Contribute verified provider/source and bounded job/result interfaces, full ledger/coverage semantics, artifact/admission limits and remaining gaps to slice04. That owner reconciles actual inputs before vertical integration; its independent pure analysis preparation is not changed here. Do not create05–08 hierarchy or extend into execution/story/enrichment.

At this milestone and720p round, apply [round reflection](../../../../rules/round-reflection.md): inspect actual structure, ask what design is best if rebuilding now, update durable knowledge and assign a fresh whole-current-product docs-only auditor excluding plans/chat/code. Material knowledge gaps block acceptance until corrected; an audit is not an unperformed rewrite. Passkey remains the final follow-up, with existing login/data/credentials preserved.

## Planning provenance and checks

Planner worktree `/tmp/pr-reviewer-slice03-integration-plan-Yc0IuR/worktree`, branch `plan-durable-import-job-integration`, based on candidate029d764. Writable scope is only this plan, integration.md and new import-jobs.md. Main was clean during initial inspection; existing candidate/acquisition/pilot state was not modified. No code/dependencies/processes/artifacts/credentials/global routes were created. Retain the local committed worktree for root handoff; no push/PR/merge/delegation is authorized for this planner.

Relative-file links passed; staged whitespace and allowed-file checks passed before commit. Exactly the three authorized documentation files changed. Live read-only metadata verification establishes the selected PR identity only; all job/UI/graph/process tests remain unrun. Root must register the new durable page in shared documentation maps when incorporating this packet; those maps are outside this planning writer's scope.


## Active implementation assignment v3

**Source packet:** Planning commit 2b7feec2a4528d4d57e42e29b28cbf364d5dc875, reconciled here against merged a5043c5 and final 02B receipts.

**Owner/workspace:** Root’s sole shared integration executor `/root/implement_history_graph`; reused isolated `/tmp/pr-reviewer-02-graph-history`, NEW descriptive branch `import-pinned-review-from-repository` from a5043c5. Original 02B branch/history and all raw candidate data remain preserved. Primary main and retained pilot are not writable task checkouts. No delegates, push/PR/merge/global installs/auth/session/network-route changes. Root owns publication/merge and a separately assigned pilot runtime owner.

**Ready inputs:** Reviewed acquisition commits 2c8879cc038286a8eab38f03cdd1ef0846e92aa1 then 6127f760b2fd0da609d088241c65c7c51c1f89c6; independent report `/tmp/pr-reviewer-source-acquisition-review/recheck-6127f76.md`. Full candidate identity, zero/all-unsupported results, exact ledger/hunks/modes/counts and hardened effects must survive mapping. Context and04 analysis modules are optional successors, not basic03 prerequisites; no context/analyzer code is incorporated at dispatch.

**Ownership:** This executor owns shared domain/application/storage/server/MCP/UI/integration/runtime/preparation/boundary registration and normal-test-script registration needed for 03. No new dependency/runtime is selected; package/lock analyzer alias integration remains held and is not added here. Use existing Node 24/Bun/Chrome/Git/provider clients, strict TypeScript/functional arrow patterns and meaningful failing-first tests. Isolated candidate ports/data only; occupied ports fail without stopping their owner.

**Gates:** Derive I01–I20, real process faults/comment overlap and actual React path-choice-ledger-history first, then publish a clean checkpoint for root’s actual new own-PR graph-first/independent engineering review. Reflect against actual whole product and promote knowledge before a fresh docs-only audit. Bounded02B predecessor readiness does not waive03 execution or full 480p native/human gates.


**Acquisition incorporation:** Exact reviewed source2c8879cc then6127f760 was applied as local4553ee3/39ff7e2, preserving the v3 plan instead of importing old773 planning ancestry. Sixteen focused acquisition tests pass on installed Node24.21.0/Git2.56.0; gh2.103.0 is available, no glab installation performed. This is module evidence, not job/UI acceptance. Root’s separate pilot owner deployed merged02B a5043c5 with preserved original gen3/rev6/question/reply/inbox/attempt/credentials and actual graph/history/source99 readback; no additional wake/auth/route change. Private deployment report remains `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-slice01-u3qgyrnv/deployment-pr22-20261024T031313Z/deployment-report.md`; native automatic turn/catalog limits remain unchanged.
