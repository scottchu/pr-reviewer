# PR-focused filename tree — first simple view

Date: 2026-10-24.
Status: latest explicit user-authorized bounded mock scope. Not production adoption or a complete semantic review experience.

The immediate artifact is a simple whole-PR file tree graph: directory branches and compact, unboxed **filenames only**. This temporarily simplifies the larger spatial-canvas design. Detailed explanation, unchanged caller/callee analysis, source panels and story design remain future scope; none is required or inferred from this tree.

Use every changed path in real PR25, baseline b096826e31c0927190806de91ed70b8b64aa93d8 and head e3b270e5f49a9215452b0b86702946043e979059. Directory/file membership is derived from that exact immutable comparison. All50 changed files belong to the tree immediately. Node identity uses the full path and kind; equal filenames in different directories remain different nodes. Visible leaf labels are only basenames; full paths are available through tooltips/accessibility. A directory label is its final path component. Edges mean **contains** only, never calls, impact or execution.

The main viewport is a full-window graph without outer page scrolling. Preserve the actual October23 references' dark editor/Inter/quiet-chrome foundation, while omitting their large content cards for this deliberately simple scope. Directory branches connect single-line text nodes; no giant cards, descriptions, bodies, badges, Focus actions, story/player, subsystem tabs, details or comment panels. One quiet reset-view control is sufficient. Drag pans, graph pinch zooms, keyboard pan/zoom remains available. Nodes are not rearranged accidentally. Default framing preserves readable filenames rather than fitting all50 files into an illegible miniature; offscreen members remain navigable by pan/zoom. Geometry is a mock proposal, not an adopted product token/layout.

A pure tree builder owns path validation, deduplication, stable identity, containment and deterministic layout. React/ReactFlow presents it without borrowing production policy or importing product internals. No backend, participant, file write or network effect occurs through interaction. Synthetic browser gestures demonstrate engineering behavior only; physical touch and unfamiliar-reader comprehension remain unverified.

The [owning implementation/review packet](../plans/720p/slices/05-explanation-exploration/reviews/pr-file-tree-mockup-v1.md) records source, scoped checks, captures and limits. The previous8476 mock stays preserved but is rejected for the current product-fit target; this new file-tree artifact does not silently accept it or replace the future whole-PR semantic design.
