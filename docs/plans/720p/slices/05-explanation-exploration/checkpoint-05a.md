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
