# Bounded TypeScript/TSX source neighborhoods

**Direction:** Accepted slice 04 analysis design

**Contract revision:** `source-neighborhood-v1`

**Implementation:** Planned; no analyzer or integrated semantic graph is claimed

**Parents:** [Architecture](../architecture.md), [source and graph boundary](evolution.md), [reactive ownership](../reactive-design.md)

## User story and meaning

A reviewer selects a changed function and sees its before and after source side by side, its direct callers and callees, and useful unchanged source context. Each relationship opens the call site and declaration supporting it. Unresolved calls and incomplete source scope are visible. The reviewer can retain a source-anchored clarification, return to the selected change, and explain one consequence without treating a static relationship as an observed execution.

Analyze each pinned side independently. A base call targets base source; a head call targets head source. An unchanged file may participate on both sides but retains each side's actual bytes and identity. A paired before/after node is a comparison aid, not a call, proof of semantic equivalence or evidence that the function executed. Source claims, agent interpretation, user correction and actual test results remain separate.

The first supported language surface is `.ts` and `.tsx`. The first useful functions are named function declarations with bodies and immutable named `const` arrow/function-expression bindings, including local/nested declarations. TSX function bodies are parsed as TSX, so ordinary direct calls inside React code are analyzed. The product is React-specific; this subsystem does not promise a reusable cross-framework SDK or complete runtime call graph.

## Pure preparation boundary

The analysis core accepts immutable values and returns immutable facts. It does not open Git, a filesystem, a network connection, SQLite, a host session or a browser, and does not invoke target code or configuration. Parser/checker objects are private implementation details, never stored as domain state or exposed in its public result. A declared in-memory compiler host reads only a normalized source map supplied in this request; all filesystem-like compiler callbacks resolve against that map or return absent. No fallback to the compiler's default system host, current checkout, node_modules, ambient `@types`, downloaded libraries, config `extends`, plugins or package scripts is allowed.

The public preparation operation is planned as `analyzeNeighborhood(input) -> AnalysisResult`; this is a new value contract, not an existing gateway/MCP/job API. The integration owner later maps persisted source and queries to it through public ports. A successful pure result is analysis of supplied bytes only; provenance that those bytes came from the pinned Git objects is established by the acquisition/admission adapter, not invented by the core.

### Input knowledge

| Value | Meaning and validation |
|---|---|
| Request identity | contract revision, snapshotId, repository/provider change identity, immutable base/head commit identities. No actor/session credentials. |
| Source corpus | For each side, normalized repository-relative path, exact UTF-8 content, SHA-256 content hash, object ID when acquired from Git, and status changed/context/declaration-only. Validate hashes, unique side/path, bounded bytes and path safety. The corpus includes unchanged context; a changed-file-only manifest is incomplete for caller discovery. |
| Corpus account | Included paths and excluded/missing/unsupported path dispositions, side commit, acquisition method and whether the supplied inventory covers only changed files, a selected context set or a verified repository enumeration. The core validates consistency but cannot prove a caller's inventory assertion. Output repeats this account. No global completeness inference follows from an omitted exclusion list. |
| Seeds | One or more exact declaration anchors on a stated side/source hash. A seed denotes one supported function body/binding; an ambiguous, absent, out-of-range or unsupported declaration produces a typed unresolved seed, never a guessed function by name. The integration layer selects seeds from actual changed ranges and records that selection. |
| Resolution profile | Fixed `repository-static-v1` profile, with optional normalized, pinned path-alias mappings and their configuration source hash/anchor. Unprovided configuration is explicit, not guessed from the agent's workspace. |
| Budgets | Explicit limits no higher than the defaults below; values and profile are part of analysis identity. |

Input `snapshotId` remains the review's source identity. Additional unchanged context is content-addressed by a separate corpus digest including side/path/hash, excluded dispositions and resolution profile. It cannot silently replace reviewed content. Require the same side/commit as the selected snapshot. The adapter must acquire and retain the exact context bytes so later source links remain available; returning an external mutable path is insufficient.

### Output knowledge

| Value | Meaning |
|---|---|
| Result status | `analyzed` or `unavailable`; analyzed may have unresolved sites/seeds and incomplete scope. Unavailable carries typed identity/input/budget/parser reasons and no success graph. |
| Analysis identity | Deterministic digest of contract, analyzer/parser exact version, snapshot and corpus identity, normalized options, seeds and budgets. Reordering source inputs does not change facts/identity. Changing bytes, config, parser or side must change identity. |
| Function nodes and caller contexts | Named functions have stable ID derived from snapshot/side/path/hash/declaration start/end; display name, supported declaration kind, body/declaration anchors and changed/context status. Names alone are not identities. Calls in a top-level initializer or anonymous callback use an explicitly labeled source-scoped module/callback context node, not a fabricated named function; those contexts are not selectable supported seeds in v1. |
| Resolved calls | Caller node, callee node, one or more exact call-site anchors, target declaration anchor, resolution chain through import/re-export when applicable, method `ts-static-binding-v1`, certainty `resolved_static`. This means the static expression binds to the declared implementation under this profile; it is not runtime dispatch or execution proof. |
| Unresolved sites | Exact site and containing function/module context, syntactic kind, reason and optional candidate declaration anchors labeled candidates. Reasons include unsupported syntax/dispatch, mutable binding, missing/external module, alias/config gap, declaration-only target, ambiguous implementation, parse/semantic obstruction and excluded source. No speculative candidate becomes a call edge. |
| Neighborhood | For each seed, incoming and outgoing resolved direct call edges, unresolved sites inside its body and caller-scope limitations. Only one hop is displayed; the index may inspect all supplied files to locate incoming calls. Neighbors are not recursively expanded by this request. |
| Per-source coverage | Every known side/path records its inventory role, whether selected for analysis, whether exact source was prepared, parse/scan status, invocation sites examined/resolved/unresolved, and explicit exclusion/budget reason. Complete changed-path inventory, selected analysis input, prepared/context coverage and analyzed facts are distinct values. Unknown omitted counts stay unknown; never derive zero from absence. |
| Scope/leaf assessment | Outgoing call-site assessment, incoming search scope, exclusions and diagnostics; use the exact qualified wording below. |

Anchors retain snapshotId, side, path and content hash, one-based inclusive start/end lines, plus zero-based UTF-16 start offset and exclusive end offset. UTF-16 is the parser's coordinate system; never confuse it with byte offsets. Line ranges are derived from exact retained text with CRLF/Unicode cases covered. The existing product's line-only anchors remain usable for UI selection; offsets/hashes strengthen analysis evidence rather than replace immutable source identity.

Sort all nodes, edges, sites and diagnostics deterministically by side/path/source offset/kind. Deduplicate repeated analysis facts by stable identity; retain each distinct call site even when multiple sites connect the same pair. One caller/callee edge may aggregate those sites without hiding them. Recursive calls remain a self-edge. Cross-side comparison must remain a separate relation kind.

## Supported resolution and honest unknowns

| Construct | v1 treatment |
|---|---|
| Direct identifier call to a unique function declaration or immutable const function binding | Resolve lexical symbol and unique implementation; retain source evidence. Check writes/reassignments in the supplied corpus; mutable `let`/`var` and observed reassignment are unresolved. |
| Named/default imported function, renamed import, namespace-import member | Follow the compiler's actual binding through the supplied module graph to one supported implementation. Namespace membership must come from a module import, not a similarly shaped runtime object. Retain import/export source anchors. |
| Explicit local named re-export chain | Resolve a finite chain to one implementation with visited-set/budget protection. Cycles without a unique implementation remain unresolved. `export *` ambiguity/unsupported resolution remains explicit; never first-match by text. |
| Relative modules | Use TypeScript 6.0.3 Bundler resolution over the virtual source map with ESNext modules, no emit, TS extensions allowed and JSX preserved. Accept only supplied local `.ts`/`.tsx` targets reached by that profile. Record the profile rather than claiming it reproduces every target runtime's loader. |
| Path aliases | Support explicitly supplied pinned `paths` mappings relative to one virtual repository root: at most one wildcard per pattern/target, ordered targets, all paths within the corpus root. Use compiler resolution over those inputs. Missing/unsupported config, inherited config, package `imports`/`exports`, external/bare packages and out-of-root mappings remain unresolved; never inspect a user's filesystem to make them work. |
| Overloaded function | A resolved signature alone is insufficient. Link all selected signature evidence to the same symbol's unique supported implementation body. Declaration-only overloads or ambiguous/multiple implementation targets remain unresolved. Do not present a signature as executed code. |
| Nested functions and callbacks | Own call sites belong to the nearest function body, not its outer declaration. Named nested const/function declarations can be nodes. Anonymous callback bodies have a local source-scoped caller context, but passing a callback is not proof the receiving API calls it. A function-valued parameter invocation is unresolved. |
| Optional calls | A uniquely bound direct optional call may be a static edge labeled conditional. This is no claim it runs. Unresolved optional member dispatch stays unknown. |
| Methods, constructors, dynamic/computed properties, mutable aliases, `.call`/`.apply`/`.bind`, returned functions, unions, reflection/eval, dynamic import | Record invocation sites and an unsupported/dynamic reason. Do not use a checker signature or apparent property name to invent a definite implementation edge. Class/prototype dispatch and higher-order flow analysis are outside v1. |
| JSX tags and props | Preserve TSX parsing; tags, props and callback passing do not become call edges. Show an explicit framework-invocation-not-analyzed limitation for JSX-containing bodies. JSX/reference enrichment is later scope, not inferred execution. |
| Test source | If a known test file actually contains a resolved call to the seed, it can be a source-backed caller/context. Test path/name heuristics are labeled classification, not relevance or execution. Assertion text/test presence alone never establishes a pass. |
| Invalid or newer unsupported syntax | Syntactic errors invalidate facts from that file; retain its disposition and unresolved imports/callers. A diagnostic intersecting a call/import/declaration needed for resolution blocks that edge. Unrelated diagnostics are reported without blanket claims that the target program type-checks. No emit/transpile of target code. |

The profile is intentionally narrower than target TypeScript compilation. No default library or ambient packages are loaded. Unknown standard-library/property calls remain visible. Checking lexical bindings under this bounded profile cannot establish runtime reachability, evaluation order, effects, dependency injection behavior or real execution. Business rules for certainty, budgets and accepted facts belong to the source-analysis domain, never to React rendering or stream operators.

### Leaf and caller-scope statements

A confirmed outgoing leaf means only **“No explicit invocation sites in this function body under the supported syntax scan.”** It is allowed only for a successfully parsed supported body, fully scanned within budget, with no call/new/tagged-template/dynamic/JSX/other unmodeled invocation constructs or unresolved sites. Nested function bodies are assessed separately. It never means no effects, no property getters, no indirect framework behavior or no runtime dependency.

If invocations exist but none resolve, show unresolved calls; never a leaf. If scan/source/budget/config is incomplete, show not fully analyzed. For incoming calls, zero matches is **“No resolved callers found in these supplied files”**, always with corpus coverage. Never assert no callers in the repository or no external consumers, even when the provided inventory was a complete enumeration; dynamic/unsupported calling forms remain outside proof.

## Budgets and lifecycle

Defaults: 128 source entries per side; 256 KiB UTF-8 per file; 4 MiB combined source; 64 seeds; 200,000 visited AST nodes combined; 10,000 invocation sites; 2,000 returned nodes and 4,000 returned distinct call sites; alias map at most 32 patterns with four targets each; re-export traversal at most 32 links per resolution. Inputs may lower but not silently raise these limits.

Preflight oversized/invalid input rejects before parser construction. Exceeding an AST/site/output global budget returns `unavailable: budget_exceeded` with the actual bound and no partially successful neighborhood; users must narrow scope explicitly. Retain the per-side/path input disposition ledger and exact observed counts, marking unvisited files as not analyzed and reporting the triggering file/limit when known. Do not invent an omitted-site count for an unscanned file. A generic global warning is insufficient: consumers must distinguish prepared files from selected or actually scanned files. Do not return a graph that silently omits inconvenient edges. Cyclic resolution terminates by visited identity and reports its reason. Invalid content hashes/identity reject the whole request before facts are emitted.

The pure synchronous core has deterministic work bounds, not a hard wall-clock interruption guarantee while the compiler parses/checks. Later execution adapter runs it outside gateway transactions/UI threads in an owned worker/process with a 20-second deadline and explicit timeout/unknown result semantics. Memory/process limits must be verified in that adapter's execution packet; this document makes no unmeasured latency/RSS claim. Cancellation, superseded snapshot and late-result fencing belong at that boundary; they do not mutate core inputs.

## Integration and graph clarification

The acquisition result currently includes changed-file source, dispositions and hunks; it is not an unchanged-caller corpus. Before full integration, the source adapter must read additional bounded immutable context from the same base/head objects through an explicit public acquisition port, retain its bytes/hashes, and report omitted scope. No source-analysis module may reach into acquisition internals or read the live checkout as a shortcut. Context loading, analysis scheduling and result admission occur outside short dispatcher transactions; authorized domain commands admit results for their exact snapshot/corpus/analysis identity. Managed routes expose committed results, ownership, teardown and diagnostics.

Present confirmed static calls separately from existing comparison/contains/document-reference edges and unresolved candidate sites. Before/after placement, changed/context labels, scope limits and evidence access are visible without relying only on color. A reviewer can follow one incoming/outgoing edge, open both evidence anchors, inspect an unchanged neighbor, annotate that source and return. Keep the complete bounded fact/coverage index accessible, but initially display one selected function and its before/after pair plus a readable subset of immediate neighbors (at most 12 nodes). Explicit remaining counts and accessible neighbor lists support further expansion without fitting all facts into one unreadable canvas. A display limit changes neither analysis coverage nor leaf status. Graph focus/expansion must not retarget the current source selection, question anchor or draft; require an explicit source-opening action. Private expansion/viewport/selection does not create shared writes.

Graph clarifications are persisted user/agent annotations with immutable source anchor, actor, text, evidence kind and expected graph revision. Add/update uses the normal authorized durable command/receipt boundary and atomic graph CAS. Unrelated comment revisions do not reject a graph update. Reject stale graph revision or stale/revoked generation with no partial mutation; wrong-snapshot anchors reject. Preserve prior author/correction provenance. Ordinary graph writes do not wake the agent. Actual command names/storage layout remain an integration design decision to reconcile with delivered 02B/03 interfaces before code; none exists merely because this document describes the contract.

## Parser decision and rationale

**Selected analysis dependency:** runtime alias `typescript-analysis` pinned to `npm:typescript@6.0.3`; the existing `typescript@7.0.2` compiler/check toolchain remains unchanged. Root explicitly serializes any later package/lockfile write; no install belongs to planning.

Local inspection of the installed 7.0.2 manifest found the top-level version export and `unstable/*` APIs, rather than the classic API assumed by many examples. Microsoft's [compiler API guide](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) explicitly applies to 6.0 and earlier, and the [6.0.3 release](https://github.com/microsoft/TypeScript/releases/tag/v6.0.3) is stable. Select that pinned API for parser, in-memory Program/CompilerHost and binding/signature inspection. Relevant public types are in the [versioned compiler definitions](https://github.com/microsoft/TypeScript/blob/v6.0.3/src/compiler/types.ts). The [module reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html) describes resolution distinctions; the profile records them rather than treating aliases as runtime rewriting. These references support the API choice, not a claim that our analyzer already works.

A handwritten regex/name matcher was rejected because it cannot preserve lexical shadowing/import identity. AST-only syntax would locate calls but cannot substantiate cross-file symbol bindings. Full program/call-flow/framework analysis is disproportionate and would encourage false precision. The 7.x unstable/beta API would add API/native-process uncertainty to a bounded pure preparation chunk; using an explicit 6.0.3 alias avoids replacing the existing compiler. This costs a second pinned package and requires honest rejection of unsupported newer syntax. Reassess after evidence rather than silently broadening language support.

## Acceptance and maintained knowledge

Pure preparation requires exact fact/unknown fixture results, deterministic identities and bounded no-effect behavior; it establishes no UI, host, import-job, human or real-PR understanding acceptance. Full slice 04 additionally requires actual imported/pinned source and unchanged context, React graph journey, graph CAS/recovery tests, independent source review and fresh graph-first own-PR critique. All actual evidence remains in the slice record and is summarized here as verified limits after delivery.

Before accepting this milestone and the 720p round, reflect on actual implementation structure and ask whether this would be the best design if rebuilt now. Promote learned policy, interface meaning, lifecycle and rationale here, then give a fresh auditor durable product/rule docs only, excluding plans/chat/code. Correct material knowledge gaps before acceptance; a readable document is not evidence of an actual rebuild. See [round reflection](../../rules/round-reflection.md).
