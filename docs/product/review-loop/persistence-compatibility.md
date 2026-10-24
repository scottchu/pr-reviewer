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

Legacy local-user.json may contain a plaintext local bearer in its token member and older runtime.json may carry its reference. Preserve existing files, but current runtime startup neither reads nor creates them and new manifests omit that reference. The file is never public protocol output. source-input.json and snapshot.json are regenerable setup/current exports. Runtime/PID/lock and MCP launch files are local operational references, not a substitute for SQLite authority. Preserve them separately during owner-approved backup; never publish their credential contents.

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

## Structural comparison identity compatibility

A primary comparison key (`GraphFile.key`, called `fileKey` in stories and saved views) is a compact ECMAScript JSON array string, not a digest. If the snapshot has `changedFiles`, preserve its exact ledger order, including an explicitly empty array. For each zero-based ledger index, encode `[index, oldPath, newPath]`; absent sides are literal JSON null. Status, source bytes/hash, provider hunk and snapshotId are not members of this key. A reordered ledger changes these keys; identical ordered ledgers in different snapshots may have identical keys, so the containing snapshot identity remains mandatory.

Only when `changedFiles` is absent, collect distinct source path strings in first-occurrence manifest order. The key at index i encodes `[i, path, path]`, including a path with only one supplied side. This fallback row has status modified, no dispositions, and oldPath/newPath equal to that path only for actually supplied base/head sides, otherwise null. The fallback key still contains the path twice rather than those nullable row fields. Never sort paths, deduplicate the retained source manifest, or substitute a source hash. An explicit empty ledger does not invoke this fallback.

Structural node identities use the following complete recipes. Here “encode” means compact ECMAScript JSON.stringify with array order preserved, native string escaping and no added spaces/newline. Each intermediate encoded value is a **string** inside the next array, not a nested array. No Unicode normalization or hashing occurs.

| Identity | Exact value to encode |
|---|---|
| Source identity | `[snapshotId, side, path]` |
| Provider file node | `[fileKey, encoded source identity]` |
| Provider structural hunk node | `[fileKey, retained acquisition hunk id, side]` |
| Manual/non-provider file node | The encoded source identity itself |
| Manual/non-provider structural hunk node | `[encoded source identity, startLine, endLine]`, using one-based inclusive run endpoints |

The presence of `candidate` selects provider graph projection; presence of `changedFiles` alone does not. Provider projection visits ledger rows in order, then base/head. It uses the first retained source with the row's exact side/path for lookup without altering manifest multiplicity. Missing/empty sources have no selectable node. Each retained acquisition hunk contributes a side-specific structural hunk only when that side's length is positive; its anchor is sideStart through sideStart+sideLength−1. Acquisition hunk IDs already have their own [pinned acquisition recipe](acquisition-compatibility.md); the structural ID wraps that retained ID rather than hashing its line range again. Provider nodes carry their row's fileKey.

Manual projection visits manifest sources in order. Its structural hunks are maximal contiguous runs of changed lines in that side's bounded comparison, excluding unchanged/not_analyzed lines. Split source lines by removing one trailing LF and splitting on LF. For a same-path opposite side, use exact-line longest common subsequence: greedily retain equal lines; on equal remaining subsequence lengths choose removal from base before addition from head. Each block between retained equal lines marks both sides modified if it has removals and additions, otherwise removed/added. The comparison is unavailable above one million base×head lines. With no opposite side, an explicit added-head/deleted-base ledger row marks added/removed; another matching ledger status is not_analyzed, and no matching row is unchanged. Manual file/hunk nodes omit fileKey; their source path/side and graphFiles membership validate a story focus. Do not fabricate hunks for unavailable or unchanged runs.

A story structural hunk must be an actual hunk node with the exact ID, matching its fileKey when that node carries one and matching the row's path on the node's side. A sources focus must also match its row's side paths. Private maps retain the same keys, not replacement coordinates. Copy comparisons can share the exact base source with a modified original: `[0,"a.md","a.md"]` and `[1,"a.md","b.md"]` remain distinct primary keys and yield distinct provider base nodes even with identical source bytes. Explicit comparison selection uses the exact key; an ordinary path-only lookup chooses the first matching ledger side/path and cannot distinguish all copies.

[Complete structural/story conformance data](graph-story-compatibility-v1.json) supplies full snapshots and expected ordered file keys and file/hunk identities. Its graph cases cover manual single-file fallback, first-occurrence multi-file/head-only fallback, explicit added-side ledger, explicit empty ledger and provider modified-original/copied/added comparisons with a repeated base-source manifest occurrence. For snapshot S/head/a.md, the manual file ID is `["S","head","a.md"]`; its line1 hunk ID is `["[\"S\",\"head\",\"a.md\"]",1,1]`. With provider key `[0,"a.md","a.md"]` and acquisition hunk H1, the head hunk ID is `["[0,\"a.md\",\"a.md\"]","H1","head"]`. The fixture's identities are nonsecret protocol data, not a verified Git acquisition or source witness.

## Story receipt fingerprint compatibility

This story-family protocol is distinct from [legacy receipt fingerprint v1](#receipt-fingerprint-v1) and from the browser request hash. Parse the complete strict PutStoryContext/PublishStory command first, preserving every supplied valid member, commandId, ordered array and exact text. Do not trim story prose/capture text, normalize Unicode, add absent optional members, or include generated version/capture IDs, timestamps or receipt fields. Obtain the complete current credential-derived principal: a user object has exactly kind and actorId; an agent object additionally has reviewId, attachmentId and generation. Bootstrap is unauthorized.

The hash-bearing value is an **object with exactly two members named `principal` and `command`**, whose values are those complete objects. It is not an array or concatenated separately encoded strings. Canonical encoding recursively sorts object member names by ECMAScript string `<`/`>` comparison (UTF-16 code-unit lexicographic order, not localeCompare), omits undefined/absent object properties, preserves array order, and uses compact native JSON encoding of keys/primitives. Supported inputs have no undefined array elements or nonfinite numbers. Null remains null and is never substituted for absence. Thus the top-level canonical text starts with `{"command":` and ends with the complete principal member. Hash its exact UTF-8 bytes, without BOM or final newline, with SHA-256 to lowercase hexadecimal. The same canonical rule covers story content hashes and stored story JSON bodies; their hash input is their own body, not this receipt wrapper.

[Complete owner/agent vectors](graph-story-compatibility-v1.json) contain each full command and principal, exact `canonicalPreimage` string and expected digest. The owner context selection uses ordered captureIds C2,C1; its preimage is:

```json
{"command":{"action":{"captureIds":["C2","C1"],"type":"select"},"commandId":"ctx-1","expectedContextRevision":0,"reviewId":"R","snapshotId":"S","type":"PutStoryContext"},"principal":{"actorId":"U","kind":"user"}}
```

Its fingerprint is `76b40f045856091a6c86b4700595b27302ba3ee766c5943b920dfaacd602f084`. The complete agent PublishStory vector has fingerprint `64649b193aaea457451dc7d959b86a6c3d3218bafdfb4183054cd0050886a7bb`; changing only principal.generation from3 to4 gives `33c92d95400c5315f73c6365861943e59efbfaa467e90b51ee73e60e4824f688`. That vector intentionally retains surrounding title/claim whitespace. Reordering object properties preserves either digest; changing capture array order, text bytes or the complete principal changes it. The receipt row's actor column remains actorId, while its fingerprint binds the full principal. Authorization/current attachment and series ownership still precede replay: a revoked/old-generation caller may fail authorization before hash comparison, while an otherwise authorized different payload/principal conflicts instead of replacing the original receipt. These are format/hash vectors, not authority grants or executed publication evidence.

## Browser private schema1 compatibility

The two tab sessionStorage keys are `pr-reviewer:pending-question:v1` and `pr-reviewer:private-view:v1`. Their values are JSON text, not nested storage entries. All objects below, including nested objects, are strict: an extra member rejects. All listed members are required unless marked optional. Null is allowed **only** where stated; omission is not null. Object member order/whitespace in the outer envelope is immaterial to parsing; the pending request member is a string whose original bytes are immutable and hash-bearing. No migration, repair, rekey or automatic resend is implied. A future format needs an explicit compatibility decision; unknown schema currently remains quarantined in place.

Shared scalar notation: ID is a nonempty string of at most128 UTF-16 code units; digest is64 lowercase hexadecimal characters. Number is finite; integer means a JSON number with integral value. Point is exactly x,y (finite numbers); viewport adds zoom (finite0.1–4 inclusive). Side is base/head. A snapshot Anchor is exactly snapshotId,side,path,startLine,endLine: snapshotId/path are nonempty strings and lines are positive integers; authorized immutable source membership and ordered valid span are checked separately. A semantic Anchor is exactly snapshotId,side,path,contentHash,start,end,startLine,endLine: snapshotId is ID; path is a safe relative repository path of1–1024 code units with no absolute prefix, backslash, NUL, empty/dot/dotdot segment; contentHash is digest; start/end are nonnegative integers in UTF-16 offsets and lines positive integers. Exact nonempty in-bounds ranges and retained authority are checked during restoration, never inferred from schema validity.

| Object | Complete serialized members and constraints |
|---|---|
| Pending envelope | schema exactly number1; origin nonempty string≤4096; scope digest; reviewId ID; draftId ID; phase awaiting_ack or accepted_awaiting_readback; request string; fingerprint digest; optional receipt object below. No snapshotId top-level: it is in request.anchor. |
| Stored request | String containing a complete strict AskQuestion object: type exactly AskQuestion, commandId nonempty≤128, reviewId string, anchor snapshot Anchor, text string, optional parentQuestionId nonempty string. No draftId or bearer member. reviewId equals pending.reviewId; text.trim is nonempty and≤16KiB UTF-8. The application initially uses story canonical encoding above, but recovery hashes/reuses the retained request string, never reparses/reserializes it to change bytes. |
| Review receipt in pending | commandId ID, actorId ID, state applied/rejected, revision and cursor nonnegative integers, result, optional error string≤256 (empty allowed). result is either exactly questionId ID plus eventId ID-or-null, or exactly an empty object. This is the review receipt family, not StoryReceipt. |
| View envelope | schema number1; origin and scope as pending; submitted array of0–64 IDs; omitted array of0–2 IDs; value PrivateStoryView-or-null. Neither array is optional, including when empty. |
| PrivateStoryView | reviewId ID, snapshotId ID, versionId ID-or-null, cursor Cursor-or-null, elapsedMs finite0–8000 inclusive, surface flow/diff, position Point, pageScroll finite≥0, maps GraphFrames, activeDraftId ID, drafts array of1–2 Draft objects, returnFrame ReturnFrame-or-null. |
| Draft | id ID; anchor snapshot Anchor-or-null; optional comparisonKey string≤4096 (empty allowed); optional parentQuestionId ID; text string; submitted boolean. Optional members are absent when unused, not null. Text omission uses an empty string plus envelope.omitted, never omission of text. |
| Cursor | versionId,chapterId,stepId (all IDs) and index integer0–31. index is flattened story step order; exact retained story cursor validation is additional. |
| GraphFrames | structural StructuralFrame-or-null; semantic SemanticFrame-or-null. Both keys required even when neither map exists. |
| StructuralFrame | fileKey string≤4096, context boolean, spans boolean, spanId string≤4096, viewport Viewport. Empty strings are allowed as unselected presentation values; restoration still requires available exact membership. Keys use the structural recipes above. |
| SemanticFrame | analysisId ID-or-null, focus string≤4096, viewport Viewport, fullSource boolean, sourceAnchor semantic Anchor-or-null, corpusId ID-or-null. Empty focus is allowed. Analysis/corpus/source membership is validated against retained authorized records at restore, not replaced by current facts. |
| ReturnFrame | snapshotId ID, versionId ID-or-null, cursor Cursor-or-null, elapsedMs finite0–8000, surface flow/diff, position Point, pageScroll finite≥0, maps GraphFrames, originalDraftId ID, evidence strict StoryReference-or-null. The full StoryReference discriminator/member union is [specified here](story-and-exploration.md#exact-authoring-core-value-contract); it is a value, not a source body. No reviewId, drafts, mode or bearer member is stored in this frame. |

Return-frame evidence uses the following exact discriminator union. All objects are strict; all digest/ID/path scalars follow the definitions above. Its snapshot anchor is the narrower authored-reference shape: snapshotId ID, safe relative path≤1024, side, and positive safe-integer startLine/endLine. This differs from the broader legacy draft Anchor parser; both still require authorized exact membership before use.

| evidence.type | Other members (no omitted required fields) |
|---|---|
| snapshot_source | anchor (authored-reference snapshot anchor), contentHash digest. |
| semantic_source | corpusId digest, anchor (complete semantic Anchor). |
| static_node / static_edge | analysisId digest, factId ID. |
| capture | captureId ID, contentHash digest; optional start and end must both be absent or both nonnegative safe integers with end>start (UTF-16). |
| metadata | field exactly title,prUrl,repository,prNumber,baseSha or headSha. No body member. |
| clarification | analysisId digest, clarificationId ID, revision positive safe integer. |

PrivateStoryView additionally requires unique draft IDs, an activeDraftId naming a retained draft, and an active non-null anchor on its own snapshotId. A non-null cursor's versionId equals the surrounding versionId. A return frame's originalDraftId names a retained draft different from activeDraftId, and its non-null cursor.versionId equals frame.versionId. Inactive original and exploration drafts may belong to different snapshots. Map/frame/source/story validation and credential/lifetime fencing precede hydration; a structurally valid envelope is never proof of source availability or permission. No extra schema-level paired-null constraint is implied for the map fields; invalid retained memberships are rejected by restoration rather than guessed.

Pending validation checks parsed AskQuestion membership/type and exact reviewId, request/record byte bounds and SHA-256 of the **stored request string UTF-8**. accepted_awaiting_readback additionally requires receipt present, applied state, same commandId, questionId and explicit nullable eventId. awaiting_ack normally omits receipt; the shape permits an optional strict receipt, but its phase still requires explicit identical-command ingress rather than receipt-based read-only recovery. A null eventId is valid saved-without-attachment data; a missing eventId is invalid. Before returning authorized private details, ReviewBridge separately requires successful review read, matching origin/scope and valid snapshot anchor. Accepted confirmation reads at least receipt.revision and matches actual questionId/actor/trimmed text/full anchor/parent; a later unrelated revision is insufficient.

Bounds count the full UTF-8 encoded stored JSON including escaping: pending≤256KiB and its request string≤128KiB independently; view≤64KiB. Production request writes validate before any POST and verify storage readback equality. Per-draft8KiB is the ordinary **save policy**, not an added wire-schema string maximum: oversized text remains in memory, stores text empty and records the draft ID in omitted. Submitted IDs force matching stored drafts to text empty/submitted true even for stale ordinary checkpoints. Preserve an omitted empty draft marker across passive checkpoints/reloads until explicit replacement/edit/reset; do not turn its missing body into a successful full recovery. Submitted and omitted IDs are local guards, never server command fields.

[Complete schema1 browser fixtures](private-session-v1.json) are normative nonsecret data, not executable code. Each named value is the **entire** record to JSON-encode at its corresponding key; the grouping names are fixture labels, not extra storage members:

| Fixture | Expected read/use |
|---|---|
| pendingAwaitingAck | Exact original request with surrounding text whitespace and parent Q0; fingerprint `98d7c5487165f1366d8ee33a3824ad4da5cfdb58bfd1d1131d32766c9bbe71b1`. Same authorized credential may explicitly resend only this exact string/commandId. No automatic send on hydration. |
| pendingAcceptedUnaddressed | Same request/fingerprint and applied receipt at revision7/cursor2, question Q1 and eventId null. Explicit recovery performs read only. Null event is not notification evidence. |
| pendingAcceptedAddressed | Complete alternative accepted record with eventId E1. Same read-only recovery; this data alone does not prove notifier execution. |
| ordinaryTwoDrafts | Active exploration D2 on T, inactive submitted original D1 on S; submitted guard D1, no omitted text. Return frame preserves S/V1 cursor,1250ms, structural/semantic maps, expanded source,500px scroll and snapshot evidence. Current exploration has no story version/cursor and null maps; null is explicit. |
| ordinaryOmittedDraft | Complete alternative ordinary view with D2 text empty and omitted D2. Preserve its unavailable-after-reload warning across passive saves; preserve D1 submitted guard. |

Legacy fixture scope values use the [nonsecret browser origin/bearer vector](story-and-exploration.md#browser-scope-compatibility-vector). Same-origin/same-scope parsing yields a record, but permission/hydration still waits for successful real review/source/story reads; these opaque sample IDs are not such reads. Valid records with different origin/scope remain locked. Invalid JSON, unknown schema, extra members, missing required nullable members, invalid view relationships, over-bound records, wrong request digest, or malformed accepted receipt remain quarantined at the original key. Keep raw data unchanged; ordinary reset is explicit and cannot clear pending. A storage read/write/readback failure is storage_unavailable, not absence. Completion first persists the matching submitted-draft guard, then clears only the fully matching pending identity/phase/receipt with removal readback; mismatch/clear failure conservatively retains uncertainty. Preserve the existing [recovery state and authority rules](story-and-exploration.md#exact05c-application-frame-and-private-storage-derivation).

### Single-owner browser scope

The current browser uses SHA256 of UTF-8 `pr-reviewer-local-owner-scope-v1`, NUL, then the decimal UTF-8 byte length of location.origin, colon, and exact location.origin. Persist the lowercase64-hex digest in the unchanged schema1 scope member. This is a matching guard for one local owner, not a credential. Legacy credential-scoped pending/view bytes remain preserved; an incompatible record stays locked without a credential-entry prompt or automatic rekey/replay. Current same-owner reload recovery requires explicit unchanged-command action and authoritative source/readback checks as before.
