# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Accepted PR teaching decisions

- Use the selected third dark lesson-left, graph-and-diff-right visual target.
- Show unified colored diff directly in the graph and source pane; do not introduce before/after toggles.
- Agent-controlled focus must synchronize all panes and demonstrate callers, changed logic and new call relationships step by step.
- Preserve exploration and resume. Require source evidence and pinned PR head; never infer a complete semantic graph from file status.
- Use DecompozR Design System foundation tokens and bundled Inter; record the exact source snapshot.

- Mobile uses a shared four-scene story cursor with floating bottom controls, Flow/Diff views, and saved exploration position.
- Narrate in plain English: why briefly, then behavior, implementation and a concrete example. Colored words remain source references.
- User feedback: the graph provides more understanding than current narration. Retain this version; defer further polish until a more complicated real PR. Do not claim comprehension success.

- The UI owns locating and highlighting evidence. Narration explains the already-focused behavior; never instruct the reader to locate, find, or look for the change.

## Dedicated repository and accepted architecture

- Name future branches descriptively without a `codex/` prefix; do not rename existing branches just for this preference.
- Keep project source, documentation and comments in English.
- The accepted future architecture is React 19 + React Flow, Node.js/TypeScript and SQLite plus evidence files; current runtime remains React/Vite/Three.js. Follow `docs/system-design.md` for durable commands, identities, jobs, wakeups and concurrency.
- Future canvas groups use before-left/after-right nodes with colored diff; this supersedes the earlier future-design constraint above without changing the retained prototype. Preserve whole-PR coverage, one-hop context, source provenance and separate role/test-technique/risk dimensions.
- Source preview and historical runtime artifacts remain in the retained Playground worktree. Do not stop, relocate or claim them as destination deployment.

## Context supplement retained decisions (2026-10-23)

- Keep floating draggable bottom-center player as one slim row: drag, previous, replay/pause, next, step count/chapter selector. Retain tooltips and accessible labels. Rejected oversized player and verbose narration are not design targets.
- Synchronize active step number and graph/explanation/diff evidence; red removal, green addition and yellow modification need labels beyond color. Every changed line belongs to whole-PR behavioral context.
- Mobile Flow/Diff shares story state, reading pause and exploration/resume. Explanations briefly establish why, then actual behavior/how and a concrete example.
- Future tree can be entered top-down or bottom-up, with callers AND callees, unchanged neighbors, tests, explicit gaps and semantic zoom. Keep quoted Epic/Ticket/PR descriptions separate from agent understanding.
