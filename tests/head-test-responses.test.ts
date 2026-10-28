import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {headTestTargetsSchema,headTestReceiptSchema,headTestViewSchema,headTestArtifactViewSchema} from '../src/domain/public.ts';
import {cliTargets,cliReceipt,cliView,cliArtifact} from '../scripts/head-test-protocol.ts';
import {headTestFixture} from './head-test-fixture.ts';
import type {HeadTestArtifactView} from '../src/domain/public.ts';

const scope={reviewId:'review',snapshotId:'head-snapshot'};
const page:HeadTestArtifactView={jobId:'job',artifactId:'11111111-1111-4111-8111-111111111111',sha256:'a'.repeat(64),totalBytes:1,offset:0,bytes:1,nextOffset:1,complete:true,encoding:'base64',data:'YQ=='};

test('R1 public response codecs parse actual stored values and are the identical CLI aliases',()=>{
 assert.equal(cliTargets,headTestTargetsSchema);assert.equal(cliReceipt,headTestReceiptSchema);assert.equal(cliView,headTestViewSchema);assert.equal(cliArtifact,headTestArtifactViewSchema);
 const f=headTestFixture();try{
  const catalog=f.store.tests.targets(f.token,scope),receipt=f.store.tests.command(f.token,f.request),view=f.store.tests.query(f.token,{...scope,jobId:receipt.jobId});
  assert.deepEqual(headTestTargetsSchema.parse(catalog),catalog);assert.deepEqual(headTestReceiptSchema.parse(receipt),receipt);assert.deepEqual(headTestViewSchema.parse(view),view);assert.deepEqual(headTestArtifactViewSchema.parse(page),page);
  for(const key of ['qualificationId','preparation','result','cleanup'])assert.equal(Object.hasOwn(headTestViewSchema.parse(view).selectedJob!,key),false);
 }finally{f.cleanup();}
});

test('R2 strict schemas reject extra fields, altered target authority and bounded structural overflows',()=>{
 const f=headTestFixture();try{
  const catalog=f.store.tests.targets(f.token,scope),receipt=f.store.tests.command(f.token,f.request),view=f.store.tests.query(f.token,{...scope,jobId:receipt.jobId}),target=catalog.targets[0]!;
  for(const value of [{...catalog,extra:true},{...catalog,targets:Array(17).fill(target)},{...catalog,targets:[{...target,revision:3}]},{...catalog,targets:[{...target,digest:'a'.repeat(64)}]},{...catalog,targets:[{...target,definition:{...target.definition,cwd:'elsewhere'}}]}])assert.equal(headTestTargetsSchema.safeParse(value).success,false);
  for(const value of [{...receipt,jobRevision:-1},{...receipt,jobRevision:Number.MAX_SAFE_INTEGER+1},{...receipt,result:{disposition:'queued',execute:true}},{...receipt,actorId:'x'.repeat(129)}])assert.equal(headTestReceiptSchema.safeParse(value).success,false);
  for(const value of [{...view,jobs:Array(33).fill(view.selectedJob)},{...view,selectedJob:{...view.selectedJob,unexpected:true}},{...view,nextCursor:'x'.repeat(1025)},{...view,selectedJob:{...view.selectedJob,invocations:Array(17).fill({invocationId:'i',phase:'prepare',state:'running',quiescence:'unresolved'})}}])assert.equal(headTestViewSchema.safeParse(value).success,false);
 }finally{f.cleanup();}
});

test('R3 optional normalization and artifact limits preserve prior structural-only semantics',()=>{
 const f=headTestFixture();try{
  const receipt=f.store.tests.command(f.token,f.request),view=f.store.tests.query(f.token,{...scope,jobId:receipt.jobId});
  const job={...view.selectedJob!,qualificationId:undefined,preparation:undefined,result:undefined,cleanup:undefined,invocations:[{invocationId:'i',phase:'prepare',state:'running',quiescence:'unresolved',processCount:undefined}]};
  const parsed=headTestViewSchema.parse({...view,jobs:[job],selectedJob:job}).selectedJob!;
  for(const key of ['qualificationId','preparation','result','cleanup'])assert.equal(Object.hasOwn(parsed,key),false);assert.equal(Object.hasOwn(parsed.invocations[0]!,'processCount'),false);
  assert.ok(headTestArtifactViewSchema.safeParse({...page,totalBytes:2*1024*1024,bytes:65536,data:'A'.repeat(87384)}).success);
  for(const value of [{...page,totalBytes:2*1024*1024+1},{...page,bytes:65537},{...page,data:'A'.repeat(87385)},{...page,offset:-1},{...page,encoding:'utf8'},{...page,path:'/private'}])assert.equal(headTestArtifactViewSchema.safeParse(value).success,false);
  // Contextual correlation and decoded byte integrity remain consumer responsibilities.
  assert.equal(headTestArtifactViewSchema.safeParse({...page,data:'not base64',nextOffset:9}).success,true);
  assert.equal(headTestViewSchema.safeParse({...view,reviewId:'different-request-scope'}).success,true);
 }finally{f.cleanup();}
});

test('R4 domain public response exports bundle for the browser without Node runtime modules',()=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-head-response-browser-'));
 try{
  const entry=join(root,'entry.ts'),output=join(root,'responses.js'),publicPath=fileURLToPath(new URL('../src/domain/public.ts',import.meta.url));
  writeFileSync(entry,`import {headTestTargetsSchema,headTestReceiptSchema,headTestViewSchema,headTestArtifactViewSchema} from ${JSON.stringify(publicPath)}; export {headTestTargetsSchema,headTestReceiptSchema,headTestViewSchema,headTestArtifactViewSchema};\n`);
  execFileSync('/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun',['build',entry,'--target','browser','--outfile',output],{stdio:'pipe'});
 }finally{rmSync(root,{recursive:true,force:true});}
});
