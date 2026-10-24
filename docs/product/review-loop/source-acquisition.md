# Pinned source acquisition

**Direction:** Accepted acquisition and bounded unchanged-context preparation scope

**Context contract:** `pinned-typescript-context-v1`

**Implementation status:** Context port specified; implementation and independent review pending

**Parents:** [Review loop](README.md), [import boundary](evolution.md#import-boundary-v1)

## Responsibility and authority

Acquisition turns explicitly pinned Git objects into retained immutable values. Review-domain admission owns durable review state. The existing discovery/import port resolves provider metadata and accounts for changed paths; unchanged-context loading is a separate public operation. It does not open the review database, select a function, produce a call graph or change an existing snapshot. Later integration uses both ports through declared public boundaries, outside short transactions.

`loadSourceContext(input, effects)` accepts the selected snapshot ID, declared provider/host/source-project/target-project/change identity, explicit base/head commit IDs, a local worktree locator, optional per-side priority paths and lowered budgets. The locator finds Git objects; its live text, configuration files and dependencies are never source inputs. Context loading verifies Git object provenance, but does not independently authenticate the declared provider identity or rediscover/rebaseline a PR. Its result labels that distinction. Admission must compare its declared identity and commits with the authorized snapshot.

The context port supports the accepted `source-neighborhood-v1` TypeScript/TSX corpus requirement. It does not depend on that analyzer or a compiler package. Both sides are acquired independently, including unchanged caller/callee candidates and declaration-only `.d.ts` files. No actual caller/callee or seed function is resolved here. Supplied priority paths identify required source files, never substitute a different function by name.

## Safe Git reads

All commands use fixed executables and argument arrays through the existing injected acquisition effects. Production effects remove inherited Git overrides, disable lazy fetch, replace objects, optional locks and prompts, and do not return raw command errors or credential-bearing remote values. A missing promised object remains missing: no fetch, remote helper, hook, filter, textconv, checkout change or target execution is authorized. The importer also uses literal pathspecs and deterministic pinned-attribute text diffs; context loading needs only raw object reads and never invokes a diff driver.

Verify both commit objects and every traversed tree/blob against its Git object ID, including object type. Enumerate directly from verified tree bytes, preserving strict UTF-8 repository-relative names. Read each selected regular blob exactly, verify its Git object hash, decode UTF-8 strictly with BOM preserved, and retain SHA-256 content hash, object ID, side, commit and exact text. Symlinks are metadata only and are never dereferenced. Gitlinks are explicit submodule boundaries and are never traversed. Binary/malformed UTF-8 source remains unsupported. Empty source is valid retained text. No live `tsconfig`, aliases, package configuration or generated files are read; future configuration requires a separate explicit pinned input.

## Inventory, selection and retained corpus

Return separate values for known inventory, selected paths, preparation/exclusion ledger and retained text. Each known TS/TSX path records side/commit/path, object ID/mode, `changed`, `context` or `declaration-only` role, independent change knowledge, priority/selection flag and its actual preparation or exclusion reason. A known tree/submodule boundary also has a ledger row when descendants are unavailable or unsupported. No excluded or unknown path establishes zero callers or a leaf.

Tree enumeration is bounded. Each side reports complete/incomplete traversal, known source and boundary counts, and unknown unvisited counts when traversal was stopped or unavailable. A complete inventory means the pinned superproject tree was enumerated, not that submodule contents or external consumers were inspected. Never label a bounded prefix a complete repository inventory. Inventory order and selection are canonical by side/path, independent of request priority ordering.

Required priority sources are selected first across both sides, followed by remaining paths in canonical order, within the per-side prepared-text quota and combined byte budget. Required paths that are absent, not enumerated, unsupported, missing or over budget make the result unavailable, retaining the observed ledger. Do not silently select another file. Non-priority paths beyond the selection quota or byte budget retain explicit exclusions; selected but unpreparable sources retain their own missing/unsupported reason. Enumerated paths outside `.ts`/`.tsx` need not be loaded as text; their observed counts are separate from known supported sources. Declaration files remain explicit declaration-only inputs, not implementation bodies.

Inventory and selection completeness are distinct. The accepted analysis contract separates up to 4096 known inventory rows per side and 2 MiB combined ledger metadata from the 128 prepared-text entries per side. Content-less exclusions/missing/unsupported rows do not consume the prepared-text quota. Keep the whole bounded known ledger when mapping to analysis; passing a shortened list must never claim that absent paths were scanned. This operation does not import analyzer internals.

Prepared results can retain incomplete source scope with explicit accounts and exclusions. Invalid identity/commits or unavailable required priority source produces an unavailable result, not a consumable success corpus. Both result forms retain bounded observed coverage. No parse, invocation or caller count is invented: acquisition has not examined such facts.

## Profile, limits and identity

The fixed profile is `pinned-typescript-context-v1`. Defaults are 128 prepared source entries per side, 256 KiB per source blob and 4 MiB combined source bytes, compatible with the analysis defaults. Additional traversal bounds are 4096 tree entries per side, 256 tree objects per side, 1 MiB aggregate tree bytes per side and 2 MiB combined ledger metadata. Metadata accounting reserves room for each known row's longest status fields before admitting that row, so later preparation cannot push the ledger over its cap. Each command has a 15-second deadline and commit metadata has a 1 MiB cap. Callers may lower these bounds; attempts to raise them reject. Content-less unsupported/missing/excluded rows do not consume the prepared-source quota. The byte budget counts bytes actually retained from verified blobs, including unchanged bytes separately for each side.

The context corpus identity is content-derived from contract/profile, snapshot and declared repository identity, pinned side commits, normalized priorities and budgets, side accounts and the canonical ledger/text hashes/object IDs. Exact text is retained, not replaced by mutable filesystem references. Reordering priorities does not change the result. Same bytes on opposite sides keep separate side/commit identities. Changing content, a side, an exclusion or a budget changes the corresponding corpus identity. Do not replace the review snapshot ID with this digest; analysis/admission must carry both.

Results are deeply frozen; caller input is neither mutated nor frozen. No credential, worktree locator, host-session metadata or provider authentication diagnostic enters the retained corpus. The locator does not affect identity, so the same verified objects acquired in another checkout yield the same corpus.

## Verification and limits

Require disposable real Git fixtures for unchanged source on both sides, declaration-only source, exact bytes/hashes, deterministic ordering/identity, missing promised commits/trees/blobs without helper execution or retrieval, binary/symlink/submodule boundaries and lowered file/byte/enumeration limits. Priority failures must be explicit and enumeration truncation must leave unknown counts unknown. Keep changed-file import regression checks passing.

Source preparation is not independent engineering acceptance, imported-source admission, a durable job, React graph/E2E evidence, actual own-PR comprehension, native-host acceptance or a claim of exhaustive hostile-repository containment. Root owns those later checks and durable docs-only rebuild review. Record observed preparation results and verified limits here after implementation and reconcile material review findings before acceptance.
