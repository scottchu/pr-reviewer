# Unavailable analysis recovery correction

Date: 2026-10-24

Status: bounded correction implemented and locally verified; root independent review pending.

Parent: [slice05](plan.md). Durable contract: [story and exploration](../../../../product/review-loop/story-and-exploration.md).

Diagnosis: /tmp/pr-reviewer-semantic-diagnosis/report.md, SHA-256 de8b7b651248a59588ffcd01c86db4bd2dc7e297865ef8dd868e499026b92d07. Reproduced on PR25 head and base: legitimate unavailable compute was captured as an explicit admitted ID; restoration failed and poisoned polling.

Implementation handoff v1: on base e3b270e, change only semantic panel capture and analysis/story application boundaries plus their registered regression tests. No storage/API admission relaxation, workspace wiring, public exports, test jobs, mockups or dependencies. Use existing Node24/Bun and read-only package links from the source-analysis donor. No live pilot/browser/native/config changes or publication.

Regression acceptance: real failed compute through capture/reload preserves drafts and unavailable diagnostics without repeated400; admitted history stays exact; missing/stale/auth/newer IDs do not silently normalize; failed explicit selection restores prior valid polling scope; source inspection cannot pin unavailable compute; inventory-only failure remains separate. Existing generation, abort and late-response tests must pass.

Independent-review handoff v1: root assigns exact returned commit, reads diff against e3b270e and this diagnosis, reproduces focused tests and checks strict/boundaries. Inspect positive normalization proof and negative exclusions, exact rollback and preserved private fields. Source/test evidence is not native or UI-first comprehension acceptance.


## Implementation and evidence

Docs-first source: a51f894. The subsequent implementation commit contains this receipt. Diff base: e3b270e5f49a9215452b0b86702946043e979059.

The application bridge now supplies the admitted/analyzed capture identity to the semantic panel and source-inspection pin. Failed explicit selection restores the previous valid snapshot/analysis/view and interrupts the rejected read owner; a later failure from a superseded selection cannot roll back its replacement. Existing pending command identity is retained. Story restoration normalizes only an exact displayed unavailable result backed by a retained unavailable job, with no selected admitted result; it rechecks this proof after readiness before publishing the restored private state. The normalization changes only analysisId and preserves viewport, source anchor/corpus, full-source choice and draft state. The recovery notice survives ordinary checkpoints and resets at a new login/logout/reset lifetime. Arbitrary missing or replaced result IDs are not normalized. Storage and HTTP interfaces are untouched.

TDD: both added regressions failed before the fix: prior valid view was lost after a failed selection; real unavailable compute reload surfaced analysis_record_unavailable. Log: /private/tmp/semantic-recovery-red.log. The real fixture uses 4001 actual calls, successful declaration inventory and a real bounded compute failure; no fabricated storage result or private database edit is used.

Verification (existing Node v24.21.0 and Bun 1.4.2; read-only dependency entry links from /tmp/pr-reviewer-source-analysis/node_modules; no installation):

- Focused semantic application, private recovery and story exploration: 54 passed, 0 failed. Log: /private/tmp/semantic-recovery-green.log. Includes real failed-compute capture/reload, preserved draft/viewport/source/full-source fields, unavailable capture and source-open without invalid pin, arbitrary missing and newer-preparation negative cases, prior valid scope rollback and superseded authorization failure. Existing admitted historical hydration, missing historical-frame failures, credential changes, abort/disposal and return-frame cases pass.
- Unchanged normal entrypoint: 47 Bun and 308 Node passed, 0 failed. Log: /private/tmp/semantic-recovery-all.log. This includes the existing real inventory-only invocation-site failure, which separately asserts analysis=null and no graph admission. The final focused run additionally strengthened source-field and stale-authorization assertions after that full run; production code was unchanged.
- Strict TypeScript passed. Log: /private/tmp/semantic-recovery-strict.log. Subsystem boundary and whitespace checks passed.

This is source/application integration evidence, not actual React/browser execution, new own-PR comprehension, native host validation or deployment. The UI change only delegates capture identity to the tested application boundary; its next actual UI acceptance remains open. No browser user state, pilot, native session/configuration, SDK branch, design PR or mockup worktree was changed. No publication is authorized. Root independently reviews the final clean pin, with particular attention to rollback epochs and the narrow unavailable-proof predicate. Effective inherited model/effort telemetry was unavailable; no override or nested agent was used.
