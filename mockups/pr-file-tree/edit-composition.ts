import type {FactDocument} from './compile-source-graph.ts';
import type {GraphEntity} from './minimal-graph.ts';
import {nativeDocumentHunks, type NativeDocumentHunk, type NativeEditRow, type DocumentWitness} from './native-document-comparison.ts';

export type EditComposition = Readonly<{
  status: 'change' | 'add' | 'remove' | 'no change' | 'unresolved';
  scope: 'file' | 'source unit'; added: number; removed: number;
  rows: readonly NativeEditRow[]; hunks: readonly NativeDocumentHunk[]; reason?: string;
}>;
type Span = {side: 'base' | 'head'; path: string; commit: string; contentHash: string; startLine: number; endLine: number};
export const editCategory = (added: number, removed: number): EditComposition['status'] =>
  added > 0 ? removed > 0 ? 'change' : 'add' : removed > 0 ? 'remove' : 'no change';

/** Presentation only. Canonical identity, presence and call admission never consume this result. */
export const scopedEditComposition = (entity: GraphEntity, facts: FactDocument): EditComposition => {
  const scope = entity.kind === 'file' || entity.data.documentPath ? 'file' : 'source unit';
  const unresolved = (reason: string): EditComposition => ({status: 'unresolved', scope, added: 0, removed: 0, rows: [], hunks: [], reason});
  const witnesses = entity.data.sourceWitnesses as {anchor: Span; sourceText?: string}[] | undefined;
  const occurrences = entity.data.occurrences as {anchor?: Span; side?: string; path?: string}[] | undefined;
  const spans = witnesses?.map(witness => witness.anchor) ?? occurrences?.map(occurrence => occurrence.anchor ?? occurrence as Span) ?? [];
  const path = scope === 'file' ? String(entity.data.path ?? entity.data.documentPath) : spans[0]?.path;
  const file = [...facts.files, ...facts.contextFiles].find(file => file.path === path);
  if (!file) return unresolved('No pinned File scope');
  if (scope === 'source unit' && (!spans.length || spans.some(span =>
    !['base', 'head'].includes(span.side) || span.path !== path || !Number.isInteger(span.startLine) || span.startLine < 1 || span.endLine < span.startLine ||
    !file.sides.some(side => side.side === span.side && side.available && 'contentHash' in side && side.contentHash === span.contentHash && side.commit === span.commit))))
    return unresolved('Source ranges or identities unavailable');
  const before = witnesses?.find(witness => witness.anchor.side === 'base');
  const after = witnesses?.find(witness => witness.anchor.side === 'head');
  const unchangedText = before?.sourceText !== undefined && before.sourceText === after?.sourceText;
  const sides = file.sides.filter(side => side.available && 'contentHash' in side);
  const unchangedBlob = scope === 'file' && sides.length === 2 && sides[0]!.contentHash === sides[1]!.contentHash;
  if (unchangedText || unchangedBlob)
    return {status: 'no change', scope, added: 0, removed: 0, rows: [], hunks: []};
  if (!('patch' in file)) return unresolved('Native patch unavailable');
  let source: readonly NativeDocumentHunk[];
  try { source = nativeDocumentHunks(file); }
  catch { return unresolved('Native patch or source identity unavailable'); }
  if (!source.length) return unresolved('No native textual hunk evidence');
  const inside = (side: 'base' | 'head', line: number | null) => line !== null && (scope === 'file' || spans.some(span => span.side === side && line >= span.startLine && line <= span.endLine));
  const hunks = source.flatMap(hunk => {
    const rows = hunk.rows.map(row => ({...row,
      beforeLine: inside('base', row.beforeLine) ? row.beforeLine : null,
      afterLine: inside('head', row.afterLine) ? row.afterLine : null,
    })).filter(row => row.beforeLine !== null || row.afterLine !== null);
    if (!rows.length) return [];
    const crop = (witness: DocumentWitness | null, side: 'base' | 'head'): DocumentWitness | null => {
      if (!witness) return null;
      const selected = rows.filter(row => (side === 'base' ? row.beforeLine : row.afterLine) !== null);
      if (!selected.length) return null;
      return {...witness, startLine: (side === 'base' ? selected[0]!.beforeLine : selected[0]!.afterLine)!,
        endLine: (side === 'base' ? selected.at(-1)!.beforeLine : selected.at(-1)!.afterLine)!, text: selected.map(row => row.text).join('')};
    };
    return [{...hunk, rows, before: crop(hunk.before, 'base'), after: crop(hunk.after, 'head')}];
  });
  const rows = hunks.flatMap(hunk => hunk.rows);
  const added = rows.filter(row => row.kind === 'add').length;
  const removed = rows.filter(row => row.kind === 'remove').length;
  if (!added && !removed && scope === 'source unit' && !unchangedText) return unresolved('No scoped edits or equal paired source proof');
  return {status: editCategory(added, removed), scope, added, removed, rows, hunks};
};
