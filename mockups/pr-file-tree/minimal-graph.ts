import core from '../../docs/plans/720p/slices/05-explanation-exploration/reviews/core-request-graph-v1.json' with { type: 'json' };

export type GraphEntity = Readonly<{
  id: string;
  kind: string;
  data: Readonly<Record<string, unknown>>;
}>;
export type GraphRelation = Readonly<{
  id: string;
  from: string;
  to: string;
  version: 'before' | 'after' | 'comparison';
  relation: string;
  data: Readonly<Record<string, unknown>>;
}>;

const entity = (id: string, kind: string, data: Record<string, unknown>): GraphEntity => ({ id, kind, data });
const edge = (
  from: string,
  to: string,
  version: GraphRelation['version'],
  relation: string,
  data: Record<string, unknown> = {},
): GraphRelation => ({ id: `${from}:${relation}:${to}`, from, to, version, relation, data });

const functionEntity = (id: string, key: keyof typeof core.functions) => {
  const value = core.functions[key];
  return entity(id, 'function', {
    name: `${value.name}()`,
    canonicalId: value.canonicalPacketId,
    evidence: key,
  });
};
const location = (id: string, key: keyof typeof core.functions, file: string) => {
  const anchor = core.functions[key].mappedSnapshotDeclaration;
  return edge(id, file, anchor.side === 'base' ? 'before' : 'after', 'located_in', {
    commit: anchor.side === 'base' ? core.comparison.baseSha : core.comparison.headSha,
    range: { startLine: anchor.startLine, endLine: anchor.endLine },
    sourceHash: anchor.sourceHash,
  });
};
const headRefreshCall = core.calls.find(call => call.callerId === core.functions.refreshAfter.canonicalPacketId);
const helperCall = core.calls.find(call => call.calleeId === core.functions.helperAfter.canonicalPacketId);
if (!headRefreshCall || !helperCall) throw new Error('core_call_evidence_missing');

export const minimalGraph = {
  id: 'pr25-request-header-comparison',
  kind: 'graph',
  data: {
    name: 'Request headers',
    comparison: core.comparison,
    scope: 'One prepared native Change; not the whole PR. Tests are not prepared.',
    evidence: core,
  },
  nodes: [
    entity('change', 'change', {
      name: 'Request headers',
      nativeId: core.change.nativeProjectionHunkId,
      beforeRange: '26–32',
      afterRange: '27–33',
    }),
    functionEntity('request-before', 'requestBefore'),
    entity('bearer-before', 'header', {
      value: 'Authorization: `Bearer ${captured}`',
      evidence: 'beforeHeaders',
      basis: 'observed source expression, Before29',
    }),
    functionEntity('request-after', 'requestAfter'),
    functionEntity('helper-after', 'helperAfter'),
    functionEntity('refresh-after', 'refreshAfter'),
    entity('reason', 'reason', {
      name: 'Always constructing Bearer cannot express an owner request without Authorization',
      basis: 'prepared source-derived inference',
      evidence: ['beforeHeaders', 'helperBranch'],
    }),
    entity('goal', 'goal', {
      name: 'Open the review without manual token entry',
      basis: 'intended product outcome; not measured achievement',
      evidence: 'Pinned PR25 runtime.md After22–26 and single-user-access plan After11–13',
    }),
    entity('review-file', 'file', { repository: core.comparison.repository, path: 'src/application/review.ts' }),
    entity('helper-file', 'file', { repository: core.comparison.repository, path: 'src/application/local-access.ts' }),
  ],
  edges: [
    edge('change', 'request-before', 'before', 'before', { evidence: 'beforeHunk', scope: 'Native hunk inside the function, not a whole-function Change' }),
    edge('change', 'request-after', 'after', 'after', { evidence: 'afterHunk', scope: 'Native hunk inside the function, not a whole-function Change' }),
    edge('request-before', 'bearer-before', 'before', 'constructs', { evidence: 'beforeHeaders' }),
    edge('request-after', 'helper-after', 'after', 'calls', { canonicalId: helperCall.canonicalPacketId, evidence: 'afterHeaders', basis: helperCall.basis }),
    edge('refresh-after', 'request-after', 'after', 'calls', { canonicalId: headRefreshCall.canonicalPacketId, evidence: 'refreshCall', context: 'Body unchanged; downstream behavior not proven unchanged' }),
    edge('change', 'reason', 'comparison', 'motivated_by', { basis: 'prepared inference; not author testimony' }),
    edge('change', 'goal', 'comparison', 'intended_to_achieve', { basis: 'prepared requirement reference; not outcome evidence' }),
    edge('reason', 'goal', 'comparison', 'impedes', { basis: 'prepared inference; removal does not prove goal achieved' }),
    location('request-before', 'requestBefore', 'review-file'),
    location('request-after', 'requestAfter', 'review-file'),
    location('refresh-after', 'refreshAfter', 'review-file'),
    location('helper-after', 'helperAfter', 'helper-file'),
  ],
} as const;

export const positions = (narrow: boolean): Readonly<Record<string, { x: number; y: number }>> => narrow
  ? {
    change: { x: 20, y: 0 },
    'request-before': { x: 20, y: 430 },
    'bearer-before': { x: 20, y: 880 },
    'request-after': { x: 440, y: 430 },
    'helper-after': { x: 440, y: 880 },
    'refresh-after': { x: 440, y: 0 },
    reason: { x: 20, y: 1420 },
    goal: { x: 440, y: 1420 },
    'review-file': { x: 20, y: 1960 },
    'helper-file': { x: 440, y: 1960 },
  }
  : {
    change: { x: 430, y: 0 },
    'request-before': { x: 10, y: 440 },
    'bearer-before': { x: 10, y: 930 },
    'request-after': { x: 850, y: 440 },
    'helper-after': { x: 850, y: 930 },
    'refresh-after': { x: 850, y: 0 },
    reason: { x: 10, y: 1450 },
    goal: { x: 850, y: 1450 },
    'review-file': { x: 10, y: 2040 },
    'helper-file': { x: 850, y: 2040 },
  };
