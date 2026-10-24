# Owned import-result artifact preparation

**Date:** 2026-10-24

**Packet revision:** 1

**Status:** Implemented and focused-tested; independent review pending; bounded filesystem module only

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

Recorded below.

## Implemented checkpoint and evidence

**Status:** Implemented and focused-tested; independent filesystem review pending

**Docs-first source:** `eff910b478b5226a57fa0dc16914d2829ea2fb03`

**Runtime:** Node `24.21.0`, Darwin, current UID `501`; installed O_NOFOLLOW/O_NONBLOCK/O_DIRECTORY flags are available. Same-directory no-clobber link publication and directory fsync succeeded on actual disposable local directories. No reboot, power-loss or hostile same-UID namespace-isolation experiment is claimed.

**Public API:** `src/import-artifacts/public.ts` exports `createImportArtifacts`, `MAX_IMPORT_ARTIFACT_BYTES`, `isImportArtifactError`, `ArtifactReference`, `ImportArtifacts` and typed error values. The constructor returns write/read functions as specified above. Errors are sanitized `ImportArtifactError` values with a fixed code; they do not include source/private paths or raw filesystem diagnostics. Read returns unknown JSON only. Owner registration and source-preparation validation/witness authority remain outside this module.

The module validates canonical existing private root and each mapped parent, holds directory descriptors and checks identities around operations. Created directories are 0700 and files 0600; preexisting unsafe modes are rejected without modification. Final names derive only from validated UUID IDs. File reads reject special files, symlinks and hard-linked aliases before content is consumed. One descriptor supplies bounded bytes, stat stability, length, digest and content checks. The wrapper binding must match the strict reference and owner's expected job/invocation. Writer values must be actual JSON data; accessor/custom serialization/cyclic/non-JSON values reject before filesystem effects instead of silently changing the value.

Ordinary prepublication failure removes only the confirmed owned temp file. After a final link has appeared, a later failure returns publication_unknown and leaves the final file for owner reconciliation; no final artifact is deleted automatically. A crashed temp name is not accepted by the final-ID mapping. Files existing on disk still create no job receipt, acquisition witness or source admission.

### Actual checks

The initial four tests failed with ERR_MODULE_NOT_FOUND before implementation. Final focused command:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node --experimental-strip-types --test tests/import-artifacts.test.ts
```

**Observed:** 13 tests passed, 0 failed. Actual temporary filesystem fixtures cover exact value/ref/digest roundtrip through a new port instance; private modes; unsafe existing root/parent rejection without chmod; traversal/absolute/foreign IDs and extra reference fields; symlink file/parent/root, directory-as-file and hardlink rejection; length/digest/envelope-binding mismatch; strict invalid UTF-8/JSON; partial temp invisibility; eight concurrent complete publications; a final-name creation race preserving existing bytes; read-time byte-identical inode replacement rejection; prepublication fsync failure leaving no final; and postpublication directory fsync failure retaining the complete final while reporting unknown.

Collision/replacement/fsync tests schedule controlled faults through the real Node FileHandle prototype in the isolated test process, restoring it afterward. They still perform actual file/link/rename/read operations; they establish those tested ordering cases, not universal adversarial race prevention. Foreign-UID ownership validation is implemented through actual stat UID checks, but no privileged chown or foreign-user fixture was attempted.

The exact 16777216-byte encoded envelope was written/read successfully. A result whose complete envelope was exactly one byte larger rejected as too_large without truncation. A value containing 5 MiB of quote characters encoded above the independent 8 MiB public command cap and below 16 MiB, roundtripped through the artifact. This is artifact-only I08 evidence; actual admission via a registered reference remains the shared integration owner's check. Lowered read caps reject oversized references before reading; raised configuration rejects.

Scoped strict TypeScript passed without package/lock/test-script changes:

```sh
/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node /tmp/pr-reviewer-02-graph-history/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --target ES2023 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --skipLibCheck --types node --typeRoots /tmp/pr-reviewer-02-graph-history/node_modules/@types src/import-artifacts/public.ts src/import-artifacts/storage.ts tests/import-artifacts.test.ts
```

Only Node built-ins and the subsystem's public types are imported. Shared owner must register `import-artifacts: []` in boundary rules, add the focused test to the normal test command and integrate the public artifact port outside admission transactions. No shared module or runtime is changed by this branch.

### Durable knowledge contribution and recovery

Shared owner has the exact envelope/digest/cap recipe and accepted single-owner/private-root/public-Node-API limits. Promote the tested public meanings, no-clobber publication, same-descriptor verification, failure/unknown semantics, reference-versus-witness distinction and restart/content-identity limits into import-jobs.md before accepting slice03. The worker's source scope deliberately excludes that shared product file.

Retain the clean new task worktree/branch for root's independent review and later integration. All owned test fixtures and file handles are removed/closed in finally; no raw source/credential log or pilot data was written. The older acquisition/context worktree remains untouched. Full I08 registered-reference admission, I09 application authorization, durable jobs/process restart/re-verification, React journey and own-PR graph critique remain open integration gates.

## Independent close-failure correction

**Reviewed source:** `15f17a3b2c736b6887daa8e167968331c32a20fb`

**Status:** Correction focused-tested; targeted recheck required

Independent actual-FS injection at `/tmp/pr-reviewer-source-acquisition-review/artifact-close-probe.ts` closed the result descriptor then raised EIO after final publication/fsync. The original finally block leaked the raw error/private temp path and skipped directory-handle cleanup. The read path had the same unsanitized cleanup structure. Earlier 13-test success did not cover this failure.

Correction contract: attempt every held file/directory close even if another close fails. Sanitize a close-only failure after write publication to publication_unknown and preserve the final artifact; a read close-only failure returns sanitized io. Preserve an already selected typed primary failure rather than exposing secondary raw cleanup diagnostics. Add failing-first write/read tests with real descriptor closes and injected post-close EIO, verifying every directory close and private-path suppression. No shared/public API or broader artifact policy changes.

### Close-failure correction outcome

**Status:** Implemented and focused-tested; same-reviewer targeted recheck pending

New write/read regressions first failed against `15f17a3` with raw EIO/private-path diagnostics. The correction attempts the result handle and all held directory closes independently using settled outcomes. It reports a close-only failure after publication as sanitized publication_unknown, a read close-only failure as sanitized io, and preserves a previously selected typed primary failure. No final file is removed because of a close error. A close failure means the module cannot claim every OS close succeeded; every held close is attempted, with actual successful descriptor closure observed in the controlled injected-after-close tests.

Final focused verification passed **16 artifact tests**, and the same scoped strict TypeScript command passed. New cases inject EIO after actual file-descriptor closure, assert all four actual directory descriptors close, suppress private root paths from thrown diagnostics, and preserve the complete final artifact. The additional read-integrity control preserves integrity_mismatch when cleanup also fails. The original roundtrip, collision/replacement, cap/escaping, symlink/permission, partial-temp and fsync tests remain passing.

Only this packet, module implementation and focused test changed. Public API, encoded envelope/reference recipe and all shared/product/package/runtime/pilot settings remain unchanged. Reviewer-owned probe/results and reviewed source identity are preserved. Tests restore built-in FS exports and close any remaining fixture descriptors in finally, then remove their owned directories. Retain the clean correction commit for targeted review; shared owner must promote the cleanup/error policy into durable import-job knowledge before integration acceptance.
