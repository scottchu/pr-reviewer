import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
test(
  "runtime preparation, owned stop, safe occupied-port failure and native metadata rejection",
  { timeout: 20000 },
  async () => {
    const root = mkdtempSync(join(tmpdir(), "pr-reviewer-runtime-"));
    const other = mkdtempSync(join(tmpdir(), "pr-reviewer-collision-"));
    const env = {
      ...process.env,
      REVIEW_DATA_DIR: root,
      REVIEW_UI_PORT: "5484",
      REVIEW_GATEWAY_PORT: "5485",
    };
    const child = spawn(process.execPath, ["scripts/dev.ts"], {
      env,
      stdio: "ignore",
    });
    try {
      for (let i = 0; i < 100 && !existsSync(join(root, "runtime.json")); i++)
        await delay(100);
      assert.equal(child.exitCode, null);
      const manifest = JSON.parse(
        readFileSync(join(root, "runtime.json"), "utf8"),
      ) as { status: string; pid: number };
      assert.equal(manifest.status, "running");
      assert.equal(manifest.pid, child.pid);
      assert.throws(() =>
        execFileSync(process.execPath, ["scripts/dev.ts"], {
          env: { ...env, REVIEW_DATA_DIR: other },
          stdio: "pipe",
        }),
      );
      assert.equal(child.exitCode, null);
      assert.equal((await fetch("http://127.0.0.1:5485/health")).ok, true);
      const metadata = join(root, "session.jsonl");
      writeFileSync(
        metadata,
        JSON.stringify({
          type: "session_meta",
          payload: {
            id: "actual",
            cwd: process.cwd(),
            originator: "controlled",
          },
        }) + "\n",
      );
      assert.throws(() =>
        execFileSync(process.execPath, ["scripts/pair.ts"], {
          env: {
            ...env,
            CODEX_THREAD_ID: "wrong",
            REVIEW_NATIVE_METADATA_REF: metadata,
            REVIEW_SESSION_CWD: process.cwd(),
          },
          stdio: "pipe",
        }),
      );
      execFileSync(process.execPath, ["scripts/stop.ts"], {
        env,
        stdio: "pipe",
      });
      for (let i = 0; i < 100 && child.exitCode === null; i++) await delay(50);
      assert.equal(child.exitCode, 0);
      const stopped = JSON.parse(
        readFileSync(join(root, "runtime.json"), "utf8"),
      ) as { status: string };
      assert.equal(stopped.status, "stopped");
      assert.ok(existsSync(join(root, "review.sqlite")));
      assert.ok(!existsSync(join(root, "runtime.lock")));
    } finally {
      if (child.exitCode === null) child.kill("SIGTERM");
      rmSync(root, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  },
);

test("preparation recovers database-commit/export failure and ignores orphan export", async () => {
  const { prepareSource } = await import("../scripts/prepare.ts");
  const { createStore } = await import("../src/storage/public.ts");
  const { mkdirSync } = await import("node:fs");
  const root = mkdtempSync(join(tmpdir(), "pr-reviewer-prepare-crash-"));
  try {
    mkdirSync(join(root, "snapshot.json"));
    assert.throws(() => prepareSource(root));
    const store = createStore(join(root, "review.sqlite"));
    const user = { kind: "user" as const, actorId: "local-user" };
    const before = store.review(user, "pr-14");
    const question = store.command(user, {
      type: "AskQuestion",
      commandId: "retained-question",
      reviewId: "pr-14",
      anchor: {
        snapshotId: before.snapshot.snapshotId,
        side: "head",
        path: "docs/README.md",
        startLine: 5,
        endLine: 13,
      },
      text: "Retain this across export repair",
    });
    assert.equal(question.state, "applied");
    store.close();
    rmSync(join(root, "snapshot.json"), { recursive: true });
    const snapshot = prepareSource(root);
    assert.equal(snapshot.snapshotId, before.snapshot.snapshotId);
    const reopened = createStore(join(root, "review.sqlite"));
    assert.equal(reopened.review(user, "pr-14").questions.length, 1);
    reopened.close();
    const orphan = mkdtempSync(join(tmpdir(), "pr-reviewer-orphan-export-"));
    try {
      writeFileSync(join(orphan, "snapshot.json"), "{}");
      prepareSource(orphan);
      assert.ok(existsSync(join(orphan, "review.sqlite")));
    } finally {
      rmSync(orphan, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("explicit owner manual PR19 specification pins one source and survives restart without its env reference", async () => {
  const { prepareSource } = await import("../scripts/prepare.ts");
  const root = mkdtempSync(join(tmpdir(), "pr-reviewer-manual-source-"));
  const previous = process.env.REVIEW_SOURCE_SPEC;
  try {
    const spec = join(root, "owner-selection.json");
    writeFileSync(
      spec,
      JSON.stringify({
        prNumber: 19,
        prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
        title: "Recovery review",
        baseSha: "cf179ac1eeb9073c08e4e82c950cb53bdc681c72",
        headSha: "4dae178a4302bfdd161fca5be78144c63f562c30",
        path: "docs/product/review-loop/contracts.md",
      }),
    );
    process.env.REVIEW_SOURCE_SPEC = spec;
    const snapshot = prepareSource(root);
    assert.equal(snapshot.prNumber, 19);
    assert.equal(
      snapshot.sources[1]?.path,
      "docs/product/review-loop/contracts.md",
    );
    assert.ok(
      snapshot.sources[1]?.content.includes(
        "new generation begins inbox reading at cursor zero",
      ),
    );
    delete process.env.REVIEW_SOURCE_SPEC;
    assert.deepEqual(prepareSource(root), snapshot);
    writeFileSync(
      spec,
      JSON.stringify({
        prNumber: 19,
        prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
        baseSha: "cf179ac1eeb9073c08e4e82c950cb53bdc681c72",
        headSha: "4dae178a4302bfdd161fca5be78144c63f562c30",
        path: "AGENTS.md",
      }),
    );
    process.env.REVIEW_SOURCE_SPEC = spec;
    assert.throws(() => prepareSource(root), /command_conflict/);
  } finally {
    if (previous === undefined) delete process.env.REVIEW_SOURCE_SPEC;
    else process.env.REVIEW_SOURCE_SPEC = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
