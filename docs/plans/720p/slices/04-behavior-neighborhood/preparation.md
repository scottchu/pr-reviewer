# 04P implementation and independent-review packet

**Revision:** 2; correction recheck pins the containing commit. Initial dispatch revision 1 remains pinned at `a9b8334a94e8dcb87b90fa69f64e791031587ec2`.

**Status:** Independent review required changes; corrections locally verified; independent correction recheck pending; not ready for full integration

**Parent:** [Slice 04](plan.md)

**Authoritative behavior:** [source-neighborhood-v1](../../../../product/review-loop/source-analysis.md)

**Preparation handback:** [Execution evidence and public-port notes](preparation-evidence.md). The original dispatch packet is `a9b8334a94e8dcb87b90fa69f64e791031587ec2`; implementation changes preserve its fixed corpus and scope. Local results do not establish independent preparation approval.

**Pre-integration clarification:** The complete known side/path ledger is bounded separately from prepared source. `inventoryPathsPerSide` defaults to 4,096 and `inventoryBytes` to 2 MiB combined canonical ledger metadata; `filesPerSide: 128` counts only rows carrying source, including unselected prepared rows. Content-less exclusions remain fully represented without using the prepared-source allowance. All caps may be lowered, never raised; inventory excess must reject before compiler creation with no graph. See the durable specification for the exact byte measure and updated identity semantics. No production analysis identities exist to migrate.

**Correction recheck scope:** Independently reproduce the exact assertion/non-null/namespace-element write counterexamples and untouched same-spelled binding control, then check the revised inventory/prepared-source budget distinction, byte measure, preflight rejection, complete ledger and analysis identity. Preserve unknowns rather than selecting replacement implementations. The initial review's namespace/shadowing/dynamic control remains an exact fact/unknown regression. Recheck the public value contract, focused corpus and strict checks; no full UI/slice acceptance follows.

## Scope, assignment and prerequisites

Root assigns one preparation executor and exact descriptive isolated branch/worktree from the committed packet. It also explicitly assigns/serializes the runtime alias `typescript-analysis: npm:typescript@6.0.3` package/lock change, keeping the existing `typescript: 7.0.2` compiler unchanged. If another executor owns those shared files, return the exact requested dependency delta and wait for its committed result before parser-dependent work; do independent fixture/contract preparation meanwhile. No global runtime/tool install, beta/unstable API adoption or target project execution.

Allowed writes: new `src/source-analysis/**` with one public value interface, `tests/source-analysis.test.ts`, this slice's plan/evidence and its new durable `source-analysis.md`. Package/lock writes are allowed only when expressly included by root in dispatch. Do not edit acquisition, domain, gateway, storage, application, UI, job/runtime scripts, shared map/evolution docs, other agents' tests or subscription wiring. Propose shared integration changes back to root. No helpers that reach into other subsystems' internal modules.

Inputs are the documented value contract and the installed approved parser alias; no 02B admission or 03 job API is needed. Implementer confirms compiler exports/version and minimal in-memory parsing/resolution in the isolated environment. Stop parser-dependent work on incompatibility and report the exact error; do not silently replace the parser, read local files or downgrade unknowns. This is a small compatibility check within implementation, not a request to redesign the product.

## Delivery steps

1. Derive strict readonly input/result types from the durable contract, including source provenance, exact anchors, scope, seed and uncertainty semantics. Keep compiler objects private. Establish fixture IDs and expected outcomes below before implementation; write failing tests for the first supported edge and the first false-edge rejection.
2. Build a virtual source host and deterministic preflight/hash/identity/budget policy. The host has no filesystem/network/child-process/default-library/config discovery fallback. Validate malformed hashes/paths/duplicate identities before parsing. Do not conflate passing synthetic source hashes with verified Git provenance.
3. Parse TS/TSX, index lexical function bodies and invocation sites, resolve only documented static bindings and bounded local imports/re-exports/path aliases, preserve unsupported reasons and scoped leaf status. The index may read the whole supplied corpus but returns one-hop neighborhoods only. Use pure policy functions and contained compiler state, not UI/stream business logic or class-based architecture without need.
4. Exercise the complete fixed corpus and counterexamples, deterministic input-order invariance and budget boundaries. Independently compare exact expected edge/site sets, not only positive counts. A false positive is a preparation blocker; a newly found unsupported case updates source policy/tests and stays explicit.
5. Return a clean committed module/tests and a compact preparation evidence record beside this packet, with commands, actual runtime/parser version, observed red/green cases, interface definition, limitations and integration notes. The record identifies code/preparation status separately from actual UI/native/human/own-PR acceptance. Root owns publication and integration.

## Fixed acceptance corpus

Implement fixtures in the focused test file as small in-memory source maps with predeclared identities. These are controlled analysis fixtures; label them accordingly. Use explicit expected declaration and call-site ranges, including CRLF/Unicode coverage. Names in this table designate fixture roles, not actual repository provenance.

| ID | Input and expected facts | Mandatory rejection/limit assertion |
|---|---|---|
| P01 | Three files on each side: changed `decide`, unchanged caller `review`, unchanged callee `normalize`. Base calls normalize once; head calls new local `validate` then normalize. Exactly review→decide and decide→normalize on both sides plus decide→validate on head; return only seed one-hop sites. | No base→head edge; no inferred transitive review→normalize. Same unchanged bytes still have separate side anchors. |
| P02 | Two scopes each define `format`; one inner caller binds its local function, another imports a renamed outer format. Exact two intended bindings. | No edge to the same-spelled unrelated function; a `let` function binding/reassigned symbol is unresolved. |
| P03 | Named import alias and default import plus a namespace-import member resolve to unique supplied implementations. Explicit named re-export through two files retains each linkage anchor. | Missing export, declaration-only target and export-star ambiguity have typed unknowns; no name-only guess. |
| P04 | Supported relative `.ts` and `.js` source substitution and explicit one-wildcard pinned alias map resolve according to the documented virtual profile. | Missing alias/config, bare package, out-of-root target, config extends and package imports/exports never read the real host filesystem and remain unresolved. |
| P05 | An overloaded function has two signatures and one body; a supported caller resolves to that one implementation, preserving signature context. | Two possible implementations/union callable and declaration-only overloads remain unresolved, not a chosen signature body. |
| P06 | Direct recursion produces one self-edge per distinct site; finite named re-export traversal resolves; two requested seeds share an unchanged callee. | Cyclic/overlong resolution terminates with reason; duplicate seed expansion does not duplicate facts. |
| P07 | Named nested function owns its direct calls; enclosing body calls it. Anonymous callback body's direct call has a source-scoped callback caller context. | Callback passing creates no invented outer→callback execution edge; function-valued parameter call remains unresolved. |
| P08 | TSX component body has one direct helper call and JSX markup. Only helper call is a resolved call. | JSX tag and event prop are not function execution edges; body cannot be a confirmed leaf because framework invocation is unmodeled. |
| P09 | Literal-return supported function has no explicit invocation sites and is scoped outgoing leaf. A second function only has a dynamic member call. | Second function is unresolved, never leaf. Zero incoming matches says only no resolved callers in supplied files, never repository-wide no callers. |
| P10 | Object/class method dispatch, constructor, computed access, returned function, `.call`/`.apply`/`.bind`, dynamic import, eval and tagged template each produce a recorded site/reason. | No confirmed implementation edge from a signature/property spelling; no unsafe leaf for those bodies. |
| P11 | One direct optional call to a unique immutable binding resolves with conditional label; missing target optional call is unresolved. | Never report either as executed or always reached. |
| P12 | Syntax error in one file plus valid independent file; valid facts may remain for the independent file with failed-file disposition and incomplete incoming scope. | No facts/leaf from malformed file, no confident imported target from it; newer unsupported syntax cannot silently parse into trusted graph facts. |
| P13 | One call/declaration span after astral Unicode and CRLF, plus two calls on one line. | Exact UTF-16 exclusive offsets and inclusive line ranges distinguish both sites; bytes are not offsets. |
| P14 | Same source/seed map reordered yields identical analysis identity/facts; repeated sites aggregate without loss. | Changed content, config, parser version or side changes identity. Same input object remains unmodified after repeated calls. |
| P15 | At-limit and one-over file/total-byte/seed/AST/site/output/alias/re-export cases. | Preflight over-limit rejects before compiler creation; runtime deterministic budget failure emits no partial success graph. Tests lower caps to exercise boundaries cheaply. |
| P16 | Same path on two sides is valid; duplicate side/path, wrong hash, absolute/traversal/NUL/backslash paths, inconsistent side commit and absent seed are rejected or explicitly unresolved according to source contract. | No facts from identity-invalid input. An absent/unsupported seed is not silently replaced by same name elsewhere. |
| P17 | Supplied unchanged caller exists outside changed-file manifest; removing it produces incomplete corpus with explicit exclusion. A declared test file directly calls seed. | Caller appears only with its actual source; omitted caller is not guessed. Test classification/source call does not imply test relevance or execution. |
| P19 | Corpus includes a complete changed-file inventory, a narrower selected set, prepared unchanged context, one failed parse and an unvisited file after budget exhaustion. | Each side/path has distinct inventory/selection/preparation/analysis disposition; no global warning substitutes for attribution. Unknown omitted-site counts remain unknown and no edge absence becomes leaf. |
| P18 | Deliberately absent dependency uses a path/name also available in the executor's real checkout; request has no source for it. | Result remains unresolved; virtual host callbacks prove no read outside supplied map. No process/network/config/library discovery effects. |

Use exact fact-set equality and expected uncertainty kinds for all rows. Every supported syntax/resolution claim needs a positive and close negative case. Detect false positives in scope/edge/leaf evidence explicitly. Do not turn each table row into an identical implementation-mirroring test; combine fixtures when that makes the behavioral assertion clearer while preserving IDs in evidence.

## Preparation acceptance and commands

- **04P-A:** P01–P08 positive relationships bind to exact documented source/implementation anchors; P02–P12 counterexamples produce no false confirmed call.
- **04P-B:** P09–P12/P17 distinguish scoped leaf, unknown and corpus limitations; no runtime/whole-repository correctness claim.
- **04P-C:** P13–P16/P19 identity/coordinates/budgets/coverage are deterministic, immutable and failure-explicit.
- **04P-D:** P18 verifies source-only host behavior; module exposes no acquisition/storage/UI effect and imports only approved libraries/local analysis internals.
- **04P-E:** Required strict checks and focused tests pass on the committed candidate; independent reviewer confirms supported facts, negative cases and documentary completeness. This means preparation integration-ready only.

Use the existing Node/Bun toolchain; after authorized dependency installation, run `bun run check` and `bun test tests/source-analysis.test.ts`. Existing global test registration and `scripts/check-boundaries.ts` do not yet know the new subsystem. Report that gap, manually review the new import boundary during preparation, and require the integration owner to register it before full acceptance. Regress the existing suite if a shared dependency/lock change could affect it. No E2E is claimed for an unintegrated pure module; full actual React journey belongs to 04I.

## Independent-review handoff v1

Root gives a reviewer other than the implementer the exact packet commit, candidate/diff base/head, package-lock/parser version, source contract, test matrix and actual preparation evidence. Read-only source scope; tests may use isolated task artifacts and declared runtime. No pilot/session access or global configuration changes.

Independently inspect the virtual host and compiler construction for fallback reads/default libs/config/plugin execution. Reproduce the full focused tests and strict checks; add or run at least one independently chosen shadowing/alias ambiguity and one dynamic-dispatch false-positive challenge. Verify unknown/leaf statements, source/side hashes, overloaded implementation mapping, output determinism, budget behavior and no transitive edge claims. Check whether the dependency remains an explicit alias and leaves compiler 7.0.2 intact. A passing count without source-accuracy review is insufficient.

Return concrete findings with severity, fixture/anchor/evidence and acceptance IDs; list actual checks and unrun aspects. Disposition is **preparation integration-ready**, **changes needed** or **blocked**. No UI/graph/human/native/slice04 acceptance follows. Actual PR delivery still requires the project's graph-first UI review protocol; a private local prep commit can be handed to integration before a PR exists.

## Integration handback requirements

Supply stable public values and their meaning, exact source/version/corpus identity, corpus test observations, parser diagnostics/limits and no-effect evidence. Do not invent runtime methods. 04I must still provide: verified same-commit unchanged-context acquisition/retention, actual history/result admission, controlled worker lifecycle, registered public-port routes, semantic React projection, graph annotation CAS and independent actual own-PR graph-first review. Their absence is the intended boundary, not a preparation failure.
