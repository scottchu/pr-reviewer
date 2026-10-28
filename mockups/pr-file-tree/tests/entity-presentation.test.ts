import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allEntities, allRelations, comparisonGraph} from '../comparison-graph.ts';
import {readingBands, iconFor, iconPaths} from '../entity-presentation.ts';
import {initialLayout, absoluteBoxes} from '../graph-geometry.ts';

test('prepared source subjects classify Files and test graphs without inventing membership', () => {
  const entities = allEntities();
  const before = JSON.stringify(comparisonGraph);
  const bands = readingBands(entities, allRelations());
  for (const id of ['review-file', 'helper-file']) assert.equal(bands.get(id), 0);
  for (const id of ['test-file', 'application-test-file', 'gateway-test-file']) assert.equal(bands.get(id), 3);
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
