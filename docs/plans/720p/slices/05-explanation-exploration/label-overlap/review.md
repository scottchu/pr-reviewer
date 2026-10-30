# Screenshot-driven label repair verification

Date: 2026-10-30.
Packet: [R1 plan](plan.md).
Base: fb42899771309657231188ba6525050ae47125af.
Initial product candidate: c7ea8d623387559db47a9ead6313c86dcec10d3b.
Final reviewed product candidate: b5d4bae7444386de6e3d6fe59327b4a68791f049.
PR: https://github.com/scottchu/pr-reviewer/pull/44 (draft).

## Observed failure and repaired scope

The two user-supplied screenshots show an actual visible failure: labels overlay other labels/cards and Assertion source appears twice. Earlier source/geometry checks did not establish visual conformance. This repair changes the owning measured placement contract; it does not treat another fixed gap or label hiding as success. Source graph, relation meaning/provenance, Test/Assertion order, CSS and ontology remain unchanged.

## Independent source review

Fresh reviewer requested gpt-6.1-sol/high. SOURCE PASS atb5d4bae; no remaining confirmed source findings. Revalidated all four permitted targeted suites17/17 PASS, without repository writes. Full-suite/build results below are owner checks, not independently rerun.

P2 resolved: the initial candidate reserved a manual label below a measured300-unit group header, then the settled live adapter reapplied its raw manual offset and moved it into the heading region. This contradicted final-placement ownership even without a gesture. The final React owner explicitly identifies movement; settled routes retain the jointly reserved map unchanged, while only active gestures follow raw input. The regression checks measured-header clearance and placement identity. Dense/actual-topology tests explicitly check this final settled path.

## Owner verification

Normal graph entrypoint187/187 PASS, including six duplicate-source/dense-scene/resize/actual-topology/impossible-space/manual-header cases. Root/minimum strict TypeScript, subsystem boundaries, production build and diff whitespace PASS; existing large-bundle warning retained. Mechanical design detector reports no findings, not visual approval. Generated canonical graph is byte-equal to retained deployedfb42899, SHA256946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a.

Representative declared sizes include27 Assertions with480x260labels,620x380resize stress, and actual pinned topology with420x230labels. Final automatic rectangles in those scenarios have zero label/card and label/label intersections and respect internal/external boundaries. They are fixture measurements, not live browser measurements. Impossible internal space keeps the relation with a blocked diagnostic marker, never a passing placement. Explicit manual overlap during movement is separate from automatic settled acceptance.

## Open visual and delivery gates

Supported CUA still reports The browser access host is unavailable. Actual desktop/390px font-ready, source-disclosure/reflow and rendered-rectangle E2E is authored but UNRUN. Repaired screenshot/interaction acceptance, own-correction-PR graph-first intake (fixed PR25/no selector), unfamiliar-reviewer comprehension and physical-device/touch remain unverified. Do not call repaired pixels passed or replace browser access with another route. Live endpoint still serves the screenshot-failing basefb42899; no merge, deployment or restart performed. Retain task build/logs/worktree and original user attachments for verification and recovery.
