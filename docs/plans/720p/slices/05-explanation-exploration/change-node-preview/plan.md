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

Revision 3 self-check: top-down section order, exact original split witnesses, unique evidence anchors, mutually exclusive native radio views and no-script boundary PASS by source/HTML inspection. Loopback and existing Tailscale preview each return HTTP 200 with exact committed HTML bytes (SHA256 c9fbf5c476e906bb7e46b91799cda8edfbf2aeb0028640b51b3b74fb7c33165d). The product root response SHA256 remains unchanged. Actual browser view switching, source reading and comprehension remain UNRUN; no stale artwork is evidence of the new layout. The test-linkage gap is intentionally visible.

## Revision 4 — whole graph, shared highlighting, representative tests

Date: 2026-10-31.
User evidence: mobile screenshots show plain, unhighlighted source and empty tests. These are preview failures. The user wants the whole graph to project composed content; source rendering must reuse the existing shared component, and the chosen positive example must contain relevant changed and unchanged Tests.

Scope correction: replace the isolated HTML sketch with a separate React candidate using the existing complete graph, session and renderer. Root owns the preview source and a minimal optional presentation-only mount seam in ReviewGraph. Default product entry and canonical data are protected. Reuse FileDiffBody/SyntaxCode and existing styles; no new dependency, ontology relation, test execution or product deployment. Additive mount options may supply selected Change-body content and initial focus; the body participates in measured group-header clearance. Preserve the existing Tailscale path, root response, unrelated routes, preview rollback and exact source/build identity. Cut over only the owned loopback preview server after the candidate builds.

Sample: pinned PR25 createGateway() change; one added and two unchanged gateway Tests with 16/6/7 source Assertions. Verify imported direct calls within each exact test range, canonical contains relations and both source hashes/versions. Static association is source evidence, not semantic policy verification or runtime coverage. The full graph and all underlying source entities remain available; Test/Assertion presentation inside the card reuses their identities.

Acceptance A9: full graph/session preserved, composed selected Change header is measured, default entry unchanged. A10: shared reader and syntax pipeline in code and test Unified/Split views; inspect server-rendered token markup and exact source strings in addition to type/build checks. A11: changed/unchanged representative Tests and Assertions are present, selectable into source reading, and not labeled run/PASS. A12: exact candidate HTML/JS/CSS assets served at existing private preview path, product root preserved; actual CUA and unfamiliar understanding remain separate gates.

Independent-review assignment: fresh reviewer other than root, read-only exact committed candidate, scope A9–A12 and regressions in the inactive-by-default seam. Source checks can proceed if supported browser remains unavailable; reviewer must retain graph-first/UI/comprehension as unrun, not source PASS. Record exact dispatch after candidate commit.

Revision 4 source checks: strict preview/root/minimum TypeScript, subsystem boundaries, production-format preview build and the source/SSR integration check pass. SSR exercises the actual shared reader in Unified and Split for code and all three Tests, checks keyword/string token markup, 29 canonical Assertions, directly imported source calls and unchanged canonical graph serialization. These are source/SSR checks, not browser rendering. The build has the existing large-chunk warning; no unrelated bundle optimization is included.

Review assignment selection: fresh no-history independent source reviewer, gpt-6.1-sol / high. Rationale: a bounded React measured-layout seam and reader reuse need independent lifecycle/provenance scrutiny; no whole-product redesign is assigned. Escalation trigger: unresolved default-entry regression, invalid static test association or header geometry issue after one bounded correction. Effective host settings/usage are reported only if available. Reviewer packet is this committed revision 4 plus exact candidate head/base in dispatch; root is sole writer. Required return: concrete findings, performed checks, source conclusion and separate actual-browser/graph-first gaps.

Independent source review of e4e1f0731d3b6599fb34fad16d6fa60904e50e23: CHANGES NEEDED, P2 composed reading state was local to viewport-culled components. Accepted correction: comparison-owned canonical-ID-keyed state outside conditional content, last-visible reading capture, controlled Test disclosure and explicit bounded reader pins, plus reconstruction regression. Existing source provenance/shared-reader checks passed independently; actual browser remains unavailable. No candidate cutover until corrected source review. The retained prior static preview remains served from its preserved artifact while the new candidate builds separately.

Independent re-review: SOURCE PASS at 1d4eb48bb35076c1561c7095cf2c0ccbb6c2ab3b; the P2 state/pin issue is resolved at source level. Preview strict TypeScript and source/SSR reconstruction were independently rerun and passed. Root reran root type/boundary checks, build and 187/187 graph regressions. Browser/DOM lifecycle/geometry, graph-first and unfamiliar comprehension remain unrun. Reuse the existing shared public font assets in the separate preview build so it does not rely on the product root for those assets; this packaging-only change does not change reviewed reader or renderer code.

## Revision 4 preview delivery

Date: 2026-10-31.
Candidate source/build: 9f95f3ae0084ab20b2c747dc8468e39252d48c26, isolated preview-change-node task branch, SOURCE PASS independently confirmed including font packaging. [Source review record](review.md). Later evidence-only commits do not change this built candidate.

The retained private preview URL now serves the full-graph React candidate: https://mac-mini.duckbill-ionian.ts.net:8478/change-node-preview/ . Existing canonical graph/session and surrounding source nodes remain present; the representative createGateway Change boundary is composed, rather than every graph node being replaced or semantically regrouped. One added Test with16 Assertions and two unchanged Tests with6/7 Assertions provide the positive example. Both code/test readers use the real shared source/diff and syntax pipeline. Tests are not executed.

Preview runtime PID36863 serves an immutable task-owned build copy; HTML/JS/CSS/worker/font/license at loopback and Tailscale yield12 HTTP200 responses with exact built bytes. The original product root response and complete Tailscale configuration are unchanged by this cutover. This is an isolated test-candidate preview, not a main deployment. The previous static preview is retained as task-local rollback; all earlier deployment/worktree/handoff evidence is preserved.

Root verification:187/187 graph regressions, preview/root/minimum strict types, subsystem boundaries, source/SSR/reconstruction and build pass. Shared-reader syntax tokens are verified by source/SSR, not by screenshot. The exact candidate browser attempt still returns “The browser access host is unavailable.” Actual pixels, Test/Assertion switching, Unified/Split interaction, viewport restoration, graph-first own-PR intake, unfamiliar comprehension and device acceptance remain UNRUN. Earlier mobile screenshots establish the old preview failure and are not relabeled as new-candidate acceptance.

What this makes easier: read a real code change, challenge its source-backed explanation, and inspect real added/unchanged Tests and Assertions in the whole-graph context. Evidence supports the source/model/served artifact claims only. Core remaining gap: actual reading/interaction and independent understanding at this exact candidate. Next step directly serves the original goal by verifying this composed reading journey without changing canonical semantics or the normal product entry.

## Revision 5 — preview cannot be seen

Date: 2026-10-31.
User report: cannot see the updated preview. Supported browser remains unavailable; the user is asked to distinguish blank/loading, old card or graph without the composed card. Do not assume a camera cause. Actual delivery logs show repeated JavaScript-transfer BrokenPipe errors; the current whole-graph bundle is approximately26 MB uncompressed. This supports a transport problem to investigate, not a proven browser root cause.

Bounded correction: serve the exact immutable candidate bytes through an owned loopback-only static handler with standards-compatible gzip negotiation, retaining identity responses and correct MIME/Vary headers. No graph, renderer, root endpoint, source model, ACL/Funnel or route changes. Use the existing Node runtime, no dependency installation. Re-read every plain and gzip-decoded response at loopback/Tailscale and preserve the existing root response. Transport checks do not prove browser rendering. If the user instead reports a camera/layout issue, reconcile that separately from this observed delivery defect.

Transport source review found P2 at712fb75: malformed request-target parsing could throw and terminate the handler process. Catch URL parsing errors and return400; regression sends the malformed target then verifies a normal request succeeds on the same server. No runtime cutover occurred before this correction.

Revision 5 observed delivery: the user supplied a mobile screenshot confirming a blank/loading page, not merely a missing card. Repeated asset-transfer disconnects remain observed; no unsupported browser-root-cause claim is made. Independent transport source review closed the malformed-target P2 at703f683d03b771c2666efe7b281299d9dc876ad2 and independently reran1/1 transport checks. Strict preview types also passed.

The preview now serves the same immutable9f95f3a graph build through the reviewed Node transport, PID41264. The main JavaScript transfers2,878,662 gzip bytes rather than26,331,154 identity bytes; decoded hashes are identical.24 HTTP200 checks cover all6 assets at loopback and Tailscale in identity and gzip modes with correct headers and complete decoded bytes. Product root bytes and current Tailscale configuration remain unchanged. The previous static server/build are retained for rollback.

User retry URL: https://mac-mini.duckbill-ionian.ts.net:8478/change-node-preview/?v=transport-r5 . This reduces an observed delivery burden; actual browser rendering and the underlying user-visible failure are not yet confirmed resolved. Browser/graph-first/comprehension/device gates remain open. Do not substitute this transport readback for actual UI acceptance.

## Revision 6 — confirmed mobile web-content crash

Date: 2026-10-31.
The user reports that the graph loads, changes camera, then crashes; a Safari “A problem repeatedly occurred” screenshot establishes a web-content process failure. Compression does not explain or resolve that runtime failure. Do not ask the user to keep blindly retrying or label HTTP delivery as recovery.

Independent bounded source diagnosis found no demonstrated infinite camera or measurement loop. A direct Node model run (not browser) of the real candidate session has239 nodes/298 links, stable repeated dimensions and roughly50–85 MB heap during five modeled layouts. The first Vite-SSR profile's700 MB heap included compiler tooling and is not a browser estimate. Independent source/SSR footprint is finite:2268 markup tags,246 source rows,426 syntax spans. These measurements do not establish WebKit allocation or rendering behavior.

Next bounded diagnostic: instrument only this preview with at most40 numeric startup/layout/header/reflow/camera/heartbeat events and caught error names/messages, sent to a same-origin private diagnostics handler. No user agent, cookies, credentials, source text, query strings or user input are collected. The handler accepts a fixed schema with bounded request size and writes only to the owned ignored preview log, not a public read endpoint. No root application or network/security change. A diagnostic camera=manual query provides a one-variable control without removing graph data or shared readers. Actual traces are needed before attributing the failure to allocation, repeated bootstrap or camera/compositing. Keep the established source/SSR and transport evidence distinct from actual mobile acceptance.
