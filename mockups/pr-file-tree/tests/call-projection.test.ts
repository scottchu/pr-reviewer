import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceGraph, allEntities, allRelations, visibleSourceGraph } from '../source-graph.ts';
import { reducedCallProjection } from '../call-projection.ts';
import { cardRows, edgeRows } from '../minimal-projection.ts';

test('actual generated default request calls helper directly while retaining canonical H30 facts', () => {
    const before = JSON.stringify(sourceGraph);
    const canonical = allRelations();
    const contains = canonical.find(edge => edge.from === 'request' && edge.relation === 'contains_call')!;
    const site = allEntities().find(entity => entity.id === contains.to)!;
    assert.equal(site.kind, 'callsite');
    assert.equal(site.data.name, 'accessHeaders(captured)');
    const view = visibleSourceGraph({});
    assert.ok(!view.nodes.some(entity => entity.id === site.id));
    assert.ok(!view.nodes.some(entity => entity.nodes?.some(child => child.id === site.id)));
    assert.ok(!view.relations.some(edge => edge.relation === 'contains_call' && edge.from === 'request'));
    const projected = view.relations.find(edge => edge.from === 'request' && edge.to === 'helper' && edge.relation === 'calls')!;
    assert.ok(projected);
    assert.equal(view.relations.filter(edge => edge.from === 'request' && edge.to === 'helper' && edge.relation === 'calls').length, 1);
    assert.equal(cardRows(view.nodes.find(entity => entity.id === 'helper')!).title, 'accessHeaders()');
    assert.equal(projected.version, 'after');
    assert.equal(projected.data.comparisonStatus, 'add');
    assert.equal(projected.data.projection, 'collapsed-callsite');
    const proof = projected.data.projectionEvidence as { callsiteId: string; canonicalRelations: typeof canonical; locations: typeof canonical };
    assert.equal(proof.callsiteId, site.id);
    assert.ok(proof.canonicalRelations.some(edge => edge.id === contains.id));
    assert.ok(proof.canonicalRelations.some(edge => edge.from === site.id && edge.to === 'helper'));
    assert.equal(proof.locations[0]!.data.commit, 'e3b270e5f49a9215452b0b86702946043e979059');
    assert.deepEqual(proof.locations[0]!.data.range, { startLine: 30, endLine: 30 });
    assert.match(edgeRows(projected).rows.join(' '), /review\.ts.*L30/);
    assert.equal(view.nodes.filter(entity => entity.kind === 'file').length, 97);
    assert.equal(view.relations.filter(edge => edge.relation === 'changes').length, 50);
    assert.equal(JSON.stringify(sourceGraph), before);
    assert.ok(!canonical.some(edge => edge.from === 'request' && edge.to === 'helper' && edge.relation === 'calls'));
});

test('explicit source-unit detail retains the same callsite and original chain, not duplicate identities', () => {
    const view = visibleSourceGraph({ 'review-file': 20 });
    const contains = allRelations().find(edge => edge.from === 'request' && edge.relation === 'contains_call')!;
    assert.equal(view.nodes.filter(entity => entity.id === contains.to).length, 1);
    assert.ok(view.relations.some(edge => edge.id === contains.id));
    assert.ok(view.relations.some(edge => edge.from === contains.to && edge.to === 'helper' && edge.relation === 'calls'));
    assert.ok(!view.relations.some(edge => edge.from === 'request' && edge.to === 'helper' && edge.relation === 'calls'));
});

test('incomplete, ambiguous or mismatched canonical call chains remain detailed', () => {
    const nodes = allEntities();
    const relations = allRelations();
    const contains = relations.find(edge => edge.from === 'request' && edge.relation === 'contains_call')!;
    const calls = relations.find(edge => edge.from === contains.to && edge.relation === 'calls')!;
    const location = relations.find(edge => edge.from === contains.to && edge.relation === 'located_in')!;
    for (const altered of [
        relations.filter(edge => edge.id !== calls.id),
        [...relations, { ...contains, id: 'ambiguous-owner' }],
        relations.map(edge => edge.id === calls.id ? { ...edge, version: 'before' as const } : edge),
        relations.map(edge => edge.id === location.id ? { ...edge, data: { ...edge.data, range: { startLine: 3, endLine: 3 } } } : edge),
    ]) {
        const view = reducedCallProjection(nodes, altered, new Set());
        assert.ok(view.nodes.some(entity => entity.id === contains.to));
        assert.ok(!view.relations.some(edge => edge.from === 'request' && edge.to === 'helper' && edge.data.projection === 'collapsed-callsite'));
    }
});
