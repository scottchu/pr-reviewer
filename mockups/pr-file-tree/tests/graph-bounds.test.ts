import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialLayout, curve, type LayoutNode } from '../graph-geometry.ts';
import { childContentBounds, clearExternalLabel, constrainInternalLabel } from '../graph-bounds.ts';
import { movedNodePosition } from '../gesture-policy.ts';
import { visibleSourceGraph } from '../source-graph.ts';

test('actual generated helper stays within parent interior and measured heading clearance', () => {
    const view = visibleSourceGraph({});
    const nodes: LayoutNode[] = view.nodes.map(entity => {
        const parent = view.nodes.find(group => group.nodes?.some(child => child.id === entity.id));
        return { id: entity.id, position: { x: 0, y: 0 }, ...(parent ? { parentId: parent.id } : {}) };
    });
    const links = view.relations.map(edge => ({ id: edge.id, source: edge.from, target: edge.to }));
    const group = nodes.find(node => node.id === 'helper')!.parentId!;
    const headers = { [group]: 124 };
    const layout = initialLayout(nodes, links, 'review-file', undefined, headers);
    const helper = layout.find(node => node.id === 'helper')!;
    const parent = layout.find(node => node.id === group)!;
    assert.ok(helper.position.y >= 124);
    const bounds = childContentBounds(layout, 'helper', headers)!;
    assert.deepEqual(bounds.min, { x: 20, y: 124 });
    for (const zoom of [0.25, 0.7, 1, 2]) {
        assert.deepEqual(movedNodePosition(layout, 'helper', { x: -10000 / zoom, y: -10000 / zoom }, headers), bounds.min);
        const end = movedNodePosition(layout, 'helper', { x: 10000 / zoom, y: 10000 / zoom }, headers)!;
        assert.equal(end.x + 300, Number(parent.style!.width) - 20);
        assert.equal(end.y + 90, Number(parent.style!.height) - 20);
    }
    assert.equal(helper.position.y, 124);
});

test('external labels remain outside groups without being treated as children or detaching from the curve', () => {
    const group = { x: 100, y: 200, width: 600, height: 400 };
    const size = { width: 160, height: 64 };
    const requested = { x: 100, y: 350 };
    const corrected = clearExternalLabel(requested, size, [group]);
    assert.ok(corrected.x + size.width / 2 <= group.x - 8);
    assert.deepEqual(clearExternalLabel({ x: -100, y: 350 }, size, [group]), { x: -100, y: 350 });
    const start = { x: 250, y: 300 }, end = { x: 900, y: 800 };
    const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const attached = curve(start, end, { x: corrected.x - midpoint.x, y: corrected.y - midpoint.y });
    assert.deepEqual(attached.at(0.5), corrected);
    assert.deepEqual(attached.at(0), start);
    assert.deepEqual(attached.at(1), end);
});

test('multiple group boundaries stay clear and internal labels stay inside their own group', () => {
    const groups = [{ x: 0, y: 0, width: 600, height: 400 }, { x: 650, y: 0, width: 600, height: 400 }];
    const size = { width: 160, height: 64 };
    const corrected = clearExternalLabel({ x: 625, y: 200 }, size, groups);
    assert.ok(groups.every(group => corrected.x + 80 <= group.x - 8 || corrected.x - 80 >= group.x + group.width + 8 || corrected.y + 32 <= group.y - 8 || corrected.y - 32 >= group.y + group.height + 8));
    assert.deepEqual(constrainInternalLabel({ x: -50, y: -50 }, size, groups[0]!), { x: 88, y: 40 });
});
