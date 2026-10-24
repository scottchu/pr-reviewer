import { test } from "node:test";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createGateway } from "../src/server/public.ts";
import type { AnalysisReceipt, AnalysisView } from "../src/domain/public.ts";
import { semanticFixture, eventually } from "./semantic-fixture.ts";

test("actual stdio SDK semantic tools enforce attachment, exact evidence, retry, revocation and no wake", { timeout: 20000 }, async () => {
  const f = semanticFixture();
  let notifications = 0;
  const gateway = createGateway(f.store, async () => { notifications++; return { state: "unknown", reason: "controlled" }; });
  const client = new Client({ name: "controlled-semantic-sdk", version: "1.0.0" }, { versionNegotiation: { mode: { pin: "2026-07-28" }, probe: { timeoutMs: 1000, maxRetries: 0 } } });
  const query = () => f.store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId });
  const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });
  const value = async <T>(name: string, args: Record<string, unknown> = {}): Promise<T> => {
    const result = await call(name, args);
    assert.notEqual(result.isError, true);
    const content = result.content as { type: string; text?: string }[];
    assert.equal(content[0]?.type, "text");
    return JSON.parse(content[0]!.text!) as T;
  };
  try {
    const port = await gateway.listen(0), user = { kind: "user" as const, actorId: "local-user" };
    const connection = f.store.registerConnection(user, { host: "codex", sessionId: "controlled-semantic-session", connectionId: "controlled-semantic-connection", corroborated: true });
    const challenge = f.store.challenge(user, "r", "codex", "controlled-semantic-session", "controlled-semantic-connection");
    const launchRef = join(f.root, "controlled-mcp-launch.json");
    writeFileSync(launchRef, JSON.stringify({ gatewayUrl: `http://127.0.0.1:${port}`, bootstrapToken: connection.token, challengeId: challenge.challengeId, proof: challenge.proof, reviewId: "r", host: "codex", sessionId: "controlled-semantic-session", connectionId: "controlled-semantic-connection" }), { mode: 0o600 });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: ["--experimental-strip-types", resolve("src/mcp/main.ts")], env: { PATH: process.env.PATH ?? "", REVIEW_MCP_LAUNCH_REF: launchRef } }));
    assert.equal(client.getNegotiatedProtocolVersion(), "2026-07-28");
    const names = (await client.listTools()).tools.map(tool => tool.name);
    for (const name of ["analysis_get", "analysis_source_get", "graph_clarification_put"]) assert.ok(names.includes(name));
    assert.equal(names.some(name => /request_analysis|select.*declaration|context.*acqui/i.test(name)), false);
    const scope = { reviewId: "r", snapshotId: f.snapshot.snapshotId };
    assert.equal((await call("analysis_get", scope)).isError, true);
    const attached = await value<{ status: string; attachment: { attachmentId: string } }>("session_attach");
    assert.equal(attached.status, "attached");
    assert.equal((await value<AnalysisView>("analysis_get", scope)).analysis, null);

    assert.equal(f.store.analysis.command(f.token, { ...f.request, contextFilesPerSide: 2, priorityPaths: { base: ["callee.ts", "caller.ts"], head: ["callee.ts", "caller.ts"] } }).state, "applied");
    await eventually(() => query().jobs[0]?.state === "awaiting_declarations");
    const choosing = query(), inventory = choosing.preparation!.inventory!, job = choosing.jobs[0]!;
    assert.equal(inventory.status, "available");
    if (inventory.status !== "available") throw new Error("inventory_unavailable");
    f.store.analysis.command(f.token, { type: "SelectAnalysisDeclarations", commandId: "sdk-owner-choice", jobId: job.jobId, expectedJobRevision: job.jobRevision, corpusId: job.corpusId!, inventoryId: job.inventoryId!, declarationIds: [inventory.declarations.find(item => item.name === "callee" && item.declaration.side === "head")!.id] });
    await eventually(() => query().jobs[0]?.state === "admitted");
    const admitted = await value<AnalysisView>("analysis_get", { ...scope, minimumGraphRevision: query().graphRevision });
    assert.equal(admitted.jobs[0]!.contextFilesPerSide, 2);
    assert.equal(admitted.corpus!.budgets.filesPerSide, 2);
    assert.equal(admitted.analysis?.status, "analyzed");
    if (admitted.analysis?.status !== "analyzed") throw new Error("analysis_unavailable");
    const primary = admitted.analysis.nodes.find(node => node.name === "callee" && node.declaration.side === "head")!.declaration;
    const sourceQuery = { ...scope, corpusId: admitted.corpus!.corpusId, side: primary.side, path: primary.path, contentHash: primary.contentHash };
    const source = await value<{ content: string; contentHash: string }>("analysis_source_get", sourceQuery);
    assert.equal(source.contentHash, primary.contentHash);
    assert.match(source.content, /😀2/);
    const clarification = { commandId: "sdk-clarification", snapshotId: f.snapshot.snapshotId, analysisId: admitted.analysis.analysisId, expectedGraphRevision: admitted.graphRevision, kind: "interpretation", text: "Static caller binding is evidence; runtime execution remains unobserved.", primary, evidence: [primary] };
    const receipt = await value<AnalysisReceipt>("graph_clarification_put", clarification);
    assert.equal(receipt.state, "applied");
    assert.deepEqual(await value<AnalysisReceipt>("graph_clarification_put", clarification), receipt);
    const confirmed = await value<AnalysisView>("analysis_get", { ...scope, minimumGraphRevision: receipt.graphRevision });
    assert.equal(confirmed.clarifications.length, 1);
    assert.equal(confirmed.clarifications[0]!.history[0]!.actorKind, "agent");
    assert.equal(confirmed.clarifications[0]!.history[0]!.text, clarification.text);
    assert.equal((await value<{ items: unknown[] }>("inbox_read")).items.length, 0);
    assert.equal(notifications, 0);
    f.store.command(user, { type: "RevokeAttachment", commandId: "revoke-sdk", reviewId: "r", attachmentId: attached.attachment.attachmentId });
    for (const [name, args] of [["analysis_get", scope], ["analysis_source_get", sourceQuery], ["graph_clarification_put", clarification]] as const) assert.equal((await call(name, args)).isError, true);
    assert.equal(query().clarifications.length, 1);
    assert.equal(notifications, 0);
  } finally {
    await client.close();
    await gateway.close();
    f.cleanup();
  }
});

test("U3 modern SDK listen acknowledges exact filter, reads separately, cancels and tears down", { timeout: 5000 }, async () => {
  const { subscriptionFixture } = await import("./mcp-subscription-fixture.ts");
  const f = subscriptionFixture(true);
  try {
    await f.connect();
    assert.equal(f.client.getNegotiatedProtocolVersion(), "2026-07-28");
    const subscription = await f.client.listen({ resourceSubscriptions: [f.uri] });
    assert.deepEqual(subscription.honoredFilter, { resourceSubscriptions: [f.uri] });
    assert.equal(f.responses.some(message => "method" in message && message.method === "notifications/subscriptions/acknowledged"), true);
    await f.emit("pr-reviewer-fixture://other/inbox");
    assert.deepEqual(f.received, []);
    await f.emit();
    assert.deepEqual(f.received, [f.uri]);
    const resource = await f.client.readResource({ uri: f.received[0]! });
    assert.deepEqual(resource.contents, [{ uri: f.uri, mimeType: "application/json", text: '{"eventId":"e1","questionId":"q1"}' }]);
    await subscription.close();
    await subscription.close();
    assert.equal(await subscription.closed, "local");
    assert.equal(f.requests.some(message => "method" in message && message.method === "notifications/cancelled"), true);
    await f.emit();
    assert.deepEqual(f.received, [f.uri]);
    const controller = new AbortController();
    const aborted = await f.client.listen({ resourceSubscriptions: [f.uri] }, { signal: controller.signal });
    controller.abort();
    assert.equal(await aborted.closed, "local");
    // Local abort settlement is not a remote cancellation acknowledgement.
    // A later ordered round trip fences teardown before testing future events.
    await f.client.readResource({ uri: f.uri });
    await f.emit();
    assert.deepEqual(f.received, [f.uri]);
    const closing = await f.client.listen({ resourceSubscriptions: [f.uri] });
    await f.closeServer();
    assert.equal(await closing.closed, "graceful");
    await assert.rejects(f.client.readResource({ uri: f.uri }), /Not connected/);
  } finally { await f.close(); }
});

test("U3 legacy protocol retains subscribe/unsubscribe and explicitly rejects modern listen", { timeout: 5000 }, async () => {
  const { subscriptionFixture } = await import("./mcp-subscription-fixture.ts");
  const { SdkError, SdkErrorCode } = await import("@modelcontextprotocol/client");
  const f = subscriptionFixture(false);
  try {
    await f.connect();
    assert.equal(f.client.getNegotiatedProtocolVersion(), "2025-11-25");
    await assert.rejects(f.client.listen({ resourceSubscriptions: [f.uri] }), error => error instanceof SdkError && error.code === SdkErrorCode.MethodNotSupportedByProtocolVersion);
    await assert.rejects(f.client.subscribeResource({ uri: "pr-reviewer-fixture://other/inbox" }), /outside fixture scope/);
    await f.emit();
    assert.deepEqual(f.received, []);
    await f.client.subscribeResource({ uri: f.uri });
    await f.emit();
    assert.deepEqual(f.received, [f.uri]);
    assert.equal((await f.client.readResource({ uri: f.uri })).contents.length, 1);
    await f.client.unsubscribeResource({ uri: f.uri });
    await f.emit();
    assert.deepEqual(f.received, [f.uri]);
  } finally { await f.close(); }
});


test("U2 owner JSONL utility negotiates modern MCP, preserves pairing and closes at input EOF", { timeout: 10000 }, async () => {
  const f = semanticFixture();
  const gateway = createGateway(f.store, async () => ({ state: "unknown", reason: "controlled" }));
  let child: ReturnType<typeof spawn> | undefined;
  try {
    const port = await gateway.listen(0);
    const owner = { kind: "user" as const, actorId: "local-user" };
    const connection = f.store.registerConnection(owner, { host: "codex", sessionId: "controlled-owner-utility", connectionId: "utility-connection", corroborated: true });
    const challenge = f.store.challenge(owner, "r", "codex", "controlled-owner-utility", "utility-connection");
    const launchRef = join(f.root, "owner-utility-launch.json");
    writeFileSync(launchRef, JSON.stringify({ gatewayUrl: `http://127.0.0.1:${port}`, bootstrapToken: connection.token, challengeId: challenge.challengeId, proof: challenge.proof, reviewId: "r", host: "codex", sessionId: "controlled-owner-utility", connectionId: "utility-connection" }), { mode: 0o600 });
    child = spawn(process.execPath, ["--experimental-strip-types", resolve("scripts/mcp-client.ts")], { env: { PATH: process.env.PATH ?? "", REVIEW_MCP_LAUNCH_REF: launchRef }, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout!.on("data", chunk => { stdout += String(chunk); });
    child.stderr!.on("data", chunk => { stderr += String(chunk); });
    const exit = new Promise<number | null>((resolveExit, reject) => { child!.once("error", reject); child!.once("close", resolveExit); });
    child.stdin!.end('invalid-json\n{"name":"session_attach"}\n{"name":"inbox_read"}\n');
    assert.equal(await exit, 0, stderr);
    const results = stdout.trim().split("\n").map(line => JSON.parse(line) as Record<string, unknown>);
    assert.equal(results.length, 3);
    assert.equal(results[0]?.isError, true);
    const text = (result: Record<string, unknown>) => JSON.parse((result.content as { text: string }[])[0]!.text) as Record<string, unknown>;
    assert.equal(text(results[1]!).status, "attached");
    assert.deepEqual(text(results[2]!).items, []);
    assert.equal(stdout.includes(connection.token), false);
    assert.equal(stdout.includes(challenge.proof), false);
  } finally {
    if (child && child.exitCode === null) child.kill("SIGTERM");
    await gateway.close();
    f.cleanup();
  }
});


test("U2-F actual stdio modern probe falls back to fresh legacy attachment state", { timeout: 10000 }, async () => {
  const f = semanticFixture();
  const gateway = createGateway(f.store, async () => ({ state: "unknown", reason: "controlled" }));
  let child: ReturnType<typeof spawn> | undefined;
  let lines: ReturnType<typeof createInterface> | undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  try {
    const port = await gateway.listen(0), owner = { kind: "user" as const, actorId: "local-user" };
    const connection = f.store.registerConnection(owner, { host: "codex", sessionId: "controlled-fallback-session", connectionId: "fallback-connection", corroborated: true });
    const challenge = f.store.challenge(owner, "r", "codex", "controlled-fallback-session", "fallback-connection");
    const launchRef = join(f.root, "fallback-launch.json");
    writeFileSync(launchRef, JSON.stringify({ gatewayUrl: `http://127.0.0.1:${port}`, bootstrapToken: connection.token, challengeId: challenge.challengeId, proof: challenge.proof, reviewId: "r", host: "codex", sessionId: "controlled-fallback-session", connectionId: "fallback-connection" }), { mode: 0o600 });
    child = spawn(process.execPath, ["--experimental-strip-types", resolve("src/mcp/main.ts")], { env: { PATH: process.env.PATH ?? "", REVIEW_MCP_LAUNCH_REF: launchRef }, stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    child.stderr!.on("data", chunk => { stderr += String(chunk); });
    type Response = { id?: number; result?: Record<string, unknown>; error?: { code: number; message: string } };
    const pending = new Map<number, (value: Response) => void>();
    lines = createInterface({ input: child.stdout! });
    lines.on("line", line => { const response = JSON.parse(line) as Response; if (typeof response.id === "number") pending.get(response.id)?.(response); });
    const request = (id: number, method: string, params: Record<string, unknown> = {}) => new Promise<Response>((resolveResponse, reject) => {
      const timer = setTimeout(() => { pending.delete(id); timers.delete(timer); reject(new Error(`fixture response timeout: ${method}; ${stderr}`)); }, 3000);
      timers.add(timer);
      pending.set(id, response => { clearTimeout(timer); timers.delete(timer); pending.delete(id); resolveResponse(response); });
      child!.stdin!.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
    const discover = await request(1, "server/discover", { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientInfo": { name: "controlled-fallback", version: "1" }, "io.modelcontextprotocol/clientCapabilities": {} } });
    assert.ok(discover.result);
    const legacy = await request(2, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "controlled-fallback", version: "1" } });
    assert.equal(legacy.result?.protocolVersion, "2025-11-25", JSON.stringify(legacy.error));
    child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    const catalog = await request(3, "tools/list");
    assert.ok((catalog.result?.tools as { name: string }[]).some(tool => tool.name === "session_attach"));
    assert.equal((await request(4, "tools/call", { name: "inbox_read", arguments: {} })).result?.isError, true);
    const value = (response: Response) => JSON.parse((response.result?.content as { text: string }[])[0]!.text) as Record<string, unknown>;
    const attached = value(await request(5, "tools/call", { name: "session_attach", arguments: {} }));
    assert.equal(attached.status, "attached");
    assert.equal((attached.attachment as { sessionId: string }).sessionId, "controlled-fallback-session");
    assert.deepEqual(value(await request(6, "tools/call", { name: "inbox_read", arguments: {} })).items, []);
  } finally {
    for (const timer of timers) clearTimeout(timer);
    lines?.close();
    if (child && child.exitCode === null) {
      const closed = new Promise<void>(resolveClose => child!.once("close", () => resolveClose()));
      child.kill("SIGTERM");
      await closed;
    }
    await gateway.close();
    f.cleanup();
  }
});
