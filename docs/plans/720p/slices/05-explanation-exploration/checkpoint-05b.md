# 05B application and player checkpoint

Date: 2026-10-24

Status: Implemented at89cec07; independent review found a P2 selection-readiness defect, correction in progress. This is not full slice05 or720p acceptance.

## Named dispatch receipt

- Executor: `implement_story_player`, the sole05B product writer assigned by root.
- Requested model: `gpt-6.1-sol`. Requested reasoning effort: high. Effective runtime model is not independently observable here. Fresh scoped worker; substantial reactive coordination/lifecycle, exact typed fences and React accessibility justify this bounded assignment.
- Exact starting commit: `3581fa201d4827ef43b68c258d852bd925e6cf68`.
- Worktree: `/tmp/pr-reviewer-05-story-player`; branch: `implement-story-player`.
- Committed input: revision3 [plan](plan.md)/[integration packet](integration.md), reviewed05A `baac411fd6c52b32daa7e7500bbd9c1f27764e4f`, docs-only predecessor reconciliation at3581fa2.
- Core review: `/tmp/pr-reviewer-05-core-review/ready-baac411.md`, SHA-256 `60b0a02df840f813d124e4d06c23096ab359c719741317c1775fcd5ab01af630`.
- Owned writes: durable story knowledge and this slice checkpoint; new `src/application/story.ts`, narrow application public exports/coordination, new React story/player/scoped CSS and main wiring; focused application/React tests and bounded test registration. No domain/storage/server/MCP/process-owner/analysis-worker changes.
- Gates: docs contract before derived code; focused pure transitions, clock/read ownership/routes/fences and actual React desktop/narrow journeys; strict TypeScript/boundaries and affected regressions; root-assigned independent applicable S07/S08/S10/S12 review before05C.
- Excluded: full exploration/dual drafts/return-frame restoration and persistent AskQuestion recovery (05C), full05/720p acceptance, actual ownPR/runtime/pilot/keys/original MCP, PR/main/push/deployment changes, dependencies/global/host/security changes and nested workers.

## Initial inspection

Assigned worktree was clean at3581fa2. Primary checkout remains main70280d8. No ignored runtime records or task artifacts existed in this new worktree. Existing temporary worktrees and core-review artifacts remain owned elsewhere and were preserved. Task tests will use self-cleaning disposable data and separately reserved loopback ports; test logs/screenshots will be retained outside Git for root review. No source worktree or answer key was accessed.

## Progress and evidence

Durable exact05B state/intents/projection/lifecycle and05C ownership seams are now specified in [product knowledge](../../../../product/review-loop/story-and-exploration.md#exact-05b-application-and-react-contract). Next: failing focused tests, then derived implementation. Initial code input has no delivered player; no browser or acceptance result is claimed.


## Derived checkpoint before independent review

Status: Implemented candidate; focused engineering passed. Independent review is pending. Full05C exploration/recovery and slice/round acceptance remain open.

The controller, pure transition and exact excerpt projection are exported through `application/public.ts`. It owns the private version/cursor/evidence/clock and two scoped registry routes. Semantic focus uses the public select/focus/read-model port and does not open the legacy inspector, whose focus/scroll effect must remain explicit user navigation. Snapshot LF and semantic UTF-16 excerpts retain their owning coordinates. No story intent sends a durable command, requests context, starts analysis or wakes a participant. Newer markers do not move the current cursor/evidence/context or legacy composer.

The React panel presents exact before/after evidence, per-claim basis/uncertainty/author, chapter why/what/how/example, separate retained context provenance, complete explained/unexplained scope, history and limits. A shared Flow/Diff state and one-row draggable/keyboard-reset player retain the original question draft/source. Legacy composer/Anchor/comparison policy still lives in main; this is an explicit temporary05C migration seam, not a claim that the legacy UI already has application-owned draft coordination.05C must add return-frame and dual-draft intents to the same public story/application owner before restoring/mutating those values; it must not create another player or infer a new question identity from UI state.

### Focused checks

- `PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:$PATH /Users/scottchu/.asdf/shims/bun run check`: PASS, strict TypeScript and subsystem imports.
- `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test tests/story-application.test.ts`: PASS,7 tests. Initial red failed on the absent public controller export. Green covers chapter-defined traversal, visible clock/end/pause/replay, foreground/poll ownership, credential/version/disposal fences, exact semantic Unicode slice, late evidence/cursor fences, scoped routes/reconnect/no-op notifications, pure clamp, managed public semantic focus and zero command paths.
- `PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:$PATH REVIEW_E2E_ARTIFACT_DIR=/tmp/pr-reviewer-05b-browser /Users/scottchu/.asdf/shims/bun run test:e2e tests/story.e2e.ts`: PASS,2 actual Chrome React/gateway/SQLite journeys, desktop1440×1080 and coarse390×844→360×740. Playback uses the browser virtual clock; this is not a physical timing/device test. Narrow controls are one row and measure at least44×44. The browser sends zero POSTs throughout story following/inspection. No analysis job or question is created.
- During the initial red browser run, duplicate sibling story/semantic keys caused repeated mounts; explicit distinct keys repaired it. Explicit latest-version opening initially reused the default old version parameter; a null latest selector and regression repair it. Original failing states are not relabeled as passing. Final clean-commit rerun/source identity and aggregate regressions will be recorded below.

### Inspectable artifacts and limits

External artifact root: `/tmp/pr-reviewer-05b-browser`. The first passing captures were made with derived code still dirty atop39f994e and are labeled as such in the JSON; a clean immutable candidate rerun follows the code commit. Controlled target: `story-browser` / `story-snapshot`, manually prepared before/head fixture with one changed source file and immutable owner context/story publication. This is actual React engineering, not the actual ownPR, a native initiating-session reply, unfamiliar-reviewer understanding or human art-direction approval. Actual pilot/main/MCP/keys/source answer key were not accessed.

Required screenshots: `story.e2e.ts-desktop-React-31b63-lds-original-question-draft/story-first-step.png`, `story-chapter-account.png`, `story-desktop-panel.png`, `story-desktop-1440x1080.png`; `story.e2e.ts-coarse-pointe-cb72c--draggable-one-row-controls/story-narrow-360x740.png` and `story-player-narrow.png` beneath that root. Implementer inspected the rendered desktop panel and narrow player for restrained neutral hierarchy, meaningful red/green/yellow text, provenance separation, readable source and visible controls. Independent screenshot critique remains pending; no final visual or understanding acceptance is claimed.


## Independent review correction in progress

Original candidate: `89cec07fa3f73e85896c9379e2fbf31ac93dcf03`. Independent reviewer reproduced a P2: while the first pinned same-analysis read is pending, Next's public select call returns immediately, reports no graph, and never applies the latest cursor after the old read completes. Original private probe: `/tmp/pr-reviewer-05-player-review/race-probe.mts`. Original47 Bun/241 Node tests and2 focused Chrome journeys passed; full registered Chrome suite also passed17 tests in1.7m. These remain89 evidence and do not establish a fixed candidate. Root explicitly expanded this executor's editable scope to a narrow `application/analysis.ts` public selection-readiness correction with a real-bridge delayed-read regression; no storage/domain/process-owner change is authorized.

Runtime correction: initial package-entry setup also linked `node_modules/.vite` to `/tmp/pr-reviewer-source-analysis/node_modules/.vite`, so earlier Vite cache output was shared. After the full E2E child and its teardown exited, only this worktree's exact `.vite` symlink was unlinked and replaced with a real ignored local directory. Shared cache contents were retained; no package/lock changes were made. All later browser runs use the corrected local cache. Earlier functional results remain accurately qualified; cache isolation is not retroactively claimed.

Next: regression red on the real public bridge, shared exact-selection readiness with authority/disposal fences, coalesced independent findings, clean corrected candidate and affected checks. Independent READY and full05 acceptance remain open.
