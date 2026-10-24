# Persisted data and legacy identity compatibility

**Contract:** Documentation version 1. These names describe delivered formats; they are not new persisted schema/version fields.

**Parents:** [Review contracts](contracts.md), [continuation and preparation](evolution.md), [additive import job/identity formats](import-jobs.md#persisted-job-representation-and-public-ports)

Rebuilding the current product includes opening a copy of its supported earlier SQLite store, not merely inventing equivalent fresh data. Preserve source IDs, saved discussion, capabilities, receipts, inbox cursors and notification uncertainty. Never repair incompatibility by resetting data or generating replacement source/participant identities.

## SQLite aggregate formats

The delivered files use SQLite user_version 0 with JSON text records; there is no numeric application schema discriminator. The following physical tables and column names are compatibility facts. Identity keys and JSON bodies are text; added revision/byte columns described below are integers. JSON bodies use the member names below. Extra retained JSON members survive an additive migration and are not automatically interpreted as new authority.

| Table / key | Other columns and meaning |
|---|---|
| reviews / id | body: review aggregate. id equals body.reviewId. |
| receipts / id | actor, fingerprint, body. id is commandId; actor is the authenticated actorId, fingerprint is the versioned SHA-256 representation below, body is the immutable receipt. |
| credentials / hash | body: principal JSON. hash is lowercase SHA-256 hex of the UTF-8 bearer token, never the plaintext token. Existing token/verifier pairs remain unchanged. |
| challenges / id | body: reviewId, host, sessionId, connectionId, owner (actorId), proofHash (SHA-256 UTF-8 proof), expiry (Unix milliseconds), consumed (boolean). One-use/expiry/connection checks survive migration. |
| preparation_inputs / review_id | body: validated original manual specification, separate from history. review_id references reviews.id. This table/row may be absent in earlier stores; create the empty table without changing earlier records. |

Pre-history review bodies contain reviewId, snapshot, revision, attachment (object or null), questions, replies, inbox and attempts. Current bodies additionally retain snapshots (ordered immutable snapshot array) and currentSnapshotId. The stored snapshot compatibility member follows current after a new admission. Public queries substitute the selected snapshot and derive snapshotSummaries; summaries are not a second authoritative source store. Missing optional parentQuestionId or reply.snapshotId remains absent, not null/default-generated.

| Aggregate value | Persisted members / interpretation |
|---|---|
| Snapshot / source | Snapshot: snapshotId, repository, prUrl, prNumber, baseSha, headSha, sources; optional title, changedFiles, documentReferences. Source: path, side, content, lineCount, hash. The newer optional provider/object/mode/hunk/count fields are defined in evolution knowledge and must be preserved if present; manual-v1 does not fabricate them. |
| Attachment | attachmentId, actorId, host (`codex` or `claude`), sessionId, connectionId, generation, active. Preserve the entire binding; source addition does not replace it. |
| Question | questionId, anchor, text, actorId, revision, createdAt (UTC string), working (boolean); newer optional parentQuestionId. Anchor members are snapshotId, side (`base` or `head`), path, startLine, endLine, one-based inclusive. |
| Reply | replyId, questionId, body, evidence (anchor array), limitations, actorId, attachmentId, generation, revision; newer optional snapshotId. For legacy replies without it, the question's anchor supplies snapshot identity; do not rewrite their evidence. |
| Inbox item | eventId, questionId, attachmentId, generation, cursor, read (boolean). Array order, cursor/read state and addressed event IDs remain intact. |
| Attempt | invocationId, eventIds (ordered array), attachmentId, generation, state (`requested`, `notifying`, `notified`, `unknown`, `failed`), reason. Migration never starts/replays an attempt. Separate runtime recovery changes a surviving notifying claim to unknown while retaining its identity. |
| Receipt body | commandId, actorId, state (`applied` or `rejected`), revision, cursor, result (opaque result object), optional error. Preserve body and actor/fingerprint columns, including rejected outcomes. |

Credential body discrimination is by kind: user has actorId (issued local owner is `local-user`); agent has actorId, reviewId, attachmentId, generation; bootstrap has actorId, host, sessionId, connectionId, corroborated (boolean). The issuer generates 32 random bytes represented as 64 lowercase hex characters for tokens; imported existing tokens need not be regenerated. Authentication derives the principal from the verifier row and rechecks current attachment/generation for agent access. A stored bootstrap claim is not general source access.

Provider/import additions retain their exact physical/job/receipt/reference formats in import-jobs.md; they add tables and a derived review identity lookup without rewriting these legacy rows.

The migration discriminator is missing history members, not an absent version number: use an existing snapshots array if present, otherwise the original snapshot as a one-element array; use existing currentSnapshotId if present, otherwise original snapshot.snapshotId. Require a nonempty array, unique snapshot IDs and a pointer found in that array. If either history member was absent, save the additive result. Preserve revision and every other aggregate value, array order, other table row and credential verifier. Perform all review conversions in one transaction; malformed JSON or failed history integrity aborts and rolls back earlier conversions. Reopen is idempotent. This is a compatibility reader for the described family, not a universal corrupt-store repair or future-version converter; unsupported structure must not be guessed/reset. Initialization may create missing declared tables; failure does not erase recoverable original bodies.

For example, a legacy body with snapshot S, revision 6, question Q anchored to S and unknown attempt I becomes the same body plus snapshots=[S] and currentSnapshotId=S. Q, I, their cursor/generation, receipt rows and credential hashes remain unchanged. A malformed second review cannot leave the first review half-converted. After admitting T, current becomes T while S/Q/I remain retained. Repeated original setup verifies S against history and exports T, without rewinding current.

Private local-user.json contains the plaintext local bearer in its token member; runtime.json carries the reference to that private file. The file is never public protocol output. source-input.json and snapshot.json are regenerable setup/current exports. Runtime/PID/lock and MCP launch files are local operational references, not a substitute for SQLite authority. Preserve them separately during owner-approved backup; never publish their credential contents.

## Manual source identity v1

Read original Git blob bytes with strict UTF-8 decoding, preserving a leading UTF-8 BOM as U+FEFF. Do not normalize Unicode, CRLF or trailing newline. Reject invalid UTF-8, NUL and empty selectable content. SHA-256 source hash uses the original decoded string re-encoded as UTF-8, lowercase hex. Split source lines only at LF; if content ends in LF, exclude exactly the final empty split element from lineCount. CR remains in its line. Thus `A\r\n` and `B\n` each have one line; `A\n\n` has two, and a lone LF is one empty selectable line. BOM contributes to hash/content. The presentation may display an empty line, but must not change stored bytes to compute identity.

[Construction order](evolution.md#verified-preparation-and-identity-schemes) is normative. Compact JSON uses ordinary JSON string escaping, no indentation or terminal newline; omitted optional members are absent, never synthesized null. One-path identity has only baseSha, headSha, sources: no empty changedFiles/documentReferences arrays. Multi-path identity includes those arrays even when references are empty. Added oldPath and deleted newPath are explicitly null; there is no disposition or invented source for the absent side. Sources/dispositions follow literal Git inventory order with base before head; context appends in link encounter order. Manual status literals are modified, added, deleted, type_changed. The manifest uses repository `scottchu/pr-reviewer` and real matching project PR aliases, independently verified by owner orchestration; those aliases/title are not in the legacy hash but are compared as part of the verified manifest.

Disposition members are side, path, state, reason. The exact hash-bearing reason vocabulary is stable compatibility data:

| State / trigger | Exact reason |
|---|---|
| prepared explicit text | `verified Git blob` |
| prepared context promoted from an unprepared changed side | `verified referenced Git blob` |
| unprepared outside explicit selection | `outside explicit prepared paths` |
| unsupported failed Git/object read | `source_unavailable: pinned Git object cannot be read` |
| unsupported non-blob | `source_unavailable: selected path must be a blob` |
| unsupported invalid UTF-8 | `source_unavailable: selected blob is not valid UTF-8` |
| unsupported NUL content | `source_unavailable: binary content` |
| unsupported empty text | `source_unavailable: empty content` |

A reference always has destination, source, target, method, reason, in that order. Destination is the extracted literal link destination. source is its exact same-side link-line anchor. target is a resolved exact same-side heading/start anchor or null; method is always `inline_markdown_link`. Success has reason null. Failure has target null and the exact reason: one of the source-read reasons above, `external destination`, `unsupported or outside repository destination`, `outside repository destination`, `heading fragment unresolved`, `context source budget exhausted`, or `URI malformed` for invalid percent escapes. These legacy reason strings participate in identity; improving diagnostic wording requires a new scheme, not changing an old ID. Both source/target anchors use literal snapshotId `pending` during hashing and the computed ID in the final manifest. Target source already read before an unresolved heading remains in sources. Context-only sources have no invented changed-file row. Missing is representable for later acquisition, but manual-v1 represents failed explicitly selected reads as unsupported.

## Receipt fingerprint v1

Normalize a valid command before hashing: trim question text, or reply body/limitations, using ECMAScript string trim and enforce the existing UTF-8 limits. Keep commandId, reviewId and every supplied validated member, including anchor/snapshot IDs and optional parentQuestionId; do not add absent optional values. On normalization failure, fingerprint the original valid-envelope payload and store its rejected receipt. Recursively sort object member names using the delivered ECMAScript String.localeCompare ordering (current schemas use fixed ASCII member names), retain array order, then compact JSON-serialize and SHA-256 its UTF-8 bytes to lowercase hex. This canonical order differs deliberately from the manual source hash's construction order. Unknown/extra envelope fields reject before this protocol; arbitrary object-order input permutations do not change a valid fingerprint.

Look up receipt by commandId. Same actor and exact fingerprint returns its original body without a new revision/mutation, even after migration or when source verification later becomes unavailable. Changed payload or actor returns command_conflict without replacing that receipt. Pairing receipts use ID `attach:` followed by challengeId and fingerprint the canonical object containing challengeId and connectionId; the challenge is still single-use, not a generic AddSnapshot/AskQuestion replay route. Actor/hash/body preservation is necessary for unchanged legacy retries.

## Normative compatibility vectors

These small data vectors describe hashing, not real provider provenance. The source fixture has fixed comparison base `85c4cc5ef2b3ae02fe120ac19aca2815d86268d5`, head `54d0cd7ca8d89a01a6feb02709ecb8f2d3fff3b0`. Base a.txt is `A\r\n`, head is `B\n`. Base b.md is `# Before\n[missing](missing.md)\n`, head is `# After\n[missing](missing.md)\n`. Both files are modified, sorted a.txt then b.md, and missing.md is absent on both sides. String escapes here denote actual characters; there are no BOMs in these vectors.

| Vector | Required result |
|---|---|
| Source a.txt/base | lineCount 1; hash `26ffd5886253906a36a7ea0f6e26056fc36472626cb4894bcb100a34dc69d1db` |
| Source a.txt/head | lineCount 1; hash `c0cde77fa8fef97d476c10aad3d2d54fcc2f336140d073651c2dcccf1e379fd6` |
| One-path a.txt | base then head sources, no ledger/reference members; snapshotId `3fe24971d42609a7e83ea4ad5c693f908b03ed543ef8d82d7b71ce98f6a98ccf` |
| Multi-path selecting only b.md | Sources b.md base/hash `343a3b6df93d6dbc620489c169bfaed2becf17b17c3cb8eeff6a4984ae6e82fd`, head/hash `c54a0cfda28c20ff85efb42f7ba22cd15f2561f61840493bf84b7f950a676a1e`, both lineCount 2. Ledger a.txt is unprepared/outside explicit prepared paths on both sides; b.md prepared/verified Git blob on both. References base then head: destination missing.md, source b.md line2–2, target null, method inline_markdown_link, failed Git-read reason above. snapshotId `0605b48424ec56fe55f946dbcfbfc938b1cb3f15e40a012c96b3273336c223dd`. |
| Real legacy PR14 compatibility | Durable runtime's pinned base/head and docs/README.md one-path input retain snapshotId `aefdff44d33f7202f2bbdce5483f3deac88de8d9c18a29efabbeaf4d3e753e47`. |

For an AskQuestion with commandId compat-question-1, reviewId compat-review, head a.txt line1–1 in the one-path vector and input text `  Why?\n`, the exact canonical payload is:

```json
{"anchor":{"endLine":1,"path":"a.txt","side":"head","snapshotId":"3fe24971d42609a7e83ea4ad5c693f908b03ed543ef8d82d7b71ce98f6a98ccf","startLine":1},"commandId":"compat-question-1","reviewId":"compat-review","text":"Why?","type":"AskQuestion"}
```

Its fingerprint is `19993f0600c97b6769933cf3aa4093913b35438db52c8cff4db6750c0119db6e`. Reordered object members and input text `Why?` must return the same retained receipt for actor local-user; changed normalized text or actor conflicts. This is protocol data, not application implementation. New identity schemes must preserve or explicitly adapt these vectors without rewriting retained IDs.

## Manual Markdown reference identity v1

Reference recognition is a bounded delivered grammar, not CommonMark. These details determine retained source membership, reference anchors/reasons and therefore manual-v1 IDs. A replacement parser must reproduce this scheme or use a new version; it cannot silently enrich old manifests during verification.

- Analyze only directly selected source paths ending in lowercase `.md`, in their existing source order; context added by links is not recursively analyzed. Split at LF, retaining the original one-based line number. A recognized link's source anchor spans that whole line (start=end), not character offsets. The global first-120 budget and source-object limits remain unchanged.
- Exclude blockquote lines (up to three initial spaces then `>`), and lines indented by four spaces or a tab. Repeated blockquote prefixes are stripped only to recognize fence structure; quoted content is still excluded. A fence opener permits up to three spaces, an optional list marker (`-`, `+`, `*`, or decimal digits followed by `.`/`)`, then one space), and at least three identical backticks or tildes. Backtick openers cannot contain another backtick after the opening run. A closer has up to three spaces, the same marker repeated at least the opening length, then whitespace only, with matching quoted/unquoted context. All fence contents are excluded; list prefixes are not accepted on closing fences.
- Outside excluded lines, a backslash and following UTF-16 code unit are treated as escaped text and cannot create syntax. Backtick runs suppress inline content until a run of exactly that opening length; this state can continue across lines and resets at a recognized fence opener. This conservative scanner does not implement all Markdown containers or emphasis rules.
- Recognize `[label](destination)` with no whitespace between closing bracket and opening parenthesis: label is nonempty and contains no closing bracket, destination is nonempty and contains neither whitespace nor closing parenthesis. An immediately preceding `!` excludes images. A destination may be followed by whitespace and one double-quoted title before closing parenthesis; the title is not part of destination. No reference-style links, HTML links or single-quoted titles are interpreted. Angle brackets are not unwrapped; they remain literal path characters if encountered. Unsupported forms produce no attempted reference, rather than a fabricated unresolved record.
- A URI scheme (letter first, then letters/digits/plus/dot/hyphen before colon) or leading `//` yields external destination. Otherwise split at the first literal `#`, then percent-decode path and fragment separately as UTF-8. Invalid encoding yields URI malformed; encoded `%23` remains a literal path character. Decoded path cannot begin `/` or contain NUL or `?`. Resolve relative to the origin directory (empty path means origin itself), discard empty/`.` segments, resolve `..` without crossing repository root. No query-string stripping, extension guessing, case normalization or path renaming is performed.
- A missing fragment or empty fragment targets line 1–1 of the verified same-side text object. A nonempty fragment matches the first eligible ATX heading line whose normalized text equals that decoded fragment. Eligible headings begin at column one with one to six `#` followed by one ASCII space, outside the excluded/inline-code text above. Remove the leading hashes and one space, lowercase the remainder, remove every character except Unicode letters/numbers, ASCII spaces, underscore and hyphen, then replace EACH ASCII space with a hyphen. Do not trim/collapse spaces, add duplicate suffixes or normalize the requested fragment's case. Duplicate headings select the first matching line. Missing matches yield heading fragment unresolved, even when a platform's richer Markdown renderer would resolve another slug.

Normative data vectors (origin `docs/a.md`, same-side target `docs/b.md` text `# Intro\n# Topic\n# Topic\n`):

| Literal input | Reference result |
|---|---|
| `[go](b.md#topic)` on origin line 4 | destination b.md#topic, source line4–4, target docs/b.md line2–2 (first duplicate), method inline_markdown_link, reason null. |
| `[go](b.md)` or `[go](b.md#)` on line 4 | target docs/b.md line1–1, method inline_markdown_link, reason null; source remains line4–4. |
| `[go](b.md#topic-1)` or `[go](b.md#Topic)` | target null, reason heading fragment unresolved; no duplicate-suffix or fragment-lowercasing fallback. |
| `[go][topic]`, `<a href="b.md">go</a>`, or `![go](b.md)` | No reference emitted by this grammar. |
| Target heading `# Foo  Bar!`, requested fragment foo--bar | Matches that heading's exact line; fragment foo-bar does not match. |

All successful target anchors retain the origin's source side and the final immutable snapshot ID. Identity construction substitutes pending only in snapshotId members, as defined above. These vectors specify compatibility behavior; they do not claim richer Markdown/semantic analysis or an actual provider operation.


## Story table compatibility

These additive tables share the existing SQLite connection and `reviews.id` membership. Create missing tables without resetting earlier review/semantic/import data; user_version remains0. Column order is part of supported physical compatibility because delivered inserts use it. All listed non-ID columns are required; authoritative IDs are nonempty. The JSON bodies and IDs remain immutable except the small head pointer/counter body.

| Table | Columns in physical order | Keys and membership |
|---|---|---|
| story_heads | review_id, snapshot_id, body | Primary key (review_id,snapshot_id); review_id references reviews.id. |
| story_captures | id, review_id, snapshot_id, body, bytes | Primary key id (captureId); review_id references reviews.id. |
| story_contexts | review_id, snapshot_id, revision, body, bytes | Primary key (review_id,snapshot_id,revision); review_id references reviews.id. |
| story_versions | id, review_id, snapshot_id, revision, body, bytes | Primary key id (versionId), unique (review_id,snapshot_id,revision); review_id references reviews.id. |
| story_receipts | id, actor, fingerprint, body | Primary key id (commandId). actor is authenticated actorId; fingerprint binds the full principal and command. |

`revision` and `bytes` are integers. `bytes` is the UTF-8 length of the exact compact canonical JSON body, without a newline; it is not source text length, character count or digest length. Bodies recursively sort object member names, preserve array order and exact text, and omit absent optional members. No numeric schema discriminator is stored inside these story rows.

| Body | Complete member/absence meaning |
|---|---|
| Head | storyRevision, contextRevision, currentVersionId, seriesAuthor. Both counters are nonnegative integers. currentVersionId is a string or explicit null; seriesAuthor is the initial full user/agent principal or explicit null. Missing head means both revisions0 and both nullable members null. |
| Capture | captureId, kind (Epic/Ticket/PR), title, text, actorId, createdAt, contentHash, freshness; optional originUrl and supersedesCaptureId are absent when not supplied. contentHash is lowercase SHA-256 of exact capture text UTF-8. freshness is captured with an origin URL, otherwise unknown. createdAt is server-issued UTC ISO text. |
| Context | Exactly captureIds, an ordered unique array of retained IDs from this review/snapshot. Revision0 implicitly means an empty array and requires no row. A later explicit empty selection has its own positive revision/row. |
| Version | reviewId, snapshotId, versionId, storyRevision, contextRevision, contentHash, author, createdAt, previousVersionId, story. previousVersionId is explicit null for the first version, otherwise the preceding current ID. story is the complete strict authored value in the [story contract](story-and-exploration.md#immutable-story-and-context-values); optional questionId and paired analysisId/corpusId remain absent when unused. contentHash covers canonical story payload only, not server metadata. |
| Story receipt | commandId, actorId, state (applied/rejected), reviewId, snapshotId, storyRevision, contextRevision, result; error is absent on success and supplied on rejection. result always exists: captureId for context create, versionId for publication, or an empty object for context selection/rejection. It is not a legacy review revision/cursor receipt. |

A user author is exactly kind=user and actorId. An agent author also retains reviewId, attachmentId and generation with kind=agent. Preserve the full principal in version.author and head.seriesAuthor; do not rebuild agent authority from actorId alone. The first successful publication establishes seriesAuthor, which stays unchanged when a user appends a correction. Current-version author may differ from seriesAuthor; ownership transfer is not implicit.

Body quota sums bytes once for every immutable capture/context/version across the entire review, including old revisions, up to8MiB (owner tests may lower only). Heads and receipts are excluded; implicit context0 consumes no quota. Context create charges the new capture plus new selection body; select charges its new selection body; publish charges its full version body. Exact quota passes. One byte over rejects atomically, preserving bodies/pointers and recording only the authorized rejected receipt. Pre-dispatch schema/authorization errors and ID collisions do not overwrite another receipt namespace.

Compact normative row/retry vectors (opaque sample IDs are fixed data, not an ID-generation algorithm):

| Starting records and action | Required retained result |
|---|---|
| No rows for review R / snapshot S | Query is storyRevision0, contextRevision0, currentVersionId null, seriesAuthor null; context0 is captureIds empty, with no required physical row. |
| User U creates capture C1 under expected context0 | Head body is `{"contextRevision":1,"currentVersionId":null,"seriesAuthor":null,"storyRevision":0}`. Capture row C1 and context row (R,S,1) exist; the latter body is `{"captureIds":["C1"]}`. Story revision remains0. |
| Select empty captures under expected context1 | Append context row (R,S,2), body `{"captureIds":[]}`; preserve C1/context1. Head contextRevision2; other head members unchanged. |
| Publish version V1 by U at story0/context2 | Append version row V1 / revision1 with previousVersionId null. Head is contextRevision2/currentVersionId V1/seriesAuthor `{"actorId":"U","kind":"user"}`/storyRevision1. Persist its receipt Q1 and full principal+command fingerprint atomically. |
| Exact authorized retry Q1 after another context revision | Return the identical original receipt/version IDs and original revision values. No second body, quota charge, publication or notification. Fresh authorization and series ownership still apply before replay. |
| Reuse Q1 with another payload/principal, or collide with a legacy/import/analysis receipt ID | command_conflict; no second value or overwritten original receipt. Revoked/unauthorized principals cannot obtain replay merely by knowing Q1. |
| Close/reopen a copy of this store | Preserve C1, both context rows, V1, Q1, counters/nullability/author attribution and all earlier review data. Do not synthesize a different source, author, pointer or receipt. |

For a capture whose exact text is `why`, contentHash is `2be23c585f15e5fd3279d0663036dd9f6e634f4225ef326fc83fb874dbb81a0f`, independent of title/origin/time; those metadata still contribute to its canonical body bytes/quota. These vectors specify format compatibility. Same-code reopen tests are engineering evidence, not independent cross-implementation compatibility acceptance.
