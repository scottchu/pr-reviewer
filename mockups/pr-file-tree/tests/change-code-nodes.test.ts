import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sourceGraph} from '../source-graph.ts';
import {collectEntities} from '../../../src/review-graph/domain/validation.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import type {UIEntity, SourceEditNodeUI} from '../../../src/review-graph/ui/types.ts';
import type {EditComposition} from '../../../src/review-graph/domain/edit-composition.ts';

const testId = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const canonical = collectEntities(sourceGraph.entities);

test('request and Test both directly contain exact Removed/Added code, without summary/header substitutes', () => {
    const session = createGraphSession(sourceGraph);
    for (const [groupId, subjectId, removed, added] of [['change', 'request', 1, 1], ['change:' + testId, testId, 4, 8]] as const) {
        const group = session.view.nodes.find(entity => entity.id === groupId)!;
        assert.equal(group.nodes?.length, 2);
        assert.deepEqual(group.nodes?.map(entity => entity.ui.sourceEdit?.kind), ['remove', 'add']);
        assert.equal(group.ui.changeSource?.subjectId, subjectId);
        assert.ok(!session.view.nodes.some(entity => entity.id === subjectId));
        const composition = canonical.find(entity => entity.id === subjectId)!.data.editComposition as EditComposition;
        for (const [index, kind, count] of [[0, 'remove', removed], [1, 'add', added]] as const) {
            const node: UIEntity = group.nodes![index]!;
            const edit: SourceEditNodeUI = node.ui.sourceEdit!;
            assert.ok(session.view.nodes.includes(node));
            assert.equal(edit.rows.length, count);
            assert.equal(edit.subjectId, subjectId);
            assert.deepEqual(edit.rows.map(row => row.text), composition.rows.filter(row => row.kind === kind).map(row => row.text));
            assert.deepEqual(edit.rows.map(row => row.line), composition.rows.filter(row => row.kind === kind).map(row => kind === 'remove' ? row.beforeLine : row.afterLine));
            assert.equal(node.ui.sourceControl, false);
            for (const row of edit.rows) {
                assert.equal(row.witness.side, kind === 'remove' ? 'base' : 'head');
                assert.ok(row.witness.contentHash && row.witness.commit && row.witness.path);
                assert.ok(row.line >= row.witness.startLine && row.line <= row.witness.endLine);
            }
        }
    }
    assert.ok(!session.view.nodes.some(entity => entity.id === 'header-value'));
});

test('one-sided changes are honest; original external relationship evidence stays attached to owning groups', () => {
    const session = createGraphSession(sourceGraph);
    const helper = session.view.nodes.find(entity => entity.id === 'change:helper')!;
    assert.deepEqual(helper.nodes?.map(entity => entity.ui.sourceEdit?.kind), ['add']);
    assert.ok(session.view.nodes.some(entity => entity.id === 'refresh' && entity.ui.status === 'no change'));
    const call = session.view.relations.find(edge => edge.ui.sourceEndpoints?.from === 'request' && edge.ui.sourceEndpoints.to === 'helper' && edge.relation === 'calls')!;
    assert.ok(call);
    assert.equal(call.from, 'change'); assert.equal(call.to, 'change:helper');
    assert.ok(call.data.projectionEvidence);
    const ids = new Set(session.view.nodes.map(entity => entity.id));
    assert.ok(session.view.relations.every(edge => ids.has(edge.from) && ids.has(edge.to)));
    assert.ok(session.view.relations.every(edge => edge.from !== edge.to));
});

test('code children survive filter/expansion/disclosure/hide without changing canonical facts or lazy source identity', () => {
    const before = JSON.stringify(sourceGraph), initial = createGraphSession(sourceGraph);
    const original = canonical.find(entity => entity.id === testId)!;
    for (const session of [initial, initial.setChangesOnly(true), initial.expand('application-test-file', false),
        initial.expand('application-test-file', false).expand('application-test-file', true), initial.inspect('change:' + testId, true)]) {
        const group = session.view.nodes.find(entity => entity.id === 'change:' + testId)!;
        assert.deepEqual(group.nodes?.map(entity => entity.ui.sourceEdit?.rows.length), [4, 8]);
        assert.ok(!session.view.nodes.some(entity => entity.kind === 'assertion'));
        assert.equal(group.ui.changeSource?.subjectId, testId);
    }
    const opened = initial.inspect('change:' + testId, true).view.nodes.find(entity => entity.id === 'change:' + testId)!;
    assert.equal(opened.ui.sourceOpen, true);
    assert.deepEqual(opened.ui.sourceReading?.hunks, (original.data.editComposition as EditComposition).hunks);
    assert.equal(JSON.stringify(sourceGraph), before);
});

test('UI identity is stable across filters and evidence disclosure; unresolved scopes mint no edit nodes', () => {
    const initial = createGraphSession(sourceGraph);
    assert.equal(initial.setChangesOnly(true).view, initial.view);
    const group = initial.view.nodes.find(entity => entity.id === 'change')!;
    const opened = initial.inspect('change', true);
    assert.equal(opened.view.nodes.find(entity => entity.id === 'change')!.nodes![0], group.nodes![0]);
    const copy = JSON.parse(JSON.stringify(sourceGraph)) as typeof sourceGraph;
    const helper = collectEntities(copy.entities).find(entity => entity.id === 'helper')!;
    (helper.data as Record<string, unknown>).editComposition = {...helper.data.editComposition as EditComposition, status: 'unresolved'};
    const unresolved = createGraphSession(copy).view.nodes.find(entity => entity.id === 'change:helper')!;
    assert.equal(unresolved.ui.changeSource, undefined);
    assert.ok(!unresolved.nodes?.some(entity => entity.ui.sourceEdit));
});
