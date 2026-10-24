# Unified canvas preview implementation packet

Date: 2026-10-24
Status: concrete preview scope before implementation; user layout feedback pending
Revision: preview1
Author: implement_head_test_react
Inputs: committed design c9230830fddbe0624132eee8423beb2c546d71c1; [mockup acceptance C1–C8](canvas-reading-mockup.md); [same-canvas contract](../../../../product/review-loop/canvas-reading.md)

## Pinned source and honest graph meaning

Use the real own-PR25 auth change, merge head e3b270e5f49a9215452b0b86702946043e979059 and its first parent b096826e31c0927190806de91ed70b8b64aa93d8. The preview copies exact source bytes from Git objects; no backend or production data is opened. The representative changed group is application/review.ts request: base24–32 and head25–33. Its header construction changes from an unconditional Bearer to accessHeaders(captured). The unchanged caller refresh is base34–45/head35–46 only after exact body-boundary verification; the capture script determines its final bounds and asserts byte equality. The newly added application/local-access.ts has no base file; show that absence explicitly, never an empty equivalent function.

Graph relations are narrowly source-observed: refresh contains a direct local request call, and the head request calls imported accessHeaders. Retain exact call/import spans and label this manual pinned-source observation, not admitted analyzer facts/runtime execution. The before/after request relation is an explicit preview comparison, not a call/equivalence assertion. The unknown card says the bounded source group does not establish external callers, runtime reachability, Tailscale configuration or test success. A private source-informed expected account is kept outside Git for the root's independent reviewer; this author cannot be the fresh blind reviewer.

## One inspectable scene

The isolated ReactFlow scene retains stable source-node identities. Overview shows the changed request, its unchanged caller, the added dependency and an explicit missing counterpart. Focus source and selected-node zoom enter the same reading lens: before-left/after-right actual lines inside graph nodes, while the nearest caller remains graph-connected. The narrow layout stacks those same source nodes, with navigation to both sides rather than a replacement viewer. The selected group alone expands; source scroll/text selection never drags the graph.

Follow unchanged caller or dependency in place. Back restores one exact private frame; Resume restores the first authored preview frame. A frame includes selected group, lens, viewport, expanded context, selected source span, story version/cursor and local draft identity/content. Zoom/focus/neighbor never rewrites a question anchor. Selecting lines offers explicit Ask about these lines; the local draft is another connected graph node and is clearly labeled memory-only, no submission/agent/persistence. Authored evidence links focus their precise retained span in-canvas. No API/Helpers orientation selector, external inspector, separate file route, test result or live backend request is added.

## Editable files and launch

All derived preview files live in previews/canvas-reading/: source fixture/account, pure presentation state, React scene/style, index.html, standalone strict preview compiler config, source-capture/check and meaningful unit/browser checks. Production src/, backend/data, package.json, lock, existing Playwright config and other runtime files stay read-only. Owning05 preview packet/evidence are the only tracked docs writes here. Dependencies use read-only package-entry links from the already installed integration donor; caches stay real task-local ignored directories.

Launch existing Vite against the isolated preview root on a freshly checked loopback port, proposed 127.0.0.1:56671; fail on occupation without stopping its owner. No gateway/proxy, pilot/Tailscale/native/browser-profile configuration, install or global setting. Logs/config/screenshots and private expected account use task-owned /tmp/pr-reviewer-canvas-preview-evidence after exclusive creation. Stop instructions record the exact spawned Vite PID. Preserve the running preview for root/user inspection; do not integrate production or publish/merge automatically.

## Meaningful verification before feedback

First write pure-state checks for exact back/Resume and independent anchor/draft behavior, then actual React interaction checks. Verify source hashes/blob IDs and unchanged-body equality against the pinned raw Git objects. Strict-check only the isolated preview. Actual Chrome exercises keyboard Focus, zoom disclosure, unchanged neighbor, explicit line range/draft, authored evidence, context expansion, exact private frames, desktop and390px no document overflow/text selection. Capture overview/focus/neighbor/return/narrow states and separately critique actual reading scale, line wrapping, side identity, edge direction, controls and preserved context. Automated pass and screenshots are engineering/layout evidence, not human comprehension or user adoption. Stop after the running inspectable preview and report feedback gates.

## Committed comment/subsystem amendment

Source amendment: cc50132, consumed through a task merge before acceptance work.
Status: C9–C10 added to the current preview; other subsystem examples remain separately staged.

Read canvas-comments.md and subsystem-mockups.md. The current scenario adds selected-code and immutable prose selection, local-only human/agent threads/replies, content-adjacent badges, collapsed-group clustering, an accessible locate list and keyboard/touch alternatives. Prose anchors include stable ID/version/hash and exact UTF-16 offsets/quote; no prose AskQuestion/persistence schema is implied. Code keeps exact pinned commit/side/path/line identity within the explicit preview source set. Reserved marker lanes and in-node threads avoid covering content. This is the small canvas-context demonstration, not the complete discussion subsystem mockup.

[Inspectable preview receipt](canvas-preview-evidence.md) records the running endpoint, immutable source/build, C1–C10 evidence, critique and feedback gate.
