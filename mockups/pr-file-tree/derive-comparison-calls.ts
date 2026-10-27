import type coreInput from '../../docs/plans/720p/slices/05-explanation-exploration/reviews/core-request-graph-v1.json' with { type: 'json' };
import type { GraphEntity } from './minimal-graph.ts';

type Core = typeof coreInput;
type SourceCall = Core['calls'][number];
export type DerivedCall = Readonly<{
  id: string; from: string; to: string; version: 'before' | 'after' | 'comparison';
  comparisonStatus?: 'no change' | 'add'; basis: string; sourceCalls: readonly SourceCall[];
}>;
export const derivePreparedCalls = (core: Core, entities: readonly GraphEntity[]): readonly DerivedCall[] => {
  const logicalIds = new Map<string, string>();
  for (const entity of entities.filter(value => value.kind === 'function')) {
    for (const occurrence of entity.data.occurrences as readonly { canonicalId: string }[]) logicalIds.set(occurrence.canonicalId, entity.id);
  }
  const functionRecords = Object.values(core.functions);
  const buckets = new Map<string, SourceCall[]>();
  for (const call of core.calls) {
    const caller = logicalIds.get(call.callerId); const callee = logicalIds.get(call.calleeId);
    const declaration = functionRecords.find(value => value.canonicalPacketId === call.callerId);
    if (!caller || !callee || !declaration) throw new Error('prepared_call_endpoint_unmapped');
    const relative = [call.site.anchor.start - declaration.canonicalPacketBody.start, call.site.anchor.end - declaration.canonicalPacketBody.start];
    const key = JSON.stringify([caller, callee, call.site.sourceText, relative]);
    const existing = buckets.get(key) ?? []; existing.push(call); buckets.set(key, existing);
  }
  return [...buckets.values()].map(calls => {
    const first = calls[0]; if (!first) throw new Error('empty_call_bucket');
    const from = logicalIds.get(first.callerId)!; const to = logicalIds.get(first.calleeId)!;
    const before = calls.find(value => value.site.anchor.side === 'base');
    const after = calls.find(value => value.site.anchor.side === 'head');
    const knownUnchangedCallers = new Set([core.functions.refreshBefore.canonicalPacketId, core.functions.refreshAfter.canonicalPacketId]);
    const paired = Boolean(before && after && calls.every(value => knownUnchangedCallers.has(value.callerId)) && core.unchangedContext.bodySHA256);
    const introducedTarget = entities.find(value => value.id === to)?.data.comparisonStatus === 'add';
    const added = !before && Boolean(after) && introducedTarget;
    return {
      id: 'derived-call:' + calls.map(value => value.canonicalPacketId).sort().join('|'), from, to,
      version: paired ? 'comparison' : before && !after ? 'before' : 'after',
      ...(paired ? { comparisonStatus: 'no change' as const } : added ? { comparisonStatus: 'add' as const } : {}),
      basis: paired ? 'Both source calls: exact unchanged caller body, same call text and body-relative UTF16 span; not runtime behavior equivalence' : added ? 'Head call to target with supported Before absence; original source-observed certainty retained' : 'Unpaired source evidence is not proof of absence',
      sourceCalls: calls,
    };
  });
};
