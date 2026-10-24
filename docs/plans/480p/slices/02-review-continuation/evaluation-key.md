# Slice 02 bootstrap source account: verifier only

**Status:** Prospective source-backed account; not reviewer observation

**Access boundary:** Keep this document out of the blind graph reviewer's initial packet. Reveal only after its first account is frozen.

**Target:** PR 20, base aeadce0ace7f509160d0630ee18c75d74e4537b2, head df171b2ce8aee0c2e72249fc68138cf2f0e507d6. Actual graph/candidate identities are recorded at execution.

## Expected source account

The PR documents optional private tailnet access to the existing local pilot and accepts agent-assisted repository-path PR/MR lookup as a product story. Before this change those instructions/story were absent from these documents; after it, the runtime section describes private HTTPS on 8472 forwarding to loopback UI 5184, explicit host allowlisting, retained existing routes/Funnel state, scoped rollback and authentication checks. It does not add source code or implement an importer/authentication feature.

At pinned head, `docs/product/review-loop/runtime.md`, section “Optional private tailnet preview,” contains the network scope and rollback. `docs/product/review-loop/README.md`, section “Repository-path entry,” states path lookup, correct provider/project matching and ambiguity handling, while explicitly retaining manual preparation. `docs/plans/480p/slices/01-review-loop/implementation-evidence.md`, section “Private tailnet access followup,” records host-side HTTP/auth results and remaining evidence gaps. Resolve actual exact line anchors from these pinned blobs before preparation; section names alone are not immutable graph anchors.

Concrete example: a reviewer on an authorized tailnet can use the documented private address to reach the pilot, subject to existing app authentication; the documentation does not establish another-device browser success. Giving an agent a worktree path is the accepted entry behavior, but automated app discovery and GitLab import are not delivered here. Authentication, native host replies and unfamiliar-human understanding do not follow from HTTPS 200.

Expected limits: documentation is an account/instruction, not independent rerun evidence; host-side network checks cannot prove actual remote-device use or full native review. The graph should show the relationship between instructions, product contract and evidence/limits only where pinned document links/structure support it; a merely plausible relationship is interpretation and must be labeled. Unsupported source relations are an honest unknown.

## Criterion

Use the five source-account dimensions selected in the 480p evaluation packet, require correct concrete detail and no unsupported substantive claim. Additionally rate the tired-reviewer dimensions from graph-first-review.md. A graph too weak to communicate this bounded documentation change is changes needed or inconclusive, not a pass based on coverage. An independent source-informed verifier checks this key before grading. This planning author prepared the key; no independent verification or reviewer result is claimed yet.
