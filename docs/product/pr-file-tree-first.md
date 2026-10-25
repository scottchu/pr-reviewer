# Change-centered PR file workspace mock

Date: 2026-10-24.
Status: current accepted requirements for a bounded inspectable mock. Earlier flat-card/nested-card/import-led iterations are historical in the [owning packet](../plans/720p/slices/05-explanation-exploration/reviews/pr-file-tree-mockup-v1.md). This specification supersedes their layout and relationship directions. Production integration, layout adoption and unfamiliar-reviewer comprehension remain separate, unverified gates.

## Purpose and boundary

A reviewer should see what changed and the directly relevant behavior relationships without reading an entire project or learning a control console. The whole changed-file tree provides orientation; continuous source comparison and change-centered direct-call neighborhoods provide evidence. Preserve the original October23 dark editor/Inter/quiet-chrome foundation. This mock has no backend/data/participant/network effects and is not a new parser, analysis platform or production composition.

## Current requirements and observable acceptance

### F01 — Whole-PR compact spatial file tree

All50 changed PR25 paths exist immediately under directory containment branches. Each compact bounded file object shows its basename and small Git change mark only; no giant prose/function cards. Full-path/kind IDs distinguish duplicate names. Directory edges mean contains. Drag/scroll pans; pinch/Control-wheel and keyboard zoom remain available; Overview returns readable root framing. The canvas fills the window without outer page scrolling. Not all50 must fit the first viewport at legible scale.

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

Default review relationships are actual source-grounded direct callers/callees relevant to **selected changed function/declaration or changed-callsite seeds**, with only necessary one-hop unchanged context. Preserve whole50-file tree membership, but do not dump every function, every call in the selected file or a whole-project graph. Static imports are off by default; the retained import fixture is secondary historical evidence, never call/runtime claims.

Prepared scope: review.ts changed request; local-access.ts added accessHeaders; storage/public.ts changed local authenticate; storage/access.ts added accessReference/localPrincipal. Show only selected-file seeds and incident direct base/head calls. Gray unchanged refresh retains both exact source occurrences and its identical-body evidence; unchanged source does not prove unchanged behavior under a changed dependency. Other files/scopes remain explicitly unprepared, not no-calls leaves. Further neighbors are not automatically expanded.

Acceptance: representative review.ts and storage/public.ts overlays contain only incident changed-seed neighborhoods, callers point to callees, exact source/range identities remain inspectable, and unrelated packet edges stay hidden. Do not guess counterparts by name, connect HTTP/port dispatch to a closure or fabricate gateway/store calls.

### F11 — Provenance, sides and frontiers

The root-prepared client packet contains16 **source-observed** calls, with analyzer obstructions retained; storage contains14 **statically resolved** admitted edges. Keep those certainty classes distinct. Retain every base/head anchor and callsite; coalescing needs explicit comparison/source-counterpart evidence. Both corpora are selected-context, not repository enumeration. Missing binding, unsupported dispatch and unprepared sides remain honest frontiers; absent added source is not an empty before declaration.

Acceptance: pure selected-seed filtering/referential integrity, exact packet hashes/source anchors, separate provenance in secondary evidence and no fabricated runtime/security/coverage statement. Do not change the analyzer, add globals/dependencies or enlarge its budgets to improve this mock's appearance.

### F12 — Correct relationship ports and routing

Containment enters the left boundary. Actual outgoing behavior relationships leave the file/function's right boundary; incoming targets use the appropriate left boundary. Use explicit port IDs and refresh measured handle bounds after group geometry changes. Route actual arrows outside readable code/text, with truthful caller→callee direction. Stale compact widths must not make expanded relations fan from the top-left containment point.

Acceptance: inspect real closed/expanded world coordinates and actual SVG endpoints; source endpoint matches the right boundary after animated expansion. No default import spaghetti or invented calls. This requirement applies to the upcoming call projection, not an assertion that the currently hidden import renderer proves it.

## Evidence, responsibilities and retained larger design

### F13 — Immutable PR fixtures and local responsibilities

PR25 baseline b096826e31c0927190806de91ed70b8b64aa93d8 / head e3b270e5f49a9215452b0b86702946043e979059.50changed paths:4added46modified0deleted;126native hunks at Git unified context3 (-U3), distinct from the historical163 zero-context (-U0) change blocks; +492/−192lines;96available full source sides. Full-source hashes cover UTF-8 bytes; source anchors use exact half-open UTF-16 offsets and1-based lines. Full source exists for context expansion. Preparation is local read-only Git evidence, not a production parser/import/runtime capability.

Pure projections own paths, native rows, folds, source coordinates and selected change neighborhoods. React owns local presentation/input and reports immutable per-file reading snapshots outside conditional renderers. This preserves A across B-only rendering without keeping unrelated DOM visible. Scroll updates do not cause broad per-frame React publication. Source text selection and horizontal/vertical scroll own their input; graph pan/zoom owns the canvas surface. Earlier nested-ReactFlow store/height/pointer failures are historical lessons, not reasons to retain the rejected card layout.

### F14 — Larger experience remains explicitly future

Anchored human/agent comments, floating anchor-adjacent identity/thread, exact code/prose selection, discussion delivery/persistence and broader left/right lens composition remain in [canvas comments](review-loop/canvas-comments.md), [canvas reading](review-loop/canvas-reading.md) and [review experience](review-experience.md). The larger whole-PR graph with necessary unchanged context, left context/right detail lenses and bottom anchored discussion remains retained design direction. These are not silently dropped, implemented or accepted by this bounded file-reader mock. Story is an optional future attention overlay, not graph membership. No participant attachment, commands, notification effects or production test execution is added here.

### F15 — Honest verification and acceptance boundaries

Author Chrome/Playwright, synthetic touch, source audits and static captures are engineering/design evidence. They do not establish physical-device/trackpad performance, native-host behavior, live-agent execution, whole-PR semantic coverage or unfamiliar-reviewer comprehension. The independent UI-first browser gate remains denied/unrun; no alternate route or policy retry. Geometry/timing are proposals. Fixture-rich bundle cost, long horizontal source reading and dense touch/navigation remain limits. Maintain exact source/build/review/evidence pins in the owning packet, with passed, failed, historical and pending states distinct. No main/GitHub/production integration/deploy is implied.


### F16 — Relevant test lens (new, implementation pending)

An explicit accessible icon test-lens toggle reveals only source-backed tests relevant to the selected changed function: file → function → concise test summary → same-canvas test diff. Summaries explain the actual assertion/risk, not a run result. Test definition/callable/ranges and its relation to the changed function require exact source evidence; relevant unchanged tests can remain context. Clicking uses the same continuous red/green/yellow diff scoped to the selected complete test callable and its intersecting native hunks, with exact source sides/absence. Preserve native hunk context that extends a little beyond that callable; do not display unrelated changed tests as if they were selected. An unchanged relevant test shows unchanged source without fabricated change dots. No all-test dump, autorun or invented mapping. Discovered tests never mean PASS; unavailable/unknown relationships remain explicit.

Acceptance: bounded prepared changed-function/test mapping, relevant-only toggle and navigable summary/diff/return with exact test-function source. Actual execution is separate and absent in this mock. Root-prepared representative mapping is available; deriving the lens remains the next bounded projection after the continuous-reader checkpoint.
