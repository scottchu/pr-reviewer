import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeDocumentHunks} from '../native-document-comparison.ts';
import {sourceHash} from '../source-facts.ts';
import type {FactDocument} from '../compile-source-graph.ts';
import {prepareAppGraph} from '../prepare-app-graph.ts';

const file = (patch: string, status = 'change') => ({
  id: 'document', path: 'docs/a.md', comparisonStatus: status, nativeStatus: status === 'add' ? 'A' : status === 'remove' ? 'D' : 'M',
  patch, patchHash: sourceHash(patch), sides: (['base', 'head'] as const).map(side => ({
    side, commit: (side === 'base' ? 'a' : 'b').repeat(40),
    available: !(status === 'add' && side === 'base') && !(status === 'remove' && side === 'head'),
    disposition: 'text', contentHash: (side === 'base' ? 'c' : 'd').repeat(64),
  })),
}) as FactDocument['files'][number];

test('native document witnesses preserve context, header-looking payloads, ranges and missing final newlines', () => {
  const patch = '@@ -2,3 +2,3 @@\n context\n--- old heading\n+++ new heading\n tail\n' + String.fromCharCode(92) + ' No newline at end of file\n@@ -8,0 +9 @@\n+last\n';
  const hunks = nativeDocumentHunks(file(patch));
  assert.equal(hunks.length, 2);
  assert.equal(hunks[0]!.before!.text, 'context\n-- old heading\ntail');
  assert.equal(hunks[0]!.after!.text, 'context\n++ new heading\ntail');
  assert.equal(hunks[0]!.before!.startLine, 2);
  assert.equal(hunks[0]!.after!.endLine, 4);
  assert.equal(hunks[0]!.after!.contentHash, 'd'.repeat(64));
  assert.equal(hunks[1]!.before, null);
  assert.equal(hunks[1]!.after!.startLine, 9);
});

test('added and removed documents have honest absent sides; corrupt or unavailable evidence rejects', () => {
  assert.equal(nativeDocumentHunks(file('@@ -0,0 +1 @@\n+new\n', 'add'))[0]!.before, null);
  assert.equal(nativeDocumentHunks(file('@@ -1 +0,0 @@\n-old\n', 'remove'))[0]!.after, null);
  assert.throws(() => nativeDocumentHunks({...file(''), patchHash: 'wrong'}), /identity_unavailable/);
  assert.throws(() => nativeDocumentHunks(file('@@ -1,2 +1 @@\n-old\n+new\n')), /count_mismatch/);
  assert.throws(() => nativeDocumentHunks({...file('@@ -1 +1 @@\n-old\n+new\n'), sides: []}), /source_identity/);
});

test('Markdown native hunks produce one visible file-scoped Change with all evidence and no duplicate File', () => {
  const changed = file('@@ -1 +1 @@\n-old\n+new\n@@ -8 +8 @@\n-before\n+after\n');
  const facts = {format: 'fixture', producer: {}, repository: 'example/repo', base: 'a'.repeat(40), head: 'b'.repeat(40),
    files: [changed], contextFiles: [], units: [], coverage: {}} as unknown as FactDocument;
  const graph = prepareAppGraph(facts, 'fixture');
  assert.equal(graph.entities.filter(entity => entity.kind === 'file').length, 1);
  const group = graph.entities.find(entity => entity.data.documentPath === 'docs/a.md')!;
  assert.ok(group);
  assert.equal(group.kind, 'change');
  assert.equal(group.data.comparisonStatus, 'change');
  assert.equal(group.nodes!.length, 1);
  assert.deepEqual(group.nodes![0]!.data.nativeHunks, nativeDocumentHunks(changed));
  assert.ok(graph.initialVisible.includes(group.id));
  assert.ok(graph.relations.some(edge => edge.from === group.id && edge.relation === 'located_in'));
  assert.equal(JSON.stringify(facts).includes('documentPath'), false);
});


test('every pinned Markdown hunk matches exact Git blob text and source hash', async () => {
  const {prepareSourceFacts} = await import('../prepare-source-facts.ts');
  const {execFileSync} = await import('node:child_process');
  const facts = await prepareSourceFacts('scottchu/pr-reviewer', 'b096826e31c0927190806de91ed70b8b64aa93d8', 'e3b270e5f49a9215452b0b86702946043e979059');
  const documents = facts.files.filter(file => /\.md$/i.test(file.path));
  assert.equal(documents.length, 20);
  for (const document of documents) {
    const hunks = nativeDocumentHunks(document);
    assert.ok(hunks.length > 0);
    for (const hunk of hunks) for (const witness of [hunk.before, hunk.after]) {
      if (!witness) continue;
      const bytes = execFileSync('git', ['show', witness.commit + ':' + witness.path], {encoding: 'utf8'});
      assert.equal(sourceHash(bytes), witness.contentHash);
      assert.equal(bytes.split(/(?<=\n)/).slice(witness.startLine - 1, witness.endLine).join(''), witness.text);
    }
  }
});
