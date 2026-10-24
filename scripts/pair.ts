import { readFileSync, openSync, readSync, closeSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";
import { dataRoot, files, writePrivate } from "./local.ts";
import type { Runtime } from "./local.ts";
// Owner control plane: this script is run by the local owner, never an MCP tool.
const root = dataRoot();
const runtime = JSON.parse(
  readFileSync(files(root).runtime, "utf8"),
) as Runtime;
const host = process.env.REVIEW_HOST ?? "codex";
if (host !== "codex" && host !== "claude")
  throw new Error("REVIEW_HOST must be codex or claude");
if (host !== "codex")
  throw new Error(
    "Claude trusted native metadata route is unverified in this environment; no binding created",
  );
const metadataRef = process.env.REVIEW_NATIVE_METADATA_REF;
const nativeThread = process.env.CODEX_THREAD_ID;
const expectedCwd = process.env.REVIEW_SESSION_CWD;
if (!metadataRef || !nativeThread || !expectedCwd)
  throw new Error(
    "Owner setup requires native CODEX_THREAD_ID, REVIEW_NATIVE_METADATA_REF rollout metadata and explicit REVIEW_SESSION_CWD",
  );
const fd = openSync(resolve(metadataRef), "r"),
  buffer = Buffer.alloc(65536);
let firstLine: string;
try {
  const count = readSync(fd, buffer, 0, buffer.length, 0);
  const boundary = buffer.subarray(0, count).indexOf(10);
  if (boundary < 0)
    throw new Error("session metadata first line exceeds bound");
  firstLine = buffer.subarray(0, boundary).toString("utf8");
} finally {
  closeSync(fd);
}
const metadata = JSON.parse(firstLine) as {
  type: string;
  payload: { id: string; cwd: string; originator: string };
};
if (
  metadata.type !== "session_meta" ||
  metadata.payload.id !== nativeThread ||
  resolve(metadata.payload.cwd) !== resolve(expectedCwd) ||
  !metadata.payload.originator
)
  throw new Error(
    "Native thread/session metadata/cwd contradiction; no binding created",
  );
const evidence = {
  sessionId: metadata.payload.id,
  cwd: metadata.payload.cwd,
  host,
  provenance:
    "owner-controlled native process context plus retained session_meta",
};
const request = async (path: string, body: unknown) => {
  const response = await fetch(`${runtime.gatewayUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const value = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(value.error));
  return value;
};
const connectionId = randomUUID();
const connection = await request("/api/connections", {
  host,
  sessionId: evidence.sessionId,
  connectionId,
  corroborated: true,
});
const challenge = await request("/api/challenges", {
  reviewId: runtime.reviewId,
  host,
  sessionId: evidence.sessionId,
  connectionId,
});
const launchRef = join(root, `mcp-launch-${connectionId}.json`);
writePrivate(launchRef, {
  gatewayUrl: runtime.gatewayUrl,
  bootstrapToken: connection.token,
  challengeId: challenge.challengeId,
  proof: challenge.proof,
  reviewId: runtime.reviewId,
  host,
  sessionId: evidence.sessionId,
  connectionId,
});
console.log(
  JSON.stringify(
    {
      launchRef,
      host,
      sessionId: evidence.sessionId,
      connectionId,
      expiresAt: challenge.expiresAt,
      instruction:
        "Register the task-local stdio MCP with REVIEW_MCP_LAUNCH_REF pointing to this file. Do not print its contents or replace the initiating session.",
    },
    null,
    2,
  ),
);
