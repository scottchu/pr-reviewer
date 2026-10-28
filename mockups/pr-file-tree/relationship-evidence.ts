import type {GraphEntity, GraphRelation} from './minimal-graph.ts';
const record = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : undefined;
const list = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === 'string' ? value : '';

/** Known evidence adapters feed one provenance format; absent fields are never invented. */
export const relationshipProvenance = (edge: GraphRelation, entities: readonly GraphEntity[]): readonly string[] => {
  const output: string[] = [];
  const append = (value: unknown, pathFallback = '', sideFallback = ''): void => {
    if (Array.isArray(value)) { for (const item of value) append(item, pathFallback, sideFallback); return; }
    const source = record(value);
    if (!source) return;
    if (source.anchor || source.declaration) { append(source.anchor ?? source.declaration, pathFallback, sideFallback); return; }
    const path = text(source.path) || pathFallback;
    if (source.sides) { for (const side of list(source.sides)) append(side, path, sideFallback); return; }
    const side = text(source.side) || sideFallback;
    const file = entities.find(entity=>entity.kind==='file'&&entity.data.path===path);
    const pinnedSide = list(file?.data.sourceEvidence).map(record).find(item=>item?.side===side);
    const commit = text(source.commit) || text(pinnedSide?.commit);
    const range = record(source.range);
    const start = source.startLine ?? range?.startLine;
    const end = source.endLine ?? range?.endLine;
    if (!path && !commit) return;
    const temporal = side === 'base' || side === 'before' ? 'Before' : side === 'head' || side === 'after' ? 'After' : 'Witness';
    const lines = Number.isInteger(start) && Number(start)>0 && Number.isInteger(end) && Number(end)>=Number(start)
      ? 'L' + start + (start===end ? '' : '–' + end) : 'line range unavailable';
    output.push(temporal + ' ' + (commit ? commit.slice(0,7) : 'commit unavailable') + ' · ' + (path || 'path unavailable') + ' · ' +
      (source.available===false ? 'absent in pinned tree' : lines));
  };
  const appendRelation = (relation: GraphRelation): void => {
    const targetFile = entities.find(entity=>entity.id===relation.to&&entity.kind==='file');
    const path = text(relation.data.sourcePath) || text(targetFile?.data.path);
    const side = relation.version==='before'?'base':relation.version==='after'?'head':'';
    append(relation.data.sourceEvidence,path,side);
    if (relation.data.commit || relation.data.range) append(relation.data,path,side);
    for (const call of list(relation.data.sourceCalls)) {
      const row = record(call), site = record(row?.site);
      append(site?.anchor ?? row?.mappedSnapshotSite,path,side);
    }
  };
  appendRelation(edge);
  for (const witness of list(edge.data.witnesses)) {
    const row = record(witness);
    if (row && record(row.data)) appendRelation(row as unknown as GraphRelation);
  }
  const projection = record(edge.data.projectionEvidence);
  for (const location of list(projection?.locations)) {
    const row = record(location);
    if (row && record(row.data)) appendRelation(row as unknown as GraphRelation);
  }
  // Attributed interpretation edges may cite prepared source references on their claims.
  if (['motivated_by','intended_to_achieve','impedes','related_policy'].includes(edge.relation)) {
    for (const entity of entities.filter(entity=>entity.id===edge.from||entity.id===edge.to)) append(entity.data.sourceRefs);
  }
  return output.length ? [...new Set(output)] : ['Source provenance unavailable'];
};
