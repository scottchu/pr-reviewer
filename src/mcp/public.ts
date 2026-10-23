import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { anchorSchema } from "../domain/public.ts";
export type LaunchBinding = {
  gatewayUrl: string;
  bootstrapToken: string;
  challengeId: string;
  proof: string;
  reviewId: string;
  host: string;
  sessionId: string;
  connectionId: string;
};
export const createMcp = (launch: LaunchBinding) => {
  let capability = launch.bootstrapToken;
  let attached = false;
  const server = new McpServer({ name: "pr-reviewer", version: "0.1.0" });
  const request = async (path: string, body?: unknown) => {
    const result = await fetch(`${launch.gatewayUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${capability}`,
        "Content-Type": "application/json",
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    const value = (await result.json()) as Record<string, unknown>;
    if (!result.ok) throw new Error(String(value.error ?? "invalid_request"));
    return value;
  };
  const output = (value: unknown) => ({
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
  });
  const normal = () => {
    if (!attached) throw new Error("unauthorized: call session_attach first");
  };
  server.registerTool(
    "session_attach",
    {
      description:
        "Consume the trusted local-owner launch pairing; no source access before verified binding.",
      inputSchema: {},
    },
    async () => {
      if (attached) return output({ status: "already_attached" });
      const value = await request("/api/session-attach", {
        challengeId: launch.challengeId,
        proof: launch.proof,
      });
      capability = String(value.token);
      attached = true;
      return output({
        status: "attached",
        attachment: value.attachment,
        receipt: value.receipt,
      });
    },
  );
  server.registerTool(
    "review_get",
    {
      description:
        "Read immutable source and authoritative review state for this attachment.",
      inputSchema: {
        reviewId: z.string(),
        minimumRevision: z.number().int().nonnegative().optional(),
      },
    },
    async ({ reviewId, minimumRevision }) => {
      normal();
      return output(
        await request(
          `/api/reviews/${encodeURIComponent(reviewId)}?minimumRevision=${minimumRevision ?? 0}`,
        ),
      );
    },
  );
  server.registerTool(
    "question_get",
    {
      description:
        "Read the exact question, pinned before/after source and existing answers.",
      inputSchema: { questionId: z.string() },
    },
    async ({ questionId }) => {
      normal();
      return output(
        await request(`/api/questions/${encodeURIComponent(questionId)}`),
      );
    },
  );
  server.registerTool(
    "inbox_read",
    {
      description:
        "Read durable addressed requests; reading is consumption evidence and never deletes source or notification history.",
      inputSchema: {
        cursor: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(100).default(20),
      },
    },
    async ({ cursor, limit }) => {
      normal();
      return output(
        await request(`/api/inbox?cursor=${cursor}&limit=${limit}`),
      );
    },
  );
  server.registerTool(
    "reply_submit",
    {
      description:
        "Commit a source-backed answer through the authoritative command path. Retry the same commandId only with identical payload.",
      inputSchema: {
        commandId: z.string(),
        questionId: z.string(),
        generation: z.number().int(),
        body: z.string(),
        evidence: z.array(anchorSchema).min(1).max(20),
        limitations: z.string(),
      },
    },
    async (input) => {
      normal();
      return output(
        await request("/api/commands", {
          type: "SubmitReply",
          reviewId: launch.reviewId,
          ...input,
        }),
      );
    },
  );
  return {
    server,
    start: () => server.connect(new StdioServerTransport()),
    close: () => server.close(),
  };
};
