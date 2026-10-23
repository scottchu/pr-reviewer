import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createReviewBridge,
  questionStatus,
} from "../src/application/public.ts";
import type { Review, Anchor } from "../src/domain/public.ts";
const review: Review = {
  reviewId: "r",
  snapshot: {
    snapshotId: "s",
    repository: "r",
    prUrl: "url",
    prNumber: 14,
    baseSha: "a",
    headSha: "b",
    sources: [
      { side: "base", path: "d", content: "before", lineCount: 1, hash: "h" },
      { side: "head", path: "d", content: "after", lineCount: 1, hash: "h" },
    ],
  },
  revision: 1,
  attachment: null,
  questions: [],
  replies: [],
  inbox: [],
  attempts: [],
};
const anchor: Anchor = {
  snapshotId: "s",
  side: "head",
  path: "d",
  startLine: 1,
  endLine: 1,
};
test("application preserves unknown command identity, reads accepted revision and disposes/remounts routes", async () => {
  const original = globalThis.fetch;
  let failures = 1;
  const ids: string[] = [];
  globalThis.fetch = (async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    if (init?.method === "POST") {
      const command = JSON.parse(String(init.body)) as { commandId: string };
      ids.push(command.commandId);
      if (failures-- > 0) throw new Error("lost_ack");
      return Response.json({
        commandId: command.commandId,
        state: "applied",
        revision: 1,
        result: {},
      });
    }
    return Response.json(review);
  }) as typeof fetch;
  try {
    const bridge = createReviewBridge("r");
    let updates = 0;
    const unsubscribe = bridge.subscribe(() => updates++);
    await bridge.login("user-token");
    assert.equal(bridge.getSnapshot().authenticated, true);
    await assert.rejects(bridge.ask(anchor, "Question"), /lost_ack/);
    await assert.rejects(bridge.ask(anchor, "Changed"), /submission_unknown/);
    await bridge.ask(anchor, "Question");
    assert.equal(ids.length, 2);
    assert.equal(ids[0], ids[1]);
    const dispose = bridge.connect();
    assert.equal(bridge.diagnostics().length, 1);
    assert.throws(() => bridge.connect(), /duplicate_route/);
    dispose();
    assert.equal(bridge.diagnostics().length, 0);
    const second = bridge.connect();
    second();
    unsubscribe();
    assert.ok(updates > 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("presentation separates answered/read state from unknown notification history", () => {
  const r: Review = {
    ...review,
    questions: [
      {
        questionId: "q",
        anchor,
        text: "Q",
        actorId: "u",
        revision: 1,
        createdAt: "now",
        working: false,
      },
    ],
    inbox: [
      {
        questionId: "q",
        eventId: "e",
        attachmentId: "a",
        generation: 1,
        cursor: 1,
        read: false,
      },
    ],
    attempts: [
      {
        invocationId: "i",
        attachmentId: "a",
        generation: 1,
        eventIds: ["e"],
        state: "unknown",
        reason: "lost",
      },
    ],
  };
  assert.equal(questionStatus(r, "q"), "Delivery unknown");
  assert.equal(
    questionStatus(
      { ...r, questions: r.questions.map((q) => ({ ...q, working: true })) },
      "q",
    ),
    "Working",
  );
  assert.equal(
    questionStatus(
      {
        ...r,
        replies: [
          {
            replyId: "reply",
            questionId: "q",
            body: "A",
            evidence: [anchor],
            limitations: "doc",
            actorId: "agent",
            attachmentId: "a",
            generation: 1,
            revision: 2,
          },
        ],
      },
      "q",
    ),
    "Answered",
  );
  assert.equal(r.attempts[0]?.state, "unknown");
});

test("definitive HTTP rejection allows corrected submission; pending readback retains retry", async () => {
  const original = globalThis.fetch;
  let reject = true,
    blockReadback = false;
  const ids: string[] = [];
  globalThis.fetch = (async (
    _input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { commandId: string };
      ids.push(body.commandId);
      if (reject) {
        reject = false;
        return Response.json({ error: "invalid_request" }, { status: 400 });
      }
      return Response.json({
        commandId: body.commandId,
        state: "applied",
        revision: 2,
        result: {},
      });
    }
    if (blockReadback)
      return Response.json({ error: "projection_pending" }, { status: 409 });
    return Response.json({ ...review, revision: 2 });
  }) as typeof fetch;
  try {
    const bridge = createReviewBridge("r");
    await bridge.login("token");
    await assert.rejects(
      bridge.ask(anchor, "Invalid envelope"),
      /invalid_request/,
    );
    await bridge.ask(anchor, "Corrected");
    assert.notEqual(ids[0], ids[1]);
    blockReadback = true;
    await assert.rejects(
      bridge.ask(anchor, "Wait for accepted readback"),
      /readback_pending/,
    );
    blockReadback = false;
    await bridge.ask(anchor, "Wait for accepted readback");
    assert.equal(ids[2], ids[3]);
  } finally {
    globalThis.fetch = original;
  }
});
