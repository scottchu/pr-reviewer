import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractSourceFacts, sourceHash} from '../source-facts.ts';
import {decodePinnedText, parseTreeRecords, prepareSourceFacts} from '../prepare-source-facts.ts';

const input = (content: string) => ({repository: 'example/repo', side: 'head' as const,
  commit: 'a'.repeat(40), path: 'tests/example.test.ts', content, contentHash: sourceHash(content), gitBlob: 'b'.repeat(40)});

test('exact source bytes, Unicode coordinates and deterministic occurrence facts survive extraction', () => {
  const source = input("import {test} from 'node:test';\nimport assert from 'node:assert/strict';\n// 😀\ntest('credentials', () => { assert.equal('Bearer x', 'Bearer x'); });\n");
  const first = extractSourceFacts(source);
  assert.deepEqual(first, extractSourceFacts(source));
  const definition = first.find(unit => unit.kind === 'test')!;
  const assertion = first.find(unit => unit.kind === 'assertion')!;
  assert.equal(assertion.ownerId, definition.id);
  assert.equal(assertion.anchor.startLine, 4);
  assert.equal(source.content.slice(assertion.anchor.start, assertion.anchor.end), assertion.sourceText);
  assert.equal(assertion.sourceText, "assert.equal('Bearer x', 'Bearer x')");
  assert.ok(first.filter(unit => unit.kind === 'callsite').every(unit => unit.basis.includes('not established')));
});

test('names alone and shadowed imported bindings cannot mint tests or assertions', () => {
  const source = input("import {test} from 'node:test';\nimport assert from 'node:assert/strict';\nconst custom = () => { const test = (x: unknown) => x; test('fake'); };\ntest('real', () => { ((assert: any) => assert.equal(1, 2))({}); });\n");
  const facts = extractSourceFacts(source);
  assert.deepEqual(facts.filter(unit => unit.kind === 'test').map(unit => unit.name), ['real']);
  assert.equal(facts.filter(unit => unit.kind === 'assertion').length, 0);
  assert.equal(extractSourceFacts(input("const test = (x: unknown) => x; test('fake');")).filter(unit => unit.kind === 'test').length, 0);
});

test('source mismatch and malformed syntax fail closed; unparsed kinds do not fabricate units', () => {
  assert.throws(() => extractSourceFacts({...input('const x = 1;'), contentHash: '0'.repeat(64)}), /hash_mismatch/);
  assert.throws(() => extractSourceFacts(input('const broken = ;')), /syntax_unavailable/);
  assert.deepEqual(extractSourceFacts({...input('# Notes'), path: 'README.md'}), []);
  const before = extractSourceFacts({...input('const request = () => 1;'), side: 'base' as const});
  const after = extractSourceFacts(input('const request = () => 1;'));
  assert.notEqual(before[0]!.id, after[0]!.id);
});

test('Git decoding preserves exact valid bytes and refuses binary or invalid UTF8', () => {
  assert.equal(decodePinnedText(Buffer.from('😀\n')), '😀\n');
  assert.equal(decodePinnedText(Uint8Array.from([0xc3, 0x28])), null);
  assert.equal(decodePinnedText(Buffer.from('a\0b')), null);
  const tree = parseTreeRecords('100644 blob abc\tpath\twith-tab.ts\0' + '160000 commit def\tsubmodule\0');
  assert.equal(tree.get('path\twith-tab.ts')?.objectId, 'abc');
  assert.equal(tree.get('submodule')?.type, 'commit');
  assert.throws(() => parseTreeRecords('invalid'), /tree_record/);
});

test('assertion bind setup is not an assertion; negated matcher is supported and custom matcher explicit', () => {
  const source=input("import {test,expect} from '@playwright/test'; import assert from 'node:assert/strict'; test('x',()=>{ const later=assert.equal.bind(null,1,1); expect(1).not.toBe(2); expect(1).customMatcher(); });");
  const units=extractSourceFacts(source);
  assert.deepEqual(units.filter(unit=>unit.kind==='assertion').map(unit=>unit.sourceText),['expect(1).not.toBe(2)']);
  assert.equal(units.filter(unit=>unit.diagnostic).length,2);
  assert.equal(extractSourceFacts(input('class Example { constructor() {} }')).find(unit=>unit.kind==='function')?.name,'constructor');
});

test('all Git reads use existing safe effects and literal no-lazy command flags', async () => {
  const commands: string[][]=[];
  const facts=await prepareSourceFacts('example/repo','a'.repeat(40),'b'.repeat(40),{run:async command=>{
    commands.push([...command.args]);
    const commit=command.args.at(-1)!;
    return {kind:'ok',stdout:Buffer.from(command.args.includes('rev-parse')?commit.replace('^{commit}','')+'\n':'')};
  }});
  assert.equal(facts.files.length,0);
  for(const args of commands) {
    assert.ok(args.includes('--no-lazy-fetch'));
    assert.ok(args.includes('--literal-pathspecs'));
    assert.ok(args.includes('--no-optional-locks'));
    if(args.includes('diff')) assert.ok(args.includes('--no-textconv'));
  }
});
