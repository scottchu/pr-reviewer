import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestFixture} from './head-test-fixture.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';
import {prepareHeadTestInputs,executePreparedHeadTest,inspectHeadTestPreparation} from '../src/test-jobs/public.ts';
test('B02 fixed four-file Bun execution preserves attributed raw output and the occupied lease',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  const witness=await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.prepared(grant,witness);
  const result=await executePreparedHeadTest({store:f.store,grant,witness});assert.equal(result.run.exitCode,0);assert.equal(result.run.terminationConfirmed,true);assert.equal(result.output.overflow,false);
  const stderr=Buffer.concat(result.output.chunks.filter(x=>x.role==='test_root'&&x.channel==='stderr').map(x=>Buffer.from(x.data))).toString('utf8');
  assert.match(stderr,/4 pass/);assert.match(stderr,/Ran 4 tests across 4 files/);
  for(const file of ['domain','registry','graph','source-analysis'])assert.ok(stderr.includes(`tests/${file}.test.ts:`));
  assert.equal(f.store.tests.journal(grant).invocation.processes!.at(-1)!.role,'test_root');assert.equal(f.store.tests.journal(grant).invocation.processes!.at(-1)!.state,'exited');
  assert.equal(f.store.tests.input(grant).job.state,'running');
  f.store.imports.command(f.token,{type:'RequestImport',commandId:'excluded-after-exit',path:'/never-run'});assert.equal(f.store.imports.claim(f.store.imports.beginOwner()),null);
  await assert.rejects(executePreparedHeadTest({store:f.store,grant,witness}),/invalid_test_witness/);
 }finally{f.cleanup();await input.cleanup();}
});
test('B02 changed prepared config prevents target request and cannot be blindly retried',async()=>{
 const input=await headPreparationFixture(),f=headTestFixture({testOptions:{testOnlyExecution:true}},{headSha:input.headSha});
 try{
  f.store.tests.command(f.token,f.request);const {grant}=f.store.tests.claim(f.store.tests.beginOwner())!;
  const witness=await prepareHeadTestInputs({store:f.store,grant,executionRoot:input.executionRoot,fixtureInputs:input});f.store.tests.prepared(grant,witness);
  await writeFile(join(input.executionRoot,inspectHeadTestPreparation(witness).rootId,'empty-bunfig.toml'),'preload = ["not-authorized"]');
  await assert.rejects(executePreparedHeadTest({store:f.store,grant,witness}));assert.equal(f.store.tests.journal(grant).invocation.processes!.filter(x=>x.role==='test_root').length,0);
  await assert.rejects(executePreparedHeadTest({store:f.store,grant,witness}),/invalid_test_witness/);
 }finally{f.cleanup();await input.cleanup();}
});
