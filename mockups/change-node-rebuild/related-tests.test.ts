import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import ts from 'typescript-analysis';
import related from './related-tests.json' with {type: 'json'};
import sources from '../pr-file-tree/full-source.json' with {type: 'json'};
import sample from './change-sample.json' with {type: 'json'};
import {createComposedPresentationState} from '../change-node-preview/presentation-state.ts';

test('related Tests retain exact occurrences, imported function calls and contains Assertion witnesses', () => {
    assert.equal(related.parentChangeId, sample.id);
    assert.equal(related.graphSha256, sample.graphSha256);
    assert.deepEqual(related.tests.map(test => test.status).sort(), ['add','no change','no change']);
    assert.deepEqual(related.tests.map(test => test.assertions.length).sort((a,b)=>a-b), [6,7,16]);
    const file = sources.files.find(file => file.path === 'tests/gateway.test.ts')!;
    for (const test of related.tests) {
        for (const occurrence of test.occurrences) {
            const anchor = occurrence.anchor;
            const text = (anchor.side === 'base' ? file.before : file.after)!;
            assert.equal(createHash('sha256').update(text).digest('hex'), anchor.contentHash);
            const ast = ts.createSourceFile(file.path,text,ts.ScriptTarget.Latest,true);
            assert.ok(ast.statements.some(node => ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === '../src/server/public.ts' && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) && node.importClause.namedBindings.elements.some(value => value.name.text === 'createGateway')));
            const calls: number[] = [];
            const visit = (node: ts.Node): void => {
                if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'createGateway' && node.getStart(ast) >= anchor.start && node.end <= anchor.end) calls.push(ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1);
                ts.forEachChild(node,visit);
            };visit(ast);
            const reference = test.directReferences.find(value=>value.side===anchor.side)!;
            assert.ok(calls.includes(reference.line));
            assert.equal(reference.commit, anchor.commit);
        }
        for (const assertion of test.assertions) {
            assert.equal(assertion.contains.relation,'contains');
            assert.equal(assertion.contains.from,test.id);
            assert.equal(assertion.contains.to,assertion.id);
            for (const occurrence of assertion.occurrences) {
                const owner = test.occurrences.find(value=>value.anchor.commit===occurrence.anchor.commit)!;
                assert.ok(occurrence.anchor.start >= owner.anchor.start && occurrence.anchor.end <= owner.anchor.end);
            }
        }
    }
});

test('source selection return retains independent Test, Assertion and main edit reader state', () => {
    const cache = createComposedPresentationState();
    const test = related.tests[0]!; const assertion = test.assertions[0]!;
    cache.saveReader(test.id,{mode:'split',reading:{active:0,top:123,horizontal:{},mode:'split'}});
    cache.saveReader(assertion.id,{mode:'unified',reading:{active:0,top:17,horizontal:{},mode:'unified'}});
    assert.equal(cache.reader(test.id).mode,'split');
    assert.equal(cache.reader(test.id).reading?.top,123);
    assert.equal(cache.reader(assertion.id).reading?.top,17);
    assert.equal(cache.reader(sample.id).reading,undefined);
});
