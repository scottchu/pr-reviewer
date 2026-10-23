# Slice 01 independent-review handoff

**Status:** Procedure ready; bind the actual candidate and reviewer at review dispatch

**Role:** Reviewer other than the implementer; read-only by default

**Parent:** [Slice plan](../plan.md)

## Inputs supplied at dispatch

Name the exact committed product-spec/plan revisions, implementation candidate commit/build, real PR/diff base/head, runtime/run instructions and evidence locations. Identify the reviewer and permitted checks. Those candidate results are produced by implementation; their absence before code is not an implementation-readiness blocker.

Read the [product story](../../../../../product/review-loop/README.md), [public/data/MCP contracts](../../../../../product/review-loop/contracts.md), [CLI direction and uncertainty](../../../../../product/review-loop/delivery.md), [React presentation](../../../../../product/review-loop/presentation.md), [test mapping](../execution.md), [selected source account](../bootstrap-task.md) and actual 01-A through 01-G evidence.

## Review questions

- Does the actual path preserve App → CLI → exact existing session and agent → MCP → authoritative persisted app state, without parsing stdout or creating a replacement participant?
- Are bootstrap scope, exact-session corroboration, single-use challenge consume, credential provisioning and revoke/generation checks implemented and negatively tested?
- Do short transactions atomically commit receipts/state/inbox while MCP during the same agent turn can progress?
- Can command retry/restart duplicate data or blindly redispatch an uncertain notification? Does a manually polled answer leave the original notification unknown unless its outcome is independently proven?
- Do source anchors retain pinned identity and actor/evidence attribution? Are candidate build and reviewed PR base/head separate?
- Is UI React-only, applying the design principles with accessible controls and centralized managed stream lifecycle, with business policy outside components?
- Do actual process/browser/host checks support the claimed scope? Are own-PR, independent review and human comprehension reported separately, including unrun cases?
- Is durable product knowledge complete enough to rederive accepted behavior without the old execution plan, and did slice 02 receive predecessor findings?

Inspect actual changes and reproduce appropriate checks within authorized scope, not merely the implementer's report. Return findings with source/evidence, severity and affected acceptance, checks performed, residual limits and accept/changes-needed/blocked disposition. Fixes change the candidate; require affected checks/review again. No historical architecture review or preparation experiment passes the new product candidate automatically.
