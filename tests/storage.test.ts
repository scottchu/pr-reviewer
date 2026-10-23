import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/storage/public.ts";
import type { Snapshot, Principal, Command } from "../src/domain/public.ts";
const snapshot: Snapshot = {
  snapshotId: "s",
  repository: "scottchu/pr-reviewer",
  prUrl: "https://github.com/scottchu/pr-reviewer/pull/14",
  prNumber: 14,
  baseSha: "a".repeat(40),
  headSha: "b".repeat(40),
  sources: [
    {
      path: "docs/README.md",
      side: "head",
      content: "one\ntwo\n",
      hash: createHash("sha256").update("one\ntwo\n").digest("hex"),
      lineCount: 2,
    },
  ],
};
const owner: Principal = { kind: "user", actorId: "local-user" };
const ask: Command = {
  type: "AskQuestion",
  commandId: "ask",
  reviewId: "r",
  anchor: {
    snapshotId: "s",
    side: "head",
    path: "docs/README.md",
    startLine: 1,
    endLine: 2,
  },
  text: "Question?",
};
const setup = () => {
  const dir = mkdtempSync(join(tmpdir(), "pr-reviewer-test-"));
  const store = createStore(join(dir, "review.sqlite"));
  store.prepare("r", snapshot);
  return { dir, store };
};
test("01-C receipts, atomic rejections, minimum revisions and restart", () => {
  const { dir, store } = setup();
  try {
    const first = store.command(owner, ask);
    assert.equal(first.state, "applied");
    assert.deepEqual(store.command(owner, ask), first);
    assert.equal(
      store.command(owner, { ...ask, text: "different" }).error,
      "command_conflict",
    );
    assert.equal(
      store.command(owner, {
        ...ask,
        commandId: "bad",
        anchor: { ...ask.anchor, endLine: 3 },
      }).error,
      "invalid_anchor",
    );
    assert.equal(store.review(owner, "r").questions.length, 1);
    assert.throws(() => store.review(owner, "r", 99), /projection_pending/);
    store.close();
    const reopened = createStore(join(dir, "review.sqlite"));
    assert.deepEqual(reopened.command(owner, ask), first);
    assert.equal(reopened.review(owner, "r").questions.length, 1);
    reopened.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("01-D pairing proof, expiry, replay, scope, replacement and revoke", () => {
  const { dir, store } = setup();
  try {
    const bootstrap = store.registerConnection(owner, {
      host: "codex",
      sessionId: "exact",
      connectionId: "native",
      corroborated: true,
    });
    assert.throws(() => store.review(bootstrap.principal, "r"), /unauthorized/);
    const challenge = store.challenge(owner, "r", "codex", "exact", "native");
    assert.throws(
      () =>
        store.attach(
          { ...bootstrap.principal, sessionId: "wrong" },
          challenge.challengeId,
          challenge.proof,
        ),
      /unauthorized/,
    );
    const binding = store.attach(
      bootstrap.principal,
      challenge.challengeId,
      challenge.proof,
    );
    assert.equal(binding.attachment.sessionId, "exact");
    assert.throws(
      () =>
        store.attach(
          bootstrap.principal,
          challenge.challengeId,
          challenge.proof,
        ),
      /unauthorized/,
    );
    const agent = store.authenticate(binding.token);
    assert.equal(agent.kind, "agent");
    const receipt = store.command(owner, ask);
    assert.equal(receipt.state, "applied");
    const reply: Command = {
      type: "SubmitReply",
      commandId: "reply",
      reviewId: "r",
      questionId: String(receipt.result.questionId),
      generation: 1,
      body: "Answer",
      evidence: [ask.anchor],
      limitations: "Documents only",
    };
    assert.equal(store.command(agent, reply).state, "applied");
    assert.equal(store.review(agent, "r").inbox.length, 1);
    store.command(owner, {
      type: "RevokeAttachment",
      commandId: "revoke",
      reviewId: "r",
      attachmentId: binding.attachment.attachmentId,
    });
    assert.equal(
      store.command(agent, { ...reply, commandId: "late" }).error,
      "stale_attachment",
    );
    assert.throws(() => store.review(agent, "r"), /stale_attachment/);
    const pending = store.registerConnection(owner, {
      host: "claude",
      sessionId: "c",
      connectionId: "unverified",
      corroborated: false,
    });
    const c = store.challenge(owner, "r", "claude", "c", "unverified");
    assert.throws(
      () => store.attach(pending.principal, c.challengeId, c.proof),
      /identity_pending/,
    );
    const expired = store.challenge(owner, "r", "codex", "exact", "native", 0);
    assert.throws(
      () =>
        store.attach(bootstrap.principal, expired.challengeId, expired.proof),
      /unauthorized/,
    );
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("01-D source preparation rejects tampered hash without creating a review", () => {
  const { dir, store } = setup();
  try {
    assert.throws(
      () =>
        store.prepare("bad", {
          ...snapshot,
          sources: [{ ...snapshot.sources[0]!, hash: "tampered" }],
        }),
      /source_unavailable/,
    );
    assert.throws(() => store.review(owner, "bad"), /source_unavailable/);
  } finally {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
