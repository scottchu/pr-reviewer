# Current canvas design and retained preview goals

Date: 2026-10-29.
Scope: reconciliation of older design/preview proposals with the current minimum graph entry. This register resolves precedence; it does not replace the detailed contracts or establish whole-product acceptance.
Source baseline: main `2598a8006a385fb09b529d4cc6427a021b313c8a`.

## Current entry and responsibilities

The current entry is the minimum review header and semantic graph. The [protected invariants](../protected-invariants.md), latest corrections in the [workspace contract](../pr-file-tree-first.md), [source pipeline](../source-pipeline.md) and [viewport presentation](../viewport-scene.md) own the detailed behavior. Earlier layout directions in those documents remain historical where a later correction supersedes them.

- PR identity is leftmost; documents are above code; related repository paths stay adjacent with directory-depth indentation; test files occupy the rightmost lane.
- Compact Function/Test groups expose source changes explicitly. Document comparisons retain Before and After. Change means evidenced additions and removals in the displayed scope; addition-only, removal-only, unchanged and unresolved evidence remain distinct. Temporal Before/After witnesses alone do not imply removal/addition. Relationships carry explanations and symmetric source provenance where available. Source membership is not execution evidence.
- A draggable, icon-only floating toolbar exposes the stateful changes-only filter, with hover and accessible names. Its limited direct context is a presentation choice, never deletion or reclassification of canonical facts. Local camera, reader and gesture state remain UI responsibilities.
- Domain Service owns semantic policy and evidence. Experience Service coordinates use cases through public capabilities. Deterministic UI Projection produces named UI Types consumed by React; UI may own local interaction state. The read → parse → extraction → attributed enrichment pipeline keeps source facts separate from inferred meaning. Viewport worker selection and lazy source preparation optimize presentation without changing extraction or comparison truth.

These are bounded delivered source capabilities. Earlier engineering checks and endpoint receipts do not establish unfamiliar-reviewer understanding, physical-phone readability or complete native participant acceptance. This reconciliation changes documentation only; it neither rebuilds nor deploys the application. It makes no new live-journey claim.

## Retained goals and open integration

The enduring journey remains: understand motivation → inspect system Before/After → follow exact source evidence inside the same spatial review → ask an anchored question → return to the prior reading context. Stable comparison/source identity, attributed claims, independent drafts, exact return state and honest failure/unknown states survive the retirement of old PRs.

| Area | Retained requirement | Current boundary |
|---|---|---|
| Source reading | Explicit overview/detail/context navigation; connected source/diff; exact commit/path/range; camera gestures do not invent disclosure | Current compact source disclosures are retained. The complete older canvas proposal is not automatically accepted or delivered. |
| Story and exploration | Preserve cursor, selected source, draft and nested Return/Resume checkpoints | Older application capabilities and evidence remain documented; complete integration into the current minimum entry requires its own scoped delivery and checks. |
| Discussion | Distinguish source and prose anchors, show exact author/version and honest command/delivery state; preserve unsent drafts | Existing anchored-question/reply capabilities are retained. Old preview conversation controls and memory-only prose comments do not establish durable production prose persistence or current-entry integration. |
| Participants | Attach the initiating existing session; distinguish notification, turn start and meaningful answer | SDK transport compatibility is present. Native attachment, automatic wake/steering and meaningful replies require independent host evidence; no simulated preview supplies it. |
| Import/history | Preserve immutable source identities and actual admission/job/history outcomes | Existing domain/runtime capabilities remain. Preview jobs and current-entry controls require separate integration evidence, not a claim that all import backends are absent. |
| Tests | Separate declared test source from qualification, execution and exact-head results | Existing execution contracts remain. Preview runs/results are simulations; current-entry integration needs real attributable outcomes. |
| Reading quality | An unfamiliar reviewer can explain change, evidence, uncertainty and next question | Full journey understanding and physical-device acceptance remain open. The October 23 original references were subsequently recovered and directly viewed; the [reference evidence](../../plans/720p/slices/05-explanation-exploration/canvas-reference-evidence.md) preserves that correction rather than reopening the earlier missing-image gap. |

## Earlier composition and preview status

The October 24 panel composition and separate subsystem scenarios remain design history and retained wider-product goals. Default-open left context, right explanation, bottom conversation, scenario switching and a full connected preview are not instructions to restore panels in the current minimum entry. Any such integration needs an adopted slice preserving the current semantic/interaction contracts. Source activation remains explicit; zoom alone is not authority to open a reader.

[Canvas reading](canvas-reading.md), [comments](canvas-comments.md) and [panels](canvas-panels.md) retain their identity, evidence, draft and return requirements. Their older composition statements are subject to this current-entry boundary. The [subsystem preview record](../../plans/720p/slices/05-explanation-exploration/subsystem-preview-handoff-v1.md) describes historical fixtures, not an active production deployment or accepted UI.

The [PR reconciliation receipt](../../plans/720p/slices/05-explanation-exploration/pr-reconciliation/plan.md) pins the retired proposals, exact coverage checks, preserved preview source and remaining gates. Closing them does not mean merging the old preview or completing these goals.
