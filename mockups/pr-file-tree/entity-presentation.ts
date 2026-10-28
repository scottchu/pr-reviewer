import type {GraphEntity, GraphRelation} from './comparison-graph.ts';

export type ReadingBand = 0 | 1 | 2 | 3;
const testKinds = new Set(['test', 'assertion', 'source_step', 'absence']);

/** Projection classification uses prepared membership and source relations, never names. */
export const readingBands = (
  entities: readonly GraphEntity[],
  relations: readonly GraphRelation[],
): ReadonlyMap<string, ReadingBand> => {
  const byId = new Map(entities.map(entity => [entity.id, entity]));
  const isTest = (entity: GraphEntity): boolean =>
    testKinds.has(entity.kind) || Boolean(entity.nodes?.some(isTest));
  const testFiles = new Set(relations.filter(relation => {
    const source = byId.get(relation.from);
    return source && isTest(source) &&
      (relation.relation === 'located_in' || relation.relation === 'absence_checked_in');
  }).map(relation => relation.to));
  return new Map(entities.map(entity => [entity.id,
    entity.kind === 'file' ? (testFiles.has(entity.id) ? 3 : 0) : isTest(entity) ? 2 : 1,
  ] as const));
};

export const iconFor = (entity: GraphEntity): string => {
  if (entity.nodes?.some(child => child.kind === 'test')) return 'test-change';
  return entity.kind;
};

/** Decorative stroke paths: no success/checkmark icon implies a passing test. */
export const iconPaths: Readonly<Record<string, readonly string[]>> = {
  file: ['M5 2h9l5 5v15H5z', 'M14 2v6h5', 'M8 12h8M8 16h8'],
  function: ['M15 3h-3c-2 0-3 2-3 4v10c0 2-1 4-3 4H4', 'M5 10h10'],
  header: ['M3 5h18v14H3z', 'M3 10h18M8 10v9'],
  callsite: ['M4 5h7v7', 'M11 5L3 13', 'M15 10h6v11H9v-5'],
  test: ['M9 2h6M10 2v6L4 19q-1 3 2 3h12q3 0 2-3L14 8V2', 'M7 15h10'],
  'test-change': ['M9 2h6M10 2v6L4 19q-1 3 2 3h12q3 0 2-3L14 8V2', 'M9 15l3-3 3 3M12 12v7'],
  change: ['M4 6h16M16 2l4 4-4 4', 'M20 18H4M8 14l-4 4 4 4'],
  assertion: ['M4 3h16v18H4z', 'M8 8h8M8 12h8M8 16h5'],
  source_step: ['M5 3h14v18H5z', 'M9 8l6 4-6 4z'],
  absence: ['M5 3h14v18H5z', 'M8 9l8 8M16 9l-8 8'],
  reason: ['M9 17h6M9 21h6', 'M8 14a7 7 0 1 1 8 0l-1 3H9z'],
  goal: ['M5 22V2l14 3-14 6'],
  behavior: ['M4 12h7M11 12l5-7h5M11 12l5 7h5'],
};
