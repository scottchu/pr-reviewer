# Header occurrence verification

Date: 2026-10-29. Product candidate:7920b94 (application source). Documentation baseline:b99b236; task base2598a80. Later acceptance-test/evidence commits do not change the application payload. Repository: scottchu/pr-reviewer; isolated branch bind-header-removal-occurrence. Pinned reviewed dataset: PR25 b096826e31c0927190806de91ed70b8b64aa93d8 → e3b270e5f49a9215452b0b86702946043e979059. Candidate and reviewed target are different identities.

## Observed acceptance

| Acceptance | Evidence | Status / limit |
|---|---|---|
| A1 source subject/removal/identity | New generic and exact PR25 tests; actual local UI card says Authorization property construction / Removed source occurrence / Direct request construction only / Before b096826 · src/application/review.ts · L29. | Passed locally; live endpoint has older application. |
| A2 separate After call | Generic refactor fixture retains helper syntax containing Authorization and the independent call witness. Actual request disclosure displays removed inline construction at L29 and added accessHeaders(captured) at L30; separate After calls label remains. | Passed source/presentation; no helper/runtime conclusion. |
| A3 preservation | Frozen facts, compiled and canonical graph hashes remain equal. Default/20/40/hide projection comparison masks only the independently asserted header card delta. All other fields retain the frozen oracle. | Passed. Source entities/relations/status unchanged. |
| A4 actual UI | Executor used IAB at task-only http://127.0.0.1:57945, panned to request, read the scoped card and opened source changes showing Before/After preview. Screenshots in execution transcript show readable scoped card and native disclosure. Independent reviewer separately used actual Chrome candidate graph before source inspection. | Desktop local manual journey passed. Added normal E2E entrypoint desktop1440/mobile390 specs reviewed and inventoried, not executed as Playwright tests. Mobile interaction remains unrun. |
| A5 rethink only | policy-analysis.md identifies current manual prepared edge/title selection and source-authored comment/assertions, with three options and recommendation. | Analysis delivered; no issue1 code/schema change. Decision remains with owner/user. |

Owning pure suite: `node --experimental-strip-types --test mockups/pr-file-tree/tests/*.test.ts` →162/162 PASS. New tests first failed on old title (RED), then3/3 passed. Root `npm run check` PASS (strict TypeScript and subsystem boundaries); minimum graph strict TypeScript PASS; `git diff --check` PASS. No lint tool is selected in AGENTS.md, so lint is N/A. Browser test list reports24 tests across4 files, including the2 new acceptance cases.

Production Vite build PASS with `--configLoader native` and task-owned `.decompozr/header-occurrence/build`. JS asset index-SQmUHH_U.js SHA256 dc2f0822f46e446567459abc3b3c7620a671bcc51894e915d82d83bb45cf741e. UI content source SHA25649b519410efdbebd749030607f4415eea8656f6b482fd3ef73dad0a1327af921. Existing bundle-size warning remains; no new dependency or asset partitioning work. Original loader hit an absolute dependency-cache symlink EPERM; native loading avoided that write. Raw receipts retained in ignored `.decompozr/flow/run/header-occurrence/` for owner handoff. Build and receipts retained because candidate review/publication/deployment remain open.

## Independent review receipt

Reviewer review_header_occurrence had no supplied prior source familiarity. Frozen graph-first account preceded reading source/plan: direct construction removed, After source call added, no supported global header absence/helper output/execution/authentication-success/behavior-equivalence claim. Source inspection confirmed without substantive correction. No blocking correctness findings on2598a80→7920b94 or the later authored browser spec/config. Reviewer personally ran10/10 focused regression/preservation tests, minimum strict TypeScript and whitespace checks, all passed.

Bounded presentation verdict: accept header wording correction. Initial orientation/investigation remain burdensome: dense unrelated script cards and crossing routes, target found via AX; helper-card virtualization interrupted navigation. Header fact is understandable once located. This is not acceptance of whole-PR comprehension, physical mobile usability or the wider source/interpretation architecture.

## Delivery and remaining gates

Live backend PID4236 still runs from /Users/scottchu/.codex-workspaces/worktrees/pr-reviewer-main-2598a80. HTTPS8478/backend57943 were not restarted or deployed; no data, network/security settings or unrelated work changed. Main checkout remains clean. Task57945 is only a local verification preview.

Own-task-PR graph dogfood is UNRUN: this candidate still serves pinned PR25 rather than the correction PR. CI is pending publication/readback. Merge, live restart and deployment require separate owner authority under this delegation. Next owner action: review draft PR and remaining evidence gates; if authorized, merge through GitHub, fast-forward clean main, build exact verified main, deploy through the established mechanism, then verify scoped card and source disclosure at HTTPS8478. Do not call this live fixed before those steps. Issue1 requires a selected semantic option before implementation. No successor slice is made ready by this bounded correction.

## Draft publication readback

Draft PR: https://github.com/scottchu/pr-reviewer/pull/40. Remote head5282a8b2fa36702c22b49f2e168c3c233a72b7f8 was read back from both GitHub PR and remote branch; base main, OPEN, isDraft=true, description persisted as intended. statusCheckRollup was empty: no hosted checks reported, not a CI pass. This receipt commit changes documentation only; application remains7920b94 and the browser-spec/config additions are5282a8b. Task-only preview PID26158 on57945 is stopped after review. Live PID4236/57943 remains untouched. Worktree, build and copied receipts remain for owner handoff; duplicate owned /tmp receipts can be removed after matching copies. No merge or deployment occurred.
