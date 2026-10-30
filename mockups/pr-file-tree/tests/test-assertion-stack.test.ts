import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialLayout, absoluteBoxes, dimensions, groupInterior, type LayoutNode} from '../../../src/review-graph/ui/graph-geometry.ts';
import {testAssertionFamilies} from '../../../src/review-graph/ui/entity-presentation.ts';
import {collectEntities} from '../../../src/review-graph/domain/validation.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import type {GraphEntity, GraphRelation, SourceGraph} from '../../../src/review-graph/domain/types.ts';

const node = (id: string, parentId?: string, height = 90): LayoutNode => ({id, ...(parentId ? {parentId} : {}), position: {x: 0, y: 0}, measured: {width: 300, height}});
const family = new Map([['test', ['a1', 'a2']]]);
const links = [{id: 'one', source: 'test', target: 'a1'}, {id: 'two', source: 'test', target: 'a2'}];
const arrange = (nodes: readonly LayoutNode[], headers: Readonly<Record<string, number>> = {}) =>
    initialLayout(nodes, links, 'review', undefined, headers, new Map(), new Map(), family);

test('S1: only typed Test contains Assertion facts create ordered layout families', () => {
    const entities: GraphEntity[] = [{id: 'test', kind: 'test', data: {}}, {id: 'a1', kind: 'assertion', data: {}},
        {id: 'a2', kind: 'assertion', data: {}}, {id: 'code', kind: 'function', data: {}}];
    const relation = (from: string, to: string, relation: string, id: string): GraphRelation => ({id, from, to, relation, version: 'comparison', data: {}});
    const edges = [relation('test', 'a2', 'contains', 'second'), relation('test', 'a1', 'contains', 'first'),
        relation('test', 'code', 'contains', 'other-kind'), relation('code', 'a1', 'calls', 'not-ownership')];
    assert.deepEqual([...testAssertionFamilies(entities, edges)], [['test', ['a2', 'a1']]]);
});

test('S2/S3: grouped Test precedes an indented single Assertion column within measured bounds', () => {
    const input = [node('group'), node('test', 'group', 230), node('a1', 'group', 160), node('a2', 'group', 70)];
    const before = JSON.stringify(input);
    const result = arrange(input, {group: 170});
    assert.equal(JSON.stringify(input), before);
    const byId = new Map(result.map(value => [value.id, value]));
    const t = byId.get('test')!, a = byId.get('a1')!, b = byId.get('a2')!;
    assert.equal(t.position.y, 170);
    assert.equal(a.position.x, t.position.x + 24);
    assert.equal(b.position.x, a.position.x);
    assert.ok(a.position.y >= t.position.y + dimensions(t).height);
    assert.ok(b.position.y >= a.position.y + dimensions(a).height);
    const boxes = absoluteBoxes(result), group = boxes.get('group')!;
    for (const id of ['test', 'a1', 'a2']) {
        const box = boxes.get(id)!;
        assert.ok(box.x >= group.x + groupInterior.padding);
        assert.ok(box.x + box.width <= group.x + group.width - groupInterior.padding);
        assert.ok(box.y + box.height <= group.y + group.height - groupInterior.padding);
    }
    const reflow = arrange(input.map(value => value.id === 'test' ? {...value, measured: {width: 300, height: 500}} : value), {group: 170});
    assert.ok(reflow.find(value => value.id === 'a1')!.position.y > a.position.y);
});

test('S2: unchanged root Test and Assertions stack without changing semantic parentage or overlapping next roots', () => {
    const input = [node('a2'), node('test', undefined, 180), node('next'), node('a1', undefined, 220)];
    const bands = new Map(input.map(value => [value.id, 2]));
    const result = initialLayout(input, links, 'test', bands, {}, new Map(), new Map(), family);
    const boxes = absoluteBoxes(result), t = boxes.get('test')!, a = boxes.get('a1')!, b = boxes.get('a2')!;
    assert.equal(a.x, t.x + 24);
    assert.equal(b.x, a.x);
    assert.ok(a.y >= t.y + t.height);
    assert.ok(b.y >= a.y + a.height);
    const next = boxes.get('next')!;
    assert.ok(next.y + next.height <= t.y || next.y >= b.y + b.height);
    assert.ok(result.every(value => value.parentId === undefined));
});

test('S4: mixed/ambiguous ownership does not force unrelated graph nodes into a stack', () => {
    const input = [node('group'), node('test', 'group'), node('a1', 'group'), node('a2', 'group'), node('code', 'group')];
    assert.deepEqual(arrange(input), initialLayout(input, links, 'review'));
    const ambiguous = new Map([['test', ['a1']], ['other-test', ['a1']]]);
    const roots = [node('test'), node('other-test'), node('a1')];
    assert.deepEqual(initialLayout(roots, links, 'review', undefined, {}, new Map(), new Map(), ambiguous), initialLayout(roots, links, 'review'));
    const hiddenOwner = roots.filter(value => value.id !== 'other-test');
    assert.deepEqual(initialLayout(hiddenOwner, links, 'review', undefined, {}, new Map(), new Map(), ambiguous), initialLayout(hiddenOwner, links, 'review'));
});

test('S2/S4: pinned changed and unchanged Tests use the same canonical membership and vertical order', () => {
    const graph = JSON.parse(readFileSync(new URL('../generated-source-graph.json', import.meta.url), 'utf8')) as SourceGraph;
    const before = JSON.stringify(graph);
    const view = createGraphSession(graph).view;
    const families = testAssertionFamilies(view.entities, graph.relations);
    const nodes = view.nodes.map(entity => ({...node(entity.id),
        ...(view.nodes.find(group => group.nodes?.some(child => child.id === entity.id)) ?
            {parentId: view.nodes.find(group => group.nodes?.some(child => child.id === entity.id))!.id} : {})}));
    const result = initialLayout(nodes, view.relations.map(edge => ({id: edge.id, source: edge.from, target: edge.to})),
        'pr25', undefined, {}, new Map(), new Map(), families);
    const boxes = absoluteBoxes(result);
    for (const entity of collectEntities(graph.entities).filter(entity => entity.kind === 'test' && boxes.has(entity.id))) {
        const members = (families.get(entity.id) ?? []).filter(id => boxes.has(id));
        if (!members.length) continue;
        let prior = boxes.get(entity.id)!;
        const origin = prior.x;
        for (const id of members) {
            const box = boxes.get(id)!;
            assert.equal(box.x, origin + 24, entity.id);
            assert.ok(box.y >= prior.y + prior.height, entity.id);
            prior = box;
        }
    }
    assert.equal(JSON.stringify(graph), before);
});
