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
  edges: node.edges?.map(relation) ?? [],
}));
const grouped = new Set(groups.flatMap(group => group.nodes.map(node => node.id)));
export const comparisonGraph = {
  id: source.id, kind: source.kind,
  data: { ...source.data, normalization: mapping, occurrenceInput: source },
  nodes: [...groups, ...[...entities.values()].filter(node => !grouped.has(node.id))],
  edges: source.edges.map(relation),
};
export const allEntities = (): readonly GraphEntity[] => comparisonGraph.nodes.flatMap(node => [node, ...('nodes' in node ? node.nodes ?? [] : [])]);
export const allRelations = (): readonly GraphRelation[] => [...comparisonGraph.edges, ...groups.flatMap(group => group.edges)];
export const isPairedSubject = (id: string): boolean => {
  const entity = entities.get(id);
  return Boolean(entity && ['function', 'test'].includes(entity.kind) && (entity.data.occurrences as readonly unknown[]).length > 1);
};
