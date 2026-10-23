import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { z } from 'zod';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export const replyInput = z.object({ commandId: z.string().min(1), questionId: z.string(), generation: z.number().int(), nonce: z.string(), body: z.string().min(1).max(65536) }).strict();
const receipt = z.object({ commandId: z.string(), fingerprint: z.string(), replyId: z.string(), revision: z.number().int() });
const stateSchema = z.object({ replies: z.array(replyInput.extend({ replyId: z.string() })), receipts: z.array(receipt) });
type State = z.infer<typeof stateSchema>;
export const createStore = (file: string, nonce: string) => {
  let state: State = existsSync(file) ? stateSchema.parse(JSON.parse(readFileSync(file, 'utf8'))) : { replies: [], receipts: [] };
  const read = (): State => structuredClone(state);
  const question = (questionId: string) => {
    if (questionId !== 'question-14') throw new Error('invalid_question');
    const sourceAt = (sha: string, start: number, end: number) => execFileSync('git', ['show', sha + ':docs/README.md'], { cwd: resolve(import.meta.dir, '../..'), encoding: 'utf8' }).split('\n').slice(start - 1, end).join('\n');
    const base = 'a6d63c1e46424cb979ee912aa993ad964835c287';
    const head = 'fd6c5fb26a325c8318087c0f058de247a55e6c07';
    return { questionId, generation: 1, nonce, question: 'What did PR 14 make explicit about durable product knowledge versus transient plans?', source: { pr: 'https://github.com/scottchu/pr-reviewer/pull/14', base, head, path: 'docs/README.md', before: { lines: '3-15', content: sourceAt(base, 3, 15) }, after: { lines: '3-25', content: sourceAt(head, 3, 25) } } };
  };
  const submit = (input: unknown) => {
    const args = replyInput.parse(input);
    if (args.questionId !== 'question-14') throw new Error('invalid_question');
    if (args.generation !== 1) throw new Error('stale_attachment');
    if (args.nonce !== nonce) throw new Error('invalid_correlation');
    const fingerprint = JSON.stringify(args);
    const previous = state.receipts.find(item => item.commandId === args.commandId);
    if (previous) { if (previous.fingerprint !== fingerprint) throw new Error('command_conflict'); return previous; }
    const committed = { commandId: args.commandId, fingerprint, replyId: 'reply-' + (state.replies.length + 1), revision: state.receipts.length + 1 };
    const next = { replies: [...state.replies, { ...args, replyId: committed.replyId }], receipts: [...state.receipts, committed] };
    writeFileSync(file + '.tmp', JSON.stringify(next), { mode: 0o600 });
    renameSync(file + '.tmp', file);
    state = next;
    return committed;
  };
  return { read, question, submit };
};
