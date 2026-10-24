# Experiment: MCP delivery to the existing participant session

**Packet revision:** 1

**Date:** 2026-10-24

**Status:** Stage 1 source/fixture investigation complete; native Codex/Claude outcome INCONCLUSIVE. This experiment does not adopt production behavior.

**Parent:** [Slice 02](../plan.md); [steering correction](../codex-steer-correction.md)

**Base source:** 1e356446f9477325f0f93eea6bc0c0d670b2d5f0

## Question and accepted intent

Can MCP alone deliver a question notification into THE existing initiating Codex or Claude session and cause a meaningful MCP reply without CLI notification? Newer MCP does include subscription/listen mechanisms. The experiment must distinguish standard change notifications, host-specific model context delivery and automatic model execution. A fixture receiving a notification does not answer the native-host question.

The authoritative product constraints remain [participant adapters](../../../../../product/participant-adapters.md) and [delivery](../../../../../product/review-loop/delivery.md): exact initiating-session identity, durable addressed inbox, source reads and reply receipts remain authoritative; no replacement conversation. The current working queue path and pilot remain untouched.

## Implementation handoff v1

**Owner:** Root coordinates; codex_steer_delivery executes this bounded experiment without nested workers.

**Repository:** `/Users/scottchu/projects/personal/pr-reviewer`

**Task worktree:** `/tmp/pr-reviewer-mcp-listen-experiment`

**Branch:** `experiment-mcp-session-delivery`

**Editable scope:** This experiment directory only, containing plan, evidence and an optional isolated TypeScript protocol fixture. No production files, dependencies, lockfile, package manifest, native catalog, current session configuration, shared B1 files or other worktrees.

**Authority:** Source inspection and one bounded local fixture using existing SDK/runtime. No CLI notification, new conversation, owner write, app-server/daemon, webhook callback destination, install/upgrade, credential scan, settings change, reattachment or replay. Prior stdio connections are gone; do not treat their IDs as current connections. Root alone owns any later native probe authority and publication.

**Readiness:** Primary sources describe v1 resource subscription, v2 `subscriptions/listen`, plugin `events/subscribe`, and Claude channels as separate surfaces. Installed SDK is 1.32.2 with latest protocol 2025-11-25. No native PR Reviewer subscription/catalog connection is supplied. Native phase is blocked on a verified supported existing-session connection; independent source/fixture preparation is ready.

## Bounded sequence and effort cap

1. Fetch primary documentation and build a mechanism/host capability matrix in evidence.md. Inspect only declared SDK and current MCP public entry. No repeat proxy or daemon probes.
2. Commit this packet before any fixture. Optionally run one existing-SDK in-memory protocol fixture for resource subscription acknowledgement, IDs-only update handling, exact resource read, unsubscribe and teardown. This is a controlled SDK client, never a native host. Keep fixture in this directory; its declared entrypoint is `node --experimental-strip-types --test <experiment>/resource-subscription.test.ts`. Type-check it explicitly with existing strict TypeScript, no production compiler change.
3. Stop after one coherent source/fixture investigation, with a maximum two local correction runs if a fixture fails. Native tests are unrun unless root supplies the required connection and authority. Missing prerequisites yield INCONCLUSIVE, not FAIL or PASS for native delivery. No protocol emulation may be relabeled as newest-SDK or native acceptance.
4. Reconcile findings and committed exact candidate/evidence paths to root. Any later adoption requires its own product source decision and tested slice.

## Evidence ladder and criteria

| Gate | Required evidence | Pass / fail / inconclusive |
|---|---|---|
| E1 Protocol | Negotiated version/capabilities, subscription request and acknowledgement, correlated event receipt | Fixture can PASS only this bounded mechanism; unsupported negotiated version is recorded honestly. |
| E2 Client handling | Exact URI/event causes a client handler and authoritative read; no source instructions in hint; unsubscribe/close prevents further handling | Controlled client PASS is not native-host handling. |
| E3 Session/context | Independently corroborated exact existing initiating session and actual event visible to that session's model context | Missing native connection is INCONCLUSIVE; fixture identity is insufficient. |
| E4 Automatic reaction | Event causes model action without CLI, manual follow-up, resume, new session or substituted host | Native action must be causally tied to original event; receipt alone is insufficient. |
| E5 Meaningful reply | Native participant reads authoritative question/source and commits a relevant source-backed reply; persisted readback and duplicate protection | Overall native PASS requires E1-E5 on that host. No meaningful reply, after established supported delivery and bounded wait, is FAIL for that measured path. Missing readiness is INCONCLUSIVE. |
| E6 Lifecycle | Scoped authorization, revoke/unsubscribe/close, no replay or notification loop | A future native probe must include scope and teardown; fixture checks are separately labeled. |

An event delivery can pass E1 while E3-E5 remain unknown. Active-turn context append and idle automatic turn are distinct observations; test and label each separately. Codex and Claude outcomes never substitute for one another.

## Independent-review handoff v1

Root assigns a fresh reviewer, read-only against the exact committed experiment candidate/base and this packet. Confirm primary-source claims, installed-version limitations, fixture assertions and that no native claims exceed evidence. Inspect scope, teardown, lack of production changes and exact INCONCLUSIVE prerequisite. No native write or external callback is authorized for review. Return concrete findings, actual checks, limits and a conclusion for source/fixture quality separately from native feasibility. Product own-PR/graph-first and whole-product audit rules still apply to any actual delivery; this preparation is not slice acceptance.

## Required return

Committed plan/result heads, matrix and fixture commands/results, protocol versus native disposition, exact missing input and smallest supported next step. Preserve experiment data only as needed for root integration; no pilot/owner changes. Root owns PR/merge/publication and any later adoption.

## Stage 1 result

[Evidence and reproduction](evidence.md) records the primary-source matrix, one passing existing-SDK resource subscription fixture, strict TypeScript verification and the exact missing native connection. Protocol/client handling passed only in the controlled v1 fixture. Existing-session context delivery, automatic reaction and meaningful persisted reply remain INCONCLUSIVE. No production adoption, SDK upgrade or native session change occurred.
