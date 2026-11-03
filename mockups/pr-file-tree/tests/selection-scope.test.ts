import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scopeSelectionSegments, continuousSegments} from '../continuous.ts';
import diffs from '../diffs.json' with {type: 'json'};
import sources from '../full-source.json' with {type: 'json'};

const scope = {before: [{startLine:61,endLine:64}], after:[{startLine:61,endLine:67}]};
test('a selection clips the intersecting native hunk and every expandable context row', () => {
    const file = diffs.files.find(file => file.path === 'src/server/public.ts')!;
    const source = sources.files.find(file => file.path === 'src/server/public.ts')!;
    const original = continuousSegments(file, source);
    const snapshot = JSON.stringify(original);
    const selected = scopeSelectionSegments(original, scope);
    const rows = selected.flatMap(segment => segment.rows);
    assert.equal(rows.filter(row => row.kind === 'added').length, 5);
    assert.equal(rows.filter(row => row.kind === 'removed').length, 2);
    assert.equal(rows.length, 9);
    for (const row of rows) {
        if (row.beforeLine !== null) assert.ok(row.beforeLine >=61 && row.beforeLine <=64);
        if (row.afterLine !== null) assert.ok(row.afterLine >=61 && row.afterLine <=67);
    }
    assert.ok(!selected.some(segment => segment.kind === 'fold'));
    assert.ok(!rows.some(row => row.text.includes('/api/story/commands')));
    assert.equal(JSON.stringify(original), snapshot);
    assert.equal(selected[0]!.index, 0);
});
test('strict selection admits added-only witnesses and rejects context with an out-of-range counterpart', () => {
    const segments = [{id:'native:0',kind:'hunk' as const,index:0,label:'native',rows:[
        {kind:'added',beforeLine:null,afterLine:9,text:'added'},
        {kind:'context',beforeLine:8,afterLine:9,text:'other side excluded'},
        {kind:'removed',beforeLine:8,afterLine:null,text:'removed'},
    ]}];
    const selected = scopeSelectionSegments(segments,{before:[],after:[{startLine:9,endLine:9}]});
    assert.deepEqual(selected[0]!.rows.map(row=>row.text), ['added']);
    assert.deepEqual(scopeSelectionSegments(segments,{before:[],after:[]}), []);
});
