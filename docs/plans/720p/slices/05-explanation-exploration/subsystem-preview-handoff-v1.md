# Subsystem preview handoff v1

Date: 2026-10-24
Role: implementation delivery and exact independent-review packet
Status: clean local candidate; whole-preview review, human layout adoption and production integration required separately
Parent: [subsystem map](subsystem-mockups.md)

## Exact source and scope

Task worktree /tmp/pr-reviewer-subsystem-previews, branch preview-review-subsystems, isolated from e2bb182. Compiled/tested code source c29281855213c6ee0a37cd0043a1166ca65ba2ec. Later receipt/map edits contain no source change. Original canvas /tmp/pr-reviewer-canvas-preview, code e057ea0 and checkpoint e2bb182, remains preserved on56671/8473. B2 bridge checkpoint93d6b9c remains isolated; its same-canvas/E reconciliation dccedc0 is docs-only. No source/domain/storage/server/MCP/CLI/package/dependency/lock or production runtime/data was changed for these scenarios.

Actual reviewed own-PR source: https://github.com/scottchu/pr-reviewer/pull/25, merged head e3b270e5f49a9215452b0b86702946043e979059 versus first parent b096826e31c0927190806de91ed70b8b64aa93d8. Earlier real PR25 head5cf0bc67f2db4d17c4653a55cc66493445e4b03a versus parent1f1aad1f21e5b71bf121d0416d95c1710e70592f is the retained history example. Exact selected source is byte-identical across those heads; source account identity remains different. PR24's actual merge pin is a mock ambiguous candidate with prepared source explicitly unavailable. No new provider fetch/discovery or admitted snapshot identity is claimed.

Capture-source records exact snippet/path/lines/blob/SHA256 and source-observed calls. The related authentication test is actual gateway.test.ts:90–114. It is not included in configured review-source-core-v1; its assertions remain unrun. Simulated jobs/results/artifacts are permanently marked test_only_execution with qualification absent. General prose comments, replies and all private scene state are memory-only; reload clears them.

## Inspectable entries and launch

Root verified private HTTPS8474 to owned loopback56672; the author verified local connected entry200. Each entry is separately inspectable:

| Scenario | Private inspectable URL |
|---|---|
| Canvas/diff | https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=canvas |
| Story/exploration | https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=story |
| Discussion/participants | https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=discussion |
| Tests/evidence | https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=tests |
| Import/history | https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=import |
| Connected review | https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=integrated |

Local equivalents use http://localhost:56672/. The preview runs existing Vite with loopback binding, strictPort56672 and exact __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=mac-mini.duckbill-ionian.ts.net. See previews/canvas-reading/README.md for the bounded launch command. Observed serving owner is Bun PID10660; original56671 owner PID10009 was preserved. Stop only a freshly verified owned preview PID if cleanup is later requested; root owns its dedicated Serve route. No Funnel/global network configuration or other preview/runtime is touched. The temporary RED/PASS verification56673 process was stopped.

## Verification and build

Private evidence root: /tmp/pr-reviewer-subsystem-preview-evidence.

- all-canvas-subsystems-e2e.log:13 actual installed headless Chrome journeys pass, including five original source/selection/keyboard/emulated-touch journeys and eight subsystem/connected/regression journeys.
- unit-final.log:10 Node24 pure scene/lifecycle/byte tests pass.
- strict-final.log: strict preview TypeScript exit0; empty success log.
- source-final.log: both exact Git source accounts reproduce, including unchanged bytes and distinct commit identities.
- build-final.log: existing Vite browser build passes; output only under private evidence/dist.
- build-manifest.json SHA256 373de58a05a373a549a518b6771fa166ea61e27e4f9e7cec393d5f9459800257 records source, source pins, every compiled asset, final screenshot and raw log digest.
- fix-regressions-red-83871d5.log reproduces all three P2s; fix-regressions-pass-6478d9b.log passes all three. Exact source/receipt/digests are in subsystem-review-fixes.md.

Checks used installed Node24, Bun1.4.2, TypeScript, React/React Flow, Playwright and Chrome, with existing read-only package-entry links and task-private caches. No install/global configuration change. New direct test files are previews/canvas-reading/subsystems.test.ts and subsystems.e2e.ts; canvas tests were retained. They have not been added to the production package test registration. The external task Playwright configuration is in the evidence root; both origin environment variables target56672. No blocked reviewer browser route was retried or bypassed.

## Screenshot critique and limits

Final screenshot root: /tmp/pr-reviewer-subsystem-preview-evidence/final-e2e/. Each subsystem test directory contains desktop/narrow PNGs. Connected images are under subsystems.e2e.ts-connecte-da2af-hread-and-independent-draft/{connected-desktop,connected-narrow}.png; import images use subsystems.e2e.ts-import-a-6ba2e-nts-without-explicit-intent/. The manifest pins all filenames/hashes.

Author inspection finds readable labeled before/after code inside the graph, unchanged neighbors, counted author markers, adjacent prose threads and explicit result/source limits. Narrow390px reflow has no horizontal document overflow or tested prose/source overlap. It remains a long vertical journey with bounded inner source scrolling. A code thread's quote, selected line and composer may not all fit simultaneously inside that scroller. Dense fixture controls and sticky toolbar positions in full-page captures are not an adopted production composition. Real touch hardware, human art direction and unfamiliar-reviewer understanding are not established by automated geometry/click success.

## Independent-review scope and remaining gates

The prior independent source review found three concrete P2 wiring defects. Exact-version locate, read pause and active-range highlighting were fixed at6478d9b. Independent recheck READY closes those three findings only; report /tmp/pr-reviewer-subsystem-engineering-review/recheck-6478d9b.md SHA256 43293fad5bf9aa4d0e7cab64d4da747baea63bd482d86b5ccd19e1eade988172. It did not accept E/C/connected layouts or whole-product understanding.

A fresh UI-first reviewer must form/freeze an account through the actual candidate canvas before reading source/diff or author expected answers, then compare source and critique comprehension. The existing independent browser policy denial remains preserved; approved access is needed for that affected gate, without alternate-route bypass. Source engineering review may proceed separately. Review all scenario joins for immutable source/version/thread/job identity, fixture honesty, exact return, keyboard/input ownership and visual anchor context. Root owns dispatch and acceptance. No user layout adoption, actual own-PR test execution/qualification, native participant delivery, production composition, merge or deploy is implied. Keep the preview running for inspection; no automatic production integration follows this handoff.
