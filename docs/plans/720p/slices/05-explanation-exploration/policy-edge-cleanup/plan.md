# Remove unsupported prepared policy verification

Date: 2026-10-29.
Status: accepted cleanup, implementation pending.
Parent: [slice05](../plan.md), [720p round](../../../plan.md).
Owner: root, sole product writer. Branch: `remove-title-selected-policy-edge`.
Baseline: main `66a5033886feb29fa8807d46655d696ce9da5bb1`, including merged PR39 and PR40. The incoming handoff's draft/main status was stale; remote merge readback and clean main establish this baseline. The separate header occurrence correction is protected.

## Accepted decision and gap

The lowest-level source projection must describe exact source/version facts. Scott accepted deleting unsupported title-selected `verifies_policy` generation, preserving assertions/source evidence and adding no replacement edge. This supersedes the open decision in [the earlier analysis](../header-occurrence/policy-analysis.md). Delete the generation logic, not tests, policy documentation, history, independently attributed intent/related-policy relations or their nodes.

Active preparation appends Test → verifies_policy → owner-http-policy after enrichment admission. It chooses the gateway test by title. The maintained legacy preparation emits the same unsupported relation. Domain extraction independently produces Test contains Assertion, not policy verification. The pinned Head comment at tests/gateway.test.ts L89 names runtime.md; the exact document exists, but no precise clause/range or stable matching heading resolves, and no comment-reference resolver exists. Its literal source remains evidence, not a successfully verified policy.

## Acceptance and sequence

1. P1: Remove this emission in both producers. Matching-title/no-reference and renamed-test/assertions/reference controls never create policy verification, replacement policy edges, PASS or TestRun. Keep pinned Test contains Assertion and source witnesses unchanged.
2. P2: Narrowly version frozen canonical/projection expectations for only this relation deletion plus compiler/provenance hashes. Keep full source facts, compiled identities, every unrelated canonical/projection field and PR40 header content protected. Independently assert the intended removed relation, not a broad ignored-edge mask.
3. P3: Preserve separately attributed related_policy, motivation/intent, policy docs and source/comment content. Inspect retained graph compatibility before removing any consumer. Keep layout, filter, viewport and disclosure behavior; a missing edge may naturally alter routing, but no layout policy changes.
4. P4: Run meaningful regression RED→GREEN, owning aggregate pure suite, strict TypeScript/boundaries and production build using existing dependencies. Add actual React journey coverage for absence/preserved source disclosure. Run actual browser checks only with supported existing tools; record runner/browser and fixed-PR25 own-PR ingestion limits separately.
5. P5: Independent review and reviewable draft PR only. No merge, deployment, live restart, dependency installation, security/network mutation, execution ingestion, rerun actions, interpretation layer or story/grouping redesign.

## Implementation handoff v1

Worktree: `/Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-policy-edge-cleanup`. Allowed writes: the two producers, narrowly related oracle/contracts/tests, necessary compatibility comments/consumers and this packet/evidence. Read maintained domain/UI public boundaries and [source pipeline](../../../../../product/source-pipeline.md), [semantic contract](../../../../../product/review-loop/semantic-graph.md), [TBox](../../../../../product/project-repository-tbox.md) and [PR25 ABox](../../../../../product/project-repository-abox-pr25.md). Runtime/store and the header executor worktree are excluded. Dependencies are reused from the existing installed tree without installation. Preserve other worktrees and evidence.

## Independent-review handoff v1

Assign a fresh reviewer after a committed candidate. Read-only scope: verify P1–P5 against exact baseline/head, regression evidence and canonical delta; check active versus legacy wiring, same-title and renamed controls, source anchors/assertions, unrelated relations, compatible old graph handling, narrow oracle versioning and issue2 preservation. Return concrete findings, performed checks, pass/changes-needed and actual graph/host limits separately. No worker code writes or runtime changes. Requested model `gpt-6.1-sol`, high reasoning, fresh context: small deletion but subtle ontology/oracle and legacy-compatibility risks; escalate for unexplained canonical delta or ambiguous evidence only.

## Verification and remaining gates

Pending implementation. Raw baseline/delta and check logs remain ignored under `.decompozr/flow/run/policy-edge-cleanup/`; portable results and findings will be reconciled here. Draft publication is the authorized endpoint, not delivery acceptance. Required owner next step after handoff is review and a separate merge/deploy decision. Actual own-PR graph intake currently lacks a supported comparison selector; no fixture replacement or fake source identity may bypass that limit.
