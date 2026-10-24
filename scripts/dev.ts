import {createImportArtifacts} from "../src/import-artifacts/public.ts";
import { execFileSync, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createStore } from "../src/storage/public.ts";
import { createGateway } from "../src/server/public.ts";
import { createCliNotifier } from "../src/delivery/public.ts";
import { dataRoot, files, writePrivate, acquireRuntime } from "./local.ts";
import type { Runtime } from "./local.ts";
import { prepareSource } from "./prepare.ts";
const root = dataRoot(),
  paths = files(root);
const releaseRuntime = acquireRuntime(root);
const snapshot = prepareSource(root);
const reviewId = `pr-${snapshot.prNumber}`;
const port = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1024 || value > 65535)
    throw new Error(`${name} must be an unprivileged port`);
  return value;
};
const uiPort = port("REVIEW_UI_PORT", 5184),
  gatewayPort = port("REVIEW_GATEWAY_PORT", 5185);
if (uiPort === gatewayPort) throw new Error("UI and gateway ports must differ");
const store = createStore(paths.database);
store.recover();
const gateway = createGateway(
  store,
  createCliNotifier({
    ...(process.env.REVIEW_CODEX_BIN
      ? { codex: process.env.REVIEW_CODEX_BIN }
      : {}),
    ...(process.env.REVIEW_CLAUDE_BIN
      ? { claude: process.env.REVIEW_CLAUDE_BIN }
      : {}),
  }),
  {importArtifacts:createImportArtifacts(root)},
);
let ui: ChildProcess | undefined;
const instanceId = randomUUID();
const manifest: Runtime = {
  pid: process.pid,
  processStart: execFileSync(
    "ps",
    ["-p", String(process.pid), "-o", "lstart="],
    { encoding: "utf8" },
  ).trim(),
  instanceId,
  gatewayUrl: `http://127.0.0.1:${gatewayPort}`,
  uiUrl: `http://127.0.0.1:${uiPort}/?reviewId=${reviewId}`,
  reviewId,
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  sourceDirty:
    execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()
      .length > 0,
  startedAt: new Date().toISOString(),
  status: "running",
};
let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  if (ui && ui.exitCode === null) {
    const done = new Promise<void>((resolve) =>
      ui!.once("exit", () => resolve()),
    );
    ui.kill("SIGTERM");
    await done;
  }
  if (gateway.server.listening) await gateway.close();
  else await gateway.close().catch(() => {});
  store.close();
  writePrivate(paths.runtime, { ...manifest, status: "stopped" });
  releaseRuntime();
};
try {
  await gateway.listen(gatewayPort);
  ui = spawn(process.env.REVIEW_BUN_BIN ?? "bun", ["scripts/ui.ts"], {
    env: {
      ...process.env,
      REVIEW_UI_PORT: String(uiPort),
      REVIEW_GATEWAY_URL: manifest.gatewayUrl,
    },
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("UI readiness timed out")),
      10000,
    );
    ui!.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    ui!.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`UI exited before readiness (${code})`));
    });
    ui!.stdout!.on("data", (data) => {
      if (String(data).includes("PR_REVIEWER_UI_READY")) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  const response = await fetch(`${manifest.gatewayUrl}/health`);
  if (!response.ok) throw new Error("gateway health failed");
  writePrivate(paths.runtime, manifest);
  console.log(
    `PR Reviewer ${manifest.uiUrl}\nRuntime manifest: ${paths.runtime}`,
  );
  process.on("SIGTERM", () => {
    void shutdown().then(() => process.exit(0));
  });
  process.on("SIGINT", () => {
    void shutdown().then(() => process.exit(0));
  });
} catch (error) {
  await shutdown();
  throw error;
}
