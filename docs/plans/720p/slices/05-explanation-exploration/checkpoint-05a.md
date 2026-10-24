# 05A authoring core checkpoint

Date: 2026-10-24

Status: local core candidate; independent engineering review pending. This is an internal checkpoint of one MVP. 04 G14 remains OPEN / CHANGES NEEDED, PR24 DRAFT, 05B and 05C gated, and slice05/720p acceptance unclaimed.

## Authority and delivered interfaces

Base/packet: `a979c98fda5ad019f48b1d33c0915d5c36651be1`; [named dispatch](dispatch-05a.md). Dispatch commit `e8a1ed9`; exact durable DTO/evidence/storage derivation committed before code at `fff753b`. [Durable contract](../../../../product/review-loop/story-and-exploration.md#exact-authoring-core-value-contract) is the source; tests and implementation derive from it. Later narrow clarifications document fact anchors/basisUnavailable, embedded version identity and two-way command-ID collision guards.

Public domain exports: strict story content/reference/focus/command/query/evidence schemas and typed StoryContent/StoryCommand/StoryReceipt/StoryVersion/StoryView/StoryContextView/StoryEvidence. Story versions embed review/snapshot IDs, server provenance and immutable previous-version history. Public `validateSemanticAnchor` preserves owning parser UTF-16/line semantics; graph clarification reuses it. Source and static statements remain authored interpretation even with valid citations; supplied context never becomes execution or authority.

Public storage exports: `store.story.command(token, input)`, `.query(token, input)`, `.context(token, input)` and authorized `store.storyEvidence(token, query)`; `createStore` accepts optional lowered-only `storyLimits.retainedBytes`. Evidence resolution uses retained snapshot/admitted analysis/source public reads outside the write transaction, with indexed identity maps and one exact source read per identity. No caller can inject a trusted bundle. Atomic SQLite writes recheck authority/series ownership before replay, independent CAS and quota, append history/pointers/receipt together, and roll back value writes under injected faults. No process lease or notification is acquired.

Gateway adds POST `/api/story/commands`, GET `/api/story`, GET `/api/story/context`. Existing MCP capability adds `story_get`, `story_context_get`, `story_publish`; no context-write MCP tool, replacement session or question-completion side effect. Legacy review/import/analysis command ingresses reject IDs already owned by story receipts; story ingress rejects IDs in those legacy namespaces. Internal prefixes cannot be submitted as story IDs.

## Observed verification

Runtime: Node24.21.0 at `/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node`; existing Bun and retained dependencies. No new dependency, global/host configuration or actual pilot/session runtime was changed.

- Strict TypeScript (`bun x tsc --noEmit`): PASS.
- Subsystem boundaries (`bun scripts/check-boundaries.ts`): PASS; new domain/storage modules remain in their existing subsystem and use only public cross-subsystem imports.
- Focused Node core tests: 21 PASS across story domain, storage, limits/faults, semantic evidence, gateway and actual controlled SDK stdio transport. New files are registered in the normal test script.
- S01/S02 core: strict provenance and ID structure, explicit unknown, complete/duplicate/missing/copied/unsupported/empty primary coverage, exact retained source/hash/range and admitted static/corpus/clarification identities; historical basis remains readable and publishes independently of newer graph state. No prose comprehension conclusion follows.
- S03/S04 core: immutable capture supersession/old context, user-only writes, stale context/story CAS, original agent series ownership through owner correction, replacement/wrong-review/bootstrap/revoked capability negatives before replay.
- S05 core: exact retry/restart, two-way legacy receipt collision, actual concurrent independent-process CAS with one winner/one durable conflict, and injected SQLite context/head faults proving no partial capture/version/pointer.
- S06 core: eight chapters,32 steps,128 claims,256 unique references,8KiB multibyte capture/16 selections,256KiB encoded story exact and one-over, lowered retained-body exact/one-byte-under quota. The context envelope128KiB bound is enforced; the stricter single-capture field limits make that outer cap unreachable by a valid create/select payload. Default8MiB quota uses the same tested lowered-boundary path; no8MiB stress claim.
- Controlled actual gateway/stdio SDK test: publication/readback/retry/revocation and zero notification; this is engineering evidence, not initiating native Codex/Claude host delivery or a meaningful real participant answer.

TDD began with missing public story exports (expected red); focused tests are now green. During development a collision test initially assumed RequestAnalysis without a worktree would apply; baseline correctly rejected it, and the test now asserts its persisted receipt owns the ID without assuming a job ran. No unresolved focused failure is hidden.

Core candidate: `00a9966a283a83967cf45487403cfa98f0322dc9`. The normal registered test script ran against that immutable code candidate with Node24 first on PATH: **47 Bun PASS and230 Node PASS (209 existing plus21 story), zero failures/skips**. Node suite duration18.7 seconds. Strict TypeScript and subsystem boundaries also passed. No code mutation occurred during the broad run. Actual Chrome/UI, browser AskQuestion reload recovery, actual own-PR story authoring/comprehension and knowledge acceptance remain unrun later checkpoints. CI/PR/merge/deployment: not performed by this worker; root owns combined delivery.

## Successor gate

05B must consume this exact independently reviewed DTO/read-model checkpoint. UI/application schemas must not fork. It must add application-owned playback/focus/read coordination and managed story/context routes without background publication moving source/cursor/draft. 05C owns exploration/return frames and write-ahead question recovery; current legacy AskQuestion behavior is unchanged. Exact authoring references, server errors/CAS/minima and historical/broken-evidence markers above are the delivered inputs. No06 execution contract is invented.

Task-owned raw fixtures self-remove after tests. The ignored real node_modules entry links and isolated task worktree are retained for independent review and broader verification. No unknown artifact was removed; durable knowledge is reconciled into the maintained story contract and this checkpoint.


## Independent review correction: coordinate ownership

Status: independent P2 on exact code `00a9966` blocks05B pending correction/review. Reviewer reproduced a U+2028-separated declaration whose parser line2 lies on snapshot LFline1: initial static-claim/focus matching incorrectly accepted unrelated LFline2 and rejected correct LFline1. Existing21 tests did not exercise that cross-coordinate case; their green result is retained and does not establish this behavior.

Correction authority is reconciled in the durable evidence-facade contract before code: resolve/validate exact retained semantic source bytes and coordinates, separately normalize static anchors to snapshot LF spans only for identical snapshot/side/path/hash/text, and match each reference only within its owning coordinate format. Preserve exact semantic anchors, including CRLF/U+2028/U+2029/astral UTF-16 offsets. No looser line-range fallback or current-source substitution is permitted. Public facts add `snapshotAnchors`; existing semantic anchors remain unchanged.

Required evidence: reproduce the original red, then actual admitted node/edge cases for base/head, correct mapped LF spans versus unrelated parser-numbered LF lines, wrong side/hash/spans and semantic offset negatives. Original candidate remains superseded until a corrected commit receives independent review.

A second independent P2 on00a found that fetching the current analysis marker through a full body query threw `analysis_record_unavailable` before immutable story readback could label a removed authored corpus. The narrow correction adds an authorized body-free public analysis marker read, uses it for current labels, and classifies known retained-body absence only. Source-only stories do not depend on unrelated analysis-body availability; authorization and unexpected errors remain errors. Both P2s share this correction candidate;05B remains gated.


### Corrected candidate evidence

Independent report: `/tmp/pr-reviewer-05-core-review/implementation-review-00a9966.md`, SHA-256 `f15cc30cacac06b96a0eeaf4240447ad9395ec192f86567a070539b097294e15`. Disposition on00a: exactly two P2 findings, no other material finding; reviewer independently passed strict/boundaries, original21 story tests and15 semantic regressions. That disposition is preserved; later corrections do not relabel00a READY.

Docs-first correction commits: `4854778` (coordinate ownership), `9a72a03` (body-free authorized marker) and `8d4732a` (malformed retained JSON classification). Corrected public evidence facts retain exact semantic `anchors` and add separately resolved `snapshotAnchors`; the domain matcher consumes these formats independently. `analysisMarkerQuerySchema`, AnalysisMarker/AnalysisMarkerQuery and authorized `store.analysis.marker` expose only review/snapshot/current marker/counters without body reads. The retained-record owner maps only its own malformed JSON parse to analysis_record_unavailable. Story evidence rethrows authority and unexpected errors and never substitutes current facts.

New tests were red against00a: original missing-corpus readback threw analysis_record_unavailable; correct U+2028/U+2029/CR LF spans rejected; the newly required normalized anchor DTO was absent. After the narrow correction, strict TypeScript and subsystem boundaries PASS. The affected Node command running all six story test files and semantic-storage/authority/history/mapping/quota files reports **40 PASS, zero failures/skips:25 story plus15 semantic regression**, duration10.1 seconds. Actual retained analysis exercises U+2028, U+2029, CRLF and CR with an astral character before the declaration, node and edge references on base and head, correct LF publication, unrelated LF claim/focus rejection (separate and combined), wrong side/hash/UTF-16 offset rejection. Missing and malformed corpus faults preserve the exact authored version with basisUnavailable/brokenEvidence; newer source-only readback retains its marker and no false broken basis. An injected unexpected query failure and invalid credential propagate.

The prior47 Bun/230 Node full run remains evidence for00a only. It was not relabeled or repeated without cause; the correction's relevant40 Node, strict and boundary checks pass. Final independent reproduction/review of this correction is pending.05B remains blocked until that review; no UI/application/process-owner/pilot/original MCP/PR/main change was made. Test fixtures self-remove, task worktree and ignored entry links remain for review.


### Historical basis isolation follow-up

Independent recheck confirmed the original two P2 fixes at4bf and40 affected checks, then found a remaining P2 dependency: an explicit historical analysis.query still constructs current preparation, so deleting only a newer distinct corpus falsely marks an intact old authored basis unavailable and blocks publication. The general query remains useful for its original UI projection; it is too broad for exact retained-evidence validation.

Docs-first correction specifies authorized `store.analysis.evidence` with an exact required analysisId and only that admitted job’s corpus/result/clarifications. Story validation/readback uses that port and the separate body-free marker; no current facts are substituted, current preparation errors are not suppressed globally, and missing authored evidence stays broken. Required regression uses actual old default128 and new cap1 admitted analyses with distinct corpora: delete only new corpus, demonstrate old exact source/readback/publication remain valid, then delete/corrupt the authored old corpus and retain truthful broken evidence.05B remains gated pending independent corrected-candidate recheck.
