import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {initialLayout, absoluteBoxes, port, curve} from '../../../src/review-graph/ui/graph-geometry.ts';
import {projectionRoutes, liveProjectionRoutes} from '../../../src/review-graph/ui/projection-routes.ts';
import {readingBands, filePaths, documentPaths, testAssertionFamilies} from '../../../src/review-graph/ui/entity-presentation.ts';

const target = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';

test('every Test owns one directed presentation connection per real edit side across disclosure/filter/pagination', () => {
    const initial = createGraphSession(sourceGraph);
    const sessions = [initial, initial.inspect(target, true), initial.setChangesOnly(true), initial.expand('application-test-file', false), initial.expand('application-test-file', false).expand('application-test-file', true)];
    for (const session of sessions) {
        const edits = session.view.nodes.filter(node => node.ui.sourceEdit);
        const connections = session.view.testEditConnections ?? [];
        assert.equal(connections.length, edits.length, 'code nodes must be connected, not merely present');
        assert.equal(new Set(connections.map(edge => edge.id)).size, connections.length);
        for (const node of edits) {
            const owned = connections.filter(edge => edge.to === node.id);
            assert.equal(owned.length, 1);
            assert.equal(owned[0]!.from, node.ui.sourceEdit!.subjectId);
            assert.equal(owned[0]!.testEditConnector, true);
            assert.equal(owned[0]!.version, node.ui.sourceEdit!.kind === 'remove' ? 'before' : 'after');
            assert.ok(session.view.nodes.some(subject => subject.id === owned[0]!.from && subject.kind === 'test'));
            assert.ok(!session.view.relations.some(edge => edge.id === owned[0]!.id), 'presentation never enters canonical relations');
            assert.ok(session.filter.relationIds.includes(owned[0]!.id));
        }
        assert.ok(!session.view.nodes.some(node => node.kind === 'assertion'));
    }
});

test('measured Test is above edit row; Removed left, Added right; bottom/top routes stay inside group and do not disturb original routes', () => {
    for (const open of [false, true]) for (const codeWidth of [300, 380, 540]) {
        const session = createGraphSession(sourceGraph).inspect(target, open), view = session.view;
        const connections = view.testEditConnections ?? [];
        assert.ok(connections.length > 0);
        const originals = view.relations.map(edge => ({id: edge.id, source: edge.from, target: edge.to}));
        const links = [...originals, ...connections.map(edge => ({id: edge.id, source: edge.from, target: edge.to, labelFree: true as const}))];
        const nodes = view.nodes.map(entity => ({id: entity.id, position: {x: 0, y: 0},
            ...(view.nodes.find(group => group.nodes?.some(child => child.id === entity.id)) ? {parentId: view.nodes.find(group => group.nodes?.some(child => child.id === entity.id))!.id} : {}),
            measured: {width: entity.ui.sourceEdit ? codeWidth : 300, height: entity.ui.sourceEdit ? (entity.ui.sourceEdit.kind === 'remove' ? 170 : 320) : entity.id === target && open ? 800 : 100}}));
        const headers = Object.fromEntries(view.nodes.filter(node => node.nodes).map(node => [node.id, 120]));
        const laid = initialLayout(nodes, links, 'pr25', readingBands(view.entities, sourceGraph.relations), headers, filePaths(view.entities), documentPaths(view.entities), testAssertionFamilies(view.entities, sourceGraph.relations));
        const boxes = absoluteBoxes(laid), routes = projectionRoutes(laid, view.nodes, links, {}, {}, headers)!;
        const originalRoutes = projectionRoutes(laid, view.nodes, originals, {}, {}, headers)!;
        for (const edge of originals) assert.deepEqual(routes.get(edge.id), originalRoutes.get(edge.id), edge.id);
        for (const group of view.nodes.filter(node => node.nodes?.some(child => child.ui.sourceEdit))) {
            const subject = group.nodes!.find(child => child.kind === 'test')!, top = boxes.get(subject.id)!, frame = boxes.get(group.id)!;
            const edits = group.nodes!.filter(child => child.ui.sourceEdit), sides = edits.map(child => boxes.get(child.id)!);
            for (const [index, side] of sides.entries()) {
                assert.ok(top.y + top.height < side.y, 'Test must be above its code');
                assert.ok(side.x >= frame.x && side.x + side.width <= frame.x + frame.width);
                assert.ok(side.y >= frame.y + headers[group.id]! && side.y + side.height <= frame.y + frame.height);
                const edge = connections.find(edge => edge.to === edits[index]!.id)!, route = routes.get(edge.id)!;
                assert.equal(route.sourceSide, 'bottom'); assert.equal(route.targetSide, 'top');
                assert.deepEqual(route.offset, {x: 0, y: 0});
                const path = curve(port(top, 'bottom'), port(side, 'top'), route.offset);
                for (const t of [0, .25, .5, .75, 1]) {const p = path.at(t); assert.ok(p.x >= frame.x && p.x <= frame.x + frame.width && p.y >= top.y + top.height && p.y <= side.y);}
                assert.deepEqual(liveProjectionRoutes(laid, links, routes, {}, {}, true).get(edge.id), route);
            }
            if (sides.length === 2) {assert.equal(sides[0]!.y, sides[1]!.y); assert.ok(sides[0]!.x + sides[0]!.width < sides[1]!.x);}
            assert.ok(top.x >= frame.x && top.x + top.width <= frame.x + frame.width);
        }
    }
});
