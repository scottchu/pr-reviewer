import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {rmSync} from 'node:fs';
import {join} from 'node:path';
import {providerFixture} from './provider-fixture.ts';
import {createStore} from '../src/storage/public.ts';
import {createImportRunner} from '../src/import-jobs/public.ts';
import type {ImportArtifacts} from '../src/import-jobs/public.ts';
import type {ArtifactReference} from '../src/domain/public.ts';
const artifacts=()=>{const values=new Map<string,unknown>();const port:ImportArtifacts={write:async({jobId,invocationId,value})=>{const artifactId=randomUUID(),encoded=JSON.stringify(value);values.set(artifactId,structuredClone(value));return {schema:'import-result-v1',artifactId,jobId,invocationId,digest:createHash('sha256').update(encoded).digest('hex'),bytes:Buffer.byteLength(encoded)};},read:async({reference})=>structuredClone(values.get((reference as ArtifactReference).artifactId))};return {port,values};};
test('bounded coordinator drives discovery through immutable atomic admission and restart only rereads admitted state',async()=>{
 const f=providerFixture(),path=join(f.root,'review.sqlite'),store=createStore(path),token=store.issueUser(),a=artifacts();let calls=0;
 store.imports.command(token,{type:'RequestImport',commandId:'request',path:f.root});const runner=createImportRunner(store,a.port,{effects:()=>({run:async command=>{calls++;return f.effects.run(command);},terminationConfirmed:()=>true})});
 try{await runner.idle();assert.equal(store.imports.list(token)[0]?.state,'admitted');assert.equal(store.list(store.authenticate(token)).length,1);const before=calls;await runner.stop();store.close();const reopened=createStore(path),restart=createImportRunner(reopened,a.port,{effects:()=>({run:async command=>{calls++;return f.effects.run(command);},terminationConfirmed:()=>true})});try{await restart.idle();assert.equal(calls,before);assert.equal(reopened.imports.list(token)[0]?.state,'admitted');}finally{await restart.stop();reopened.close();}}
 finally{await runner.stop();rmSync(f.root,{recursive:true,force:true});}
});
test('artifact persistence uncertainty never admits source or automatically replays the acquisition',async()=>{
 const f=providerFixture(),store=createStore(join(f.root,'review.sqlite')),token=store.issueUser();let writes=0;
 store.imports.command(token,{type:'RequestImport',commandId:'request',path:f.root});const runner=createImportRunner(store,{write:async()=>{writes++;throw new Error('publication_unknown');},read:async()=>null},{effects:()=>({...f.effects,terminationConfirmed:()=>true})});
 try{await runner.idle();assert.equal(writes,1);assert.equal(store.imports.list(token)[0]?.state,'unknown');assert.equal(store.list(store.authenticate(token)).length,0);runner.wake();await runner.idle();assert.equal(writes,1);assert.equal(store.list(store.authenticate(token)).length,0);}finally{await runner.stop();store.close();rmSync(f.root,{recursive:true,force:true});}
});
test('known-result recovery requires explicit re-verification and rejects altered artifact content',async()=>{
 const f=providerFixture(),store=createStore(join(f.root,'review.sqlite')),token=store.issueUser(),a=artifacts();let registered:ArtifactReference|undefined;
 store.imports.command(token,{type:'RequestImport',commandId:'request',path:f.root});const originalAdmit=store.imports.admit;store.imports.admit=()=>{throw new Error('controlled post-result interruption');};
 const first=createImportRunner(store,{...a.port,write:async input=>{registered=await a.port.write(input);return registered;}},{effects:()=>({...f.effects,terminationConfirmed:()=>true})});await first.idle();await first.stop();store.imports.admit=originalAdmit;
 assert.equal(store.imports.list(token)[0]?.state,'result_ready');const restart=createImportRunner(store,a.port,{effects:()=>({...f.effects,terminationConfirmed:()=>true})});
 try{await restart.idle();assert.equal(store.imports.list(token)[0]?.state,'needs_reverification');assert.equal(store.list(store.authenticate(token)).length,0);assert.ok(registered);a.values.set(registered!.artifactId,{forged:true});const job=store.imports.list(token)[0]!;store.imports.command(token,{type:'ReverifyImportResult',commandId:'reverify',jobId:job.jobId});restart.wake();await restart.idle();assert.equal(store.imports.list(token)[0]?.reason,'retained_result_changed');assert.equal(store.list(store.authenticate(token)).length,0);}finally{await restart.stop();store.close();rmSync(f.root,{recursive:true,force:true});}
});

test('runtime restart and DB-only setup recovery preserve the original manual entry alongside provider-imported reviews',async()=>{
 const {prepareSource}=await import('../scripts/prepare.ts');const {createImportArtifacts}=await import('../src/import-artifacts/public.ts');const {mkdtempSync,unlinkSync,realpathSync}=await import('node:fs');const {tmpdir}=await import('node:os');const root=mkdtempSync(join(tmpdir(),'pr-reviewer-import-restart-')),f=providerFixture();let store:ReturnType<typeof createStore>|undefined;
 try{const original=prepareSource(root);store=createStore(join(root,'review.sqlite'));const token=store.issueUser();store.imports.command(token,{type:'RequestImport',commandId:'import',path:f.root});const runner=createImportRunner(store,createImportArtifacts(realpathSync(root)),{effects:()=>({...f.effects,terminationConfirmed:()=>true})});await runner.idle();await runner.stop();assert.equal(store.imports.list(token)[0]?.state,'admitted',JSON.stringify(store.imports.list(token)));assert.equal(store.list(store.authenticate(token)).length,2);store.close();store=undefined;
 assert.equal(prepareSource(root).snapshotId,original.snapshotId);unlinkSync(join(root,'source-input.json'));unlinkSync(join(root,'snapshot.json'));assert.equal(prepareSource(root).snapshotId,original.snapshotId);const reopened=createStore(join(root,'review.sqlite'));try{assert.equal(reopened.list(reopened.authenticate(token)).length,2);assert.equal(reopened.imports.list(token)[0]?.state,'admitted');}finally{reopened.close();}
 }finally{store?.close();rmSync(root,{recursive:true,force:true});rmSync(f.root,{recursive:true,force:true});}
});
