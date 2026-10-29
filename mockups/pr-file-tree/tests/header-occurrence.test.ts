import {test} from 'node:test';
import assert from 'node:assert/strict';
import {domainService} from '../../../src/review-graph/domain/service.ts';
import {cardRows} from '../../../src/review-graph/ui/content.ts';
import {projectExperience} from '../../../src/review-graph/ui/projection.ts';
import {experienceService} from '../../../src/review-graph/experience/service.ts';
import {sourceHash} from '../../../src/review-graph/domain/hash.ts';
import {prepareReviewComparison} from '../../../src/review-graph/preparation/run.ts';
import type {FactDocument, SourceInput} from '../../../src/review-graph/domain/types.ts';

const before = "import {accessHeaders} from './headers.ts';\nexport const request = (captured: string) => {\n  return fetch('/', {headers: {Authorization: `Bearer ${captured}`}});\n};\n";
const after = "import {accessHeaders} from './headers.ts';\nexport const request = (captured: string) => {\n  return fetch('/', {headers: accessHeaders(captured)});\n};\n";
const helper = 'export const accessHeaders = (credential: string) => ({Authorization: `Bearer ${credential}`});\n';
const fixture = (): FactDocument => {
    const patch = "@@ -1,4 +1,4 @@\n import {accessHeaders} from './headers.ts';\n export const request = (captured: string) => {\n-  return fetch('/', {headers: {Authorization: `Bearer ${captured}`}});\n+  return fetch('/', {headers: accessHeaders(captured)});\n };\n";
    const source = (path: string, side: 'base' | 'head', content: string): SourceInput => ({
        repository: 'example/refactor', path, side, content, contentHash: sourceHash(content),
        commit: (side === 'base' ? 'a' : 'b').repeat(40), gitBlob: 'c'.repeat(40),
    });
    const inputs = [source('src/request.ts', 'base', before), source('src/request.ts', 'head', after),
        source('src/headers.ts', 'base', helper), source('src/headers.ts', 'head', helper)];
    const sides = (path: string) => inputs.filter(input => input.path === path).map(input => ({
        side: input.side, commit: input.commit, available: true, contentHash: input.contentHash,
    }));
    return {
        format: 'pinned-source-structural-facts-v1', repository: 'example/refactor', base: 'a'.repeat(40), head: 'b'.repeat(40),
        producer: {version: 'fixture', parser: 'typescript', sourceHashes: {}}, coverage: {},
        files: [{id: 'request-file', path: 'src/request.ts', nativeStatus: 'M', comparisonStatus: 'change', patch, patchHash: sourceHash(patch), sides: sides('src/request.ts')}],
        contextFiles: [{id: 'helper-file', path: 'src/headers.ts', comparisonStatus: 'no change', scope: 'fixture source context', sides: sides('src/headers.ts')}],
        units: inputs.flatMap(input => domainService.extractSource(domainService.parseSnapshot({
            format: 'fixture', producer: {version: 'fixture', parser: 'typescript', sourceHashes: {}}, repository: input.repository,
            base: 'a'.repeat(40), head: 'b'.repeat(40), files: [], contextFiles: [], sources: [input], coverage: {},
        }).sources[0]!)),
    };
};

test('inline-to-helper refactor removes one property construction while retaining the separate After call', () => {
    const facts = fixture();
    const graph = domainService.compare(facts);
    const header = graph.entities.find(entity => entity.kind === 'header')!;
    const occurrence = facts.units.find(unit => unit.kind === 'header')!;
    assert.equal(header.data.comparisonStatus, 'remove');
    assert.deepEqual(header.data.occurrences, [{canonicalId: occurrence.id, anchor: occurrence.anchor}]);
    assert.equal(occurrence.anchor.contentHash, sourceHash(before));
    const card = cardRows(header);
    assert.equal(card.title, 'Authorization property construction');
    assert.equal(card.rows[0], 'Removed source occurrence');
    assert.ok(card.rows.includes('Before aaaaaaa · src/request.ts · L3'));
    assert.ok(card.rows.includes('Direct headers.Authorization construction only'));
    assert.doesNotMatch(card.rows.join(' '), /globally removed|helper (?:returns|produces)/i);
    const constructs = graph.relations.find(edge => edge.relation === 'constructs')!;
    assert.equal(constructs.to, header.id);
    assert.equal(constructs.version, 'before');
    assert.deepEqual(constructs.data.sourceEvidence, occurrence.anchor);
    const call = graph.relations.find(edge => edge.relation === 'calls' && edge.version === 'after')!;
    assert.ok(call);
    const sites = call.data.sourceCalls as {site: {sourceText: string; anchor: {side: string; startLine: number; contentHash: string}}}[];
    assert.equal(sites[0]!.site.sourceText, 'accessHeaders(captured)');
    assert.equal(sites[0]!.site.anchor.side, 'head');
    assert.equal(sites[0]!.site.anchor.startLine, 3);
    assert.equal(sites[0]!.site.anchor.contentHash, sourceHash(after));
    // The retained helper syntax contains the same property name; no system-wide absence follows.
    assert.ok(facts.units.some(unit => unit.kind === 'function' && unit.anchor.path === 'src/headers.ts' && unit.sourceText.includes('Authorization')));
});

test('header construction without a witness reports identity unavailable, never invents Before coordinates', () => {
    const card = cardRows({id: 'missing', kind: 'header', data: {name: 'Authorization', comparisonStatus: 'remove'}});
    assert.equal(card.title, 'Authorization property construction');
    assert.ok(card.rows.includes('Source occurrence identity unavailable'));
    assert.doesNotMatch(card.rows.join(' '), /Before [a-f0-9]|L0/);
});

test('actual PR25 default projection names the exact removed construction and independent After call', async () => {
    const prepared = await prepareReviewComparison('scottchu/pr-reviewer', 'b096826e31c0927190806de91ed70b8b64aa93d8', 'e3b270e5f49a9215452b0b86702946043e979059', facts => sourceHash(JSON.stringify(facts)));
    const view = projectExperience(experienceService.openComparison(prepared.graph));
    const header = view.entities.find(entity => entity.id === 'header-value')!;
    assert.equal(header.ui.status, 'remove');
    assert.equal(header.ui.card.title, 'Authorization property construction');
    assert.equal(header.ui.card.rows[0], 'Removed source occurrence');
    assert.ok(header.ui.card.rows.includes('Direct request construction only'));
    assert.ok(header.ui.card.rows.includes('Before b096826 · src/application/review.ts · L29'));
    const call = view.relations.find(edge => edge.from === 'request' && edge.relation === 'calls')!;
    assert.match(call.ui.explanation, /accessHeaders\(captured\)/);
    assert.ok(call.ui.provenance.includes('After e3b270e · src/application/review.ts · L30'));
});
