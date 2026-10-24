# Unavailable analysis recovery correction

Date: 2026-10-24

Status: docs-first implementation authorized; verification pending.

Parent: [slice05](plan.md). Durable contract: [story and exploration](../../../../product/review-loop/story-and-exploration.md).

Diagnosis: /tmp/pr-reviewer-semantic-diagnosis/report.md, SHA-256 de8b7b651248a59588ffcd01c86db4bd2dc7e297865ef8dd868e499026b92d07. Reproduced on PR25 head and base: legitimate unavailable compute was captured as an explicit admitted ID; restoration failed and poisoned polling.

Implementation handoff v1: on base e3b270e, change only semantic panel capture and analysis/story application boundaries plus their registered regression tests. No storage/API admission relaxation, workspace wiring, public exports, test jobs, mockups or dependencies. Use existing Node24/Bun and read-only package links from the source-analysis donor. No live pilot/browser/native/config changes or publication.

Regression acceptance: real failed compute through capture/reload preserves drafts and unavailable diagnostics without repeated400; admitted history stays exact; missing/stale/auth/newer IDs do not silently normalize; failed explicit selection restores prior valid polling scope; source inspection cannot pin unavailable compute; inventory-only failure remains separate. Existing generation, abort and late-response tests must pass.

Independent-review handoff v1: root assigns exact returned commit, reads diff against e3b270e and this diagnosis, reproduces focused tests and checks strict/boundaries. Inspect positive normalization proof and negative exclusions, exact rollback and preserved private fields. Source/test evidence is not native or UI-first comprehension acceptance.
