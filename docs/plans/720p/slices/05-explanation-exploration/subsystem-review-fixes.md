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
