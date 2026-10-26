# Reading journey reflection and recovery

Date: 2026-10-26. Status: provisional reflection and concrete recovery plan; not product, milestone or round acceptance.
Scope: docs only. Product/test/runtime/configuration/data/native changes are frozen.

## Current truth and evidence boundaries

Current candidate is `7ce22b74cb22242732edbe070942a13439f476df`: author-tested callback aliases, **not independently accepted**. The last bounded independently reviewed dot-navigation checkpoint is `4ffa36c`, not whole-product acceptance. R30 source review stopped before its core diff with OS24. Partial actual desktop review read four aliases/explanation but a callsite for After268 appeared around After296–305; cause is unknown, phone and exact-source visibility are not passed. No repair is authorized by this reflection.

Normal local reads initially worked. The first reflection write command then failed before process creation with `Too many open files (os error 24)`; no file was claimed written. Existing supported Node filesystem access succeeded and was used for scoped documentation only. Revoked network permission is not reinstated by reflection. Earlier HTTP/render checks remain historical, not a current runtime claim.

A newly dispatched fresh docs-only auditor subsequently read durable docs and returned **no whole-product rebuild-readiness PASS**. Its earlier first-read OS24 failure covered zero documents and remains a separate failed attempt. Source-informed architecture review and history-derived visual retrospective are separate from that fresh audit.

| State | Current meaning |
| --- | --- |
| Accepted direction | Semantic graph/entities/typed relations/evidence first; UIUX is a later projection. Same file identities and explicit expansion; no random UI patches. |
| Accepted but not delivered as a new composition | Per-file persistent Diff/Change graph and nonmodal exact-change explanation directions. Mobile adjustable sheet remains a proposal. |
| Bounded prior evidence | Exact source/call facts, manual owner-operated real answer, nested/outer Return, wrapping and dot navigation have named checkpoint/task evidence. It is not universal preservation at the current pin. |
| Proposals | Libavoid/ELK probes, A/B/C in-file concepts and standalone semantic graph account. Prose narrative section was rejected. A diagram is an inspection projection, not adopted schema/UI. |
| Open | Dual floating control ownership; R30 unreviewed candidate/source visibility; prepared call/test input contract; stale durable norms; per-file graph persistence; compact own-path labels; full-goal/native/device/readiness gates. |

## Five systemic causes

### 1. We chose representations before settling meaning

“Caller/callee organization” became root function/version diagrams instead of the SAME file nodes connected by relationships. “Narrative across changes” became a purple prose section. “Graph first” became UI cards and toggles again. These were wrong abstraction choices, not missing polish. Existing ontology distinguished Change, occurrence, Claim/Evidence and projection, but it did not control the sequence.

Recovery: establish exact entities, comparison identities, typed assertions, provenance, basis and unknowns before drawing/layout. For review.ts, import binding is not a call; login→refresh→request is source-backed; Before/After comparison is not execution/edit order; recovery wording does not establish dependency. No UI shape may supply missing semantics. The graph account needs adoption before projection.

### 2. Independent state/composition owners accumulated

Freshly read current source: `main.tsx:1303` mounts WorkspaceActions; `:1460` separately mounts DiffControls. `workspace-actions.tsx` owns offset/drag/clamping; `file-diff.tsx:576–620` owns another draggable position. CSS positions one above the other on mobile. The commands differ in scope, but both independently own window chrome.

`functional-browser.spec.ts:34–51` is explicitly named “controls stay separate” and asserts their rectangles do not overlap. The test codified our wrong design assumption; it did not derive a coherent control model from a user task. “Preserved components” therefore did not mean preserved workflow.

Selected-file `projectCalls(selected)` also differs from persistent per-file graph state. Source anchors, active hunk, wrapped layout, camera intent and restore timing have different lifetimes. Public owner recovery is valid, but alone cannot prove the visible reader.

Recovery: declare global/file/change command scopes and ONE placement authority, without selecting replacement UI during reflection. Define one owner/lifetime for each state and one ordered integration contract for capture/restore. Keep the existing public Story authority and depth1 supporting checkpoint; do not invent a parallel return stack or rewrite them.

### 3. Local patch loops replaced model/scope decisions

Root-only requests spread into routing, controls, reader/panel geometry and return facets. Later explicit reader bugfixes were authorized and necessary; that does not justify earlier discretionary redesign. “Freeze everything else” lacked a checked allowlist/exception map and an assembled-screen preservation gate.

Hand-tuned routing optimized counts, label boxes and endpoints while the user still could not trace relations. Libavoid obstacle routing did not solve label coupling. ELK captures had renderer-coordinate/settling defects; those failures did not establish an algorithm limit. A compact four-file image did not validate all50 or phone/expanded states.

Recovery: one learning objective, explicit protected seams/negative examples, finite experiment and stop gate. A repeated same-kind perceptual/ownership failure returns to its contract, not another CSS/layout patch. This does not authorize a new library, backend or generalized rewrite.

### 4. Acceptance language exceeded observed evidence

DOM presence, counts, hashes, rectangle separation and readable first frames were repeatedly used as substitutes for traceability/comprehension. R26 had the correct citation but imports in view; R28 lost fourth-hunk selection after a late event; R30 has an unresolved visible-range observation. Correct metadata is not correct visible source.

Earlier unfamiliar-before-source desktop review did establish motivation/mechanism/evidence/real-answer understanding in its scope. Keep that achievement separate from source-informed reruns, author automation, static images, offscreen content, physical Safari and automatic native delivery. The SDK answer is real; manual relay is not native automatic notification.

Recovery: every claim names pin/task/viewport/input/motion state, observation and excluded states. A visible violation blocks affected acceptance despite engineering PASS. Read exact glyph/range + marker + Explain together, then manual handback and immediate-answer/original Return. Hash audits and counts support, but cannot replace, the task.

### 5. Feedback became append-only history instead of feed-forward guidance

Versioned packets retained corrections but did not consolidate active decisions/gaps/owners. Obsolete imperatives remained beside newer supersessions; readers had to reconstruct precedence. Feedback triggered another patch/screenshot rather than an objective, counterexample and predictive check. Mockup URLs and live implementation were not consistently distinguished. Repetitive progress reports and long solo loops obscured whether the endpoint was closer.

Recovery: feedback is ONE input alongside accepted requirements, source evidence and unknowns. Extract its scenario, rationale, desired behavior, scope, negative example and acceptance signal before planning. Do not turn one complaint into a universal invariant. Edit conflicting active contracts, not merely append a register link.

## Accountability

Root owns scope, sequencing, dispatch readiness, freeze/exception decisions and claim accuracy. Root repeatedly translated semantic intent into UI too early, accepted sequential local fixes without reconciling the outcome, reported bounded checks as broadly “fixed/verified,” and allowed excessive updates/solo geometry loops. This cannot be blamed on the executor or changing user requests. The executor owns implementation choices, truthful failures and exact scope/status. Reviewers own stated evidence boundaries; unobserved states cannot be accepted. The user should not have had to rediscover these mismatches.

## Fresh audit findings that block recovery readiness

1. Durable prepared call/test projection inputs are underspecified: packet provenance/counts/seed/mapping references do not define reproducible membership/selection and test-summary inputs. This is a Stage1 contract gap, not permission to copy fixtures/code into docs or invent a general importer.
2. Active norms conflict: canvas-reading zoom disclosure, canvas-panels source-page magnification, older horizontal/x-offset/dashed-port text and architecture semantic zoom contradict latest explicit expansion/wrap/direct-arrow/page-gesture decisions. Reconcile responsible paragraphs before projection.
3. `presentation.md` calls selection/draft local state, while public Review/Story owners retain authoritative cursor/drafts. Clarify renderer transient selection versus public command state; do not move business ownership.

The audit's bounded inventory/truncation limits remain; native/device observations not run are not specification defects. Fresh whole-product reassessment is still required after material corrections.

## Frozen/allowed matrix

| Boundary | Frozen now | Allowed now | Gate before later work |
| --- | --- | --- | --- |
| Product/tests | Candidate7ce22b7; no fixes, new tests or rollback | Read existing facts, record divergence | Relevant semantic/projection packet and authorization |
| Identity/data | Snapshot, canonical calls/anchors/offsets, actors/attachments/questions/reply | Document provenance/unknowns | Exact identity review; no guessed pairing/causation |
| Reader/camera/Return | Source bytes/lines, wrapping, explicit expansion, existing owner-first/nested return | Record observed defects/limits | Named state owners, exact visible task and failed-return checks |
| Controls/projection | No new bar/panel/card/toggle/routing patch | Define scopes/owners/alternatives | Adopted projection brief with full-window negative examples |
| Runtime/native | No restart, route/install/config/session/business writes | Preserve previous evidence; obey access limits | Separate authorization/supported access; no reflection inference |
| Docs/model | Accepted/proposed/observed/blocked stay distinct | Reflection, recovery sequence, first semantic slice, unambiguous stale-text correction | Independent model review and fresh docs reassessment; blocked is not PASS |

## Decisions, owners and measurable gates

The [round recovery sequence](../../../plan.md#reading-journey-recovery-graph-first-2026-10-26) and [first semantic slice](../semantic-graph-recovery.md) define stages0–5.

- Root: exact status/decision ledger and freeze exceptions; do not dispatch a future implementation from this reflection.
- Model executor: exact IDs/typed relations/evidence/basis/unknowns; all four review.ts changes have dispositions, including unprepared parts. No edge merely to make a connected picture.
- Independent model reviewer: answer for each representative edge “what identities/sides, relation meaning, evidence and uncertainty?” Distinguish binding/call/dataflow/comparison/reference/inference without relying on color.
- Projection owner, only after graph gates: specify global/file/change commands and selected Change/per-file view/scroll/folds/mode/camera/focus/public Return ownership. One authoritative order, no duplicate floating placement responsibility.
- Sole implementer, only after adopted projection: one bounded integrated slice and exact allowlist; preserve canonical data and owners.
- Independent acceptance: frozen pin/build, ordinary task/settled glyphs, marker/Explain agreement, dense middle/lower trace, full-window controls, exact immediate-answer then original Return, failed/stale behavior. Separate engineering, source, actual task, unfamiliar understanding and physical-device evidence.
- Stop rule: repeated same-kind visible/ownership failure or unresolved semantic identity stops dependent patches. Retain RED and return to the responsible contract. Updates report a milestone/failure/decision, not a stream of commands.

## Evidence limits

Fresh executor reads: Git pin/status, rules, control mounts/components/CSS, wrong nonoverlap assertion, current docs/packet. Source reviewer read code via ordinary local access/Node filesystem before OS24; its five findings are code-informed, not R30 acceptance. Visual retrospective is history-derived because process creation failed; no new live audit.

Historical evidence remains under `reading-journey-v1.md`: R23 traceability; R24/R25 library/projection failures; R26 source focus; R28 selected-hunk mismatch; unfamiliar account/R22; real answer and R19–21 Return. Do not rerun or promote them during this docs-only task. This report is a recovery contract, not closure of the product, original goal or round.
