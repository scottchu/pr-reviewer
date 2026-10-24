# Independent subsystem review corrections

Date: 2026-10-24
Review source: independent source engineering review145f995, /tmp/pr-reviewer-subsystem-engineering-review/review.md
Status: three confirmed wiring gaps; fix before final mock acceptance

Exact prose locate must resolve content ID, immutable version and hash together. A v2 thread must open v2, and a missing original applies only to its own content version. Preserve both drafts and never open another version behind a located thread. Highlight the active valid anchor using its exact UTF16 offsets and quote; the first thread and a repeated quote are not substitute locations. Explicit Read this step pauses playback before focusing source, including when invoked inside player controls.

Acceptance adds actual Chrome regressions for v2 locate/draft through v1 changes and unavailable-v1, distinct selected spans including repeated equal text at separate ranges, and read-while-playing held beyond the next tick. Pure helpers validate identity/span resolution. Continue independent C after the bounded fix; no browser policy workaround or production adoption.

## Fix receipt

Date: 2026-10-24
Status: implemented; independent reviewer recheck requested separately

All three new actual Chrome regressions failed against the prior source, reproducing playing=true after Read, absent v2 located draft, and first-thread highlight instead of selected span. Exact ID/version/hash/range/quote resolver now gates prose location and visible markers; original-v1 availability remains independent from v2 selection. Active valid anchor determines highlight by offsets. Read explicitly pauses before focus. Five pure subsystem tests, six actual Chrome journeys and strict preview TypeScript pass after the changes. The equal-quote test creates two distinct “header” ranges and checks the mark offset for each. No production source, original56671 preview or independent reader browser policy changed. C continues after this checkpoint.

### Retained raw recheck evidence

The initial tool-output runs lacked raw log files. A bounded repeat used isolated verification worktree /tmp/pr-reviewer-preview-fix-regressions, exact pre-fix83871d5 and post-fix6478d9b, owned loopback56673, the same three regression tests and actual Chrome. It did not use or retry the independent reader's blocked browser route. The temporary Vite process was stopped afterward; original56671 and evolving56672 remain serving.

- RED: /tmp/pr-reviewer-subsystem-preview-evidence/fix-regressions-red-83871d5.log, three reproduced failures, SHA256 bd573fb81c916afe254ecac95da0a16bd548435aa6846af0778c49d3326721fa.
- PASS: /tmp/pr-reviewer-subsystem-preview-evidence/fix-regressions-pass-6478d9b.log, three passed, SHA256 5d4b248ab2e7100f0c3ae0394c22c73c723d843fc7c3b0a9f8859ebb3b8ef202.
- Independent source recheck: /tmp/pr-reviewer-subsystem-engineering-review/recheck-6478d9b.md, SHA256 43293fad5bf9aa4d0e7cab64d4da747baea63bd482d86b5ccd19e1eade988172. Root read READY for these three P2 fixes only (independent nine unit tests, strict and34 adversarial assertions); it is not E/C or whole-mock/layout acceptance.

## Final whole-source review: cross-lens prose locate

Date: 2026-10-24
Candidate reviewed:8f87d8e / code c292818
Status: confirmed P2 join gap; correction required before final draft publication

Global Comments currently resolves prose version only from the discussion lens, while other lenses substitute v1. A v2 thread located from source, import or evidence can become active but remain excluded from the displayed content. Exact content/version/availability must belong to the shared prose presentation independently of scenario/lens. Global locate must always resolve the immutable prose anchor and display its version in the same canvas, retaining prior frame and independent drafts. No current-version substitution is allowed. Add a failing cross-scenario regression spanning source/evidence/import, plus exact Back/frame/draft assertions, then fix and rerun affected original/connected journeys. Keep the published task branch and create/update only one stacked draft PR. No production or layout acceptance follows the correction.
