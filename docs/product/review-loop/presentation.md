# Review-loop presentation

**Parent:** [Review-loop behavior](README.md)

## React and design principles

Implement the UI in React only. Do not add Svelte, Svelte components or a React/Svelte adapter. The user selected decompozr/design-system as a source of guidelines and design principles, not a component dependency. The reference package's component-installation instructions do not override that decision.

Apply the reference guidelines: restrained neutral hierarchy, meaningful limited color, related controls close together, readable Inter/monospace roles, visible keyboard focus, text alongside status colors, consistent spacing, clear loading/error/recovery states and at least 44px coarse-pointer targets. Own domain meaning and behavior in this product. Record the guideline source revision and check actual React output against it; do not claim package-component integration.

React components consume view data and collect user intent. Application/domain interfaces own submission, persisted state and validation. Selection/draft are local presentation state; cross-subsystem stream wiring remains centralized. Choose the appropriate React pattern by need without prescribing render props.

## Screen and states

Show a PR/base/head identity header, before-left and after-right source panes, a selected-span label, question composer and ordered discussion. Label removals/additions/modifications in text as well as red/green/yellow. Show question/reply author and source identity; state labels distinguish saved, delivery pending, notified, working, answered and delivery unknown. Attachment pending/revoked disables delivery with an actionable message while preserving saved content.

Keyboard users can select or specify an exact source span, reach the labeled composer, submit once and follow evidence links. Announce state updates politely without moving focus; errors associate with their fields. Submission preserves the draft until acceptance/readback or explicit rejection and avoids duplicate actions while in flight. No responsive layout can hide source attribution or uncertainty.

## Integration acceptance

Test the actual React controls in a real browser: labeled input, click and keyboard submission, disabled/busy behavior, props updates, repeated mount/unmount and listener cleanup. Inspect that only one application intent is emitted and no duplicate notification is caused by rendering. Review visual output against the guidelines and principles separately from automated behavior checks.

The product E2E starts the real app with task-local data, prepares pinned own-PR source, attaches the responsible session, asks through real controls, observes CLI notification/MCP reply and reads authoritative UI state. Independently test stale attachment, wrong anchors, duplicate commands, unknown notification and restart. Browser interaction, real CLI/MCP delivery and unfamiliar-reviewer comprehension are separate evidence.
