import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectEntities, validateGraph} from '../../../src/review-graph/domain/validation.ts';
import {validateEnrichment} from '../../../src/review-graph/domain/enrichment.ts';
import {prepareReviewComparison, assemblePreparedResult, extractPreparedComparison} from '../../../src/review-graph/preparation/run.ts';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import {prepareAppGraph} from '../../../src/review-graph/preparation/pr25.ts';
import {sourceHash} from '../../../src/review-graph/domain/hash.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {cardRows} from '../../../src/review-graph/ui/content.ts';
import type {FactDocument, GraphEntity, GraphRelation, SourceInput} from '../../../src/review-graph/domain/types.ts';

const prepared = prepareReviewComparison('scottchu/pr-reviewer',
    'b096826e31c0927190806de91ed70b8b64aa93d8',
    'e3b270e5f49a9215452b0b86702946043e979059', facts => sourceHash(JSON.stringify(facts)));

const source: SourceInput = {
    repository: 'example/repo', side: 'head', commit: 'b'.repeat(40), path: 'docs/policy.md',
    content: 'Owner requests use no Authorization.\n',
    contentHash: sourceHash('Owner requests use no Authorization.\n'), gitBlob: 'c'.repeat(40),
};
const ref = {
    repository: source.repository, side: source.side, commit: source.commit,
    contentHash: source.contentHash, path: source.path, startLine: 1, endLine: 1,
};
const facts: FactDocument = {
    format: 'literal-fixture', repository: source.repository, base: 'a'.repeat(40), head: source.commit,
    producer: {version: 'fixture', parser: 'fixture', sourceHashes: {}},
    files: [{id: 'file', path: source.path, nativeStatus: 'A', comparisonStatus: 'add',
        sides: [{side: source.side, commit: source.commit, contentHash: source.contentHash, available: true}],
        patch: '@@ -0,0 +1 @@\n+Owner requests use no Authorization.\n', patchHash: 'fixture'}],
    contextFiles: [], units: [], coverage: {},
};
const change: GraphEntity = {id: 'change', kind: 'change', data: {}};
const file: GraphEntity = {id: 'file', kind: 'file', data: {path: source.path}};
const reason: GraphEntity = {id: 'reason', kind: 'reason', data: {name: 'Prepared obstacle', basis: 'Attributed source inference', sourceRefs: [ref]}};
const goal: GraphEntity = {id: 'goal', kind: 'goal', data: {name: 'Intended outcome', basis: 'Attributed intent', sourceRefs: [ref]}};
const edge: GraphRelation = {id: 'motivation', from: 'change', to: 'reason', version: 'comparison', relation: 'motivated_by', data: {basis: 'Attributed rationale'}};

test('A1: duplicate edge identities are rejected independently of endpoint validity', () => {
    assert.throws(() => validateGraph([change, reason], [edge, {...edge, version: 'before'}]), /relation.*identity|duplicate.*relation/);
    assert.throws(() => validateGraph([{...change, edges: [edge]}, reason], [edge]), /relation.*identity/);
});

test('A1: actual Before/After construction facts have distinct identities and intact witnesses', async () => {
    const {graph} = await prepared;
    const ids = graph.relations.map(relation => relation.id);
    assert.equal(new Set(ids).size, ids.length);
    const relations = graph.relations.filter(relation => relation.relation === 'constructs');
    assert.equal(relations.length, 22);
    assert.ok(relations.every(relation => relation.data.sourceEvidence));
    assert.equal(relations.filter(relation => relation.version === 'before').length, 14);
    assert.equal(relations.filter(relation => relation.version === 'after').length, 8);
});

test('A2: every native edited row is reachable from File disclosure without unit pagination', async () => {
    const {facts, graph} = await prepared;
    const session = createGraphSession(graph);
    let checked = 0;
    for (const native of facts.files) {
        const entity = collectEntities(graph.entities).find(entity => entity.kind === 'file' && entity.data.path === native.path)!;
        const opened = session.inspect(entity.id, true);
        const projected = opened.view.nodes.find(node => node.id === entity.id)!;
        assert.equal(projected.ui.sourceControl, true, native.path);
        assert.equal(projected.ui.sourceOpen, true, native.path);
        assert.equal(opened.limits[entity.id], undefined, 'file disclosure must not expand structural units');
        const available = new Set(projected.ui.sourceReading!.hunks.flatMap(hunk => hunk.rows
            .filter(row => row.kind !== 'context').map(row => JSON.stringify([row.kind, row.kind === 'add' ? row.afterLine : row.beforeLine, row.text]))));
        let before = 0, after = 0;
        for (const line of native.patch!.split('\n')) {
            const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
            if (hunk) { before = Number(hunk[1]); after = Number(hunk[2]); continue; }
            if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('\\')) continue;
            if (line.startsWith(' ')) { before++; after++; }
            else if (line.startsWith('+') || line.startsWith('-')) {
                const kind = line[0] === '+' ? 'add' : 'remove';
                const number = kind === 'add' ? after++ : before++;
                assert.ok(available.has(JSON.stringify([kind, number, line.slice(1) + '\n'])), native.path + ':' + number);
                checked++;
            }
        }
        assert.equal(opened.inspect(entity.id, false).view.nodes.find(node => node.id === entity.id)!.ui.sourceOpen, false);
    }
    assert.equal(checked, 684);
});

test('A3: attributed interpretation requires evidence and the declared endpoint kinds', () => {
    assert.equal(validateEnrichment(facts, [change, file], {nodes: [reason, goal], edges: [edge]}, [source]).nodes.length, 2);
    for (const node of [
        {...reason, data: {basis: 'trust me'}},
        {...reason, data: {...reason.data, basis: ''}},
        {...reason, data: {...reason.data, sourceRefs: [{...ref, commit: 'c'.repeat(40)}]}},
        {...reason, data: {...reason.data, sourceRefs: [{...ref, endLine: 99}]}},
    ]) assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [node], edges: []}, [source]), /enrichment/);
    assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: []}), /enrichment/);
    const bad: GraphRelation = {id: 'wrong', from: reason.id, to: file.id, version: 'comparison', relation: 'impedes', data: {basis: 'trust me'}};
    assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: [bad]}, [source]), /enrichment/);
    assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: [{...edge, data: {}}]}, [source]), /enrichment/);
    assert.throws(() => validateEnrichment(facts, [{...change, kind: 'function'}, file], {nodes: [reason], edges: [edge]}, [source]), /enrichment_relation/);
    for (const relation of ['intended_to_achieve', 'related_policy']) {
        assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: [{...edge, relation}]}, [source]), /enrichment_relation/);
    }
    assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: [edge, edge]}, [source]), /relation_identity/);
    const sourceRelation: GraphRelation = {id: edge.id, from: 'change', to: 'file', relation: 'located_in', version: 'comparison', data: {}};
    assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: [edge]}, [source], [sourceRelation]), /relation_identity/);
    assert.throws(() => validateEnrichment(facts, [change, file], {nodes: [reason], edges: [edge]}, [{...source, content: 'other bytes'}]), /enrichment_source/);

});

test('A3: direct assembly cannot inject an unsupported explanation', () => {
    const graph = prepareAppGraph(facts, 'fixture', undefined, {nodes: [{id: 'fake', kind: 'reason', data: {basis: 'trust me'}}], edges: []}, new Map());
    assert.equal(collectEntities(graph.entities).some(entity => entity.id === 'fake'), false);
    assert.ok(graph.provenance.enrichmentFailure);
    assert.ok(collectEntities(graph.entities).some(entity => entity.kind === 'file'));
});

test('A4: policy remains attributed, source-backed context without manufactured verification', async () => {
    const {graph} = await prepared;
    const session = createGraphSession(graph);
    const policy = session.view.entities.find(entity => entity.id === 'owner-http-policy')!;
    assert.ok(Array.isArray(policy.data.sourceRefs) && policy.data.sourceRefs.length > 0);
    const relation = session.view.relations.find(relation => relation.relation === 'related_policy')!;
    assert.ok(relation.ui.provenance.some(row => row.includes('docs/product/review-loop/runtime.md')));
    assert.ok(!relation.ui.provenance.includes('Source provenance unavailable'));
    assert.equal(graph.relations.some(relation => relation.relation === 'verifies_policy'), false);
});

test('A5: Assertion source remains verbatim even when substring matches an old paraphrase', () => {
    const value = "expect(ownerRequests.every(value=>value==='')).toBe(true)";
    const card = cardRows({id: 'assertion', kind: 'assertion', data: {name: value, value: [value]}});
    assert.deepEqual(card, {title: value, rows: []});
});

test('A3: assembly admission failure is unavailable, with a source-only result and retained reason', () => {
    const extracted = extractPreparedComparison(domainService.parseSnapshot({...facts, sources: [source]}));
    const result = assemblePreparedResult({status: 'ready', facts, source: extracted,
        enrichment: {nodes: [{id: 'fake', kind: 'reason', data: {basis: 'trust me'}}], edges: []}}, () => 'fixture', [source]);
    assert.equal(result.enrichmentStatus, 'unavailable');
    assert.match(String(result.graph.provenance.enrichmentFailure), /enrichment_source/);
    assert.equal(collectEntities(result.graph.entities).some(entity => entity.id === 'fake'), false);
    assert.ok(collectEntities(result.graph.entities).some(entity => entity.kind === 'file'));
});
