# Source-grounded reviewer experience mockup

A bounded design investigation derived from [the committed experience specification](../../docs/product/review-experience.md) and its [implementation/review packet](../../docs/plans/720p/slices/05-explanation-exploration/reviews/reviewer-experience-mockup-v1.md). This is one authored PR25 journey, not production composition or adopted layout.

Use the installed repository dependencies. No install is needed or authorized. This folder owns its strict TypeScript, Vite and browser configuration; root application/configuration/package files are unchanged. `journey.ts` owns immutable local transitions and anchor construction; React presents that model. Fixture sources are retained immutable Git excerpts, with exact content/excerpt SHA-256, commit, path, side, line and UTF-16 range. The fixture audit reads the pinned Git objects again. Topology is an authored group rendered within ReactFlow, with cited source references; it is not automatic native graph analysis. Pan, wheel and pinch zoom are deliberately locked for this first readable static mock; direct node activation provides inline reading.

From repository root, the scoped normal mock checks are:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/typescript/bin/tsc -p mockups/reviewer-experience/tsconfig.json
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test mockups/reviewer-experience/tests/journey.test.ts mockups/reviewer-experience/tests/fixture.test.ts
/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js build --config mockups/reviewer-experience/vite.config.ts
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node node_modules/@playwright/test/cli.js test --config mockups/reviewer-experience/playwright.config.ts
```

Start only this new owned loopback preview:

```sh
/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js --config mockups/reviewer-experience/vite.config.ts
```

The private port is 56676 with strictPort and only the exact additional host mac-mini.duckbill-ionian.ts.net. Root coordinates any separately authorized Serve route. Bun runs Vite because the bundled signed Node cannot load the already-installed native Rolldown binding (different Team IDs). Node runs the strict compiler, pure/fixture tests and author Playwright. No signing, permissions or dependencies were changed. Build output and browser evidence live under /tmp, not Git. Font asset and OFL license came from the supplied immutable original prototype ZIP; no browser/profile capture was copied.

The opening is paused. Next and Previous move explicitly; selecting a source enters local reading, holding the first story frame. Back unwinds one inspection; Resume restores the held source/step paused. Select code natively or use the local keyboard range disclosure; select explanation prose natively or choose its first sentence with the keyboard. Comment opens an exact local anchor with a separate draft. Escape/Close hides the composer and retains that draft. A dirty draft cannot silently change anchors. The agent example is prepared content, never a received reply. Test definitions are unrun. All drafts disappear on reload; no request, persistence, native attachment or notification happens. Context & scope discloses all 50 changed files and offers useful source-only opening without a fake player. Missing-source and unknown-delivery examples are explicitly local demonstrations.

The 390/320 screenshots and reduced-height keyboard simulation are author engineering evidence. They do not establish physical-device keyboard behavior, native touch selection, unfamiliar-human comprehension or final UX adoption. The separate independent browser-policy denial remains unrun; no alternate UI route was attempted.
