# Canvas reference evidence and drift

**Inspection date:** 2026-10-24

**Status:** Read-only source and selected historical-image inspection; no live preview or new mockup acceptance

**Parent:** [Canvas correction packet](canvas-reading-mockup.md)

## Historical first-pass reference inventory

The inventory below records what the earlier pass had inspected; it is superseded where noted by the located ZIP/image readback below.

| Reference | What was actually inspected | What it establishes / limit |
|---|---|---|
| Retained Playground source | `/Users/scottchu/projects/decompozr/playground/experiments/pr-diff-teacher/docs/system-design.md` and `docs/interface-audit.md`; current Playground HEAD `5c0659d79a6ca89919a7d06af08b081b0380d0f5`, subtree clean | Historical canvas design explicitly calls for before-left/after-right nodes, unchanged context and progressive source detail. The document labels its Svelte proposal superseded; React is current authority. The evolving checkout is not assumed identical to original pinned `223073c353e45969e189504648d522f2f096147b`. |
| Preserved conversation export | `/Users/scottchu/.codex-workspaces/artifacts/pr-diff-teacher-2026-10-23/source-conversation-history.md`, relevant lines 790–933 | User requested graph groups containing before/after/tests, then asked for detail on zoom. The 2026-10-23 13:02 assistant response describes three mockups; the subsequent user response removes orientation/API-Helpers and says “i love it.” This supports the accepted interaction direction, not a verified pixel-exact choice among three image files. |
| Transfer reconciliation | Archive `context-supplement.md` and `receiver-context-readback.md` | Distinguishes older unified diff prototype from later before/after grouped canvas, semantic zoom, stable selection and slim player. It records external HTML/script/screenshot references but does not prove their contents or adoption. |
| Actual archived screenshots | Archive `three-graph-desktop.jpg` and `slim-player-desktop.png`, opened visually during this task | Show the older graph summary above a separate narrative/source-diff area, plus evolving player chrome. They are genuine historical reference images, not proof that in-node diff or semantic disclosure was implemented. No fresh runtime was launched. |
| Other retained artifacts | Archive file inventory and `preservation-manifest.json` include desktop/mobile/story/group screenshots and source fixtures | Existence is established; this task did not visually inspect every image, execute fixtures, or verify the old preview's availability. |
| Three later canvas mockup images | Mentioned in the exported conversation; no exact corresponding image filenames located in the inspected retained archive | Image content and pixel fidelity remain unknown. Do not claim no mockups ever existed, or reuse older screenshots as those three designs. The accepted interaction is independently explicit in the user's words. |

The private archive is `/Users/scottchu/.codex-workspaces/artifacts/pr-diff-teacher-2026-10-23`. It and retained Playground source were read-only. No retired worktree or former handoff path was accessed, even where historical documents name one. No reference attachment script or instruction was executed. Other attachment/share links are not required to establish the correction and were not opened here.

## Current-source comparison

Inspected PR Reviewer main: `e3b270e5f49a9215452b0b86702946043e979059`.

- `src/ui/semantic-graph.tsx`: fixed 560×205 summary nodes contain side/name/path, caller/callee summaries and Focus / Inspect body controls. React Flow zoom changes viewport; these nodes do not render source lines or progressive diff disclosure.
- `src/ui/semantic-panel.tsx`: inspection focuses `semantic-source-title`, scrolls `semantic-source` into view and renders a separate `semantic-inspector` section with a return control. This is source-level evidence of the navigation split, not a fresh screenshot audit of the deployed pilot.
- `docs/product/review-loop/presentation.md`: describes complete prepared documents in independently scrolling panes as the first implemented presentation.
- `docs/product/review-loop/semantic-graph.md` and `story-and-exploration.md`: preserve identity, exact-span inspection and return, but did not require source to stay inside graph nodes; the latter explicitly describes a source inspector.
- `docs/product/architecture.md`: already requires before-left/after-right source nodes and semantic zoom without loss of identity. Roadmap slice 05 excludes advanced semantic zoom and slice 09 lists semantic zoom without separating basic inline source reading from scale refinement.

The drift arose in the documented delivery decomposition and rendered source destination: the graph was accepted as an orientation surface while source reading was implemented elsewhere, and detail disclosure was left with later zoom work. Existing tests and bounded review accounts validate their recorded scope; they did not enforce the same-canvas requirement now made explicit. The user's “rough” assessment is recorded as product feedback; this read-only task does not manufacture a measured visual score or diagnose every stylistic issue.

## Correction and evidence boundary

[Canvas reading](../../../../product/review-loop/canvas-reading.md) now makes overview → focus → inline diff → neighbor → return one graph interaction. The mockup packet requires inspectable desktop/narrow states and layout feedback before production UI adoption. Preserve backend/source/authority/recovery work and historical receipts. Basic source detail belongs to current 04/05 correction; 4K adds scale/performance/refinement.

No new mockup, browser journey, host call, test run, product acceptance or deployment occurred. At that earlier pass, unlocated historical mockup files prevented claims of pixel-faithful restoration. The next author must show the concrete new preview instead of assuming reference familiarity establishes visual approval.


## Located original reference and UX reset

Date: 2026-10-24. Status: supplied-image/source dissection only; no new browser/runtime inspection.

The user-supplied original ZIP is now read: `/Users/scottchu/.codex-workspaces/artifacts/pr-diff-teacher-2026-10-23/pr-diff-teacher-mockup.zip`, SHA-256 `068710789c2f369e22ee4960754211dbf800b1c6ec6935375c90462b14dbc9ff`; 45 entries include source and five reference captures. Its README explicitly names the selected third generated concept. That exact existing PNG was located and viewed, along with all five archived captures and the user's rejected mobile screenshot. This does not prove that the selected older concept is one of the three later 2026-10-23 canvas variants; keep those reference generations distinct.

The [durable dissection](../../../../product/review-reference-dissection.md) records exact paths, source behaviors, limits and the [retained concept](../../../../product/references/selected-lesson-graph-diff.png). The PNG SHA-256 is `c80e90c774111022d981797d8664f28ec40d8a30c60f45cfd6899443b49997ce`; the retained copy is byte-identical. No browser-chrome/private-profile screenshot is copied into the repository.

The earlier work had not read this ZIP. Treating a functional 8474 mock with correct selection/return checks as visual continuation was not justified by that evidence. The user has now explicitly rejected its hierarchy. Preserve the functional receipts but supersede that preview as a UX target; the issue is meaningful explanation before operations, not just dark styling or replacing buttons with icons.

The [reviewer-experience specification](../../../../product/review-experience.md) begins with a source-grounded PR25 question and follows its actual request/header/unchanged-refresh evidence. It carries later same-canvas, contextual-comment, one-row-player and exact-return corrections. Replay timing remains an explicit original/current discrepancy for design review. The next gate is independent specification review, then an authorized inspectable mock; no further UI composition follows merely from functional success.


## October23 originals recovered: controlling correction

The prior located “selected third” PNG was the older October11 lesson concept named by the ZIP README. It was not one of the October23 change-canvas images. All three actual October23 originals are now directly viewed and retained with event timestamps/hashes in [the corrected durable dissection](../../../../product/review-reference-dissection.md): Behavior Atlas, Dependency Lens and Scope Microscope. No specific numbered choice among them is inferred. Later removal of orientation controls remains controlling; illustrative Ruby/MR/test content is not PR25 evidence.

The full transfer and supplement plus history785–1673 establish whole-PR spatial groups with both-side one-hop callers/callees, unchanged context, in-group source/explanation/tests and semantic zoom. These requirements were in the handoff. Earlier one-path acceptance failed to carry them into concrete scope. The8476 mock is rejected; earlier ready judgments and locked-pan limitations cannot establish product fit. [Whole-graph mockup packet v2](whole-pr-graph-mockup-v2.md) replaces the prior single-path scope after independent design review. No runtime/browser test occurred during this reference recovery.
