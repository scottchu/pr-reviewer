# Owned import-result artifact preparation

**Date:** 2026-10-24

**Packet revision:** 1

**Status:** Implementation-ready; bounded filesystem module only

**Parent:** [Slice 03 integration](integration.md), acceptance I08/I09

**Authoritative source:** [Import-job artifacts and limits](../../../../product/review-loop/import-jobs.md#envelope-artifacts-and-storage-bounds)

**Starting source:** `18f59aeaa217e8ddc27ff1617823227daa8309bd`

**Owner:** Acquisition worker, new isolated `/tmp/pr-reviewer-import-artifacts`, branch `retain-bounded-import-result-artifacts`. Earlier acquisition/context worktree at `d2def88` is retained untouched.

## Implementation handoff v1

Writable scope is only new `src/import-artifacts/**`, new `tests/import-artifacts.test.ts`, and this packet/evidence file. Shared owner retains product docs, all existing modules, package/lock/scripts/maps, domain/storage/server/runtime/UI and admission. No dependency, native helper, runtime/pilot/auth/network operation or publication is authorized here. Commit this public design before deriving code.

Implement `createImportArtifacts(privateDataRoot, {maxEncodedBytes?})` with asynchronous `write({jobId, invocationId, value: unknown})` and `read({reference, expectedJobId, expectedInvocationId})`. Write generates an opaque UUID artifact ID. Success returns the strict serializable six-field reference `{artifactId, jobId, invocationId, digest, bytes, schema: 'import-result-v1'}`. Read returns unknown parsed JSON, never a source witness. Typed errors expose bounded stable codes, not private paths/source/raw filesystem diagnostics. Accept canonical UUID job/invocation/artifact IDs; no caller path or URL is mapped to a file.

The retained UTF-8 JSON envelope is constructed as `schema`, `artifactId`, `jobId`, `invocationId`, `value`. Its value is the unchanged full acquisition return, not a manual-source conversion. The digest is SHA-256 of the exact complete encoded envelope; bytes counts that same envelope including metadata. Default maximum is 16 MiB (16777216 bytes), callers may lower but not raise it. The public command envelope remains independently 8 MiB; this port neither changes nor implements that command check.

Reject non-JSON values, cyclic/accessor/custom serialization inputs and malformed UTF-8/JSON reads. Source verification/schema/identity validation remains the public source-preparation adapter's responsibility, outside transactions.

## Owned storage and publication

Use existing canonical private mode-0700 data root, owned by the current OS user. The existing runtime owner/root lock is supplied by the caller, not replaced here. The module creates only its owned `import-artifacts/<jobId>/<invocationId>/` subdirectories, mode 0700, and rejects unsafe existing directories rather than chmod/chown. Root and all mapped parents must be real contained directories; stable symlinks, non-directories, foreign ownership or broad permissions reject. Validate held directory identities around operations.

Write a generated exclusive mode-0600 temporary file in the invocation directory, with no-follow flags. Finish, bound, hash/check and fsync it. Publish complete bytes by a same-directory hard link to the unique final artifact filename, which atomically appears without replacing an existing name, then remove the temp name and fsync the directory. This is a deliberate no-clobber alternative to overwriting rename, accepted by root/shared owner. Unsupported link/fsync behavior is an explicit failure, not fallback to weaker publication. No interrupted temp name maps to a readable committed artifact. A failure after publication is unknown publication state; retain recovery evidence and do not delete a possibly referenced final file.

Read after restart maps only the validated IDs to that fixed layout, checks the registered job/invocation expectations, and opens the final file without following symlinks and without blocking on special files. Use one descriptor for regular-file/ownership/mode/link-count, length/bounded read, strict UTF-8, digest and JSON/binding validation. Compare path/descriptor identities around the read; never reread a changed path to make a mismatch pass. Reject digest, length, binding, type, permissions or observed replacement mismatches.

## Accepted platform and authority limits

Root explicitly accepted the existing private-0700/single-owner trust boundary. Public Node 24 fs APIs are path based; O_NOFOLLOW protects the final component but does not provide public dirfd-relative openat/renameat operations. Held handles plus pre/post identity checks reject observed changes and stable unsafe parents, but do not establish isolation from a malicious same-UID parent swap between path checks and writes. No native helper/dependency or security-setting change is added. See [Node 24.21 fs APIs and flags](https://nodejs.org/download/release/v24.21.0/docs/api/fs.html); the documented API limit is not a claim that all possible native bindings are impossible.

The six-field reference carries content identity, not persisted inode attestation. A byte-identical replacement between separate runs is indistinguishable and preserves the same bound content. Detect observed inode/path replacement during an operation and all digest/length/binding changes; do not claim to detect an unchanged-content inode replacement across restart.

A raw reference is never permission, source verification or an admission witness. The owner store must supply its registered exact reference and authorized job/invocation. Files existing after a crash do not resume work, create receipts or admit source. This port does not discover orphan jobs, mint witnesses, open a database or automatically delete by age. Root/shared owner has accepted these boundaries and owns their promotion into durable product source.

## Tests and independent-review handoff v1

Begin with failing public tests. Use actual disposable private directories/files/links for exact/restart roundtrip, private permissions, foreign/traversal/absolute IDs, unsafe existing parent, symlink file/parent, nonregular file, digest/length/binding mismatch, observed replacement and exclusive concurrent publication. Test partial temp invisibility, exact 16 MiB boundary/one byte over, and a heavily escaped value above 8 MiB encoded but below the artifact cap. Preserve existing unrelated directories/modes and clean only task-owned fixtures.

Run focused Node 24 tests and scoped strict TypeScript with existing declarations; do not change shared scripts. Return clean commits, public API, actual results/platform limits and mapping requests. Root assigns an independent engineer the exact committed code, this packet and authoritative import-job source. The reviewer checks actual source and representative negative/race tests, not just summary. Bounded filesystem readiness is separate from acquisition witness, durable job/admission, shared boundary/test registration, actual React journey and own-PR review.

## Evidence

Pending implementation.
