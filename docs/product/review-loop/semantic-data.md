# Semantic protocol values and conformance data

**Contract:** source-neighborhood-v1, analyzer source-neighborhood-v1.0.1, inventory source-declarations-v1.0.0, parser typescript@6.0.3

**Status:** Exact value compatibility for the bounded candidate. These data recipes do not confer trusted acquisition/worker authority.

**Parents:** [Static analysis](source-analysis.md), [semantic persistence](semantic-storage.md), [loader identity](source-acquisition.md).

## Normalized inputs

All objects below are JSON values. Optional means omit the member when absent; it does not mean null, an empty object or an automatically inserted default. Present empty arrays/objects and present false flags remain present in digests. Semantic canonical JSON recursively sorts object keys by raw lexical UTF-16 code units, preserves array order, and uses ECMAScript JSON string/number encoding without whitespace. SHA256 hashes those UTF-8 bytes. Source/path and seed ordering use the same raw lexical comparison, never locale collation. Only validated finite integral budget/coordinate values enter the supported protocol.

| Object | Exact required members and optional members |
|---|---|
| Inventory input | contract=`source-neighborhood-v1`, snapshotId, change, commits, corpus, sources, profile, budgets. There is no seeds member. |
| Compute input | All inventory members plus seeds, a nonempty array before deduplication. |
| change | repository, provider, changeId, all nonempty strings. Integration uses the declared targetProject, provider name and decimal string of the change number respectively. |
| commits | base and head Git commit IDs, each40 or64 lowercase hex characters. |
| corpus | base and head objects, each with commit matching commits[side], inventory (`changed-only`/`selected-context`/`repository-enumeration`) and nonempty acquisition string. Integration uses acquisition=`pinned-typescript-context-v1` and repository-enumeration only for complete loader traversal; otherwise selected-context. |
| SourceEntry | side (base/head), path, commit, role (changed/context/declaration-only), selected boolean; optional source and exclusion. source, when present, has content, contentHash and optional objectId. exclusion, when present, is excluded/missing/unsupported. |
| profile | name=`repository-static-v1`; optional configuration. Integration currently sends exactly the name-only object. |
| configuration | source (complete anchor), paths (object mapping alias patterns to ordered arrays of target strings); optional extends (ordered string array), packageImports boolean, packageExports boolean. These pinned configuration facts describe supported resolution/limitations, not permission to read a live config or execute it. |
| Seed | side, path, contentHash, start, end. It has no snapshotId or line members. Offsets are UTF-16, end exclusive. |
| Anchor | snapshotId, side, path, contentHash, start, end, startLine, endLine. All are required. Lines are one-based; offsets are zero-based. The end line contains max(start,end−1). |

Paths are relative slash-separated strings without leading slash, backslash, NUL, colon, empty components, dot or dot-dot components. Prepared source contentHash is SHA256 of exact UTF-8 text bytes; objectId, if present, is40/64 lowercase hex. SourceEntry.commit matches its side. There is one SourceEntry per side/path. An absent source is not an empty file. The integration projection includes only loader kind=source rows; tree/submodule boundaries remain in the retained loader account. Prepared rows include source; other rows carry their exact preparation as exclusion, with a defensive prepared-without-bytes row mapped to missing. Every ledger source row survives the projection.

For pure fact identities and sourceMetadata only, normalize source rows by sorting their `side + ":" + path` keys. The digest sourceMetadata row preserves every SourceEntry member, including any exclusion; replace source with `{contentHash,objectId?}` if bytes exist, or add source=null if absent. Do not put content in sourceMetadata. Do not add exclusion=null or objectId=null. inventoryBytes is the UTF-8 byte length of semantic canonical JSON for this complete sourceMetadata array, including excluded/unselected rows. The complete content-bearing sources remain in the worker input and its inputFingerprint.

Normalize compute seeds by exact side/path/contentHash/start/end identity, deduplicate, then sort by side:path, numeric start, numeric end, lexical contentHash. Inventory input omits seeds; it is not a compute request with a synthetic seed. The normalized arrays and every supplied profile/configuration field participate in identity. Supported budgets are required and fully expanded; partial overrides must be expanded before this port.

| Budget key | Default/maximum |
|---|---:|
| inventoryPathsPerSide |4096|
| inventoryBytes |2097152|
| filesPerSide |128|
| fileBytes |262144|
| totalBytes |4194304|
| seeds |64|
| astNodes |200000|
| invocationSites |10000|
| outputNodes |2000|
| outputSites |4000|
| aliasPatterns |32|
| aliasTargets |4|
| reExportLinks |32|

Each budget is a safe integer from0 through its maximum. This differs from loader budgets, which are positive and require inventoryMetadataBytes≥2. Lowering a budget changes request identity. The source/context/worker transport budgets remain independent.

## Exact hash objects

The following member names are exact; object construction order is irrelevant here because semantic canonical JSON sorts keys:

- corpusDigest hashes `{sources: sourceMetadata, corpus, profile}`.
- inventoryId hashes `{inventory:"source-declarations-v1.0.0",parser:"typescript@6.0.3",contract,snapshotId,change,commits,corpus,sources:sourceMetadata,profile,budgets}`.
- analysisId hashes `{contract,analyzer:"source-neighborhood-v1.0.1",parser:"typescript@6.0.3",snapshotId,change,commits,corpusDigest,profile,seeds:normalizedSeeds,budgets}`.
- A function node ID hashes the array `[snapshotId,declarationAnchor,kind]`. kind is function/const-arrow/const-function/module/callback. The node has id, name, kind, declaration, body and role; name/body/role do not independently enter that ID. A module/callback remains distinguishable by kind and its exact declaration anchor, even when source spans overlap.
- A resolved edge ID hashes `[callerNodeId,calleeNodeId]`. Edge members are id, caller, callee, target (implementation anchor), sites, method=`ts-static-binding-v1` and certainty=`resolved_static`. Each site has anchor, conditional boolean, linkage anchor array and signatures anchor array; site records do not have separate IDs.
- An unresolved site ID hashes `[callerNodeId,siteAnchor,reason]`. Its value has id, caller, anchor, syntax, reason and candidates (anchor array). Reasons use the static-analysis vocabulary; unresolved is not a resolved edge with a weaker label.

Node/edge/unresolved ordering and eligibility, coverage conservation and relationship assessments follow [static analysis](source-analysis.md) and [parent validation](semantic-storage.md). Identical canonical IDs alone cannot establish that a source was selected and scanned. Worker inputFingerprint hashes the canonical complete inventory/compute input exactly as sent, preserving its source/seed array order and duplicate seeds; the fact-identity sorting/deduplication above does not rewrite that transport input. It does not hash the metadata-only projection or envelope/invocation ID. Thus reordered inputs can share pure fact IDs while having different inputFingerprint values. The integrated context projection already sends its ledger in sorted order.

## Complete worked vector

[semantic-data-v1.json](semantic-data-v1.json) is normative protocol data. semantic.inventoryInput and semantic.computeInput are complete inputs, including all profile, source/exclusion, budget, side-account and seed members. semantic.sourceMetadata is the exact projection used by the digest and metadata byte measure. semantic.expected contains complete returned node/edge/unresolved values, so each returned kind and every call/declaration/body anchor is inspectable without guessing a shape. The fixture has a BOM, CRLF and an astral character, a static caller/callee edge, an unresolved runtime method and an excluded path. It deliberately does not claim that the excluded source was scanned or that the runtime method executed.

| Expected value | Literal |
|---|---|
| inventoryBytes |415|
| corpusDigest |`adecbd0386cee40c90f990913864a42914682a5a5528ba007c93145d7a217313`|
| inventoryId |`f778487157458f5f5963387bd8d71948fa751c798fbf9775509fc3ca761ba761`|
| analysisId |`b40ac25418f1e748dff368e41b30348a8703b7c7778e6b43dd64e341837aa2cd`|

Recompute these from the JSON inputs and recipes above, then recompute each expected node/edge/unresolved ID from its exact anchor/kind/reason. Source hashes use exact UTF-8 bytes, while offsets count UTF-16 code units: the astral character consumes two, BOM consumes one, and CRLF is one line break whose LF offset remains on the prior line. The expected bodies use end-exclusive ranges and their last occupied line. These are deterministic data checks, not an independent compiler rebuild, live-provider result or private witness.
