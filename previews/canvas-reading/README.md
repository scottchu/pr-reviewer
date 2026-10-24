# Unified canvas reading preview

An isolated React/React Flow mockup over exact PR25 auth source. It does not connect to a gateway or modify production data. Code and prose comments, sample human/agent identities, replies, story and drafts are memory-only layout fixtures; reload clears changes.

Source pins: head e3b270e5f49a9215452b0b86702946043e979059, base b096826e31c0927190806de91ed70b8b64aa93d8. The generated source-account.ts records exact snippets, commits, blob IDs, hashes and the two manually source-observed calls. Compare relations are explicit presentation decisions. Run capture-source.py --check from the task repository to reverify raw Git objects; no checkout or target execution occurs.

Start from the task checkout with the existing installed dependencies:

```
__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=mac-mini.duckbill-ionian.ts.net /Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun node_modules/vite/bin/vite.js previews/canvas-reading --host 127.0.0.1 --port 56672 --strictPort
```

Open http://localhost:56672/?scenario=canvas. Use Focus source or Zoom into selected group, select exact lines, follow refresh or accessHeaders, then Back/Resume. The prior draft stays independent. Floating markers identify human/agent threads; code anchors retain side/path/lines inside the pinned source account. Prose comments use immutable content ID/version/SHA256 and exact zero-based UTF-16 offsets/quote, not a fabricated backend snapshot anchor.

Strict-check this preview with the existing TypeScript compiler and -p previews/canvas-reading/tsconfig.json. Run state.test.ts using the existing Node24 --experimental-strip-types --test. canvas.e2e.ts uses actual installed Chrome and existing Playwright; the isolated temporary config/evidence root is recorded in the owning05 receipt. No package, lock, normal test-entrypoint or production UI config change is required for this independent design preview.

The owning packet and evidence live beside canvas-reading-mockup.md under docs/plans/720p/slices/05-explanation-exploration/. The separate story, discussion, tests/evidence, import/history and connected entries use ?scenario=story, discussion, tests, import and integrated. They share local source/thread/frame state and clear on reload. Root owns the user-authorized private Serve8474 route to this loopback preview; the exact allowed hostname above is bounded, with no allow-all host setting. Original56671/8473 remains preserved for feedback. Production integration and layout adoption remain separately gated.

Retained earlier PR25 source account: head5cf0bc67f2db4d17c4653a55cc66493445e4b03a versus parent1f1aad1f21e5b71bf121d0416d95c1710e70592f. Equal selected bytes do not merge source identity. Tests show an actual related gateway test as unrun/outside the fixed core target; job outcomes/artifacts are explicitly simulated. No API request, real import, test execution or agent attachment is performed. Run both state.test.ts and subsystems.test.ts directly with Node24; run canvas.e2e.ts and subsystems.e2e.ts against56672 with their explicit origin environment variables. Build output stays in the private evidence root.
