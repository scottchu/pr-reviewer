# Composed Change graph preview

The complete existing PR25 graph and renderer remain present. A presentation-only mount option composes the existing createGateway Change boundary as Explaining, Diff and Tests. The normal product entry does not pass that option and is unchanged.

Specification: [Change-node study](../../docs/product/change-node-projection.md). Scope, evidence and review limits: [preview packet](../../docs/plans/720p/slices/05-explanation-exploration/change-node-preview/plan.md).

## Source and shared components

Code and test sources both use the existing FileDiffBody, SyntaxCode and shared source stylesheet. Unified/Split are the real reader controls. Test disclosures preserve canonical Test/Assertion IDs and open source with exact pinned coordinates. The representative code change is PR25 createGateway, with three directly referencing gateway Tests: one added (16 Assertions), two unchanged (6 and 7). The source association is not a runtime coverage or policy-verification claim. No test execution is triggered.

The former hand-written plain-code single-card sketch was an inadequate preview and is superseded. Earlier screenshots/artwork are not evidence of this revision.

## Local commands

Use the already declared installed dependencies; no installation is needed in the prepared worktree.

- Type check: `node node_modules/typescript/bin/tsc --noEmit -p mockups/change-node-preview/tsconfig.json`.
- Source/SSR check: `node --experimental-strip-types --test mockups/change-node-preview/source-backed-preview.test.ts`.
- Build: `node node_modules/vite/bin/vite.js build --config mockups/change-node-preview/vite.config.ts --configLoader native`.

Build output is ignored under `.decompozr/flow/run/change-node-preview/build`. Serve that built directory using the owned loopback preview runtime; the retained private Tailscale path forwards to it. Do not point the production preview at a task branch or edit its existing build. Keep the previous standalone preview available as task-local rollback until the new candidate is verified.

Static source and SSR checks are not actual browser, graph-first comprehension or physical-device acceptance. Those remain explicitly unrun when the supported browser host is unavailable.
