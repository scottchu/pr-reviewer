import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
// Local owner utility: JSONL in, MCP tool results out. Keeps one trusted transport alive.
const launchRef = process.env.REVIEW_MCP_LAUNCH_REF;
if (!launchRef) throw new Error("REVIEW_MCP_LAUNCH_REF is required");
const client = new Client({
  name: "pr-reviewer-local-owner-client",
  version: "0.1.0",
}, { versionNegotiation: { mode: { pin: "2026-07-28" } } });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: ["--experimental-strip-types", resolve("src/mcp/main.ts")],
    env: { PATH: process.env.PATH ?? "", REVIEW_MCP_LAUNCH_REF: launchRef },
  }),
);
const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
try {
  for await (const line of input) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line) as {
        name: string;
        arguments?: Record<string, unknown>;
      };
      const result = await client.callTool({
        name: request.name,
        arguments: request.arguments ?? {},
      });
      console.log(JSON.stringify(result));
    } catch (error) {
      console.log(
        JSON.stringify({
          isError: true,
          error: error instanceof Error ? error.message : "invalid_request",
        }),
      );
    }
  }
} finally {
  await client.close();
}
