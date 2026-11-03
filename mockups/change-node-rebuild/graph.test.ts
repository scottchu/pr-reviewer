import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {createSingleChangeModel} from './graph-model.ts';
import {selectedReaderInputs} from './selected-reader-inputs.ts';
import sample from './change-sample.json' with {type:'json'};

test('graph prototype has one canonical node, no edges and no automatic camera/layout ownership', () => {
    const model = createSingleChangeModel();
    assert.equal(model.nodes.length,1);
    assert.equal(model.nodes[0]!.id,sample.id);
    assert.equal(model.nodes[0]!.dragHandle,'.graph-card-handle');
    assert.deepEqual(model.nodes[0]!.position,{x:16,y:16});
    assert.deepEqual(model.edges,[]);
    assert.deepEqual(model.viewport,{x:0,y:0,zoom:1});
    const source = readFileSync('mockups/change-node-rebuild/GraphProbe.tsx','utf8');
    assert.ok(source.includes('defaultNodes={model.nodes}'));
    assert.ok(source.includes('autoPanOnNodeFocus={false}'));
    assert.ok(source.includes('deleteKeyCode={null}'));
    assert.ok(source.includes('zoomOnDoubleClick={false}'));
    assert.ok(!/onNodesChange|useNodesState|ResizeObserver|requestAnimationFrame|setViewport|<ViewportScene|fitView=/.test(source));
});

test('graph node reuses the exact reading card with inner gesture/keyboard boundaries', async () => {
    const server = await createServer({configFile:false,root:process.cwd(),plugins:[selectedReaderInputs()],server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true}});
    try {
        const {ChangeNodeView} = await server.ssrLoadModule('/mockups/change-node-rebuild/GraphProbe.tsx');
        const markup = renderToStaticMarkup(React.createElement(ChangeNodeView));
        assert.equal((markup.match(/<article/g) ?? []).length,1);
        assert.ok(markup.includes(sample.id));
        assert.ok(markup.includes('graph-card-reading nodrag nopan nowheel'));
        assert.ok(markup.includes('graph-card-handle'));
        assert.equal((markup.match(/data-test-id=/g) ?? []).length,3);
        const source = readFileSync('mockups/change-node-rebuild/GraphProbe.tsx','utf8');
        assert.ok(source.includes('onKeyDown={event=>event.stopPropagation()}'));
        assert.ok(source.includes('onClick={event=>event.stopPropagation()}'));
        assert.ok(!source.includes('onPointerDown='));
    } finally {await server.close();}
});
