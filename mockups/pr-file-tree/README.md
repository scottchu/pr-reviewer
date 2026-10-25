# PR25 filename tree mock

Current simple scope: [product contract](../../docs/product/pr-file-tree-first.md) and [owning packet](../../docs/plans/720p/slices/05-explanation-exploration/reviews/pr-file-tree-mockup-v1.md). Every changed path in PR25 is present; base edges mean containment. Selecting a changed file adds only its source-verified static relative imports. Overview files are compact outlined objects with one basename/change-mark line. Gesture zoom or explicit file activation expands one same-ID object into its real pinned Before/After hunks inside the canvas. No prose cards, story or separate source panels.

`paths.json` is the exact immutable base b096826e31c0927190806de91ed70b8b64aa93d8 → head e3b270e5f49a9215452b0b86702946043e979059 Git path list. The pure builder deduplicates exact paths, preserves full-path/kind identity, derives parents by segments and lays out compact distinct file objects. It infers no calls/semantics. The current import fixture is prepared with the existing TypeScript compiler from pinned Git objects:413static citations across56source sides, with relative target hashes and typed built-in/package identities. It includes type imports and excludes dynamic imports, exports, package resolution and calls. External modules have no fabricated repository hash. Selecting a file overlays only its dependency membership (green added, red removed, gray retained), retains all50 changed files, and adds compact gray one-hop unchanged filenames as needed. Edge/context tooltips preserve exact source/target hashes, side, line and UTF-16 specifier range. No backend analysis capability is introduced. ReactFlow provides the full-window spatial interaction. Drag/scroll pans; graph pinch/Control-wheel zooms; arrows pan, plus/minus zoom and zero shows Overview; Escape clears only the import selection. Zoom-in near a file reveals its source detail at the proposed1.3threshold; zoom-out through1.08 collapses it without losing tree membership. Explicit activation is equivalent without requiring a gesture; source selection/inner scrolling stays local. The single Overview control collapses detail and returns readable100% root framing, not a miniature fit-all. Narrow initial framing starts around the application filenames so actual leaf text is immediately readable; no membership is filtered. Pan exposes the remaining tree.

Use installed donor packages through task-local entry links/caches, no install. Scoped normal checks from repository root:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/typescript/bin/tsc -p mockups/pr-file-tree/tsconfig.json
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test mockups/pr-file-tree/tests/tree.test.ts mockups/pr-file-tree/tests/imports.test.ts mockups/pr-file-tree/tests/detail.test.ts
/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js build --config mockups/pr-file-tree/vite.config.ts
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/@playwright/test/cli.js test --config mockups/pr-file-tree/playwright.config.ts
```

Start only the assigned new loopback preview:

```sh
/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js --config mockups/pr-file-tree/vite.config.ts
```

127.0.0.1:56677, strictPort, exact additional allowed host mac-mini.duckbill-ionian.ts.net. Root owns any authorized Serve8477 route. No backend/API/data/participant effects. Inter/OFL assets are exact copies from the supplied original prototype's font assets, not browser/profile captures. Existing product/previews remain preserved.

Author Chrome screenshots and synthetic gestures are engineering evidence only. Physical touch/trackpad/device input and unfamiliar-reader comprehension are not established. No independent browser-policy retry, new dependencies, production layout adoption or deployment is part of this mock.


All50 files have actual native Git hunks prepared:126hunks,+492/-192lines. `prepare-diffs.ts` reads the exact Git comparison, records each source-side hash/absence and emits real context/removed/added rows with side line numbers. `prepare-imports.ts` reads static import declarations from those immutable source sides. Both are task-local fixture preparation, not backend/public capabilities. Regeneration uses the existing Node runtime with --experimental-strip-types; no install. Current source/diff checks validate the prepared hashes/line content against Git. Same-file overview/detail/collapse captures and the removed external node:fs edge are engineering evidence. Scale bands/local neighbor displacement remain proposed mock geometry; no production semantics changed.
