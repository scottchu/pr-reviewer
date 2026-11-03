import graph from './generated-source-graph.json' with {type: 'json'};
import source from './full-source.json' with {type: 'json'};
import {writeFileSync} from 'node:fs';
import {collectEntities} from '../../src/review-graph/domain/validation.ts';
import type {SourceGraph} from '../../src/review-graph/domain/types.ts';
import type {EditComposition} from '../../src/review-graph/domain/edit-composition.ts';
import {lexicalColors} from './lexical-colors.ts';

// Prepare only Test edit colors; never rewrite the existing full-reader index.
const colors = new Map<string, ReturnType<typeof lexicalColors>>();
const edited: Record<string, ReturnType<typeof lexicalColors>[number]> = {};
for (const entity of collectEntities((graph as unknown as SourceGraph).entities).filter(entity => entity.kind === 'test')) {
    const composition = entity.data.editComposition as EditComposition | undefined;
    for (const hunk of composition?.hunks ?? []) for (const row of hunk.rows) {
        if (row.kind === 'context') continue;
        const witness = row.kind === 'remove' ? hunk.before : hunk.after;
        const side = row.kind === 'remove' ? 'before' : 'after';
        const line = row.kind === 'remove' ? row.beforeLine : row.afterLine;
        if (!witness || line === null) continue;
        const key = `${witness.path}:${side}`;
        if (!colors.has(key)) {
            const text = source.files.find(file => file.path === witness.path)?.[side];
            colors.set(key, text === null || text === undefined ? [] : lexicalColors(witness.path, text));
        }
        const text = row.text.replace(/\r?\n$/, ''), tokens = colors.get(key)?.[line - 1];
        edited[`${key}:${line}`] = tokens?.map(token => token.text).join('') === text ? tokens : [{kind: 'plain', text}];
    }
}
writeFileSync(new URL('./test-edit-syntax.json', import.meta.url), JSON.stringify(edited));
console.log(`Prepared colors for ${Object.keys(edited).length} actual Test edit rows; existing syntax index untouched`);
