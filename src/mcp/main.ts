import { readFileSync, statSync } from "node:fs";
import { createMcp } from "./public.ts";
import type { LaunchBinding } from "./public.ts";
const path = process.env.REVIEW_MCP_LAUNCH_REF;
if (!path) throw new Error("REVIEW_MCP_LAUNCH_REF is required");
if ((statSync(path).mode & 0o077) !== 0)
  throw new Error("launch reference must have mode 0600");
const launch = JSON.parse(readFileSync(path, "utf8")) as LaunchBinding;
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(launch.gatewayUrl))
  throw new Error("gateway must be loopback");
const mcp = createMcp(launch);
await mcp.start();
process.on("SIGTERM", () => {
  void mcp.close();
});
