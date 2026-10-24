# Product knowledge

This is the durable product specification: what PR Reviewer does, why, and how its responsibilities and behavior fit together. A fresh agent should be able to derive the accepted delivered behavior from this knowledge, without reconstructing old execution plans or chat.

- [Vision](vision.md): purpose and the experience of understanding a PR.
- [Continuation and source import](review-loop/evolution.md): merged structural graph/immutable history and the bounded import candidate.
- [Durable import jobs](review-loop/import-jobs.md): implemented slice03 path/discovery/job/admission/artifact candidate, exact compatibility and separately pending final acceptance.
- [Pinned source context](review-loop/source-acquisition.md): bounded unchanged source acquisition and complete coverage accounting.
- [Semantic persistence and recovery](review-loop/semantic-storage.md): exact semantic record/identity/quota/command/query/lifecycle contracts.
- [Semantic protocol values](review-loop/semantic-data.md): complete normalized hash inputs, fixed defaults, anchors/fact IDs and machine-readable conformance/recovery fixtures.
- [Static source analysis](review-loop/source-analysis.md): exact supported declarations, static facts and honest unknowns.
- [Same-canvas source reading](review-loop/canvas-reading.md): accepted overview/focused inline diff, neighborhood continuity, exact return and narrow-layout contract; correction remains unimplemented.
- [Retained semantic neighborhoods](review-loop/semantic-graph.md): slice04 integration contract and independent source/graph identities.
- [Guided explanation, exploration and private recovery](review-loop/story-and-exploration.md): current attributed story/context values, single application player/draft/frame owner, exact supporting-source return and explicit write-ahead question recovery.
- [Persistence compatibility](review-loop/persistence-compatibility.md): supported legacy/current SQLite records, migration and exact identity/retry conventions.
- [First review loop](review-loop/README.md): user story, UI, data/command/MCP contracts and CLI delivery/recovery.
- [Architecture](architecture.md): system relationships, technology direction and subsystem boundaries.
- [Participant adapters](participant-adapters.md): existing-session Codex and Claude identity, capability and ownership contracts.
- [Functional/reactive design](reactive-design.md): domain/effect separation and managed stream integration.

Add user stories, detailed interaction rules, interfaces and low-level design decisions beside their owning subsystem as evidence and accepted scope establish them. After every slice, reconcile learning here before acceptance. Keep execution assignments and historical checklists in [plans](../plans/README.md), and shared workflow requirements in [rules](../rules/README.md).

These documents distinguish accepted direction from unimplemented or unverified behavior; the implemented local review/import/semantic/story/recovery candidate and controlled-host tests are documented. Final actual combined own-PR understanding/meaningful answer, whole-product docs-only readiness, native-host acceptance and successful reimplementation remain separate unproven gates.


The merged runtime/pilot baseline includes repository-path import. The combined semantic/story/exploration/recovery candidate is a separate source/build and has not been deployed to that pilot. Current operations and limits live in their owning documents above; plans retain delivery identities and evidence. Controlled fixture, live-provider, native, human, own-PR and whole-round results cannot substitute for one another.
