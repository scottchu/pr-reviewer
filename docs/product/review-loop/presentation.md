# Review-loop presentation

**Parent:** [Review-loop behavior](README.md)

## React and the actual design system

React owns the review shell, source selection and view-store subscription. The current @decompozr/design-system package is Svelte 5, not a React component package. Do not import Svelte component exports as React components or substitute lookalikes while claiming actual integration.

Use a small UI-only Svelte island, mounted through a React lifecycle adapter, for actual design-system controls: labeled TextArea, Button and status feedback as supported by the pinned package. Mount into an adapter-owned DOM root, update its presentation props/callbacks, and unmount on React cleanup. React does not reconcile inside the island; the island never owns domain state, authentication or stream routing. Pin the design-system source/package identity and a compatible Svelte runtime. Do not modify the shared design-system repo to build the first slice.

Keep the interop adapter narrow. Its public props are view data, draft text, disabled/busy state and callbacks for intent. Input callbacks update the React presentation/application bridge; submission delegates AskQuestion. Authoritative question/reply state comes from the approved view store. Do not use a general multi-framework plugin layer.

## Screen and states

Show a PR/base/head identity header, before-left and after-right source panes, a selected-span label, question composer and ordered discussion. Label removals/additions/modifications in text as well as red/green/yellow. Show question/reply author and source identity; state labels distinguish saved, delivery pending, notified, working, answered and delivery unknown. Attachment pending/revoked disables delivery with an actionable message while preserving saved content.

Keyboard users can select or specify an exact source span, reach the labeled composer, submit once and follow evidence links. Announce state updates politely without moving focus; errors associate with their fields. Submission preserves the draft until acceptance/readback or explicit rejection and avoids duplicate actions while in flight. No responsive layout can hide source attribution or uncertainty.

## Integration acceptance

Test actual compiled design-system components in a real browser under React: labeled input, click and keyboard submission, disabled/busy behavior, props updates, repeated mount/unmount and listener cleanup. Inspect that only one application intent is emitted and no duplicate notification is caused by rendering. A CSS-token-only mock is not actual integration.

The product E2E starts the real app with task-local data, prepares pinned own-PR source, attaches the responsible session, asks through real controls, observes CLI notification/MCP reply and reads authoritative UI state. Independently test stale attachment, wrong anchors, duplicate commands, unknown notification and restart. Browser interaction, real CLI/MCP delivery and unfamiliar-reviewer comprehension are separate evidence.
