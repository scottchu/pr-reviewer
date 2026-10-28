# Codex active-turn delivery correction

**Packet revision:** 2

**Date:** 2026-10-24

**Parent:** [Slice 02](plan.md); [480p round](../../plan.md)

**Base source:** b096826e31c0927190806de91ed70b8b64aa93d8

**Status:** Docs-only accepted direction and capability investigation. Existing-owner steering route blocked; no derived adapter change. Existing queue delivery remains functional and unchanged by coordinator decision. Live steering and native catalog acceptance unrun.

## Intent, source and gap

The user requires Codex CLI delivery to steer the active existing session. Unconditional queue sends previously acknowledged notifications but did not establish the required active-turn semantics. Follow the durable [delivery contract](../../../../product/review-loop/delivery.md), [participant adapters](../../../../product/participant-adapters.md), and [runtime guide](../../../../product/review-loop/runtime.md). Preserve historical receipts and the original native owner, current MCP connections, live source/data and three already answered notifications; never replay them.

## Implementation handoff v1

**Executor:** codex_steer_delivery, dispatched by root. Repository `/Users/scottchu/projects/personal/pr-reviewer`; task worktree `/tmp/pr-reviewer-codex-steer-delivery`; branch `use-codex-active-turn-steer`. Root owns publication, PR, merge and deployment. No nested workers.

**Editable scope:** Delivery subsystem and narrow host protocol helper, existing `tests/delivery.test.ts`, owning participant/runtime/delivery docs and this slice correction. No UI, schema, analysis, test-job, dependency, lockfile, package-manifest, catalog or global configuration changes. Other worktrees and live owners are outside scope.

**Readiness:** The installed CLI supports protocol generation but no direct steer command. Default proxy did not produce an initialization response in bounded 5s and 8s read-only probes. No active-turn identity or supported owner route has been established. Missing route blocks actual steer implementation/acceptance; preserve the current working queue adapter until a supported replacement is demonstrated. A timeout alone must not cause an unverified behavioral regression. Never infer a socket or start another owner.

**Acceptance:** (S1) No unconditional Codex queue when owner/turn capability is unverified. (S2) Any implemented steer uses one exact session, immutable IDs-only notification, captured expected turn and matching acknowledgement; no new owner/turn or blind fallback after uncertainty. (S3) Failed/unknown attempts retain durable inbox and never automatically replay, including restart; MCP remains independently usable. (S4) Fixture process/causal race tests and declared normal test entrypoint pass. (S5) Root subsequently exercises the next genuine own-PR question and records native delivery separately from MCP read/reply/UI and native catalog acceptance. S5 is not authorized as a gratuitous synthetic live probe. (S6) Record MCP subscription feasibility without implementation or native-wake claims.

**Approach:** Update source docs and commit this packet first. Reconcile missing-route evidence with root. Root decided to retain the working queue implementation while active steering is blocked. If a supported route is later established, add failing tests before derived changes; use existing dependencies/runtime only. An actual proxy implementation needs existing-owner handshake and exact active-turn read evidence before claiming readiness. A fail-closed gate or abstract fake adapter does not complete native steering and is not shipped in this packet.

**Stop conditions:** No supported owner route, no causal active-turn identity, uncertain possible dispatch, or action requiring owner seizure/settings/security changes. Report exact blocker; keep supported independent preparation in scope.

## Independent-review handoff v1

Root assigns a fresh reviewer other than this implementer after candidate freeze. Read-only target: the committed correction packet and delivery diff against the pinned base; exact candidate hash supplied at dispatch. Check the specification and reported readiness against S1-S4 and S6; S1-S5 are prospective implementation/live gates, not passed results. For a future code candidate, inspect especially no queue under unknown active state, stale turn/race handling, one external effect, invocation retention, no timeout replay, and docs/evidence consistency. For a future code candidate, reproduce declared check/test entrypoints and bounded process fixtures. This docs-only candidate has no derived changes or newly committed tests. Do not mutate or send synthetic input to the existing native conversation. Review findings, checks performed and unrun native gates must be explicit. Own-PR graph-first review and live/native acceptance remain root-owned, separate requirements.

## Investigation evidence

- `/opt/homebrew/Caskroom/codex/0.164.0/bin/codex --help`, `queue --help`, `app-server --help`, and `app-server proxy --help`: installed command surfaces, no steer subcommand/flag; proxy describes the running owner's control socket.
- `codex app-server generate-ts --out <external-temp>/schema`: exit 0. Generated `TurnSteerParams` requires exact `threadId`, input and `expectedTurnId`.
- Two owned proxy processes received only newline JSON initialize requests. Neither emitted stdout/stderr by 5s/8s; each was terminated (-15). This is bounded inconclusive route evidence, not proof of impossibility or a successful connection.
- Retained external artifact: `/var/folders/7q/rjwxsm_s54s17s8mn083p71h0000gn/T/pr-reviewer-steer-probe-ebe0xmdk`, owned by this executor. It contains the second read-only probe result and generated schema, no credentials. Preserve while the route is unresolved.
- `codex app-server daemon --help` advertises only one read-only status command, `version`; `version --help` confirms it prints running/local versions. `daemon version` exited 0 and reported running daemon 0.163.0, CLI 0.164.0, and `/Users/scottchu/.codex/app-server-control/app-server-control.sock`. That is the default CLI-daemon endpoint, not established Desktop-owner mapping. No daemon lifecycle command was run.
- The reported managed CLI `/Users/scottchu/.codex/packages/app-server-daemon/current/bin/codex` was absent (direct version command exit 127). `CODEX_CLI_PATH` was unset; the known `/Applications/Codex.app/Contents/Resources/codex` candidate was absent. No installation, global configuration read, credential inspection or guessed socket followed.
- The installed Flow conversation launcher resolves `codex` from PATH; its CLI-handoff source explicitly warns not to route Desktop receivers through the default CLI daemon. This is a boundary, not a reason to try another owner.
- Declared MCP SDK 1.32.2 local source confirms latest protocol 2025-11-25 and `subscribeResource`; current MCP registers tools only. Official v2 docs require 2026-07-28 for `listen`. No resource/listen implementation or package change made.

## Required return and open gates

Return committed docs packet/candidate, test commands/results and limits to root. Existing owner-route discovery, live steering, own-PR review, independent engineering review, PR/merge/deploy and native MCP tool catalog acceptance remain separately visible. No code or test was changed. Current `src/delivery/public.ts` still uses queue, preserving existing functional support without claiming active steering. Required next input is a supported authenticated mapping to the current Desktop owner plus read-only exact active-turn observation. Root owns that capability resolution and the next genuine own-PR notification. The bounded public discovery is exhausted; do not repeat initialize probes or invent an endpoint.


## Verification and preservation

Documentation changes were checked with `git diff --check` and local link resolution. No application code, test inventory, package/dependency/lock or settings changed, so implementation test execution is not claimed. Host commands and limits above are the actual investigation evidence. The external probe artifact remains retained for the unresolved route; tracked durable knowledge is in the three linked product documents. Task worktree and commits remain retained for root's review/publication; no other worktree, process or live data was removed.
