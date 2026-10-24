# Local review workspace

**Status:** Runnable test candidate; controlled-host journey verified; native-host acceptance pending

**Parent:** [Review-loop behavior](README.md)

## Run and preserve data

Use the installed Node 24, Bun 1.4 and Chrome runtimes. Dependencies are pinned in `bun.lock`. Node owns SQLite and the gateway. An owned Bun child runs Vite because the bundled signed Node rejects Vite's Rolldown native addon under its library-validation policy. Neither signing nor system security settings are changed.

```sh
export PATH="/Applications/ChatGPT.app/Contents/Resources/cua_node/bin:/opt/homebrew/Caskroom/codex/0.164.0/bin:$PATH"
bun install --frozen-lockfile
export REVIEW_DATA_DIR="$(mktemp -d -t pr-reviewer-local)"
bun run dev
```

The app binds UI `http://127.0.0.1:5184` and gateway `http://127.0.0.1:5185`. Override with `REVIEW_UI_PORT` and `REVIEW_GATEWAY_PORT`; both must be distinct unprivileged ports. An occupied port fails startup without stopping its owner. `REVIEW_CODEX_BIN` may select the installed matching CLI; it never changes model, sandbox or owner settings. `REVIEW_BUN_BIN` can name the existing Bun executable.

The data directory must be private to its OS user, outside every Git repository (including other checkouts and Git metadata) and outside `.decompozr`. The app prepares PR 14 directly from its immutable Git objects, verifies source bounds and hashes, and preserves SQLite and `snapshot.json` there. No reviewed code or install hook executes. `bun run prepare:source` can perform the same bounded preparation separately. A data-root ownership lock prevents competing runtimes. Only an absent prior PID allows stale-lock recovery; uncertainty is preserved.

After both listeners are ready, `runtime.json` records source commit and dirty-state disclosure, PID/start identity, loopback addresses and the mode-0600 local-user credential reference. Enter that credential's token into the app's password field. It stays in the bridge's memory; no credential is embedded in source or notification arguments. Protect the data root and do not paste credential contents into chat or Git.

From the same worktree and with the same data-root environment:

```sh
bun run stop
```

Stop checks PID/start time and the supervisor command before signaling it. The supervisor closes its own gateway and UI child, marks the runtime stopped, and preserves accepted questions, replies and unknown external effects. No global service or production installation exists. Restart uses the same data root.

## Optional private tailnet preview

The owner may explicitly request access through the existing Tailscale tailnet. Keep both application listeners on loopback and proxy only the UI origin with Tailscale Serve; the UI already forwards authenticated `/api` requests to the gateway. Preserve the app's local-user login and all unrelated Serve routes. Do not enable Funnel or expose the gateway separately.

Before changing routing, retain the current Serve configuration, select an unused HTTPS port and record the exact task-owned handler and rollback command in private runtime evidence. The current pilot selects HTTPS 8472 forwarding to `http://127.0.0.1:5184`. The device's verified MagicDNS hostname is `mac-mini.duckbill-ionian.ts.net`; this is an operational endpoint, not an application identity or participant-session proof.

Vite must allow only that exact hostname. Start the existing runtime with `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=mac-mini.duckbill-ionian.ts.net`, using the [documented Vite environment option](https://vite.dev/config/server-options#server-allowedhosts). Do not allow all hosts or widen the loopback bind. Preserve the existing data root and prepared source across restart.

```sh
tailscale serve --bg --https=8472 http://127.0.0.1:5184
tailscale serve status --json
```

Verify HTTPS, application assets, unauthenticated API rejection and an authenticated source query through this endpoint, then compare existing handlers and Funnel configuration with the retained baseline. Keep credentials out of URLs and logs. Host-side HTTPS checks do not prove access from another device or a completed browser/participant journey. Remove only this mapping with `tailscale serve --https=8472 off` when retiring the preview; stopping the app does not remove Serve automatically.

## Attach the exact existing Codex session

The local owner authorizes a review/session through a separate control plane. MCP model arguments cannot choose actor, session or connection identity. Owner setup reads only the first bounded `session_meta` record of an existing Codex rollout. Its ID must equal the native owner process's `CODEX_THREAD_ID`; its cwd must equal explicit `REVIEW_SESSION_CWD`. The app worktree and attached session cwd may differ.

```sh
export REVIEW_NATIVE_METADATA_REF="/path/to/existing/rollout.jsonl"
export REVIEW_SESSION_CWD="/path/to/the/existing/session/project"
bun run pair
```

Run this from the trusted initiating owner's native context; do not manufacture an environment claim to replace missing native evidence. The owner trusts its local process context and existing metadata within one OS user. This is bounded local provisioning, not vendor-signed or remote thread attestation. The script creates a five-minute, single-use challenge bound to the exact host/session/connection and emits only a mode-0600 launch-reference path and nonsecret binding metadata.

Provision that reference to the same initiating session's supported stdio MCP connection using `REVIEW_MCP_LAUNCH_REF`; launch `node --experimental-strip-types /absolute/worktree/src/mcp/main.ts`. No global MCP settings are modified by the product. The owner is responsible for provisioning the capability to that exact connection. The stdio child need not inherit native thread variables. Before `session_attach`, all review/inbox/reply tools deny access. After the challenge is consumed, the attachment token remains in process memory and is excluded from model-visible results. Reconnect requires new authorized pairing; no token is returned for copying.

For an explicitly owner-operated protocol check, `bun run mcp:client` keeps one SDK stdio connection open and accepts JSONL `{ "name": "session_attach", "arguments": {} }`, followed by `inbox_read`, `question_get` and `reply_submit` calls. This utility exercises actual MCP protocol and the app's domain boundary; it is not evidence that a native host dynamically registered those tools. Do not label it native-tool acceptance.

A Codex notification invokes only `codex queue --thread <exact-session> --message <IDs/instructions>`. Source and bearer credentials are absent from arguments. CLI acceptance means notified, not turn-started or answered. Unknown outcomes survive restart and never auto-replay. Polling and replying can succeed while delivery remains unknown. Revoking an attachment fences old credentials/generations immediately.

## Host and evidence limits

Claude's adapter supports the declared resume/print argument contract and refuses dispatch when existing-owner availability is unverified. Claude is absent from this shell environment; its trusted native provisioning and actual existing-session route remain unrun. The owner cannot use Codex metadata as Claude evidence. No substitute conversation is created.

The controlled-host E2E uses the real React app, Node/SQLite gateway, pinned PR 14 source, CLI process boundary, stdio MCP protocol and authoritative UI readback. Its controlled host is a fixture, not native Codex/Claude acceptance. The native diagnostic archive records MCP process launch but Code Mode negotiation timeout and zero persisted reply; it does not prove the product's full native route. Independent code review and an unfamiliar-reviewer comprehension session remain required.

```sh
bun run check
bun run test
bun run test:e2e
```

`check` runs strict TypeScript and subsystem import constraints. `test` covers domain, transactional storage/restart, attachment failures, notification uncertainty, route lifecycle, application retry and owned process behavior. `test:e2e` uses existing Chrome with isolated temporary data for the complete controlled PR 14 reply path and a separate explicit PR 19 source/question path. `REVIEW_E2E_ARTIFACT_DIR` optionally selects a task-owned screenshot/artifact destination outside Git. Tests do not invoke real user sessions.

## Explicit manual source for the implementation PR

The owner may prepare another real PR in this same repository using an explicit local JSON specification and a fresh data root. `REVIEW_SOURCE_SPEC` names a private task-owned JSON file with `prNumber`, exact matching `prUrl`, full immutable `baseSha`/`headSha`, one `path` and optional `title`. The owner separately verifies real GitHub PR provenance and declares the question/expected account before the run. Preparation requires those local commit objects and one blob path, strictly validates its UTF-8 bytes, and rejects trees/binary/malformed text before persistence; no network discovery, fetching, hooks, code execution or general import UI exists.

The validated specification is retained as `source-input.json` under the task data root so restart can reconstruct the same target even when the environment reference is absent. A different prepared target in that data root rejects; choose a fresh root for another task. SQLite remains authoritative and exports remain regenerable. The manifest records `reviewId` and a target-specific UI URL; owner pairing and MCP reuse that review ID. React derives source path/default selection/title from the prepared read model. Use its side/start/end controls to select the declared evidence span.

For the implementation task, PR 19's independently pinned recovery target can remain at `4dae178a4302bfdd161fca5be78144c63f562c30` while a later application candidate runs it. These are separate identities. Manual preparation and owner-operated protocol use do not establish a working general importer or native-host browser journey.


## Bootstrap target and source bounds

With no explicit selection or retained target, the bounded teaching workspace prepares PR 14 (`https://github.com/scottchu/pr-reviewer/pull/14`), base `a6d63c1e46424cb979ee912aa993ad964835c287`, head `fd6c5fb26a325c8318087c0f058de247a55e6c07`, path `docs/README.md`. The teaching task asks what the change makes explicit about durable product knowledge versus transient delivery plans; source shows the documented rebuild requirement, not a demonstrated rebuild or application behavior. This default is a reproducible bootstrap, never discovery of the user's latest PR. Explicit preparation overrides it and target identity remains visible.

Preparation bounds each Git output/blob read to 1 MiB and validates strict UTF-8, nonempty selectable text and absence of NUL. The new multi-file format accepts at most 64 explicit paths, records every changed path, prepares at most 128 source objects including one-hop context, and analyzes at most 120 inline Markdown links. A line comparison is bounded to one million base/head line pairs; beyond that, source is inspectable but line analysis is labeled not analyzed. Added/deleted content uses only the real existing side, with no invented source on the absent side. Unsupported or unprepared changed sides retain explicit reasons; no question may anchor there. Legacy single-path missing/non-blob/invalid text still rejects before persistence.

`REVIEW_SOURCE_SPEC` also accepts `paths` instead of `path` for the complete bounded graph preparation. It requires full pinned local objects and repository-relative paths, reads a complete changed-file inventory without rename inference, and adds only verified one-hop document context. The literal source links, exact line anchors and unresolved reasons accompany the manifest. This is owner-prepared evidence, not provider import or semantic graph analysis. A fresh root is required for another target until explicit snapshot-history admission is delivered.


## Controlled browser review captures

For an already running isolated candidate, `node --experimental-strip-types scripts/capture-review.ts` uses existing Chrome through the project Playwright dependency. Set private `REVIEW_DATA_DIR` and a unique external `REVIEW_CAPTURE_DIR`. The helper reads the login credential locally, signs in through actual React controls, captures the actual graph and its accessibility tree, and emits separate nonsecret candidate/target identity metadata. It does not reuse a personal browser session or imply native participant acceptance.

By default it captures only the graph before source drilldown. Optional `REVIEW_CAPTURE_PATH`, `REVIEW_CAPTURE_SIDE` and one-based `REVIEW_CAPTURE_START`/`REVIEW_CAPTURE_END` open a requested source through the actual UI and capture source identity and panes. `REVIEW_CAPTURE_CONTEXT`, `REVIEW_CAPTURE_SPANS` and `REVIEW_CAPTURE_UNRESOLVED` set to `1` expose those actual graph views. Root keeps separate diff/source captures and source-informed answer keys out of a fresh graph reviewer's first packet until its account is frozen. Artifact paths are operational evidence, never source-of-truth policy.
