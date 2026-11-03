import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import ts from 'typescript-analysis';
import {createComposedPresentationState} from './presentation-state.ts';
import {sceneMembership, filterSceneMembership} from '../../src/review-graph/ui/scene-membership.ts';
import fullSource from '../pr-file-tree/full-source.json' with {type: 'json'};

// Source/SSR checks only; these are not browser or unfamiliar-reviewer acceptance.
test('complete graph preview composes real tests and the existing highlighted reader without changing canonical data', async () => {
    const server = await createServer({configFile: false, root: process.cwd(), server: {middlewareMode: true, hmr: false}, optimizeDeps: {noDiscovery: true}});
    try {
        const sample = await server.ssrLoadModule('/mockups/change-node-preview/sample.ts') as typeof import('./sample.ts');
        const component = await server.ssrLoadModule('/mockups/change-node-preview/ComposedChange.tsx') as typeof import('./ComposedChange.tsx');
        const graph = await server.ssrLoadModule('/mockups/pr-file-tree/source-graph.ts') as typeof import('../pr-file-tree/source-graph.ts');
        const sessionModule = await server.ssrLoadModule('/src/review-graph/ui/session.ts') as typeof import('../../src/review-graph/ui/session.ts');
        const diff = await server.ssrLoadModule('/mockups/pr-file-tree/file-diff.tsx') as typeof import('../pr-file-tree/file-diff.tsx');
        const before = JSON.stringify(graph.sourceGraph);
        const session = sample.sampleSession().reduce((state, id) => state.expand(id, false), sessionModule.createGraphSession(graph.sourceGraph));
        assert.equal(session.view.entities.length, graph.allEntities().length);
        assert.ok(session.view.nodes.some(entity => entity.id === sample.sampleChange.id));
        assert.equal(JSON.stringify(graph.sourceGraph), before);
        assert.deepEqual(sample.sampleTests.map(test => test.data.comparisonStatus).sort(), ['add', 'no change', 'no change']);
        assert.deepEqual(sample.sampleTests.map(test => sample.assertionsFor(test).length).sort((a, b) => a - b), [6, 7, 16]);
        const source = fullSource.files.find(file => file.path === sample.testPath)!;
        for (const testEntity of sample.sampleTests) {
            for (const {anchor} of sample.occurrences(testEntity)) {
                const text = (anchor.side === 'base' ? source.before : source.after)!;
                const ast = ts.createSourceFile(sample.testPath, text, ts.ScriptTarget.Latest, true);
                const declarations: string[] = [];
                for (const node of ast.statements) {
                    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === '../src/server/public.ts') {
                        const bindings = node.importClause?.namedBindings;
                        if (bindings && ts.isNamedImports(bindings)) declarations.push(...bindings.elements.map(value => value.name.text));
                    }
                }
                assert.ok(declarations.includes('createGateway'));
                const calls: number[] = [];
                const visit = (node: ts.Node): void => {
                    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'createGateway' && node.getStart(ast) >= anchor.start && node.end <= anchor.end) {
                        calls.push(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1);
                    }
                    ts.forEachChild(node, visit);
                };
                visit(ast);
                const reference = sample.directTestReference(testEntity).find(value => value.side === anchor.side)!;
                assert.ok(calls.includes(reference.line));
            }
        }
        const markup = renderToStaticMarkup(React.createElement(component.ComposedChange, {entity: sample.sampleChange, onReflow: () => {}, state: createComposedPresentationState()}));
        assert.ok(markup.indexOf('aria-label="Explaining"') < markup.indexOf('aria-label="Diff"'));
        assert.ok(markup.indexOf('aria-label="Diff"') < markup.indexOf('aria-label="Tests"'));
        for (const testEntity of sample.sampleTests) assert.ok(markup.includes(`data-test-id="${testEntity.id}"`));
        assert.equal((markup.match(/data-assertion-id=/g) ?? []).length, 29);
        assert.ok(markup.includes('syntax-keyword') && markup.includes('syntax-string'));
        const cache = createComposedPresentationState();
        const added = sample.sampleTests.find(test => test.data.comparisonStatus === 'add')!;
        cache.saveTest(added.id, {open: true, selectedId: added.id});
        const readerId = sample.sourceFocus(added, 'test').id;
        cache.saveReader(readerId, {mode: 'split', reading: {active: 0, top: 173, horizontal: {[-1]: 7}, mode: 'split', folds: ['retained-context'], focusId: readerId}});
        const reconstruct = () => renderToStaticMarkup(React.createElement(component.ComposedChange, {entity: sample.sampleChange, onReflow: () => {}, state: cache}));
        const firstMount = reconstruct();
        const remount = reconstruct();
        assert.ok(firstMount.includes(`data-test-id="${added.id}" open=""`));
        assert.ok(remount.includes(`data-test-id="${added.id}" open=""`));
        assert.ok(remount.includes('aria-pressed="true">Split</button>'));
        assert.ok(remount.includes('Test source'));
        assert.equal(cache.reader(readerId).reading?.top, 173);
        assert.equal(cache.reader(readerId).reading?.horizontal[-1], 7);
        assert.deepEqual(cache.reader(readerId).reading?.folds, ['retained-context']);
        const comparison = {comparison: session.comparisonId, revision: 1};
        const membership = sceneMembership(comparison, {...comparison, request: 1, coverage: {x: 0, y: 0, width: 1, height: 1}, nodeIds: [], metadataNodeIds: [], routeIds: [], visited: 0, visitedBranches: 0}, {nodes: [], routes: []}, [sample.sampleChange.id]);
        assert.ok(membership?.nodes.has(sample.sampleChange.id));
        assert.ok(filterSceneMembership({changesOnly: true, nodeIds: [], relationIds: []}, membership).nodes.size === 0);

        for (const mode of ['unified', 'split'] as const) {
            for (const focus of [sample.sourceFocus(sample.gatewayFunction), ...sample.sampleTests.map(test => sample.sourceFocus(test, 'test'))]) {
                const sourceMarkup = renderToStaticMarkup(React.createElement(diff.FileDiffBody, {
                    file: diff.fileDiffs.get(focus.path)!, mode, fullscreen: false, width: 760,
                    onExplain: () => {}, activeRelation: null, reading: undefined, onReading: () => {}, restoreVersion: 0, focus,
                }));
                assert.ok(sourceMarkup.includes('syntax-keyword'), `${mode} ${focus.name} keyword tokens`);
                assert.ok(sourceMarkup.includes('syntax-string'), `${mode} ${focus.name} string tokens`);
                assert.ok(sourceMarkup.includes('data-before-line=') || sourceMarkup.includes('data-after-line='));
            }
        }
    } finally { await server.close(); }
});
