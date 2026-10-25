import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import source from '../full-source.json' with { type: 'json' };
import paths from '../paths.json' with { type: 'json' };
import supplemental from '../calls-scope.json' with { type: 'json' };
import { prepareBehaviorContext } from '../prepare-behavior-context.ts';
import { callActionName, projectBehaviorCalls } from '../calls.ts';
import { layoutFileProjection, projectFileCalls, fileRequirementReferences } from '../file-projection.ts';
import { buildTree } from '../tree.ts';

test('bounded scope observation preserves exact source/callsites and both unchanged callees without static admission', () => {
  assert.deepEqual(prepareBehaviorContext(source.files), supplemental);
  const graph = projectBehaviorCalls();
  assert.equal(graph.links.length, 34);
  assert.equal(graph.nodes.length, 38);
  for (const node of graph.nodes) {
    const anchor = node.declaration;
    const file = source.files.find(file => file.path === anchor.path)!;
    const text = (anchor.side === 'base' ? file.before : file.after)!;
    assert.equal(createHash('sha256').update(text).digest('hex'), anchor.contentHash);
    assert.ok(text.slice(anchor.start, anchor.end).includes('=>'));
  }
  for (const name of ['encodedBytes', 'requestFingerprint', 'refresh']) {
    const occurrences = graph.nodes.filter(node => node.name === name);
    assert.deepEqual(occurrences.map(node => node.declaration.side).sort(), ['base', 'head']);
    assert.ok(occurrences.every(node => node.sourceUnchanged));
  }
  for (const link of graph.links) {
    assert.ok(graph.nodes.some(node => node.id === link.caller));
    assert.ok(graph.nodes.some(node => node.id === link.callee));
    for (const site of link.sites) {
      const file = source.files.find(file => file.path === site.anchor.path)!;
      const text = (site.anchor.side === 'base' ? file.before : file.after)!;
      assert.equal(text.slice(site.anchor.start, site.anchor.end), site.sourceText);
    }
  }
  assert.ok(graph.links.filter(link => link.method === 'bounded_same_file_lexical_observation').every(link => link.certainty === 'source_observed_manual' && link.analyzerReason));
});

test('file root reuses every original file identity/style dimension and only projects exact inter-file calls', () => {
  const original = buildTree(paths.paths, paths.changes);
  const calls = projectFileCalls(original);
  assert.equal(calls.length, 15);
  assert.equal(new Set(calls.map(call => call.link.id)).size, 15);
  for (const call of calls) {
    assert.notEqual(call.caller.declaration.path, call.callee.declaration.path);
    assert.equal(call.status, 'added');
    const target = source.files.find(file => file.path === call.callee.declaration.path)!;
    assert.equal(target.before, null);
    assert.ok(target.after);
    assert.equal(call.link.target.side, 'head');
  }
  for (const narrow of [false, true]) {
    const projection = layoutFileProjection(original, narrow);
    assert.equal(projection.nodes.length, 50);
    assert.deepEqual(projection.edges, []);
    assert.deepEqual(projection.nodes.map(node => node.id).sort(), original.nodes.filter(node => node.kind === 'file').map(node => node.id).sort());
    for (const node of projection.nodes) {
      const prior = original.nodes.find(item => item.id === node.id)!;
      for (const key of ['name', 'path', 'change', 'width', 'height', 'kind'] as const) assert.equal(node[key], prior[key]);
    }
  }
});

test('all call controls have distinct side/caller/callee/source names while IDs remain separate provenance', () => {
  const graph = projectBehaviorCalls();
  const names = graph.links.map(link => {
    const caller = graph.nodes.find(node => node.id === link.caller)!;
    const callee = graph.nodes.find(node => node.id === link.callee)!;
    const name = callActionName(link, caller, callee);
    assert.ok(name.includes(caller.name) && name.includes(callee.name));
    assert.ok(name.includes(link.target.side === 'base' ? 'Before' : 'After'));
    assert.ok(name.includes(link.sites[0]!.anchor.path) && name.includes(link.target.path));
    assert.ok(!name.includes(link.id));
    return name;
  });
  assert.equal(new Set(names).size, graph.links.length);
});


test('document file identities occupy a separate upper region while call code stays below', () => {
  const tree = buildTree(paths.paths, paths.changes);
  for (const narrow of [false, true]) {
    const layout = layoutFileProjection(tree, narrow);
    const documents = layout.nodes.filter(node => /\.mdx?$/.test(node.path));
    const code = layout.nodes.filter(node => !/\.mdx?$/.test(node.path));
    assert.ok(documents.length > 0 && code.length > 0);
    assert.ok(Math.max(...documents.map(node => node.y + node.height)) < Math.min(...code.map(node => node.y)));
  }
});


test('authored requirement references retain exact normative ranges and actual request implementation evidence', () => {
  assert.equal(fileRequirementReferences.length, 2);
  for (const reference of fileRequirementReferences) {
    const file = source.files.find(file => file.path === reference.path)!;
    const text = file.after!.split('\n').slice(reference.start - 1, reference.end).join('\n');
    assert.ok(text.includes('Authorization') || text.includes('credential-free owner requests'));
    assert.ok(text.includes('agent') || text.includes('Bearer'));
  }
  const request = projectBehaviorCalls().nodes.find(node => node.name === 'request' && node.declaration.side === 'head')!;
  assert.equal(request.declaration.path, 'src/application/review.ts');
  assert.equal(request.declaration.startLine, 25);
  assert.equal(request.declaration.endLine, 33);
  assert.ok(projectFileCalls(buildTree(paths.paths, paths.changes)).some(call => call.caller.id === request.id && call.callee.name === 'accessHeaders'));
});
