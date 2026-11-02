import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lexicalColors} from '../lexical-colors.ts';
import source from '../full-source.json' with {type: 'json'};

test('template interpolation resumes lexical classification after nested expressions and templates', () => {
    const text = 'const label = `a ${ {x: `b ${value}`}.x } c ${value}`;\n// real comment\nconst count = 12;';
    const rows = lexicalColors('example.ts', text);
    assert.equal(rows.map(row => row.map(token => token.text).join('')).join('\n'), text);
    assert.deepEqual(rows[1], [{kind: 'comment', text: '// real comment'}]);
    assert.ok(rows[2]!.some(token => token.kind === 'keyword' && token.text === 'const'));
    assert.ok(rows[2]!.some(token => token.kind === 'number' && token.text === '12'));
});

test('gateway comment and local-owner declaration after a template retain real lexical kinds', () => {
    const file = source.files.find(file => file.path === 'src/server/public.ts')!;
    const text = file.after!;
    const rows = lexicalColors(file.path, text);
    assert.ok(rows[63]!.some(token => token.kind === 'comment' && token.text.startsWith('// Network reachability')));
    assert.ok(rows[65]!.some(token => token.kind === 'keyword' && token.text === 'const'));
    assert.equal(rows.map(row => row.map(token => token.text).join('')).join('\n'), text);
});
