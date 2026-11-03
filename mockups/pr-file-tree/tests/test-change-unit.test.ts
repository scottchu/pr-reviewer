import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceGraph} from '../source-graph.ts';
import {collectEntities} from '../../../src/review-graph/domain/validation.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';

const reportedTest = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const registry = collectEntities(sourceGraph.entities);

test('reported Test stays one normal source unit without Assertion canvas nodes or incident labels', () => {
    const before = JSON.stringify(sourceGraph);
    const session = createGraphSession(sourceGraph);
    const expanded = session.expand('application-test-file', false);
    const states = [session, expanded, expanded.setChangesOnly(true), expanded.setChangesOnly(false),
        session.inspect(reportedTest, true), expanded.expand('application-test-file', true)];
    for (const state of states) {
        const rendered = collectEntities(state.view.nodes);
        assert.equal(rendered.some(entity => entity.kind === 'assertion'), false);
        const ids = new Set(state.view.nodes.map(entity => entity.id));
        const assertionIds = new Set(registry.filter(entity => entity.kind === 'assertion').map(entity => entity.id));
        assert.ok(state.view.relations.every(edge => !assertionIds.has(edge.from) && !assertionIds.has(edge.to)));
        assert.ok(state.view.relations.every(edge => ids.has(edge.from) && ids.has(edge.to)));
        assert.equal(state.view.nodes.filter(entity => entity.id === reportedTest).length, 1);
        assert.ok(state.view.nodes.find(entity => entity.id === 'change:' + reportedTest)?.nodes?.some(entity => entity.id === reportedTest));
    }
    assert.equal(JSON.stringify(sourceGraph), before);
    assert.ok(sourceGraph.relations.some(edge => edge.from === reportedTest && edge.relation === 'contains'));
});

test('file pagination counts coherent Test/function units, never hidden assertion lines', () => {
    const session = createGraphSession(sourceGraph);
    const ids = sourceGraph.fileUnits['application-test-file']!;
    const kinds = new Map(registry.map(entity => [entity.id, entity.kind]));
    const readingIds = ids.filter(id => kinds.get(id) !== 'assertion');
    assert.equal(ids.length, 89);
    assert.equal(readingIds.length, 16);
    assert.equal(session.view.nodes.find(entity => entity.id === 'application-test-file')?.ui.unitCount, 16);
    const expanded = session.expand('application-test-file', false);
    const visible = new Set(expanded.view.nodes.map(entity => entity.id));
    assert.ok(readingIds.every(id => visible.has(id)), 'first page includes every one of the 16 source units');
    assert.equal(expanded.view.nodes.filter(entity => entity.kind === 'assertion').length, 0);
});

test('whole-Test exact edits and normal Function change source controls survive the simpler graph', () => {
    const original = registry.find(entity => entity.id === reportedTest)!;
    const session = createGraphSession(sourceGraph).inspect(reportedTest, true);
    const testUnit = session.view.nodes.find(entity => entity.id === reportedTest)!;
    assert.equal(testUnit.kind, 'test');
    assert.equal(testUnit.ui.sourceControl, true);
    assert.equal(testUnit.ui.sourceOpen, true);
    assert.equal(testUnit.data.editComposition, original.data.editComposition);
    assert.equal(testUnit.data.sourceWitnesses, original.data.sourceWitnesses);
    const reading = testUnit.ui.sourceReading!;
    assert.equal(reading.available, true);
    assert.match(reading.caption, /8/);
    assert.match(reading.caption, /4/);
    assert.ok(reading.hunks.some(hunk => hunk.rows.some(row => row.text.includes('ownerRequests'))));
    const normal = session.view.nodes.find(entity => entity.id === 'request')!;
    assert.equal(normal.ui.sourceControl, true);
    assert.ok(session.view.nodes.find(entity => entity.id === 'change')?.nodes?.some(child => child.id === 'header-value'));
    assert.ok(session.view.relations.some(edge => edge.from === 'request' && edge.to === 'header-value' && edge.relation === 'constructs'));
    assert.ok(session.view.relations.some(edge => edge.from === 'request' && edge.to === 'helper' && edge.relation === 'calls'));
});
