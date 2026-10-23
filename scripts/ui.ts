import { createServer } from "vite";
const port = Number(process.env.REVIEW_UI_PORT),
  gateway = process.env.REVIEW_GATEWAY_URL;
if (!Number.isInteger(port) || !gateway?.startsWith("http://127.0.0.1:"))
  throw new Error("invalid UI launch binding");
const server = await createServer({
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
    proxy: { "/api": { target: gateway } },
  },
});
await server.listen();
console.log("PR_REVIEWER_UI_READY");
process.on("SIGTERM", () => {
  void server.close().then(() => process.exit(0));
});
process.on("SIGINT", () => {
  void server.close().then(() => process.exit(0));
});
