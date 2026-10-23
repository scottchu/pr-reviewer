# Product roadmap

**Status:** Accepted delivery direction; later slice details remain provisional

**Owner:** Project maintainer with the implementing agent

**Schedule:** Ordered outcomes; no dates committed

## Goal and current gap

Deliver the [vision](../vision.md): a reviewer can explain changed behavior, trace its consequences and justify a decision with evidence. The [high-level design](../architecture.md) defines system boundaries. The repository currently contains documentation only; there is no app, host integration, source-analysis pipeline or test runner to claim as implemented.

Build increasingly capable versions of a complete review journey. “480p → 720p → 1080p → 4K” describes fidelity and maturity, not screen resolution. Each round should work end to end and produce evidence that it improves understanding. A polished canvas alone does not unlock the next round.

## Progressive delivery

| Round | Outcome | Scope | Exit evidence | Status |
|---|---|---|---|---|
| [480p: one real review loop](slices/01-review-loop.md) | Understand one behavior and ask its responsible agent a question | One pinned real change, minimal source/context view, anchored comment, verified conversation attachment, MCP read/reply and durable command/inbox foundations | Exact native conversation reads the anchored context and replies; UI shows the persisted answer; duplicate/restart/stale/unknown/deadlock cases remain honest | Planned, not started |
| 720p: usable whole-PR MVP | Account for the entire change and trace its relevant neighborhood | One source language/framework, complete coverage ledger, behavior groups, React Flow relationships, before/after source nodes with colored diff, unchanged neighbors and related tests | Every changed hunk accounted for; caller/callee is evidenced or explicitly unresolved/leaf; reviewer can explore and return with stable selection | Provisional; depends on 480p, import and analysis contracts |
| 1080p: evidence-backed review | Investigate claims and refine the shared explanation | Agent enrichment with provenance/correction retention, configured test selection, actual source/environment evidence, cancellation and recovery | UI/CLI select the same targets/results; failure, cancellation race and unknown execution never become false passes; reviewer can challenge a claim using evidence | Provisional; depends on 720p and execution capability checks |
| 4K: mature review experience | Remain understandable under realistic complexity and use | Semantic zoom refinement, minimal synchronized player, mobile story/exploration, accessibility, performance and more representative PRs; expand language/host support incrementally | Measured usability/comprehension, real-device and screen-reader checks, restart/recovery and representative performance evidence meet agreed criteria | Provisional; depends on useful earlier rounds |

Roughness may reduce styling, supported languages, dataset size and optional automation. Identity, source provenance, permission checks, durable outcomes and explicit unknowns are required from the first relevant slice. Each round includes usable design-system controls; later polish does not postpone basic keyboard access or readable diff labels.

## Order, dependencies and boundaries

Start with the [480p slice](slices/01-review-loop.md), whose largest uncertainty is real-host attachment and wakeup. Bound that experiment before committing to extensive canvas work. If host delivery is unsupported, retain pending events, record the capability gap and stop direct-delivery claims; source/canvas work can continue under its own agreed scope.

After the loop, pin a representative PR and select one source language for whole-PR analysis. Then add trustworthy selected-test execution and richer enrichment. Larger datasets, additional languages, hosting and visual refinement follow demonstrated value rather than arriving as parallel speculative infrastructure.

Detail each later slice in its own document here when its prerequisites and scope are established. Link it back to this roadmap. Record scope, acceptance, test approach, current status, results and gaps in those documents, not .decompozr/. Current authorization is documentation only; roadmap items are not automatically authorized implementation.

## Acceptance across rounds

- A reviewer can explain purpose, behavior change, dependencies, unchanged context and evidence limits in their own words. Define representative tasks and success criteria before each round's evaluation; record comprehension failures as findings.
- All implemented code is tested; prefer TDD. End-to-end coverage includes actual decompozr/design-system integration and the relevant user/agent flow. Real-host acceptance is separate from adapter fixtures.
- Preserve actor/attachment/turn/job identity, action-specific concurrency, command deduplication, external invocation reconciliation and evidence boundaries from the high-level design.
- Keep plans and individual slices versioned. Every change reaches main through a PR. This planning task adds no application code, runtime, dependencies or deployment target.

## Deferred decisions and evidence

Host capabilities/transport/binding, the first source language, configured repository test targets and runtime destinations remain unverified implementation inputs. Prototype browser/test receipts are historical, not acceptance for this system. Decisions API, hosted agent runtime, broad multi-agent ownership, remote worker infrastructure and external PR posting remain deferred.
