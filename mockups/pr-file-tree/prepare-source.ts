import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import diffs from './diffs.json' with { type: 'json' };
const files = diffs.files.map(file => {
  const read = (side: 'before' | 'after') => {
    if (!file[side].available)
      return null;
    const text = execFileSync('git', [
      'show', `${file[side].commit}:${file.path}`
    ], {
      encoding: 'utf8'
    });
    if (createHash('sha256').update(text).digest('hex') !== file[side].hash)
      throw new Error(`source_hash_mismatch:${file.path}:${side}`);
    return text;
  };
  return {
    path: file.path,
    before: read('before'),
    after: read('after')
  };
});
writeFileSync(new URL('./full-source.json', import.meta.url), JSON.stringify({
  base: diffs.base,
  head: diffs.head,
  provenance: 'Full Git source bytes, hashes verified against the unchanged native diff fixture',
  files
}));
console.log(JSON.stringify({
  files: files.length,
  sides: files.reduce((n, f) => n + Number(f.before !== null) + Number(f.after !== null), 0)
}));
