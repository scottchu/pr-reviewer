import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {testEditSyntaxLine} from '../test-edit-syntax.ts';
import type {SourceEditNodeUI, SourceSyntaxUI} from '../../../src/review-graph/ui/types.ts';

test('Test-only React code markup renders every literal row, newline and syntax span', async () => {
    const server = await createServer({configFile: false, optimizeDeps: {noDiscovery: true, include: []}, server: {middlewareMode: true, hmr: false}});
    try {
        const {SourceEditCode} = await server.ssrLoadModule('/src/review-graph/ui/components/SourceEditCode.tsx') as {SourceEditCode: React.ComponentType<{edit: SourceEditNodeUI; syntax: SourceSyntaxUI}>};
        for (const entity of createGraphSession(sourceGraph).view.entities.filter(entity => entity.ui.sourceEdit)) {
            const edit = entity.ui.sourceEdit!, html = renderToStaticMarkup(React.createElement(SourceEditCode, {edit, syntax: testEditSyntaxLine}));
            const rows = [...html.matchAll(/<code data-source-line="(\d+)" data-source-hunk="(\d+)">([\s\S]*?)<\/code>/g)];
            assert.equal(rows.length, edit.rows.length);
            for (const [index, row] of edit.rows.entries()) {
                assert.equal(Number(rows[index]![1]), row.line); assert.equal(Number(rows[index]![2]), row.hunkIndex);
                assert.equal(rows[index]![3]!.replace(/<[^>]*>/g, ''), renderToStaticMarkup(React.createElement('code', null, row.text)).slice(6, -7));
            }
            if (edit.rows.some(row => row.text.includes('const '))) assert.match(html, /syntax-keyword/);
        }
    } finally {await server.close();}
});
