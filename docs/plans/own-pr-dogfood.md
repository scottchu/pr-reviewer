# Dogfood every slice on our own PR

**Requirement status:** Accepted: every product slice must be dogfoodable using our own PR

**Execution status:** No product slice or dogfood session has run

**Parent:** [Product roadmap](roadmap.md)

**Owner:** Implementing agent runs and records dogfood; maintainer resolves missing product inputs and acceptance gaps

## Acceptance gate

Each product slice must expose its new user action in a runnable candidate and exercise that action on a real PR in this repository. Prefer the slice's own implementation PR; an already existing project PR is eligible only when its pinned change actually exercises the slice's stated task. Record the choice and reason. An unrelated sample repository, synthetic diff, adapter fixture or a plan to dogfood later does not satisfy this requirement.

Every roadmap row has an own-PR task. Before implementing that slice, refine the task against an identified existing PR or the planned task branch/PR, and state what actual change will exercise it. The final acceptance run requires a real PR URL and immutable base/head objects. If the needed condition is absent, record the prerequisite as unmet and select a suitable own PR or revise the slice scope with the maintainer. Do not claim an exception, manufacture fake provenance or accept the slice without the task.

The candidate must complete the task through its real UI and supported adapters, using actual decompozr/design-system integration. Record observations, evidence, failures and unresolved gaps. A passing same-agent run establishes scoped self-use; it does not establish unfamiliar-reviewer comprehension, native/device acceptance outside the exercised environment or broad reliability.

## Bootstrap and source identity

The repository is documentation-only today. [Probe 00](probes/00-host-contract.md) is host feasibility, not product delivery or product dogfood, and needs no PR. There is no claim that the current repository can review itself yet.

Slice 01 introduces the first runnable candidate. It may consume a manually acquired, verified snapshot of its own actual PR, including a changed-document passage that explains the implemented behavior if that is the selected question. Pin the actual comparison baseline/head, preserve before/after content and make the question answerable from those sources. Manual acquisition is an explicit bootstrap input, not an implemented importer. Changed documentation cannot establish unsupported code analysis or repository test execution. Slice 03 replaces manual acquisition with the product import journey.

Always distinguish:

- **Candidate identity:** application source commit, build/artifact identity, actual runtime version/environment and any dirty content. A task-branch candidate is a test build, not a deployed release. Prefer a clean committed candidate; record deviations rather than hiding them.
- **Reviewed target identity:** own PR URL/number, pinned head, actual comparison baseline, snapshot identifier and immutable source anchors. This may equal the candidate's source commit, but the two roles must still be recorded separately.

Running a candidate built from the PR head to inspect that same PR is valid self-use when these identities are explicit. The already built candidate reads the immutable target; it does not need a merged product to review the first slice. This grants no installation/deployment authority. Test execution slices use separate target worktrees and bounded configured tests; they must not recursively launch the active dogfood harness or mutate the running candidate.

## Evidence record per slice

Add this compact record to the individual slice document before claiming acceptance:

| Field | Required content |
|---|---|
| Task | Concrete reviewer action from that slice's roadmap row, expected visible result and pass condition declared before the run. |
| Own PR | Real project PR link, actual baseline/head hashes, snapshot and relevant anchors; why this change exercises the task. |
| Candidate | Source/build/runtime identity, dirty-state disclosure, environment and supported host binding where relevant. |
| Acquisition | Product import or manual source preparation, with provenance and explicit capability limits. |
| Observed result | What the user/agent actually did and saw, authoritative readbacks, commands and artifact references; no fixture substitution. |
| Gaps and disposition | Pass, fail or unrun/inconclusive; failures, unknown effects, missing criteria and the responsible next action. |
| Revalidation | Any changed candidate or target identities, affected checks rerun and remaining limits. |

Pass requires the new user action to succeed on the recorded real own PR with the expected visible outcome, correct source/actor/evidence attribution and all slice-specific correctness checks satisfied. A blocked host, missing source, unresolved correctness failure or absent own-PR task remains unmet acceptance. Required unfamiliar-reviewer evaluation remains a separate gate even after dogfood passes.

If a fix changes the candidate source or reviewed PR head, record a new identity/snapshot and rerun the affected own-PR task and relevant regression checks before accepting that candidate. Earlier evidence remains historical. A later documentation-only commit recording evidence must also be identified as a different head: either keep the acceptance explicitly bounded to the previously pinned product candidate or perform the relevant checks on the new target; never silently label old evidence as a run against the latest head.

## Current gaps and next action

No own-PR target, candidate build, source snapshot or dogfood evidence is selected for slice 01. Resolve its planned PR/task and provenance inputs alongside the [comprehension packet](comprehension.md). Later slices must establish their own qualifying PR/task before implementation; extra representative datasets may supplement, but cannot replace, each slice's own-PR run.
