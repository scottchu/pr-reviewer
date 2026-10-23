# 480p evaluation packet

**Status:** First source task and prospective criterion selected; product/human evaluation not run

**Parent:** [480p plan](plan.md)

**Rule:** [Comprehension evaluation](../../rules/comprehension.md)

## Selected first task

Use [PR 14 and its fixed before/after source](slices/01-review-loop/bootstrap-task.md). Baseline, head, path/spans, concrete question, expected account and evidence limit are specified there. The implementing agent owns own-PR task selection; this is not waiting for a maintainer to pick a repository or example.

## Prospective criterion

Use the shared five dimensions (purpose, before/after, consequence/context, source trace and uncertainty), score 0–2 each, and require 2 in every dimension with no unsupported substantive claim. Use up to ten minutes for inspection/question and five minutes for explanation/source trace, without implementer coaching. The source-backed account is checked by independent source review before grading.

A human unfamiliar with the selected change supplies the human-use result after a runnable candidate exists. If no such reviewer is available, report human evaluation unrun and keep that acceptance open; do not block all implementation on naming a person now or relabel agent self-checks as human comprehension. Agent review, engineering tests and own-PR dogfood remain distinct.

## Inputs at execution time

Record actual candidate/build and target identities, reviewer familiarity/assistance, conditions, answer/source trace, scores, wrong claims, obstacles and disposition. These observations cannot exist before implementation. Slice 02 extends the task prospectively to distinguish the original snapshot from a new pinned head; later rounds add only their relevant conditions.

The first implementation can proceed from the selected task and criterion. No completed product E2E, own-PR product run or human understanding result is claimed by this packet.
