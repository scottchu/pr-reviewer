import {test} from 'node:test';
import {createHash} from 'node:crypto';
import oracle from './source-pipeline-oracle.json' with {type: 'json'};
import assert from 'node:assert/strict';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import {sourceHash} from '../../../src/review-graph/domain/hash.ts';
import {collectEntities} from '../../../src/review-graph/domain/validation.ts';
import type {FactDocument, GraphRelation, SourceInput} from '../../../src/review-graph/domain/types.ts';
import {prepareAppGraph} from '../../../src/review-graph/preparation/pr25.ts';
import {prepareReviewComparison} from '../../../src/review-graph/preparation/run.ts';
import {preparedTests} from '../prepared-test-coverage.ts';
import {edgeRows} from '../../../src/review-graph/ui/content.ts';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import {projectExperience} from '../../../src/review-graph/ui/projection.ts';
import {projectChangeFilter} from '../../../src/review-graph/ui/change-filter.ts';

const matchingTitle = 'single local owner reads and writes without a Bearer';
const fixture = (name: string, reference: boolean) => {
    const content = "import {test} from 'node:test';\nimport assert from 'node:assert/strict';\n" +
        (reference ? '// SU-A/B/C: docs/product/review-loop/runtime.md single-local-owner policy\n' : '') +
        `test('${name}', () => { assert.equal(1, 1); });\n`;
    const source: SourceInput = {repository: 'example/repo', side: 'head', path: 'tests/gateway.test.ts',
        commit: 'b'.repeat(40), gitBlob: 'c'.repeat(40), contentHash: sourceHash(content), content};
    const patch = '@@ -0,0 +1,' + content.trimEnd().split('\n').length + ' @@\n' +
        content.trimEnd().split('\n').map(line => '+' + line).join('\n') + '\n';
    const facts: FactDocument = {format: 'fixture', repository: source.repository, base: 'a'.repeat(40), head: source.commit,
        producer: {version: 'fixture', parser: 'typescript', sourceHashes: {}}, contextFiles: [], coverage: {},
        files: [{id: 'gateway-file', path: source.path, nativeStatus: 'A', comparisonStatus: 'add', patch, patchHash: sourceHash(patch),
            sides: [{side: 'head', commit: source.commit, available: true, contentHash: source.contentHash}]}],
        units: domainService.extractSource(domainService.parseSnapshot({format: 'fixture', repository: source.repository,
            base: 'a'.repeat(40), head: source.commit, producer: {version: 'fixture', parser: 'typescript', sourceHashes: {}},
            files: [], contextFiles: [], sources: [source], coverage: {}}).sources[0]!),
    };
    return {facts, source};
};

for (const [name, reference] of [[matchingTitle, false], [matchingTitle, true], ['renamed owner assertions', true]] as const) {
    test(`title/reference cannot manufacture policy verification: ${name}, reference=${reference}`, () => {
        const {facts, source} = fixture(name, reference);
        const compiled = domainService.compare(facts);
        const before = JSON.stringify({facts, compiled});
        // A policy context node can legitimately exist independently of this test.
        // Its presence must not unlock post-admission title-based verification.
        const graph = prepareAppGraph(facts, sourceHash(JSON.stringify(facts)), compiled,
            {nodes: [{id: 'owner-http-policy', kind: 'behavior', data: {name: 'Retained policy context'}}], edges: []});
        assert.equal(JSON.stringify({facts, compiled}), before);
        assert.deepEqual(graph.relations.filter(edge => edge.to === 'owner-http-policy'), []);
        assert.equal(graph.relations.some(edge => /verif|policy|pass|run/i.test(edge.relation)), false);
        const contains = compiled.relations.filter(edge => edge.relation === 'contains' &&
            compiled.entities.find(entity => entity.id === edge.from)?.kind === 'test');
        assert.equal(contains.length, 1);
        const all = collectEntities(graph.entities);
        for (const relation of contains) {
            assert.deepEqual(graph.relations.find(edge => edge.id === relation.id), relation);
            const assertion = all.find(entity => entity.id === relation.to)!;
            const unit = facts.units.find(unit => unit.kind === 'assertion')!;
            assert.equal(assertion.kind, 'assertion');
            assert.ok(source.content.slice(unit.anchor.start, unit.anchor.end).includes('assert.equal(1, 1)'));
            assert.equal(unit.anchor.commit, source.commit);
            assert.equal(unit.anchor.contentHash, sourceHash(source.content));
            assert.deepEqual(assertion.data.occurrences, compiled.entities.find(entity => entity.id === assertion.id)!.data.occurrences);
        }
        assert.equal(all.some(entity => /pass|testrun/i.test(entity.kind)), false);
    });
}

test('actual pinned active preparation keeps assertions, source and attributed policy context without verification', async () => {
    const {facts, graph} = await prepareReviewComparison('scottchu/pr-reviewer',
        'b096826e31c0927190806de91ed70b8b64aa93d8', 'e3b270e5f49a9215452b0b86702946043e979059', facts => sourceHash(JSON.stringify(facts)));
    assert.equal(graph.relations.some(edge => edge.relation === 'verifies_policy'), false);
    const compiled = domainService.compare(facts);
    const contains = compiled.relations.filter(edge => edge.relation === 'contains' &&
        compiled.entities.find(entity => entity.id === edge.from)?.kind === 'test');
    assert.ok(contains.length > 0);
    for (const edge of contains) assert.deepEqual(graph.relations.find(candidate => candidate.id === edge.id), edge);
    assert.ok(graph.relations.some(edge => edge.relation === 'related_policy'));
    assert.ok(graph.relations.some(edge => edge.relation === 'motivated_by'));
    assert.ok(graph.relations.some(edge => edge.relation === 'intended_to_achieve'));
    const gateway = facts.units.find(unit => unit.kind === 'test' && unit.name.includes(matchingTitle))!;
    assert.equal(gateway.anchor.path, 'tests/gateway.test.ts');
    assert.equal(gateway.anchor.commit, facts.head);
    assert.equal(gateway.anchor.startLine, 90);
    assert.equal(gateway.anchor.endLine, 114);
});

test('maintained legacy graph removes only policy verification and retains explicit assertion witnesses', () => {
    assert.equal(preparedTests.edges.some(edge => edge.relation === 'verifies_policy'), false);
    const group = preparedTests.nodes.find(entity => entity.id === 'gateway-policy-test-change')!;
    const contains = group.edges!.find(edge => edge.relation === 'contains')!;
    const assertion = group.nodes!.find(entity => entity.id === contains.to)!;
    assert.deepEqual(contains.data.sourceEvidence, assertion.data.occurrences);
    assert.equal((assertion.data.occurrences as unknown[]).length, 3);
    assert.equal(assertion.data.execution, 'not run');
    assert.ok(preparedTests.edges.some(edge => edge.relation === 'related_policy'));
    const restored = JSON.parse(JSON.stringify(preparedTests));
    const legacy = oracle.policyEdgeRemoval.legacy;
    restored.edges.splice(legacy.index, 0, legacy.relation);
    const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ?
        Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => [key, stable(value)])) : value;
    assert.equal(createHash('sha256').update(JSON.stringify(stable(restored))).digest('hex'), legacy.digest,
        'restoring only the retired edge must recover the entire legacy fixture, including witnesses and unrelated edges');
});

test('retained pre-cleanup graphs remain readable without regenerating or promoting their historical edge', () => {
    const retained: GraphRelation = {id: 'retained:policy', from: 'test', to: 'policy', version: 'after', relation: 'verifies_policy',
        data: {basis: 'Historical prepared source interpretation', execution: 'not run'}};
    const rows = edgeRows(retained);
    assert.match(rows.explanation, /Prepared source assertions/);
    assert.ok(rows.scope.includes('Not client helper coverage or goal proof'));
    const view = projectExperience(experienceService.openComparison({entities: [
        {id: 'test', kind: 'test', data: {name: 'retained test', comparisonStatus: 'add'}},
        {id: 'policy', kind: 'behavior', data: {name: 'retained policy'}},
    ], relations: [retained], fileUnits: {}, groupFor: {}, initialVisible: ['test', 'policy'], unresolved: [], provenance: {repository: 'retained/repo', base: 'a'.repeat(40), head: 'b'.repeat(40)}}));
    assert.deepEqual(projectChangeFilter(view, true).relationIds, [retained.id]);
    assert.deepEqual(view.relations.map(({ui, ...edge}) => edge), [retained]);
});
