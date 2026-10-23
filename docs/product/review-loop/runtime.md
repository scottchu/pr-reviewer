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

The data directory must be private to its OS user, outside the checkout and outside `.decompozr`. The app prepares PR 14 directly from its immutable Git objects, verifies source bounds and hashes, and preserves SQLite and `snapshot.json` there. No reviewed code or install hook executes. `bun run prepare:source` can perform the same bounded preparation separately. A data-root ownership lock prevents competing runtimes. Only an absent prior PID allows stale-lock recovery; uncertainty is preserved.

After both listeners are ready, `runtime.json` records source commit and dirty-state disclosure, PID/start identity, loopback addresses and the mode-0600 local-user credential reference. Enter that credential's token into the app's password field. It stays in the bridge's memory; no credential is embedded in source or notification arguments. Protect the data root and do not paste credential contents into chat or Git.

From the same worktree and with the same data-root environment:

```sh
bun run stop
```

Stop checks PID/start time and the supervisor command before signaling it. The supervisor closes its own gateway and UI child, marks the runtime stopped, and preserves accepted questions, replies and unknown external effects. No global service or production installation exists. Restart uses the same data root.

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

`check` runs strict TypeScript and subsystem import constraints. `test` covers domain, transactional storage/restart, attachment failures, notification uncertainty, route lifecycle, application retry and owned process behavior. `test:e2e` uses existing Chrome with isolated temporary data. `REVIEW_E2E_ARTIFACT_DIR` optionally selects a task-owned screenshot/artifact destination outside Git. Tests do not invoke real user sessions.
