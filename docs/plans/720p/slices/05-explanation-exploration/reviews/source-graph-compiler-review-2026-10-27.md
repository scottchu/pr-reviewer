# Generated source-graph compiler: independent source review

Date: 2026-10-27. Fixed candidate `1b1b286c754808b97428f9a9aebfe8ae8072da46`, against foundation `e8ee6223a07a251e8ac3496dcaca28553a83cf67`. Local read-only source/artifact review; only this report is written. No tests, generator, network, browser, deployment or runtime action executed by this reviewer. Disposition: **changes needed** for the two bounded P2 findings below. No broader parser/architecture expansion is requested.

## P2 — Keep containment versions and both source witnesses

`mockups/pr-file-tree/compile-source-graph.ts:150–152` emits every Test→Assertion contains relation as comparison, then suppresses the second side for the same logical endpoints. The saved compiled-v3 artifact confirms an added gateway test's16contains relations are comparison even though their evidence is Head-only, and the unchanged application's15contains relations retain only first/Base evidence. This conflates one-sided and two-sided source facts and loses the second ownership witness.

Collect ownership evidence by logical endpoints and source side. Head-only contains must be After, Base-only Before; genuinely paired source ownership may be comparison but must retain both anchors. Add a focused pure-add test and an unchanged-Test two-witness test. Do not change Assertion target semantics or fabricate verification/Run outcomes.

## P2 — Resolve the imported module before looking up its export

`compile-source-graph.ts:124–128` searches all possible path spellings together and chooses whichever has the supported named export. This can bind the wrong module: `helper.ts` may provide `export function helper(){...}` (intentionally unsupported by the const-only export admission), while `helper/index.ts` provides a supported const helper. An extensionless import of ./helper resolves the former file, but this search chooses the latter export.

Determine the actual module path using qualified resolution evidence first, then admit its supported export; or stay conservatively within explicitly evidenced source paths and leave unsupported/ambiguous resolution unknown. Do not choose a module because another candidate happens to export the requested name. A narrow counterexample is sufficient; no new general resolver framework is required.

## Producer proof gap

The fresh fact artifact includes extractor/gitStage source hashes that match this fixed commit. The compiled artifact's provenance only inherits those hashes (`compile-source-graph.ts:156`); it does not identify its compiler source or exact serialized input digest. Add a generation manifest or equivalent producer proof tying compiler source, input artifact digest and compiled output digest. This is artifact provenance, not a new public schema or runtime permission.

## Positive scoped evidence and limits

The fixed compiler consumes generated facts, emits the native File inventory and unchanged test-context Files separately, conservatively leaves89unpaired occurrences as source evidence, and rejects direct mutable-function-declaration target admission. Source tests include deterministic compilation, unsupported whole-declaration replacement, unchanged Test/Assertion containment, pure addition and actual pinned PR25 extraction→request/refresh/helper assertions. Mutable function declarations, including for-of/destructuring examples, no longer receive supported target metadata. These are source-inspected checks; executor reports13focused tests and owning strict compilation passing, not independently rerun here.

Read both saved v3 artifacts from the persistent source-foundation directory. Facts:50changed Files,47context Files,39533occurrences; compiled:3635entities,6814relations,89unpaired. Facts SHA256 `23e4a3af0dcb37792080486fedd8d7acb731c4ddd461e49ca8e50ce953c94318`; compiled SHA256 `ed803e4eb906eecee419a055421aeac02743a6fb1020b94d256c887a869e9d07`. Extractor SHA256 `dd6a0f0899f3efa1838aa6af01e23a98bd15bcb5642ea272eee2a2d460de70c0` and Git-stage SHA256 `a2050824b55e9eeff0fa6b87403f21ee1d8bd7bf3bdfef94f0c97bbf61e95179` match fixed source. Compiler source SHA256 is `d5b911f23997ae9e400a0c17c308bbefdcd92769d8a7672a6bc5746b180b812c`, absent from the saved proof.

No invented direct test verification, assertion-target binding, TestRun/result or author goal is introduced by this stage. Supported lexical calls are not runtime or complete semantic-analysis admission. Unknown/unsupported call bindings and unpaired units remain distinct from complete graph understanding. The compiler is not yet the application entry's data source; renderer integration, preserved meaningful Change/header/test/explanation structure, complete File discoverability, actual UI and fresh comprehension remain later gates. The foundation's earlier no-blocker result does not pass this compiler or deployment.
