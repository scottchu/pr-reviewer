import type { Snapshot, StoryReference } from '../../src/domain/public.ts';
import type { CallAnchor } from './calls.ts';
import comparison from './paths.json' with { type: 'json' };

type SnapshotReference = Extract<StoryReference, { type: 'snapshot_source' }>;
export type JourneySourceMapping = {
  status: 'ready';
  evidence: CallAnchor;
  reference: SnapshotReference;
} | {
  status: 'unavailable';
  evidence: CallAnchor;
  reason: 'comparison_mismatch' | 'source_unprepared' | 'source_hash_mismatch' | 'range_mismatch';
};

const splitsSurrogate = (text: string, offset: number) => {
  const previous = text.charCodeAt(offset - 1);
  const current = text.charCodeAt(offset);
  return previous >= 0xd800 && previous <= 0xdbff
    && current >= 0xdc00 && current <= 0xdfff;
};

// The existing source owner admits/validates Snapshot bytes. This projection
// maps packet-local evidence to that retained owner; it never renames the packet.
export const mapJourneySource = (snapshot: Snapshot, evidence: CallAnchor): JourneySourceMapping => {
  const unavailable = (reason: Extract<JourneySourceMapping, { status: 'unavailable' }>['reason']): JourneySourceMapping => ({
    status: 'unavailable',
    evidence,
    reason,
  });
  if (snapshot.repository !== 'scottchu/pr-reviewer' || snapshot.prNumber !== 25
    || snapshot.baseSha !== comparison.base || snapshot.headSha !== comparison.head) {
    return unavailable('comparison_mismatch');
  }
  const source = snapshot.sources.find(item => item.side === evidence.side && item.path === evidence.path);
  if (!source) {
    return unavailable('source_unprepared');
  }
  if (source.hash !== evidence.contentHash) {
    return unavailable('source_hash_mismatch');
  }
  if (!Number.isInteger(evidence.start) || !Number.isInteger(evidence.end)
    || evidence.start < 0 || evidence.end <= evidence.start || evidence.end > source.content.length
    || splitsSurrogate(source.content, evidence.start) || splitsSurrogate(source.content, evidence.end)) {
    return unavailable('range_mismatch');
  }
  const prefix = source.content.slice(0, evidence.start);
  const selected = source.content.slice(evidence.start, evidence.end);
  const startLine = prefix.split('\n').length;
  const endLine = startLine + selected.replace(/\n$/, '').split('\n').length - 1;
  if (startLine !== evidence.startLine || endLine !== evidence.endLine || endLine > source.lineCount) {
    return unavailable('range_mismatch');
  }
  return {
    status: 'ready',
    evidence,
    reference: {
      type: 'snapshot_source',
      contentHash: source.hash,
      anchor: {
        snapshotId: snapshot.snapshotId,
        side: evidence.side,
        path: evidence.path,
        startLine,
        endLine,
      },
    },
  };
};
