import { test, expect } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createStore } from './store';

test('reply commit survives restart; duplicate command is stable; changed payload and stale generation reject', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pr-reviewer-journal-'));
  try {
    const file = join(dir, 'state.json');
    const args = { commandId: 'command-1', questionId: 'question-14', generation: 1, nonce: 'challenge', body: 'Persist durable product knowledge.' };
    const first = createStore(file, 'challenge');
    const receipt = first.submit(args);
    const restored = createStore(file, 'challenge');
    expect(restored.submit(args)).toEqual(receipt);
    expect(restored.read().replies).toHaveLength(1);
    expect(() => restored.submit({ ...args, body: 'changed' })).toThrow('command_conflict');
    expect(() => restored.submit({ ...args, commandId: 'new', generation: 0 })).toThrow('stale_attachment');
    expect(() => restored.submit({ ...args, commandId: 'new', nonce: 'wrong' })).toThrow('invalid_correlation');
    expect(restored.read().replies).toHaveLength(1);
  } finally { rmSync(dir, { recursive: true }); }
});

test('actual MCP stdio child reads question, rejects wrong target and commits one authoritative reply', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pr-reviewer-mcp-'));
  const file = join(dir, 'state.json');
  const transport = new StdioClientTransport({ command: process.execPath, args: ['run', join(import.meta.dir, 'server.ts')], env: { STATE_PATH: file, NONCE: 'mcp-challenge' }, stderr: 'pipe' });
  const client = new Client({ name: 'slice01-test', version: '1' });
  try {
    await client.connect(transport);
    const bad = await client.callTool({ name: 'question_get', arguments: { questionId: 'wrong' } });
    expect(bad.isError).toBe(true);
    const question = await client.callTool({ name: 'question_get', arguments: { questionId: 'question-14' } });
    expect(JSON.stringify(question.content)).toContain('mcp-challenge');
    const args = { commandId: 'mcp-command', questionId: 'question-14', generation: 1, nonce: 'mcp-challenge', body: 'Persist knowledge outside plans.' };
    const reply = await client.callTool({ name: 'reply_submit', arguments: args });
    expect(reply.isError).not.toBe(true);
    await client.callTool({ name: 'reply_submit', arguments: args });
    const stored = createStore(file, 'mcp-challenge').read();
    expect(stored.replies).toHaveLength(1);
    expect(stored.replies[0]?.body).toBe(args.body);
  } finally { await client.close(); rmSync(dir, { recursive: true }); }
}, 20000);
