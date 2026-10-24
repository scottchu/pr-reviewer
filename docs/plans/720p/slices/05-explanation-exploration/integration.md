# Slice05 implementation and review handoffs

**Packet revision:** 1

**Date:** 2026-10-24

**Status:** Design ready for predecessor reconciliation;05 implementation blocked on accepted04 merge

**Parent:** [Slice05 plan](plan.md)

**Source:** [Story and exploration knowledge](../../../../product/review-loop/story-and-exploration.md)

## Actual committed inputs

The planner inspected only committed d9b3a03 source/intent and8b45262 delta, not the separate04 UI owner's uncommitted files. d9 is a core candidate, not full04 acceptance. Root's reported test evidence remains attributed to its actual candidate and does not become planner-run evidence.

| Public seam at d9b3a03 |05 consumption / required extension |
|---|---|
| `src/domain/public.ts`: Snapshot/Review/Principal, `graphFiles`, `sourceComparison`, `uniqueSources`, structural graph/source projection | Immutable snapshot/whole-change accounting and comparison focus. Preserve primary file keys, copied-source multiplicity and distinct line-only anchors. No source manifest rewrite. |
| Public `AnalysisView` | reviewId/snapshotId/currentSnapshotId, analysisGeneration/graphRevision/selectedAnalysisId, jobs, preparation, selected or explicit historical corpus/inventory/analysis and clarifications. A pending preparation result is not admitted evidence. |
| `analysisQuerySchema`: reviewId/snapshotId, optional analysisId and minimumGraphRevision/minimumJobRevision | Story validation/readback pins only an admitted historical/current analysis; current pointer changes cannot silently rewrite a published story. Story revision is a new independent minimum, not graphRevision. |
| `semanticSourceQuerySchema`: reviewId/snapshotId/corpusId/side/path/contentHash; public SemanticSource/Anchor | Exact retained context text and parser coordinates; use its existing validation/query meaning. Do not translate semantic UTF-16 anchors through LF-only snapshot line rules. |
| `store.analysis.command(token,input)`, `.query(token,query)`, `.source(token,query)` | Authorized public source/fact reads and graph clarifications. Story code may not import `storage/analysis.ts` or query analysis tables. Add bounded evidence-resolution helpers to the public store façade only when necessary, with shared owner authorization and no new connection. |
| `createStore` owns review/import/analysis tables, private tx/load/save/authorize and shared execution lease | Add story/context/receipt state through this owner. Value publication requires no process lease and does not change source/graph revisions. Do not broaden lease/scheduler scope or refactor accepted04 process work. |
| Gateway `/api/analysis`, `/api/analysis/source`, `/api/analysis/commands`; existing review `/api/commands` | Preserve source/graph routes. New story command/query routes derive from strict public schemas; no direct writes/raw graph JSON. Story requests reuse AskQuestion rather than a new inbox event family. |
| MCP `session_attach`, `review_get`, `question_get`, `inbox_read`, `reply_submit`, `analysis_get`, `analysis_source_get`, `graph_clarification_put` | Same initiating Codex/Claude session and capability. Add bounded story reads/publication, no new/forked host or tool-registration claim. Native automatic catalog/delivery remains a separate acceptance fact. |
| Managed registry and public analysis runner/lease | Read-only use of declared view routes.05 owns no child process; story clocks/read subscriptions have explicit teardown. Existing import/analysis/reply work remains independent. |
|04 application/UI graph-source navigation | Not inspected because it is a separate in-progress writer. Final accepted bridge's selection/draft/history and exact evidence-open/return operations must be recorded before05 UI code; the plan specifies required behavior, not a fabricated existing method name. |

At8b45262, the only delta is `tests/semantic-faults.test.ts`, package test registration and04 integration evidence. Public ports match d9. Root reports47 Bun tests/495 assertions,150 Node tests and six actual SIGKILL tests; independent core review remains ongoing. Final04 fixes may change these ports. Record the accepted candidate, independent dispositions, actual UI/ownPR findings, PR merge commit and clean implementation base in the plan before dispatch. If fields remain blank, no05 code starts.

## Implementation handoff v1

Root assigns one isolated descriptive branch from accepted04 main/merge source, then incorporates this exact three-file packet. Existing d9-based planning ancestry is not permission to branch implementation from unaccepted core. Root names owners and serializes shared files. No new dependency, scaffold, tool installation, pilot/auth/session/route changes or06 execution logic.

###05A — durable content and participant contract

Owner scope: new story domain/storage files and focused tests; public domain/storage/gateway/MCP exports; story docs/plan evidence; necessary boundary/test registration. Existing source/analysis/import behavior stays authoritative. The owner first reconciles final04 types and writes any resulting contract correction before deriving code.

1. Define strict context capture, provenance-tagged claim/reference, chapter/step, focus and primary scope-account values. Pure validation checks identity membership and bounds separately from semantic truth. Use a normalized evidence bundle assembled from authorized retained public queries outside the transaction; never let arbitrary JSON assert verified facts.
2. Write failing tests for wrong source/hash/range/analysis/corpus/capture IDs, duplicate/dangling story IDs, incomplete/duplicate file coverage, unsupported/binary/empty source, declared unknown rationale and actor-controlled attribution. Positive tests show a useful compact account with one explicit unknown; superficial citation presence cannot be the comprehension assertion.
3. Add atomic story/context commands/receipts and immutable history through the one store owner. Source/graph/context/story revisions are independent with the exact CAS policy in durable knowledge. Reserve any owner-generated internal receipt prefix so callers cannot preoccupy it. Retain known/current/history pointers and all previous data on rejected writes. Context/source/analysis IDs are never repaired by replacing them with “current.”
4. Add authorized bounded gateway/MCP reads and story publication. User-only context capture; active-generation agent story author within review/author rules. Recheck authorization before replay. Existing AskQuestion and reply_submit semantics stay unchanged: story publication does not answer a question, create another inbox or trigger a wake. Meaningful reply remains a distinct authored outcome.
5. Record exact public schemas/read models and trusted evidence validation port for05B. Commit failing/green evidence and independent review findings beside this slice; do not expose internal IDs/journaling as product copy.

Controlled owner or attached-SDK story publication can verify engineering while native delivery remains unavailable. Label those fixtures precisely. It is not permission to simulate a meaningful original-session answer or to mark native/human acceptance complete. Any actual live participant run uses only the already attached initiating session and existing authorized route; host changes require separate owner work, outside05.

###05B — application state and readable React

Owner scope after the05A interface commit: assigned application story bridge/state, React story/context/player presentation, scoped styles and focused application/React tests. Root owns shared application/public.ts, source/graph wiring, test configuration and final integration. Do not design a competing story schema in UI or directly call another subsystem's internals.

1. Establish one pure state reducer for paused/playing/exploring/ended, exact version/cursor, displayed evidence, comparison/source selection and return frame; one owned clock and declared public graph/source focus integration. Capture/replay effects live at the application boundary, not stream operators or components.
2. Render graph-led claims and context provenance with compact readable hierarchy. Highlight exact evidence before displaying its narration in the same state transition. Distinguish unsupported why, static facts and authored causal interpretation. Whole-change index remains accessible; file count is not “explained” count. No giant header-excerpt cards or arbitrary new edges.
3. Implement one-row draggable controls and keyboard move/reset, chapter/step count, explicit Replay/Pause and reading pause. Preserve accessible hit targets, focus names and red/green/yellow text labels. Use current React/React Flow and guidelines, no new UI/motion library.
4. Separate playback evidence focus from question draft anchor; apply existing04 pending submission/selection guards. Implement exploration/resume frames, supporting-source navigation, private session checkpoint and explicit newer-version action. Restore exact old story/source state, never latest pointers. Narrow Flow/Diff shares the reducer; no duplicate playback clock or hidden source side.
5. Reconnect/login/teardown use credential/view generations and minimum story/context readback. Late responses cannot overwrite another version, clear a newer command or restart playback. No mount/re-render initiates publication, acquisition, analysis, question or agent turn.

###05C — actual explanation, regression and handback

Before presentation implementation, a source verifier resolves the selected PR23 [task outline](plan.md#predeclared-meaningful-task-before-presentation) into an exact source-backed expected account with fixed spans/limitations, kept separate from the fresh reviewer. The answer key cannot be the story author's output. Final own05 PR needs its own pinned key before its run/presentation correction. Use isolated disposable candidate data/ports and the existing real Chrome E2E route; no pilot mutation or browser-policy workaround.

Exercise source-backed participant/owner publication, follow chapters, read/pause, explore outside the narrated path, ask a relevant question, inspect its answer and resume. Assess both what the story made understandable and what required manual reconstruction. Repair real defects and material misconceptions with new content/candidate identities, then rerun affected engineering/presentation evidence without relabeling the original blind account.

After review, promote actual schema meanings, behavior, rationale, resource/recovery limits and UX lessons to durable product knowledge. Reflect on actual code structure and whole-current-product design; commission a fresh docs-only auditor excluding plans/chat/code. Update directly dependent06 inputs with verified claim/source/story identities and job/evidence limitations, no future implementation hierarchy. Root owns PR delivery/merge and any established post-merge pilot update; planning itself has no deployment.

## Acceptance and evidence

All05 rows are planned/unrun. The actual candidate/target/version and responsible verifier must accompany each result. Strict TypeScript and boundary checks plus all relevant existing regression tests are required; register new tests before reporting aggregate coverage.

| ID | Observable outcome and mandatory checks |
|---|---|
| S01 content/provenance | A real authored account explains why/what/how/example with per-claim basis. Missing supplied rationale stays unknown; static facts and cited interpretation do not become observed behavior. Invalid/dangling source/static/capture refs reject; correct citations alone do not pass meaning. |
| S02 whole scope | Exactly one primary account per actual changed-file key, including supporting docs/config/tests and unsupported/binary/empty/copy material. Duplicate or missing accounts reject. Explicit unexplained rows remain visible; complete source coverage is not complete explanation. |
| S03 context | User-only immutable captures with origin/time/hash; agent cannot spoof or replace supplied context. New capture revision preserves old story references and labels supersession. Safe text/URLs do not execute/fetch; missing PR body remains missing despite retained title. |
| S04 revisions/authority | Competing expected story revisions yield one apply/one conflict; stale authoring context rejects. Unrelated comment/graph clarification does not conflict. Revoked/stale/wrong-review/bootstrap authors cannot read/write/replay. User supersession preserves previous author, agent edits only own story. |
| S05 retry/restart | Lost response/readback retains unchanged command identity and draft; exact retry returns original receipt/version without another publication/wake. Changed payload conflicts. DB-only restart preserves all version/context/source refs without job/model rerun. Separate minima cannot be satisfied by unrelated revisions. |
| S06 bounds |8 chapters/32 steps/128 claims/256 unique refs,256KiB story,128KiB context and8MiB retained-body exact/lowered boundaries. One over rejects atomically, old source/history/drafts/receipts preserved. No nested/unbounded agent output or arbitrary graph/code fields. |
| S07 focus/player | Pure transition tests and real React verify previous/replay-pause/next/chapter/step, initial paused, eight-second visible-time advancement, ended behavior and no hidden-tab catch-up. Narration and graph/source highlight identify same immutable step; exact comparison retained. |
| S08 reading/accessibility | Reading/focus/text selection/scroll, drag, visibility loss and Flow/Diff pause; reduced motion keeps content. One-row controls retain accessible names, focus and44px coarse targets; keyboard drag/reset works and position clamps on resize. Visual guideline critique is separate from E2E assertions. |
| S09 explore/resume | At a noninitial chapter/step/elapsed cursor, explore unchanged dependency and a supporting nonnarrated file; resume exact story version, cursor, viewport/comparison/source selection and original draft. An exploration draft is preserved separately; unresolved submitted draft cannot be retargeted. |
| S10 history/races | During playback/exploration publish a newer story/context, import a new head and admit a new analysis. None steals cursor/selection or rewrites story basis. Explicit history/version choice pauses and stores old frame. Delayed old poll/command cannot overwrite a new credential/version or clear its pending intent. |
| S11 private recovery | Reload restores bounded tab-session checkpoint only after authorized exact-record validation, always paused. Missing/stale refs show recovery, no guessed anchor. Storage-disabled/quota behavior is truthful in-memory fallback. Logout clears scoped checkpoint; credentials/source bodies never enter it. |
| S12 managed lifecycle | Actual React Strict Mode/remount/connect/dispose/reconnect yields one clock/route set, zero after teardown and no later polls/advances. Story writes do not acquire execution lease or block comments/import/analysis; no notification on publication/reply/playback. Existing process/session tests remain passing. |
| S13 actual Chrome journey | Real candidate UI consumes actual pinned ownPR source/graph and a schema-valid source-backed story submitted through real ingress. Desktop and representative narrow viewport follow/read/pause/explore/resume/question/draft/history. Fixture provider/participant inputs are labeled; no graph-model-only/screenshot-fixture substitute. |
| S14 meaningful understanding/answer | Fresh reviewer freezes actual story/graph-first account, then source-corrects it. The frozen initial account must get the central before/after and example materially right, locate a real consequence and supporting change, and identify inference/unknown plus test-presence limits; source comparison must not reveal an uncorrected central misconception. Investigation/resume must preserve place/work. If initial understanding still needs wholesale source reconstruction, presentation needs changes even when engineering passes. Independently inspect whether actual persisted participant answer addresses original question; generic transport reply fails this criterion. Native/human routes remain separately unrun until observed. |
| S15 knowledge/round | Actual-code design reflection and fresh docs-only whole-current-product audit close material gaps. Durable docs specify story authority/claims/revisions/selection/failure, not copied code. Return exact06 inputs and remaining720p/native/human gates; no slice acceptance by UI polish alone. |

Representative Chrome fixture: begin chapter2/step2 with an unsent source question; pause through reading, explore one unchanged source and one supporting file, publish a new story through separate authorized ingress, resize/switch Flow/Diff, resume original version and draft, submit once, interrupt readback/retry unchanged, reload and verify paused exact identity. Run a second lifecycle test with delayed reads and dispose/reconnect. Real timer waiting can use a lower injected owner/test duration while one production-duration progression is separately observed; no UI exposed timing override. Screenshots assess readability and narrow controls independently of assertions.

## Independent-review handoff v1

Root gives an independent engineer exact accepted04 and05 packet/candidate/build/target identities, changed-file scope, public contracts, S01–S15 mapping and actual command/evidence artifacts. Review source-informed correctness separately from the blind comprehension reviewer. Reproduce material negatives around author/provenance forgery, unknown why, static-vs-runtime claims, wrong-history references, CAS/replay, resource limits, injected external content, private checkpoint scope and clock/route lifecycle. Inspect actual production wiring so a fixture-only publisher/player cannot masquerade as delivery. Verify that original AskQuestion/reply/host ownership remains unchanged and publication does not create hidden wake loops.

Fresh story/graph reviewer records prior familiarity and receives only product vision, task, exact candidate/target and actual UI/capture access; no plans/code/diff/expected account. Freeze a three-sentence account and concrete example before source access. Then inspect source/drilldown, compare/correct and rate orientation, scope, meaningful relationship/risk, evidence, navigation/return and cognitive effort as easy/workable with effort/burdensome/blocked; confidence supported/provisional/unresolved separately. Record misconceptions and effort, not just clicks. Return presentation accepted/changes needed/inconclusive independently of engineering. Same-agent sequential comparison is qualitative, not causal efficacy or unfamiliar-human proof. If using mediated actual Chrome captures, label that access mode.

Findings include severity, exact identity/source/evidence, affected acceptance and required correction. Repair with new candidate/content IDs and affected checks; do not overwrite the first frozen account. Full05 acceptance requires the bounded meaningful explanation outcome, not all unknown user/business intent being invented. A genuine external host/user decision remains an explicit affected gate while independent engineering proceeds.

## Integration bookkeeping and successor

Before code fill: accepted04 candidate ___; engineering/core/UI/ownPR disposition ___; merge PR/commit ___; verified implementation base ___; actual04 application selection/draft port ___; source-verifier PR23 account/key ___; implementer/core/UI/test ownership ___; independent engineer/blind reviewer ___; candidate/data-root ownership ___. These blanks are blockers for their named dependent work, not authority to infer success fromd9/8b.

Root incorporates exactly the three planning files first and updates shared maps/round/status links outside this planner's scope. Source-only staging may inspect this packet; no app scaffold/test execution/dependency install is needed for planning. Final implementation owner resolves any accepted04 delta before deriving05; there are no stale module cherry-picks required because the implementation base must contain accepted04.

For06 return exact story/version/claim/source/reference identities, authorized read/publication/receipt meanings, static/source-versus-execution distinction, current private cursor/draft behavior and existing shared job/lease evidence.06 must independently select configured targets/environment/isolation and define actual execution evidence. A prose claim or test filename is not a command specification. No06–08 pages or execution controls are generated here.
