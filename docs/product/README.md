# Product knowledge

This is the durable product specification: what PR Reviewer does, why, and how its responsibilities and behavior fit together. A fresh agent should be able to derive the accepted delivered behavior from this knowledge, without reconstructing old execution plans or chat.

- [Vision](vision.md): purpose and the experience of understanding a PR.
- [First review loop](review-loop/README.md): user story, UI, data/command/MCP contracts and CLI delivery/recovery.
- [Architecture](architecture.md): system relationships, technology direction and subsystem boundaries.
- [Participant adapters](participant-adapters.md): existing-session Codex and Claude identity, capability and ownership contracts.
- [Functional/reactive design](reactive-design.md): domain/effect separation and managed stream integration.

Add user stories, detailed interaction rules, interfaces and low-level design decisions beside their owning subsystem as evidence and accepted scope establish them. After every slice, reconcile learning here before acceptance. Keep execution assignments and historical checklists in [plans](../plans/README.md), and shared workflow requirements in [rules](../rules/README.md).

These documents distinguish accepted direction from unimplemented or unverified behavior; no running product or successful reimplementation is claimed.
