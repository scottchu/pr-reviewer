import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import fixture from './paths.json' with {type:'json'};
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const trees=new Map([fixture.base,fixture.head].map(commit=>[commit,new Set(git('ls-tree','-r','--name-only','-z',commit).split('\0').filter(Boolean))]));
const readSide=(commit:string,path:string)=>trees.get(commit)!.has(path)?{commit,hash:hash(git('show',`${commit}:${path}`)),available:true}:{commit,hash:null,available:false};
type Row={kind:'context'|'removed'|'added';beforeLine:number|null;afterLine:number|null;text:string};
type Hunk={header:string;beforeStart:number;beforeCount:number;afterStart:number;afterCount:number;rows:Row[]};
const files=fixture.paths.map(path=>{
 const patch=git('diff','--no-ext-diff','--no-color','--unified=3',fixture.base,fixture.head,'--',path);const hunks:Hunk[]=[];let hunk:Hunk|null=null,before=0,after=0;
 for(const line of patch.split('\n')){
  const match=/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if(match){hunk={header:line,beforeStart:Number(match[1]),beforeCount:Number(match[2]??1),afterStart:Number(match[3]),afterCount:Number(match[4]??1),rows:[]};hunks.push(hunk);before=hunk.beforeStart;after=hunk.afterStart;continue;}
  if(!hunk||line.startsWith('\\')||![' ','+','-'].includes(line[0]??''))continue;
  const kind=line[0]==='+'?'added':line[0]==='-'?'removed':'context';hunk.rows.push({kind,beforeLine:kind==='added'?null:before++,afterLine:kind==='removed'?null:after++,text:line.slice(1)});
 }
 return {path,before:readSide(fixture.base,path),after:readSide(fixture.head,path),patchHash:hash(patch),hunks};
});
const value={base:fixture.base,head:fixture.head,provenance:'Native Git unified hunks from the exact comparison; rows retain source text without a synthetic function pairing.',files};writeFileSync(fileURLToPath(new URL('./diffs.json',import.meta.url)),JSON.stringify(value,null,2)+'\n');
console.log(JSON.stringify({files:files.length,hunks:files.reduce((n,f)=>n+f.hunks.length,0),added:files.flatMap(f=>f.hunks.flatMap(h=>h.rows)).filter(r=>r.kind==='added').length,removed:files.flatMap(f=>f.hunks.flatMap(h=>h.rows)).filter(r=>r.kind==='removed').length}));
