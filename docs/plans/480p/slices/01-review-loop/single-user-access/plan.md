# Single-user access correction

**Date:** 2026-10-24

**Status:** Accepted intent; implementation and verification pending

**Parent:** [Review-loop slice](../plan.md)

## Accepted correction and gap

PR Reviewer is the owner's single-user local/Tailscale tool. Opening its existing URL must load retained review, snapshot history and graph immediately. The current manual token form and runtime credential instructions contradict that outcome. Remove human login and credential entry; do not replace them with passkeys or another authentication ceremony.

The gateway derives an explicit `local-user` principal for credential-free owner requests. This is local composition policy, not a claim that Tailscale supplies application identity. Explicit bootstrap/agent Bearer requests retain their scoped credentials, exact initiating session, attachment and generation checks. Keep loopback listeners, exact allowed Host, existing private Serve HTTPS8472 mapping and no Funnel unchanged. Preserve stored reviews, credentials, receipts and source.

## Version 1 implementation handoff

**Owner:** remove_manual_access_token implementer, coordinated by root.

**Source base:** b096826e31c0927190806de91ed70b8b64aa93d8.

**Workspace:** `/tmp/pr-reviewer-single-user-access`, branch `remove-manual-access-token`.

**Scope:** Gateway, bounded storage access adaptation, React/application opening and request wiring, runtime/pair/admission/capture utilities, affected docs and tests. No SDK/dependency/lock changes, B1 work, pilot runtime, network configuration or GitHub writes.

**Approach:** Update durable access specification first; demonstrate credential-free API and browser failures; compile the gateway/storage policy and browser lifecycle; test commands/readback/reload/history and retained agent fences. Keep private recovery scoped to the local owner and origin; legacy unresolved records remain preserved and clearly require reconciliation if their old credential scope cannot be established automatically.

| ID | Acceptance | Evidence |
|---|---|---|
| SU-A | No token field/login/logout or credential paste; clean browser opens retained graph/history | Real React E2E |
| SU-B | Normal owner reads and commands need no Bearer; persisted command survives reload | HTTP tests and React E2E |
| SU-C | Explicit agent/bootstrap identities retain attachment/generation checks | Gateway/storage/MCP regression suites |
| SU-D | Existing network and stored-data boundaries remain intact | Runtime/Host checks and source review |
| SU-E | Runtime and owner utilities do not require local-user credential files | Runtime and utility regression checks |

Stop affected work for a concrete conflicting requirement, network permission revocation or missing required input; report exact evidence. No live pilot/deployment is authorized to this implementer.

## Version 1 independent-review handoff

**Owner:** Root assigns a fresh reviewer other than the implementer after candidate commit.

**Scope:** Read-only candidate against the exact base above; review SU-A–E, durable [runtime specification](../../../../../product/review-loop/runtime.md), gateway principal derivation, storage authority, recovery/lifecycle fences and actual React journey. Root supplies candidate commit/build and implementer checks. Form and freeze the account through actual UI/graph before inspecting diff, following graph-first-review.

**Required return:** Findings with severity/source/evidence, reproduced checks and limits; pass/changes-needed/blocked. Own-PR dogfood, independent review, PR delivery and live deployment remain root-owned gates; implementer checks do not establish those gates.
