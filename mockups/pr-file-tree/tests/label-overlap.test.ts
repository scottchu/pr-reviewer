import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {readingBands, filePaths, documentPaths, testAssertionFamilies} from '../../../src/review-graph/ui/entity-presentation.ts';
import {omittedStructuralEdge} from '../../../src/review-graph/ui/content.ts';
import type {SourceGraph} from '../../../src/review-graph/domain/types.ts';
import {cardRows} from '../../../src/review-graph/ui/content.ts';
import {initialLayout, absoluteBoxes, curve, port, type LayoutNode, type Box} from '../../../src/review-graph/ui/graph-geometry.ts';
import {projectionRoutes, liveProjectionRoutes} from '../../../src/review-graph/ui/projection-routes.ts';

const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const node = (id: string, parentId?: string): LayoutNode => ({id, ...(parentId ? {parentId} : {}), position: {x: 0, y: 0}, measured: {width: 300, height: 110}});
const ids = Array.from({length: 27}, (_, i) => 'assert-' + i);
const links = ids.flatMap((id, i) => [{id: 'contains-' + i, source: 'test', target: id}, {id: 'location-' + i, source: id, target: 'file'}]);
const sizes = Object.fromEntries(links.map(edge => [edge.id, {width: 480, height: 260}]));
const input = [node('review'), node('group'), node('test', 'group'), ...ids.map(id => node(id, 'group')), node('file')];
const families = new Map([['test', ids]]);
const bands = new Map(input.map(value => [value.id, value.id === 'review' ? -1 : value.id === 'file' ? 3 : 2]));

const check = (nodes: readonly LayoutNode[], measured: typeof sizes) => {
    const routes = projectionRoutes(nodes, nodes, links, measured, {})!;
    const final = liveProjectionRoutes(nodes, links, routes, {}, measured);
    const boxes = absoluteBoxes(nodes), labels: Box[] = [];
    for (const edge of links) {
        const route = final.get(edge.id)!;
        assert.equal(route.placementBlocked, undefined, edge.id);
        const size = measured[edge.id]!;
        const box = {x: route.label.x - size.width / 2, y: route.label.y - size.height / 2, ...size};
        for (const n of nodes.filter(n => !nodes.some(child => child.parentId === n.id))) assert.ok(!overlaps(box, boxes.get(n.id)!), edge.id + ' overlaps ' + n.id);
        for (const prior of labels) assert.ok(!overlaps(box, prior), edge.id + ' overlaps another label');
        const group = boxes.get('group')!;
        if (edge.id.startsWith('contains')) assert.ok(box.x >= group.x && box.y >= group.y && box.x + box.width <= group.x + group.width && box.y + box.height <= group.y + group.height, edge.id);
        else assert.ok(!overlaps(box, group), edge.id + ' crosses group boundary');
        const shape = curve(port(boxes.get(edge.source)!, route.sourceSide), port(boxes.get(edge.target)!, route.targetSide), route.offset);
        assert.deepEqual(shape.at(.5), route.label);
        labels.push(box);
    }
};

test('L1: show exact source once while preserving distinct source text and input bytes', () => {
    const source = 'expect( page.getByRole("button", { name: "Save question" }), ).toBeDisabled()';
    const entity = {id: 'assert', kind: 'assertion', data: {name: source, value: [source, 'expect("a  b").toBe("a b")'], comparisonStatus: 'no change'}};
    const before = JSON.stringify(entity);
    assert.deepEqual(cardRows(entity), {title: source, rows: ['no change', 'expect("a  b").toBe("a b")']});
    assert.equal(JSON.stringify(entity), before);
});

test('L2/L3: dense large-label scene is clear after final group constraints, not only before clamping', () => {
    const nodes = initialLayout(input, links, 'review', bands, {group: 150}, new Map(), new Map(), families, sizes);
    check(nodes, sizes);
});

test('L2/L4: resized labels and disclosed/manual child heights reserve new capacity before root placement', () => {
    const grown = Object.fromEntries(links.map(edge => [edge.id, {width: 620, height: 380}]));
    const nodes = initialLayout(input.map(n => n.id === 'test' ? {...n, measured: {width: 300, height: 600}} : n), links,
        'review', bands, {group: 190}, new Map(), new Map(), families, grown, {'assert-0': {x: 60, y: 900}});
    assert.deepEqual(nodes.find(n => n.id === 'assert-0')!.position, {x: 60, y: 900});
    check(nodes, grown);
});

test('L2/L3: actual pinned topology has no final label/card or label/label overlap under declared large measurements', () => {
    const graph = JSON.parse(readFileSync(new URL('../generated-source-graph.json', import.meta.url), 'utf8')) as SourceGraph;
    const before = JSON.stringify(graph);
    const view = createGraphSession(graph).view;
    const relations = view.relations.filter(edge => !omittedStructuralEdge(edge, view.entities));
    const edges = relations.map(edge => ({id: edge.id, source: edge.from, target: edge.to}));
    // Explicit stress measurements, not a claim of live browser measurement.
    const measured = Object.fromEntries(edges.map(edge => [edge.id, {width: 420, height: 230}]));
    const input = view.nodes.map(entity => ({...node(entity.id),
        ...(view.nodes.find(group => group.nodes?.some(child => child.id === entity.id)) ?
            {parentId: view.nodes.find(group => group.nodes?.some(child => child.id === entity.id))!.id} : {})}));
    const nodes = initialLayout(input, edges, 'pr25', readingBands(view.entities, graph.relations), {},
        filePaths(view.entities), documentPaths(view.entities), testAssertionFamilies(view.entities, graph.relations), measured);
    const placements = projectionRoutes(nodes, nodes, edges, measured, {})!;
    const final = liveProjectionRoutes(nodes, edges, placements, {}, measured);
    const boxes = absoluteBoxes(nodes), labels: Box[] = [];
    for (const edge of edges) {
        const route = final.get(edge.id)!;
        assert.equal(route.placementBlocked, undefined, edge.id);
        const size = measured[edge.id]!;
        const label = {x: route.label.x - size.width / 2, y: route.label.y - size.height / 2, ...size};
        for (const leaf of nodes.filter(n => !nodes.some(child => child.parentId === n.id))) {
            assert.ok(!overlaps(label, boxes.get(leaf.id)!), edge.id + ' overlaps ' + leaf.id);
        }
        for (const prior of labels) assert.ok(!overlaps(label, prior), edge.id + ' overlaps prior label');
        labels.push(label);
    }
    assert.equal(JSON.stringify(graph), before);
});

test('L4: impossible fixed internal space is explicit and never deletes the relation', () => {
    const nodes: LayoutNode[] = [{id: 'group', position: {x: 0, y: 0}, style: {width: 300, height: 200}},
        {...node('source', 'group'), position: {x: 0, y: 80}}, {...node('target', 'group'), position: {x: 0, y: 90}}];
    const edges = [{id: 'relation', source: 'source', target: 'target'}];
    const routes = projectionRoutes(nodes, nodes, edges, {relation: {width: 280, height: 160}}, {})!;
    assert.equal(routes.size, 1);
    assert.equal(routes.get('relation')!.placementBlocked, true);
});
