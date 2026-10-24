# Acquisition-v1 value and identity compatibility

**Contract:** acquisition_v1; current bounded provider preparation. This is protocol data knowledge, not permission for raw JSON admission.

**Parents:** [Import ownership/admission](import-jobs.md), [legacy/source identity](persistence-compatibility.md).

A successful public acquisition returns kind imported and value containing snapshotId, candidate, sources, changedFiles and counts. Failure returns kind unavailable and issues. Candidate and all value members below are retained; optional source enrichment is a different future scheme. A source-preparation witness is issued only by actually invoking the verified acquisition port, not by parsing these shapes.

## Exact public values

Candidate requires provider (github or gitlab), host, targetProject, number, sourceProject, sourceBranch, targetBranch, url, title, state, baseSha, headSha, targetTipSha and baselineMethod. Projects retain owner/group paths, including fork differences. Number is positive. SHAs are lowercase40- or64-digit hex. GitHub comparison uses refreshed PR target tip/head plus compare merge-base as baseSha; baselineMethod is github_compare_merge_base and targetTipSha is that target tip. GitLab uses diff_refs.base_sha/head_sha/start_sha as base/head/targetTip, baselineMethod gitlab_diff_refs, and separately verified source/target projects. URL host/target/change must match; no credential-bearing URL is retained. Title/state are literal provider strings, not new product enums.

| Value | Exact members, literals and absent rules |
|---|---|
| Source text | side (base/head), path, content, hash, objectId, lineCount, all required. Hash is lowercase SHA256 of original UTF8 blob bytes; objectId is the verified raw blob Git SHA. Empty content has lineCount0; otherwise count newline-delimited lines, excluding the final empty split after a terminal newline. Preserve LF/CR/BOM bytes and literal Unicode; reject invalid UTF8 or NUL. |
| Changed path | status, oldPath, newPath, oldMode, newMode, dispositions, hunks, coverage, all required. Status is modified/added/deleted/renamed/copied/type_changed. Absent path is null, never omitted; absent mode is000000. Other modes retain raw six-digit Git mode strings. |
| Disposition | side, path, state, reason, objectId, all required, including unsupported/missing. State is prepared/unsupported/missing; provider values do not use manual unprepared. Absent side has no disposition, not a null/placeholder source. |
| Reason | prepared uses text or empty; unsupported uses binary/invalid_utf8/submodule/symlink/object_type/blob_limit/total_byte_limit/hunk_limit/patch_unavailable; missing uses missing_object. These are exact hash-bearing literals, not free diagnostic prose. |
| Hunk | id, oldStart, oldLines, newStart, newLines, all required nonnegative integers except id. Omitted Git header lengths mean1; explicit zero stays0. A zero-length side creates no selectable span. |
| Coverage | text iff all existing sides are prepared and a complete supported pinned patch was obtained; otherwise unsupported. Empty/mode-only/unchanged-copy text may have zero hunks. Failed patch/hunk budget changes every existing disposition to unsupported with patch_unavailable/hunk_limit and removes its selectable sources. |
| Counts | changedPaths, preparedSides, unsupportedSides, missingSides, hunks, bytes, all required nonnegative integers. Count final dispositions by occurrence, not unique key; hunks is primary hunk total. bytes counts every successfully verified acquired blob before UTF8/binary/patch rejection, including repeated copy occurrences. It is neither encoded source quota nor selectable bytes. |

Modes160000 (submodule),120000 (symlink), and other nonregular modes are unsupported before blob reads. Regular modes100644/100755 proceed through type/size/blob verification. Wrong blob type is object_type; unavailable/invalid object bytes are missing_object. Per-blob/total budgets retain blob_limit/total_byte_limit ledger dispositions. Entire inventory failure is unavailable, never a truncated complete ledger. Bounds are512 paths,1024 existing sides,1MiB per blob,8MiB acquired bytes,4096 primary hunks,1MiB inventory output, plus job/time/artifact bounds.

Repository paths are literal UTF8 relative paths with no absolute/dot/dot-dot/NUL segments. Raw changed-file order is the pinned Git recursive raw diff-tree record order, with full object IDs, zero-terminated literal paths, rename/copy detection and512 rename limit, no relative path rewriting or external diff/textconv, and no diff.orderFile reordering. For each raw record, dispositions and candidate text sources are visited base then head, skipping absent sides. Append only final prepared sources in that file order. Repeated(side,path) occurrences remain when full source value is identical; conflicting values reject. Do not deduplicate the hash-bearing array. Hunks retain matched patch-header order. Patches compare pinned old/new object bytes using zero context, Myers/no-indent/inter-hunk0, literal paths and pinned attributes; rename/copy pairing follows the raw record, not the same path assumption. No worktree content, local attributes/configured helpers or fetch is authority.

## Exact identity representation

SnapshotId is lowercase SHA256 of compact UTF8 ECMAScript JSON.stringify representation with object keys constructed in this order: provider, host, targetProject, sourceProject, number, baseSha, headSha, sources, changedFiles. Source keys are side,path,content,hash,objectId,lineCount. File keys are status,oldPath,newPath,oldMode,newMode,dispositions,hunks,coverage. Disposition keys are side,path,state,reason,objectId. Hunk keys are id,oldStart,oldLines,newStart,newLines. Arrays retain the order above. No sorting, deduplication, normalization or trailing newline is added to these hash bytes. Transport object property order is not trusted to reconstruct them.

HunkId is lowercase SHA256 of oldPath string + NUL + newPath string + NUL + exact matched zero-context header prefix through its closing @@. An absent path contributes literal null. Header function-context text and line terminator are excluded. All source hashes and Git object IDs refer to the exact original bytes. Git blob object IDs include the Git blob header and length under their declared SHA1/SHA256 object format.

Candidate title/state/branches/URL/targetTip/baselineMethod and counts remain in the retained manifest but are outside this snapshot digest. A same-ID different canonical retained manifest is still a conflict. Re-verification compares the full retained value, not only the digest or transport ordering.

## Complete ordered compatibility vector

This is protocol data, not application code. Build compact JSON from the following ordered hash-input value to recompute the expected SHA256. Sources are original ten-line a, edited a, repeated original base a for copy b, head b, and empty head. Binary bytes00,01 are represented only by their exact unsupported disposition; their two acquired bytes contribute to counts. Candidate outside this digest is GitHub github.com/team/repo change1, sourceProject team/repo, sourceBranch feature, targetBranch main, title Copy and edit, state open, URL https://github.com/team/repo/pull/1, targetTipSha equal to baseSha and baselineMethod github_compare_merge_base. Base/head use the documented fixed author/committer/time and messages in import-jobs.md. The hunk header is @@ -1 +1 @@.

```json
{
  "provider": "github",
  "host": "github.com",
  "targetProject": "team/repo",
  "sourceProject": "team/repo",
  "number": 1,
  "baseSha": "4fedc8abc9e31d2943b08adaaa3b519b575038f7",
  "headSha": "0f3dee9f23ccb67a1692e8fb5502af1fde42ea61",
  "sources": [
    {
      "side": "base",
      "path": "a",
      "content": "original\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\n",
      "hash": "380ad45b74a055513570caf019db971146af191436a212edca8a613a25184323",
      "objectId": "01765d2a6407b1c1159c5adc37458535884ecd68",
      "lineCount": 10
    },
    {
      "side": "head",
      "path": "a",
      "content": "changed\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\n",
      "hash": "7ae53062d89777e996a62b3178278b1cacee7107be0d0b661dd4300d7bf42213",
      "objectId": "54d7423521a4a34ba9bbeaf8743ad4351b60f794",
      "lineCount": 10
    },
    {
      "side": "base",
      "path": "a",
      "content": "original\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\n",
      "hash": "380ad45b74a055513570caf019db971146af191436a212edca8a613a25184323",
      "objectId": "01765d2a6407b1c1159c5adc37458535884ecd68",
      "lineCount": 10
    },
    {
      "side": "head",
      "path": "b",
      "content": "original\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\noriginal\n",
      "hash": "380ad45b74a055513570caf019db971146af191436a212edca8a613a25184323",
      "objectId": "01765d2a6407b1c1159c5adc37458535884ecd68",
      "lineCount": 10
    },
    {
      "side": "head",
      "path": "empty",
      "content": "",
      "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "objectId": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391",
      "lineCount": 0
    }
  ],
  "changedFiles": [
    {
      "status": "modified",
      "oldPath": "a",
      "newPath": "a",
      "oldMode": "100644",
      "newMode": "100644",
      "dispositions": [
        {
          "side": "base",
          "path": "a",
          "state": "prepared",
          "reason": "text",
          "objectId": "01765d2a6407b1c1159c5adc37458535884ecd68"
        },
        {
          "side": "head",
          "path": "a",
          "state": "prepared",
          "reason": "text",
          "objectId": "54d7423521a4a34ba9bbeaf8743ad4351b60f794"
        }
      ],
      "hunks": [
        {
          "id": "9d6487ff1adee58d8966cffdadb1ad121f3c8443636efc7d88a01d24688d312c",
          "oldStart": 1,
          "oldLines": 1,
          "newStart": 1,
          "newLines": 1
        }
      ],
      "coverage": "text"
    },
    {
      "status": "copied",
      "oldPath": "a",
      "newPath": "b",
      "oldMode": "100644",
      "newMode": "100644",
      "dispositions": [
        {
          "side": "base",
          "path": "a",
          "state": "prepared",
          "reason": "text",
          "objectId": "01765d2a6407b1c1159c5adc37458535884ecd68"
        },
        {
          "side": "head",
          "path": "b",
          "state": "prepared",
          "reason": "text",
          "objectId": "01765d2a6407b1c1159c5adc37458535884ecd68"
        }
      ],
      "hunks": [],
      "coverage": "text"
    },
    {
      "status": "added",
      "oldPath": null,
      "newPath": "binary",
      "oldMode": "000000",
      "newMode": "100644",
      "dispositions": [
        {
          "side": "head",
          "path": "binary",
          "state": "unsupported",
          "reason": "binary",
          "objectId": "bdc955b7b2e610ad5a72302b139a2e6cb325519a"
        }
      ],
      "hunks": [],
      "coverage": "unsupported"
    },
    {
      "status": "added",
      "oldPath": null,
      "newPath": "empty",
      "oldMode": "000000",
      "newMode": "100644",
      "dispositions": [
        {
          "side": "head",
          "path": "empty",
          "state": "prepared",
          "reason": "empty",
          "objectId": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391"
        }
      ],
      "hunks": [],
      "coverage": "text"
    }
  ]
}
```

Expected snapshotId: f83c2d2727683f93ac10768b28b9f3791163d21da53774136fca55ac71e90dbb. Counts: {"changedPaths":4,"preparedSides":5,"unsupportedSides":1,"missingSides":0,"hunks":1,"bytes":361}.
