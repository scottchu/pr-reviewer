import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/storage/public.ts";
import { createGateway } from "../src/server/public.ts";
test("authenticated HTTP owner/bootstrap/agent boundary and managed shutdown", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pr-reviewer-http-"));
  const store = createStore(join(dir, "db"));
  store.prepare("r", {
    snapshotId: "s",
    repository: "r",
    prUrl: "url",
    prNumber: 14,
    baseSha: "a",
    headSha: "b",
    sources: [],
  });
  const token = store.issueUser();
  const gateway = createGateway(store, async () => ({
    state: "unknown",
    reason: "test",
  }));
  const port = await gateway.listen(0);
  const call = async (path: string, bearer = token, body?: unknown) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    };
  };
  try {
    assert.equal((await call("/api/reviews", "wrong")).status, 401);
    const connection = await call("/api/connections", token, {
      host: "codex",
      sessionId: "exact",
      connectionId: "launch",
      corroborated: true,
    });
    const bootstrap = String(connection.body.token);
    assert.equal((await call("/api/reviews/r", bootstrap)).status, 401);
    const c = await call("/api/challenges", token, {
      reviewId: "r",
      host: "codex",
      sessionId: "exact",
      connectionId: "launch",
    });
    const attached = await call("/api/session-attach", bootstrap, {
      challengeId: c.body.challengeId,
      proof: c.body.proof,
    });
    assert.equal(attached.status, 200);
    assert.equal(
      (await call("/api/reviews/r", String(attached.body.token))).status,
      200,
    );
    assert.equal(
      (await call("/api/inbox?limit=1000", String(attached.body.token))).status,
      400,
    );
  } finally {
    await gateway.close();
    assert.deepEqual(gateway.diagnostics(), []);
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
