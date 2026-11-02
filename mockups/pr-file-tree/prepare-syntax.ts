import source from './full-source.json' with {type: 'json'};
import {writeFileSync} from 'node:fs';
import {lexicalColors, type LexicalToken} from './lexical-colors.ts';

const output: Record<string, LexicalToken[][]> = {};
for (const file of source.files) {
    if (!/\.(?:[cm]?[jt]sx?|json)$/.test(file.path)) continue;
    for (const side of ['before', 'after'] as const) {
        const text = file[side];
        if (text !== null) output[`${file.path}:${side}`] = lexicalColors(file.path, text);
    }
}
writeFileSync(new URL('./syntax.json', import.meta.url), JSON.stringify(output));
console.log(`Prepared exact lexical colors for ${Object.keys(output).length} source sides`);
