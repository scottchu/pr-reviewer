# Acquisition preparation record

**Date:** 2026-10-23

**Packet:** Slice 03 handoff v1 at `773ce21b61b95f16b722d72ecd4824c079fe52b7`

**Status:** Bounded acquisition corrections module-tested; targeted independent recheck pending; no slice acceptance

**Owner scope:** `src/source-acquisition/**`, `tests/source-acquisition.test.ts`, this slice directory. Shared admission and durable-product updates belong to the integration owner.

## Derived design and acceptance

Compile [Import boundary v1](../../../../product/review-loop/evolution.md#import-boundary-v1) into a public immutable value port with injected command effects. Discovery never silently selects among multiple matches or hides an unavailable route. Explicit provider lookup supports verifying a known change separately from path-based unique discovery. Provider metadata pins GitHub's merge base from the compare response and GitLab's `diff_refs.base_sha`, retaining target-tip/start SHA separately.

Git reads use argument arrays, isolated config overrides and raw object reads; they never switch branches, fetch, run external diffs/textconv, or execute reviewed code. The module returns a complete changed-path ledger; a bounded text parser derives hunks from verified blob bytes, avoiding target Git attributes/filters. Any entire-inventory limit returns unavailable rather than claiming partial coverage. Per-file text/byte/hunk limits retain inspectable unsupported ledger entries. Empty blobs are represented with zero selectable lines.

Tests begin with failing public-port tests, then add disposable real Git fixtures for object and content boundaries. Focused tests and strict TypeScript are preparation evidence; actual graph/UI/history integration and own-PR dogfood remain open.

Provider references: [GitHub comparisons](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/viewing-and-comparing-commits/comparing-commits), [GitLab merge requests API](https://docs.gitlab.com/api/merge_requests/). These define comparison semantics; fixtures do not establish live GitLab support.

## Expected verification and integration gates

- Test unique/ambiguous/none/unavailable outcomes, fork and host provenance, detached paths, unavailable tools/auth, and safe argument construction.
- Verify strict UTF-8, commit/blob object type and bytes/hash, added/deleted/rename/copy/binary/submodule/missing/oversized dispositions with explicit counts.
- Read actual GitHub metadata for this repository and known PRs 19/20 without claiming those prove path uniqueness.
- Integration owner must register `source-acquisition: []` in the subsystem checker and add focused tests to the shared test command. No source-to-database route is implemented here.

## Observed evidence

Recorded below after implementation.

## Preparation implementation and evidence

**Status:** Implemented and focused-tested; independent preparation review and vertical integration pending

**Worktree:** `/tmp/pr-reviewer-source-acquisition` (physical `/private/tmp/pr-reviewer-source-acquisition`)

**Branch:** `discover-pinned-change-from-repository`

**Source packet:** `773ce21b61b95f16b722d72ecd4824c079fe52b7`

**Runtime:** Node `24.21.0`; Bun `1.4.2`; Git `2.56.0`; GitHub CLI `2.103.0`

### Public interface and admission compatibility

`src/source-acquisition/public.ts` exports `discoverChange(path, effects)`, `lookupChange(reference, effects, cwd)`, `importChange({worktree, candidate, budgets?}, effects)`, `createNodeEffects()` and immutable types. The injected runner accepts only fixed executable names (`git`, `gh`, `glab`), argument arrays, cwd, output limit and timeout. Node effects discard stderr/command arguments from errors, remove inherited Git environment overrides, disable replace objects/optional locks/prompts and use no shell.

Discovery returns canonical worktree, branch/upstream, sanitized host/project remotes, all candidates and typed route issues. Its result is `none`, `unique`, `ambiguous` or `unavailable`; an incomplete supported provider route cannot establish uniqueness. Unknown hosts are probed with existing provider clients; a recognized provider excludes an irrelevant other-client probe failure. Fork source and target are both checked. Discovery is bounded to 16 remotes and 100 candidate reads per host; a full 100-result provider page returns unavailable rather than assuming there is no next page. It does not search arbitrary unrelated organizations/repositories.

Explicit lookup is separate from path uniqueness. GitHub reads the target PR and compare response; GitLab reads the target MR plus source/target project metadata. Lookup validates host/project/change URL and full SHA identities, projects only declared fields and never returns authentication diagnostics or raw remote URLs. Import refreshes provider metadata and rejects changed source/baseline/head identity as `stale_candidate`; it does not silently retarget.

An imported value contains `snapshotId`, `candidate`, `sources`, `changedFiles`, and `counts`. Candidate preserves provider, host, both projects, change number/URL/state, both branches, actual comparison `baseSha`/`headSha`, target-tip/start SHA and baseline method. Each source retains the existing path/side/content/hash/lineCount shape with additive Git objectId. Every changed-path entry retains status, old/new paths, modes, per-existing-side dispositions, hunk spans/IDs and coverage. Rename/copy status is retained, not reduced to modification. Absent add/delete sides are explicit null paths. Counts partition every existing side into prepared/unsupported/missing.

Git inventory uses raw recursive pinned-commit diff with rename/copy detection; patch hunks use verified blob pairs when both sides exist. All Git diff reads disable external diff and textconv. Commit and blob bytes are checked against their Git object IDs; text hashes are SHA-256 over verified original bytes. Strict UTF-8 preserves BOM bytes. Empty files have zero selectable lines. Binary, invalid UTF-8, submodule, symlink, object type, missing blob, byte/hunk limits and unavailable patch coverage remain explicit. Failed full inventory/commit validation produces unavailable with no partial validated import. Result objects are recursively frozen.

Default hard limits: 512 changed paths; 1 MiB per blob; 8 MiB aggregate read blob bytes; 4096 prepared hunks; 1 MiB inventory output; 15-second Git command timeout. Callers may lower limits, never raise them. Commit metadata has an independent 1 MiB limit. Provider metadata output is capped at 2 MB and 15 seconds per command. No fetch, branch switch, source execution or review-database write is implemented. Invalid UTF-8 Git path names cannot enter the string-path contract and make the complete import unavailable. Read-only diff rename/copy detection follows Git's bounded command result; unchanged copies outside its detected inventory are represented as added paths, not guessed copy relationships.

### Checks

The first public tests failed with `ERR_MODULE_NOT_FOUND` before implementation. Final focused command:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test tests/source-acquisition.test.ts
```

**Observed:** 10 tests passed. Fixtures cover fork/remotes, ambiguity/none/detached/default branch, missing tools/auth, wrong host, path/ref shell injection, secret redaction, self-hosted GitLab lookup and projected metadata; real disposable Git repositories cover adds/deletes/renames/copies, two actual separated hunks, malformed UTF-8, binary, empty files, submodules, symlinks, missing/type/hash failures and file/blob/aggregate/hunk limits. The fixture sets hostile external-diff/textconv configuration and a checkout hook, preserves dirty/untracked user files, and verifies no sentinel execution or checkout changes. Temporary fixture repositories are removed in each test's `finally`.

**Observed:** Scoped strict TypeScript check passed with strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes and NodeNext, using the integration worktree's existing TypeScript 7/type declarations. No package/lock/runtime configuration was changed. The shared full check/test/E2E command is not preparation acceptance and was not claimed here; integration owner must register the new subsystem and focused test in those commands.

### Actual provider evidence

Read-only commands ran through `createNodeEffects()` against `/Users/scottchu/projects/personal/pr-reviewer`, not a substituted repository. The live `main` discovery reported canonical worktree, upstream `refs/remotes/origin/main`, one sanitized `github.com/scottchu/pr-reviewer` remote, no candidates, no issues and `none/no_match`.

Known changes were then explicitly looked up and imported independently:

| Observation | PR 19 | PR 20 |
|---|---|---|
| URL | https://github.com/scottchu/pr-reviewer/pull/19 | https://github.com/scottchu/pr-reviewer/pull/20 |
| Provider state | closed | closed |
| Source / target | scottchu/pr-reviewer / scottchu/pr-reviewer | scottchu/pr-reviewer / scottchu/pr-reviewer |
| Comparison baseline | `cf179ac1eeb9073c08e4e82c950cb53bdc681c72` | `aeadce0ace7f509160d0630ee18c75d74e4537b2` |
| Provider head | `66cd9e0038459026d3788460c6e940f89382c14b` | `df171b2ce8aee0c2e72249fc68138cf2f0e507d6` |
| Baseline method | github_compare_merge_base | github_compare_merge_base |
| Changed paths / prepared sides / hunks | 45 / 53 / 56 | 3 / 6 / 3 |
| Blob bytes read | 305873 | 60073 |
| Unsupported / missing sides | 0 / 0 | 0 / 0 |
| Imported snapshot identity | `5d0ca97f6e427aadefa1a77a3f74e6472da9021506707f57d38a130bdded9a61` | `ae71e85853117f8eff6e12d6743afbb35e7924b536896106f7f163d44c478346` |

These are actual final-provider acquisition observations. They do not change the pilot's earlier PR 19 pinned `4dae178a4302bfdd161fca5be78144c63f562c30` target, prove active branch uniqueness, or establish own-current-PR UI/graph dogfood. No reviewed target code executed, no user checkout fetched or modified, no auth settings changed, and no new review database was created.

**GitLab:** Actual `glab version` returned typed `tool_missing`. Self-hosted GitLab is fixture-tested only. No live GitLab authentication or MR acquisition acceptance is claimed.

## Integration request and remaining gates

The integration owner must map complete provider identity and renamed/copied ledger/hunk evidence into the reviewed admission contract before admitting this value. Existing `Snapshot.repository`/PR-only identity is insufficient across hosts/providers. Preserve historical snapshot identity; do not silently overwrite or retarget a review. Add `source-acquisition: []` to the boundary checker, route only its public port through managed integration, and include the focused test in the shared test command. The module imports only Node built-ins and its own files.

Promote the acquired provider-baseline, incomplete-route, immutable-ledger, bounded-object and unavailable-path policies above into durable product knowledge before slice acceptance; this record is preparation evidence, not a competing product specification. Shared product docs are outside this executor's scope.

The durable import job, subprocess launch identity/restart reconciliation, AddSnapshot mapping, concurrent comment route, React path/candidate/ledger UI, real active own-PR task predeclaration, actual graph-first review, semantic graph integration, full strict/test/E2E checks and unfamiliar-reviewer acceptance remain unimplemented or unrun in this preparation module. Root owns those gates after reviewed 02 compatibility and independent preparation review. No publication/merge/release/deployment occurs in this bounded worker assignment.

Retain this clean committed worktree for root's integration/review. No raw runtime logs or secrets were saved; the source and this evidence record are sufficient to rerun preparation checks. No task-owned fixture directory is needed for recovery.

## Independent-review correction checkpoint

**Reviewed identity:** `2c8879cc038286a8eab38f03cdd1ef0846e92aa1`

**Status:** Original checkpoint requires corrections; correction result and new verification follow below

Independent review reproduced three defects: a missing promisor blob can cause `cat-file` to lazily fetch and execute a configured upload-pack helper; an added/deleted magic filename can be interpreted as a pathspec; and untracked worktree attributes can suppress prepared-text hunks. The original no-execution and complete-hunk claims were therefore too broad. Preserve the original evidence as historical test coverage, not acceptance of those boundaries.

Correction acceptance requires failing real Git regressions before repair, no fixture helper execution or object retrieval under promisor configuration, literal path handling, and identical hunks/source identity across ambient attribute/config changes. Pin read-only Git behavior rather than relying on default local configuration. Root/integration owner promotes the reviewed policy into durable product docs; the acquisition worker does not edit shared docs.

### Correction result and knowledge contribution

**Status:** Corrections implemented and module-tested; targeted independent recheck pending

**Original review:** `/tmp/pr-reviewer-source-acquisition-review/report.md`, reviewing immutable `2c8879cc038286a8eab38f03cdd1ef0846e92aa1`. The reviewer-owned reproduction directory and detached source were read only and retained unchanged.

**Failure evidence:** Before correction, the original ten tests passed while all three new real-Git regressions failed: the task-owned upload-pack helper wrote its sentinel; an added `:(exclude)*` file had no hunk; and ambient attributes/config changed the snapshot identity. This confirms the review findings rather than treating the previous passing suite as safety evidence.

**Derived corrections:**

- All production read-only Git effects disable lazy object retrieval with `GIT_NO_LAZY_FETCH=1` after removing inherited Git environment overrides. Import commands also specify `--no-lazy-fetch`. A missing promised object remains missing; the acquisition route never attempts recovery through a repository remote/helper. Do not treat an eventual missing-object return as evidence that no prior fetch or execution happened.
- Git path arguments are literal through `GIT_LITERAL_PATHSPECS=1` in the production effect and `--literal-pathspecs` in import commands. An option separator alone does not establish this property.
- Git import selects pinned head attributes explicitly (`--attr-source=<headSha>`) and disables system attributes. Prepared UTF-8 text uses forced text diffs with fixed Myers algorithm, no indent heuristic, zero unified/inter-hunk context, non-relative paths and an explicit empty ordering file. Inventory likewise pins text/order/relative/rename-limit behavior. Local worktree or info attributes and local diff ordering/algorithm/context configuration cannot silently redefine prepared source spans.
- Different verified before/after text with an unexpectedly empty hunk result now yields `unsupported/patch_unavailable`, rather than a complete text disposition. Truly empty additions/deletions, metadata-only changes and unchanged rename/copy text can validly retain zero hunks.

These are acquired boundary policies for the integration owner's durable product specification. They do not change provider identity, admission signatures, source hashes, budgets or existing historical review targets. No submodule omission finding was asserted by independent review; the explicit submodule diff option pins acquisition policy rather than claiming a reproduced separate defect.

**Final module verification:** The existing Node command now reports **16 passed / 0 failed**. All four module files plus the focused test pass the same scoped strict TypeScript command. New regressions exercise missing promised commits, trees and blobs through both direct production effects and the complete import; fixture fetch helpers remain unexecuted and removed object paths remain absent. Both added and deleted magic filenames have exact expected spans. Dirty worktree/info `-diff` attributes and local histogram/context/inter-hunk/relative/order configuration leave the entire changed-file ledger and snapshotId exactly equal to the clean import. A synthetic unexpected empty patch becomes unsupported while genuine empty files and pure renames remain text-covered. All created fixture repositories are removed in `finally`.

**Repeated actual-source checks:** After correction, explicit real GitHub PR 19/20 lookup and local object import succeeded again with the exact same baselines, heads, counts and snapshot IDs in the earlier provider table: PR 19 `45/53/56` changed paths/prepared sides/hunks, PR 20 `3/6/3`, with zero missing/unsupported sides. These are final-provider observations, not a retarget of the pilot's earlier pinned PR 19 snapshot. No fetch, branch switch, user file write, auth update or target code execution was requested. Live GitLab remains unrun because its CLI was previously observed absent; no provider capability claim expands from these corrections.

**Limits and handoff:** The corrected command flags are exercised with installed Git `2.56.0`; another Git version must support them or return unavailable rather than silently retrying with weaker policy. Tests use harmless task-owned helper sentinels, not actual user hooks or network remotes. This bounded correction does not establish exhaustive hostile-process containment or whole-slice UI/graph/history acceptance. Root must dispatch the targeted reviewer at the exact new clean correction commit, promote reviewed policies to durable docs and reconcile integration readiness. No package, shared runtime, pilot database or authentication files changed. Keep this worktree for that recheck and subsequent integration; no worker temporary fixture remains necessary for recovery.
