# PR25 filename tree mock

Current simple scope: [product contract](../../docs/product/pr-file-tree-first.md) and [owning packet](../../docs/plans/720p/slices/05-explanation-exploration/reviews/pr-file-tree-mockup-v1.md). Every changed path in PR25 is present; edges mean containment only. Visible graph nodes contain one basename/directory-name line. No source bodies, descriptions, story or panels.

`paths.json` is the exact immutable base b096826e31c0927190806de91ed70b8b64aa93d8 → head e3b270e5f49a9215452b0b86702946043e979059 Git path list. The pure builder deduplicates exact paths, preserves full-path/kind identity, derives parents by segments and lays out distinct text rectangles. It infers no calls/semantics. ReactFlow provides the full-window spatial interaction. Drag/scroll pans; graph pinch/Control-wheel zooms; arrows pan, plus/minus zoom and zero resets. The single reset-view control returns readable 100% framing, not a miniature fit-all. Narrow initial framing starts around the application filenames so actual leaf text is immediately readable; no membership is filtered. Pan exposes the remaining tree.

Use installed donor packages through task-local entry links/caches, no install. Scoped normal checks from repository root:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/typescript/bin/tsc -p mockups/pr-file-tree/tsconfig.json
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test mockups/pr-file-tree/tests/tree.test.ts
/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js build --config mockups/pr-file-tree/vite.config.ts
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/@playwright/test/cli.js test --config mockups/pr-file-tree/playwright.config.ts
```

Start only the assigned new loopback preview:

```sh
/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js --config mockups/pr-file-tree/vite.config.ts
```

127.0.0.1:56677, strictPort, exact additional allowed host mac-mini.duckbill-ionian.ts.net. Root owns any authorized Serve8477 route. No backend/API/data/participant effects. Inter/OFL assets are exact copies from the supplied original prototype's font assets, not browser/profile captures. Existing product/previews remain preserved.

Author Chrome screenshots and synthetic gestures are engineering evidence only. Physical touch/trackpad/device input and unfamiliar-reader comprehension are not established. No independent browser-policy retry, new dependencies, production layout adoption or deployment is part of this mock.
