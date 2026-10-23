# Probe 00: real conversation host contract

**Kind:** Bounded feasibility experiment; not a user vertical slice

**Status:** Planned; not run; capabilities unknown

**Parent:** [Product roadmap](../roadmap.md)

**Consumer:** [Slice 01](../slices/01-review-loop.md)

**Owner:** Probe executor records evidence; maintainer selects host, conversation and allowed local target

**Authorization:** Documentation only. Resolve inputs and authorize this probe's execution separately before writing a harness, connecting a tool or invoking a conversation.

## Question and scope

Can the actual selected host bind an authenticated participant to the exact intended conversation, expose a supported MCP tool to its real turn, and deduplicate/query external invocations well enough to reconcile a lost acknowledgement without blindly starting another turn?

The smallest useful experiment is one diagnostic invocation through the existing supported host interface and one harmless MCP diagnostic read. It does not require a PR, source viewer, design system, comment domain, product database, dispatcher, durable product inbox or agent reply rendered in a browser. Passing this probe establishes host feasibility only. The real anchored UI comment/reply journey remains slice 01 acceptance.

If a small disposable harness is needed, authorize its exact location and host access first. It may retain a probe invocation journal and expose a fixed diagnostic resource containing a nonce. It must not impersonate the product's domain write path. The journal records experiment effects, not review data; all later product domain mutations still require durable ingress. No general host framework, installation, permission changes, new service deployment or repository scaffold belongs in this probe.

## Required inputs and unresolved gates

| Input | Current state / owner | Consequence |
|---|---|---|
| Concrete host, version and exact existing conversation | Unselected / maintainer | No invocation until the intended destination and authority are explicit. |
| Supported authenticated attachment and MCP transport | Unverified / executor investigates supported contracts | Self-reported conversation strings or a fixture cannot establish binding. |
| Host invocation idempotency and outcome-query contract | Unverified / executor | Missing reconciliation capability blocks slice 01, even if an ordinary turn can start. |
| Local probe destination, diagnostic tool access and effect scope | Unselected / maintainer | Do not install/connect or write a harness until this bounded execution scope is authorized. |

## Procedure and evidence

1. Inspect the selected host's supported contract and record version, authentication/binding mechanism, MCP discovery/use, invocation identity and query semantics. Unsupported behavior is a finding, not permission to bypass host policy.
2. Verify the actual binding from host-side identity/session evidence and the authenticated tool context. A supplied name or the agent saying “I am conversation X” is insufficient. A wrong conversation/identity must be rejected by the boundary.
3. Persist a diagnostic operation identity and a separate stable invocationId before requesting the real turn. Request that it read the nonce through the supported MCP transport. Record host invocation/turn evidence and authenticated tool-call/result evidence that ties that nonce to the exact bound conversation. The diagnostic operation identity is analogous to a future commandId; it is not reused as invocationId.
4. Once completion is known, exercise the host's documented idempotent duplicate request with the same invocationId and payload. Query/read back the same invocation and prove that a second turn did not start. Do not test duplicate suppression by blindly launching against an unproven/non-idempotent endpoint. If the supported contract cannot safely support this check, record it as inconclusive.
5. In a separate controlled attempt, withhold the launch acknowledgement from the caller while retaining the invocationId. Query the host by that identity and reconcile the actual launch/turn outcome. Restart the probe client from its journal and repeat the query, not the launch. A lost local response may be injected, but the queried invocation and turn must be real. If fault control is unavailable, document the untested boundary rather than passing it from a mock.
6. Record pass/fail/inconclusive for each criterion, exact source/host/tool versions, redacted identity and invocation references, observations, artifacts and cleanup disposition. Never store credentials in docs. Return the supported capability boundary to slice 01; an API description alone is not observed delivery.

## Decision criteria and effort boundary

**Pass:** All four required capabilities are demonstrated against the selected real host: verified exact binding, actual supported MCP use in the turn, stable invocation identity with duplicate suppression, and reconciliation after a lost acknowledgement/client restart without a second launch. Evidence permits separating request acceptance, launch, turn completion and diagnostic tool use. Passing establishes only these capabilities for this host/version; it does not establish product durability, comment/reply acceptance or comprehension.

**Fail:** Observed wrong binding, identity bypass, duplicate real execution despite the supported contract, or a known outcome reported incorrectly. Stop affected invocation work, preserve the effect references, and reconcile the host contract/design before dependent implementation. Do not repair by weakening identity or unknown-state requirements.

**Inconclusive:** Required capability/access is missing, unsupported, unobservable or cannot safely be exercised; any launch outcome remains unknown; or the effort cap expires. Leave unknown effects queryable and avoid blind replay. Slice 01 remains blocked. The maintainer resolves access/host choice or a product-direction change; the executor reports the precise missing evidence. An honest unknown is correct handling, but not a feasibility pass.

**Proposed effort cap:** One local development session, at most 90 minutes after prerequisites and execution authority are established. Stop earlier on a material unsupported contract. Do not expand into product infrastructure to force a pass; a larger adapter project needs a revised documented scope.

## Progress and next step

No host inspection, invocation, harness, transport test or runtime execution has occurred under this plan. All capability criteria are unmet. The ready documentation action is to name the host/conversation and allowed probe target, then resolve the supported contract and execution scope. [Comprehension preparation](../comprehension.md) can proceed independently. Preserve the earlier Playground source/runtime; this probe neither uses it as delivery evidence nor changes it.
