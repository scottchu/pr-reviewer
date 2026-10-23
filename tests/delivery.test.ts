import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/storage/public.ts";
import { createScheduler, cliArguments } from "../src/delivery/public.ts";
import type { Principal, Anchor } from "../src/domain/public.ts";
test("01-B/E MCP can reply during active delivery; restart keeps unknown and never replays", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pr-reviewer-delivery-"));
  const store = createStore(join(dir, "db"));
  const user: Principal = { kind: "user", actorId: "local-user" };
  const anchor: Anchor = {
    snapshotId: "s",
    side: "head",
    path: "d",
    startLine: 1,
    endLine: 1,
  };
  store.prepare("r", {
    snapshotId: "s",
    repository: "r",
    prUrl: "https://github.com/scottchu/pr-reviewer/pull/14",
    prNumber: 14,
    baseSha: "a",
    headSha: "b",
    sources: [
      {
        side: "head",
        path: "d",
        content: "text",
        lineCount: 1,
        hash: createHash("sha256").update("text").digest("hex"),
      },
    ],
  });
  const connection = store.registerConnection(user, {
    host: "codex",
    sessionId: "exact-session",
    connectionId: "trusted",
    corroborated: true,
  });
  const c = store.challenge(user, "r", "codex", "exact-session", "trusted");
  const binding = store.attach(connection.principal, c.challengeId, c.proof);
  const agent = store.authenticate(binding.token);
  const q = store.command(user, {
    type: "AskQuestion",
    commandId: "q",
    reviewId: "r",
    anchor,
    text: "why",
  });
  let calls = 0;
  const scheduler = createScheduler(store, async (n) => {
    calls++;
    assert.deepEqual(cliArguments(n).slice(0, 3), [
      "queue",
      "--thread",
      "exact-session",
    ]);
    assert.equal(store.inbox(agent).items.length, 1);
    assert.equal(
      store.command(agent, {
        type: "SubmitReply",
        commandId: "reply",
        reviewId: "r",
        questionId: String(q.result.questionId),
        generation: 1,
        body: "because",
        evidence: [anchor],
        limitations: "docs",
      }).state,
      "applied",
    );
    throw new Error("lost acknowledgement");
  });
  try {
    await scheduler.tick();
    await scheduler.tick();
    assert.equal(calls, 1);
    let r = store.review(user, "r");
    assert.equal(r.replies.length, 1);
    assert.equal(r.attempts[0]?.state, "unknown");
    assert.equal(r.inbox.length, 1);
    assert.equal(r.inbox[0]?.read, true);
    store.recover();
    await scheduler.tick();
    assert.equal(calls, 1);
    r = store.review(user, "r");
    assert.equal(r.attempts[0]?.state, "unknown");
  } finally {
    scheduler.stop();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Claude adapter uses the exact existing session and refuses unverified owner dispatch", async () => {
  const { createCliNotifier } = await import("../src/delivery/public.ts");
  const notification = {
    attachment: {
      attachmentId: "a",
      actorId: "agent",
      host: "claude" as const,
      sessionId: "existing-claude-session",
      connectionId: "native",
      generation: 1,
      active: true,
    },
    attempt: {
      invocationId: "i",
      attachmentId: "a",
      generation: 1,
      eventIds: ["e"],
      state: "notifying" as const,
      reason: "claim",
    },
    reviewId: "r",
    questionIds: ["q"],
  };
  assert.deepEqual(cliArguments(notification).slice(0, 3), [
    "--resume",
    "existing-claude-session",
    "--print",
  ]);
  assert.equal((await createCliNotifier()(notification)).state, "failed");
  assert.equal(cliArguments(notification).includes("--fork-session"), false);
});
