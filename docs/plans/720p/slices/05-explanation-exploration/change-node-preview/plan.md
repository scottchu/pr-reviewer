# Change-node standalone preview

Packet revision: 1.
Date: 2026-10-31.
Status: design preview preparation; product adoption and actual browser acceptance pending.
Parent: [Slice05](../plan.md), [720p round](../../../plan.md).
Source: [Change-node projection study](../../../../../product/change-node-projection.md).

## Current and expected reality

Before starting, all 30 registered worktrees were clean, each HEAD was contained by remote main 300aa123150f8ab2a5ad8185c351a9ab7e121804, and no open PR remained. This verifies prior repository changes are committed and merged. Retained local design artifacts, deployment records and old handoffs are not swept into Git. They remain preserved; proposed/parked directions are reconciled into the linked product document.

The user now requests an inspectable Change-node mockup in preview, after the Git checkpoint. The product endpoint remains unchanged. The proposed outcome is a separate loopback-only sketch and a directly visible static image, because supported browser access currently reports “The browser access host is unavailable.” A native-generated image is design artwork, not a browser screenshot.

## Implementation handoff

Owner/executor: root. Worktree: /Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-change-node-preview. Branch: preview-change-node. Allowed writes: this plan, linked product source/map, and mockups/change-node-preview/. Docs precede derived preview edits. No canonical graph/schema, application source, dependencies, data/config/security/network-boundary or existing endpoint changes. Existing runtime may serve this preview bound only to loopback. No new installation or public exposure.

Use the pinned existing PR25 scripts/pair.ts request() hunk. Keep every shown witness and changed line exact. A single Change card on a graph canvas shows the removed line once, precise identity and reversible native disclosure for Before/After. A link is labeled as a source witness, not inferred verifies_policy. No replacement/PASS/runtime conclusion, no fabricated contextual link and no 3D renderer work.

Acceptance: A1 exact source identity; A2 one changed-line presentation; A3 inspectable Before/After; A4 no unsupported semantics; A5 independently accessible preview and clear live/UI limits. Check source consistency and HTML structure, serve and byte-read back the file, inspect the static artwork, attempt supported browser only. All checks are scoped self-checks unless a named independent reviewer actually performs them.

## Independent-review handoff

Review target will be the committed preview PR with its exact main baseline/head. Read-only reviewer role is reserved, not assigned. Before acceptance, actual candidate UI graph-first reading must freeze an account, then compare this specification and pinned source/diff and critique whether the edit and its limits were understandable. Supported browser unavailable and fixed-PR25 bootstrap prevent claiming the preview PR itself was graph-intaken. A self-check or static artwork does not establish independent review, actual React behavior or unfamiliar comprehension.

Own-PR task: inspect this preview's real PR and explain the documentation/preview-only change, its source-fact example and its deliberate boundaries. The displayed example is PR25, not the preview PR. Preserve both identities; do not claim this sketch supplies own-PR intake capability.

## Delivery and preservation

Publish source/spec via task PR; no merge of this new proposal or replacement of the production endpoint is inferred from the earlier request to ensure the existing baseline is on main. Retain preview source, local operational artifacts and all previous handoffs. Record preview URL, committed source, self-check outcomes and remaining browser/review/adoption gates here. The goal is design review, not application slice completion.

## Observed preview evidence

Date: 2026-10-31.
Source candidate: fb12d68f1659fd86f511c42325a5da6f1df1a257 (the later evidence-only commit does not change the HTML).
Preview: http://127.0.0.1:57944/; loopback-only static server, retained for user design review. The existing product endpoint and deployed source are unchanged by this task.

Self-check PASS: both decoded source-witness blocks exactly match the retained pinned PR25 hunk; removal-only summary, internal anchors, native disclosure, document links and no-script boundary checked; git diff whitespace check passed. HTTP 200 response matches the committed preview HTML byte-for-byte (SHA256 a1c24dfaf7c42c9ad361d13edee549bbf00f928e8d5084dc9379d52dddc38d1f). No application test suite was rerun because no application/graph code or dependencies changed.

A separately generated collapsed-state design image was visually inspected and is available to the user inline. It is artwork, not a browser screenshot or evidence that the HTML has rendered correctly. Actual supported-browser availability probe still reports “The browser access host is unavailable.” Actual native disclosure/link interaction, candidate UI graph-first review, own-preview-PR intake, unfamiliar comprehension and physical-device acceptance are UNRUN. No alternate browser-control route was used.

Outcome: source-backed design preview prepared and locally served; adoption and actual UI acceptance remain open. The reviewer should judge whether the node makes the source removal and its limits understandable, rather than accepting raw entity counts or HTTP delivery as understanding. Preserve the source worktree/server for that review; do not clean up active preview or existing deployment/rollback evidence.

## Revision 2 — existing Tailscale preview access

Date: 2026-10-31.
Latest user request: make this preview accessible through Tailscale instead of a loopback-only link. This narrowly supersedes the earlier no-route-change preview boundary: add only /change-node-preview/ on the existing private HTTPS host/port 8478, forwarding to the existing preview. Preserve the root handler, every unrelated handler/port, Funnel state, credentials and access controls. Do not create a new public endpoint, change the application or replace its build. Save and compare the exact route configuration and root response before/after; require the preview response to match the committed HTML. On failure remove only the newly owned path and retain evidence. Actual browser acceptance remains open.

Tailscale readback: https://mac-mini.duckbill-ionian.ts.net:8478/change-node-preview/ returns HTTP 200 and exact committed preview bytes. The root response SHA256 is unchanged, and full configuration comparison differs only by the requested private preview handler. All unrelated routes/ports and Funnel state are preserved. Actual browser interaction remains UNRUN.

## Revision 3 — Explaining / Diff / Tests

Date: 2026-10-31.
Latest accepted preview direction: one top-down Change card, Explaining then Diff then Tests. Root remains the sole executor; allowed seams and no-product-adoption boundary remain unchanged. Preserve the existing private Tailscale preview path and root application response. No route changes or server restart are necessary for this static preview revision.

A6: explanation is a local source observation with evidence links and explicitly unestablished purpose. A7: native Unified/Split controls expose the exact retained hunk rows/witnesses without JavaScript or new dependencies. A8: Changed/Unchanged tests are an evidence-limited projection; the selected real edit has no established relevant-test association in this preparation, so show the unmet input rather than fabricated tests/counts. Test execution remains outside scope. Source-consistency and HTML structure self-checks plus exact loopback/Tailscale byte readbacks remain applicable; actual browser interaction, graph-first and unfamiliar understanding remain separate unrun gates.
