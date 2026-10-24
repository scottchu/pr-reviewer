# The reviewer experience

Date: 2026-10-24.

Status: design specification for independent review before any further UI implementation. The user has accepted the graph-led, same-canvas model and explicitly rejected the functional 8474 preview as the UX target. The concrete hierarchy and disclosure choices below are proposals to inspect, not a newly adopted layout. No new implementation, runtime validation or human comprehension result is claimed.

Read the [vision](vision.md), [original reference dissection](review-reference-dissection.md), [canvas reading](review-loop/canvas-reading.md), [story ownership](review-loop/story-and-exploration.md) and [contextual comments](review-loop/canvas-comments.md) together. This document owns the coherent reviewer journey; subsystem contracts own their data, authority and recovery. A subsystem is not automatically a top-level destination.

## The person and the outcome

An experienced reviewer is tired and unfamiliar with this PR. They open our own real change to decide what deserves attention. They should not first learn the application's architecture or reconstruct an explanation from imports, function bodies and file counts.

The opening should let them say: “This change tries to solve this problem. This behavior changes here; this consumer or consequence matters. These supporting changes belong to it. Here is what the evidence does and does not tell me.” They can start at a detail instead, question the explanation, and return without losing their place. Seeing a graph or completing its story does not itself establish understanding or correctness.

The next design uses one bounded, source-grounded change within a real PR. All quoted code, source relationships, scope counts and execution claims must come from that pinned PR/evidence. A short authored explanation has visible attribution. If intent is unknown, say so and explain the observed change; do not fill the gap with a persuasive invented purpose.

## Decision ledger

| Status | Decision |
|---|---|
| Accepted user direction | One persistent graph canvas; overview → focused group/inline diff → return; unchanged context remains reachable; source inspection never silently changes a question draft. Basic canvas reading is core. |
| Accepted user direction | Graph-led explanation with why, what/how and a concrete example; meaningful behavior groups account for central and supporting changes. No API/Helpers orientation selector. |
| Accepted user direction | Slim one-row floating player, mobile reading pause and exploration/Resume; contextual comments on selected code/prose with human/agent identity. |
| Selected visual baseline with specific later corrections | Preserve the original selected concept’s dark editor-style foundation, typography, hierarchy and quiet chrome in the next mockup. Later compact groups/current-scene presentation supersede its duplicated permanent step list; the slim one-row player and same-canvas source reading supersede their older arrangements. Colors alone do not restore the UX. Exact geometry and tokens remain mockup proposals, not a new theme choice. |
| Proposed for design inspection | Opening hierarchy, group-connected claim card, one focused group at a time, contextual source/comment actions, narrow reading composition and burden thresholds below. |
| Unresolved design decision | Replay timing: original demonstrates within the current scene then stops; current engineering advances after eight seconds. Next design proposes a current-scene demonstration ending paused, with explicit Next for the reading boundary. Independent design review and maintainer adoption must settle this before changing application semantics. No automatic progression is necessary to inspect the first mockup. |
| Outside this decision | New analysis capability, generalized prose persistence, host wake guarantees, test qualification, backend uncertainty fixes or expanding public APIs. Existing technical findings remain backlog, not the current design objective. |

## First viewport: give the reviewer something to understand

Proposed desktop hierarchy: a quiet PR identity strip; a compact contextual area with the current review question and short answer; the dominant canvas already framed around the relevant changed relationship/group; one short explanation connected to that focus; the single-row player at a reserved bottom edge. Background material is available from the question/context area. It separates captured PR/ticket statements from attributed understanding and missing input. Do not require a ticket service or manufacture one.

The canvas initially shows the changed behavior, one supported adjacent context relation where available, and a concise before/after consequence. It does not expand every source body. Change markers and relationship kinds are visible without opening a legend; the full legend remains available. A compact scope cue identifies the central group and supporting/unexplained scope. Full file inventory, history, import, participant administration and job diagnostics are secondary disclosures. A concise unavailable/unknown badge remains beside the affected claim; a hidden details panel cannot be the only warning that an assertion lacks support.

Proposed narrow hierarchy: compact PR identity, the current question and a short answer, then the focused group and meaningful relationship visible before ordinary scrolling. The player occupies one row with safe-area clearance. No subsystem-tab wall or repeated global provenance/control bands precede the graph. Detailed source appears after the user focuses it; context collapses to a named return cue rather than a second desktop sidebar. At 390×844 CSS pixels, the product viewport should show the question/answer and at least the central focused node plus a meaningful relation/explicit relation gap. At 320×720, text may flow further but the next useful reading action and its purpose must remain apparent. These are proposed mockup criteria, not measurements of the supplied screenshot, whose browser chrome reduces its content area.

Icons are appropriate for familiar operations with accessible names; they do not replace behavior labels, evidence status or a meaningful question. There is one obvious next story action. Reading a node itself reveals source; a contextual equivalent serves keyboard/touch. Do not present “Focus source” and “Zoom into selected group” as competing global primary actions. Back is shown when a prior exploration frame exists; Resume appears when a saved story position exists. Disabled controls do not occupy the opening simply to enumerate capabilities.

## Concrete design content: our own PR25

Use `https://github.com/scottchu/pr-reviewer/pull/25`, comparison baseline `b096826e31c0927190806de91ed70b8b64aa93d8`, head `e3b270e5f49a9215452b0b86702946043e979059`. These local immutable objects were read for this specification; no live PR fetch or runtime was performed. The future mock's candidate/build identity is separate and does not yet exist. This is a bounded request-header/local-owner story, not a complete claim about every PR25 file.

Proposed opening question: **“How can I open my local review without a token, while agent requests still have credentials?”** Proposed short account: “The review client now omits the Bearer header for its local-owner session. The gateway treats a request with no Authorization header as its configured local owner; an explicit credential still takes the credential path. The review refresh still requests the same pinned review/snapshot.” Those are source observations below. “This removes a credential-paste interruption for the owner” is attributed product rationale, supported by PR25's recorded single-user-access requirement; the client helper alone does not prove successful opening, network protection or correct agent authentication.

| Claim and proposed displayed node/group | Exact source to follow | What that step establishes / leaves open |
|---|---|---|
| Group “Open the local review”; selected node “Build request headers” | Before `src/application/review.ts:24–31`, especially29; after same path25–32, especially30 | Before constructs a Bearer header from captured access; after delegates to accessHeaders. Comparison connection means before/after source, not a call. Source reading opens these ranges inside the same group. |
| Node “Choose owner or credential headers” | After `src/application/local-access.ts:1–3`; file absent in baseline | The new helper returns no header for local-owner:v1 and a Bearer header otherwise. Concrete source-derived example: local-owner:v1 → no Authorization; a synthetic nonsecret example credential → a Bearer header. This is a branch illustration, not a recorded network run. The request→helper call is directly visible at after review.ts30; render it as a source-observed reference only with its citation or a matching admitted static fact, never as runtime traffic. |
| Unchanged context node “Refresh the pinned review” | Before review.ts34–44; after35–45; the source bodies are unchanged aside from line shift | The call at after38 still passes the review ID, minimum revision and optional selected snapshot to request. Follow it to understand a consumer of the header change. Unchanged does not mean unaffected: its request policy changes through its dependency. Do not imply it is a new call. |
| Supporting node “Derive the local owner at the gateway” | After `src/server/public.ts:61–66`; owner capability `src/storage/access.ts:4–14` | Missing Authorization selects store.localOwner; a supplied credential remains separate. Show as an attributed cross-layer explanation with citations, not an invented direct function-call edge from browser fetch to storage. Host/origin validation and complete agent capability enforcement require additional evidence. |
| Evidence node “Check credential-free owner access” | After `tests/gateway.test.ts:89–110` | Test source includes owner reads/writes and explicit invalid-credential rejection. Label “test definition; not run in this design review.” It is not a passing result or proof of native agent delivery. |

The labels above are proposed reviewer-facing labels, not fabricated persisted node IDs. The mock must bind each to the actual retained snapshot occurrence/side/span and original content hash; preserve real graph IDs where available. If current structural analysis cannot supply a call edge, present the cited relationship as authored source-backed explanation, visibly distinct from an admitted static edge. No demonstration may turn an omitted relation into a confirmed leaf.

One complete path: read the opening account → select “Build request headers” → see removed direct Bearer construction and added helper use → follow the helper's local-owner branch → inspect unchanged Refresh and see the same selected-snapshot read → ask on after local-access.ts3 “What prevents an explicit invalid credential from becoming the owner?” → inspect the gateway/test-source citations and their unrun limit → Back/Resume restores the original request-header focus and the preserved draft. The comment is a proposed reviewer question, not an existing user's saved message. The answer is not generated or marked delivered by this spec.

For whole-PR scope, disclose that other application consumers, private recovery, gateway/storage adaptation, runtime scripts, UI removal, tests and documentation changed; the selected path explains only one connected part. Derive exact membership/counts from the actual complete PR ledger, rather than presenting these design labels as an exhaustive grouping. A meaningful next chapter can examine recovery/agent boundaries only after its claims and references are prepared. “No token” must never become “no authorization.”

### Useful first-open when no explanation or participant is ready

The real workspace may have source but no published story and no attached agent. It must still show the pinned change, an honest comparison, complete scope access and the selected source detail. Display “Explanation not available” beside that content; a factual description such as “Request-header construction changed” may come from prepared source, but a full rationale, caller account or the curated story above cannot be silently invented. Do not show a fabricated player count or pretend loading will eventually produce a story without an actual request.

The reviewer can inspect source now or explicitly ask for an explanation on a valid source anchor through the existing question flow. If no responsible session is attached, say that delivery is unavailable and offer the existing attachment guidance contextually; the user initiates attachment from their existing Codex/Claude work session. Do not launch a replacement session or turn opening the PR into a settings wizard. Any saved question and notification disposition follow the existing contract; saving does not mean the agent was notified.

Once an authorized attached participant supplies source-backed context/story via the existing publication ports and answers through the existing reply port, offer the newly available explanation with its author/version. Adoption is explicit and starts paused; publication does not steal the current inspected span or draft. Unsupported native delivery remains pending/unknown. A preauthored PR25 mock story must be labeled prepared design content, not evidence that first-open automatically creates it.

## One continuous journey

### 1. Arrive: “Why am I reviewing this?”

**Understand:** the observed change, its stated purpose or missing rationale, the important before/after consequence, and the boundary of the current account. The first viewport uses the hierarchy above; a behavioral sentence points to the already-highlighted group. It does not instruct the reviewer to hunt for a method before offering an explanation.

**Primary interaction:** follow the highlighted relationship or Next to examine the first decision. Selecting another visible behavior group is an equally valid entry. Context/source provenance, complete scope and historical versions are secondary disclosures beside the relevant content. The initial story is paused, with no comment panel or arbitrary source body forced open. No graph selection creates a question.

**Incomplete state:** loading identifies the pinned PR being prepared without inventing a skeleton call graph. Missing story shows the available source/change map and “Explanation not available”; it does not synthesize a generic tutorial. No review selected offers the existing open/import path in that empty state. Import failure preserves the previously open review. A missing graph relation is “not established”, not “no dependents”.

**Input/narrow behavior:** keyboard reading order follows identity → question/answer → focused group → player; an accessible node list provides the same identities and actions. On mobile, context disclosure returns to the same focused group and reading position. Opening context never starts playback.

### 2. Follow: “What changes, and who or what feels it?”

**Understand:** one concrete decision and its consequence, the direction/kind of a supported relationship, and relevant unchanged behavior. The active graph segment and a short explanation move together. A concrete before/after example uses real inputs/outcomes when evidenced; otherwise it is labeled an illustrative explanation and does not claim observed execution.

**Primary interaction:** choose the connected neighbor or advance one story step. The graph emphasizes the relevant endpoints/edge without removing the surrounding orientation. Source-backed static calls, document links, comparison relations and authored explanation links are visibly different. A proposed impact is attributed as interpretation. Supporting tests/config/docs appear as responsibility groups or explicit unassigned scope, not arbitrary call arrows.

**State/disclosure:** one current explanation is visible; the chapter list opens from player progress rather than duplicating the entire lesson beside every view. Expanded scope offers the actual supporting file list and unexplained counts. Step changes are deliberate, preserve drafts and stop for reading under the proposed mockup behavior. Graph pan/selection/reading pauses playback. Current runtime's different timing is not silently relabeled compliant.

**Incomplete state:** absent context retains the selected change and names the missing relation/source; failure to load a neighbor does not jump to another one. Keyboard edge/node activation and touch taps reach the same focus; reduced motion conveys the same change through static emphasis. Narrow framing keeps the active relation and an upstream/return cue rather than scaling all text to fit the whole PR.

### 3. Inspect: “Show me exactly what supports that statement.”

**Understand:** the actual removed/added/modified lines, enough unchanged context to interpret them, and whether the claim exceeds its evidence. Activate the highlighted source or use zoom/focused reading to expand that same group in place. The claim remains associated with its source, and the nearest neighbor/return cue remains legible.

**Primary interaction:** read and select source inside the canvas. Desktop before-left/after-right and narrow labeled stacking preserve both identities. Show exact side/path/range and short commit identity close to source; full immutable identity is disclosed there. Inline change markers accompany color. More context belongs at a truncated boundary inside this source group, not in a global toolbar. Horizontal source scrolling is local; text selection must not pan the graph. Zooming out returns detail level without changing story or selecting another node.

**State/disclosure:** inspection has its own focus/span. It does not populate or retarget the question composer. A selected range offers Comment nearby. The player stays paused and outside selected lines; the focused group can reflow without changing node/edge identities. Back restores the prior framing; following an unchanged neighbor makes its unchanged role clear, not a new changed-file claim.

**Incomplete state:** show busy/error inside the requested group while preserving the last valid frame. Binary, absent side, ambiguous counterpart, unavailable source and failed verification have distinct honest labels. Never substitute checkout bytes or invent a partner. An unavailable anchor cannot become a comment submission. Keyboard range selection and a named focus-source action avoid reliance on wheel precision; narrow code remains readable with its neighborhood cue.

### 4. Ask: “Does this mean what I think it means?”

**Understand:** what the question is about, who said what, and whether an answer supplies evidence or leaves a gap. Selecting prose or code reveals one nearby Comment action. Opening it creates a contextual composer with visible anchor/quote, current author identity and applicable persistence limits. Sending is a distinct action; selecting or reading is not a command.

**Primary interaction:** ask about that selection, or open the anchor-adjacent thread marker and reply in context. Human/agent kind and message authors remain visible. Markers use a reserved lane; clusters count threads at the current scope and disclose their anchors/authors. One active thread is enough; zooming out clusters inactive markers rather than covering the graph with bubbles.

**State/disclosure:** the existing draft, anchor and saved story frame survive pan, zoom, lens and reply-source inspection. A dirty or uncertain other draft requires explicit reconciliation rather than silent replacement. Code uses exact retained source anchors. Prose requires stable content identity/version/selection; where unsupported by the backend the mockup visibly says local-only and cannot claim Saved/Delivered/Answered. Server-derived actor identity remains authoritative. Attachment/delivery diagnostics appear with the affected question, not as a prerequisite control wall on arrival.

**Incomplete state:** distinguish saving, saved, notification pending/unknown, working and answered. An answer may be incomplete even when transport succeeded. Unknown submission preserves the existing recovery path, never a second fresh command. A stale prose version shows its anchor as unavailable rather than attaching the quote to equal text in a new version. Close restores focus to the originating selection/marker; Escape closes the local panel without discarding a draft. Touch selection keeps native handles; on narrow screens the thread expands adjacent/below its anchor within the same graph group with keyboard/player clearance.

### 5. Challenge: “What makes this credible, and what remains unchecked?”

**Understand:** which supporting change or test addresses the selected behavior, whether it is only present, claimed relevant, actually run, or unable to establish the claim. Show evidence beside the affected group with source/result provenance and limitation. Do not paint an added test as a passing result.

**Primary interaction:** inspect that evidence in context. A test-source selection focuses its real node/source; an actual result opens its attributed summary and output on demand. A run request appears only for an available configured target, with its exact scope; the design cannot invent per-node executable targets. Full jobs/history, raw output, import and participant setup remain contextual secondary tasks.

**State/disclosure:** evidence inspection pauses and preserves the story return. Missing/unrun/unknown is useful information, not a blank success tile. Pending work never freezes reading or auto-selects a new snapshot when it finishes. Unavailable qualification explains the affected action without blocking unrelated source review. Keyboard/touch can inspect the same evidence; narrow reading retains the behavior/claim heading so a log cannot become an unexplained detached screen.

### 6. Return: “Where was I, and what is my judgment now?”

**Understand:** the original claim in light of the inspected evidence and remaining uncertainty. Back returns one local exploration level; Resume restores the saved exact story position/frame and pauses. The explanation, graph focus, source selection and drafts agree; no new story version or newest analysis replaces them silently.

**Primary interaction:** Resume then continue, or state a question/judgment supported by specific evidence. End of story offers the remaining scope and unresolved questions, not a “review understood” or automatic approval badge. A complete story is not an acceptance decision.

**Incomplete state:** failed or unauthorized restoration retains the return frame and drafts with a contextual error; do not consume it or substitute current source. A newer available version is offered explicitly. Reload recovery remains bounded by current private-state contracts and their visible limits. Keyboard focus returns to the relevant explanation/group; narrow layout restores readable framing rather than requiring the reviewer to locate the old section manually.

## Preserve state without making the reviewer manage it

The experience distinguishes review snapshot, graph/analysis identity, story version/cursor, canvas viewport/detail, inspected span, explicit question anchor/draft and open thread. They have separate meanings but should not appear as seven setup controls. The current application/domain owners and managed routes preserve their identities. A rendering change cannot bypass authority, reinterpret a failed read as valid restoration, or change persistence schemas without a separate documented implementation scope.

A source fact can support a claim; it cannot prove business intent or execution. A reply can revise the explanation without overwriting the immutable source. A new PR head is an explicit new snapshot. These boundaries should be readable at the relevant decision, not repeated as implementation prose across every band of the opening screen.

## What to retain, what to stop composing

| Current evidence | Reuse or correction |
|---|---|
| Retained source/history, structural comparisons, analysis facts/unknowns, story/context values and exact question/reply identities | Reuse through their existing public boundaries. A redesigned journey is not a backend rewrite or a reason to discard recovery safeguards. |
| Candidate structural in-canvas inspection, source links, hunk focus, separate question intent and transactional Resume | Useful partial foundations. They do not establish that the overall UX helps a tired reviewer. Keep the safeguards while designing the information hierarchy. |
| Current source separately composes import, story, semantic and structural presentation; rejected mock shows subsystem tabs and global action rows | Stop treating successful individual panels or scenarios as a finished product screen. Integrate around the current review question, group and return state. Separate subsystem mocks remain design investigations, not production navigation requirements. |
| Supplied 8474 functional mock | Preserve as historical functional evidence only. It is superseded as a UX target; passing selection/return checks cannot make its hierarchy accepted. |
| Existing source/schema/recovery/test evidence | Retain its bounded engineering meaning. Validation repair, more passing tests and complete inventories are not the current design goal or a substitute for understanding. Known technical findings remain separate backlog. |

## Next inspectable design and acceptance

After independent design review of this specification, prepare one coherent mockup journey, not another all-features control inventory. Its data must use a real own PR with recorded URL, immutable base/head and a separately identified mockup source/build. Select a change with a concrete behavioral question, a supported relationship or explicit relation gap, unchanged context and supporting evidence. PR25 is an existing candidate example, not proof that a claimed caller or consequence exists; verify each proposed claim against its pinned source before drawing it. If it cannot exercise the declared task, choose a suitable existing own PR and explain why. Do not fabricate graph semantics to satisfy the layout.

Show six inspectable states on the same canvas: oriented opening; focused relationship/current explanation; inline diff plus unchanged neighbor; selected code/prose contextual thread; evidence/unknown; Back and exact paused Resume. Include desktop and narrow variants, keyboard paths, and one missing-source/unknown-delivery example without building a generalized platform. Proposed reading-stop replay must be clearly labeled; do not accidentally implement a new timing policy while demonstrating layout. Content-only sample prose comments remain mock-only.

Before implementation adoption, evaluate:

1. **Orientation:** without a guided explanation from the author or opening source first, a fresh reviewer gives a three-sentence purpose/change/consequence account and a concrete before/after example, or correctly identifies missing rationale. Unsupported confidence fails.
2. **Meaningful graph:** the reviewer follows one actual relationship, explains its direction and unchanged context, distinguishes static/source evidence from interpretation, and identifies remaining supporting/unexplained scope. No invented call or execution claim is acceptable.
3. **Inspection burden:** from the visible claim, one direct activation reveals the relevant inline diff in its group. The reviewer can find the cited lines and return without an external file page or reselecting the PR/story. Record searching, wrong turns and repeated context reconstruction, not merely click totals.
4. **Conversation:** the reviewer knows the exact anchor and speaker, opens a contextual thread, inspects answer evidence and returns without losing the original draft or position. Unsupported prose persistence cannot appear saved.
5. **Reading space:** screenshots show the first-viewport hierarchy; source, selected text and active composer remain readable and uncovered by the player/thread. Touch targets and keyboard focus remain usable. Verify narrow keyboard-open and long-content layouts separately when a mock exists; no present device acceptance is claimed.
6. **Honesty and effort:** ask what is established, what is unknown and what would resolve it. Rate orientation, scope, relationships, evidence, source-and-return and cognitive effort as easy/workable with effort/burdensome/blocked. A correct final answer obtained by reconstructing everything manually is still a presentation failure. Any central misunderstanding or burdensome opening requires revision.

Freeze the graph-first account before source drilldown, then retain the source-corrected account and ease critique. Do not supply an answer key to the fresh reviewer first. Author checks and mediated image review remain labeled; an unavailable actual UI route is inconclusive, never bypassed. Automated engineering counts, layout inspection, independent-agent comprehension and unfamiliar-human/device evidence are separate. The decision is whether this proposed experience deserves implementation, not whether every future feature has been mocked or the whole product is accepted.
