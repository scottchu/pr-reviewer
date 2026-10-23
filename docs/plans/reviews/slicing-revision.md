# Progressive slicing revision

**Date:** 2026-10-23

**Status:** Independent documentation re-review passed; no material remaining findings

**Scope:** Planning and necessary architecture cross-references only

**Authority:** [Documentation-as-source contract](../../README.md)

## Findings and resolution

| Finding in the previous plan | Revision | Remaining evidence / decision |
|---|---|---|
| Each round was one broad scope, with no independently testable slices inside it. | [Roadmap](../roadmap.md) gives ordered inventories in all four rounds. Each row has a user outcome, predecessor/input, included/excluded scope and observable E2E plus supporting checks. A traceability table maps vision/design requirements to first delivery and refinement. | Later rows are provisional; individual contracts are written only when dependencies establish their scope. No implemented outcome is claimed. |
| The host feasibility gate required almost the entire UI/domain/MCP product path. | [Probe 00](../probes/00-host-contract.md) tests verified host binding, real MCP use and invocation deduplication/reconciliation using a diagnostic resource and minimal journal only. Explicit pass/fail/inconclusive consequences gate slice 01. | Actual host, access and probe destination are unresolved. The experiment has not run; API descriptions and mocks cannot pass it. |
| Graph CAS and real independent jobs enlarged the first comment/reply path. | [Slice 01](../slices/01-review-loop.md) retains immutable anchors, apply-time auth/generation, dedup, real own-turn progress and authoritative answer readback. First real independent-job evidence is assigned to slice 03; graph-writing/CAS evidence to 04; repository execution/cancel evidence to 06. | Those architectural constraints are preserved and remain untested until their feature exists. Slow adapters provide only scoped lock/fault evidence. |
| Comprehension criteria could be defined after presentation implementation. | [Comprehension protocol](../comprehension.md) requires a concrete trigger, evidence-backed expected before/after account, consequence, source trace and uncertainty before implementation. It proposes a rubric and session, treats wrong/unsupported claims as failure and separates unfamiliar-reviewer evidence from implementer self-check. | The exact PR, answer key, reviewer, threshold and conditions are not supplied or accepted. Owners and impact are explicit pre-implementation gates. |
| Accepted requirement added during this revision: every slice must be dogfoodable using our own PR. | [Dogfood contract](../own-pr-dogfood.md) applies to every product slice; each inventory row names its own-PR task. Candidate source/build and reviewed baseline/head are separate identities, with observations/gaps/pass criteria and revalidation after fixes. First-slice manual acquisition has explicit provenance and capability limits. | No runnable candidate or own-PR dogfood exists yet. The host probe is feasibility, not product dogfood; same-agent self-use cannot establish unfamiliar-reviewer comprehension. Required own-PR conditions remain prerequisites, never silently waived. |

## Preserved boundaries

The [architecture](../../architecture.md) still requires user/agent shared permitted actions, durable ingress for all domain writes, authorized read-model queries, short atomic dispatch, independent jobs, turn-only serialization, verified attachment identity and apply-time authorization/generation. Command/job/cancel and invocation/command identities remain distinct. Unknown launches are not blindly retried; durable inbox wake eligibility, immutable anchors, action-specific concurrency and receipt-aware reads remain required at first use.

This revision adds no runtime, dependencies, generated code, implementation authorization or deployment target. The Playground prototype and runtime artifacts remain unchanged. Basic keyboard access and truthful labels belong to the first presentation; later accessibility/device work does not excuse them.

## Documentation verification

Local verification passed: 56 local Markdown links/fragments across 12 repository Markdown files; 12 inventory rows across four rounds, each with outcome/dependency/scope/test fields and an own-PR task; changed-file scope limited to plans and architecture cross-references; and `git diff --check`. Readback confirmed the smaller probe, explicit unresolved inputs and first relevant job/graph acceptance boundaries. No `.decompozr/` or runtime artifact was created. These checks establish document consistency only. Host probe, application tests, native delivery, real-process execution, device use and human comprehension are all unrun.

The next safe action is to resolve host/probe inputs and the selected-change evaluation packet in documentation. Probe execution requires its bounded authority; slice 01 requires a passing probe, the predeclared comprehension contract and implementation scope. The revision does not turn an unresolved material choice into an accepted default.

## Independent re-review outcome

An Astra medium independent reviewer accepted the revised documentation at commit 9045d453449c7609d26246ff6eaf3d94883f5321. The slicing revision was authored by Astra high as requested. The reviewer confirmed all four original findings resolved: internal vertical slices in every round, a genuinely smaller host probe, first-slice job/graph scope corrected, and comprehension criteria fixed before presentation implementation.

The reviewer also found the own-PR contract workable: manual verified bootstrap avoids requiring a merged product, candidate and target identities stay distinct, each slice has an actual own-PR task, and evidence-only commits do not force an endless latest-head retest loop. Required real target conditions remain visible prerequisites. No material remaining documentation findings were reported. The additional AGENTS reminder restates the same reviewed dogfood requirement.

This is acceptance of the plan, not implementation or product acceptance. Host, product, device, dogfood and comprehension tests remain unrun. The next bounded action is to resolve the concrete host/conversation, probe target/scope and first qualifying PR/evaluation packet in the relevant source documents. Probe execution and product implementation still require their documented readiness inputs and task scope.
