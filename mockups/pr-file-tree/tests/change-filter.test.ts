import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import type {GraphEntity, GraphRelation, SourceGraph} from '../../../src/review-graph/domain/types.ts';
import {sourceGraph} from '../source-graph.ts';
import {filterSceneMembership, sceneMembership} from '../../../src/review-graph/ui/scene-membership.ts';
import {createReaderStateCache, retainedReaderPins} from '../../../src/review-graph/ui/reader-state.ts';
import {withMeasuredGeometry} from '../../../src/review-graph/ui/layout-measurements.ts';
import {initialLayout} from '../../../src/review-graph/ui/graph-geometry.ts';

const entity = (id: string, status?: string, kind = 'function'): GraphEntity => ({
    id, kind, data: {name: id, ...(status ? {comparisonStatus: status} : {})},
});
const relation = (id: string, from: string, to: string, status?: string, kind = 'calls'): GraphRelation => ({
    id, from, to, relation: kind, version: 'comparison',
    data: status ? {comparisonStatus: status} : {},
});
const fixture: SourceGraph = {
    entities: [
        entity('review', undefined, 'review'), entity('file', 'change', 'file'),
        {id: 'group', kind: 'change', data: {name: 'group'}, nodes: [entity('added', 'add')], edges: []},
        entity('removed', 'remove'), entity('modified', 'change'), entity('unchanged', 'no change'),
        entity('direct'), entity('second-hop'), entity('unrelated'), entity('file-neighbor'),
        {...entity('unresolved', 'change'), data: {editComposition: {status: 'unresolved', scope: 'unit', added: 0, removed: 0, rows: [], hunks: []}}},
        entity('hidden-unit', 'add'),
    ],
    relations: [
        relation('direct-context', 'added', 'direct'), relation('second-context', 'direct', 'second-hop'),
        relation('direct-unresolved', 'modified', 'unresolved'),
        relation('unchanged-card', 'modified', 'unchanged', 'change'),
        relation('stable-between-changes', 'added', 'removed', 'no change'),
        relation('changed-route', 'modified', 'removed', 'remove'),
        relation('file-location', 'file-neighbor', 'file', undefined, 'located_in'),
        relation('group-contains', 'group', 'added', 'no change', 'contains'),
        relation('hidden-unit-route', 'modified', 'hidden-unit', 'add'),
    ],
    initialVisible: ['group', 'removed', 'modified', 'unchanged', 'direct', 'second-hop', 'unrelated', 'file-neighbor', 'unresolved', 'review'],
    fileUnits: {file: ['hidden-unit']}, groupFor: {added: 'group'}, unresolved: [],
    provenance: {repository: 'fixture/repo', base: 'a'.repeat(40), head: 'b'.repeat(40)},
};

test('filter admits changed subjects and only eligible direct neutral context with a literal independent oracle', () => {
    const session = createGraphSession(fixture);
    const filtered = session.setChangesOnly(true);
    assert.deepEqual(filtered.filter.nodeIds, ['review', 'file', 'group', 'added', 'removed', 'modified', 'direct', 'unresolved']);
    assert.deepEqual(filtered.filter.relationIds, ['direct-context', 'direct-unresolved', 'changed-route']);
    assert.equal(filtered.view, session.view);
    assert.equal(filtered.layoutRelations, session.layoutRelations);
    assert.equal(filtered.limits, session.limits);
    assert.equal(filtered.filter.nodeIds.includes('hidden-unit'), false);
    assert.equal(filtered.filter.nodeIds.includes('second-hop'), false);
    assert.equal(filtered.filter.nodeIds.includes('file-neighbor'), false);
});

test('filter is scoped immutable intent, defaults off and preserves source expansion/disclosure and exact off view', () => {
    const state = experienceService.openComparison(fixture);
    const before = JSON.stringify(state);
    assert.equal(state.changesOnly, false);
    const result = experienceService.handleIntent(state, {type: 'set-changes-only', comparisonId: state.comparisonId, enabled: true});
    assert.equal(result.accepted, true);
    assert.equal(result.state.changesOnly, true);
    assert.equal(result.state.revision, 1);
    assert.equal(JSON.stringify(state), before);
    const other = experienceService.openComparison({...fixture, provenance: {...fixture.provenance, head: 'c'.repeat(40)}});
    const stale = experienceService.handleIntent(other, {type: 'set-changes-only', comparisonId: state.comparisonId, enabled: true});
    assert.equal(stale.accepted, false);
    assert.equal(stale.state, other);
    assert.equal(other.changesOnly, false);
    const session = createGraphSession(fixture);
    const expanded = session.expand('file', false);
    const on = expanded.setChangesOnly(true);
    assert.equal(on.filter.nodeIds.includes('hidden-unit'), true);
    assert.equal(on.limits.file, 20);
    const off = on.setChangesOnly(false);
    assert.equal(off.view, expanded.view);
    assert.deepEqual(off.filter.nodeIds, expanded.view.nodes.map(node => node.id));
    assert.deepEqual(off.filter.relationIds, expanded.view.relations.map(edge => edge.id));
});

test('no-change coordinate parents stay excluded while independently changed descendants survive', () => {
    const graph: SourceGraph = {...fixture, entities: [
        entity('review', undefined, 'review'),
        {id: 'stable-group', kind: 'change', data: {comparisonStatus: 'no change'}, nodes: [entity('child', 'add')], edges: []},
    ], initialVisible: ['review', 'stable-group'], relations: [], fileUnits: {}, groupFor: {child: 'stable-group'}};
    const session = createGraphSession(graph);
    assert.deepEqual(session.setChangesOnly(true).filter.nodeIds, ['review', 'child']);
    assert.deepEqual(session.view.nodes.map(node => node.id), ['review', 'stable-group', 'child']);
});

test('viewport/focus/open-reader pins and worker fallback cannot expose semantic exclusions', () => {
    const filter = createGraphSession(fixture).setChangesOnly(true).filter;
    const identity = {comparison: 'fixture', revision: 1};
    const pinned = sceneMembership(identity, {
        ...identity, request: 1, coverage: {x: 0, y: 0, width: 100, height: 100},
        nodeIds: ['added', 'unchanged'], metadataNodeIds: [], routeIds: ['stable-between-changes'], visited: 2, visitedBranches: 1,
    }, {nodes: ['unchanged', 'second-hop'], routes: ['second-context']}, ['unrelated', 'unresolved']);
    const selected = filterSceneMembership(filter, pinned);
    assert.deepEqual([...selected.nodes], ['added', 'unresolved']);
    assert.deepEqual([...selected.routes], []);
    const fallback = filterSceneMembership(filter, null);
    assert.deepEqual([...fallback.nodes], filter.nodeIds);
    assert.deepEqual([...fallback.routes], filter.relationIds);
    assert.equal(fallback.nodes.has('unchanged'), false);
});

test('rapid filter intents retain source disclosure and do not demand lazy source bodies', () => {
    let reads = 0;
    const graph: SourceGraph = {...fixture, entities: [
        {...entity('source', 'add'), data: {editComposition: {
            status: 'add', scope: 'unit', added: 1, removed: 0, hunks: [],
            get rows() { reads++; return []; },
        }}},
    ], initialVisible: ['source'], relations: [], fileUnits: {}, groupFor: {}};
    const opened = createGraphSession(graph).inspect('source', true);
    let current = opened;
    for (let i = 0; i < 20; i++) current = current.setChangesOnly(i % 2 === 0);
    assert.equal(current.view, opened.view);
    assert.equal(current.view.nodes[0]!.ui.sourceOpen, true);
    assert.equal(reads, 0);
    assert.equal(current.filter.changesOnly, false);
    assert.equal(createGraphSession(graph).filter.changesOnly, false);
});

test('semantically hidden offscreen native readers retain cache pins and reopen at saved scroll', () => {
    const session = createGraphSession(fixture);
    const cache = createReaderStateCache(session.view.nodes.map(node => node.id));
    const native = {entityId: 'unchanged', kind: 'inline-hunks'} as const;
    const unpaired = {entityId: 'file', kind: 'unpaired-source'} as const;
    cache.disclose(native, true);
    cache.capture(native, {scrollTop: 137, scrollLeft: 21});
    cache.disclose(unpaired, true);
    cache.disclose({entityId: 'direct', kind: 'source-hunks'}, true);
    const nodes = session.view.nodes.map(node => node.id === 'unchanged'
        ? {...node, ui: {...node.ui, inlineSourceReading: true}}
        : node.id === 'file' ? {...node, ui: {...node.ui, unpairedRows: ['Exact unpaired range']}} : node);
    const pins = retainedReaderPins(nodes, {file: 20}, cache);
    assert.deepEqual(pins, ['file', 'unchanged']);
    assert.equal(retainedReaderPins(nodes, {}, cache).includes('file'), false);
    const spatial = {nodes: new Set(pins), routes: new Set<string>()};
    assert.equal(filterSceneMembership(session.setChangesOnly(true).filter, spatial).nodes.has('unchanged'), false);
    assert.equal(filterSceneMembership(session.filter, spatial).nodes.has('unchanged'), true);
    const recreated = {scrollTop: 0, scrollLeft: 0};
    cache.restore(native, recreated);
    assert.deepEqual(recreated, {scrollTop: 137, scrollLeft: 21});
    assert.equal(cache.read(native).open, true);
});

for (const scenario of ['early on before first layout', 'reflow while on', 'offscreen viewport cull before reflow']) {
    test(`layout retains full-model ownership after ${scenario} and off/visible`, () => {
        const reflow = scenario !== 'early on before first layout';
        const full = [
            {id: 'changed', position: {x: 0, y: 0}, data: {subject: 'changed'}, draggable: true, focusable: true, style: {opacity: 0, color: 'original'}},
            {id: 'unchanged', position: {x: 0, y: 0}, data: {subject: 'unchanged'}, draggable: true, focusable: true, style: {opacity: 0, color: 'original'}},
        ];
        const first = reflow ? initialLayout(withMeasuredGeometry(full, [
            {id: 'changed', measured: {width: 301, height: 91}},
            {id: 'unchanged', measured: {width: 302, height: 92}},
        ]), [], 'changed') : full;
        const before = JSON.stringify(first);
        // Independent observed-store fixture, deliberately hostile beyond dimensions.
        const renderedStore = first.map(node => ({
            ...node, position: {x: -10000, y: -10000},
            measured: {width: reflow ? 411 : 311, height: reflow ? 191 : 101},
            data: {...node.data, renderContent: false, measureOnly: true},
            draggable: false, focusable: false,
            style: {...node.style, ...(scenario.startsWith('offscreen') ? {} : {visibility: 'hidden', pointerEvents: 'none'}), width: 99999},
        }));
        const measured = withMeasuredGeometry(first, renderedStore);
        const settled = initialLayout(measured, [], 'changed');
        const restored = settled.find(node => node.id === 'unchanged')!;
        assert.deepEqual(restored.data, {subject: 'unchanged'});
        assert.equal(restored.draggable, true);
        assert.equal(restored.focusable, true);
        assert.deepEqual(restored.style, {opacity: 1, color: 'original'});
        assert.deepEqual(restored.measured, {width: reflow ? 411 : 311, height: reflow ? 191 : 101});
        assert.deepEqual(restored.position, {x: 0, y: reflow ? 371 : 281});
        assert.equal(measured[1]!.data, first[1]!.data);
        assert.equal(measured[1]!.style, first[1]!.style);
        assert.equal(JSON.stringify(first), before);
        assert.equal('measureOnly' in restored.data, false);
        assert.equal('renderContent' in restored.data, false);
    });
}

test('measurement import matches exact full-model IDs and rejects invalid dimensions and foreign subjects', () => {
    const full = [{id: 'a', position: {x: 2, y: 3}, measured: {width: 50, height: 60}}];
    const result = withMeasuredGeometry(full, [
        {id: 'a', measured: {width: NaN, height: -1}},
        {id: 'foreign', measured: {width: 100, height: 200}},
    ]);
    assert.deepEqual(result, full);
    assert.equal(result[0], full[0]);
    const partial = withMeasuredGeometry(full, [{id: 'a', measured: {width: 75, height: Infinity}}]);
    assert.deepEqual(partial, [{id: 'a', position: {x: 2, y: 3}, measured: {width: 75, height: 60}}]);
});

test('pinned PR25 no-change disposed-read test/assertions/contains disappear and exact canonical account returns', () => {
    const digest = () => createHash('sha256').update(JSON.stringify(sourceGraph)).digest('hex');
    const before = digest();
    const full = createGraphSession(sourceGraph);
    const target = full.view.nodes.find(node => node.kind === 'test' && node.ui.card.title.includes('disposed'));
    assert.ok(target, 'pinned disposed-read test is in the current view');
    assert.equal(target.ui.status, 'no change');
    const contains = full.view.relations.filter(edge => edge.from === target.id && edge.relation === 'contains');
    assert.ok(contains.length > 0);
    const on = full.setChangesOnly(true);
    for (const id of [target.id, ...contains.map(edge => edge.to)]) {
        assert.equal(on.filter.nodeIds.includes(id), false, id);
    }
    for (const edge of full.view.relations.filter(edge => edge.data.comparisonStatus === 'no change')) {
        assert.equal(on.filter.relationIds.includes(edge.id), false, edge.id);
    }
    for (const node of full.view.nodes.filter(node => node.ui.status === 'no change')) {
        assert.equal(on.filter.nodeIds.includes(node.id), false, node.id);
    }
    const off = on.setChangesOnly(false);
    assert.equal(off.view, full.view);
    assert.deepEqual(off.filter.nodeIds, full.view.nodes.map(node => node.id));
    assert.deepEqual(off.filter.relationIds, full.view.relations.map(edge => edge.id));
    assert.equal(digest(), before);
});
