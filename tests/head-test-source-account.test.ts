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
test('B02 fixed resolver accepts supported root config and rejects remapping, inheritance and alternate scope controls',async()=>{
 const root=await mkdtemp(join(tmpdir(),'pr-reviewer-head-resolution-'));
 try{
  await mkdir(join(root,'tests'));
  const contents=selectors.map(path=>({path,content:"import {test} from 'bun:test'; test('fixture',()=>{});"}));
  for(const entry of contents)await writeFile(join(root,entry.path),entry.content);
  const entry=(path:string,content:string)=>({path,mode:'100644' as const,objectId:'c'.repeat(40),bytes:Buffer.byteLength(content),sha256:createHash('sha256').update(content).digest('hex')});
  const base:HeadSourceManifest={schema:'head-source-v1',repository:'github.com/scottchu/pr-reviewer',headSha:'a'.repeat(40),treeId:'b'.repeat(40),entries:contents.map(item=>entry(item.path,item.content))};
  const supported={compilerOptions:{target:'ES2023',lib:['ES2023','DOM','DOM.Iterable'],module:'NodeNext',moduleResolution:'NodeNext',strict:true,noUncheckedIndexedAccess:true,exactOptionalPropertyTypes:true,jsx:'react-jsx',allowImportingTsExtensions:true,noEmit:true,skipLibCheck:true,types:['node','bun']},include:['src','scripts','tests','playwright.config.ts']};
  const run=async(path:string,value:unknown)=>{const content=JSON.stringify(value);await writeFile(join(root,path),content);return accountHeadTestSource(root,{...base,entries:[...base.entries,entry(path,content)]},()=>{});};
  const accepted=await run('tsconfig.json',supported);assert.equal(accepted.account.resolutionConfigs[0]!.path,'tsconfig.json');assert.equal(accepted.account.resolutionConfigs[0]!.sha256,entry('tsconfig.json',JSON.stringify(supported)).sha256);
  assert.notEqual(accepted.sourceAccountId,(await accountHeadTestSource(root,base,()=>{})).sourceAccountId);
  for(const control of [{paths:{zod:['./hidden.ts']}},{baseUrl:'.'},{customConditions:['unexpected']},{moduleSuffixes:['.hidden','']}])await assert.rejects(run('tsconfig.json',{...supported,compilerOptions:{...supported.compilerOptions,...control}}),/source_account_unavailable/);
  await assert.rejects(run('tsconfig.json',{...supported,extends:'./base.json'}),/source_account_unavailable/);
  for(const path of ['tests/tsconfig.json','jsconfig.json','tsconfig.test.json'])await assert.rejects(run(path,supported),/source_account_unavailable/);
  await run('package.json',{name:'pr-reviewer',type:'module'});
  for(const field of ['imports','exports','browser','alias','workspaces'])await assert.rejects(run('package.json',{name:'pr-reviewer',[field]:{zod:'./hidden.ts'}}),/source_account_unavailable/);
  await assert.rejects(run('tests/package.json',{name:'pr-reviewer'}),/source_account_unavailable/);
  await assert.rejects(run('package.json',{name:'zod'}),/source_account_unavailable/);
 }finally{await rm(root,{recursive:true,force:true});}
});
