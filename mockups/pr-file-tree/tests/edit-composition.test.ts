import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareSourceFacts} from '../prepare-source-facts.ts';
import {prepareAppGraph} from '../prepare-app-graph.ts';
import {allEntities} from '../source-graph.ts';

test('actual screenshot documents select true minus and plus rows in the default edit preview', () => {
  for (const path of ['docs/product/architecture.md', 'docs/product/review-loop/story-and-exploration.md']) {
    const group = allEntities().find(entity => entity.data.documentPath === path)!;
    const composition = group.data.editComposition as {status:string; added:number; removed:number; rows:{kind:string;text:string}[]};
    assert.ok(composition, path);
    assert.equal(composition.status, 'change');
    assert.ok(composition.added > 0 && composition.removed > 0);
    assert.ok(composition.rows.some(row => row.kind === 'remove'));
    assert.ok(composition.rows.some(row => row.kind === 'add'));
  }
});

test('actual mixed controlled-host test exposes four removed actions plus added source independently of assertion admission', async () => {
  const facts = await prepareSourceFacts('scottchu/pr-reviewer', 'b096826e31c0927190806de91ed70b8b64aa93d8', 'e3b270e5f49a9215452b0b86702946043e979059');
  const graph = prepareAppGraph(facts, 'fixture');
  const group = graph.entities.find(entity => entity.nodes?.some(child => child.kind === 'test' && String(child.data.name).startsWith('01-A/C/F/G controlled host')))!;
  const composition = group.data.editComposition as {status:string; added:number; removed:number; rows:{kind:string; text:string; beforeLine:number|null}[]};
  assert.ok(composition);
  assert.equal(composition.status, 'change');
  assert.equal(composition.removed, 4);
  assert.ok(composition.added > 0);
  const removed = composition.rows.filter(row => row.kind === 'remove');
  assert.equal(removed.filter(row => row.text.includes('Local access token')).length, 2);
  assert.equal(removed.filter(row => row.text.includes('Open review')).length, 2);
  assert.ok(removed.every(row => row.beforeLine! >= 146 && row.beforeLine! <= 244));
  assert.ok(group.nodes!.some(child => child.kind === 'evidence' && child.data.editComposition));
});
