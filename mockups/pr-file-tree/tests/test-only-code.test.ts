import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {projectExperience} from '../../../src/review-graph/ui/projection.ts';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import {projectChangeFilter} from '../../../src/review-graph/ui/change-filter.ts';
import {collectEntities} from '../../../src/review-graph/domain/validation.ts';
import type {EditComposition} from '../../../src/review-graph/domain/edit-composition.ts';
import type {ExperienceIntent} from '../../../src/review-graph/experience/types.ts';
import {initialLayout, absoluteBoxes} from '../../../src/review-graph/ui/graph-geometry.ts';
import {readingBands, filePaths, documentPaths, testAssertionFamilies} from '../../../src/review-graph/ui/entity-presentation.ts';

const testId = 'unit:120f56a58b1d4d8935c4a6e8aeb217c5cc80e65ab2f3a4ba32c4d0c3d9a4b21f';
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('request/Authorization/helper and every existing edge stay at the independently frozen a08fa42 baseline', () => {
    let state = experienceService.openComparison(sourceGraph), session = createGraphSession(sourceGraph);
    const protectedNode = (entity: typeof session.view.nodes[number]) => entity.kind !== 'test' && !entity.nodes?.some(child => child.kind === 'test');
    const baseline = projectExperience(state);
    assert.equal(sha(baseline.nodes.filter(protectedNode)), '73ac2b2ea8a383a18e27069f40e5d487b0f05ec85b6f6feddbf1a8c352e472d5');
    assert.equal(sha(baseline.relations), '6557dc50f9bfe668d07fc72192bb4933772872869adb9e75cc64670bb80886fe');
    const check = () => {
        const raw = projectExperience(state);
        for (const original of raw.nodes.filter(protectedNode)) assert.deepEqual(session.view.nodes.find(entity => entity.id === original.id), original, original.id);
        assert.deepEqual(session.view.relations, raw.relations, 'all IDs/endpoints/data/labels stay unchanged');
        assert.deepEqual(session.filter.relationIds, projectChangeFilter(raw, state.changesOnly).relationIds);
        assert.ok(session.view.nodes.some(entity => entity.id === 'request'));
        assert.ok(session.view.nodes.some(entity => entity.id === 'header-value'));
        assert.ok(session.view.relations.some(edge => edge.from === 'request' && edge.to === 'header-value' && edge.relation === 'constructs'));
    };
    check();
    const intents: ExperienceIntent[] = [
        {type: 'show-source-units', comparisonId: state.comparisonId, fileId: 'application-test-file', hide: false},
        {type: 'set-changes-only', comparisonId: state.comparisonId, enabled: true},
        {type: 'set-changes-only', comparisonId: state.comparisonId, enabled: false},
        {type: 'source-disclosure', comparisonId: state.comparisonId, entityId: testId, open: true},
        {type: 'show-source-units', comparisonId: state.comparisonId, fileId: 'application-test-file', hide: true},
    ];
    for (const intent of intents) {
        state = experienceService.handleIntent(state, intent).state;
        if (intent.type === 'show-source-units') session = session.expand(intent.fileId, Boolean(intent.hide));
        if (intent.type === 'set-changes-only') session = session.setChangesOnly(intent.enabled);
        if (intent.type === 'source-disclosure') session = session.inspect(intent.entityId, intent.open);
        check();
    }
});

test('request group markup, existing CSS and source-color index stay byte-identical to the restored baseline', () => {
    const bytes = (path: string) => readFileSync(new URL(path, import.meta.url));
    const digest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
    assert.equal(digest(bytes('../minimal.css')), '0bfdc39de31577cc9da768801ad3081e946c62850a971f8a4dacfaaa79b2e847');
    assert.equal(digest(bytes('../syntax.json')), 'c89a59f40aa4ef5a94aa588abf357f0408a56556f7cb1ebfb7f1e4edf60296cd');
    const renderer = bytes('../../../src/review-graph/ui/components/ReviewGraph.tsx').toString();
    const groupMarkup = renderer.slice(renderer.indexOf('const GraphBoundary ='), renderer.indexOf('const Relation ='));
    assert.equal(digest(groupMarkup), 'df4e875e075d917c21054367c4277a9c02f36f6f4dbf262c20c4b89ec3b4a72c');
});

test('synthetic Test-only room does not change request/Authorization/helper placement or dimensions', () => {
    const raw = projectExperience(experienceService.openComparison(sourceGraph)), next = createGraphSession(sourceGraph).view;
    const layout = (view: typeof next) => {
        const nodes = view.nodes.map(entity => {
            const parent = view.nodes.find(group => group.nodes?.some(child => child.id === entity.id));
            return {id: entity.id, position: {x: 0, y: 0}, measured: entity.ui.sourceEdit ? {width: 380, height: 200} : {width: 300, height: 100}, ...(parent ? {parentId: parent.id} : {})};
        });
        return absoluteBoxes(initialLayout(nodes, view.relations.map(edge => ({id: edge.id, source: edge.from, target: edge.to})), 'pr25',
            readingBands(view.entities, sourceGraph.relations), {}, filePaths(view.entities), documentPaths(view.entities), testAssertionFamilies(view.entities, sourceGraph.relations)));
    };
    const before = layout(raw), after = layout(next);
    for (const id of ['change', 'request', 'header-value', 'helper', 'change:helper']) assert.deepEqual(after.get(id), before.get(id), id);
});

test('only Test groups gain literal code sides while keeping their original Test relationship anchor', () => {
    const before = sha(sourceGraph), session = createGraphSession(sourceGraph);
    const group = session.view.nodes.find(entity => entity.id === 'change:' + testId)!;
    assert.ok(group.nodes?.some(entity => entity.id === testId));
    const edits = group.nodes!.filter(entity => entity.ui.sourceEdit);
    assert.deepEqual(edits.map(entity => entity.ui.sourceEdit?.kind), ['remove', 'add']);
    assert.deepEqual(edits.map(entity => entity.ui.sourceEdit?.rows.length), [4, 8]);
    const original = collectEntities(sourceGraph.entities).find(entity => entity.id === testId)!;
    const composition = original.data.editComposition as EditComposition;
    for (const node of edits) {
        const edit = node.ui.sourceEdit!;
        assert.deepEqual(edit.rows.map(row => row.text), composition.rows.filter(row => row.kind === edit.kind).map(row => row.text));
        assert.deepEqual(edit.rows.map(row => row.line), composition.rows.filter(row => row.kind === edit.kind).map(row => edit.kind === 'remove' ? row.beforeLine : row.afterLine));
    }
    assert.equal(session.view.nodes.find(entity => entity.id === testId)?.ui.testCodeSource, true);
    assert.ok(!session.view.nodes.some(entity => entity.kind === 'assertion'));
    assert.ok(session.view.entities.filter(entity => entity.ui.sourceEdit).every(entity =>
        collectEntities(sourceGraph.entities).find(source => source.id === entity.ui.sourceEdit!.subjectId)?.kind === 'test'));
    assert.equal(sha(sourceGraph), before);
});

test('added-only Test has no invented Removed side; code IDs and reader ownership survive disclosure', () => {
    const session = createGraphSession(sourceGraph);
    const added = session.view.nodes.find(entity => entity.kind === 'test' && entity.ui.status === 'add' && entity.ui.testCodeSource)!;
    assert.ok(added);
    const group = session.view.nodes.find(entity => entity.nodes?.some(child => child.id === added.id))!;
    assert.deepEqual(group.nodes!.filter(child => child.ui.sourceEdit).map(child => child.ui.sourceEdit!.kind), ['add']);
    assert.equal(session.setChangesOnly(true).view, session.view);
    const opened = session.inspect(added.id, true);
    assert.equal(opened.view.nodes.find(entity => entity.id === added.id)!.ui.sourceOpen, true);
    assert.equal(opened.view.nodes.find(entity => entity.id === group.id)!.nodes!.find(child => child.ui.sourceEdit), group.nodes!.find(child => child.ui.sourceEdit));
});
