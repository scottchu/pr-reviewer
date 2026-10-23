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
