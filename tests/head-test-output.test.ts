import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeadOutputBudget} from '../src/test-jobs/output.ts';
test('B02 diagnostic and target roles share a sticky byte budget with exact detached raw capture',()=>{
 const output=createHeadOutputBudget(6),bytes=Buffer.from('é');
 assert.equal(output.append('git_prepare','stderr',bytes),true);bytes.fill(0);
 assert.equal(output.append('runtime_version','stdout',Buffer.from('1')),true);
 assert.equal(output.append('test_root','stderr',Buffer.from('abc')),true);
 const captured=output.snapshot();assert.equal(captured.observedBytes,6);assert.equal(Buffer.from(captured.chunks[0]!.data).toString(),'é');
 captured.chunks[0]!.data.fill(0);assert.equal(Buffer.from(output.snapshot().chunks[0]!.data).toString(),'é');
 assert.equal(output.append('test_root','stdout',Buffer.from('x')),false);assert.equal(output.append('test_root','stdout',Buffer.alloc(0)),false);
 assert.equal(output.snapshot().overflow,true);assert.equal(output.snapshot().retainedBytes,6);
});
