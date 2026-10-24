# Implementation conventions

Design specifically for React. There is no framework-agnostic core, reusable SDK or alternate-framework support requirement. Use React-specific components, hooks and bindings where they serve the product; do not add abstraction layers or separate packages solely for hypothetical framework portability. Logical subsystem boundaries still apply: React UI delegates business operations through public application interfaces rather than embedding domain rules or reaching into other subsystems' internals.

Use strict TypeScript for application code and tests. No lint/format tool is selected or required yet. Prefer functional patterns with explicit immutable inputs and isolated effects. This is a preference over classes, not a class ban; a class is acceptable when its responsibility warrants it. Keep the existing arrow-function preference; use function declarations only when required.

Choose React patterns according to the actual requirement; no particular component customization pattern is prescribed. Keep the design proportionate to the behavior being delivered. UI composition must retain accessibility, decompozr/design-system guideline and design-principle conformance and the separation of business rules from UI. It must not create another path for cross-subsystem stream wiring.

The [functional/reactive contract](../product/reactive-design.md) defines effect and subscription ownership. All code remains tested, preferably through TDD; implemented user journeys include actual React E2E and design-principle review coverage and own-PR dogfood. A convention documented here is an implementation requirement, not evidence that a configuration, build or user journey has passed.

### External reference and adoption boundary

These selected conventions were informed by the public Runway Avatar SDK at commit `917342729c1f23de20ba0238775dd003276c25b8`: [contribution guidance](https://github.com/runwayml/avatars-sdk-react/blob/917342729c1f23de20ba0238775dd003276c25b8/CONTRIBUTING.md#L74-L79) and [architecture guidance](https://github.com/runwayml/avatars-sdk-react/blob/917342729c1f23de20ba0238775dd003276c25b8/AGENTS.md#L21-L93). They are conventions of that public SDK, not established company-wide standards or interview requirements. PR Reviewer adopts the conventions above by project decision, not the external repository's instructions as a whole.

That SDK's documented design places LiveKit behind core and has React consume core events without direct LiveKit imports. Its pinned [React manifest](https://github.com/runwayml/avatars-sdk-react/blob/917342729c1f23de20ba0238775dd003276c25b8/packages/react/package.json) and [session component](https://github.com/runwayml/avatars-sdk-react/blob/917342729c1f23de20ba0238775dd003276c25b8/packages/react/src/components/AvatarSession.tsx#L18-L25) still directly depend on/import LiveKit. This is an observed implementation divergence, not proof that the documented isolation is complete. Its Biome choice, framework-agnostic package split and LiveKit dependency are not adopted here; PR Reviewer's own subsystem and managed-stream contracts remain authoritative.

## UI guidance

Use decompozr/design-system as a guidelines and design-principles reference. Implement in React; do not install Svelte or bridge to Svelte components. Apply the relevant visual, geometry, accessibility and feedback principles, then test the actual React journey and separately inspect visual conformance. The external package’s component-use rules are not adopted.


When reusing declared dependencies through package-entry links in an isolated task worktree, keep generated cache directories (for example `.vite` and `.cache`) as real task-local ignored directories. Do not link generated cache output to a shared dependency checkout, or mutate/delete shared cache contents while correcting a task-local link. This preserves task isolation without introducing another dependency installation.

## Regression test entrypoints

Every committed regression test must be reachable through the repository's declared normal test entrypoint. When adding a top-level `tests/*.test.ts` suite, reconcile that inventory with `package.json`'s explicit test command before accepting the change. Keep each suite under its intended runtime: the fixed four-file Bun source-core target remains separate from the explicit Node suite list. An ad hoc focused pass does not establish that the normal entrypoint executes the regression. Run the declared entrypoint and confirm the new cases appear in its actual output; preserve failures and execution limits. This is a maintenance obligation, not a new discovery framework or permission to change dependency/lock/runtime policy.
