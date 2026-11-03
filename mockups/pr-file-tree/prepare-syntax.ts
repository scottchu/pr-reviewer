import graph from './generated-source-graph.json' with {type: 'json'};
import {collectEntities} from '../../src/review-graph/domain/validation.ts';
import type {SourceGraph} from '../../src/review-graph/domain/types.ts';
import type {EditComposition} from '../../src/review-graph/domain/edit-composition.ts';
import source from './full-source.json' with {type: 'json'};
import {writeFileSync} from 'node:fs';
import {lexicalColors} from './lexical-colors.ts';
const output: Record<string, ReturnType<typeof lexicalColors>> = {};
for (const file of source.files) {
    if (!/\.(?:[cm]?[jt]sx?|json)$/.test(file.path)) continue;
    for (const side of ['before', 'after'] as const) {
        const text = file[side];
        if (text !== null) output[`${file.path}:${side}`] = lexicalColors(file.path, text);
    }
}
writeFileSync(new URL('./syntax.json', import.meta.url), JSON.stringify(output));
console.log(`Prepared exact lexical colors for ${Object.keys(output).length} source sides`);

const edited: Record<string, ReturnType<typeof lexicalColors>[number]> = {};
for (const entity of collectEntities((graph as unknown as SourceGraph).entities).filter(entity => entity.kind === 'function' || entity.kind === 'test')) {
    const composition = entity.data.editComposition as EditComposition | undefined;
    for (const hunk of composition?.hunks ?? []) for (const row of hunk.rows) {
        if (row.kind === 'context') continue;
        const witness = row.kind === 'remove' ? hunk.before : hunk.after;
        const side = row.kind === 'remove' ? 'before' : 'after';
        const line = row.kind === 'remove' ? row.beforeLine : row.afterLine;
        if (!witness || line === null) continue;
        const text = row.text.replace(/\r?\n$/, '');
        const tokens = output[`${witness.path}:${side}`]?.[line - 1];
        edited[`${witness.path}:${side}:${line}`] = tokens?.map(token => token.text).join('') === text ? tokens : [{kind: 'plain', text}];
    }
}
writeFileSync(new URL('./edit-syntax.json', import.meta.url), JSON.stringify(edited));
console.log(`Prepared compact colors for ${Object.keys(edited).length} actual edited source rows`);
