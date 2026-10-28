import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sourceGraph, allEntities, allRelations, visibleSourceGraph } from '../source-graph.ts';
import { cardRows, omittedStructuralEdge } from '../minimal-projection.ts';
test('actual generated render input retains all changed Files and context without root syntax explosion', () => {
    const view = visibleSourceGraph({});
    assert.equal(view.nodes.filter(entity => entity.kind === 'file').length, 97);
    assert.equal(view.relations.filter(edge => edge.relation === 'changes').length, 50);
    assert.ok(view.nodes.length < 250); // Twenty bounded document groups and their evidence cards.
    assert.equal(allEntities().filter(entity => entity.id === 'request').length, 1);
    assert.ok(sourceGraph.provenance.inputArtifactHash);
    assert.ok(sourceGraph.provenance.compilerHash);
    assert.ok(sourceGraph.provenance.appCompilerHash);
});
test('source-unit expansion reveals generated entities without changing source facts', () => {
    const before = JSON.stringify(sourceGraph);
    const view = visibleSourceGraph({ 'application-test-file': 20 });
    const selected = new Set(sourceGraph.fileUnits['application-test-file']?.slice(0, 20));
    for (const entity of view.nodes)
        if (selected.has(entity.id))
            assert.equal(entity.data.path, undefined);
    assert.ok(view.nodes.some(entity => entity.kind === 'test'));
    assert.equal(JSON.stringify(sourceGraph), before);
    assert.ok(!allRelations().some(edge => edge.relation === 'verifies'));
    for (const entity of view.nodes)
        assert.ok(!cardRows(entity).rows.some(row => /Not run|NoRunEvidence/.test(row)));
    for (const parent of allEntities().filter(entity => entity.nodes))
        for (const edge of allRelations().filter(edge => edge.from === parent.id && parent.nodes?.some(child => child.id === edge.to)))
            assert.equal(omittedStructuralEdge(edge, allEntities()), true);
});
test('actual entry consumes generated source graph rather than legacy curated structural assembly', () => {
    const source = readFileSync(new URL('../minimal-main.tsx', import.meta.url), 'utf8');
    assert.match(source, /source-graph\.ts/);
    assert.ok(!source.includes("from './comparison-graph.ts'"));
    const adapter = readFileSync(new URL('../source-graph.ts', import.meta.url), 'utf8');
    assert.match(adapter, /generated-source-graph\.json/);
});
test('visible Tests retain their actual assertions and source locations without File pagination', () => {
    const view = visibleSourceGraph({});
    const visible = new Set(view.nodes.map(entity => entity.id));
    const tests = new Set(view.nodes.filter(entity => entity.kind === 'test').map(entity => entity.id));
    const ownership = allRelations().filter(edge => edge.relation === 'contains' && tests.has(edge.from));
    assert.ok(ownership.length > 0);
    for (const edge of ownership) {
        assert.ok(visible.has(edge.to));
        assert.ok(view.relations.some(actual => actual.id === edge.id));
        assert.ok(view.relations.some(location => location.from === edge.to && location.relation === 'located_in'));
    }
    assert.ok(view.relations.some(edge => edge.relation === 'located_in'
        && ownership.some(contains => contains.to === edge.from)
        && JSON.stringify(edge.data).includes('418')));
});
