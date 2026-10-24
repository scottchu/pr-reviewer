# Bounded unchanged source context preparation

**Date:** 2026-10-23

**Packet revision:** 1

**Status:** Implemented and module-tested; independent context review pending; no whole-slice acceptance

**Parent:** [Slice 03](plan.md)

**Source:** [Pinned source acquisition](../../../../product/review-loop/source-acquisition.md), accepted `source-neighborhood-v1` in source-analysis preparation commit `20cc65a` (implementation `fa4b92a`)

**Starting source:** `6127f760b2fd0da609d088241c65c7c51c1f89c6`, clean acquisition task worktree and branch

## Intent and current gap

Changed-file acquisition does not retain unchanged callers/callees. The accepted analysis port consumes only supplied immutable bytes and cannot read Git or the checkout to repair that gap. Add one public Git context-loading port while durable job/UI integration waits on reviewed 02B interfaces. No analyzer or shared admission behavior is implemented in this checkpoint.

## Implementation handoff v1

Assigned owner uses `/tmp/pr-reviewer-source-acquisition`, branch `discover-pinned-change-from-repository`, from the exact starting source. Writable scope is `src/source-acquisition/**`, `tests/source-context.test.ts`, existing acquisition tests only if needed, this slice directory and new durable `docs/product/review-loop/source-acquisition.md`. No package/lock, shared runtime/domain/storage/application/UI, scripts, maps, evolution or source-analysis docs writes. No delegated agents, installation, fetch, PR/push/merge, pilot/auth/session/runtime changes.

1. Commit this handoff and durable specification before deriving tests/code.
2. Define typed immutable input/result values for explicit provider identity and base/head pins, separate inventory/selection/preparation ledger, retained source and corpus digest. Expose through the existing acquisition public port.
3. Write failing tests, then enumerate verified Git tree bytes and prepare bounded TS/TSX context with required priority paths. Reuse the safe production effect; no live text, source config or helper execution.
4. Exercise actual disposable repositories and scoped strict TypeScript; rerun all acquisition tests. An optional actual repository observation is read-only and separately labeled.
5. Commit clean source, reconcile policy/results/limits into durable acquisition knowledge and this packet, and hold for root's independent recheck/integration.

## Acceptance and tests

- Both pinned sides retain unchanged TS/TSX and declaration-only candidates, with exact text/hash/object/commit and separate side identity.
- All known paths have explicit selection/preparation/exclusion meaning; partial traversal reports unknown unvisited counts, never complete inventory.
- Default 128 prepared entries/side, 256 KiB/file and 4 MiB combined may only be lowered. Priority paths are available or fail explicitly.
- Missing promised objects cannot fetch/execute a fixture helper; symlink/submodule/binary/UTF-8/type/hash/missing/budget cases are honest.
- Canonical ordering, normalized-priority corpus identity and checkout-independent retained bytes are tested; existing changed-file import behavior stays passing.

## Independent-review handoff v1

Root assigns another engineer the exact clean implementation commit, this v1 packet and durable acquisition specification. Review verified commit/tree/blob provenance and no lazy fetch/helper/config execution; bounded inventory/selection and priority semantics; immutable retained identities; complete versus partial corpus accounts; per-known-path failures; strict types/tests and preservation of import behavior. Reproduce meaningful negatives in disposable repositories. Return findings and bounded integration readiness, not 03/04/UI/own-PR acceptance.

## Integration inputs and unresolved gates

Root reconciled the accepted analysis contract: inventory is separately bounded at 4096 known rows per side and 2 MiB combined ledger metadata; the 128-entry limit counts prepared-text sources, not content-less exclusions. The loader returns the complete bounded known ledger separately from retained prepared source. 04I maps both without silently narrowing scope; exact analyzer public changes remain owned by its assigned executor. Snapshot identity and both pinned commits must match the authorized selected review. Keep corpus identity separate, retain the actual bytes for future anchors and route jobs/results only through public integration and domain admission.

03 durable job/launch/restart/UI and 04 scheduling/analysis/admission/graph remain root-owned later gates. No pure-module result proves actual source-graph comprehension.

## Evidence

Recorded below.

## Implementation and observed checks

**Docs-first commits:** `9263829774eb9c120dc0465d459330e3390cc3a9`, then accepted separate inventory/prepared-source reconciliation `f60c86e`

**Status:** Bounded port implemented and module-tested; independent context review pending

**Public port:** `loadSourceContext(input, effects)` and `DEFAULT_CONTEXT_BUDGETS` via `src/source-acquisition/public.ts`; implementation `context.ts`. No analyzer/compiler dependency or cross-subsystem internal import was added. Existing import code/runner behavior is unchanged.

**Actual checks:** The first four context tests failed on missing public exports. Final combined focused run passed **25 tests** (9 context, 16 changed-file acquisition). Scoped strict TypeScript passed with the integration worktree's existing TypeScript 7/type declarations. No package/lock/node_modules or shared test scripts were written.

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test tests/source-acquisition.test.ts tests/source-context.test.ts
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node /tmp/pr-reviewer-02-graph-history/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --target ES2023 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --skipLibCheck --types node --typeRoots /tmp/pr-reviewer-02-graph-history/node_modules/@types src/source-acquisition/public.ts src/source-acquisition/provider.ts src/source-acquisition/git.ts src/source-acquisition/runner.ts src/source-acquisition/context.ts tests/source-acquisition.test.ts tests/source-context.test.ts
```

Disposable fixtures exercise unchanged caller/TSX/declaration sources, retained side/commit/hash/object identity, exact BOM/CRLF/Unicode, canonical priority/dirty-checkout digest invariance, binary/symlink/submodule/empty sources, lowered prepared-source/file/total/tree/entry/metadata bounds, required-source failure, missing promised commit/tree/blob without helper execution or retrieval, and injected blob/tree type/hash failures. Caller input stays unfrozen; returned values are frozen. Invalid inputs perform no effects. All owned fixture repositories are removed by the tests.

**Real repository observation:** Read-only context load used `/Users/scottchu/projects/personal/pr-reviewer` with final PR 20 base `aeadce0ace7f509160d0630ee18c75d74e4537b2`, head `df171b2ce8aee0c2e72249fc68138cf2f0e507d6`, declared provider/project/change identity and the earlier verified snapshot `ae71e85853117f8eff6e12d6743afbb35e7924b536896106f7f163d44c478346`. Both sides enumerated completely: 95 tree entries, 25 verified tree objects and 3719 tree bytes each; 27 prepared TS/TSX sources per side, 54 unchanged entries, 255566 combined retained bytes, 15979 ledger metadata bytes, no exclusions/missing/unsupported. Corpus `dc32a4345ad1423c4f4bfe790dac1622ea01273c55204b02e9bb639ff884caf8`. Required `src/domain/public.ts` retained object `f46ccd3fcef2f5946a905fb171225a497f3a3da8` and content hash `c90785f414e4cfd13184607db105bb45df32c8d0a1e425f71770846ca5b3ce2f` on both sides with distinct commits. No new provider-authentication, caller-resolution, graph, UI or admission result is implied.

**Knowledge reconciliation:** Durable public values, provenance, selection/coverage/budget policies, source retention, adapter mapping and verified limits are in new `docs/product/review-loop/source-acquisition.md`. This source document was written before derived code and updated from observed findings; shared source-analysis/evolution/map documents remain outside scope.

**04I/03 integration requests:** Register the context test with existing shared test commands; link the durable acquisition doc from the appropriate map; join exact retained text to all known ledger rows by side/path through public ports; preserve boundary/missing/excluded rows and incomplete inventory accounts; validate declared provider and both commits against authorized snapshot before admission. Keep acquisition corpusId, analyzer corpusDigest and review snapshotId distinct. No source traversal or compiler fallback may read the live checkout. Actual source-query retention/authorization, job/process lifecycle, graph/UI and own-PR review remain open.

**Recovery:** Keep this clean task branch/worktree for root's independent context recheck and later integration. No owned temporary fixture directory or raw operational log is required for recovery. The reviewer has the packet, durable specification, exact code commit and rerunnable tests; a worker checkpoint is not slice acceptance.

**Accepted analysis reconciliation:** Root reports pure analyzer `04e30e5` independently ready for bounded module integration. Loader traversal-entry counts differ from analyzer known-path counts even though both default to 4096. The exact counter/metadata mapping distinction is recorded in durable acquisition knowledge. 04I must retain the loader account and separately validate the projected analyzer ledger; module acceptance does not complete that mapping.

## Context review correction checkpoint

**Reviewed source:** `1d11a05295a2b862935eaade466e9f4f861c07a1`

**Status:** Corrections module-tested; targeted recheck required before bounded context integration

Independent negative probes at `/tmp/pr-reviewer-source-acquisition-review/context-negative-probes.ts` reproduced two gaps outside the passing 25 tests. A hash-verified raw tree with mode `120001` and UTF-8 source content was incorrectly prepared as regular text. A requested metadata cap of one byte returned the two-byte JSON empty ledger. Original review identity/evidence is retained; these failures are not overridden by earlier passing tests.

Correction acceptance: only explicit regular Git modes `100644`/`100755` may enter source blob preparation, with noncanonical source modes retained unsupported rather than loaded. Metadata input must allow the unavoidable two bytes for serialized `[]`, reject a smaller bound before effects, and never report ledger bytes above an accepted cap. Add real raw-tree and cap-boundary regressions before the implementation correction, rerun focused acquisition/context tests and strict TypeScript, then commit clean for the same reviewer. No scope expansion or shared writes.

### Context correction outcome

**Status:** Both corrections implemented and module-tested; same-reviewer targeted recheck pending

The two new tests first failed against `1d11a05`: invalid raw mode retained source text, and the one-byte metadata request returned prepared. Production selection now admits only `100644`/`100755` regular modes. Actual raw Git objects created with `hash-object --literally` cover noncanonical modes `120001`, `100600` and `040001`; each known TS source row is unsupported/object_type, has no retained head text and fails explicitly if required. Tree/blob hash verification and normal symlink/submodule dispositions remain separate checks.

Metadata budget validation now rejects `inventoryMetadataBytes < 2` before effects, returning unavailable/null corpus. The minimum two-byte cap is accepted; its empty ledger is exactly two bytes, with incomplete enumeration/unknown unvisited scope rather than a complete empty repository claim.

Final focused command passed **27 tests** (16 original acquisition, 11 context), and the same scoped strict TypeScript command passed. Changed-file import behavior and ordinary context fixtures remain passing. Durable mode/minimum-cap knowledge is recorded in `source-acquisition.md`; public types/default maximums and all shared files are unchanged. Reviewer-owned probes/results and original source identity are retained unchanged. Owned fixture repositories were removed in `finally`; retain the clean correction worktree for root's targeted independent recheck. No runtime, pilot, package, auth or publication operation occurred.
