# Prevent unfinished graph paint on first load

Date: 2026-11-03.
Request revision: startup-paint-R1.
Parent: [Explanation exploration](../plan.md).
Product contract: [Viewport presentation](../../../../../product/viewport-scene.md#first-load-paint-correction).
Status: implementation and local checks passed; independent source review reconciled; root deployment pending. Root still serves main `300aa123150f8ab2a5ad8185c351a9ab7e121804`.

## Scope and observed gap

The reader should see the actual graph after measured layout, without a transient stack of overlapping document/policy cards. The existing root permits semantically eligible content to paint when spatial membership is null. This affects startup and geometry invalidation. The user's screenshot is actual visual evidence; the current supported browser returns `The browser access host is unavailable`.

This is an isolated repair from main, excluding the unaccepted PR45 card experiments. Preserve normal source/code rendering and the whole graph. The separate request to reuse the normal change graph for Test remains open; this repair does not claim to implement it.

## Implementation handoff v1

Owner: root, sole writer in `fix-graph-first-load-paint`.
Inputs: main `300aa12`, existing preview paint-state correction, exact retained PR25 graph hash `946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a`.
Outputs: explicit paint membership, invisible/inert bootstrap measurement, retained paint during invalidation, once-only worker failure notification and regression coverage. No new dependency or network/security setting.

## Independent-review handoff v1

Review this committed packet and the bounded implementation independently. First attempt actual candidate UI observation and freeze the account before source review; if the supported host is unavailable, record that exact blocker and perform source review without claiming graph-first comprehension. Check bootstrap measurement is possible, hidden content is inert, semantic eligibility remains authoritative, reflow cannot flash full content, and explicit worker failure cannot leave startup blank indefinitely.

## Acceptance and delivery

- Pure regression tests: startup, first selection, null scene during reflow, same/new comparison, semantic filter, reader/focus pins and worker failure/disposal.
- React journey regression authored for first-load at 390 and 1440 pixels, including hidden-route hit-test styles; execution requires the supported browser route. Explicit frame-by-frame invalidation sampling remains a coverage gap; pure transitions cover null scenes and retained membership.
- Strict TypeScript, graph regression suite and immutable candidate build.
- Independent review, PR publication and exact running source/build/served-byte verification are separate states.
- Actual first-load pixels, physical-device interaction, own-PR intake and unfamiliar-reviewer comprehension remain open without direct evidence.

Root identity: PID8799, start `Fri Oct 30 15:08:38 2026`, source checkout `pr-reviewer-main-300aa12`, existing manifest independently read. All prior worktrees, credentials, artifacts and preview process are retained. New operational evidence belongs in ignored `artifacts/startup-paint/`; no project `.decompozr` writes.

## Verification and review record

Implementation candidate: `b58ff1d`, followed by the hidden-route CSS correction. Full graph Node suite: 190/190 PASS. Root strict TypeScript and boundary checks: PASS. Minimum graph strict TypeScript: PASS. Production build: PASS, retaining the existing approximately 21.2 MB main-bundle warning. Generated graph bytes match the pinned retained hash; source extraction was not rerun or modified.

Independent reviewer: `startup_paint_review`, separate read-only agent, requested model `gpt-6.1-sol` with high reasoning for React/worker lifecycle risk. The reviewer reproduced supported-host unavailability before source review; no candidate graph-first account or visual acceptance was available. It independently passed the three startup tests and found a hidden SVG hit-test path overriding parent pointer suppression. A specific hidden-route descendant CSS override corrects that finding; no further source defect was found. Explicit reflow paint-sampling coverage remains open.

Reader outcome: the implementation prevents unfinished measured cards from becoming the displayed graph and retains established paint through transient invalidation. Evidence is deterministic transition testing, independent source review and a built candidate; actual device pixels are unverified. The core gap is the unavailable supported browser plus fixed PR25 intake, which cannot dogfood this PR's own changes. The next delivery step is the isolated PR and, once authorized, deployment of its merged-main build followed by actual cold-load observation when supported access returns. PR45 remains separate and unaccepted; the Test-as-normal-change request remains open.

Merge authority for this new repair has not been carried over from the named PR44 merge. No root process, Tailscale configuration or preview process was changed during preparation.
