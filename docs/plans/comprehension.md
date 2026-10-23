# Comprehension acceptance before presentation

**Status:** Protocol proposed; real change, expected account, evaluator and threshold unresolved

**Parent:** [Product roadmap](roadmap.md)

**Owner:** Maintainer selects the evaluation scope and accepts the criterion; implementing agent prepares source evidence; an unfamiliar reviewer supplies human-use evidence

## Gate and purpose

The [vision](../vision.md) asks whether a reviewer understands changed behavior and the basis for a decision. Before implementing a slice's presentation, record its representative task, source-backed expected account and pass/fail criterion. Defining success after seeing the UI would allow the presentation to redefine the goal.

The following defaults are concrete proposals, not accepted user choices. Resolve them for slice 01 before its implementation. The host-only probe needs no UI or comprehension evaluation and can proceed independently once authorized. Later slices extend the same protocol with their new outcome before dependent presentation work; they do not retroactively change an earlier result.

## Proposed first task and evidence packet

Choose one small real PR with an identifiable behavior change, available comparison baseline/head, one meaningful unchanged consumer or dependency, and at least one inspectable source-backed consequence. Prefer our own qualifying slice PR so this packet can support both the mandatory [own-PR dogfood task](own-pr-dogfood.md) and the separate unfamiliar-reviewer session. Supplemental PRs may help evaluation but do not replace own-PR dogfood. Prefer a change whose expected account fits one page. This profile is not a selected PR. Missing context must be recorded rather than fabricated to satisfy the profile. A first-slice changed-document task may use a behavior claim and its unchanged context, with an explicit limit that document intent is not verified code behavior.

Representative question: **“For the selected input or trigger, what happened before, what happens after, who or what is affected, and which source or evidence supports that account? What still cannot be concluded?”** After viewing the change, the reviewer asks the responsible agent one anchored question and includes the answer's evidence and limits in their account.

Before implementation, populate a small packet in the slice document or a linked tracked document with:

1. Repository/PR identity, actual comparison baseline and head commits, immutable snapshot/side/path/span anchors and the chosen concrete input/trigger.
2. The expected before result and after result for that trigger; why the change exists, distinguishing supplied intent from interpretation; one relevant consequence and unchanged context.
3. Source anchors or recorded execution evidence supporting each expected claim. Test source alone establishes presence, not passing behavior. Mark ambiguous or missing evidence explicitly.
4. At least one limitation the reviewer should recognize, such as an unresolved relationship or an unexecuted test; the account must not invent certainty.
5. The exact reviewer task, permitted context, time budget, rubric, chosen threshold and evaluator. A source-informed maintainer/reviewer checks the expected account before it becomes the answer key; the agent's generated explanation is not its own ground truth.

The exact expected account is currently **absent because no PR/trigger is selected**. That is an explicit pre-implementation gap, not a passing generic answer key.

Avoid making the first implementation depend on its own not-yet-existing final PR head: select an existing own PR, including a source-backed documentation change, for the pre-implementation packet. The eventual own-PR dogfood run may use that same qualifying PR or the new slice PR. For a new target, record its exact expected account before the run and before any presentation revision driven by it; do not grade against an answer invented after observing the result.

## Proposed rubric and session

Score each dimension 0 (missing/wrong), 1 (partially correct but incomplete) or 2 (correct with the requested concrete detail).

| Dimension | Evidence for score 2 |
|---|---|
| Purpose | Explains the problem and separates documented intent from an inference. |
| Before/after behavior | Correctly describes both results for the selected input/trigger. |
| Consequence and context | Identifies the relevant affected consumer/dependency and what remains unchanged. |
| Source trace | Opens the immutable evidence for the core behavior and consequence; does not merely repeat narration. |
| Uncertainty | States the selected limitation and distinguishes source facts, interpretation and actual execution. |

**Proposed first-slice threshold:** 2 in all five dimensions, with no unsupported or incorrect substantive claim. A confidently wrong behavioral claim, fabricated source connection or “test passed” claim without execution evidence fails regardless of total score. Missing an expected detail is scored as missing; plausible prose cannot substitute for evidence. The maintainer may accept a different explicit threshold before implementation; no threshold is assumed accepted here.

**Proposed session:** One reviewer unfamiliar with the selected change, up to ten minutes to inspect it and ask the anchored question, followed by a five-minute explanation and source trace without implementer coaching. One participant is a formative check on this change, not evidence of general product efficacy. Record familiarity, assistance, time, answer, source trace, dimension scores, wrong claims and usability obstacles. If there is no unfamiliar reviewer, record that evaluation as unrun; an implementer walkthrough does not fill it.

Run an implementer self-check first to catch broken presentation and a faulty answer key. Report it separately from automated E2E and the unfamiliar-reviewer session. Same-agent own-PR dogfood is required per slice, but cannot substitute for the unfamiliar-reviewer session. Transport success, screenshots, test counts and implementer confidence never establish human comprehension. If the expected account is disputed, resolve its evidence before grading the reviewer. A failed evaluation produces a documented finding and bounded revision/retest; it does not silently lower the criterion.

## Extension by round

| Round | Additional task, defined before relevant presentation | Evidence to add |
|---|---|---|
| 480p / 01–02 | Explain one behavior using the reply; after a source update, identify which snapshot the previous answer concerns. | First packet and distinct historical/new source anchors. |
| 720p / 03–05 | Account for supporting files, trace an unchanged neighbor and return from exploration without losing the question. | Expected coverage dispositions and confirmed/unresolved relationship examples; a short whole-PR account. |
| 1080p / 06–08 | Challenge one claim using execution/comparison evidence and explain what a retained correction changes. | Actual source/environment/result provenance; expected evidence limits and correction history. |
| 4K / 09–12 | Complete the same reasoning task on a denser PR, phone/assistive setup, after interruption or in one selected additional context. | Predeclared task, accessibility, recovery and latency budgets for the selected conditions; separate human/device/engineering evidence. |

## Decisions required and impact

| Decision / current status | Owner | Blocks |
|---|---|---|
| Exact PR, baseline/head, source span and input/trigger: unselected | Maintainer, with agent evidence preparation | First expected account and slice 01 implementation. |
| Evidence-backed answer key: unwritten/unreviewed | Implementing agent drafts; source-informed maintainer/reviewer checks | Meaningful grading and presentation implementation. |
| Unfamiliar reviewer, permitted assistance and session conditions: proposed only | Maintainer | Evaluation plan readiness; no human acceptance can be claimed without the session. |
| Rubric threshold and time budget: proposed only | Maintainer | Slice 01 implementation readiness; later changes require an explicit prospective revision. |
| Later dataset/device/budgets and extension target: unselected | Maintainer | Only the relevant later slice; not the host probe. |

No comprehension session or product E2E has run. The next ready action is to select the first change and complete this packet in source docs; do not implement a presentation against an undefined expected account.
