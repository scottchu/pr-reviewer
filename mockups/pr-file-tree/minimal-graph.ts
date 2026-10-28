import preparedTest from '../../docs/plans/720p/slices/05-explanation-exploration/reviews/request-test-evidence-v1.json' with { type: 'json' };
import core from '../../docs/plans/720p/slices/05-explanation-exploration/reviews/core-request-graph-v1.json' with { type: 'json' };

import type {GraphEntity,GraphRelation} from '../../src/review-graph/domain/types.ts';
export type {GraphEntity,GraphRelation} from '../../src/review-graph/domain/types.ts';

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


const requestBefore = functionEntity('request-before', 'requestBefore');
const requestAfter = functionEntity('request-after', 'requestAfter');
const bearer = entity('bearer-before', 'header', {
  value: 'Authorization: `Bearer ${captured}`', evidence: 'beforeHeaders', basis: 'observed Before29 expression',
});
const codeEdges = [
  edge('change', 'request-before', 'before', 'before', { evidence: 'beforeHunk', range: { startLine: 26, endLine: 32 }, scope: 'Native hunk inside declaration; not the whole function' }),
  edge('change', 'request-after', 'after', 'after', { evidence: 'afterHunk', range: { startLine: 27, endLine: 33 }, scope: 'Native hunk inside declaration; not the whole function' }),
  edge('request-before', 'bearer-before', 'before', 'constructs', { evidence: 'beforeHeaders' }),
  edge('request-after', 'helper-after', 'after', 'calls', { canonicalId: helperCall.canonicalPacketId, evidence: 'afterHeaders', basis: helperCall.basis }),
];
export const codeChange: GraphEntity = {
  id: 'change', kind: 'change',
  data: { name: 'request() change', nativeId: core.change.nativeProjectionHunkId, graph: 'Identity-bearing comparison; containment is not file ownership' },
  nodes: [requestBefore, requestAfter, bearer], edges: codeEdges,
};
const testDefinition = (side: 'base' | 'head'): GraphEntity => entity(`test-${side}`, 'test', {
  name: preparedTest.name,
  classification: 'modified',
  side: side === 'base' ? 'before' : 'after',
  canonicalCaseId: preparedTest.id,
  definitionEvidence: `preparedTest.versions.${side}.definition`,
  execution: 'not run in this review',
});
const testEdges = [
  edge('test-change', 'test-base', 'before', 'before', { evidence: 'Original test definition Before146–244' }),
  edge('test-change', 'test-head', 'after', 'after', { evidence: 'Original test definition After140–242' }),
  edge('test-base', 'old-test-step', 'before', 'contains', { evidence: 'Before150', classification: 'UI source step, not an assertion' }),
  edge('test-head', 'new-test-assertions', 'after', 'contains', { evidence: 'After146,147,241', classification: 'Source-declared assertions; not execution results' }),
];
export const testChange: GraphEntity = {
  id: 'test-change', kind: 'change',
  data: { name: 'Modified test comparison', canonicalCaseId: preparedTest.id, nativeHunks: preparedTest.nativeHunks.map(hunk => hunk.id), execution: 'not run' },
  nodes: [
    testDefinition('base'), testDefinition('head'),
    entity('old-test-step', 'source_step', { name: 'Before: enter local access token', value: preparedTest.assertions.base[0]?.sourceText, evidence: 'Before150; fill action, not an assertion' }),
    entity('new-test-assertions', 'assertion', { name: 'After: automatic owner opening; requests omit Authorization', value: preparedTest.assertions.head.filter(value => value.anchor.startLine !== 144).map(value => value.sourceText), observer: 'After144 records API request headers', execution: 'not run' }),
  ], edges: testEdges,
};
const file = (id: string, path: string, side: 'base' | 'head') => entity(id, 'file', {
  repository: core.comparison.repository, path, side, commit: side === 'base' ? core.comparison.baseSha : core.comparison.headSha,
});
const testLocation = (side: 'base' | 'head') => {
  const anchor = preparedTest.versions[side].definition;
  return edge(`test-${side}`, `test-file-${side}`, side === 'base' ? 'before' : 'after', 'located_in', {
    commit: anchor.commit, range: { startLine: anchor.startLine, endLine: anchor.endLine }, sourceHash: anchor.contentHash,
  });
};
export const minimalGraph = {
  id: 'pr25-request-header-comparison', kind: 'graph',
  data: { name: 'Request headers and relevant changed test', comparison: core.comparison, scope: 'One prepared code Change and one actual modified test; not whole-PR coverage. Tests not executed.', evidence: core, preparedTest },
  nodes: [
    codeChange, testChange,
    functionEntity('helper-after', 'helperAfter'), functionEntity('refresh-after', 'refreshAfter'),
    entity('reason', 'reason', { name: 'Always constructing Bearer cannot express an owner request without Authorization', basis: 'prepared source-derived inference', evidence: ['beforeHeaders', 'helperBranch'] }),
    entity('goal', 'goal', { name: 'Open the review without manual token entry', basis: 'intended product outcome, not measured achievement', evidence: 'Pinned runtime.md After22–26; single-user-access plan After11–13' }),
    file('review-file-base', 'src/application/review.ts', 'base'), file('review-file-head', 'src/application/review.ts', 'head'),
    file('helper-file', 'src/application/local-access.ts', 'head'),
    file('test-file-base', preparedTest.path, 'base'), file('test-file-head', preparedTest.path, 'head'),
  ],
  edges: [
    edge('refresh-after', 'request-after', 'after', 'calls', { canonicalId: headRefreshCall.canonicalPacketId, evidence: 'refreshCall', context: 'Body unchanged; downstream behavior not proven unchanged' }),
    edge('change', 'reason', 'comparison', 'motivated_by', { basis: 'prepared inference, not author testimony' }),
    edge('change', 'goal', 'comparison', 'intended_to_achieve', { basis: 'prepared requirement reference, not outcome evidence' }),
    edge('reason', 'goal', 'comparison', 'impedes', { basis: 'Removing obstacle does not prove goal achieved' }),
    location('request-before', 'requestBefore', 'review-file-base'), location('request-after', 'requestAfter', 'review-file-head'),
    location('helper-after', 'helperAfter', 'helper-file'),
    testLocation('base'), testLocation('head'),
    edge('test-change', 'change', 'after', 'verifies', { basis: 'Source-declared indirect React user-journey relevance', chain: ['UI opening', 'workspace.open', 'review.login', 'refresh', 'request', 'accessHeaders'], assertions: 'After146,147,241; observer144', limit: preparedTest.limit, execution: 'not run' }),
    edge('test-change', 'change', 'comparison', 'motivated_by', { basis: 'prepared inference from the actual test comparison, not author edit causation' }),
  ],
} as const;

export const allEntities = (): readonly GraphEntity[] => minimalGraph.nodes.flatMap(node => [node, ...(node.nodes ?? [])]);
export const allRelations = (): readonly GraphRelation[] => [...minimalGraph.edges, ...minimalGraph.nodes.flatMap(node => node.edges ?? [])];
export const positions = (_narrow: boolean): Readonly<Record<string, { x: number; y: number }>> => ({
  change: { x: 0, y: 0 }, 'request-before': { x: 50, y: 650 }, 'request-after': { x: 950, y: 650 }, 'bearer-before': { x: 50, y: 1200 },
  'helper-after': { x: 1750, y: 1200 }, 'refresh-after': { x: 1750, y: 0 },
  'review-file-base': { x: -900, y: 650 }, 'review-file-head': { x: 2500, y: 650 }, 'helper-file': { x: 2700, y: 1200 },
  reason: { x: 0, y: 2600 }, goal: { x: 1750, y: 2800 },
  'test-change': { x: 0, y: 3350 }, 'test-base': { x: 50, y: 650 }, 'test-head': { x: 950, y: 650 },
  'old-test-step': { x: 50, y: 1250 }, 'new-test-assertions': { x: 950, y: 1250 },
  'test-file-base': { x: -900, y: 4000 }, 'test-file-head': { x: 2500, y: 4000 },
});
