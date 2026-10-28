import {createHash} from 'node:crypto';
import type {FactDocument} from './compile-source-graph.ts';

export type DocumentWitness = Readonly<{
  side: 'base' | 'head'; commit: string; path: string; contentHash: string;
  startLine: number; endLine: number; text: string;
}>;
export type NativeDocumentHunk = Readonly<{
  index: number; header: string;
  before: DocumentWitness | null; after: DocumentWitness | null;
}>;
type ChangedFile = FactDocument['files'][number];
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

/** Native patch witnesses only: no Markdown section matching or semantic inference. */
export const nativeDocumentHunks = (file: ChangedFile): readonly NativeDocumentHunk[] => {
  if (file.patch === null || hash(file.patch) !== file.patchHash)
    throw new Error('document_patch_identity_unavailable');
  const lines = file.patch.split('\n');
  const hunks: NativeDocumentHunk[] = [];
  let cursor = 0;
  while (cursor < lines.length) {
    const header = lines[cursor++]!;
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
    if (!match) continue;
    const beforeStart = Number(match[1]), beforeCount = Number(match[2] ?? 1);
    const afterStart = Number(match[3]), afterCount = Number(match[4] ?? 1);
    const before: string[] = [], after: string[] = [];
    let previous: string | undefined;
    while (cursor < lines.length && !lines[cursor]!.startsWith('@@ ')) {
      const line = lines[cursor++]!;
      if (line === String.fromCharCode(92) + ' No newline at end of file') {
        for (const output of previous === ' ' ? [before, after] : previous === '-' ? [before] : previous === '+' ? [after] : []) {
          if (!output.length) throw new Error('document_patch_newline_marker_invalid');
          output[output.length - 1] = output.at(-1)!.slice(0, -1);
        }
        continue;
      }
      const prefix = line[0];
      if (![' ', '-', '+'].includes(prefix ?? '')) {
        if (line === '' && cursor === lines.length) break;
        throw new Error('document_patch_row_invalid');
      }
      const text = line.slice(1) + '\n';
      if (prefix !== '+') before.push(text);
      if (prefix !== '-') after.push(text);
      previous = prefix;
    }
    if (before.length !== beforeCount || after.length !== afterCount)
      throw new Error('document_patch_hunk_count_mismatch');
    const witness = (side: 'base' | 'head', startLine: number, count: number, rows: readonly string[]): DocumentWitness | null => {
      if (count === 0) return null;
      const source = file.sides.find(value => value.side === side);
      if (!source?.available || !('contentHash' in source) || !source.contentHash || source.disposition !== 'text')
        throw new Error('document_source_identity_unavailable');
      return {side, commit: source.commit, path: file.path, contentHash: source.contentHash,
        startLine, endLine: startLine + count - 1, text: rows.join('')};
    };
    hunks.push({index: hunks.length + 1, header,
      before: witness('base', beforeStart, beforeCount, before),
      after: witness('head', afterStart, afterCount, after)});
  }
  return hunks;
};
