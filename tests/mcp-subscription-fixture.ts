import { setImmediate } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, ProtocolError, ProtocolErrorCode, McpServer, type JSONRPCMessage } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

// Isolated transport fixture; this is not a production resource or a native host.
export const subscriptionFixture = (modern: boolean) => {
  const uri = "pr-reviewer-fixture://r/a/1/inbox";
  const server = new McpServer(
    { name: "subscription-fixture", version: "2.4.0" },
    { capabilities: { resources: { subscribe: true } } },
  );
  const client = new Client(
    { name: "controlled-subscription-client", version: "2.4.0" },
    { versionNegotiation: { mode: modern ? { pin: "2026-07-28" } : "legacy" } },
  );
  const subscriptions = new Set<string>();
  server.registerResource("inbox", uri, { mimeType: "application/json" }, async () => ({
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ eventId: "e1", questionId: "q1" }) }],
  }));
  server.server.setRequestHandler("resources/subscribe", async ({ params }) => {
    if (params.uri !== uri) throw new ProtocolError(ProtocolErrorCode.InvalidParams, "outside fixture scope");
    subscriptions.add(params.uri);
    return {};
  });
  server.server.setRequestHandler("resources/unsubscribe", async ({ params }) => {
    subscriptions.delete(params.uri);
    return {};
  });
  server.server.onclose = () => subscriptions.clear();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const requests: JSONRPCMessage[] = [], responses: JSONRPCMessage[] = [];
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
  const received: string[] = [];
  client.setNotificationHandler("notifications/resources/updated", async ({ params }) => {
    received.push(params.uri);
  });
  const handle = serveStdio(() => server, { transport: serverTransport });
  return {
    uri, client, received, requests, responses,
    connect: () => client.connect(clientTransport),
    emit: async (changedUri = uri) => {
      if (modern || subscriptions.has(changedUri)) await server.server.sendResourceUpdated({ uri: changedUri });
      await setImmediate();
    },
    closeServer: () => handle.close(),
    close: async () => { await client.close(); await handle.close(); },
  };
};
