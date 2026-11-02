import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
import {selectedReaderInputs, selectedDiffs, selectedSource, selectedContext, selectedSyntax, selectedPath} from './selected-reader-inputs.ts';
import fullDiffs from '../pr-file-tree/diffs.json' with {type: 'json'};
import fullSource from '../pr-file-tree/full-source.json' with {type: 'json'};
import fullContext from '../pr-file-tree/function-context.json' with {type: 'json'};
import fullSyntax from '../pr-file-tree/syntax.json' with {type: 'json'};

test('selected reader build inputs preserve exact file data, metadata and both token arrays', () => {
    for (const [selected, complete] of [[selectedDiffs, fullDiffs], [selectedSource, fullSource], [selectedContext, fullContext]] as const) {
        assert.equal(selected.files.length, 1);
        assert.deepEqual(selected.files, complete.files.filter(file => file.path === selectedPath));
        const {files: _selected, ...metadata} = selected;
        const {files: _all, ...original} = complete;
        assert.deepEqual(metadata, original);
    }
    assert.deepEqual(Object.keys(selectedSyntax).sort(), [selectedPath + ':after', selectedPath + ':before']);
    for (const key of Object.keys(selectedSyntax)) assert.deepEqual(selectedSyntax[key], fullSyntax[key as keyof typeof fullSyntax]);
});

test('Unified and Split use the shared reader with exact source rows and nonplain syntax tokens', async () => {
    const server = await createServer({configFile: false, root: process.cwd(), plugins: [selectedReaderInputs()], server: {middlewareMode: true, hmr: false}, optimizeDeps: {noDiscovery: true}});
    try {
        const {SharedDiff} = await server.ssrLoadModule('/mockups/change-node-rebuild/SharedDiff.tsx');
        const {fileDiffs} = await server.ssrLoadModule('/mockups/pr-file-tree/file-diff.tsx');
        assert.equal(fileDiffs.size, 1);
        for (const mode of ['unified', 'split']) {
            const markup = renderToStaticMarkup(React.createElement(SharedDiff, {initialMode: mode}));
            assert.ok(markup.includes(`continuous-reader ${mode}`));
            assert.ok(markup.includes('syntax-keyword'));
            assert.ok(markup.includes('syntax-string'));
            assert.ok(markup.includes('syntax-comment'));
            assert.ok(markup.includes('data-before-line="62"'));
            assert.ok(markup.includes('data-after-line="66"'));
            assert.ok(markup.includes('data-source-text="      const access=authorization===undefined?store.localOwner:authorization.slice(7);"'));
            assert.ok(markup.includes('b096826') && markup.includes('e3b270e'));
        }
        const css = readFileSync('mockups/pr-file-tree/syntax-colors.css', 'utf8');
        assert.ok(css.includes('.syntax-keyword { color: #d5b8f0; }'));
        assert.ok(css.includes('.syntax-string { color: #ead5a2; }'));
        assert.ok(!readFileSync('mockups/pr-file-tree/style.css', 'utf8').includes('.source-code .syntax-keyword {'));
    } finally {await server.close();}
});
