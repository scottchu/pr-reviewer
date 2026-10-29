# V36 implementation evidence

Date: 2026-10-28. Status: local implementation candidate; review, exact-main delivery and live journey remain open. Parent: [plan](plan.md). Specification: [viewport contract](../../../../../product/viewport-scene.md).

## Scope and reader outcome

The candidate makes steady-state navigation of existing source evidence cheaper by reusing a spatial index, mounting selected heavy content/relations, caching presentation and deferring closed source readers. It adds no semantic coverage or changed visual composition. Canonical graph identity, source witnesses, default/20/40/Hide projections, status/text/colors, paths/test lane and existing gesture/layout policy are preserved by scoped source/pure evidence; actual visual/interaction preservation is UNRUN.

## Observed local checks

- `npm run check`: PASS, root strict TypeScript and declared subsystem boundaries.
- `npm run check:minimum-graph`: PASS, normal graph preparation plus owning strict TypeScript including authored browser regressions.
- `npm run test:reading-journey`: PASS, 144 tests through the normal wildcard owning entrypoint (baseline 134). Includes the unchanged exact frozen source/canonical/projection oracle, 10 added spatial/worker/cache/pin cases and actual worker entry in a dedicated Node thread.
- `npm run build:minimum-graph -- --outDir ../../.decompozr/flow/run/viewport-scene/build`: PASS. Separate `scene.worker-CD3ness5.js` asset, 2.96 kB. Main application asset remains about 21.18 MB uncompressed / 2.19 MB gzip; resident canonical payload is deliberately unchanged. Existing large-chunk warning retained.
- `git diff --check`: PASS.
- Actual React/browser tests: authored in `viewport-browser.spec.ts`, reachable from both existing minimum browser configs; UNRUN. Root retried supported browser control and received host-unavailable. No alternate Playwright/browser process was launched.
- Independent unfamiliar-reviewer understanding: UNRUN; source/pure checks do not establish it.

Raw logs are retained under ignored `.decompozr/flow/run/viewport-scene/`: `baseline-prepare.log`, immutable pre-edit `baseline.json`, `check-final.log`, `minimum-final.log`, `reading-tests-final.log`, `index-bridge-tests.log`, `build-final.log`, `candidate-benchmark.json` and candidate `build/`. The existing preservation suite also writes its normal report under `.decompozr/flow/run/source-pipeline/`. No dependency target or previous deployed checkout was modified.

## Repeatable workload and limits

Run `node --experimental-strip-types mockups/pr-file-tree/benchmark-viewport.ts` after normal graph preparation. The workload uses 100 queries on separated scenes of 1000/10000/50000 rectangles, plus the pinned PR25 comparison (base b096826e31c0927190806de91ed70b8b64aa93d8, head e3b270e5f49a9215452b0b86702946043e979059). Baseline was captured before source changes from main664616c: 20 uncached projection samples and brute-force separated-scene item scans. Candidate records cold projection, 20 warm repeated projections, first all-source-reading consumption, index construction, queries, branch/leaf counts, membership and serialized sizes separately. JSON string lengths are a transport-size proxy, not measured structured-clone latency or network bytes.

| Separated nodes | Baseline item checks / 100 queries | Candidate leaf-item checks | Candidate branch-bounds checks | Selected heavy content | Retained wrappers |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1000 | 100000 | 700 | 1500 | 1 | 1000 |
| 10000 | 1000000 | 400 | 2300 | 1 | 10000 |
| 50000 | 5000000 | 600 | 2700 | 1 | 50000 |

The 50k scene serializes to 3,477,838 characters, query 160 and result 190. One observed candidate run built this index in about 17.5 ms, and 100 queries took about 0.09 ms. These timings vary by machine/JIT and are descriptive; bounded operation counts are the regression control.

The real fixture has 3751 projected entities, 210 default nodes and 253 relations. Its geometry workload uses fixed 300×90 node / 240×75 label dimensions and the unchanged layout/router, not browser DOM measurement. One selected viewport returned 4 heavy node contents and 53 relations with all 210 wrappers retained; these are synthetic-dimension selection counts, not observed browser DOM counts. Scene serialization is 131250 characters; query 267, result 8003. One observed run used about 93.5 ms for layout/routing, 0.86 ms to build the index and 1.38 ms for 100 queries. Warm projection samples were about 1.9–4.1 ms versus pre-edit 8.8–18.5 ms; cold candidate projection was 13.6 ms and explicitly consuming every source preview added 3.2 ms. This is shifted/reused preparation work, not eliminated source loading.

Remaining costs: full canonical download/parse; full cold-start node/label measurement; O(N) ReactFlow wrappers/ports and membership application; full layout/routing after geometry changes; conservative over-selection of large group/route bounds. No FPS, physical-device, browser-memory, network-reduction or comprehension claim follows.

## Acceptance and next owner

A1: exact source/canonical/projection oracle PASS; visual/gesture preservation requires live checks. A2: independent geometric oracle and separated-scene operation counts PASS. A3: real worker asset, actual entry thread transport, bounded bridge and active React wiring implemented; browser execution UNRUN. A4: replacement/stale/error/timeout/disposal pure checks PASS. A5: immediate current-pin union/cache tests PASS; native DOM disclosure/focus/manual/scroll preservation authored but UNRUN. A6: pre-edit baseline and repeatable candidate workload recorded with limits. A7: root owns PR, fresh independent review, exact-main deployment/readback and supported live verification; currently pending.

Core gap: actual user-visible reading/interaction and unfamiliar-reviewer comprehension remain unverified. The next step is independent review and delivery at the existing endpoint, then the affected live source-navigation journey, preserving the same ontology and source account. This is a local implementation handoff, not slice acceptance or feature completion.
