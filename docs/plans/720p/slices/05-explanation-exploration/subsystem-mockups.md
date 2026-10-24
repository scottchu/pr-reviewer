# Separate subsystem mockups, one review canvas

**Decision date:** 2026-10-24

**Direction:** Accepted user request: design each user-facing system through a separate inspectable interactive mockup

**Status:** Canvas preview dispatched separately; other packets below are staged design scope, not completed mockups or production changes

**Parent:** [Slice 05 correction](canvas-reading-mockup.md), [720p plan](../../plan.md)

**Owner:** Coordinator assigns one writer per preview and reconciles integration; subsystem mockup authors preserve public boundaries

## One product model, separate inspectable scenarios

The separation is for focused design inspection, not disconnected production pages. Each preview exposes one coherent user task, with visible initial/loading/empty/success/unknown/error states relevant to that task, and returns to the same persistent canvas. Reuse the same content identities and state vocabulary wherever scenarios join. A scenario picker or separate preview URL is acceptable for inspecting a mockup; it does not define the production navigation architecture.

The groups below follow existing product responsibilities. Canvas/source uses presentation plus source/analysis projections; story uses the application story/frame owner; discussion uses review-domain and participant-delivery read models; tests use execution/evidence; import/history uses acquisition and retained snapshot selection. Database, command queue, effect leases and subscription registry are implementation boundaries, not invented end-user dashboards. No new 4K feature inventory or generic UI platform is introduced.

| Mockup | User outcome | Owning product contract | Readiness / next action |
|---|---|---|---|
| A — Canvas, source, diff and lenses | Understand a changed group, read exact before/after source in-place, follow a neighbor and return. | [Canvas reading](../../../../product/review-loop/canvas-reading.md), [semantic graph](../../../../product/review-loop/semantic-graph.md) | Current [C1–C10 packet](canvas-reading-mockup.md) is ready/dispatched. Continue now; do not wait for B–E. Include the small selected-text comment demonstration below. |
| B — Story, player and exploration | Follow a short explanation, pause to inspect evidence, explore and resume the original place/draft. | [Story and private recovery](../../../../product/review-loop/story-and-exploration.md) | Bounded scenario below is ready for a separately assigned design preview after canvas framing is available; no new story engine. |
| C — PR/path import and snapshot history | Select the right change, see truthful import progress/limitations and explicitly open retained old/new source without moving existing discussion. | [Source history/import](../../../../product/review-loop/evolution.md), [import jobs](../../../../product/review-loop/import-jobs.md) | Existing source contracts support the provisional scenario below; exact preview data and dispatch remain to be pinned. |
| D — Anchored discussion and participants | Select code/prose, inspect anchor-adjacent human/agent threads, reply in context and retain identity through lenses/history. | [Canvas comments](../../../../product/review-loop/canvas-comments.md), [current commands](../../../../product/review-loop/contracts.md), [delivery](../../../../product/review-loop/delivery.md) | Initial affordance belongs to A now. Separate discussion preview follows with complete local states; prose persistence is explicitly unsupported/mock-only. |
| E — Configured tests, jobs and evidence | Inspect a relevant test, request its configured check, continue review and understand the actual result or unknown. | [Architecture execution/evidence boundary](../../../../product/architecture.md#subsystem-boundaries), current separately owned 1080p/06 packet | Provisional design scenario only. Coordinator/B2 must reconcile its owned execution/test-UI contract with the canvas model before dispatch. No edits to B2 files here. |

A–E is a map, not a mandated serial build order. A continues immediately. Independent content/state preparation can proceed under separate ownership. Dependent visual composition uses the shared canvas identities after the relevant preview has been inspected; only affected production UI waits for its layout decision. Existing backend/application checks can continue throughout.

## Shared scenario and identity contract

Use one real own PR where it genuinely supports a task, with pinned reviewed baseline/head and a separately recorded preview source/build. The current canvas author selected real PR25 source; retain that exact author's packet as the source of its pins. Later previews may use another qualifying real project PR when required conditions are absent, recording why; do not invent changed functions, test relevance, import outcomes or semantic edges to fill a scene.

Carry review/snapshot, source side/path/range/hash, structural comparison identity and admitted corpus/analysis/node/edge IDs unchanged across applicable previews. Story version/step/frame, thread/anchor/content version, attachment generation and job/invocation/result identity remain separate. A lens, open thread or scenario switch never creates a new domain identity. Mock scenario data is immutable and explicitly attributed; sample state transitions do not become evidence of live persistence, execution or actor activity.

All previews consume read models and emit application intents through small mocked public boundaries. Cross-subsystem coordination stays centrally managed; components must not subscribe to another subsystem's internal streams. No mockup author changes shared schemas, database, MCP/CLI, runtime services or another writer's UI without a separately reconciled assignment.

## B — Story, player and exploration

**Bounded task:** On the current canvas change, play/pause a short source-backed chapter, inspect an unchanged neighbor, open a contextual question draft, then Resume.

**Inspectable states:** paused entry; current highlighted step with concise why/what/how/example; reading pause; exploration with original return frame; resumed exact version/cursor/source/draft; missing/stale authored context. Preserve the slim one-row player and real graph highlights. Do not introduce auto-generated narrative, audio or new playback infrastructure.

**Pass condition:** The reviewer can tell what the current claim is and what supports it, leave the story and return without reconstructing place; no automatic source-version switch or draft retarget. Screenshot/interaction checks cover desktop and narrow frame; an actual source-first answer is not mislabeled graph-first comprehension. Reuse immutable authored content or label sample claims as preview interpretation.

**Return:** Separate interactive scenario, exact content/frame fixture identity, screenshots, state-transition checks and remaining visual questions. Production story publication and native question/reply are outside this mockup.

## C — Import and snapshot history

**Bounded task:** Enter a repository path, distinguish an ambiguous candidate from a selected PR, observe an import state, then deliberately open another retained snapshot and inspect the old question's original source.

**Inspectable states:** initial/empty; multiple candidates; pending/importing while existing review stays usable; completed result awaiting explicit open; unavailable source/failure/unknown; old/new snapshot selection with historical discussion labels. Use recorded source identity for example files; simulated discovery/jobs are visibly mock states, not real provider/process results.

**Pass condition:** The user understands which PR/snapshot is displayed, what remains pending and why old comments did not move. Import completion never replaces the current canvas without intent. The import surface may be a temporary entry/control panel, but its selected result opens into the shared graph scene. No new importer, Git action, credential UI or fabricated live import belongs to this preview.

**Return:** Separate interactive scenario and state/read-model mapping to existing acquisition/history contracts, plus a linked transition back to A's canvas. Exact source pins and mock-only job outcomes are explicit before review.

## D Discussion and participants

**Bounded task:** Select code, open its anchor-adjacent comment, inspect human/agent replies; then select explanation prose, open a local-only draft/thread, change lens and return without losing either anchor.

**Inspectable states:** selection affordance; explicit draft identity; compact author marker; contextual thread/reply; two nearby threads collapsed into a count; mixed authors; collapsed/offscreen anchor locate; old prose version; unavailable original content; disconnected/unknown agent delivery represented separately from reply existence. Opening another thread preserves the first draft. Sample authors/replies are labeled preview records.

**Pass condition:** Marker placement, quotation and author make the target and conversation clear; keyboard/touch can select, open, reply, close and locate; no source/text/edge occlusion. Thread counts are not message/unread counts. Code/source and prose/version anchors do not silently convert or move. The exact [prose-anchor and backend limits](../../../../product/review-loop/canvas-comments.md) are visible, not hidden in developer notes.

**Return:** Separate interactive discussion scenario, immutable sample anchor/content/participant identities, screenshot/input/cluster checks and explicit missing production capabilities. Reuse A's initial comment affordance rather than building a competing component or backend path; coordinator owns shared preview wiring.

## E — Configured tests and evidence

**Bounded task:** From a changed behavior group, inspect a related test source, choose an existing configured target, request its check, continue reading/commenting and inspect outcome/evidence in canvas context.

**Inspectable states:** source test present but unrun; request accepted; launch/running when evidenced; passed/failed outcome; cancellation requested versus confirmed termination; unknown launch/exit; result from a historical snapshot or different content/environment. Source additions, relevance and execution are independently labeled. Sample process transitions are clearly simulated and never imply a real run.

**Pass condition:** The reviewer can explain which claim a result supports, its pinned source/environment and its limits while retaining the selected group/story/question. No arbitrary shell authoring, inferred runnable target, automatic installation or base/head comparison is introduced. Cancellation/unknown behavior follows the existing execution owner rather than a new component-local state machine.

**Owner dependency:** The coordinator must add cross-links from B2's separately owned test/evidence UI and 1080p/06 packet to this map and the canvas contract. This document gives design scope, not authority to edit those files or bypass their execution contracts. Return a separately inspectable scenario only after that owner reconciles target/result field names and states; A–D do not wait for it.

## Integrated check after the separate previews

Demonstrate one connected scenario using the adopted mockup compositions: choose a pinned change → open the canvas → read focused inline diff → follow an explanation → select text/comment → inspect a relevant test/evidence state → return to the original source/story/thread. Only include supported real facts; indicate simulated transitions continuously. Verify shared identity and public-boundary mappings at each join, and record what remains a mock. This integration exercise does not require implementing every backend feature or waiting for future 4K work.

Every separately assigned preview needs its exact committed source/packet, own-PR target or justified recorded fixture, inspectable entry, cleanup instructions, states/pass conditions, screenshot and keyboard/narrow checks, a fresh independent UI-first review where applicable and user feedback before production composition is adopted. Keep evidence with this correction or its actual owning slice, not a new global type-based folder. A later production integration gets its own engineering, own-PR, native and human evidence; mockup approval cannot replace them.

## Amendment verification

Source readback, 182 local Markdown target-path checks across the full 15-document design change, owned documentation-only scope checks and `git diff --check` passed. These checks do not validate external references or every pre-existing fragment. New discussion/map links were read back. The design amendment built no preview, ran no backend or host operation and claims no visual, persistence, process or human acceptance. Current canvas preview implementation remains with its assigned author; B2/test-UI and 1080p files are untouched.
