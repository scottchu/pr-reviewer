import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {syntaxLine} from '../syntax.ts';
import type {SourceSyntaxUI} from '../../../src/review-graph/ui/types.ts';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import type {SourceEditNodeUI} from '../../../src/review-graph/ui/types.ts';

test('shared React source code markup contains all actual rows, coordinates and syntax tokens', async () => {
    const server = await createServer({configFile: false, server: {middlewareMode: true, hmr: false}});
    try {
        const {SourceEditCode} = await server.ssrLoadModule('/src/review-graph/ui/components/SourceEditCode.tsx') as {
            SourceEditCode: React.ComponentType<{edit: SourceEditNodeUI; syntax: SourceSyntaxUI}>;
        };
        const groups = createGraphSession(sourceGraph).view.nodes.filter(entity => entity.ui.changeSource &&
            (entity.id === 'change' || entity.ui.changeSource.subjectKind === 'test'));
        for (const group of groups) for (const child of group.nodes!) {
            const edit = child.ui.sourceEdit!;
            const html = renderToStaticMarkup(React.createElement(SourceEditCode, {edit, syntax: syntaxLine}));
            const rows = [...html.matchAll(/<code data-source-line="(\d+)" data-source-hunk="(\d+)">([\s\S]*?)<\/code>/g)];
            assert.equal(rows.length, edit.rows.length);
            for (const [index, row] of edit.rows.entries()) {
                assert.equal(Number(rows[index]![1]), row.line);
                assert.equal(Number(rows[index]![2]), row.hunkIndex);
                const expected = renderToStaticMarkup(React.createElement('code', null, row.text)).slice(6, -7);
                assert.equal(rows[index]![3]!.replace(/<[^>]*>/g, ''), expected);
            }
            assert.match(html, /source-code/);
            if (edit.rows.some(row => row.text.includes('const '))) assert.match(html, /syntax-keyword/);
        }
    } finally {await server.close();}
});
