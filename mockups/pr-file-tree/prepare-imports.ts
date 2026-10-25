import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {dirname,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript-analysis';
import paths from './paths.json' with {type:'json'};
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const contents=new Map<string,string>();
const read=(commit:string,path:string)=>{const key=`${commit}:${path}`;let text=contents.get(key);if(text===undefined){text=git('show',key);contents.set(key,text);}return text;};
const records:{from:string;side:'before'|'after';commit:string;sourceHash:string;sourceLine:number;startOffset:number;endOffset:number;specifier:string;target:string|null;targetHash:string|null}[]=[];
const sources:{path:string;side:'before'|'after';commit:string;hash:string;staticRelativeImports:number}[]=[];
for(const [side,commit] of [['before',paths.base],['after',paths.head]] as const){
 const members=new Set(git('ls-tree','-r','--name-only','-z',commit).split('\0').filter(Boolean));
 for(const path of paths.paths){
  if(!members.has(path)||!/\.[cm]?[jt]sx?$/.test(path))continue;
  const content=read(commit,path),source=ts.createSourceFile(path,content,ts.ScriptTarget.Latest,true);let count=0;
  for(const statement of source.statements){
   if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
   const specifier=statement.moduleSpecifier.text;if(!specifier.startsWith('.'))continue;count++;
   const relative=posix.normalize(posix.join(posix.dirname(path),specifier));
   const candidates=[relative,...(/\.jsx?$/.test(relative)?[relative.replace(/\.jsx?$/,'.ts'),relative.replace(/\.jsx?$/,'.tsx')]:[]),...['.ts','.tsx','.js','.jsx','.mjs','.cjs','/index.ts','/index.tsx','/index.js'].map(suffix=>relative+suffix)];
   const target=candidates.find(candidate=>!candidate.startsWith('../')&&members.has(candidate))??null;
   const start=statement.moduleSpecifier.getStart(source),end=statement.moduleSpecifier.getEnd();
   records.push({from:path,side,commit,sourceHash:digest(content),sourceLine:source.getLineAndCharacterOfPosition(start).line+1,startOffset:start,endOffset:end,specifier,target,targetHash:target?digest(read(commit,target)):null});
  }
  sources.push({path,side,commit,hash:digest(content),staticRelativeImports:count});
 }
}
const result={base:paths.base,head:paths.head,scope:'Static relative import declarations only, including type imports; no package/dynamic imports, exports, calls or runtime inference.',sources,records};
writeFileSync(fileURLToPath(new URL('./imports.json',import.meta.url)),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({records:records.length,sources:sources.length,unresolved:records.filter(r=>r.target===null).length,fixtureSha256:digest(JSON.stringify(result,null,2)+'\n')}));
