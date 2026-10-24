# 04P preparation execution evidence

**Date:** 2026-10-23

**Status:** Implemented and locally verified; independent preparation review pending; pure module preparation only

**Packet:** `a9b8334a94e8dcb87b90fa69f64e791031587ec2`

**Executor scope:** `src/source-analysis/**`, `tests/source-analysis.test.ts`, slice 04 records and durable source-analysis specification; serialized `package.json` / `bun.lock` ownership for the exact runtime alias only. No integration, publication, deployment or live-client work.

**Workspace:** `/tmp/pr-reviewer-source-analysis`, branch `analyze-pinned-typescript-neighborhoods`. Clean starting identity was the packet commit; primary main remained clean at `cd8715ad2f848c444f952919ce019e7b1e913538`. No task-owned runtime records were present before writes. Other worktrees and local services are outside scope.

## Compatibility and tooling

- Bun: `1.4.2`.
- Existing Node: `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node` (`24.21.0`, supplied by coordinator and read back directly).
- Approved analysis runtime alias installed as `typescript-analysis: npm:typescript@6.0.3`. Package and lock delta contains only that alias; compiler `typescript: 7.0.2` and other versions remain unchanged.
- Minimal compatibility check passed: classic `createProgram`, an explicitly supplied in-memory compiler host, `noLib`, ESNext/Bundler resolution, `.js` to `.ts` source substitution, and checker import-alias binding resolved only `/v/a.ts`; parser version was `6.0.3` with zero syntax diagnostics.

## Verification plan and evidence boundary

Write expected P01–P19 source fact/unknown/coordinate/coverage sets before analyzer implementation, observe red, then implement the public value port and run focused tests plus strict checks. Run the declared regression suite because the runtime dependency/lock changed. Tests use synthetic source only; source hashes establish byte consistency, not Git provenance.

The new subsystem and focused test are not registered in shared boundary/test scripts yet. Preparation includes manual import-boundary review; 04I must register them. Worker timeout, acquisition/admission, React E2E, actual own-PR graph-first understanding, native-host evidence and slice acceptance remain unrun integration gates.

## Red/green and corpus results

All fixtures are synthetic in-memory modules, with supplied source SHA-256 hashes and synthetic immutable side IDs. They do not establish acquisition/Git provenance, actual test execution by the target project or actual PR comprehension.

1. The readonly public values and all P01–P19 fixtures were written before `analyze.ts`. Initial `bun test tests/source-analysis.test.ts` was red: missing `./analyze.ts`, 0 pass / 1 load failure.
2. First implementation run: 17 pass / 2 fail. Two fixture expectations were corrected against the literal source: the review call starts at UTF-16 offset 63, and sorted seeds place `broken.ts` before `valid.ts`. The complete expected edge set and malformed-source rejection were preserved.
3. Strict checking rejected use of an undeclared compiler field. Implementation switched to public `Program.getSyntacticDiagnostics`; no private-field assertion, unstable API or dependency replacement remains.
4. Additional assignment counterexample exposed an actual false edge after shorthand destructuring. The compiler distinguishes shorthand property and value symbols; written-value lookup corrected it. The exact destructuring/for-of/parameter-shadowing test subsequently passed with zero confirmed calls. This correction is maintained in durable source knowledge.
5. Final focused result: **23 tests passed, 0 failed, 267 assertions**. The 19 fixed corpus rows plus four focused counterexample/coordinate/ownership tests all pass. No acceptance row was dropped or converted into a positive-by-count-only criterion.

| Corpus | Observed source behavior |
|---|---|
| P01 | Exact base/head review→decide and decide→normalize sites, head-only decide→validate; one-hop neighborhoods, no transitive or cross-side call. |
| P02 | Same-spelled local and renamed-import bindings stay distinct; let/observed writes, destructuring/iteration assignment and parameter shadowing never create definite calls. |
| P03 | Named/default/namespace imports and explicit two-hop/local/default exports resolve to implementations with ordered linkage; missing export, declaration-only, star ambiguity and type-only bindings remain typed unknowns. |
| P04 | Relative `.ts`/`.js` substitution and explicit alias resolve; missing/external/config inheritance/package/out-of-root cases stay unknown. Known excluded targets are classified through a metadata-only virtual resolver without preparing their bytes. |
| P05 | Two overload signatures retain exact spans and resolve to the unique body; declaration-only/union/multiple implementation cases have exact unknown sets. |
| P06 | Distinct recursion sites aggregate once; duplicate seeds do not duplicate facts; shared callee, exact two-link boundary, cyclic and overlong re-export behavior verified. |
| P07 | Named nested/callback ownership and function-valued parameter unknown verified; no invented callback invocation edge. Declaration-header/computed-name calls do not belong to the new function body. |
| P08 | TSX helper call resolves; JSX tag/prop reference creates no execution edge; JSX-only body is not a leaf. |
| P09 | Literal body uses the exact qualified outgoing-leaf wording; dynamic member call is unresolved and never leaf. Incoming absence remains supplied-files only. |
| P10 | Exact site list retained for method/new/computed/returned-call/call/apply/bind/import/eval/tagged-template syntax; only the inner direct factory call resolves. |
| P11 | Direct optional immutable call resolves with conditional syntax flag; missing optional binding is unknown, with no execution claim. |
| P12 | Malformed source has no function/call/leaf facts; independent valid file remains analyzed and imported malformed target is blocked. Invalid generic syntax is rejected by the selected parser. |
| P13 | Exact CRLF/astral UTF-16 offsets, inclusive lines, two sites on one line, BOM retention and byte-versus-offset distinction verified. |
| P14 | Source order and duplicate seed order preserve full output/identity; content/config/side changes alter identity; parser/analyzer versions are explicit. Repeated calls preserve input and frozen-result behavior. |
| P15 | Exact lowered file/count/byte/seed/AST/site/output/alias/re-export boundaries and one-over behavior verified. Resolved plus unresolved sites count toward output cap; budget failure has no graph. Preflight failures leave all parse statuses unparsed. |
| P16 | Same path on two sides allowed; duplicate side/path, bad hash/unsafe path/inconsistent commit reject without facts; absent/hash/range/unsupported seeds have exact typed outcomes. Empty seed requests reject. |
| P17 | Actual supplied unchanged and test-source calls appear; excluding caller removes only its actual relationship and retains its missing coverage. No relevance/run evidence is invented. |
| P18 | Deliberately absent `src/domain/public.ts` remains unresolved despite existing in the checkout. Compiler-system read/file/directory/current-directory/emit and fetch sentinels recorded **zero calls**. |
| P19 | Complete known inventory, narrower selected set, prepared unselected/context source, failed parse and scan-pending source remain separate. Budget trigger records exact side/path, observed prefix and unknown unvisited counts. |

## Commands and observed results

- `bun test tests/source-analysis.test.ts`: pass, 23 tests / 267 assertions. Includes all P01–P19 and four additional counterexample tests.
- `PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:$PATH bun run check`: pass. Existing boundary script passes its existing registered subsystems; manual new-subsystem review is separate below.
- `PATH=/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:$PATH bun run test`: pass, 11 Bun tests / 42 assertions plus 20 Node tests, no failures. This regresses the declared existing suite after the alias/lock delta; it does **not** select the new focused file.
- `node_modules/.bin/tsc` readback: points to `../typescript/bin/tsc`; package version readback is `7.0.2`. Analysis package version readback is `6.0.3`.

No global runtime/package-manager install, analysis-side target source Git/filesystem read, target emit/transpile, changes to existing runtime scripts, pilot/candidate endpoints, auth/session/Tailscale state, push, PR, merge or deployment was performed. Tests use the existing declared toolchain and their own test fixtures; executing the declared regression suite is distinct from executing analyzed target source. Timings are routine local observations, not hard latency/RSS guarantees.

## Delivered public port and integration notes

`src/source-analysis/public.ts` exports `analyzeNeighborhood`, readonly request/result/anchor/coverage/seed/profile/budget value types and frozen maximum `DEFAULT_BUDGETS`. The input carries request/change/side identities, explicit inventory/selection/retained content, one or more seeds, pinned optional alias configuration and explicit lowerable bounds. The result is deeply frozen; no compiler object escapes. A valid result includes the deterministic global supplied-source index and separate one-hop seed neighborhoods. Typed unavailable results retain source/account/count diagnostics and no graph. See the durable source document for full value meaning, seed spans, parser versus scan ledger, certainty, leaf wording and rationale.

Manual import-boundary review: analysis implementation imports only `typescript-analysis`, `node:crypto` and its own public value module. The public module exports only analysis values and the analyzer. No acquisition/domain/storage/server/application/UI/integration internal imports, filesystem/process/network imports, compiler-system fallback, target execution or compiler-host constructor fallback exist. The virtual content host resolves only selected supplied source; a separate metadata-only host classifies known excluded targets without loading bytes. No config discovery, ambient package loading, default-library host or plugin execution path is supplied.

**Readiness:** Ready for coordinator-dispatched independent preparation review, not independently approved. Keep this worktree/branch for review and integration recovery. The sole ignored artifact is its local `node_modules/`, retained for those checks; no task-owned raw logs/runtime records require separate preservation. Durable knowledge has been reconciled to source-analysis.md and read back before handoff.

**Remaining gates:** Independent source/negative-case review; shared subsystem/test registration; actual 02B/03 interfaces; same-commit unchanged-context acquisition/retention; analysis admission/job/CAS/worker timeout/cancellation/generation; managed routes; React semantic graph and graph clarification; actual own-PR graph-first critique; native/human evidence; milestone reflection/docs-only whole-product audit. Root owns dispatch/publication/integration and acceptance. No synthetic test closes these gates.
