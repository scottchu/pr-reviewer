import { constants } from "node:fs";
import type { BigIntStats } from "node:fs";
import { open, lstat, mkdir, realpath, link, unlink } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { isAbsolute, resolve, join } from "node:path";
import type { ArtifactReference, ArtifactErrorCode, ImportArtifactError, ImportArtifacts } from "./public.ts";

export const MAX_IMPORT_ARTIFACT_BYTES=16*1024*1024;
const codes:readonly ArtifactErrorCode[]=["invalid_input","invalid_reference","invalid_json","too_large","unsafe_root","unsafe_parent","unsafe_file","binding_mismatch","missing","integrity_mismatch","replaced","conflict","publication_unknown","io"];
const failure=(code:ArtifactErrorCode):ImportArtifactError=>Object.assign(new Error(`import_artifact:${code}`),{name:"ImportArtifactError",code});
export const isImportArtifactError=(error:unknown):error is ImportArtifactError=>error instanceof Error && error.name === "ImportArtifactError" && "code" in error && codes.includes(error.code as ArtifactErrorCode);
const fsCode=(error:unknown)=>error !== null && typeof error === "object" && "code" in error ? error.code : undefined;
const uuid=(value:unknown):value is string=>typeof value === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value);
const hash=(bytes:Buffer)=>createHash("sha256").update(bytes).digest("hex");
const same=(a:BigIntStats,b:BigIntStats)=>a.dev === b.dev && a.ino === b.ino;
const stable=(a:BigIntStats,b:BigIntStats)=>same(a,b) && a.size === b.size && a.mode === b.mode && a.uid === b.uid && a.nlink === b.nlink && a.mtimeNs === b.mtimeNs && a.ctimeNs === b.ctimeNs;
type HeldDirectory={path:string;handle:FileHandle;identity:BigIntStats};
type Json=null|boolean|number|string|Json[]|{[key:string]:Json};
const jsonCopy=(value:unknown,seen:Set<object>=new Set(),depth=0):Json=>{
  if(value === null || typeof value === "string" || typeof value === "boolean") return value;
  if(typeof value === "number" && Number.isFinite(value)) return value;
  if(typeof value !== "object" || depth > 128 || seen.has(value)) throw failure("invalid_json");
  const prototype=Object.getPrototypeOf(value);
  if(prototype !== Object.prototype && prototype !== null && !(Array.isArray(value) && prototype === Array.prototype)) throw failure("invalid_json");
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Object.getOwnPropertySymbols(value).length || Object.values(descriptors).some(d=>!("value" in d))) throw failure("invalid_json");
  seen.add(value);
  try {
    if(Array.isArray(value)) {
      if(Object.keys(value).length !== value.length || Object.keys(descriptors).some(k=>k !== "length" && !/^(0|[1-9][0-9]*)$/.test(k))) throw failure("invalid_json");
      return value.map((_,index)=>jsonCopy(descriptors[String(index)]?.value,seen,depth+1));
    }
    const result:{[key:string]:Json}=Object.create(null) as {[key:string]:Json};
    for(const [key,descriptor] of Object.entries(descriptors)) {
      if(!descriptor.enumerable) throw failure("invalid_json");
      result[key]=jsonCopy(descriptor.value,seen,depth+1);
    }
    return result;
  } finally {seen.delete(value);}
};
const reference=(value:unknown,max:number):ArtifactReference=>{
  if(value === null || typeof value !== "object" || Array.isArray(value)) throw failure("invalid_reference");
  const keys=Object.keys(value).sort();
  if(keys.join(",") !== "artifactId,bytes,digest,invocationId,jobId,schema") throw failure("invalid_reference");
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Object.values(descriptors).some(d=>!("value" in d))) throw failure("invalid_reference");
  const ref=value as ArtifactReference;
  if(!uuid(ref.artifactId) || !uuid(ref.jobId) || !uuid(ref.invocationId) || ref.schema !== "import-result-v1" || typeof ref.digest !== "string" || !/^[a-f0-9]{64}$/.test(ref.digest) || !Number.isSafeInteger(ref.bytes) || ref.bytes < 1) throw failure("invalid_reference");
  if(ref.bytes > max) throw failure("too_large");
  return {artifactId:ref.artifactId,jobId:ref.jobId,invocationId:ref.invocationId,digest:ref.digest,bytes:ref.bytes,schema:ref.schema};
};

export const createImportArtifacts=(privateDataRoot:string,options:Readonly<{maxEncodedBytes?:number}>={}):ImportArtifacts=>{
  const max=options.maxEncodedBytes ?? MAX_IMPORT_ARTIFACT_BYTES;
  const uid=process.getuid?.();
  if(typeof privateDataRoot !== "string" || !isAbsolute(privateDataRoot) || resolve(privateDataRoot) !== privateDataRoot || privateDataRoot.includes("\0") || privateDataRoot.length > 4096 || uid === undefined || !Number.isSafeInteger(max) || max < 1 || max > MAX_IMPORT_ARTIFACT_BYTES || !constants.O_NOFOLLOW || !constants.O_DIRECTORY) throw failure("invalid_input");
  const owner=BigInt(uid);
  let rootIdentity:BigIntStats|null=null;
  const directorySafe=(stat:BigIntStats)=>stat.isDirectory() && stat.uid === owner && (stat.mode & 0o777n) === 0o700n;
  const fileSafe=(stat:BigIntStats)=>stat.isFile() && stat.uid === owner && (stat.mode & 0o777n) === 0o600n && stat.nlink === 1n;
  const checkChain=async(chain:readonly HeldDirectory[])=>{
    for(const item of chain) {
      const current=await lstat(item.path,{bigint:true});
      if(!directorySafe(current) || !same(current,item.identity) || !same(await item.handle.stat({bigint:true}),item.identity) || await realpath(item.path) !== item.path) throw failure("replaced");
    }
  };
  const openChain=async(jobId:string,invocationId:string,create:boolean):Promise<HeldDirectory[]>=>{
    const chain:HeldDirectory[]=[];
    try {
      for(const [index,path] of [privateDataRoot,join(privateDataRoot,"import-artifacts"),join(privateDataRoot,"import-artifacts",jobId),join(privateDataRoot,"import-artifacts",jobId,invocationId)].entries()) {
        const unsafe=index === 0 ? "unsafe_root" : "unsafe_parent";
        await checkChain(chain);
        if(index > 0 && create) try {await mkdir(path,{mode:0o700});} catch(error) {if(fsCode(error) !== "EEXIST") throw error;}
        let before:BigIntStats;
        try {before=await lstat(path,{bigint:true});} catch(error) {if(fsCode(error) === "ENOENT") throw failure(index === 0 ? "unsafe_root" : "missing");throw error;}
        if(!directorySafe(before) || await realpath(path) !== path) throw failure(unsafe);
        const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_DIRECTORY);
        const identity=await handle.stat({bigint:true});
        chain.push({path,handle,identity});
        if(!directorySafe(identity) || !same(before,identity)) throw failure("replaced");
        if(index === 0) {
          if(rootIdentity && !same(rootIdentity,identity)) throw failure("replaced");
          rootIdentity=identity;
        }
        await checkChain(chain);
      }
      return chain;
    } catch(error) {
      await Promise.allSettled(chain.map(item=>item.handle.close()));
      if(isImportArtifactError(error)) throw error;
      if(["ELOOP","ENOTDIR"].includes(String(fsCode(error)))) throw failure("unsafe_parent");
      throw failure("io");
    }
  };
  const descriptorBytes=async(handle:FileHandle,expected:Pick<ArtifactReference,"bytes"|"digest">):Promise<Buffer>=>{
    const before=await handle.stat({bigint:true});
    if(!fileSafe(before)) throw failure("unsafe_file");
    if(before.size !== BigInt(expected.bytes)) throw failure("integrity_mismatch");
    const bytes=Buffer.alloc(expected.bytes+1);
    let count=0;
    while(count < bytes.length) {
      const result=await handle.read(bytes,count,bytes.length-count,count);
      if(result.bytesRead === 0) break;
      count+=result.bytesRead;
    }
    const after=await handle.stat({bigint:true});
    if(!stable(before,after)) throw failure("replaced");
    if(count !== expected.bytes || hash(bytes.subarray(0,count)) !== expected.digest) throw failure("integrity_mismatch");
    return bytes.subarray(0,count);
  };
  const closeResources=async(handle:FileHandle|undefined,chain:readonly HeldDirectory[])=>{
    const handles=[...(handle ? [handle] : []),...chain.map(item=>item.handle)];
    const results=await Promise.allSettled(handles.map(async current=>{await current.close();}));
    return results.some(result=>result.status === "rejected");
  };
  return Object.freeze({
    write:async({jobId,invocationId,value})=>{
      if(!uuid(jobId) || !uuid(invocationId)) throw failure("invalid_input");
      const artifactId=randomUUID();
      let bytes:Buffer;
      try {bytes=Buffer.from(JSON.stringify({schema:"import-result-v1",artifactId,jobId,invocationId,value:jsonCopy(value)}),"utf8");} catch(error) {if(isImportArtifactError(error)) throw error;throw failure("invalid_json");}
      if(bytes.length > max) throw failure("too_large");
      const ref:ArtifactReference=Object.freeze({artifactId,jobId,invocationId,digest:hash(bytes),bytes:bytes.length,schema:"import-result-v1"});
      const chain=await openChain(jobId,invocationId,true);
      const dir=chain.at(-1)!;
      const temp=join(dir.path,`.tmp-${artifactId}-${randomUUID()}.json`),final=join(dir.path,`${artifactId}.json`);
      let handle:FileHandle|undefined,identity:BigIntStats|undefined,published=false,failed=false;
      try {
        await checkChain(chain);
        handle=await open(temp,constants.O_RDWR|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
        identity=await handle.stat({bigint:true});
        if(!fileSafe(identity)) throw failure("unsafe_file");
        await checkChain(chain);await handle.writeFile(bytes);await handle.sync();
        await descriptorBytes(handle,ref);
        if(!same(await lstat(temp,{bigint:true}),identity)) throw failure("replaced");
        await checkChain(chain);await link(temp,final);published=true;
        if(!same(await lstat(final,{bigint:true}),identity)) throw failure("replaced");
        await unlink(temp);await dir.handle.sync();await checkChain(chain);
        const finalStat=await lstat(final,{bigint:true});
        if(!fileSafe(finalStat) || !same(finalStat,identity)) throw failure("replaced");
        return ref;
      } catch(error) {
        failed=true;
        if(published) throw failure("publication_unknown");
        if(isImportArtifactError(error)) throw error;
        if(fsCode(error) === "EEXIST") throw failure("conflict");
        throw failure("io");
      } finally {
        if(identity) try {await checkChain(chain);const current=await lstat(temp,{bigint:true});if(same(current,identity)) await unlink(temp);} catch { /* Preserve uncertain paths; final artifacts are never removed here. */ }
        if(await closeResources(handle,chain) && !failed) throw failure(published ? "publication_unknown" : "io");
      }
    },
    read:async({reference:raw,expectedJobId,expectedInvocationId})=>{
      if(!uuid(expectedJobId) || !uuid(expectedInvocationId)) throw failure("invalid_input");
      const ref=reference(raw,max);
      if(ref.jobId !== expectedJobId || ref.invocationId !== expectedInvocationId) throw failure("binding_mismatch");
      const chain=await openChain(ref.jobId,ref.invocationId,false);
      const path=join(chain.at(-1)!.path,`${ref.artifactId}.json`);
      let handle:FileHandle|undefined,failed=false;
      try {
        await checkChain(chain);
        const before=await lstat(path,{bigint:true});if(!fileSafe(before)) throw failure("unsafe_file");
        handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
        const opened=await handle.stat({bigint:true});if(!fileSafe(opened) || !same(before,opened)) throw failure("replaced");
        const bytes=await descriptorBytes(handle,ref);
        await checkChain(chain);
        const after=await lstat(path,{bigint:true});if(!same(after,opened) || !stable(opened,after)) throw failure("replaced");
        let envelope:unknown;
        try {envelope=JSON.parse(new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes)) as unknown;} catch {throw failure("invalid_json");}
        if(!envelope || typeof envelope !== "object" || Array.isArray(envelope) || Object.keys(envelope).sort().join(",") !== "artifactId,invocationId,jobId,schema,value") throw failure("invalid_json");
        const bound=envelope as {schema:unknown;artifactId:unknown;jobId:unknown;invocationId:unknown;value:unknown};
        if(bound.schema !== ref.schema || bound.artifactId !== ref.artifactId || bound.jobId !== ref.jobId || bound.invocationId !== ref.invocationId) throw failure("binding_mismatch");
        return bound.value;
      } catch(error) {
        failed=true;
        if(isImportArtifactError(error)) throw error;
        if(fsCode(error) === "ENOENT") throw failure("missing");
        if(["ELOOP","ENOTDIR"].includes(String(fsCode(error)))) throw failure("unsafe_file");
        throw failure("io");
      } finally {if(await closeResources(handle,chain) && !failed) throw failure("io");}
    },
  } satisfies ImportArtifacts);
};
