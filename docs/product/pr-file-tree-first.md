# Change-centered PR behavior workspace

Current integrated outcome and active repair: [reading journey](../plans/720p/slices/05-explanation-exploration/reviews/reading-journey-v1.md). The frozen mock's F14 deferral is an implementation limit, not permission to omit story synchronization or anchored question/answer from the latest full outcome.

Date: 2026-10-24.
Status: current accepted requirements for a bounded inspectable mock. Earlier flat-card/nested-card/import-led iterations are historical in the [owning packet](../plans/720p/slices/05-explanation-exploration/reviews/pr-file-tree-mockup-v1.md). This specification supersedes their layout and relationship directions. Production integration, layout adoption and unfamiliar-reviewer comprehension remain separate, unverified gates.

## Purpose and boundary

A reviewer should see what changed and the directly relevant behavior relationships without reading an entire project or learning a control console. The default organization is source-grounded caller→callee behavior, with changed and necessary unchanged function/source occurrences. File/directory containment is an alternate lens, never the default behavior structure. Preserve the original October23 dark editor/Inter/quiet-chrome foundation and accepted panels. The bounded candidate now uses the explicitly approved existing owner gateway/store/proxy; that permission does not grant production adoption, native-session changes or a new analysis platform.

## Current requirements and observable acceptance

### F18 — Caller/callee primary lens and explicit icon switching

Date: 2026-10-25.
Status: accepted correction following the user's rejection of the file-default candidate.
The user reiterated that the graph is connected by callers and callees, asked why it was organized as folders, and made the file tree a different view switched through icon actions. This supersedes earlier file-first layout language; e3c461c's engineering checks do not establish product acceptance.

Behavior is the first-open default. Place exact callable/source occurrences by real caller→callee relationships, independently for base/head; meaningful supported unchanged callers AND callees remain inspectable. Source/scope/counterpart/test relationships have separate meanings and must never masquerade as calls. An unresolved boundary names the missing evidence. Partial prepared evidence cannot become a fake complete connected graph or a reduced PR. All50changed paths retain source homes and arbitrary entry; unprepared homes belong to the authored responsibility/support groups, not directory branches or an undifferentiated catch-all.

The action bar has familiar SVG actions for Behavior graph and File tree with accessible names, title, pressed state and visible focus. Switching is explicit and changes presentation only. Keep selected function/source identity, expansion, per-file folds/scroll/mode, test lens, public story/draft, original/exploration return frames and source eligibility. Retain each lens's camera separately; source/fullscreen/Context/owner returns include their originating lens and exact camera. Story selects the same source/function identity in either lens and never gates membership. Camera-only gestures, explicit disclosure, continuous full-callable source, declared-test limits, owner-backed questions and honest native-delivery state remain unchanged.

Acceptance: actual desktop/narrow first-open shows connected source-backed functions before selection; follow an unchanged caller and an unchanged callee on both source sides; inspect exact callsite/target/certainty/frontier; toggle icons during complex source/test/Context and owner exploration with dirty draft, then restore all reading/mode/fold/test/cursor/draft frames. Check arbitrary unprepared-source entry, all50source identities, no imported edges labeled calls, source hashes and exact base/head identities. Fresh independent engineering and unfamiliar-reader comprehension remain separate gates.

### F01 — Whole-PR source accounting and alternate file tree

All50 changed PR25 paths have discoverable exact source homes in both lenses. The default behavior lens connects actual callers to callees and locates source/support homes by the accepted responsibility groups, with visibly typed source/scope associations and honest unprepared frontiers. The alternate file lens places the same sources under directory containment branches. Each compact source home shows its basename and Git status; full-path/kind IDs distinguish duplicates. Directory edges mean contains only in that alternate lens. Drag/scroll pans; pinch/Control-wheel and keyboard zoom remain available; Overview frames the active lens without changing disclosure. The canvas fills the window without outer page scrolling. Not all50 must fit the first viewport at legible scale.

Acceptance: exact Git membership/statuses, duplicate/prefix independence, readable desktop/390 framing, real pan/zoom/keyboard and no accidental object dragging. Source-backed path tooltips/accessibility expose full identity.

### F02 — File-group identity with a continuous diff

A file is a logical group of exact source/range/change identities. Its visible reading surface is **one continuous standard diff**, not repeated ChangeN/Before/After boxed subgraphs. A native hunk remains a stable logical ID/anchor even when it is not a drawn graph card. File activation expands/collapses this surface in the existing PR graph, preserving surrounding files/relations and the camera. **Graph zoom/pan changes only the camera.** Only explicit file activation/keyboard intent expands or collapses a file. An expanded file survives zoom-out; zoom-in never opens a collapsed file. Automatic semantic disclosure is superseded, not a current feature. Do not equate expansion with fullscreen or automatic camera refit.

Acceptance: collapsed and expanded files keep exactly their expansion state through zoom in/out and pan; same file/hunk identity, surrounding whole-PR context and unchanged camera across ordinary activation; no per-hunk card wall or repeated version headers. A file near a viewport edge may require ordinary graph pan.

### F03 — Exclusive edge-to-edge file workspace and exact return

The separate top-right fullscreen action changes the entire main workspace root to the selected file. Render no unrelated PR files/directories/context objects/cross-boundary edges. Fill all available main width/height: no16/32px margins, parent card border, duplicate filename header or nested-root blank space. Keep one minimal filepath/exit bar, thin dot rail and compact controls/safe-area clearance.

Acceptance: fullscreen is visibly edge-to-edge and exclusive; exit/Escape restores the exact PR camera, selected/expanded identity, hunk, vertical/horizontal reading, comparison mode and expanded-context folds. Test A→compact B fullscreen→A with B mode changes; retaining A visibly underneath is not a valid workaround. This is in-memory presentation state, not persistence.

### F04 — Native change colors and smooth interruptible navigation

File prefixes/colors come from actual Git A/M/D status. Expanded-file rail dots come from actual native hunks: green pure additions, red pure removals, yellow both removed/added rows. Actual source rows remain red/green; never invent deletions to illustrate red. Overview has no rail clutter. Dots target the exact rendered change anchor and recompute after fold/mode/size changes.

Acceptance: click/keyboard smoothly scrolls only the local file viewport, without moving the graph; repeated actions retarget. Expansion/collapse and explicit fullscreen spatial changes transition continuously; reduced motion gives immediate semantic equivalence. Proposed240ms geometry and browser-native scroll timing are mock choices, not adopted production/story timing. Record intermediate geometry/scroll evidence separately from settled PNGs. No per-frame broad React publication or competing scroll timers.

### F05 — Distinct source coordinates and exact source

Unified keeps actual removed and added rows contiguous in native change-block order and has separate **Before** and **After** number columns plus change glyph. Context shows both; removal old only; addition new only. Both gutters stay visible during horizontal reading. Split uses the appropriate side number in each column and the same paired native change blocks, without independent side scrollers or inferred function alignment. One version header exposes exact commits/hashes; no invented empty source for an absent side.

Acceptance: imports.ts Change2 shows context24/26,25/27,26/28, removal27/blank, additionblank/29, then28/30. Do not renumber to imply old27 jumps to old29. Source lines, Unicode and immutable side identities remain exact. Long source can require shared horizontal scrolling; it is not promised to fit a phone. Every newly opened file starts horizontal0, including modified and added files; never automatically shift toward a replacement prefix. Dot navigation is vertical only and preserves manual x; explicit restoration retains saved x. Normalize code/gutter fonts and line-height and use text-size-adjust:100% without disabling user page zoom. A mobile screenshot alone does not establish iOS autosizing as the cause.

### F06 — Bounded context and inline expansion

The default minimum context is the **entire responsible changed function/method on each available side**, even for a one-line edit. Prefer the actual inner callable over its outer factory. If a changed returned-object entry has no inner callable, the actual enclosing factory can be the responsible context and can be large; never invent a narrower function to reduce the display. Multiple changed functions remain fully visible. Module-level import/type/doc/statement changes use their exact responsible declaration/statement context, never a fabricated function. Prepare exact source ranges with the existing TypeScript compiler and pinned bytes; keep sides independent rather than guessing function counterparts. Native Git context remains a floor, not the accepted maximum. Other unchanged intervals are collapsed into compact count/range rows and expand/collapse inline using full source read from the pinned Git sides. For example, Git -U3 omits imports.ts old31/new33 as unchanged, not deleted; if that line is inside a required full callable it is visible by default, otherwise its interval can be folded. No source text is fabricated. Keep fold identity/state across mode, fullscreen and cross-file return.

Acceptance: a one-line function edit exposes its complete actual Before/After callable ranges while an unrelated neighbor remains folded; exact omitted counts/ranges; expansion reveals the exact pinned lines; collapse restores compact context; full expanded comparison reconstructs every source side. Fold geometry updates dot targets and preserves the reader's place.

### F07 — Observational current range during manual scroll

Explicit smooth travel has temporary target ownership, never a permanent highlight lock. Wheel, touch start/move, pointer and local keyboard input release travel. Current-range state follows actual visible anchors; at a clamped bottom it selects the final relevant hunk even if that anchor cannot align at the top. Repeated dot clicks remain interruptible.

Acceptance: real wheel and author synthetic touch after a dot action, bottom/return/mode/fold cases and no camera movement. src/storage/public.ts has exactly3 native hunks; third-at-bottom is correct and the user's screenshot alone did not establish a bug. Do not invent a fourth hunk or relabel that screenshot as a failing reproduction.

### F08 — Compact presentation controls

Unified defaults on mobile; split defaults on desktop. Use a compact single-/two-column SVG toggle with accessible names/title/pressed state, no visible mode-word wall. The bar is fixed above the mobile safe area and floating/draggable on desktop. Preserve native text selection, local source scrolling and orientation; controls must not force player/card dragging to read source.

Acceptance: icon-only visual controls with adequate touch hits, correct mode state and real source input staying local. Geometry/device ergonomics remain subject to inspection.

### F09 — Responsive relationship explanation

An actual relationship edge, or the continuous source-comparison affordance for the current logical hunk, opens its named explanation. Mobile slides up from the bottom; desktop slides in from the right. Identify exact from/to/source/hunk and highlight the selected relation/incident identities. Close preserves camera/reading/selection. Keep close/control clearance; this is not a comment composer, new route or story page.

Acceptance: actual pointer/keyboard activation, exact relation identity, responsive placement and unchanged return state. The reader's primary content is a concrete1–2sentence change/why explanation. Protocol/metamodel prose is not the main answer. Hashes, exact source, certainty, inferred rationale and unknown/execution limits belong in secondary disclosure. Prepared summaries must cover all3storage/public.ts hunks, storage/access.ts helper addition and review.ts request replacement. For authenticate: local-owner access is recognized before credential lookup; other credentials continue through lookup. For the export replacement: reuse shared authenticate instead of the duplicate credential-only method. Helper imports support that behavior. Added helpers have actual absent/base scope. Unprepared regions explicitly say no prepared summary; generic diff-tool tutorials are not explanations. Do not turn that into blanket security/execution proof.

### F10 — Calls centered on changes, never default imports

Default organization is the prepared actual caller/callee graph around changed function/declaration or changed-callsite seeds, with necessary one-hop unchanged context present before file selection. Selecting a file must not be required to discover those relationships. Preserve whole50-file source accounting without pretending every repository function/call is known. In the alternate file lens, selected-file neighborhoods remain a focused view of these same facts. Static imports are off by default; the retained import fixture is secondary historical evidence, never call/runtime claims.

Prepared scope: review.ts changed request; local-access.ts added accessHeaders; storage/public.ts changed local authenticate; storage/access.ts added accessReference/localPrincipal. The immutable client/storage packets supply32 callable occurrences and30 direct edges across9source paths. The bounded supplemental private-session scope preparation uses the existing TypeScript compiler on pinned bytes to expose credentialScope's direct lexical calls to requestFingerprint/encodedBytes on both sides; those two callees retain exact unchanged-body proof. Supplemental lexical observations are not admitted-static facts. Gray unchanged refresh retains both exact source occurrences and its identical-body evidence; unchanged bytes do not prove unchanged behavior under a changed dependency. Other files/scopes remain explicitly unprepared, not no-calls leaves. No arbitrary transitive expansion, guessed dispatch or fabricated cross-component call is permitted.

Acceptance: representative review.ts and storage/public.ts overlays contain only incident changed-seed neighborhoods, callers point to callees, exact source/range identities remain inspectable, and unrelated packet edges stay hidden. Do not guess counterparts by name, connect HTTP/port dispatch to a closure or fabricate gateway/store calls.

### F11 — Provenance, sides and frontiers

The root-prepared client packet contains16 **source-observed** calls, with analyzer obstructions retained; storage contains14 **statically resolved** admitted edges. Keep those certainty classes distinct. Retain every base/head anchor and callsite; coalescing needs explicit comparison/source-counterpart evidence. Both corpora are selected-context, not repository enumeration. Missing binding, unsupported dispatch and unprepared sides remain honest frontiers; absent added source is not an empty before declaration.

Acceptance: pure selected-seed filtering/referential integrity, exact packet hashes/source anchors, separate provenance in secondary evidence and no fabricated runtime/security/coverage statement. Do not change the analyzer, add globals/dependencies or enlarge its budgets to improve this mock's appearance.

### F12 — Correct relationship ports and routing

Containment enters the left boundary. Actual outgoing behavior relationships leave the file/function's right boundary; incoming targets use the appropriate left boundary. Use explicit port IDs and refresh measured handle bounds after group geometry changes. Route actual arrows outside readable code/text, with truthful caller→callee direction. Stale compact widths must not make expanded relations fan from the top-left containment point.

Acceptance: inspect real closed/expanded world coordinates and actual SVG endpoints; source endpoint matches the right boundary after animated expansion. No default import spaghetti or invented calls. Measure the actual call ports and settled SVG endpoints; the historical import renderer is not evidence for this contract.

## Evidence, responsibilities and retained larger design

### F13 — Immutable PR fixtures and local responsibilities

PR25 baseline b096826e31c0927190806de91ed70b8b64aa93d8 / head e3b270e5f49a9215452b0b86702946043e979059.50changed paths:4added46modified0deleted;126native hunks at Git unified context3 (-U3), distinct from the historical163 zero-context (-U0) change blocks; +492/−192lines;96available full source sides. Full-source hashes cover UTF-8 bytes; source anchors use exact half-open UTF-16 offsets and1-based lines. Full source exists for context expansion. Preparation is local read-only Git evidence, not a production parser/import/runtime capability.

Pure projections own paths, native rows, folds, source coordinates and selected change neighborhoods. React owns local presentation/input and reports immutable per-file reading snapshots outside conditional renderers. This preserves A across B-only rendering without keeping unrelated DOM visible. Scroll updates do not cause broad per-frame React publication. Source text selection and horizontal/vertical scroll own their input; graph pan/zoom owns the canvas surface. The prepared call projection filters exact changed-seed IDs before selecting one-hop links, retaining source-observed versus admitted static provenance. Separate Before/After function occurrences remain distinct. A source-header relationship action focuses the prepared function context explicitly; it does not couple camera zoom to expansion. Exact function activation can extend that callable’s source context without guessing a counterpart. The test projection uses exact function-mapping target IDs, never test names/import proximity. Local function-return and test-return snapshots retain the previous file reading, focus, mode and camera; per-file focus intent identity prevents a remount from replaying an old inspection and overriding restored reading. No generic navigation/persistence system is introduced. Earlier nested-ReactFlow store/height/pointer failures are historical lessons, not reasons to retain the rejected card layout.

### F14 — Larger experience remains explicitly future

Anchored human/agent comments, floating anchor-adjacent identity/thread, exact code/prose selection, discussion delivery/persistence and broader left/right lens composition remain in [canvas comments](review-loop/canvas-comments.md), [canvas reading](review-loop/canvas-reading.md) and [review experience](review-experience.md). The larger whole-PR graph with necessary unchanged context, left context/right detail lenses and bottom anchored discussion remains retained design direction. These are not silently dropped, implemented or accepted by this bounded file-reader mock. Story is an optional future attention overlay, not graph membership. No participant attachment, commands, notification effects or production test execution is added here.

### F15 — Honest verification and acceptance boundaries

Author Chrome/Playwright, synthetic touch, source audits and static captures are engineering/design evidence. They do not establish physical-device/trackpad performance, native-host behavior, live-agent execution, whole-PR semantic coverage or unfamiliar-reviewer comprehension. The independent UI-first browser gate remains denied/unrun; no alternate route or policy retry. Geometry/timing are proposals. Fixture-rich bundle cost, long horizontal source reading and dense touch/navigation remain limits. Maintain exact source/build/review/evidence pins in the owning packet, with passed, failed, historical and pending states distinct. No main/GitHub/production integration/deploy is implied.


### F16 — Relevant declared-test lens

An explicit accessible icon test-lens toggle reveals only source-backed tests relevant to the selected changed function: file → function → concise test summary → same-canvas test diff. Summaries explain the actual assertion/risk, not a run result. Test definition/callable/ranges and its relation to the changed function require exact source evidence; relevant unchanged tests can remain context. Clicking uses the same continuous red/green/yellow diff scoped to the selected complete test callable and its intersecting native hunks, with exact source sides/absence. Preserve native hunk context that extends a little beyond that callable; do not display unrelated changed tests as if they were selected. An unchanged relevant test shows unchanged source without fabricated change dots. No all-test dump, autorun or invented mapping. Discovered tests never mean PASS; unavailable/unknown relationships remain explicit.

Acceptance: bounded prepared changed-function/test mapping, relevant-only toggle and navigable summary/diff/return with exact test-function source. Actual execution is separate and absent in this mock. Root-prepared representative mapping is available; deriving the lens remains the next bounded projection after the continuous-reader checkpoint.

### F17 — Begin with the review question and inspect its evidence

Date: 2026-10-25.
Status: accepted integrated outcome; first bounded composition repair in progress.

The current full outcome is motivation → system relationships and before/after → same-canvas evidence → anchored question/answer → original reading context. Reuse the accepted panel composition, reviewer journey and ontology. Preserve camera-only gesture zoom; explicit expansion reveals semantic detail. Do not introduce a second domain identity model.

The first repair supplies the accepted left Context surface: open on desktop, a named Context cue on narrow screens. It identifies the pinned comparison, a concise review question, captured normative requirement versus attributed prepared source account, a concrete owner/credential example and limits. PR25's retained runtime specification states that opening the workspace no longer requires manual token entry and explicit credentials retain their identity. This is project knowledge, not a function-call fact or proof of execution. Show its exact source citation. The prepared account connects the request's old direct Bearer construction to the new accessHeaders choice; a separate citation opens that exact function occurrence on the existing canvas. All 50 file homes remain available.

Context source actions are deliberate evidence excursions. Back restores exact prior camera, expansion, selected identity, source focus, comparison mode and reading/folds. Closing context preserves the current graph camera and returns focus to its invoker; it is not Back. Fullscreen remains exclusive and hides context. Narrow context is one foreground modal reader with close/Escape and contained focus; no outer scrolling page. Desktop context reserves width rather than covering source. No new route, parser, backend or runtime effects.

Acceptance J1: from first open, state the problem, before/after owner versus explicit credential example and one evidence limit; follow normative source and changed-function citations in the actual React canvas; return to the prior frame; retain complete file membership and camera-only gesture behavior. Test actual desktop/narrow navigation and state restoration. This is authored engineering evidence, not fresh-reviewer comprehension. Story synchronization and anchored actual question/reply remain required subsequent composition work, not closed by J1.


### F17 interaction clarification — retained Context and keyboard return

Date: 2026-10-25.
Status: required repair following independent J1 review of 7423292.

A narrow Context dialog makes all background navigation inert, including header Overview/Back and the graph. Pointer attempts outside the actual dialog cannot change camera, expansion or return frames. Escape/Close restores the Context invoker without moving the graph.

Context local scroll belongs to the React owner outside the conditional panel. Close/reopen, narrow citation excursions and fullscreen hide/show retain this value. Mount restores it before focus; focused controls must use preventScroll. Manual scroll records presentation state without broad state publication. No new persistence or ontology concept is introduced.

Keyboard citation activation explicitly focuses the rendered same-canvas source reader. Back focuses the restored reader, or the semantic graph landmark when returning to the overview. This DOM focus transfer never scrolls the page or changes the camera; saved semantic function focus alone is insufficient. Pointer activation retains native focus behavior.

Acceptance: narrow background Overview/Back pointer attempts preserve state; nonzero Context scroll survives close/reopen, citation/reopen and fullscreen; keyboard citation/Back reach the visible reader/graph. Combine Context navigation with pre-existing source/test excursions and verify folds, horizontal/vertical reading, comparison mode, test lens and exact camera. Existing source-informed review is not unfamiliar-reviewer comprehension.


### Integrated owner identity prerequisite

The PR25 source/call/test fixtures are immutable evidence artifacts. Their packet-local snapshot/corpus locators remain those original identities; they are not server-retained Snapshot, StoryVersion, participant or question identities. Integration first obtains an actual Snapshot through the existing source-preparation public interface, pinned to the same repository/base/head and complete changed-path inventory. Compare every available fixture source side byte-for-byte and by hash. Record exact crosswalks as mappings with evidence, never relabel or mutate the original packets.

Story claims use the existing StoryContent/StoryReference contracts and source-observation versus supplied rationale/inference/unknown basis. Published story versions come from the existing owner and receipt/readback; a local authored payload alone is not a published StoryVersion. Source questions use the retained Snapshot's LF anchor contract; source hash and coordinate checks precede eligibility. Packet-local semantic context without a validated retained-source mapping remains ineligible. Test mappings never become TestRun/PASS, and a prepared explanation/reply never becomes an attached participant's response.

No ontology extension is required for this composition: Project usesRepository Repository; Comparison pins revisions; source occurrences and evidence locators retain their owners; projection/lens state remains presentation. Preserve all changed files and supported unchanged neighbors independently of any optional story. Production adoption, native attachment/delivery and unfamiliar-reviewer understanding remain separately gated.


### Prepared story input for existing owner integration

A prepared PR25 story payload uses the existing StoryContent contract, not a separate player or draft model. Its chapters connect the owner-versus-explicit-credential request change to the storage authentication boundary; a source-unchanged refresh caller remains meaningful context. The retained runtime requirement is normative project knowledge, explicitly described as a requirement observed in source, never a measured result or an invented quotation from a person. Concrete before/after examples are source-derived. The storage helper's in-process capability distinction must not become a browser credential or a security guarantee.

Each claim retains source-observation/inference/unknown basis, exact existing snapshot-source references and material uncertainty. Prepare sources before claims; reject missing required references rather than substituting another side or guessing counterpart identities. Every current GraphFile key remains accounted for as explained by a specific prepared chapter or explicitly unexplained. An optional story changes attention only; unexplained scope remains directly navigable. Changed tests/recovery/tools not explained by the authored chapters stay visible frontiers, never implied coverage.

Preparation returns only StoryContent. The existing story owner still owns structural/evidence admission, author identity, publication receipt and StoryVersion identity. A payload file is not publication, a live story, an agent reply or product acceptance. Runtime-scope restrictions block listener/proxy effects, not independent source-grounded authoring of this input.


### Candidate owner-backed composition

The approved local reading candidate may proxy existing /api requests from57943to a task-owned existing gateway on127.0.0.1:57944, with its own private retained Snapshot/store. Publish prepared source content only through the existing Story owner; display actual actor/version and receipt/readback status separately from interpretation. Refuse to replace a different retained story automatically. No candidate fixture may fabricate an attached session, successful notification, reply or test run. Unavailable native delivery remains explicit while saved questions remain real retained data.

The optional story uses the public StoryBridge cursor, claims, publication and exploration/draft owners. Its attention projection may select/frame a file but never changes whole-PR membership or automatically expands/collapses source. Explicit evidence actions open exact source on the same graph. React retains only its existing local camera/reading/folds/fullscreen presentation; story cursor/drafts/eligibility/recovery stay with the public owner. Evidence navigation does not adopt an anchor. Only the existing guarded adoption operation changes a question; a nonempty draft needs explicit replacement confirmation. Explicit Return restores story/draft and local reading frames only after successful owner restoration; a failed restore preserves recoverable state.

Explicit side-specific evidence must reveal the cited side in the continuous comparison, including its horizontal position when long split columns exceed the viewport. Retain the selected comparison mode; do not label a hidden After column as visibly inspected. This local evidence-reading adjustment belongs to the excursion; returning restores the earlier horizontal/vertical reading and folds.

The candidate opens with Story and discussion closed. Story opens the actual retained account and names its publication actor/version. Previous/Next use the public cursor and select its source file as attention, without disclosing source or changing membership/camera. Extended claim detail includes basis, inference limits, exact source actions and the explicit unexplained frontier. Prepared payload notes are distinguished from subsequent actual local publication; publication itself is not a runtime or comprehension result.

On desktop, Context reserves the left edge, story detail reserves about340px on the right, and discussion reserves about280px at the bottom of the central column. These readers coexist without an outer page scroll. On narrow windows, only the explicitly foregrounded reader appears as a modal; header and graph are inert, Tab remains inside it, and Close/Escape returns to its named invoker. Panel-local scroll survives close/reopen during this React owner lifetime. Discussion's native-notification limitation is discoverable without displacing the composer.

The React binding creates one public ReviewWorkspace, connects/disconnects it and its StoryBridge, and subscribes only to their public snapshots. Existing workspace managed routes coordinate review, story, source canvas, eligibility and exact confirmed drafts. Citation inspection stages public exploration, then awaits inspectReference/SourceCanvas's exact retained range/hash before changing the continuous reader. It does not select/adopt a question. The separate Source action makes the expanded reader's retained function/range eligible for inspection; it never forges a fixture Snapshot identity.

Discussion derives its active draft and source range from StoryBridge. Use inspected range calls questionEvidenceProjection/adoptEvidence; a nonempty draft presents explicit keep/replace confirmation and the owner rejects a stale proposal. Save calls workspace.ask and displays only exact API-confirmed question records. Unresolved acknowledgement/readback uses existing recoverPendingQuestion and locks incompatible edits/return; it is not retried as a new question. Submitted drafts are marked by the owner; New question creates its next draft through that owner. Retained draft choice remains public-owner controlled. Question/reply actors, anchors, reply revisions and attachment identities come from actual Review records, with exact reply evidence actions where the source remains available.

React retains one original presentation frame for an owner excursion: selected identity, camera, expansion, all per-file reading/folds/horizontal positions and comparison mode, function/test lens and older source/test/Context return stacks. StoryBridge retains the original/exploration drafts and story cursor. Return first awaits the owner's transactional resume; failed validation leaves the current presentation and both recoverable draft frames intact. Only success reapplies the React frame, after old-reader cleanup, and focuses the restored reader or graph without browser scroll. This exact local presentation return is bounded to the current React lifetime. Existing private owner drafts/recovery can survive reload, but local folds/camera/navigation frames are not newly persisted: a missing local frame reports unavailable and does not consume the retained owner return frame. Cross-reload exact local reading remains an explicit limitation.

Candidate runtime provenance records the actual Git commit, dirty-state disclosure and SHA-256 digest of its sorted source input manifest; the private manifest retains individual source hashes. A pinned verification restarts only the owned candidate from its clean committed source and reads back the actual Snapshot/story version through the same UI proxy. The retained content is never automatically overwritten when it differs from the authored payload. The notifier remains explicitly unavailable; this does not create, replace or attach a native session or fabricate an agent reply.
