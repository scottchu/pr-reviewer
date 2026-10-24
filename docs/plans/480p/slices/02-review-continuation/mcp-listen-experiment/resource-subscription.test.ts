import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  ErrorCode,
  LATEST_PROTOCOL_VERSION,
  McpError,
  ReadResourceRequestSchema,
  ResourceUpdatedNotificationSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  type JSONRPCMessage,
} from "@modelcontextprotocol/sdk/types.js";

// Packet v1 E1/E2/E6 only: this client is a fixture, never Codex or Claude.
test("SDK v1 resource subscription acknowledges, hints, reads and tears down without native-model claims", { timeout: 3000 }, async () => {
  const uri = "pr-reviewer-fixture://review/r/attachment/a/generation/1/inbox";
  const question = { questionId: "q1", eventId: "e1", sourceRevision: "source1" };
  const server = new Server(
    { name: "pr-reviewer-subscription-fixture", version: "1" },
    { capabilities: { resources: { subscribe: true } } },
  );
  const client = new Client({ name: "controlled-sdk-client", version: "1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const requests: JSONRPCMessage[] = [];
  const responses: JSONRPCMessage[] = [];
  const clientSend = clientTransport.send.bind(clientTransport);
  const serverSend = serverTransport.send.bind(serverTransport);
  clientTransport.send = async (message, options) => {
    requests.push(message);
    await clientSend(message, options);
  };
  serverTransport.send = async (message, options) => {
    responses.push(message);
    await serverSend(message, options);
  };
  let subscribed = false;
  const received: string[] = [];
  const scope = (requested: string) => {
    if (requested !== uri) throw new McpError(ErrorCode.InvalidParams, "resource outside fixture attachment scope");
  };
  server.setRequestHandler(SubscribeRequestSchema, async ({ params }) => {
    scope(params.uri);
    subscribed = true;
    return {};
  });
  server.setRequestHandler(UnsubscribeRequestSchema, async ({ params }) => {
    scope(params.uri);
    subscribed = false;
    return {};
  });
  server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => {
    scope(params.uri);
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(question) }] };
  });
  server.onclose = () => { subscribed = false; };
  client.setNotificationHandler(ResourceUpdatedNotificationSchema, async ({ params }) => {
    received.push(params.uri);
  });
  const hint = async () => {
    if (subscribed) await server.sendResourceUpdated({ uri });
    await setImmediate();
  };
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    assert.equal(LATEST_PROTOCOL_VERSION, "2025-11-25");
    assert.equal(client.getServerCapabilities()?.resources?.subscribe, true);
    assert.equal(Reflect.get(client, "listen"), undefined);
    assert.equal(responses.some((message) => "result" in message && message.result.protocolVersion === LATEST_PROTOCOL_VERSION), true);

    await hint();
    assert.deepEqual(received, []);
    await assert.rejects(client.subscribeResource({ uri: "pr-reviewer-fixture://other/inbox" }), /outside fixture attachment scope/);
    assert.equal(subscribed, false);
    assert.deepEqual(await client.subscribeResource({ uri }), {});
    await hint();
    assert.deepEqual(received, [uri]);
    const update = responses.find((message) => "method" in message && message.method === "notifications/resources/updated");
    assert.ok(update && "method" in update);
    assert.deepEqual(update.params, { uri });
    const resource = await client.readResource({ uri: received[0]! });
    assert.deepEqual(resource.contents, [{ uri, mimeType: "application/json", text: JSON.stringify(question) }]);
    assert.equal(requests.some((message) => "method" in message && message.method === "resources/subscribe"), true);
    assert.equal(requests.some((message) => "method" in message && message.method === "resources/read"), true);

    assert.deepEqual(await client.unsubscribeResource({ uri }), {});
    await hint();
    assert.deepEqual(received, [uri]);
    await client.subscribeResource({ uri });
    await client.close();
    assert.equal(subscribed, false);
    await hint();
    assert.deepEqual(received, [uri]);
    await assert.rejects(client.readResource({ uri }), /Not connected/);
  } finally {
    await client.close();
    await server.close();
  }
});
