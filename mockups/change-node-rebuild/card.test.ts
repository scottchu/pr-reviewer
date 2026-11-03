import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {selectedReaderInputs} from './selected-reader-inputs.ts';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sample from './change-sample.json' with {type: 'json'};
import fullSource from '../pr-file-tree/full-source.json' with {type: 'json'};

// Source/SSR checks only. Device event/scroll/stability acceptance is separate.
test('card witnesses retain exact pinned source hashes and coordinates', () => {
    assert.equal(sample.id, 'change:unit:afc8550b00b30a9b14329f2c8de60288a39d7576a157baef11a8b978eec7b275');
    assert.equal(sample.graphSha256, '946b1c59ebde5dd8f5f3eeb2fc5f99fc7e3d6e4b4b3d5d9c9303e699ccb08a2a');
    assert.deepEqual(sample.witnesses.map(value => value.anchor.side), ['base', 'head']);
    for (const witness of sample.witnesses) {
        const anchor = witness.anchor;
        const file = fullSource.files.find(value => value.path === anchor.path);
        assert.ok(file);
        const text = anchor.side === 'base' ? file.before : file.after;
        assert.ok(text);
        assert.equal(anchor.repository, sample.repository);
        assert.equal(anchor.commit, anchor.side === 'base' ? sample.base : sample.head);
        assert.equal(createHash('sha256').update(text).digest('hex'), anchor.contentHash);
        assert.equal(createHash('sha256').update(text.slice(anchor.start, anchor.end)).digest('hex'), witness.sourceTextHash);
        assert.equal(text.slice(0, anchor.start).split('\n').length, anchor.startLine);
        assert.equal(text.slice(0, anchor.end - 1).split('\n').length, anchor.endLine);
    }
});

test('React card shows one canonical change and both witnesses and the shared highlighted diff without loading the graph', async () => {
    const server = await createServer({configFile: false, root: process.cwd(), plugins: [selectedReaderInputs()], server: {middlewareMode: true, hmr: false}, optimizeDeps: {noDiscovery: true}});
    try {
        const {ChangeCard} = await server.ssrLoadModule('/mockups/change-node-rebuild/ChangeCard.tsx');
        const markup = renderToStaticMarkup(React.createElement(ChangeCard));
        assert.equal((markup.match(/<article/g) ?? []).length, 1);
        assert.ok(markup.includes(sample.id));
        assert.ok(markup.includes('createGateway() change'));
        assert.ok(markup.includes('5 added'));
        assert.ok(markup.includes('2 removed'));
        for (const witness of sample.witnesses) assert.ok(markup.includes(witness.anchor.commit));
        assert.ok(markup.includes('Review question.'));
        assert.ok(markup.includes('pinned runtime specification'));
        assert.ok(!markup.includes('Check card response'));
        assert.ok(markup.indexOf('aria-label="Explaining"') < markup.indexOf('aria-label="Diff"'));
        assert.ok(markup.indexOf('aria-label="Diff"') < markup.indexOf('aria-label="Tests"'));
        assert.ok(markup.includes('syntax-keyword'));
        assert.ok(markup.includes('Pinned diff for src/server/public.ts'));
        assert.equal((markup.match(/data-test-id=/g) ?? []).length, 3);
        assert.equal((markup.match(/data-assertion-id=/g) ?? []).length, 29);
        assert.ok(!markup.includes('<details open'));
        assert.ok(!markup.includes('13 added'));
        const imports = readFileSync('mockups/change-node-rebuild/ChangeCard.tsx', 'utf8');
        assert.ok(!/source-graph|xyflow|ResizeObserver|Worker/.test(imports));
    } finally {await server.close();}
});
