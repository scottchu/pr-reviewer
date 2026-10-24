import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat,mkdir,open} from 'node:fs/promises';
import {dirname,join,isAbsolute} from 'node:path';
import {headTestCanonical} from '../domain/public.ts';
export type HeadGitRequest = Readonly<{role:'commit'|'tree'|'listing';objectId:string}|{role:'batch';objectIds:readonly string[];inputDigest:string;inputBytes:number}>;
export type HeadGitRead = (request:HeadGitRequest)=>Promise<AsyncIterable<Uint8Array>>;
export type HeadSourceEntry=Readonly<{path:string;mode:'100644'|'100755';objectId:string;bytes:number;sha256:string}>;
export type HeadSourceManifest=Readonly<{schema:'head-source-v1';repository:'github.com/scottchu/pr-reviewer';headSha:string;treeId:string;entries:readonly HeadSourceEntry[]}>;
export const headDigest=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
const objectHash=(kind:string,body:Buffer,oid:string)=>createHash(oid.length===40?'sha1':'sha256').update(`${kind} ${body.length}\0`).update(body).digest('hex');
const oidPattern=/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const decode=(body:Uint8Array)=>{try{return new TextDecoder('utf-8',{fatal:true}).decode(body);}catch{throw new Error('source_path_unavailable');}};
export const validateHeadSourcePath=(path:string):void=>{
 const parts=path.split('/');
 if(!path||isAbsolute(path)||path.length>4096||parts.some(part=>!part||part==='.'||part==='..'||/[\x00-\x1f\x7f\\:]/.test(part)||/[ .]$/.test(part)||['.git','node_modules','.npmrc','bunfig.toml','.bunfig.toml','.tool-versions','.bun-version','.node-version','.nvmrc'].includes(part.toLowerCase())||part.toLowerCase().startsWith('.env')||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)))throw new Error('source_path_unavailable');
};
const collect=async(stream:AsyncIterable<Uint8Array>,max:number,check:()=>void):Promise<Buffer>=>{
 const chunks:Buffer[]=[];let bytes=0;for await(const chunk of stream){check();bytes+=chunk.length;if(bytes>max)throw new Error('source_limit');chunks.push(Buffer.from(chunk));}check();return Buffer.concat(chunks);
};
const directory=async(root:string,path:string)=>{
 let current=root;for(const part of path.split('/').filter(Boolean)){current=join(current,part);try{await mkdir(current,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}const stat=await lstat(current);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('source_path_unavailable');}
};
export const writeHeadSourceFile=async(root:string,entry:Pick<HeadSourceEntry,'path'|'mode'>,bytes:Buffer,check:()=>void)=>{
 check();validateHeadSourcePath(entry.path);const parent=dirname(entry.path);if(parent!=='.')await directory(root,parent);
 const file=await open(join(root,entry.path),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,entry.mode==='100755'?0o755:0o644);
 try{for(let offset=0;offset<bytes.length;){check();const result=await file.write(bytes,offset,Math.min(65536,bytes.length-offset));if(result.bytesWritten===0)throw new Error('source_write_failed');offset+=result.bytesWritten;}await file.chmod(entry.mode==='100755'?0o755:0o644);}finally{await file.close();}
};
export const materializeHeadTestSource=async({headSha,destination,read,check}:{headSha:string;destination:string;read:HeadGitRead;check:()=>void})=>{
 if(!oidPattern.test(headSha))throw new Error('source_identity_conflict');check();await mkdir(destination,{mode:0o700});
 const commit=await collect(await read({role:'commit',objectId:headSha}),8*1024*1024,check);if(objectHash('commit',commit,headSha)!==headSha)throw new Error('source_identity_conflict');
 const treeId=/^tree ([a-f0-9]{40}|[a-f0-9]{64})\n/.exec(decode(commit))?.[1];if(!treeId||treeId.length!==headSha.length)throw new Error('source_identity_conflict');
 const tree=await collect(await read({role:'tree',objectId:treeId}),8*1024*1024,check);if(objectHash('tree',tree,treeId)!==treeId)throw new Error('source_identity_conflict');
 const listing=await collect(await read({role:'listing',objectId:headSha}),8*1024*1024,check),seen=new Set<string>();
 const entries:Omit<HeadSourceEntry,'sha256'>[]=[];let sourceBytes=0;
 if(listing.length===0||listing.at(-1)!==0)throw new Error('source_listing_invalid');
 for(const line of decode(listing).split('\0').slice(0,-1)){
  check();const matched=/^(100644|100755) blob ([a-f0-9]{40}|[a-f0-9]{64}) +([0-9]+)\t(.+)$/.exec(line);if(!matched)throw new Error('source_listing_invalid');
  const path=matched[4]!,bytes=Number(matched[3]),objectId=matched[2]!;validateHeadSourcePath(path);const normalized=path.normalize('NFC').toLowerCase();if(seen.has(normalized))throw new Error('source_path_unavailable');seen.add(normalized);
  if(objectId.length!==headSha.length||!Number.isSafeInteger(bytes)||bytes>8*1024*1024||entries.length>=8192||(sourceBytes+=bytes)>64*1024*1024)throw new Error('source_limit');
  entries.push({path,mode:matched[1] as '100644'|'100755',objectId,bytes});
 }
 const objectIds=[...new Set(entries.map(entry=>entry.objectId))],input=Buffer.from(objectIds.map(id=>`${id}\n`).join(''));
 if(input.length>8192*65)throw new Error('source_limit');
 const stream=await read({role:'batch',objectIds,inputDigest:headDigest(input),inputBytes:input.length});
 let buffer=Buffer.alloc(0),index=0,length:number|null=null,received=0;const complete:HeadSourceEntry[]=[];
 for await(const chunk of stream){
  check();if(chunk.length>65536)throw new Error('source_batch_chunk_limit');received+=chunk.length;if(received>sourceBytes+objectIds.length*129)throw new Error('source_batch_invalid');buffer=Buffer.concat([buffer,chunk]);
  while(true){
   if(index>=objectIds.length){if(buffer.length)throw new Error('source_batch_invalid');break;}
   const expected=objectIds[index]!;
   if(length===null){const end=buffer.indexOf(10);if(end<0){if(buffer.length>128)throw new Error('source_batch_invalid');break;}if(end>128)throw new Error('source_batch_invalid');const header=/^([a-f0-9]{40}|[a-f0-9]{64}) blob ([0-9]+)$/.exec(decode(buffer.subarray(0,end)));if(!header||header[1]!==expected)throw new Error('source_batch_invalid');length=Number(header[2]);if(!Number.isSafeInteger(length)||length>8*1024*1024||entries.some(entry=>entry.objectId===expected&&entry.bytes!==length))throw new Error('source_batch_invalid');buffer=buffer.subarray(end+1);}
   if(buffer.length<length+1)break;if(buffer[length]!==10)throw new Error('source_batch_invalid');const body=buffer.subarray(0,length);if(objectHash('blob',body,expected)!==expected)throw new Error('source_identity_conflict');
   for(const entry of entries.filter(item=>item.objectId===expected)){
    if(entry.path.endsWith('.gitattributes')&&/(?:^|\s)(?:filter|working-tree-encoding)(?:=|\s|$)/m.test(decode(body)))throw new Error('source_filter_unavailable');
    await writeHeadSourceFile(destination,entry,body,check);complete.push({...entry,sha256:headDigest(body)});
   }
   buffer=buffer.subarray(length+1);length=null;index++;
  }
 }
 check();if(index!==objectIds.length||length!==null||buffer.length||complete.length!==entries.length)throw new Error('source_batch_invalid');
 const manifest:HeadSourceManifest={schema:'head-source-v1',repository:'github.com/scottchu/pr-reviewer',headSha,treeId,entries:complete.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)};
 return {manifest,sourceManifestId:headDigest(headTestCanonical(manifest))};
};
