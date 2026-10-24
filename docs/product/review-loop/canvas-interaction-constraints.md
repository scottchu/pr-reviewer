# Canvas interaction constraints and preview limits

Decision context: accepted same-canvas reading and separate inspectable subsystem scenarios, 2026-10-24.
Implementation layer: React/React Flow local preview only. Production application integration, layout adoption and unfamiliar-reviewer comprehension are not established by this document.
Parents: [canvas reading](canvas-reading.md), [anchored comments](canvas-comments.md), [story and exploration](story-and-exploration.md), [import/history](import-jobs.md).

## Preserve separate identities through connected reading

Source account, graph node, inspected span, explicit question anchor, story version/cursor, private return frame, draft, thread, participant delivery, job, invocation and result are separate identities. A presentation change cannot manufacture a new source or move discussion. Equal text at two commits does not merge source accounts. A draft created on one account remains labeled with that source when another account is deliberately opened. Import result readiness does not select visible source; explicit Open and preserve-draft intent does.

Return must restore the original source account as well as framing, viewport, context expansion, story cursor/version and inspected selection. A connected discussion-to-evidence return also restores the active thread. Unsent thread drafts are retained independently from navigation frames; a private question draft is not overwritten by commenting on another span. Lens switches do not request agent work, import source, launch tests or infer a new story version.

## Exact prose location and active highlighting

Resolve a prose comment using owning content ID, immutable version and content hash together, then validate exact UTF16 boundaries and quote. Never search for the quote and pick a nearby occurrence. Two equal quotations at distinct ranges are distinct anchors. Highlight the active valid anchor using its exact offsets; using the first thread in the block can falsely identify the target of a different open thread.

Availability belongs to the selected immutable content version. A missing original v1 does not make retained v2 comments unavailable. Locating v2 must display v2; locating an unavailable v1 shows that gap and preserves its thread/draft. It cannot silently display current prose behind an old anchor. Explicit original opening and source-history location remain discoverable through an accessible thread index, which dismisses after choosing a target. Code anchors additionally retain exact source account, side, path and line range.

General prose persistence remains unsupported by the current production question contract. A local prose preview uses visible unsaved/mock labels and no fabricated snapshot anchor or durable receipt.

## Reading interrupts playback

Automatic authored-step advancement and explicit source reading are different intents. Read this step must pause before it focuses source, even when the button lives inside the player controls. Keyboard focus, selection, comment composition and other reading interactions pause playback. A timer tick cannot replace source under an explicit reading action. Resume restores retained context and remains paused until the user asks to play. Missing or stale authored context must preserve the original return frame without substituting another version.

## Relevant tests are separate from execution evidence

A related test source may be inspected without being runnable by the configured target. State exact target revision, definition identity, source and availability; do not infer target coverage from a source-relevance edge. Static assertions do not establish a result. A result retains its job/invocation/result/source/environment identities through history. Cancellation requested, observed quiescence and unknown are different facts. Unknown has no invented result or automatic replay. Fixture outcomes and local simulated lifecycle controls cannot qualify production source.

Output remains bounded plain text. Byte offsets and content hash describe original bytes; streaming UTF8 decoding preserves code points split across pages. Markup, shell-looking text and escape sequences are inert data. Selecting a historical result must not attribute previously viewed output to another result. Production execution and artifact semantics remain owned by test execution/test-UI contracts, not this preview.

## Reflow, input and honest visual evidence

Focused source controls and native text selection need explicit pointer/input ownership so operating them does not pan the graph. Controlled graph reflow must retain measured dimensions and stable node identity. Measure expanded prose and source height before placing following nodes; asynchronous layout changes, open threads and narrow widths must not cause overlaps. Resize and geometry checks are engineering evidence, separate from screenshot critique.

At390px the current preview stacks source sides, explanation and contextual threads in the same graph. This preserves identity and readable text but creates a long vertical journey with bounded inner source scrolling. An expanded source thread can require inner scrolling to see its quote and composer together. Dense mock state controls and full-page sticky toolbar captures are not accepted production composition. Desktop/narrow screenshots must be inspected for readable code, marker lanes, quote/thread context and relationship labels; passing clicks and no-overlap assertions cannot establish comprehension, visual acceptance, touch hardware behavior or deployment.

No new dependency, backend model, native participant adapter, provider route or execution authority follows from these interaction constraints. The original preview and later connected scenarios preserve separate source/build/evidence receipts in their owning slice. User feedback, fresh independent UI-first understanding, production integration and actual execution retain separate gates.
