import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {accountHeadTestSource} from '../src/test-jobs/source-account.ts';
import type {HeadSourceManifest} from '../src/test-jobs/public.ts';
const selectors=['tests/domain.test.ts','tests/registry.test.ts','tests/graph.test.ts','tests/source-analysis.test.ts'];
test('B02 source account follows literal imports and refuses an extra selector or external effect module',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-account-'));try{
  await mkdir(join(root,'tests'));const contents=selectors.map(path=>({path,content:"import {test} from 'bun:test'; test('fixture',()=>{});"}));for(const entry of contents)await writeFile(join(root,entry.path),entry.content);
  const manifest:HeadSourceManifest={schema:'head-source-v1',repository:'github.com/scottchu/pr-reviewer',headSha:'a'.repeat(40),treeId:'b'.repeat(40),entries:contents.map(entry=>({path:entry.path,mode:'100644',objectId:'c'.repeat(40),bytes:Buffer.byteLength(entry.content),sha256:createHash('sha256').update(entry.content).digest('hex')}))};
  const account=await accountHeadTestSource(root,manifest,()=>{});assert.equal(account.account.files.length,4);assert.deepEqual(account.account.packages,['bun:test']);
  await assert.rejects(accountHeadTestSource(root,{...manifest,entries:[...manifest.entries,{...manifest.entries[0]!,path:'extra/tests/domain.test.ts'}]},()=>{}),/target_selector_incompatible/);
  const text="import {spawn} from 'node:child_process'; spawn('not-authorized');";await writeFile(join(root,selectors[0]!),text);const unsafe={...manifest,entries:manifest.entries.map((entry,index)=>index===0?{...entry,bytes:Buffer.byteLength(text),sha256:createHash('sha256').update(text).digest('hex')}:entry)};
  await assert.rejects(accountHeadTestSource(root,unsafe,()=>{}),/source_account_unavailable/);
 }finally{await rm(root,{recursive:true,force:true});}
});
