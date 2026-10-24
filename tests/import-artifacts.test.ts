import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { mkdtemp, realpath, rm, mkdir, writeFile, readFile, lstat, chmod, symlink, readdir, rename, link, open } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createImportArtifacts, isImportArtifactError, MAX_IMPORT_ARTIFACT_BYTES } from "../src/import-artifacts/public.ts";
import type { ArtifactReference } from "../src/import-artifacts/public.ts";

const fixture=async()=>{
  const root=await realpath(await mkdtemp(join(tmpdir(),"pr-reviewer-artifact-")));
  await chmod(root,0o700);
  const jobId=randomUUID(),invocationId=randomUUID();
  return {root,jobId,invocationId,store:createImportArtifacts(root),cleanup:()=>rm(root,{recursive:true,force:true})};
};
const directory=(root:string,ref:Pick<ArtifactReference,"jobId"|"invocationId">)=>join(root,"import-artifacts",ref.jobId,ref.invocationId);
const artifactPath=(root:string,ref:ArtifactReference)=>join(directory(root,ref),`${ref.artifactId}.json`);
const rejectsCode=(code:string)=>(error:unknown)=>isImportArtifactError(error) && error.code === code;

test("owned artifact roundtrip binds exact value/reference and survives a fresh port instance",async()=>{
  const f=await fixture();
  try {
    const value={kind:"imported",value:{source:'BOM \uFEFF / CRLF\r\n / quote " / 😀',unsupported:[]}};
    const ref=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value});
    assert.deepEqual(Object.keys(ref),["artifactId","jobId","invocationId","digest","bytes","schema"]);
    const bytes=await readFile(artifactPath(f.root,ref));
    assert.equal(bytes.length,ref.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),ref.digest);
    assert.deepEqual(await createImportArtifacts(f.root).read({reference:ref,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),value);
    assert.equal((await lstat(artifactPath(f.root,ref))).mode & 0o777,0o600);
    assert.equal((await lstat(directory(f.root,ref))).mode & 0o777,0o700);
    assert.equal((await readdir(directory(f.root,ref))).filter(p=>p.startsWith(".tmp-")).length,0);
  } finally {await f.cleanup();}
});

test("foreign expected IDs and traversal/absolute/extra reference fields reject without opening supplied paths",async()=>{
  const f=await fixture();
  try {
    const ref=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{ok:true}});
    await assert.rejects(f.store.read({reference:ref,expectedJobId:randomUUID(),expectedInvocationId:f.invocationId}),rejectsCode("binding_mismatch"));
    for(const artifactId of ["../outside","/tmp/outside","https://example.com/source"]) await assert.rejects(f.store.read({reference:{...ref,artifactId},expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("invalid_reference"));
    await assert.rejects(f.store.read({reference:{...ref,path:"/tmp/forbidden"},expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("invalid_reference"));
    await assert.rejects(f.store.write({jobId:"../escape",invocationId:f.invocationId,value:{}}),rejectsCode("invalid_input"));
  } finally {await f.cleanup();}
});

test("unsafe existing parents and roots reject without repairing their permissions",async()=>{
  const f=await fixture();
  try {
    const parent=join(f.root,"import-artifacts");await mkdir(parent,{mode:0o755});
    await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{}}),rejectsCode("unsafe_parent"));
    assert.equal((await lstat(parent)).mode & 0o777,0o755);
    await chmod(f.root,0o755);
    await assert.rejects(createImportArtifacts(f.root).write({jobId:f.jobId,invocationId:f.invocationId,value:{}}),rejectsCode("unsafe_root"));
    assert.equal((await lstat(f.root)).mode & 0o777,0o755);
  } finally {await f.cleanup();}
});

test("partial temp writes do not map to a committed artifact",async()=>{
  const f=await fixture();
  try {
    const artifactId=randomUUID();const dir=directory(f.root,f);await mkdir(dir,{recursive:true,mode:0o700});
    const temp=join(dir,`.tmp-${artifactId}-${randomUUID()}.json`);await writeFile(temp,'{"interrupted":',{mode:0o600});
    const reference={artifactId,jobId:f.jobId,invocationId:f.invocationId,digest:"0".repeat(64),bytes:16,schema:"import-result-v1" as const};
    await assert.rejects(f.store.read({reference,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("missing"));
    assert.equal(await readFile(temp,"utf8"),'{"interrupted":');
  } finally {await f.cleanup();}
});

test("symlink file/parents, nonregular files and hard-linked aliases are rejected",async()=>{
  const f=await fixture();
  const outside=await realpath(await mkdtemp(join(tmpdir(),"pr-reviewer-artifact-outside-")));
  try {
    const ref=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{exact:true}});
    const path=artifactPath(f.root,ref),bytes=await readFile(path);
    await rm(path);await writeFile(join(outside,"foreign.json"),bytes,{mode:0o600});
    await symlink(join(outside,"foreign.json"),path);
    await assert.rejects(f.store.read({reference:ref,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("unsafe_file"));
    await rm(path);await mkdir(path,{mode:0o700});
    await assert.rejects(f.store.read({reference:ref,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("unsafe_file"));
    await rm(path,{recursive:true});await writeFile(path,bytes,{mode:0o600});await link(path,join(outside,"alias.json"));
    await assert.rejects(f.store.read({reference:ref,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("unsafe_file"));
    await rm(join(f.root,"import-artifacts"),{recursive:true});await symlink(outside,join(f.root,"import-artifacts"));
    await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{}}),rejectsCode("unsafe_parent"));
    assert.equal((await readdir(outside)).includes(f.jobId),false);
    const alias=f.root+"-alias";await symlink(f.root,alias);
    try {await assert.rejects(createImportArtifacts(alias).write({jobId:f.jobId,invocationId:f.invocationId,value:{}}),rejectsCode("unsafe_root"));} finally {await rm(alias);}
  } finally {await f.cleanup();await rm(outside,{recursive:true,force:true});}
});

test("length/digest/binding mismatches and strictly invalid UTF8/JSON reject",async()=>{
  const f=await fixture();
  try {
    const ref=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{exact:true}});
    const path=artifactPath(f.root,ref),original=await readFile(path);
    await assert.rejects(f.store.read({reference:{...ref,bytes:ref.bytes+1},expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("integrity_mismatch"));
    await assert.rejects(f.store.read({reference:{...ref,digest:"0".repeat(64)},expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("integrity_mismatch"));
    const malformed=[Buffer.from([0xff,0xfe]),Buffer.from("{invalid"),Buffer.from(JSON.stringify({...JSON.parse(original.toString()),jobId:randomUUID()}))];
    for(const [index,bytes] of malformed.entries()) {
      await writeFile(path,bytes,{mode:0o600});
      const changed={...ref,bytes:bytes.length,digest:createHash("sha256").update(bytes).digest("hex")};
      await assert.rejects(f.store.read({reference:changed,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode(index === 2 ? "binding_mismatch" : "invalid_json"));
    }
  } finally {await f.cleanup();}
});

test("parallel publications retain unique complete artifacts without clobbering",async()=>{
  const f=await fixture();
  try {
    const refs=await Promise.all(Array.from({length:8},(_,ordinal)=>f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{ordinal}})));
    assert.equal(new Set(refs.map(r=>r.artifactId)).size,8);
    for(const [ordinal,reference] of refs.entries()) assert.deepEqual(await f.store.read({reference,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),{ordinal});
    assert.equal((await readdir(directory(f.root,f))).filter(name=>name.endsWith(".json")).length,8);
  } finally {await f.cleanup();}
});

import type { FileHandle } from "node:fs/promises";
import { writeFileSync } from "node:fs";

test("a final filename created during publication is never overwritten",async(t)=>{
  const f=await fixture();
  const probe=await open(join(f.root,"prototype-probe"),"w",0o600);
  try {
    type Write=(this:FileHandle,data:Buffer)=>Promise<void>;
    const prototype=Object.getPrototypeOf(probe) as {writeFile:Write};
    const original=prototype.writeFile;
    let collision:string|null=null;
    t.mock.method(prototype,"writeFile",async function(this:FileHandle,data:Buffer) {
      const dir=directory(f.root,f);
      const temp=(await readdir(dir)).find(name=>name.startsWith(".tmp-"));
      assert.ok(temp);const artifactId=/^\.tmp-([a-f0-9-]{36})-/.exec(temp)?.[1];assert.ok(artifactId);
      collision=join(dir,`${artifactId}.json`);
      writeFileSync(collision,"preexisting final content",{mode:0o600});
      return original.call(this,data);
    });
    await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{source:"complete"}}),rejectsCode("conflict"));
    assert.ok(collision);assert.equal(await readFile(collision,"utf8"),"preexisting final content");
    assert.equal((await readdir(directory(f.root,f))).some(name=>name.startsWith(".tmp-")),false);
  } finally {t.mock.restoreAll();await probe.close();await f.cleanup();}
});

test("read-time identical-content path replacement is rejected using the opened descriptor",async(t)=>{
  const f=await fixture();
  let probe:FileHandle|undefined;
  try {
    const reference=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{source:"original"}});
    const path=artifactPath(f.root,reference),bytes=await readFile(path);probe=await open(path,"r");
    type Read=(this:FileHandle,buffer:Buffer,offset:number,length:number,position:number)=>Promise<{bytesRead:number;buffer:Buffer}>;
    const prototype=Object.getPrototypeOf(probe) as {read:Read};const original=prototype.read;let replaced=false;
    t.mock.method(prototype,"read",async function(this:FileHandle,buffer:Buffer,offset:number,length:number,position:number) {
      if(!replaced) {replaced=true;await rename(path,path+".original");await writeFile(path,bytes,{mode:0o600});}
      return original.call(this,buffer,offset,length,position);
    });
    await assert.rejects(f.store.read({reference,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("replaced"));
    assert.equal(replaced,true);
  } finally {t.mock.restoreAll();await probe?.close();await f.cleanup();}
});

test("a failed prepublication fsync exposes no committed artifact",async(t)=>{
  const f=await fixture();const probe=await open(join(f.root,"prototype-probe"),"w",0o600);
  try {
    const prototype=Object.getPrototypeOf(probe) as {sync:(this:FileHandle)=>Promise<void>};const original=prototype.sync;
    t.mock.method(prototype,"sync",async function(this:FileHandle) {if((await this.stat()).isFile()) throw new Error("controlled fixture fsync failure");return original.call(this);});
    await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{source:"not published"}}),rejectsCode("io"));
    assert.deepEqual(await readdir(directory(f.root,f)),[]);
  } finally {t.mock.restoreAll();await probe.close();await f.cleanup();}
});

test("exact 16MiB envelope passes, one byte over rejects, and escaped data need not fit 8MiB commands",async()=>{
  const f=await fixture();
  try {
    const overhead=Buffer.byteLength(JSON.stringify({schema:"import-result-v1",artifactId:"0".repeat(36),jobId:f.jobId,invocationId:f.invocationId,value:""}));
    const exact=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:"x".repeat(MAX_IMPORT_ARTIFACT_BYTES-overhead)});
    assert.equal(exact.bytes,MAX_IMPORT_ARTIFACT_BYTES);
    assert.equal((await f.store.read({reference:exact,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}) as string).length,MAX_IMPORT_ARTIFACT_BYTES-overhead);
    await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:"x".repeat(MAX_IMPORT_ARTIFACT_BYTES-overhead+1)}),rejectsCode("too_large"));
    const escaped={content:'"'.repeat(5*1024*1024)};
    const ref=await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:escaped});
    assert.ok(ref.bytes > 8*1024*1024);assert.ok(ref.bytes < MAX_IMPORT_ARTIFACT_BYTES);
    assert.deepEqual(await f.store.read({reference:ref,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),escaped);
    await assert.rejects(createImportArtifacts(f.root,{maxEncodedBytes:1024}).read({reference:ref,expectedJobId:f.jobId,expectedInvocationId:f.invocationId}),rejectsCode("too_large"));
    assert.throws(()=>createImportArtifacts(f.root,{maxEncodedBytes:MAX_IMPORT_ARTIFACT_BYTES+1}),rejectsCode("invalid_input"));
  } finally {await f.cleanup();}
});

test("non-JSON values, accessors and custom serialization are rejected without invoking them",async()=>{
  const f=await fixture();
  try {
    let invoked=false;const accessor=Object.defineProperty({},"secret",{enumerable:true,get:()=>{invoked=true;return "not allowed";}});
    const custom={toJSON:()=>{invoked=true;return {};}};
    const cycle:{self?:unknown}={};cycle.self=cycle;
    for(const value of [undefined,NaN,BigInt(1),accessor,custom,cycle,new Date(),[undefined]]) await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value}),rejectsCode("invalid_json"));
    assert.equal(invoked,false);assert.deepEqual(await readdir(f.root),[]);
  } finally {await f.cleanup();}
});

test("postpublication directory fsync failure remains unknown and preserves the final file",async(t)=>{
  const f=await fixture();const probe=await open(join(f.root,"prototype-probe"),"w",0o600);
  try {
    const prototype=Object.getPrototypeOf(probe) as {sync:(this:FileHandle)=>Promise<void>};const original=prototype.sync;
    t.mock.method(prototype,"sync",async function(this:FileHandle) {if((await this.stat()).isDirectory()) throw new Error("controlled directory fsync failure");return original.call(this);});
    await assert.rejects(f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{source:"complete but unacknowledged"}}),rejectsCode("publication_unknown"));
    const names=await readdir(directory(f.root,f));assert.equal(names.length,1);assert.equal(names[0]?.startsWith(".tmp-"),false);
    const stored=JSON.parse(await readFile(join(directory(f.root,f),names[0]!),"utf8")) as {value:unknown};
    assert.deepEqual(stored.value,{source:"complete but unacknowledged"});
  } finally {t.mock.restoreAll();await probe.close();await f.cleanup();}
});

import fsPromises from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";

for(const phase of ["write","read","read_primary_failure"] as const) test(`${phase} close EIO stays sanitized and still closes every owned directory`,async(t)=>{
  const f=await fixture();
  const existing=phase !== "write" ? await f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{complete:true}}) : null;
  const actualOpen=fsPromises.open;
  const held:{directory:boolean;closed:boolean;actualClose:()=>Promise<void>}[]=[];
  let injected=false;
  try {
    t.mock.method(fsPromises,"open",async(...args:Parameters<typeof fsPromises.open>)=>{
      const handle=await actualOpen(...args);
      const directory=(await handle.stat()).isDirectory();
      const actualClose=handle.close.bind(handle);
      const record={directory,closed:false,actualClose};held.push(record);
      handle.close=async()=>{
        await actualClose();record.closed=true;
        if(!directory && !injected) {
          injected=true;
          throw Object.assign(new Error(`EIO close at private path ${f.root}`),{code:"EIO",path:f.root});
        }
      };
      return handle;
    });
    syncBuiltinESMExports();
    const operation=phase === "write" ? f.store.write({jobId:f.jobId,invocationId:f.invocationId,value:{complete:true}}) : f.store.read({reference:phase === "read_primary_failure" ? {...existing,digest:"0".repeat(64)} : existing,expectedJobId:f.jobId,expectedInvocationId:f.invocationId});
    await assert.rejects(operation,(error:unknown)=>isImportArtifactError(error) && error.code === (phase === "write" ? "publication_unknown" : phase === "read_primary_failure" ? "integrity_mismatch" : "io") && !error.message.includes(f.root));
    assert.equal(injected,true);
    assert.equal(held.filter(h=>h.directory).length,4);
    assert.ok(held.every(h=>h.closed),"a close failure skipped another owned descriptor");
    t.mock.restoreAll();syncBuiltinESMExports();
    const files=await readdir(directory(f.root,f));assert.equal(files.length,1);assert.equal(files[0]?.startsWith(".tmp-"),false);
    const stored=JSON.parse(await readFile(join(directory(f.root,f),files[0]!),"utf8")) as {value:unknown};
    assert.deepEqual(stored.value,{complete:true});
  } finally {
    t.mock.restoreAll();syncBuiltinESMExports();
    for(const item of held) if(!item.closed) await item.actualClose();
    await f.cleanup();
  }
});
