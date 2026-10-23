# Slice 01: one real review loop (480p)

**Status:** Planned; implementation not started

**Parent:** [Product roadmap](../roadmap.md)

**Design:** [High-level design](../../architecture.md)

**Owner:** Implementing agent; maintainer resolves product scope and host authorization gaps

## Outcome

A reviewer sees one pinned real behavior change, posts a question on its exact source context, and receives a source-backed reply from the responsible agent in the exact attached conversation. The reviewer can explain what changed and identify the evidence behind the answer.

## Inputs and scope

Before implementation, select one representative PR/snapshot and a minimal exact source span, verify repository access, identify the existing conversation host and its supported attachment/MCP/wakeup/reconciliation capabilities, and agree the local run target. No new host or permission is inferred from this plan.

Build only the minimum vertical path: readable source/context with actual design-system controls, stable authenticated participant/attachment, durable command/receipt and inbox, exact host adapter, bounded MCP reads/reply and authoritative UI readback. Use one behavior and a simple presentation; a full semantic canvas or general analyzer is unnecessary here. UI delegates domain operations through explicit subsystem interfaces.

## Feasibility gate

Bound the initial host-capability experiment to one local development session, recording actual identity, capability and invocation evidence before expanding scope.

- Pass: a real anchored comment causes the verified exact host turn to read that context via MCP, persist its reply through command ingress, and display the same reply in the UI.
- Fail: wrong conversation, duplicate external execution, unauthorized/stale writes or evidence incorrectly labeled as delivered/answered. Repair the affected boundary before continuing.
- Inconclusive: unavailable/unsupported host capability or uncertain launch outcome. Keep events pending/degraded or unknown; reconcile by invocation identity. Do not blindly resend or unlock direct-delivery acceptance.

## Acceptance and test approach

Use TDD for domain transitions and adapter contracts, followed by end-to-end verification with the real host and real design-system integration. Record actual commands, source version, environment, artifacts and observed outcome; planned tests are not passing evidence.

1. UI save, event delivery, turn start/completion, durable reply and browser adoption are distinguishable and evidenced.
2. Identical command retry and crash/restart do not duplicate domain writes; changed-payload commandId reuse is rejected. Cursor recovery/coalescing retains every addressed item.
3. Agent MCP commands can apply during its own turn; no domain lock or participant-wide lock is held across waits. A controlled independent long job does not block comments.
4. Apply-time authorization and generation reject stale/revoked writes. Participant, turn, job and invocation identities remain distinct.
5. Lost wakeup acknowledgement becomes reconciled or unknown, never blind replay. Own replies/graph updates/receipts do not trigger wake loops.
6. Comment creation does not conflict with unrelated graph edits; relevant resource/graph CAS rejects genuine conflicts atomically. Queries meet receipt revisions or explicitly report projection pending.
7. A reviewer can read the colored diff with labels and keyboard controls, ask a grounded question, inspect the answer and explain the behavior in their own words. Record gaps rather than claiming comprehension from successful transport.

## Exclusions and current evidence

No general PR analysis, selected repository test runner, production deployment, hosting, API enrichment service or full visual polish. Source and evidence anchors must still be truthful. No implementation checks have run for this slice; all acceptance above remains unmet. After the feasibility gate, reconcile results here and refine the next slice before expanding scope.
