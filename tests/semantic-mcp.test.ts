import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createGateway } from "../src/server/public.ts";
import type { AnalysisReceipt, AnalysisView } from "../src/domain/public.ts";
import { semanticFixture, eventually } from "./semantic-fixture.ts";

test("actual stdio SDK semantic tools enforce attachment, exact evidence, retry, revocation and no wake", { timeout: 20000 }, async () => {
  const f = semanticFixture();
  let notifications = 0;
  const gateway = createGateway(f.store, async () => { notifications++; return { state: "unknown", reason: "controlled" }; });
  const client = new Client({ name: "controlled-semantic-sdk", version: "1.0.0" });
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
    const names = (await client.listTools()).tools.map(tool => tool.name);
    for (const name of ["analysis_get", "analysis_source_get", "graph_clarification_put"]) assert.ok(names.includes(name));
    assert.equal(names.some(name => /request_analysis|select.*declaration|context.*acqui/i.test(name)), false);
    const scope = { reviewId: "r", snapshotId: f.snapshot.snapshotId };
    assert.equal((await call("analysis_get", scope)).isError, true);
    const attached = await value<{ status: string; attachment: { attachmentId: string } }>("session_attach");
    assert.equal(attached.status, "attached");
    assert.equal((await value<AnalysisView>("analysis_get", scope)).analysis, null);

    assert.equal(f.store.analysis.command(f.token, f.request).state, "applied");
    await eventually(() => query().jobs[0]?.state === "awaiting_declarations");
    const choosing = query(), inventory = choosing.preparation!.inventory!, job = choosing.jobs[0]!;
    assert.equal(inventory.status, "available");
    if (inventory.status !== "available") throw new Error("inventory_unavailable");
    f.store.analysis.command(f.token, { type: "SelectAnalysisDeclarations", commandId: "sdk-owner-choice", jobId: job.jobId, expectedJobRevision: job.jobRevision, corpusId: job.corpusId!, inventoryId: job.inventoryId!, declarationIds: [inventory.declarations.find(item => item.name === "callee" && item.declaration.side === "head")!.id] });
    await eventually(() => query().jobs[0]?.state === "admitted");
    const admitted = await value<AnalysisView>("analysis_get", { ...scope, minimumGraphRevision: query().graphRevision });
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
