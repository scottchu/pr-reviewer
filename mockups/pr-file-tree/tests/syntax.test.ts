import test from 'node:test';
import assert from 'node:assert/strict';
import fullSource from '../full-source.json' with { type: 'json' };
import { syntaxLine } from '../syntax.ts';

test('lexical colors preserve every source character and line coordinate', () => {
  for (const file of fullSource.files) for (const side of ['before', 'after'] as const) {
    const source = file[side];
    if (source === null) continue;
    for (const [index, text] of source.split('\n').entries()) {
      assert.equal(syntaxLine(file.path, side, index + 1, text).map(token => token.text).join(''), text);
    }
  }
});

test('added access source has distinct real keywords, strings and comments without inventing text', () => {
  const source = fullSource.files.find(file => file.path === 'src/storage/access.ts')!.after!;
  const kinds = new Set(source.split('\n').flatMap((line, index) => syntaxLine('src/storage/access.ts', 'after', index + 1, line).map(token => token.kind)));
  for (const kind of ['keyword', 'string', 'comment', 'plain']) assert.ok(kinds.has(kind));
  assert.deepEqual(syntaxLine('src/storage/access.ts', 'before', null, ''), [{ kind: 'plain', text: '' }]);
});
