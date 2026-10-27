import { derivePreparedCalls } from './derive-comparison-calls.ts';
import mapping from '../../docs/plans/720p/slices/05-explanation-exploration/reviews/logical-entity-mapping-v1.json' with { type: 'json' };
import { minimalGraph as source, allEntities as sourceEntities, type GraphEntity, type GraphRelation } from './minimal-graph.ts';
export type { GraphEntity, GraphRelation } from './minimal-graph.ts';

const sourceNodes = new Map(sourceEntities().map(node => [node.id, node]));
const ids = new Map(mapping.mapping.flatMap(row => row.sourceNodeIds.map(id => [id, row.id] as const)));
const logicalId = (id: string) => ids.get(id) ?? id;
const core = source.data.evidence;
const test = source.data.preparedTest;
const functionOccurrence = (key: keyof typeof core.functions) => {
  const record = core.functions[key];
  return { canonicalId: record.canonicalPacketId, side: record.mappedSnapshotDeclaration.side, declaration: record.mappedSnapshotDeclaration, body: record.canonicalPacketBody };
};
const fileOccurrence = (side: 'base' | 'head', path: string, sourceHash: string) => ({
  side, repository: core.comparison.repository, path, sourceHash,
  commit: side === 'base' ? core.comparison.baseSha : core.comparison.headSha,
});
const occurrences = (id: string): readonly unknown[] => {
  switch (id) {
    case 'request': return [functionOccurrence('requestBefore'), functionOccurrence('requestAfter')];
    case 'refresh': return [functionOccurrence('refreshBefore'), functionOccurrence('refreshAfter')];
    case 'helper': return [functionOccurrence('helperAfter')];
    case 'review-file': return [
      fileOccurrence('base', 'src/application/review.ts', core.functions.requestBefore.mappedSnapshotDeclaration.sourceHash),
      fileOccurrence('head', 'src/application/review.ts', core.functions.requestAfter.mappedSnapshotDeclaration.sourceHash),
    ];
    case 'helper-file': return [fileOccurrence('head', 'src/application/local-access.ts', core.functions.helperAfter.mappedSnapshotDeclaration.sourceHash)];
    case 'test-file': return [
      fileOccurrence('base', test.path, test.versions.base.definition.contentHash),
      fileOccurrence('head', test.path, test.versions.head.definition.contentHash),
    ];
    case 'owner-journey-test': return [test.versions.base.definition, test.versions.head.definition];
    case 'header-value': return [core.evidence.beforeHeaders];
    case 'old-test-step': return test.assertions.base;
    case 'new-test-assertions': return test.assertions.head.filter(value => value.anchor.startLine !== 144);
    default: return [];
  }
};
const entities = new Map<string, GraphEntity>(mapping.mapping.map(row => {
  const records = row.sourceNodeIds.map(id => {
    const record = sourceNodes.get(id);
    if (!record || record.kind !== row.kind) throw new Error(`prepared_identity_mapping_invalid:${id}`);
    return record;
  });
  const first = records[0];
  if (!first) throw new Error('prepared_identity_mapping_empty');
  const { canonicalId: _canonicalId, canonicalCaseId: _caseId, definitionEvidence: _definition, side: _side, commit: _commit, evidence: _evidence, classification: _classification, ...logicalData } = first.data;
  return [row.id, {
    id: row.id, kind: row.kind,
    data: {
      ...logicalData,
      ...(row.comparisonStatus ? { comparisonStatus: row.comparisonStatus } : {}),
      identityBasis: row.basis,
      comparisonBasis: row.basis,
      occurrences: occurrences(row.id),
      sourceRecords: records,
      ...(!row.comparisonStatus ? { comparisonApplicability: 'unassessed or not revision-comparable' } : {}),
    },
  }];
}));
export const derivedCalls = derivePreparedCalls(core, [...entities.values()]);
const addedSites = new Map<string, string>();
for (const call of derivedCalls.filter(value => value.comparisonStatus === 'add')) {
  const fact = call.sourceCalls[0]; if (!fact) throw new Error('callsite_evidence_missing');
  const id = 'callsite:' + fact.canonicalPacketId;
  addedSites.set(call.id, id);
  entities.set(id, { id, kind: 'callsite', data: {
    name: fact.site.sourceText, value: fact.site.sourceText, comparisonStatus: 'add',
    comparisonBasis: call.basis, canonicalCallIds: call.sourceCalls.map(value => value.canonicalPacketId),
    occurrences: [{ side: fact.site.anchor.side, anchor: fact.mappedSnapshotSite, canonicalCallId: fact.canonicalPacketId }],
  } });
}
const derivedCallEdges: GraphRelation[] = derivedCalls.flatMap(call => {
  const site = addedSites.get(call.id);
  const data = { comparisonStatus: call.comparisonStatus, basis: call.basis, sourceCalls: call.sourceCalls };
  return site ? [
    { id: call.id + ':site', from: call.from, to: site, version: call.version, relation: 'contains_call', data },
    { id: call.id, from: site, to: call.to, version: call.version, relation: 'calls', data },
  ] : [{ id: call.id, from: call.from, to: call.to, version: call.version, relation: 'calls', data }];
});
const sourceLocations: GraphRelation[] = [];
const requestDefinitions: GraphRelation[] = [];
for (const entity of entities.values()) {
  if (entity.kind === 'file') continue;
  for (const value of entity.data.occurrences as readonly unknown[]) {
    const occurrence = value as Record<string, unknown>;
    const reference = (occurrence.declaration ?? occurrence.anchor ?? occurrence) as Record<string, unknown>;
    if (typeof reference.path !== 'string' || typeof reference.startLine !== 'number' || typeof reference.endLine !== 'number') continue;
    const homes = [...entities.values()].filter(home => home.kind === 'file' && home.data.path === reference.path);
    if (homes.length !== 1) throw new Error('source_file_home_unavailable');
    const home = homes[0]!; const side = reference.side === 'base' ? 'before' : 'after';
    const edge: GraphRelation = {
      id: entity.id + ':source-location:' + side + ':' + reference.startLine,
      from: entity.id, to: home.id, version: side, relation: 'located_in',
      data: { commit: reference.commit ?? (side === 'before' ? core.comparison.baseSha : core.comparison.headSha),
        range: { startLine: reference.startLine, endLine: reference.endLine }, sourceHash: reference.sourceHash ?? reference.contentHash,
        sourceEvidence: reference },
    };
    if (entity.id === 'request') requestDefinitions.push(edge); else sourceLocations.push(edge);
  }
}
const relation = (edge: GraphRelation): GraphRelation => ({
  ...edge, from: logicalId(edge.from), to: logicalId(edge.to),
  data: {
    ...edge.data,
    sourceEndpoints: { from: edge.from, to: edge.to },
    ...(edge.relation === 'constructs' ? { comparisonStatus: 'remove', statusScope: 'Direct construction at request Before29; helper may still return Bearer' } : {}),
  },
});
const groups = source.nodes.filter(node => node.nodes && node.edges).map(node => ({
  ...node,
  data: { ...node.data, comparisonStatus: 'change', comparisonBasis: 'Exact prepared native source/test comparison' },
  nodes: [...new Set(node.nodes?.map(child => logicalId(child.id)))].map(id => {
    const entity = entities.get(id);
    if (!entity) throw new Error(`logical_member_missing:${id}`);
    return entity;
  }),
  edges: (node.edges ?? []).filter(edge => edge.relation !== 'calls').map(relation),
}));
for (const call of derivedCalls) {
  const site = addedSites.get(call.id); if (!site) continue;
  const owner = groups.find(group => group.nodes.some(node => node.id === call.from));
  if (!owner) throw new Error('callsite_comparison_owner_missing');
  owner.nodes.push(entities.get(site)!);
}
const grouped = new Set(groups.flatMap(group => group.nodes.map(node => node.id)));
export const comparisonGraph = {
  id: source.id, kind: source.kind,
  data: { ...source.data, normalization: mapping, occurrenceInput: source, definitionLocations: requestDefinitions, callDerivation: derivedCalls },
  nodes: [...groups, ...[...entities.values()].filter(node => !grouped.has(node.id))],
  edges: [
    ...source.edges.filter(edge => edge.relation !== 'calls' && edge.relation !== 'located_in').map(relation),
    ...sourceLocations, ...derivedCallEdges,
    { id: 'request:defined_in:review-file', from: 'request', to: 'review-file', version: 'comparison' as const, relation: 'defined_in', data: { definitionOccurrences: requestDefinitions, projection: 'metadata' } },
  ],
};
export const allEntities = (): readonly GraphEntity[] => comparisonGraph.nodes.flatMap(node => [node, ...('nodes' in node ? node.nodes ?? [] : [])]);
export const allRelations = (): readonly GraphRelation[] => [...comparisonGraph.edges, ...groups.flatMap(group => group.edges)];
export const isPairedSubject = (id: string): boolean => {
  const entity = entities.get(id);
  return Boolean(entity && ['function', 'test'].includes(entity.kind) && (entity.data.occurrences as readonly unknown[]).length > 1);
};
