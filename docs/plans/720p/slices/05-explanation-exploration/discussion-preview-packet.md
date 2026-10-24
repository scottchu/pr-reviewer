# Discussion and participants scenario

Date: 2026-10-24
Status: concrete local scenario packet before derived changes
Parent: [subsystem D scope](subsystem-mockups.md#d-discussion-and-participants), [anchoring contract](../../../../product/review-loop/canvas-comments.md)
Source: canvas/source identities from e2bb182; map cc50132; new story scenario in the same isolated preview

Continue a separate ?scenario=discussion entry on56672. Keep all threads floating beside their original graph content, with a scoped locate list and mixed human/agent clusters. No separate production discussion page. Preserve code/prose selection, thread draft and author identity already demonstrated by A; do not duplicate those components or add per-marker streams.

The discussion scenario adds three explicitly simulated participant-delivery states (not attached, attached but idle, notification outcome unknown), separately from message existence. A sample agent message is not evidence of an attachment/wake/answer. Every message shows its own author role. Replies remain local and unsaved.

Expose current/older/missing-original prose contexts. Existing prose threads retain their original immutable version/hash/UTF-16 quote. Choosing a newer prose version labels old threads historical and offers Open original; it never quote-matches or reanchors. Missing original reports unavailable while preserving thread/draft; a local mock restore action makes the retained original inspectable again. Code anchors keep original source-account side/path/lines. Clusters count threads; opening another thread preserves unsent drafts. Keyboard/touch can select, locate, open/reply/close with focus restoration and no text/number occlusion. Full production prose persistence is unsupported and visible in the UI.

Use only local preview state/read models, same graph identities and current React tools. No credentials, native sessions, actual notifications, backend/database, dependency/config changes. Verify version/delivery orthogonality and draft preservation with pure tests, actual Chrome desktop390px and screenshots. Root owns the user-authorized dedicated Tailscale Serve8474→56672; the preview binds loopback with exact allowed hostname mac-mini.duckbill-ionian.ts.net, no allow-all host flag or worker networking writes. The original8473/56671 canvas remains preserved. Continue independent ready E/C scenarios after this mock works; layout adoption and fresh comprehension remain open.

## Discussion checkpoint

Date: 2026-10-24
Status: local mock implemented; production persistence, attachment and adoption unestablished

The separate entry is http://localhost:56672/?scenario=discussion and root-authorized https://mac-mini.duckbill-ionian.ts.net:8474/?scenario=discussion. The same canvas retains source, comment and draft identities. Participant delivery controls affect only labeled mock state. Original/v2/unavailable prose controls preserve original hash/range/quote and draft; v1 markers appear only beside v1 content, and Open original never rematches text.

Two pure subsystem checks and two actual Chrome journeys pass (story plus discussion), with strict preview TypeScript. Discussion Chrome checks a retained unsent reply through delivery-unknown, newer prose and missing-original states, explicit original opening, local reply author and390px no-overlap/no-horizontal-overflow geometry. Screenshots: /tmp/pr-reviewer-subsystem-preview-evidence/e2e/subsystems.e2e.ts-discussi-52aa0--prose-change-independently/{discussion-desktop,discussion-narrow}.png.

Visual critique: roles, exact version and quote are readable adjacent to prose; code comments retain a reserved lane. At390px the account, thread and code are vertically sequential without overlap, but the journey is long. The desktop full-page capture records the sticky toolbar at its current scroll position and should not be treated as a static page-layout specification. The discussion controls are intentionally explicit fixture controls, not a proposed production settings form. This remains author-informed engineering/screenshot evidence; independent comprehension and layout adoption remain open. Tests/evidence and import/history continue separately.
