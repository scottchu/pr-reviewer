# One anchored question and reply

**Direction:** Accepted first 480p product behavior

**Implementation:** Merged bounded review/history/import runtime and implemented semantic/story/exploration/private-recovery candidate. Final combined own-PR comprehension, meaningful answer, knowledge audit and full-round acceptance remain open; native-host and human evidence are separate.

**Architecture:** [Subsystem responsibilities](../architecture.md)

## User story and boundaries

As a reviewer, I open one pinned before/after source change in our own real PR, select a source span, ask its responsible agent a question, and inspect the agent's persisted source-backed answer. I can distinguish the source, author, delivery state and uncertainty behind that answer. The existing Codex or Claude session initiating attachment is the responsible session; the app does not replace it.

The default bootstrap uses PR 14 with immutable identity and teaching scope defined in [runtime knowledge](runtime.md#bootstrap-target-and-source-bounds). Its documentation claim is a valid first bounded source question, not evidence of executable code behavior. Source is manually prepared from immutable Git objects; read-only structural graphs and immutable continuation/history have bounded local implementations. The merged bounded runtime includes repository-path discovery and [durable import jobs](import-jobs.md). The reviewed semantic candidate provides [bounded neighborhoods](semantic-graph.md), [retained semantic state](semantic-storage.md) and [protocol values](semantic-data.md). [Guided explanations and exploration](story-and-exploration.md) maintains the implemented authored-account/player, supporting-source investigation, exact resume and explicit private recovery contract. Static edges remain a separate factual basis, not the authored explanation.

## Interaction

### Repository-path entry

**Direction:** Accepted agent-assisted entry contract

A reviewer can give the agent a local repository or worktree path instead of locating a PR/MR URL or assembling a source specification. Resolve that path to its actual Git worktree, current branch, upstream and remotes without switching branches or changing files. Use existing authenticated provider tools to find the corresponding GitHub pull request or GitLab merge request, including the correct source project/branch and target repository for forks. Do not assume every remote is GitHub or that every GitLab instance uses gitlab.com.

Return the matched provider, project, PR/MR identity, URL, state and verified comparison base/head. Preserve the distinction between a current provider head and an already pinned review snapshot. Multiple plausible matches require presenting candidates; no match, a detached/default branch without a unique association, inaccessible metadata or unavailable authentication remains an explicit unresolved result. Never select the latest PR/MR merely because it exists, install a global tool silently, or print credentials embedded in remotes.

This is the agent's source-acquisition responsibility; the reviewer should not have to supply an identifier when the path already resolves uniquely. The merged/manual baseline's setup utility retains its explicit pinned source specification. The bounded merged runtime implements in-app path discovery and import through existing provider tools; source/job contracts and exact verified limits are maintained in [durable import jobs](import-jobs.md). Live GitHub own-PR use is distinct from controlled provider tests; live GitLab remains unverified where glab is unavailable. Once a path is supplied, verify provider metadata before claiming an actual match or preparing source.

### Anchored review

1. Open the local app and the prepared review. Show PR identity, comparison base/head, both source sides and labeled additions/removals/modifications. Missing baseline context is visible, not invented.
2. Attach from the already-running responsible session using the app's MCP operation surface. The local connection and one-use pairing challenge establish the actor/session binding; a browser cannot assign an arbitrary actor by submitting a string. Confirm the attached session before delivery.
3. Select a nonempty exact source span. The composer states its side/path/line span and snapshot; editing or changing selection does not silently move an already-saved question.
4. Submit once. Persist the question before attempting CLI delivery. Show saved, delivery-pending, notified, working, answered or delivery-unknown using distinct labels; do not claim the agent started solely because CLI exited successfully.
5. The agent receives a CLI notification, reads the review through MCP and submits its reply through MCP. The app renders the authoritative persisted reply and evidence links. Agent stdout and transcripts are diagnostics, not replies to paste into the UI.
6. Open a reply's source link at its immutable side/path/span. Restart preserves accepted questions/replies and pending work. Explicitly select retained history or another admitted head, then start a new anchored follow-up without moving the original question. Drafts hold their source selection.

The bounded continuation/graph implementation and source/import boundaries are distinguished in [evolution knowledge](evolution.md). Native-host, unfamiliar-human and full-slice acceptance remain separately open.

## Public interfaces and ownership

[Contracts](contracts.md) define IDs, data, commands, MCP and error semantics. [Delivery](delivery.md) defines CLI notification and recovery. [Local runtime](runtime.md) defines operational setup and evidence limits. [Presentation](presentation.md) defines React UI and design-guideline conformance. One StoryBridge application owner holds player/cursor, source/comparison selection, original/exploration drafts and the return frame. ReviewBridge owns exact pending-question write-ahead/receipt/readback coordination; AnalysisBridge owns admitted semantic selection and exact source reads. The workspace composes their public operations and managed routes, including draft confirmation and map capture. React renders snapshots, collects intent and retains only local presentation/form mechanics; it does not own source/draft policy. Domain owns validation and durable review state; command processing owns atomic receipts/events; delivery owns CLI effects; the MCP adapter validates credentials and delegates domain operations. Managed integration routes own subscriptions and teardown. No adapter writes around ingress.

## Observable acceptance

A saved anchored question produces one correctly attributed persisted answer from the exact attached session via MCP, visible through the app read model. Identical command retries do not duplicate state; altered payload reuse, invalid anchors and stale/revoked attachment generations reject without partial writes. Agent MCP calls progress during its own turn. Unknown notification outcomes never trigger blind redispatch. Tests cover these behaviors plus keyboard interaction, React controls following the design guidelines and principles and own-PR use. An unfamiliar-reviewer evaluation remains separate evidence; no engineering result is labeled human comprehension.

The [slice plan](../../plans/480p/slices/01-review-loop/plan.md) sequences delivery and records 01-A through 01-G results. Its checklist is not a substitute for this maintained product specification. Learning and detailed interface changes return here before slice acceptance.


Repository-path import operations, limits and persisted recovery are maintained in [durable import jobs](import-jobs.md). Static neighborhoods establish supported source relationships and honest coverage, not the user/lifecycle narrative or complete understanding. The current explanation/exploration contract keeps authored rationale, static facts and observed execution distinct. No unrun live-provider/native/human or whole-round gate is implied.
