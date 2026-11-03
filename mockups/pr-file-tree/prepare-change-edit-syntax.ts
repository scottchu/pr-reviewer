import graph from './generated-source-graph.json' with {type: 'json'};
import source from './full-source.json' with {type: 'json'};
import {writeFileSync} from 'node:fs';
import {loadChangeModel,resolveChangeEvidence} from '../../src/review-graph/domain/change-model.ts';
import type {SourceGraph} from '../../src/review-graph/domain/types.ts';
import {lexicalColors} from './lexical-colors.ts';

// Prepare shared Change edit colors; never rewrite the existing full-reader index.
const colors = new Map<string, ReturnType<typeof lexicalColors>>();
const edited: Record<string, ReturnType<typeof lexicalColors>[number]> = {};
const comparison=graph as unknown as SourceGraph;
for (const change of loadChangeModel(comparison).changes) {
    const evidence=resolveChangeEvidence(comparison,change);
    for (const [kind, rows] of [['remove',evidence?.removed??[]],['add',evidence?.added??[]]] as const) for (const row of rows) {
        const witness=row.witness, side=kind==='remove'?'before':'after', line=row.line;
        const key = `${witness.path}:${side}`;
        if (!colors.has(key)) {
            const text = source.files.find(file => file.path === witness.path)?.[side];
            colors.set(key, text === null || text === undefined ? [] : lexicalColors(witness.path, text));
        }
        const text = row.text.replace(/\r?\n$/, ''), tokens = colors.get(key)?.[line - 1];
        edited[`${key}:${line}`] = tokens?.map(token => token.text).join('') === text ? tokens : [{kind: 'plain', text}];
    }
}
writeFileSync(new URL('./change-edit-syntax.json', import.meta.url), JSON.stringify(edited));
console.log(`Prepared colors for ${Object.keys(edited).length} shared native Change edit rows; existing syntax index untouched`);
