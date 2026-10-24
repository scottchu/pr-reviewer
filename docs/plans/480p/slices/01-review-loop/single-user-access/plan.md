# Single-user access correction

**Date:** 2026-10-24

**Status:** Coordinator accepted SU-A–E for the bounded access change; graph presentation changes needed; retained-data deployment/live pilot pending

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

## Version 2 candidate and review input

**Implementation source:** 5cf0bc67f2db4d17c4653a55cc66493445e4b03a, against b096826e31c0927190806de91ed70b8b64aa93d8. The preceding docs-first packet is1f1aad1. Subsequent evidence-only documentation does not change the tested app/tests.

**Observed checks:** Strict TypeScript/subsystem boundaries passed; normal entrypoint47Bun+306Node tests passed; full actual Chrome/React25E2E passed on the frozen clean candidate. See [evidence and limitations](evidence.md).

**Independent review assignment input:** Use the exact candidate/base above and SU-A–E. Root supplies its PR head and actual graph-first task, assigns a fresh reviewer and freezes the UI account before source inspection. Read source docs runtime/contracts/import/semantic-storage/story/persistence policies and inspect changed public gateway/storage/application interfaces, source tests and actual clean-browser opening. Check preserved old jobs/credentials, explicit Bearer no-fallback, object-identity access checks, lifecycle/recovery fencing and network constraints. Reproduce with isolated ports/data, never the pilot. Report findings and actual limits.

**Successor reconciliation:** Updated480p02 and720p03/04/05 packets with the delivered owner-access interface, legacy-job semantics and remaining gates. Roadmap/round/current-delivery summaries now carry the accepted correction instead of scheduling a replacement login. These updates do not accept those slices.

## Version 3 coordinator acceptance receipt

**Date:** 2026-10-24

**Owner:** Root coordinator; this implementer records the supplied acceptance after reading the independent reports in full.

**Accepted scope:** SU-A–E for the single-owner access change on implementation source `5cf0bc67f2db4d17c4653a55cc66493445e4b03a`. Root accepts the bounded change using the 25 passing React E2E journeys, 47 Bun and 306 Node tests, independent engineering readiness and the actual credential-free own-PR read path. The separately reviewed SDK and B1 work are not part of this candidate. This receipt adds no product or test changes.

**Independent engineering:** READY in the assigned source/engineering scope, with no blocking correctness finding. The reviewer independently exercised focused storage/gateway/MCP/application checks, HTTP/SQLite restart, the affected runtime and strict boundaries. Its initial external runtime harness import errors were retained and a focused isolated-port rerun passed; they are not product findings.

**Own-PR understanding:** PR 25, snapshot `845d21e3cf8780248524faaa773ffa01fddf2e196022d165ffc379b97603b4e3`, against base `b096826e31c0927190806de91ed70b8b64aa93d8` and implementation head `5cf0bc67f2db4d17c4653a55cc66493445e4b03a`. Independent Account A froze before source/diff/key access. It identified the access purpose correctly but left retained-job and browser-recovery behavior uncertain. Account B resolved those points from pinned source before expected-key comparison and found no new blocking source issue. The source-corrected account is sufficient for this bounded access change; the corrections are not retroactive graph comprehension.

**Observed own-PR path:** Fresh reload required no token and logged no Authorization headers. Core review/import/story/context reads returned 200; the pinned identity, structural graph and source inspector were readable, and source-to-map return preserved the focused file. This is a scoped no-token read-path pass, not production retained-data migration or an error-free whole-page result.

**Open product limitations:** Graph cognitive burden remains CHANGES NEEDED: the flat scope, truncated snippets, absent behavioral edges and large diagnostics require substantial manual synthesis. Semantic preparation retained budget failures and no story was published. Account B observed `analysis_record_unavailable` and repeated analysis HTTP 400 responses; no causal connection to the access diff was established. Failed semantic-selection diagnosis and presentation improvements remain open for B2/next graph work; this receipt performs neither diagnosis nor repair and does not accept full graph comprehension or the whole 720p/native/human endpoint.

**Remaining delivery gates:** PR 25 was open as a draft at remote `a63293d` when root issued this receipt. Root owns final PR head reconciliation, supported merge and preserving-data deployment/live pilot verification. Production retained-data and existing private URL acceptance remain pending. Preserve the old `5cf0bc6` source/snapshot pin independently of later documentation commits. No push, deployment, new audit or new test run is performed by this closeout. See [report identities and evidence](evidence.md#coordinator-acceptance-and-independent-evidence).
