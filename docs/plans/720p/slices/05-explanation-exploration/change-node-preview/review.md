# Composed graph preview independent source review

Date: 2026-10-31.
Reviewer: independent composed_preview_review agent, read-only fresh context; root records the returned result. Requested model/effort: gpt-6.1-sol / high. Host-effective settings and usage not independently reported.

## Target and outcome

Initial candidate e4e1f0731d3b6599fb34fad16d6fa60904e50e23: SOURCE CHANGES NEEDED. P2: composed Test disclosure/selection, diff mode and source reading were local to viewport-culled components and would be lost on return.

Corrected candidate 1d4eb48bb35076c1561c7095cf2c0ccbb6c2ab3b: SOURCE PASS. State is owned outside culled components for the comparison lifetime and keyed by source IDs; hidden/null DOM cannot replace last-visible scroll. The selected canonical Change supplies a bounded reader pin without widening semantic eligibility. The normal product mount remains unchanged.

Packaging-only candidate 9f95f3ae0084ab20b2c747dc8468e39252d48c26: SOURCE PASS confirmed. Only shared public font packaging and records changed; existing fonts/license are included and CSS uses the correct relative font path. No remaining source blocker was reported.

## Independent checks

The reviewer reran strict preview TypeScript and the source/SSR regression, both PASS. It checked pinned code/test versions and all four SHA256 source hashes, three directly imported createGateway Tests (added16 Assertions, unchanged6/7), canonical contains identities, complete graph retention, actual shared FileDiffBody/syntax reuse and the inactive default mount seam. It inspected the updated source and root/build/187-test logs without claiming an independent rerun of every check. It checked the reconstruction regression and pin/semantic-eligibility assertions. Worktree was read-only and unchanged by review.

## Evidence boundary

Supported browser inventory before source review returned no browsers and “The browser access host is unavailable.” No alternate control route was used. Actual candidate rendering, graph-first UI account, DOM unmount/scroll restoration, visual overlap, Test/Assertion interaction, unfamiliar comprehension and physical-device gates are UNRUN. A source/SSR reconstruction is not a browser lifecycle test. The older preview URL was not treated as evidence for the new candidate.

## Transport follow-up

The user subsequently reported blank/loading. At712fb7528e26bbeecf23cf5f277e95fcd46efbf6, the reviewer found P2: an unhandled invalid request URL could terminate the preview process; its isolated ephemeral child reproduced ECONNRESET/exit1 with an invalid target. At703f683d03b771c2666efe7b281299d9dc876ad2, scoped transport SOURCE PASS followed catch-and400 handling and an independently rerun regression proving a subsequent normal request succeeds on the same server. No deployed runtime was touched by the reviewer. This review does not establish the cause of the mobile loading report or successful rendering after compression.

## Safari crash diagnostic follow-up

Bounded independent source investigation did not identify a demonstrated new unbounded camera, state or measurement loop. Initial camera is one-shot; header values are equality-guarded; the added reader pin is one entity. SSR markup is finite and Node heap/geometry measurements are not WebKit evidence. The user's repeated-web-content-error screenshot takes precedence over prior source PASS for actual usability.

At3ffea3746daf2a6d9b78bac2854e9b34109a5e4c the diagnostic seam received scoped SOURCE PASS. Two telemetry fitness issues were corrected before deployment: manual camera control retains header logging, and measured-stage power-of-two sampling preserves heartbeat/error capacity. Independent pure reporter simulation:500 callbacks/stage produced37 events total. Independent strict types and transport1/1 pass; interrupted POST did not terminate an isolated server. No actual browser, deployment or crash recovery was claimed by the reviewer.

## Edge-animation control

Independent source comparison confirmed the preview's global old stylesheet adds a240ms SVG d transition absent from the baseline minimum entry. A preview-only later transition:none rule restores baseline edge behavior and preserves shared reader/syntax styling. This is a source-confirmed side-effect correction and an isolated rendering control, not evidence that WebKit performed that transition or that it caused the crash. Root verified unchanged built JS/worker content hashes and the final overriding CSS rule.
