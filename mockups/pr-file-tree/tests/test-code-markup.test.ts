import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {sourceGraph} from '../source-graph.ts';
import {createGraphSession} from '../../../src/review-graph/ui/session.ts';
import {changeEditSyntaxLine} from '../change-edit-syntax.ts';
import type {SourceEditNodeUI, SourceSyntaxUI} from '../../../src/review-graph/ui/types.ts';

test('Test-only React code markup renders every literal row, newline and syntax span', async () => {
    const server = await createServer({configFile: false, optimizeDeps: {noDiscovery: true, include: []}, server: {middlewareMode: true, hmr: false}});
    try {
        const {SourceEditCode} = await server.ssrLoadModule('/src/review-graph/ui/components/SourceEditCode.tsx') as {SourceEditCode: React.ComponentType<{edit: SourceEditNodeUI; syntax: SourceSyntaxUI}>};
        for (const entity of createGraphSession(sourceGraph).view.entities.filter(entity => entity.ui.sourceEdit)) {
            const edit = entity.ui.sourceEdit!, html = renderToStaticMarkup(React.createElement(SourceEditCode, {edit, syntax: changeEditSyntaxLine}));
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


test('actual React Test connector renders directed SVG path and endpoints without an explanation card', async () => {
    const server = await createServer({configFile: false, optimizeDeps: {noDiscovery: true, include: []}, server: {middlewareMode: true, hmr: false}});
    try {
        const {ChangeEditConnection} = await server.ssrLoadModule('/src/review-graph/ui/components/ChangeEditConnection.tsx');
        const path = 'M300,200 Q400,300 500,400';
        const html = renderToStaticMarkup(React.createElement(ChangeEditConnection, {id: 'edit-route', source: 'test', target: 'removed', path, markerEnd: 'url(#arrow)', measureOnly: false}));
        assert.match(html, /data-test-edit-source="test"/); assert.match(html, /data-test-edit-target="removed"/);
        assert.match(html, /data-source-port="bottom"/); assert.match(html, /data-target-port="top"/);
        assert.ok(html.includes('d="' + path + '"')); assert.match(html, /marker-end="url\(#arrow\)"/);
        assert.ok(!html.includes('minimal-edge-card')); assert.ok(!html.includes('aria-hidden="true"'));
        const hidden = renderToStaticMarkup(React.createElement(ChangeEditConnection, {id: 'edit-route', source: 'test', target: 'removed', path, markerEnd: undefined, measureOnly: true}));
        assert.match(hidden, /aria-hidden="true"/); assert.match(hidden, /visibility:hidden/);
    } finally {await server.close();}
});
