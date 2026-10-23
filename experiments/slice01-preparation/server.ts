import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createStore, replyInput } from './store';

const file = z.string().min(1).parse(process.env.STATE_PATH);
const nonce = z.string().min(1).parse(process.env.NONCE);
const store = createStore(file, nonce);
const server = new McpServer({ name: 'slice01-diagnostic', version: '1' });
const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
server.registerTool('question_get', { description: 'Read the bounded diagnostic question and its source; correlation nonce must be retained for reply_submit.', inputSchema: { questionId: z.string() } }, async ({ questionId }) => result(store.question(questionId)));
server.registerTool('reply_submit', { description: 'Persist the diagnostic reply through MCP. Use the exact nonce and generation returned by question_get.', inputSchema: replyInput.shape }, async args => result(store.submit(args)));
await server.connect(new StdioServerTransport());
