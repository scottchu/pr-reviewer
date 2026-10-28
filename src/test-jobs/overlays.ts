import {lstat,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {headTestCanonical} from '../domain/public.ts';
import {readHeadRegular} from './files.ts';
import {headDigest} from './source.ts';
import type {HeadFileEntry} from './files.ts';
/** Bounded measurement of owned writable directories; filenames are policy, not origin proof. */
export const inspectHeadOverlays=async(root:string,phase:'pre'|'post',check:()=>void)=>{
 const files:HeadFileEntry[]=[],directories:string[]=[],topLevel:string[]=[];let bytes=0,reason:string|null=null,complete=false;const deadline=Date.now()+5000;
 const bounded=()=>{check();if(Date.now()>=deadline)throw new Error('overlay_deadline');};
 const visit=async(relative:string,depth:number):Promise<void>=>{
  bounded();const parent=await lstat(join(root,relative));if(!parent.isDirectory()||parent.isSymbolicLink())throw new Error('overlay_unavailable');
  if(depth>4)throw new Error('overlay_limit');
  const names=await readdir(join(root,relative));if(names.length>544)throw new Error('overlay_limit');
  for(const name of names.sort()){
   bounded();if(/[\x00-\x1f\x7f\\:/]/.test(name))throw new Error('overlay_unavailable');
   const path=`${relative}/${name}`,stat=await lstat(join(root,path));
   if(stat.isSymbolicLink()||(stat.mode&0o7000)!==0)throw new Error('overlay_unavailable');
   if(stat.isDirectory()){if(directories.length>=32)throw new Error('overlay_limit');directories.push(path);await visit(path,depth+1);}
   else{if(!stat.isFile()||stat.nlink!==1||stat.size>16*1024*1024||files.length>=512||(bytes+=stat.size)>32*1024*1024)throw new Error('overlay_limit');const data=await readHeadRegular(join(root,path),16*1024*1024,bounded);files.push({path,mode:stat.mode&0o777,bytes:data.length,sha256:headDigest(data)});}
  }
 };
 try{
  bounded();const names=(await readdir(root)).sort();topLevel.push(...names.slice(0,16));if(headTestCanonical(names)!==headTestCanonical(['cache','config','empty','empty-bunfig.toml','home','source','tmp']))throw new Error('unexpected_owned_overlay');
  for(const dir of ['home','tmp','config','empty','cache'])await visit(dir,0);
  complete=true;
  const allowed=phase==='post'&&files.every(file=>/^cache\/bun\/@t@\/[a-f0-9]{16}\.pile$/.test(file.path))&&directories.every(dir=>dir==='cache/bun'||dir==='cache/bun/@t@');
  if((files.length||directories.length)&&!allowed)reason='unexpected_owned_overlay';
 }catch(error){reason=error instanceof Error&&/^[a-z][a-z0-9_]{0,63}$/.test(error.message)?error.message:'overlay_unavailable';}
 const account={schema:'head-overlay-v1' as const,phase,complete,reason,files,directories,topLevel,bytes};return {...account,digest:headDigest(headTestCanonical(account))};
};
