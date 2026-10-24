# G2/G3 prerequisite qualification and P1 reconciliation

**Date:** 2026-10-24

**Revision:** 1, accompanying packet/handoff revision2.

**Status:** PASS for the exact bounded prerequisite probe. Product implementation, job ownership/lease, UI/CLI, cancellation/restart, actual own-PR and deployment acceptance remain unrun.

**Parent:** [Slice plan](plan.md), [handoffs](integration.md), [durable qualified recipe](../../../../product/review-loop/test-execution.md).

## Assignment and observation boundary

Root assigned the planning owner the existing 30-minute, one-target G2/G3 prerequisite probe after independent P1 passed. Start was 2026-10-24 11:13:21 UTC; raw probe completion record was 11:20:31 UTC. Documentation reconciliation followed. The fixed source was `67b24f31dd322d034c0a2ec6b73006c009fba310`, not the planning worktree's later head. All source execution used a private complete raw-object copy. No application/test/config/package/lock source was edited, and no package script, installer, new runtime, native session, pilot/server, credential, global configuration, network route or shared cache was invoked or changed.

The task-owned artifact root is `/private/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-06-qualification-4jhxy7sp` (the recorded `/var/folders/...` path resolves to this same root). It contains the private execution tree, dependency copies, fixture/home/config/cache directories, manifests, logs and probe scripts. It is separate from all review runtimes/data. The original `probe.json` identifies the owner/source/start, final status and retention dependency. No external inherited environment was copied into it.

## Independent P1 record and P3 clarification

P1 independently reviewed `5f129048ff6133c2b36cd6096a5a16aae9e76a4c` and returned **PASS FOR DESIGN REVIEW**, with no required P1/P2 correction. Report: `/tmp/pr-reviewer-06-plan-review/report-5f12904.md`, SHA-256 `db9ef391978d4a1cfa32dd50fbe5e13b4036a5b69a7aeac32a34e740a093b152`. This executor read the full report and verified its file hash.

Its nonblocking P3 is now explicit in06A/I2 and the public request contract: an unavailable production configuration remains visibly unavailable and cannot create a queued production job. The queued/cancel/no-runner journey uses a separately declared TEST-ONLY available registry injection. That fixture establishes durable intent behavior, not production environment qualification. The probe below does not implement either UI path.

The original review remains scoped to5f. Packet revision2 adds observed qualification, exact target revision2, the supported option order and this clarification. Root should obtain the narrow Q2 evidence/recipe review before execution-dependent code. No material widening of target/runtime/effect authority is proposed; broader gates remain unchanged.

## Runtime option probe

Direct executable: `/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun`.

Observed version: `1.4.2`.

Executable SHA-256: `35d20dd0263e5c950194434b925454fdfa9ba6e4467da960410fa05b08a7a5b5`.

Platform: Darwin arm64.

The asdf shim was read as a locator earlier and never executed. `--version`, `--help` and `test --help` ran in an owned empty directory with private HOME/TMPDIR/XDG roots and an explicit minimal environment. Help advertised `--no-install`, `--no-env-file` and `--config=<val>`. No network/browser documentation or new tool was needed to establish the actual installed interface.

| Controlled observation | Actual result and meaning |
|---|---|
| `bun test --no-install --no-env-file --config=<empty-file> ./safe.test.ts` with cwd preload and dotenv traps | Exit0; one actual test passed, no preload marker, dotenv value absent. A home-config trap was also absent, but no claim of a positive home-config load was made. |
| Same controlled test without explicit config, still no-install/no-env-file | Exit0; cwd preload marker written by the controlled local fixture. Confirms the negative trap was capable of firing. |
| Same explicit empty config without no-env-file, still no-install | Exit1 because the controlled dotenv value was loaded and violated the test's absence assertion. No production source was changed. |
| Explicit empty config/no-env-file/no-install and synthetic missing package | Exit1, Cannot find package, no node_modules creation. No install command was issued; syscall-level network denial was not measured. |
| Initial separated `--config` path before `test` | Exit0 with no test output in explicit-config cases; this did not run/qualify the test. Rejected and replaced by the tested command-first, equals-bound syntax. Initial harness and observation note retained; initial per-case logs were superseded by corrected runs and are not claimed retained. |

The exact actual target argv is the direct executable followed by:

```text
test
--no-install
--no-env-file
--config=<probe-root>/target-owned/config/empty-bunfig.toml
tests/domain.test.ts
tests/registry.test.ts
tests/graph.test.ts
tests/source-analysis.test.ts
```

This is an argument array, not a shell string. The private config is a zero-byte regular file; its content hash is `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. Cwd is `<probe-root>/execution`. The only child environment entries were LANG=C, LC_ALL=C, TZ=UTC, CI=1, NO_COLOR=1, private HOME/TMPDIR/XDG_CONFIG_HOME/XDG_CACHE_HOME and PATH pointing only to the qualified Bun directory. The config's empty bytes survived execution. No model/provider/native/REVIEW variables, tokens, NODE_OPTIONS/preloads or user settings were inherited.

## Complete source and closure qualification

Four fixed Git calls used the existing Git executable with no optional locks/lazy fetch, literal paths, fsmonitor disabled, hooksPath=/dev/null and protocol.allow=never. The allowlisted Git environment disabled system/global config, prompt, replace objects and lazy fetch. Calls read the commit, root tree, full recursive sized tree inventory and batched raw blobs. Commit/tree/blob hashes were verified against their Git object identities. No checkout/archive/smudge/textconv/hook or dependency preparation command ran.

Every tracked entry was validated and copied exclusively from raw bytes: regular file modes, safe unique destination paths, unsupported configs/symlinks/submodules rejected, file/total bounds enforced. The tree contains no `.git` metadata. Its full inventory includes package.json, bun.lock, source and tests, not only Snapshot.sources. A conservative runtime-import/export scan plus source inspection accounted for13 local source/test modules and Bun/Node built-ins, zod and typescript-analysis. It is a bounded trusted-source account, not a general parser/security proof. The full tree has only the four exact configured paths matching Bun's four selection patterns.

| Identity or measure | Observed value |
|---|---|
| Head | `67b24f31dd322d034c0a2ec6b73006c009fba310` |
| Root tree | `ee8224dfa95603f81db92106812c029234f28b1c` |
| Source entries / bytes |210 /2,507,950; all mode100644 |
| Canonical source manifest digest | `748eb61389b9a25f7b4caf1e3e3e30c8080116e73ba8113157710662cc229355` |
| Source package.json SHA-256 | `a144a7324c6023b26da210b1bb391a659e4aadb60b6dcc1cfb4bbd26b163c942` |
| Donor package.json SHA-256 | `85384f0ea84aa04ec88ec95c6e2866243ec2ed3f0c9b4e13f2610b804f6cd74a` |
| Shared exact bun.lock SHA-256 | `3db180432696bab4093d3aa98143889279d98dee9032995a843f16b4f08ebc67` |
| Entire canonical package-minus-scripts digest | `cf101ebbd725d73917e287836e023236534ffda3e2adca1b66b48f5757932d5e` |
| Actual differing script keys | Only `test`; both literal values retained in package-compatibility.json; neither package script executed |
| Closure | Complete real zod4.6.7 and typescript-analysis alias/typescript6.0.3 package trees,980 regular files /30,495,771 bytes |
| Canonical closure manifest digest | `1533684bf324dcdf02be928b17c7f3d7f331e337eb5ad4e7d62127180f6d741f` |
| Preparation / copy validation time |0.498s total /0.384s copy plus inventories; four Git calls |
| Target revision2 definition digest | `c8b3c8001ff71830ccf50405d6a50fe671c9943a4f5a4934616ce82dc043a940` |
| Normalized environment manifest digest | `617f41e6adb2c419d20253d520f2c190081e3ef7de65b50d5ff3f74aab61e702` |

Donor: `/tmp/pr-reviewer-source-analysis/node_modules`, with its retained package/lock metadata. Both selected packages reported no additional package dependencies. Copying read regular files only, rejected symlinks/special files, wrote independent exclusive files and compared complete path/mode/size/hash inventories before/copy/after. No link to a shared dependency or generated cache was created. Source/donor inventory remained unchanged after the run.

The provenance claim is measured existing installed bytes plus compatible declared metadata and a successful exact smoke target, accepted within the trusted local repository scope. This does not prove vendor archive integrity, package-manager historical provenance, reproducible installation or safety of arbitrary future source. A different source/runtime/closure remains subject to fresh qualification; metadata equality alone still cannot authorize it.

## Actual fixed target result

The target ran once from the isolated source with the qualified direct runtime, exact four-file selection and minimal environment. The probe persisted requested argv/source/environment before spawn, recorded the actual child PID/group, captured bounded stdout/stderr, waited for exit and inspected group absence. This lightweight probe is not the product's durable job/grant/epoch/process-recovery implementation.

- Observed exit:0;47 passed tests,0 failed,495 expectations across four files.
- Bun-reported test duration:383ms. Probe execution plus post-run validation:0.583s. Preparation was a separate probe phase; these timings do not test the future runner's combined deadline or crash behavior.
- Output:28 stdout bytes and6,699 stderr bytes, total6,727, below the1MiB output limit. Stdout SHA-256 `6043908c8d26d62698476b88f737f39d5d3e91008d4155a81730902f5a37479c`; stderr SHA-256 `3d041d74d57549742675d6d0ced715d22709e986c0a6a3075fa9c67f37cecaa7`.
- Source plus copied dependencies: full pre/post inventories equal. Donor contents: equal. No Git metadata or unexpected source overlay appeared.
- Private runtime overlays:85 transpiler cache files,11,674,800 bytes under XDG_CACHE_HOME; zero-byte owned config unchanged. The cache is expected, task-local and disposable; it does not establish a hard temporary-disk quota.
- Process: actual root exited and its owned group was absent after wait. No cancellation, PID-reuse, escaped-child, inherited-pipe, restart or shared-lease fault was exercised.

The controlled dotenv failure and missing-package failure are option fixtures. They are not a failing own-PR target. The passing core run is prerequisite engineering on source67, not an actual06 product/own-PR run. No UI, owner CLI, new store, runner, participant wake, native MCP, pilot or active browser harness was used.

## Retained evidence, checks and next action

Key files beneath the artifact root:

- `probe.json`, `qualification.json`, `artifact-index.json`: ownership/status, bounded result/limits and top-level evidence hashes.
- `version.*`, `help.*`, `test-help.*`, `runtime-probe-results.json`, controlled-case logs, `runtime-probe.py`, `runtime-probe-attempt1.py`, `attempt1-note.json`: runtime option evidence, including the rejected syntax.
- `source-manifest.json`, `closure-manifest.json`, `package-compatibility.json`, `source-import-account.json`, `preparation-summary.json`, `qualify-source.py`: exact source/dependency identities and copy/read observations.
- `target-definition.json`, `environment-manifest.json`, `target-requested.json`, `target-started.json`, `target-result.json`, `target.stdout`, `target.stderr`, `execution-pre-inventory.json`, `execution-post-inventory.json`, `run-core.py`: exact actual run and post-state.

Qualification file SHA-256: `c06b265905d25b56f3757734138ec63df79f86e5520268d5329fcac2492527db`.

Artifact index SHA-256: `fd8e6949ddc985f71acb4e4f61ec3dfba12cf52b08ab1a61237fe200a200274d`.

No process remains active. Preserve the root and its private source/dependency/cache copies for the independent Q2 evidence review. After that review and verified knowledge preservation, root may remove only these task-owned disposable copies/cache while retaining needed manifests/logs; no shared donor or other worktree cleanup is implied. The durable recipe above and in product knowledge no longer depends on the Python harness as specification. Exact raw-run reproduction/review still uses the retained evidence.

Next action: root assigns narrow Q2 review of the committed amendment and evidence, reconciles final05/predecessor and actual implementation base, then fills I2 executor/worktree/runtime-root assignments. Source67 qualification does not automatically qualify a later product PR head. G4–G8 and T01–T10 product acceptance remain open. Native/human/passkey and final actual05 own-PR understanding/meaningful-answer gates remain with their existing owners.

Final documentation/evidence checks: `git diff --check` passed; all69 relative local links across seven changed/new Markdown files resolved; scope contained only docs paths. All38 top-level raw evidence hashes matched the retained artifact index. The durable JSON target definition matched its raw value and canonical digest. The runtime binary and donor package/lock metadata still matched their recorded hashes. These integrity checks do not add product acceptance beyond the probe observations above.
