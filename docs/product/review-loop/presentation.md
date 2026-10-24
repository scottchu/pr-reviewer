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

## Implemented presentation decisions

The first view presents complete prepared documents in two independently scrolling panes. Pure source comparison assigns unchanged, removed, added and modified statuses; line markers and accessible labels accompany neutral/red/green/amber paint. The application view model carries these statuses into React. A line button selects one line; labeled side/start/end controls select an inclusive range. Source links retain immutable identity and update the selected span without moving an existing question.

Submission uses one application-owned command identity. An interrupted acknowledgement retains it for an unchanged retry; changing the unresolved submission is rejected until reconciled. The bridge reads at the accepted receipt's revision before clearing the draft. React Strict Mode remount and bridge route tests verify teardown/reconnect; rendering never schedules CLI work. Polling changes only view snapshots, while durable inbox delivery remains gateway-owned.

The controlled-host screenshot was inspected against design-system guideline revision `6cfe720df1a981e8ce8bb053927aea20d12f105d`: neutral hierarchy, readable source/discussion, explicit status/limits, text change markers, visible source attribution and focus treatment. Automated keyboard/source-link interaction passed. This is implementer visual review, not human comprehension or physical touch/screen-reader acceptance.

## Review read ownership

Explicit login and command receipt readback own their in-flight review request. A managed background poll must skip every in-flight read, including another poll, rather than aborting or replacing it. This preserves the login result used to initialize the semantic review scope when the owner opens an imported review. A later successful background review projection cannot substitute for that explicit authorization handoff.

Foreground operations retain latest-intent ownership: a newer explicit credential or snapshot choice may supersede an older request, and generation/publication fences still reject stale responses. The polling guard belongs only to the managed background route; it must not drop an authoritative login, selection or receipt readback. Disposal still aborts owned reads and tears down polling.

Disposal releases the canceled read's ownership slot immediately, even when its transport ignores or delays abort settlement. Reconnection or a new explicit login can own a fresh request without waiting for that obsolete transport. The disposed request's generation and controller identity remain fenced: a late success/failure cannot publish into the new lifetime or clear a newer request slot. Only actual disposal releases a canceled slot this way; background polling still cannot interrupt an active foreground read.

## Explicit bounded context controls

Before preparing declarations, the owner may leave the per-side context file cap blank to retain the default128, or enter an explicit integer1–128. Required before and after paths are independent exact repository-relative paths, one per line. Empty lines are omitted; spaces within nonempty paths, submitted order and duplicates are preserved in the command. There are no automatically chosen paths, implied allowlists or manufactured neighbors. The public command validates combined path counts, unique required counts versus the cap, and safe path/cap values before creating work.

Explain beside these controls that required paths are acquired first and remaining capacity follows the loader's stable ordering. The cap limits acquired sources per side, not the complete known inventory. A smaller cap can exclude known sources and makes incoming search scoped. It does not raise compiler budgets or establish repository-wide absence. Show each job's effective cap, and separate pending preparation and prior admitted corpus accounts with prepared/known/excluded/missing/unsupported/unvisited counts. Complete ledger and coverage remain accessible; do not label excluded source as scanned.

An unresolved command locks the form and exposes the unchanged-intent retry. The application captures submitted scope/cap/path arrays immutably, so edits or private navigation cannot alter its retained command identity. Historical facts, notes and exact-source inspection remain pinned while a new bounded preparation runs. Native input constraints provide immediate numeric feedback; authoritative validation and error recovery stay at the public application/gateway boundary.

A lowered cap may exclude changed paths from prepared analysis context as well as unchanged context paths. Only explicitly submitted required paths have required acquisition status. This never removes paths from the immutable original imported snapshot or its source browser.

A public query may supply a prepared corpus before any analysis is admitted. Label that current preparation account as pending preparation, not admitted facts. Other retained prepared context without an admitted analysis is a prepared corpus account. Reserve the admitted account label for the corpus accompanying the displayed admitted analysis.

An analysis object can also retain an unavailable result without an admitted graph. Require its positive analyzed status before using admitted account labels or suppressing the matching preparation account; truthiness is insufficient. A newer unavailable preparation does not erase a prior displayed analyzed result: show that result's admitted corpus and the distinct preparation corpus/status separately.

The same status distinction applies to declaration-list and previous-facts copy. An available prepared inventory is a prepared declaration list until it accompanies displayed analyzed facts. Do not promise that previous admitted facts remain when none exist.
