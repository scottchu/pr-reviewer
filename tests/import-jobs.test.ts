import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createStore} from '../src/storage/public.ts';
const fixture=()=>{const root=mkdtempSync(join(tmpdir(),'pr-reviewer-import-job-'));const store=createStore(join(root,'db'));return {store,root,close:()=>{store.close();rmSync(root,{recursive:true,force:true});}};};
test('owner intent is durable/idempotent, credential-bound, queued not imported, and cannot claim twice or forge grant',()=>{
 const f=fixture();try{const token=f.store.issueUser(),command={type:'RequestImport' as const,commandId:'request',path:'/repo'};
 const receipt=f.store.imports.command(token,command);assert.equal(receipt.state,'applied');assert.equal(receipt.result.reviewId,undefined);assert.deepEqual(f.store.imports.command(token,command),receipt);assert.equal(f.store.imports.command(token,{...command,path:'/other'}).error,'command_conflict');
 assert.equal(f.store.list(f.store.authenticate(token)).length,0);assert.equal(f.store.imports.list(token)[0]?.state,'queued');assert.throws(()=>f.store.imports.command('forged',command),/unauthorized/);
 const owner=f.store.imports.beginOwner();const claim=f.store.imports.claim(owner);assert.ok(claim);assert.equal(f.store.imports.claim(owner),null);assert.throws(()=>f.store.imports.recordProcess({} as never,{ordinal:1,executable:'git',state:'requested'}),/stale_import_runner/);
 assert.throws(()=>f.store.imports.recordProcess(JSON.parse(JSON.stringify(claim!.grant)),{ordinal:1,executable:'git',state:'requested'}),/stale_import_runner/);
 }finally{f.close();}
});
test('restart distinguishes queued resume from uncertain claimed work and does not replay it',()=>{
 const f=fixture();try{const token=f.store.issueUser();f.store.imports.command(token,{type:'RequestImport',commandId:'first',path:'/repo'});const first=f.store.imports.beginOwner(),claim=f.store.imports.claim(first)!;
 const next=f.store.imports.beginOwner();assert.equal(f.store.imports.list(token)[0]?.state,'unknown');assert.equal(f.store.imports.claim(next),null);assert.throws(()=>f.store.imports.recordProcess(claim.grant,{ordinal:1,executable:'git',state:'requested'}),/stale_import_runner/);
 }finally{f.close();}
});
