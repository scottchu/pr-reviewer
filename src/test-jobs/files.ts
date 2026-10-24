import {constants} from 'node:fs';
import {lstat,mkdir,open,readdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {headTestCanonical} from '../domain/public.ts';
import {headDigest} from './source.ts';
export type HeadFileEntry=Readonly<{path:string;mode:number;bytes:number;sha256:string}>;
const regular=async(path:string,max:number,check:()=>void):Promise<Buffer>=>{
 check();const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{const before=await file.stat();if(!before.isFile()||before.nlink!==1||before.size>max)throw new Error('environment_unavailable');const chunks:Buffer[]=[];let bytes=0;
  while(true){check();const chunk=Buffer.alloc(65536),result=await file.read(chunk,0,chunk.length,null);if(!result.bytesRead)break;bytes+=result.bytesRead;if(bytes>max)throw new Error('environment_limit');chunks.push(chunk.subarray(0,result.bytesRead));}
  const after=await file.stat();if(before.size!==bytes||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.ctimeMs!==before.ctimeMs)throw new Error('environment_changed');return Buffer.concat(chunks);
 }finally{await file.close();}
};
const plainDirectory=async(path:string)=>{const stat=await lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('environment_unavailable');};
export const inventoryHeadFiles=async(root:string,check:()=>void):Promise<readonly HeadFileEntry[]>=>{
 await plainDirectory(root);const entries:HeadFileEntry[]=[],seen=new Set<string>();let total=0,dirs=0;
 const visit=async(relative:string,depth:number):Promise<void>=>{
  check();if(depth>128||++dirs>32768)throw new Error('environment_limit');
  for(const name of (await readdir(join(root,relative))).sort()){
   check();if(!name||name==='.'||name==='..'||/[\x00-\x1f\x7f\\:/]/.test(name))throw new Error('environment_unavailable');
   const path=relative?`${relative}/${name}`:name,normalized=path.normalize('NFC').toLowerCase();if(seen.has(normalized))throw new Error('environment_unavailable');seen.add(normalized);
   const full=join(root,path),stat=await lstat(full);if(stat.isSymbolicLink())throw new Error('environment_unavailable');
   if(stat.isDirectory()){await visit(path,depth+1);continue;}
   if(!stat.isFile()||stat.nlink!==1||(stat.mode&0o7000)!==0)throw new Error('environment_unavailable');
   if(stat.size>32*1024*1024||entries.length>=32768||(total+=stat.size)>64*1024*1024)throw new Error('environment_limit');
   const bytes=await regular(full,32*1024*1024,check);entries.push({path,mode:stat.mode&0o777,bytes:bytes.length,sha256:headDigest(bytes)});
  }
 };
 await visit('',0);return entries.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
};
const object=(bytes:Buffer):Record<string,unknown>=>{try{const value:unknown=JSON.parse(bytes.toString('utf8'));if(value===null||typeof value!=='object'||Array.isArray(value))throw new Error();return value as Record<string,unknown>;}catch{throw new Error('environment_unavailable');}};
const scripts=(manifest:Record<string,unknown>):Record<string,unknown>=>{const value=manifest.scripts;if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('target_incompatible');return value as Record<string,unknown>;};
const withoutScripts=({scripts:_scripts,...manifest}:Record<string,unknown>)=>manifest;
const writeCopy=async(root:string,entry:HeadFileEntry,bytes:Buffer,check:()=>void)=>{
 let parent=root;for(const component of dirname(entry.path).split('/').filter(part=>part!=='.')){parent=join(parent,component);try{await mkdir(parent,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}await plainDirectory(parent);}
 const file=await open(join(root,entry.path),constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,entry.mode);
 try{let offset=0;while(offset<bytes.length){check();const result=await file.write(bytes,offset,Math.min(65536,bytes.length-offset));if(!result.bytesWritten)throw new Error('environment_copy_failed');offset+=result.bytesWritten;}await file.chmod(entry.mode);}finally{await file.close();}
};
export const copyHeadTestClosure=async({source,donor,check}:{source:string;donor:string;check:()=>void})=>{
 await plainDirectory(source);await plainDirectory(donor);await plainDirectory(join(donor,'node_modules'));
 const sourcePackage=await regular(join(source,'package.json'),1024*1024,check),donorPackage=await regular(join(donor,'package.json'),1024*1024,check),sourceLock=await regular(join(source,'bun.lock'),8*1024*1024,check),donorLock=await regular(join(donor,'bun.lock'),8*1024*1024,check);
 const a=object(sourcePackage),b=object(donorPackage);if(!sourceLock.equals(donorLock)||headTestCanonical(withoutScripts(a))!==headTestCanonical(withoutScripts(b)))throw new Error('environment_unavailable');
 const as=scripts(a),bs=scripts(b);if(typeof as.test!=='string'||as.test.split(' && ')[0]!=='bun test tests/domain.test.ts tests/registry.test.ts tests/graph.test.ts tests/source-analysis.test.ts')throw new Error('target_incompatible');
 const changedScriptKeys=[...new Set([...Object.keys(as),...Object.keys(bs)])].filter(key=>headTestCanonical(as[key])!==headTestCanonical(bs[key])).sort();if(changedScriptKeys.some(key=>key!=='test'))throw new Error('environment_unavailable');
 const metadata={sourcePackageSha256:headDigest(sourcePackage),donorPackageSha256:headDigest(donorPackage),nonScriptPackageDigest:headDigest(headTestCanonical(withoutScripts(a))),lockSha256:headDigest(sourceLock),changedScriptKeys};
 const target=join(source,'node_modules');await mkdir(target,{mode:0o700});const packages:{entry:string;packageName:string;version:string;entries:readonly HeadFileEntry[]}[]=[];let files=0,total=0;
 for(const [entry,name,version] of [['zod','zod','4.6.7'],['typescript-analysis','typescript','6.0.3']] as const){
  check();const original=join(donor,'node_modules',entry);await plainDirectory(original);const before=await inventoryHeadFiles(original,check),manifest=object(await regular(join(original,'package.json'),1024*1024,check));
  if(manifest.name!==name||manifest.version!==version||manifest.dependencies&&Object.keys(manifest.dependencies as object).length>0)throw new Error('environment_unavailable');
  files+=before.length;total+=before.reduce((sum,item)=>sum+item.bytes,0);if(files>32768||total>64*1024*1024)throw new Error('environment_limit');
  const copy=join(target,entry);await mkdir(copy,{mode:0o700});
  for(const item of before){check();const bytes=await regular(join(original,item.path),32*1024*1024,check);if(bytes.length!==item.bytes||headDigest(bytes)!==item.sha256)throw new Error('environment_changed');await writeCopy(copy,item,bytes,check);}
  const after=await inventoryHeadFiles(original,check),copied=await inventoryHeadFiles(copy,check);if(headTestCanonical(before)!==headTestCanonical(after)||headTestCanonical(before)!==headTestCanonical(copied))throw new Error('environment_changed');
  packages.push({entry,packageName:name,version,entries:before});
 }
 if(!sourcePackage.equals(await regular(join(source,'package.json'),1024*1024,check))||!donorPackage.equals(await regular(join(donor,'package.json'),1024*1024,check))||!sourceLock.equals(await regular(join(source,'bun.lock'),8*1024*1024,check))||!donorLock.equals(await regular(join(donor,'bun.lock'),8*1024*1024,check)))throw new Error('environment_changed');
 const manifest={schema:'head-closure-v1' as const,packages};return {manifest,closureManifestId:headDigest(headTestCanonical(manifest)),metadata};
};
export const readHeadRegular=regular;
