import {test} from 'node:test';
import assert from 'node:assert/strict';
import {graphPaintState} from '../../../src/review-graph/ui/paint-state.ts';
import {createViewportWorker, type SceneWorkerPort} from '../../../src/review-graph/integration/viewport-worker.ts';
import type {SceneWorkerOutputUI} from '../../../src/review-graph/ui/types.ts';

const filter = {changesOnly: false, nodeIds: ['visible', 'reader', 'offscreen', 'new'], relationIds: ['edge', 'hidden-edge']};
const pins = {nodes: [], routes: []};
test('bootstrap mounts for measurement without painting; reflow retains only scoped eligible paint and pins', () => {
    const pending = graphPaintState('A', filter, null, null, pins, ['reader'], false);
    assert.equal(pending.established, false); assert.deepEqual([...pending.nodes], []); assert.deepEqual([...pending.routes], []);
    const selected = {nodes: new Set(['visible']), routes: new Set(['edge'])};
    const first = graphPaintState('A', filter, selected, null, pins, ['reader'], false);
    assert.equal(first.established, true);assert.deepEqual([...first.nodes], ['visible', 'reader']);
    const retained = {comparison: 'A', nodes: first.nodes, routes: first.routes};
    const reflow = graphPaintState('A', filter, null, retained, pins, ['reader'], false);
    assert.deepEqual([...reflow.nodes], ['visible', 'reader']);assert.ok(!reflow.nodes.has('offscreen'));assert.ok(!reflow.nodes.has('new'));
    const semantic = graphPaintState('A', {...filter, changesOnly: true, nodeIds: ['visible'], relationIds: []}, null, retained, {nodes: ['reader'], routes: ['edge']}, ['reader'], false);
    assert.deepEqual([...semantic.nodes], ['visible']);assert.deepEqual([...semantic.routes], []);
    const changedComparison = graphPaintState('B', filter, null, retained, pins, ['reader'], false);
    assert.equal(changedComparison.established, false);assert.equal(changedComparison.nodes.size, 0);
});
test('only explicit worker failure with complete geometry permits initial full fallback', () => {
    assert.equal(graphPaintState('A', filter, null, null, pins, [], false).established, false);
    const fallback = graphPaintState('A', filter, null, null, pins, [], true);
    assert.equal(fallback.established, true);assert.deepEqual([...fallback.nodes], filter.nodeIds);assert.deepEqual([...fallback.routes], filter.relationIds);
    const afterFailure = graphPaintState('A', filter, null, {comparison: 'A', nodes: new Set(['visible']), routes: new Set(['edge'])}, pins, [], true);
    assert.deepEqual([...afterFailure.nodes], filter.nodeIds);
});
test('worker failure notification is once-only, disposed-safe and leaves original null publication semantics intact', () => {
    let failures = 0, publications = 0;
    const unavailable = createViewportWorker(() => {throw new Error('unavailable');}, () => publications++, 2000, () => failures++);
    assert.equal(failures, 1);assert.equal(publications, 0);unavailable.dispose();assert.equal(failures, 1);
    const listeners = new Map<string, (event: MessageEvent<SceneWorkerOutputUI>) => void>();
    const port: SceneWorkerPort = {postMessage: () => {}, addEventListener: (name, callback) => {listeners.set(name, callback);}, removeEventListener: name => {listeners.delete(name);}, terminate: () => {}};
    const owner = createViewportWorker(() => port, () => publications++, 2000, () => failures++);
    const stale = listeners.get('error')!;owner.dispose();stale({} as MessageEvent<SceneWorkerOutputUI>);assert.equal(failures, 1);
    const live = createViewportWorker(() => port, () => publications++, 2000, () => failures++);
    const error = listeners.get('error')!;error({} as MessageEvent<SceneWorkerOutputUI>);error({} as MessageEvent<SceneWorkerOutputUI>);
    assert.equal(failures, 2);assert.equal(publications, 0);live.dispose();
});
