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
