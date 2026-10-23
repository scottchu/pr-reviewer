import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { LaunchBinding } from "../src/mcp/public.ts";
import type { Review, Anchor } from "../src/domain/public.ts";
let root: string,
  child: ChildProcess,
  token: string,
  client: Client,
  gatewayUrl: string,
  uiUrl: string,
  launch: LaunchBinding;
let stderr = "";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const api = async (path: string, body?: unknown) => {
  const response = await fetch(`${gatewayUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });
  const value = (await response.json()) as Record<string, unknown>;
  expect(response.ok, JSON.stringify(value)).toBeTruthy();
  return value;
};
const start = async () => {
  child = spawn(
    process.execPath,
    ["--experimental-strip-types", "scripts/dev.ts"],
    {
      env: {
        ...process.env,
        REVIEW_DATA_DIR: root,
        REVIEW_UI_PORT: "5284",
        REVIEW_GATEWAY_PORT: "5285",
        REVIEW_CODEX_BIN: join(root, "controlled-codex"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stderr?.on("data", (data) => {
    stderr += String(data);
  });
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) throw new Error(`App failed: ${stderr}`);
    if (existsSync(join(root, "runtime.json"))) {
      const runtime = JSON.parse(
        readFileSync(join(root, "runtime.json"), "utf8"),
      ) as { status: string; gatewayUrl: string; uiUrl: string };
      if (runtime.status === "running") {
        gatewayUrl = runtime.gatewayUrl;
        uiUrl = runtime.uiUrl;
        token = (
          JSON.parse(readFileSync(join(root, "local-user.json"), "utf8")) as {
            token: string;
          }
        ).token;
        return;
      }
    }
    await delay(100);
  }
  throw new Error(`app startup timeout ${stderr}`);
};
const stop = async () => {
  if (child.exitCode !== null) return;
  const done = new Promise<void>((resolve) =>
    child.once("exit", () => resolve()),
  );
  child.kill("SIGTERM");
  await done;
};
const tool = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError, JSON.stringify(result)).not.toBeTruthy();
  const content = result.content as { type: string; text: string }[];
  return JSON.parse(content[0]?.text ?? "{}") as Record<string, unknown>;
};
test.beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), "pr-reviewer-browser-"));
  writeFileSync(
    join(root, "controlled-codex"),
    `#!${process.execPath}\nimport {appendFileSync} from 'node:fs';appendFileSync(${JSON.stringify(join(root, "notifications.jsonl"))},JSON.stringify(process.argv.slice(2))+'\\n');\n`,
    { mode: 0o700 },
  );
  await start();
  const connection = await api("/api/connections", {
    host: "codex",
    sessionId: "controlled-existing-session",
    connectionId: "controlled-native-launch",
    corroborated: true,
  });
  const challenge = await api("/api/challenges", {
    reviewId: "pr-14",
    host: "codex",
    sessionId: "controlled-existing-session",
    connectionId: "controlled-native-launch",
  });
  launch = {
    gatewayUrl,
    bootstrapToken: String(connection.token),
    challengeId: String(challenge.challengeId),
    proof: String(challenge.proof),
    reviewId: "pr-14",
    host: "codex",
    sessionId: "controlled-existing-session",
    connectionId: "controlled-native-launch",
  };
  const launchRef = join(root, "mcp-launch.json");
  writeFileSync(launchRef, JSON.stringify(launch), { mode: 0o600 });
  client = new Client({ name: "controlled-browser-agent", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ["--experimental-strip-types", resolve("src/mcp/main.ts")],
      env: { PATH: process.env.PATH ?? "", REVIEW_MCP_LAUNCH_REF: launchRef },
    }),
  );
  const denied = await client.callTool({
    name: "review_get",
    arguments: { reviewId: "pr-14" },
  });
  expect(denied.isError).toBe(true);
  const attached = await tool("session_attach");
  expect(attached.status).toBe("attached");
  expect(attached.inboxCursor).toBe(0);
  expect(JSON.stringify(attached)).not.toContain(launch.bootstrapToken);
});
test.afterAll(async () => {
  await client?.close();
  if (child) await stop();
  if (root) rmSync(root, { recursive: true, force: true });
});
test("01-A/C/F/G controlled host: real React + PR14 → queue → MCP source/read/reply → authoritative UI/restart", async ({
  page,
}) => {
  await page.goto(uiUrl);
  await page.getByLabel("Local access token").fill(token);
  await page.getByRole("button", { name: "Open review" }).click();
  await expect(
    page.getByText("Session attached", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Your question")
    .fill(
      "What did this PR make explicit about where a completed slice's knowledge belongs, and can a future agent depend on old execution plans to rebuild the product?",
    );
  await page.getByRole("button", { name: "Save question" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("1 saved question · 0 answers")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save question" }),
  ).toBeDisabled();
  await expect
    .poll(() => existsSync(join(root, "notifications.jsonl")))
    .toBe(true);
  const notification = JSON.parse(
    readFileSync(join(root, "notifications.jsonl"), "utf8").trim(),
  ) as string[];
  expect(notification.slice(0, 3)).toEqual([
    "queue",
    "--thread",
    "controlled-existing-session",
  ]);
  const inbox = await tool("inbox_read");
  const items = inbox.items as { questionId: string; eventId: string }[];
  expect(items).toHaveLength(1);
  const questionId = items[0]!.questionId;
  expect(notification.join(" ")).toContain(questionId);
  const question = await tool("question_get", { questionId });
  const snapshot = question.snapshot as Review["snapshot"];
  expect(snapshot.baseSha).toBe("a6d63c1e46424cb979ee912aa993ad964835c287");
  expect(snapshot.sources.find((s) => s.side === "head")?.content).toContain(
    "durable",
  );
  const anchor: Anchor = {
    snapshotId: snapshot.snapshotId,
    side: "head",
    path: "docs/README.md",
    startLine: 5,
    endLine: 13,
  };
  const input = {
    commandId: "controlled-source-reply",
    questionId,
    generation: 1,
    body: "The PR explicitly separates durable product knowledge from transient execution plans. Accepted user stories, behavior, architecture, interfaces and detailed decisions must survive in product docs outside plans. Documentation was already authoritative before this change; a fresh agent must be able to rebuild accepted behavior without reconstructing old plans or chat.",
    evidence: [anchor],
    limitations:
      "This establishes documented requirements, not a demonstrated rebuild, executable code behavior or native host acceptance.",
  };
  const receipt = await tool("reply_submit", input);
  expect(receipt.state).toBe("applied");
  expect(await tool("reply_submit", input)).toEqual(receipt);
  await expect(page.getByText(input.body, { exact: true })).toBeVisible();
  await expect(page.getByText("Answered", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Source: head docs/README.md:5–13" })
    .click();
  await expect(page).toHaveURL(/#source-head-5$/);
  await expect(page.getByLabel("Start line")).toHaveValue("5");
  const persisted = (await api(
    `/api/reviews/pr-14?minimumRevision=${String(receipt.revision)}`,
  )) as unknown as Review;
  expect(persisted.replies).toHaveLength(1);
  expect(persisted.replies[0]?.actorId).toBe(persisted.attachment?.actorId);
  expect(persisted.questions).toHaveLength(1);
  expect(persisted.attempts).toHaveLength(1);
  expect(persisted.attempts[0]?.state).toBe("notified");
  await page.screenshot({
    path: join(
      process.env.REVIEW_E2E_ARTIFACT_DIR ??
        "/tmp/pr-reviewer-playwright-artifacts",
      "pr14-answer.png",
    ),
    fullPage: true,
  });
  await client.close();
  await stop();
  await start();
  await page.reload();
  await page.getByLabel("Local access token").fill(token);
  await page.getByRole("button", { name: "Open review" }).click();
  await expect(page.getByText(input.body, { exact: true })).toBeVisible();
  expect(
    readFileSync(join(root, "notifications.jsonl"), "utf8").trim().split("\n"),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Revoke attachment" }).click();
  await expect(
    page.getByText("Session revoked", { exact: true }),
  ).toBeVisible();
});

test("explicit manual PR19 target renders its own path and saves the declared recovery span", async ({
  page,
}) => {
  await stop();
  rmSync(root, { recursive: true, force: true });
  root = mkdtempSync(join(tmpdir(), "pr-reviewer-pr19-browser-"));
  const spec = join(root, "owner-selection.json");
  writeFileSync(
    spec,
    JSON.stringify({
      prNumber: 19,
      prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
      title: "Recovery contract",
      baseSha: "cf179ac1eeb9073c08e4e82c950cb53bdc681c72",
      headSha: "4dae178a4302bfdd161fca5be78144c63f562c30",
      path: "docs/product/review-loop/contracts.md",
    }),
  );
  const previous = process.env.REVIEW_SOURCE_SPEC;
  process.env.REVIEW_SOURCE_SPEC = spec;
  try {
    await start();
  } finally {
    if (previous === undefined) delete process.env.REVIEW_SOURCE_SPEC;
    else process.env.REVIEW_SOURCE_SPEC = previous;
  }
  await page.goto(uiUrl);
  await page.getByLabel("Local access token").fill(token);
  await page.getByRole("button", { name: "Open review" }).click();
  await expect(
    page.getByRole("link", { name: "PR 19", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "docs/product/review-loop/contracts.md",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Start line").fill("93");
  await page.getByLabel("End line").fill("99");
  await page
    .getByLabel("Your question")
    .fill(
      "After same-session re-pair, how do outstanding questions remain accessible, and does a new attachment generation make an earlier unknown notification delivered or safe to replay?",
    );
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("1 saved question · 0 answers")).toBeVisible();
  await expect(
    page.getByText("Saved · attach a session to enable delivery", {
      exact: true,
    }),
  ).toBeVisible();
  const persisted = (await api("/api/reviews/pr-19")) as unknown as Review;
  expect(persisted.snapshot.headSha).toBe(
    "4dae178a4302bfdd161fca5be78144c63f562c30",
  );
  expect(persisted.questions[0]?.anchor).toMatchObject({
    path: "docs/product/review-loop/contracts.md",
    startLine: 93,
    endLine: 99,
  });
  expect(persisted.attempts).toHaveLength(0);
});
