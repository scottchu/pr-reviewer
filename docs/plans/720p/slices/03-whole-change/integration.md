# Slice 03 full integration handoff

**Packet revision:** 3

**Status:** Root-dispatched implementation from merged a5043c5; accepted 02B and reviewed acquisition inputs reconciled before deriving code

**Parent:** [Slice 03 plan](plan.md)

**Durable source:** [Import jobs v1](../../../../product/review-loop/import-jobs.md)

## Input revisions and readiness

| Input | Exact evidence / required action |
|---|---|
| 02B ports | Accepted code e0685025218b52d506adc5b7351f055dcd7ea7dd, final receipt 3ba33b07, merged PR22/main a5043c5f8a5c6ceeaceca42937f3c1aa6b12b263. Inspect current public boundaries and accepted predecessor receipts; source read ownership/loading and no-reanchor rules are preserved. |
| Acquisition | `6127f760b2fd0da609d088241c65c7c51c1f89c6`, independently integration-ready per root. Public exports discoverChange, lookupChange, importChange, createNodeEffects and immutable types. Its fixes preserve literal paths, no lazy fetch/helpers and stable attributes/hunks; integrate the reviewed commit, not an active unreviewed follow-up tree. |
| Runtime/tooling | Existing Node/Bun/Chrome/Git/gh toolchain and private external data-root convention. glab missing means live GitLab route unavailable. No install/global auth/route or native CLI investigation belongs here. |
| Existing source truth | 02B selected historical reads, receipt-aware query, old-question reply validation, same-ID no-rewind and private view/draft rules remain authoritative. AddSnapshot only verifies manual_git_v1 today; provider adapter is new work. |
| Not required for this slice | Reviewed context-loader d2def8823c5249808ac83b4cdc35a7f71efa7bb7 and independent 04 analysis preparation. Basic whole-change import uses complete changed inventory and does not claim semantic analysis or unchanged caller coverage; no context implementation is required here. |
| Dispatch reconciliation | Root assigned sole shared writer /root/implement_history_graph, /tmp/pr-reviewer-02-graph-history on new import-pinned-review-from-repository from a5043c5. Integrate reviewed 2c8879cc then 6127f760; normal-test registration only, no dependency/lock/analysis alias changes. Pilot remains with its separate owner. |

The original planner checked candidate shapes/design without accepting implementation. Root subsequently supplied the exact independent 02B/acquisition acceptances; this v3 reconciliation records them without claiming03 behavior already runs. Earlier source/candidate identities remain historical, not rewritten as earlier passes.

## Implementation assignment v3

Root assigns one integration executor in the explicitly reused isolated task worktree on a NEW descriptive branch from merged a5043c5 plus this reconciled source packet. The dispatch supplies exact agent, branch/path, packet/source IDs and execution authority. No writes to main or retained pilot. This source task authorizes local candidate work/tests and necessary project dependency operations only when separately assigned; it does not authorize publication, merge, global installation, auth migration or network-route changes.

**Permitted integration writes after dispatch:** new import-job application/domain/runtime modules, existing domain/storage/source-preparation/server/application/integration/UI/runtime boundaries needed for the journey, focused tests/E2E, owning slice/product docs and registered boundary/test commands. Incorporate acquisition through its public module. The context-loader owner may still be editing acquisition files: coordinate via root, pin committed inputs and do not concurrently edit those files. Package/lock and runtime startup wiring have one named owner. No parser/04/story/test-execution/enrichment implementation.

**Candidate runtime:** isolated owned loopback ports and external private data root under existing start/stop/data-lock rules. Root provisions any actual user/participant credentials. Preserve the current pilot, login, historical IDs, sessions, credentials and all Serve/Funnel routes. Import produces no native agent wake or session ownership change.

### 1. Register reviewed inputs and write failing contract tests

Integrate reviewed acquisition commit with public-import boundary registration and focused tests in the shared test command. Record actual library/toolchain identities and final 02B compatibility. Define job domain transitions, receipt scopes, private runner grant and read model from durable source before writing process coordination. First failing cases: queued request cannot report imported, duplicate request cannot launch twice, and source creation cannot use setup prepare as transport ingress.

### 2. Implement verified provider preparation and representational admission

Add `acquisition_v1` through source-preparation's public boundary. Invoke reviewed public acquisition with the job's pinned source/tooling inputs and hardened tracked effects. Preserve exact provider hash recipe, fields, full candidate, counts and source bytes; mint an unforgeable review/job/exact-manifest witness only from the trusted return. Handle initial CreateReview and continuation AddSnapshot within the existing store owner/receipt policy. Same-ID different metadata/content remains conflict; manual IDs/recipe/positive-source restrictions do not change.

Extend provider-specific source validation for zero-line empty blobs, no selectable text and up to 1,024 source sides. Test zero-source all-unsupported review ledger and no selectable anchor. Existing schema required nonempty content, positive lines, sources min one/max512; merely forwarding provider JSON will fail or silently lose data. Keep absent add/delete sides absent. Validate artifact/result, source hashes/object IDs, source-key consistency, candidate consistency, modes/dispositions, hunk bounds/count coherence and total retained-source budget before transaction. Do not turn all existing manual snapshots into provider-shaped data.

### 3. Derive one durable runner and safe artifacts

Build the single-owner async runner with per-phase claim/invocation/process observations, private grant, bounded queue/process limits, typed errors and cancellation. Inject an owned cancellable acquisition effect adapter through its public contract; preserve reviewed no-shell/no-target-execution/no-fetch/no-helper/literal-path/config protections. Never hold a transaction or participant-wide lock across a child process or provider call. Persist requested before spawn; distinguish start, exit, acquired result and admitted source.

Implement owner-generated artifact IDs under the existing data root; 16MiB encoded result cap, small result-ref command, no arbitrary path/symlink access, exclusive writes and same-descriptor integrity reads. The 8MiB public envelope and acquisition raw byte limits remain distinct. Keep result/admission receipts atomic with the appropriate job/review transitions. Source verification, hashing, filesystem I/O and parsing occur outside transactions. Existing legacy reviews remain intact when a new provider admission exceeds the64MiB retained-source budget.

### 4. Integrate the actual user journey

Through public application/gateway ports, add path entry, discovery/candidate choice, concise progress/cancel/recovery, authorized job readback and explicit opening of the imported review. For a unique completed discovery, persist the pinned candidate before proceeding automatically; partial/multiple results cannot silently pick a route. Existing same-identity review requires explicit continuation/selection as documented; new source uses expected-current captured before acquisition.

Render the full provider changed-file/hunk ledger, unsupported/empty/rename/copy/mode-only cases and source drilldown. Use actual provider hunks for imported coverage. Preserve focused readable source-structure graph and full accessible inventory; no call/leaf/analysis claims. A background result never steals selection or retargets drafts/history. Declare managed routes and lifecycle ownership; React remount only rereads status, not relaunches effects.

### 5. Fault/recovery and actual own-PR verification

Run the matrix below with meaningful domain/storage/real-process tests, then actual React E2E and own-PR graph-first review. Include comment progress during an actual running acquisition, not only a mocked delay or unclaimed queue item. Record process/job/receipt times and actual source identity. Independent review may reveal a blocker; update durable source first, fix and rerun affected tests/candidate graph critique.

### 6. Reconcile and hand back

Promote actual public ports, lifecycle policy, provider identity, bounds and limitations into durable product source; update this plan's observed result table and actual successor inputs. Reflect on the whole current product, conduct independent docs-only audit and close material knowledge gaps before milestone acceptance. Root owns actual PR publication/merge and authorized pilot update; worker returns a clean candidate and recovery/artifact notes.

## Predeclared test and fault matrix

| ID | Required observed behavior |
|---|---|
| I01 | Valid owner request durably creates one queued job/receipt; duplicate ID/payload returns it, changed payload conflicts. Agent/bootstrap requests and spoofed actor strings reject with no job/process/source. |
| I02 | Two concurrent claimers yield one invocation; React remount/reconnect/polling and repeated route registration do not spawn again. Wrong/serialized/private grant and stale runner generation reject internal result commands. |
| I03 | Path resolves unique/none/multiple/incomplete/detached/provider unavailable correctly; exact candidate selection checks discoveryRevision and membership. Live gh route and unavailable glab are reported separately from controlled GitLab fixtures. |
| I04 | Provider/base/head/source/target identity drift during import yields stale candidate, no latest-head substitution. Wrong review/provider membership and concurrent CreateReview identity collision preserve existing discussion and require explicit target choice. |
| I05 | Provider identity exactly matches reviewed acquisition result despite transport property-order permutation; all candidate/object/mode/path/hunk/count fields survive. Legacy PR14/manual IDs and all existing history IDs remain byte-for-byte. Same-ID different source/metadata rejects. |
| I06 | Empty and all-unsupported/binary/metadata-only manifests admit an inspectable ledger without invented source lines; added/deleted missing sides, rename/copy path identities and up to documented source-side bound remain correct. Malformed bytes/hashes/hunks/counts fail with no partial review. |
| I07 | Wrong-review, wrong-manifest, serialized/forged source witness and raw “verified” flags cannot admit source. trusted provider mapping is distinct from HTTP input and does not import acquisition internals into storage. |
| I08 | Public8MiB encoded envelope check remains; raw-content-with-heavy-escaping exceeds transport but fits16MiB artifact and admits via reference. One byte above artifact cap and retained-review budget reject explicitly without truncation/eviction or ID changes. |
| I09 | Traversal/absolute/foreign artifact ID, symlink file or parent, nonregular file, replacement/digest/length mismatch and interrupted temp write cannot produce admitted source. Valid owned atomic artifact roundtrip retains exact result. |
| I10 | Crash after job receipt but before claim resumes eligible queued work; crash after claim/before observed spawn becomes unknown. Crash after actual spawn/before PID or exit acknowledgement does not relaunch original invocation. Keep unrelated process alive. |
| I11 | Crash after result artifact/commit and before admission does not treat file existence as success. Restart finds exact committed reference, waits for explicit known-result re-verification; stale provider during re-verification remains explicit. Already-admitted receipt readback does no new source acquisition. |
| I12 | Crash/transport loss after atomic source+job+admission receipt commit returns same receipt and source on retry, with no duplicate review/snapshot/current rewind. Current-snapshot conflict retains result and admits only after an explicit new expected-current action. |
| I13 | Cancel before claim/selection produces no process; cancel during real owned process stops further launches and records confirmed termination or unknown. Cancel-versus-admission commits in one order; late success after accepted cancellation cannot add source. No kill of unverified/reused PID/group. |
| I14 | Per-command output/timeout, phase120s/discovery256-launch/import4096-launch and queue bounds stop work truthfully; expiry/signal request alone never means stopped. Unknown invocation is not blindly retried; explicit new job cannot overlap unverified old live effects. |
| I15 | Acquisition hardened-effect regressions still pass: promisor missing object helper sentinel unexecuted, no object auto-fetch, literal magic paths, stable hunks under ambient attributes/diff config. Cancellable runner preserves all these constraints. |
| I16 | While a real Git/provider acquisition process is observed active for a real pinned own PR, an existing review question commits and is readable before that import finishes. Process observation—not just job label or synthetic sleep—establishes overlap. Controlled slow-process tests additionally cover deterministic scheduler races, separately labeled. |
| I17 | Actual React E2E: path→choice when needed→progress→complete ledger→source/graph; open each changed-file disposition and primary hunk, save question, retain selection during background completion. Restart/query and cancel/error states are keyboard accessible. |
| I18 | Actual React continuation imports a newer pinned head of the same own PR; old question/reply/evidence remain on original source. No session attachment migration or notification replay occurs from import. Managed route diagnostics return to baseline after teardown. |
| I19 | Fresh reviewer freezes graph-first account of actual own PR before source/diff, then corrects it and critiques ease of understanding, scope/inventory/prepared-source distinctions and explicit semantic limitations. Node counts/E2E passing cannot substitute. |
| I20 | Whole-current-product reflection and fresh docs-only audit identify/close material durable-source gaps. Audit excludes plans/chat/code; no unperformed reimplementation claim. |

The implementer uses the existing strict/check/test/E2E commands and adds focused job/preparation/artifact/storage/process tests to the declared suites. Domain tests preferably start red. Existing acquired module tests use real disposable Git fixtures; retain that coverage. Record every command/environment/result and distinguish controlled provider/host, actual process, live GitHub, unavailable GitLab and human/native evidence. New checks are planned, not run by this packet.

## Own-PR preparation and presentation acceptance

The initial pre-implementation source task uses real project PR19, baseline `cf179ac1eeb9073c08e4e82c950cb53bdc681c72`, head `66cd9e0038459026d3788460c6e940f89382c14b`. This planner freshly verified GitHub PR and compare merge-base metadata and a45-file inventory; local pinned diff has eight modified and37 added paths. Previous acquisition observations of53 prepared sides/56 hunks remain historical and must be checked by the integrated candidate. Source identity is established; no new import/UI run is claimed. Final acceptance uses this integration's actual PR if it contains the qualifying multi-file changes, with actual URL/base/head/snapshot and separately identified clean runtime candidate.

Before the UI work for that task, a source-informed verifier records expected changed-file dispositions, one supporting change/hunk, a concrete before/after result, an unsupported/unanalyzed boundary and source anchors in a separate verifier account. The fresh tired reviewer gets the task and actual candidate UI only, not the account or code/diff. Freeze its graph-first understanding before source drilldown; then retain corrected account, misconceptions, investigation route and easy/workable-with-effort/burdensome/blocked ratings with confidence separately supported/provisional/unresolved. The graph explains source structure here, not callers/callees. A helpful ledger is evidence for the scoped task, not whole behavior comprehension by itself.

Test no/multiple/provider-unavailable cases with explicit fixture provenance when the actual PR cannot naturally produce them. Never invent an own-PR identity or mark a controlled provider as live GitLab. Native participant and unfamiliar-human gates remain separate. Actual controlled-browser-rendered candidate views with reviewer-requested navigation are permitted under the existing review rule, labeled as mediated rather than personal-browser/human interaction.

### Verifier-only initial source account

Do not supply this section or the full implementation packet to the blind graph reviewer before its account is frozen. At the pinned PR19 base, README.md lines5 and9 describe documentation-first state with no app included; head README.md lines5 and9 describe the first local test candidate and bounded manually pinned PR14 question/reply behavior. The complete inventory adds37 paths and modifies eight: application/domain/store/gateway/MCP/UI source, scripts/configuration/dependencies/tests and product/delivery documentation. README.md is modified; package.json, bun.lock and tests/review.e2e.ts are additions with no invented baseline source. These observations support a scope account, not a claim that any test ran or that native/human acceptance passed.

Expected reviewer task: identify this transition, open README's exact source evidence, locate one supporting test/configuration addition and explain its place, account for the rest of the ledger, and distinguish file/hunk source structure from a semantic call graph or execution evidence. The new importer should expose every changed path/disposition; prepared sides/hunks are validated from actual import, not guessed from the graph. An independent source-informed verifier checks the account before grading. The eventual integration PR receives a new separate account matching its own actual change; this one is not reused as its answer key.

## Independent-review handoff v3

Before assignment, root fills exact candidate/packet/source identities, actual PR diff base/head, runtime/build/dirty state, test commands/results/artifact locations and own-PR task. A reviewer other than the implementer has read-only source scope and may run appropriate isolated tests with existing tooling; no pilot/auth/global/native setup changes.

A fresh graph-first reviewer receives only the task/candidate route at first and follows I19. Engineering review may run independently in another agent before that account is frozen. After freeze, source/diff inspection checks actual behavior against import-jobs.md and this matrix: review/source identities and zero-source cases; private grant/witness forgery; CreateReview ingress versus setup; metadata preservation; artifact same-descriptor validation; transaction/process separation; spawn/cancel/restart races; provider effect protections; UI selection preservation and authorized read scopes. Independently reproduce representative failure-injection tests and strict/full suites including actual React journey. Inspect source, not merely the worker's evidence summary.

Return concrete findings with severity/source/evidence/acceptance IDs, actual checks performed and separate engineering, graph presentation, provider, native and human dispositions. Missing own-PR/candidate/UI evidence is an explicit review gate. Fixes update durable source, require new candidate/target identities and rerun affected checks. Root accepts/delivers only the named bounded milestone, with unfulfilled whole-round gates retained.

## Required return and remaining gates

Return committed source and worktree/branch, actual public job/admission/effect/artifact interfaces, reviewed acquisition identity, planned-versus-executed matrix, exact process/React/own-PR evidence, unresolved limits, artifact ownership/recovery and durable-source promotion. Contribute actual provenance/read/job/result ports and limitations to slice04 without implementing it. Register shared documentation maps only when root assigns that scope; planning cannot edit them here.

02B acceptance/reconciliation and scoped integration dispatch are complete in v3. Remaining gates are all 03 derived code/tests, actual PR/candidate/task, independent engineering/graph critique, whole-product docs audit and applicable live provider/native/human evidence. This packet completes design readiness, not product implementation or acceptance.


## Dispatched compatibility clarifications

Root accepted two concrete integration clarifications after actual boundary inspection. (1) Artifacts use private0700 single-owner trust, stable-parent/no-follow/same-FD checks and atomic no-clobber link publication; Node24 public APIs do not promise hostile same-UID parent-swap isolation. (2) Acquisition-v1 retains identical repeated (side,path) source occurrences for modified-original+copy ledgers, preserving exact array/hash/counts; only conflicting repeated values reject. Manual source uniqueness remains strict. Derive unique query/render indexing without modifying the provider manifest. Durable import-jobs knowledge owns these policies. The observed copy probe snapshot was6cdf3fe2af286e200776753957d42f2a6f085262757a1e67f0cf24374ac3c1a7; that disposable probe established representation, not provider/live identity. A deterministic vector is recorded with the focused provider-admission tests before acceptance.


## Actual-own-PR correction dispatch

The clean0a86 candidate’s actual PR23 import failed truthfully at256 launches, with no admission. Root accepted an import/re-verification4096 ceiling derived from5 setup +3×1024 side reads +512 patches +up to3 provider calls=3592, retaining discovery256/deadline/queue/security bounds. Source IDs and reviewed acquisition algorithm remain unchanged. Root also confirmed encoded retained-source quota accounting and in-pane copy line comparison ownership, plus credential-generation fencing for import read/command publications. Durable exact acquisition/job recovery contracts close the docs-only compatibility findings before corrected code is derived. Original0a86 target/failure artifacts stay immutable; corrected candidate/target identities must be reported separately. This is correction readiness, not retroactive0a86 acceptance.
