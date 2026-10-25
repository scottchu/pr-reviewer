import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import source from '../full-source.json' with { type: 'json' };
import paths from '../paths.json' with { type: 'json' };
import supplemental from '../calls-scope.json' with { type: 'json' };
import { prepareBehaviorContext } from '../prepare-behavior-context.ts';
import { callActionName, projectBehaviorCalls } from '../calls.ts';
import { behaviorSourceHomes, layoutBehavior } from '../behavior.ts';
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

test('call DAG ranks true callers before callees and keeps all50 secondary source homes without folder edges', () => {
  const graph = projectBehaviorCalls();
  const layout = layoutBehavior(graph);
  assert.deepEqual(layoutBehavior(graph), layout);
  for (const link of graph.links) {
    assert.ok(layout.positions.find(node => node.identity.id === link.caller)!.x < layout.positions.find(node => node.identity.id === link.callee)!.x);
  }
  for (const a of layout.positions) for (const b of layout.positions) {
    if (a === b) continue;
    assert.ok(Math.abs(a.x - b.x) >= 200 || Math.abs(a.y - b.y) >= 52);
  }
  const homes = behaviorSourceHomes(buildTree(paths.paths, paths.changes));
  assert.equal(homes.nodes.length, 50);
  assert.equal(homes.edges.length, 0);
  assert.ok(homes.nodes.every(node => node.kind === 'file'));
  assert.deepEqual(homes.nodes.map(node => node.path).sort(), [...paths.paths].sort());
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
