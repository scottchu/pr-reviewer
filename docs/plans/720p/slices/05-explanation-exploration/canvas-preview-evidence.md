# Unified canvas preview evidence and feedback handoff

Date: 2026-10-24
Status: inspectable preview delivered; layout adoption and independent understanding unrun
Implementation source: e057ea0360504d2be6ba6b071eb2b7d5cf84b1a0
Branch: preview-unified-reading-canvas
Worktree: /tmp/pr-reviewer-canvas-preview
Parent: [implementation packet](canvas-preview-implementation.md), [C1–C10 acceptance](canvas-reading-mockup.md), [separate subsystem map](subsystem-mockups.md)

## Inspect the running preview

URL: http://127.0.0.1:56671/
Runtime: existing Bun1.4.2, Vite8.0.3, React/React Flow from the installed integration donor
Listener: task-owned Bun PID96872 on loopback56671
Launch: existing Bun invokes node_modules/vite/bin/vite.js with root previews/canvas-reading, host127.0.0.1, port56671 and strictPort
Stop after root/user inspection: signal TERM to verified task listener PID96872, after rechecking its command/path/port identity; never stop an unrelated replacement listener

The live server serves the committed preview source, not production src/. It has no gateway/proxy, database, participant or test execution connection. The compiled preview build is retained separately under /tmp/pr-reviewer-canvas-preview-evidence/dist; it is not deployed or installed. No main/GitHub/runtime configuration/pilot state was changed.

## Source and build provenance

Real project PR25: https://github.com/scottchu/pr-reviewer/pull/25
Reviewed source head: e3b270e5f49a9215452b0b86702946043e979059
Reviewed base: b096826e31c0927190806de91ed70b8b64aa93d8 (actual first parent of that merge)
Preview design input: c9230830fddbe0624132eee8423beb2c546d71c1
Comment/subsystem amendment: cc50132, consumed through a task merge

The source-capture check rereads fixed raw Git objects and confirms every fixture byte/blob/hash. Changed request is base24–32/head25–33; expanded retained context is base22–33/head23–34. Unchanged refresh is base34–44/head35–45 and its extracted body hashes/bytes are equal. The added local-access.ts has no base file. Both graph calls retain exact pinned call/import evidence; manually observed source binding is not admitted analysis/runtime evidence. No source was reformatted: soft-wrap opportunities use DOM wbr elements while code textContent remains byte-equivalent per original line.

Build manifest: /tmp/pr-reviewer-canvas-preview-evidence/build-manifest.json, SHA2564e7c55e3edddbb91c698381b98e8004a1b5957c566879908b1576565e0c98ab5, source e057ea0. JS assets/index-CI-W_Yy-.js is428820 bytes, SHA256c9ff5758cbbc71be7560c51b8f3ad30ea087a3900854531e56769cd71fa37e4f; CSS assets/index-BYps32YJ.css is27110 bytes, SHA256e0abdc669038886ba0e43d328261a8b623889f7ac88292c6430b55b299bf5ed3. Vite build passed. Node's hardened app runtime initially refused the native Rolldown library with a Team-ID mismatch; the already authorized existing Bun Vite path succeeded with no security flag, signing/configuration change or installation.

## Actual interaction evidence

| Check | Observation |
|---|---|
| C1 | Overview contains real request before/after, unchanged refresh, added helper, explicit no-base text and scoped unknowns; entry works from the change and caller. |
| C2 | Keyboard Focus and actual zoom disclosure reach the same inline before/after code. Original exact text/line labels remain in React Flow nodes; entry brings the changed line into its source scroller. Context expansion adds exact retained adjacent source in place. |
| C3 | Unchanged refresh is read in the same scene with request still graph-connected. Added helper preserves the missing-base state. |
| C4 | Line/range selection and actual code text selection produce explicit source-side/path/range comment intent without overwriting the prior draft. The authored source link focuses after line30. |
| C5 | Actual UI focus→neighbor→Back→Resume restores the entire captured frame: viewport, expansion, inspected span, story version/cursor and prior draft. Separate local thread drafts survive navigation. Pure tests additionally cover pre-zoom frame capture. |
| C6 | Missing base file and bounded-source unknowns are visible. No source/test presence becomes execution, network-isolation or passing-test evidence. |
| C7 | Actual Chrome390px touch path keeps labeled before/after nodes stacked in the same graph, reaches comment/neighbor/return and has no document-wide horizontal overflow. It is a long vertical scene, not final mobile acceptance. |
| C8 | Actual source text selection does not pan the canvas. Browser tests cover keyboard/touch controls and close-focus restoration; screenshots were separately inspected as described below. |
| C9 | Code and prose selections open local contextual comment/reply drafts beside their content; marker authors explicitly distinguish Human and simulated Agent. Prose carries content/version/SHA256 plus exact UTF-16 offsets/quote, with no fabricated backend source anchor. |
| C10 | Collapsed code markers cluster mixed authors by anchored line/group and count threads. A scoped Comments list locates the same records. Zoom/lens/Back/Resume do not move anchors or discard thread drafts;390px marker bounds remain inside reserved lanes. Full discussion density/history/failure behavior belongs to its separate staged mockup. |

Four pure-state tests pass. Five actual Chrome E2E tests pass in4.4s; they include the pinned text equality check, keyboard Focus, zoom, helper absence, code/prose threads, native code selection/no pan, controlled canonical prose Range selection,390px touch, exact Back/Resume and zero /api requests in the main journey. The prose Range path uses an explicit browser-native DOM Range fixture; physical multi-block selection and OS selection handles were not established. Strict preview TypeScript, exact Git source fixture, canonical prose SHA256 and git diff --check pass. Production src/scripts/tests/package/lock/Playwright config remain byte-identical to c923083; the consumed amendment changes docs only.

Evidence root: /tmp/pr-reviewer-canvas-preview-evidence
E2E log: e2e.log SHA25660c8c79eabbbcfe9e795333bb51f9cc8a7d3580fdd486c5565970527ca522e3e
Pure log: state.log SHA2565a1bd8101df5425dfbf17c781922ba9508252f4e53ae813a3bd9a568e9ba2289
Test entrypoints: previews/canvas-reading/state.test.ts and canvas.e2e.ts; isolated external Playwright config at the evidence root. These design-preview tests do not change the product normal test inventory or establish its broad regression result.

Screenshot paths relative to the evidence root:

- e2e/canvas.e2e.ts-real-pinned--c8e7f-ain-the-exact-private-frame/overview.png
- e2e/canvas.e2e.ts-real-pinned--c8e7f-ain-the-exact-private-frame/focused-comment.png
- e2e/canvas.e2e.ts-real-pinned--c8e7f-ain-the-exact-private-frame/unchanged-neighbor.png
- e2e/canvas.e2e.ts-real-pinned--c8e7f-ain-the-exact-private-frame/exact-return.png
- e2e/canvas.e2e.ts-zoom-disclos-608d8-out-inventing-a-counterpart/added-helper-missing-base.png
- e2e/canvas.e2e.ts-code-prose-c-a3eef-and-close-focus-restoration/prose-thread.png
- e2e/canvas.e2e.ts-narrow-touch-a6d0a-outside-text-number-columns/narrow-stacked-source-thread.png

## Readability critique and limits

The inspected desktop comparison keeps the unchanged caller above the source and the added helper below; color is limited to explicit removed/added/modified/unknown labels. Code is13px monospaced at focused scale, with actual lines and reserved marker lanes. Prose remains an adjacent graph node; mixed-author badges and the thread's explicit anchor make the local target inspectable. The first screenshot review found code entry below the relevant change and insufficient gap after expansion; entry scrolling, retained node measurements and measured reflow corrected those. Actual tests also found noninteractive React Flow wrappers and lost dimensions/focus during local draft edits; pointer ownership, retained measured sizes and staged close-focus restoration were corrected, then all five journeys passed.

Remaining concrete tradeoffs for user feedback:

- Narrow reading is a long vertically stacked canvas. Both sides and the neighborhood exist, but reaching the after side or returning to the top controls takes scrolling. This is coherent state, not a final navigation-effort decision.
- A thread expands inside its source-node scroll region, avoiding a wall of overlapping bubbles. Opening it can move part of the highlighted code above that inner scroll area; the exact span label remains, but simultaneous quote/thread readability needs human feedback.
- Exact compact repository source wraps at punctuation. It remains real source rather than a prettier invented snippet, but the long header expression is visually dense. Supplemental formatting would need an explicit representation decision.
- Full-page screenshots taken while scrolled retain the sticky desktop toolbar at its viewport position; the running preview is the primary inspection surface.
- This bounded scene has manual source relationships and a local story frame, not a live admitted semantic corpus or production StoryBridge. Code anchors are scoped to this fixed preview source account. Arbitrary prose persistence, native agent delivery, historical comment versions, multi-block selection and complete discussion density/failure states are not implemented.

Engineering checks and this author's screenshot critique do not establish user layout adoption, unfamiliar understanding, physical touch/OS selection, full product E2E or production acceptance. Do not integrate the composition automatically.

## Feedback gate, independent handoff and preservation

Stop at this inspectable preview. Root/user feedback owns layout adoption; a fresh reviewer must first freeze an account through the running canvas before comparing source. The author-informed private expected account is /tmp/pr-reviewer-canvas-preview-evidence/private-expected-account.json, SHA256b0d122a18ccdcd9a754bbecadbd1c329713bd132218f6f0cb3ed052978dc76e4. It is not an independent verifier result and must stay hidden from the blind phase; root can validate it independently. No preview reviewer or user has accepted this layout yet.

B2 was separately reconciled docs-only at3e32351 on implement-head-test-react: test evidence must attach to the same canvas; its standalone panel remains superseded. Other subsystem mockups remain staged, not built here. Production integration, all source/command/storage/host contracts and any release remain separately assigned.

The task worktree/dependency entry links, live listener, external logs/build/screenshots and private expected account are retained for active root/user review and are not disposable. Temporary debug logs/scripts remain task-owned evidence for the bounded input/focus corrections; no shared runtime was stopped. Source decisions, actual results, caveats and restart/stop instructions are preserved here so continuing work does not depend on chat. Clean up only after the review dependency ends and root confirms source/evidence preservation; preserve the primary checkout and unrelated pilot listeners.
