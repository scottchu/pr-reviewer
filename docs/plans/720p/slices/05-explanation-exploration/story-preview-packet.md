# Story and exploration scenario

Date: 2026-10-24
Status: implementation packet; layout adoption and independent understanding pending
Parent: [subsystem B scope](subsystem-mockups.md#b--story-player-and-exploration), [canvas preview](canvas-preview-evidence.md)
Source: preview e2bb182; real PR25 e3b270e versus b096826; accepted map cc50132

Preserve the original canvas on loopback56671. Continue in a new isolated worktree/branch from e2bb182 and a new loopback-only Vite preview56672. No Tailscale/Serve/Funnel/proxy/network settings or production backend access. Scenario entries are local preview controls, not a production navigation decision.

The separate story entry retains the same source nodes, relationship IDs, code/prose anchors and local comments. A slim player controls a bounded three-step authored mock account: inspect request header; inspect the added helper; inspect the unchanged caller. Each step states what/how/example and explicitly unknown motivation/runtime evidence. Play/pause advances local presentation only; reading pauses it. Enter exploration captures exact version/cursor/viewport/expansion/source/draft; neighbor reading and contextual drafts do not replace it. Resume restores that frame. Missing/stale authored context are inspectable mock states and do not substitute newer source. The prior source/account version remains visible.

Editable scope: previews/canvas-reading shared local scene/state, additional preview-specific state/tests and owning05 packets/evidence. Source/domain/application/server/data, dependencies, lock, product test registration and existing runtime remain read-only. Use existing React/React Flow and read-only installed package-entry links with task-private caches. Pure transition checks precede application edits; actual Chrome verifies play/pause/read/explore/Resume, explicit stale/missing states, keyboard and390px, then screenshot critique. Do not build a new story backend, audio or narrative generator. Continue to the separately specified discussion scenario after this bounded mock works; no user-response gate blocks independent authorized mockup work.
