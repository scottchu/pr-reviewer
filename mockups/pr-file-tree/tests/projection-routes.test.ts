import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectionRoutes, liveProjectionRoutes } from '../projection-routes.ts';
import { visibleSourceGraph } from '../source-graph.ts';

test('real review-file expansion defers routes while the node effect still holds the previous projection', () => {
    const initial = visibleSourceGraph({});
    const expanded = visibleSourceGraph({ 'review-file': 20 });
    const nodes = initial.nodes.map(node => ({ id: node.id, position: { x: 0, y: 0 } }));
    const links = expanded.relations.map(edge => ({ id: edge.id, source: edge.from, target: edge.to }));
    assert.ok(expanded.nodes.length > initial.nodes.length);
    assert.ok(links.some(edge => !nodes.some(node => node.id === edge.source) || !nodes.some(node => node.id === edge.target)));
    assert.equal(projectionRoutes(nodes, expanded.nodes, links, {}, {}), null);
});

test('settled membership restores all routes; replacement and collapse defer stale geometry', () => {
    const first = { id: 'file', position: { x: 0, y: 0 } };
    const second = { id: 'unit', position: { x: 500, y: 0 } };
    const link = { id: 'location', source: 'unit', target: 'file' };
    const nodes = [first, second];
    const before = JSON.stringify(nodes);
    assert.equal(projectionRoutes(nodes, nodes, [link], {}, {})?.size, 1);
    assert.equal(projectionRoutes(nodes, [first], [], {}, {}), null);
    assert.equal(projectionRoutes(nodes, [first, { id: 'replacement' }], [link], {}, {}), null);
    assert.equal(projectionRoutes([first], [first], [], {}, {})?.size, 0);
    assert.equal(JSON.stringify(nodes), before);
});


test('live gesture routes follow endpoints and manual bends without repeating placement search', () => {
    const nodes = [{ id: 'a', position: { x: 0, y: 0 } }, { id: 'b', position: { x: 800, y: 0 } }];
    const links = [{ id: 'call', source: 'a', target: 'b' }];
    const placements = projectionRoutes(nodes, nodes, links, {}, {})!;
    assert.equal(liveProjectionRoutes(nodes, links, placements, {}).get('call'), placements.get('call'));
    const moved = [nodes[0]!, { ...nodes[1]!, position: { x: 900, y: 100 } }];
    const route = liveProjectionRoutes(moved, links, placements, { call: { x: 25, y: 30 } }).get('call')!;
    assert.deepEqual(route.offset, { x: 25, y: 30 });
    assert.notDeepEqual(route.label, placements.get('call')!.label);
    assert.deepEqual(placements.get('call')!.offset, { x: 0, y: 0 });
});
