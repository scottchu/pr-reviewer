import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import ts from 'typescript-analysis';
import { prepareCallbackDisplays } from '../prepare-callback-display.ts';
import { callDisplayName, type DisplayTarget } from '../callback-display.ts';
import { projectBehaviorCalls, callActionName } from '../calls.ts';
import source from '../full-source.json' with { type: 'json' };
import prepared from '../callback-display.json' with { type: 'json' };
import clients from '../calls-clients.json' with { type: 'json' };
import storage from '../calls-storage.json' with { type: 'json' };
import scope from '../calls-scope.json' with { type: 'json' };

const targets = (text: string): DisplayTarget[] => {
  const ast = ts.createSourceFile('sample.ts', text, ts.ScriptTarget.Latest, true);
  const result: DisplayTarget[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) {
      const start = node.getStart(ast);
      result.push({ id: `sample:${start}`, name: `<callback@${start}>`, declaration: {
        snapshotId: 'test', side: 'head', path: 'sample.ts',
        contentHash: createHash('sha256').update(text).digest('hex'), start, end: node.end,
        startLine: ast.getLineAndCharacterOfPosition(start).line + 1,
        endLine: ast.getLineAndCharacterOfPosition(node.end - 1).line + 1,
      } });
    }
    ts.forEachChild(node, visit);
  };
  visit(ast); return result;
};

test('static object properties get file-qualified display context; anonymous/computed/duplicate properties stay diagnostic', () => {
  const text = 'const label="😀"; const one={marker:()=>1, method(){return 2}}; [1].map(x=>x); const a={query:()=>1},b={query:()=>2}; const c={[label]:()=>3};';
  const nodes = targets(text), original = structuredClone(nodes);
  const aliases = prepareCallbackDisplays(nodes, [{ path: 'sample.ts', before: null, after: text }]);
  assert.deepEqual(aliases.map(record => record.displayName), ['sample.marker', 'sample.method']);
  assert.equal(nodes.filter(node => callDisplayName(node, aliases) === node.name).length, 4);
  assert.deepEqual(nodes, original);
  assert.equal(text.slice(nodes[0]!.declaration.start, nodes[0]!.declaration.end), '()=>1');
});

test('unmatched hash, anchor, duplicate overlay and named functions fail closed', () => {
  const text = 'const a={marker:()=>1};', nodes = targets(text), node = nodes[0]!;
  const aliases = prepareCallbackDisplays(nodes, [{ path: 'sample.ts', before: null, after: text }]);
  assert.equal(callDisplayName(node, aliases), 'sample.marker');
  assert.equal(prepareCallbackDisplays([{ ...node, declaration: { ...node.declaration, contentHash: 'stale' } }], [{ path: 'sample.ts', before: null, after: text }]).length, 0);
  assert.equal(callDisplayName({ ...node, declaration: { ...node.declaration, end: node.declaration.end + 1 } }, aliases), node.name);
  assert.equal(callDisplayName(node, [...aliases, ...aliases]), node.name);
  assert.equal(callDisplayName({ ...node, name: 'request' }, aliases), 'request');
});

test('prepared overlay reproduces exactly and never renames canonical packet identities or call evidence', () => {
  const packets = [clients, storage, scope];
  const nodes = [...new Map(packets.flatMap(packet => [...packet.nodes, ...packet.seeds, ...packet.contextDeclarations]).map(node => [node.id, node])).values()].map(node => {
    const side = node.declaration.side;
    assert.ok(side === 'base' || side === 'head');
    const declaration: DisplayTarget['declaration'] = { ...node.declaration, side };
    return { ...node, declaration };
  });
  assert.deepEqual(prepareCallbackDisplays(nodes, source.files), prepared.records);
  const original = structuredClone(packets), graph = projectBehaviorCalls();
  for (const [offset, label] of [[21859, 'analysis.marker'], [22494, 'analysis.evidence'], [23379, 'analysis.query'], [25691, 'analysis.source']] as const) {
    const node = graph.nodes.find(node => node.name === `<callback@${offset}>`)!;
    assert.ok(node); assert.equal(callDisplayName(node), label);
    const canonical = nodes.find(record => record.id === node.id)!;
    assert.deepEqual(node.declaration, canonical.declaration);
    assert.deepEqual(node.body, canonical.body);
    assert.equal(node.name, canonical.name);
    const link = graph.links.find(link => link.caller === node.id)!;
    const callee = graph.nodes.find(target => target.id === link.callee)!;
    assert.match(callActionName(link, node, callee), new RegExp(label.replace('.', '\\.')));
  }
  assert.deepEqual(packets, original);
});
