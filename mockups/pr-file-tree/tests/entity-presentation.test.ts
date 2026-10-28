import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allEntities, allRelations, comparisonGraph} from '../comparison-graph.ts';
import {readingBands, iconFor, iconPaths} from '../entity-presentation.ts';
import {initialLayout, absoluteBoxes, compareFilePaths} from '../graph-geometry.ts';

test('prepared source subjects classify Files and test graphs without inventing membership', () => {
  const entities = allEntities();
  const before = JSON.stringify(comparisonGraph);
  const bands = readingBands(entities, allRelations());
  for (const id of ['review-file', 'helper-file']) assert.equal(bands.get(id), 0);
  for (const id of ['test-file', 'application-test-file', 'gateway-test-file']) assert.equal(bands.get(id), 0);
  assert.equal(bands.get('change'), 1);
  assert.equal(bands.get('test-change'), 2);
  assert.equal(bands.get('gateway-policy-test-change'), 2);
  assert.equal(bands.get('application-credential-test'), 2);
  assert.equal(entities.find(entity => entity.id === 'application-credential-test')?.nodes, undefined);
  assert.equal(JSON.stringify(comparisonGraph), before);
});

test('measured root bands preserve nesting and reading order independently of edge direction', () => {
  const entities = allEntities();
  const bands = readingBands(entities, allRelations());
  const nodes = entities.map(entity => {
    const parent = entities.find(group => group.nodes?.some(child => child.id === entity.id));
    return {id: entity.id, ...(parent ? {parentId: parent.id} : {}), position: {x: 0, y: 0}, measured: {width: 300, height: 100}};
  });
  const links = allRelations().map(edge => ({id: edge.id, source: edge.from, target: edge.to}));
  const result = initialLayout(nodes, links, 'change', bands);
  const boxes = absoluteBoxes(result);
  for (const left of result.filter(node => !node.parentId)) {
    for (const right of result.filter(node => !node.parentId)) {
      if (bands.get(left.id)! < bands.get(right.id)!) {
        assert.ok(boxes.get(left.id)!.x + boxes.get(left.id)!.width < boxes.get(right.id)!.x);
      }
    }
  }
  for (const child of result.filter(node => node.parentId)) {
    const box = boxes.get(child.id)!;
    const parent = boxes.get(child.parentId!)!;
    assert.ok(box.x >= parent.x && box.x + box.width <= parent.x + parent.width);
    assert.ok(box.y >= parent.y && box.y + box.height <= parent.y + parent.height);
  }
});

test('each current entity has a type icon; test imagery does not assert success', () => {
  for (const entity of allEntities()) assert.ok(iconPaths[iconFor(entity)], entity.kind);
  assert.equal(iconFor(allEntities().find(entity => entity.id === 'test-change')!), 'test-change');
  assert.equal(iconFor(allEntities().find(entity => entity.id === 'application-credential-test')!), 'test');
});

// V30: presentation derives paths from full file metadata, independently of opaque IDs.
test('path arrangement keeps review leftmost and every file in one directory-first lane', async () => {
  const {filePaths} = await import('../entity-presentation.ts');
  const entities = [
    {id: 'z', kind: 'file', data: {path: 'src/z.ts'}},
    {id: 'a', kind: 'file', data: {path: 'README.md'}},
    {id: 'review-file', kind: 'file', data: {path: 'src/b/deep.ts'}},
    {id: 'test', kind: 'file', data: {path: 'tests/a.ts'}},
    {id: 'other', kind: 'file', data: {path: 'src/a.ts'}},
    {id: 'pr', kind: 'review', data: {}},
    {id: 'code', kind: 'change', data: {}},
  ];
  const paths = filePaths(entities);
  assert.deepEqual([...paths.values()].sort(compareFilePaths), [
    'src/b/deep.ts', 'src/a.ts', 'src/z.ts', 'tests/a.ts', 'README.md',
  ]);
  const bands = readingBands(entities, []);
  const nodes = entities.map((entity, index) => ({id: entity.id, position: {x: 7, y: 9},
    measured: {width: index === 2 ? 900 : 200 + index * 10, height: 100}}));
  const before = JSON.stringify(nodes);
  const layout = initialLayout(nodes, [], 'pr', bands, {}, paths);
  const boxes = absoluteBoxes(layout);
  const files = layout.filter(node => paths.has(node.id)).sort((a, b) => a.position.y - b.position.y);
  assert.deepEqual(files.map(node => paths.get(node.id)), [...paths.values()].sort(compareFilePaths));
  for (const node of layout.filter(node => node.id !== 'pr')) {
    assert.ok(boxes.get('pr')!.x + boxes.get('pr')!.width < node.position.x);
  }
  const origin = boxes.get('a')!.x;
  for (const file of files) {
    assert.equal(file.position.x - origin, (paths.get(file.id)!.split('/').length - 1) * 24);
    assert.ok(file.position.x + boxes.get(file.id)!.width < boxes.get('code')!.x);
  }
  assert.equal(boxes.get('pr')!.x, 0);
  assert.equal(JSON.stringify(nodes), before);
  const shuffled = initialLayout([...nodes].reverse(), [], 'pr', bands, {}, paths);
  assert.deepEqual(new Map(shuffled.map(node => [node.id, node.position])), new Map(layout.map(node => [node.id, node.position])));
});


test('actual generated File inventory remains path-ordered through source-unit reflow', async () => {
  const {sourceGraph, allEntities, visibleSourceGraph} = await import('../source-graph.ts');
  const {filePaths} = await import('../entity-presentation.ts');
  const before = JSON.stringify(sourceGraph);
  const paths = filePaths(allEntities());
  const bands = readingBands(allEntities(), []);
  for (const limits of [{}, {'review-file': 20}, {}]) {
    const view = visibleSourceGraph(limits);
    const nodes = view.nodes.map(entity => {
      const parent = view.nodes.find(group => group.nodes?.some(child => child.id === entity.id));
      return {id: entity.id, ...(parent ? {parentId: parent.id} : {}), position: {x: 0, y: 0},
        measured: {width: entity.id === 'review-file' ? 740 : 300, height: 100}};
    });
    const layout = initialLayout(nodes, view.relations.map(edge => ({id: edge.id, source: edge.from, target: edge.to})), 'pr25', bands, {}, paths);
    const files = layout.filter(node => paths.has(node.id)).sort((a, b) => a.position.y - b.position.y);
    assert.equal(files.length, 97);
    assert.deepEqual(files.map(node => paths.get(node.id)), [...paths.values()].sort(compareFilePaths));
    const pr = layout.find(node => node.id === 'pr25')!;
    for (const root of layout.filter(node => !node.parentId && node.id !== 'pr25')) {
      assert.ok(root.position.x > pr.position.x + 300);
    }
  }
  assert.equal(JSON.stringify(sourceGraph), before);
});
