import ts from 'typescript-analysis';
import {posix} from 'node:path';
import {headTestCanonical,headTestDefinition} from '../domain/public.ts';
import {headDigest} from './source.ts';
import type {HeadSourceManifest} from './source.ts';
import {readHeadRegular} from './files.ts';
export type HeadSourceAccount=Readonly<{schema:'head-test-source-account-v1';headSha:string;files:readonly Readonly<{path:string;sha256:string;imports:readonly string[]}>[];packages:readonly string[];selectors:readonly string[]}>;
/** Conservative account of an explicitly trusted configured local head, not hostile-code containment. */
export const accountHeadTestSource=async(root:string,manifest:HeadSourceManifest,check:()=>void)=>{
 const selectors=headTestDefinition().argvTemplate.slice(4),entries=new Map(manifest.entries.map(entry=>[entry.path,entry]));
 for(const selector of selectors){const matches=manifest.entries.filter(entry=>entry.path.includes(selector));if(matches.length!==1||matches[0]!.path!==selector)throw new Error('target_selector_incompatible');}
 const queue:string[]=[...selectors],seen=new Set<string>(),files:{path:string;sha256:string;imports:string[]}[]=[],packages=new Set<string>();let bytes=0;
 while(queue.length){check();const path=queue.shift()!;if(seen.has(path))continue;seen.add(path);const entry=entries.get(path);if(!entry||seen.size>256)throw new Error('source_account_unavailable');
  const content=await readHeadRegular(posix.join(root,path),8*1024*1024,check);if(headDigest(content)!==entry.sha256||(bytes+=content.length)>8*1024*1024)throw new Error('source_account_unavailable');
  let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(content);}catch{throw new Error('source_account_unavailable');}
  const ast=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),imports=new Set<string>();
  if((ast as ts.SourceFile & {parseDiagnostics:readonly ts.Diagnostic[]}).parseDiagnostics.length)throw new Error('source_account_unavailable');
  const add=(specifier:string)=>{
   imports.add(specifier);
   if(specifier.startsWith('.')){const resolved=posix.normalize(posix.join(posix.dirname(path),specifier));if(resolved.startsWith('../')||!entries.has(resolved)||!resolved.endsWith('.ts'))throw new Error('source_account_unavailable');queue.push(resolved);}
   else if(['zod','typescript-analysis','bun:test','node:crypto'].includes(specifier))packages.add(specifier);
   else throw new Error('source_account_unavailable');
  };
  const visit=(node:ts.Node):void=>{
   if(ts.isImportDeclaration(node)){if(node.importClause?.isTypeOnly)return;if(!ts.isStringLiteral(node.moduleSpecifier))throw new Error('source_account_unavailable');add(node.moduleSpecifier.text);}
   if(ts.isExportDeclaration(node)&&!node.isTypeOnly&&node.moduleSpecifier){if(!ts.isStringLiteral(node.moduleSpecifier))throw new Error('source_account_unavailable');add(node.moduleSpecifier.text);}
   if(ts.isImportEqualsDeclaration(node))throw new Error('source_account_unavailable');
   if(ts.isCallExpression(node)||ts.isNewExpression(node)){
    const callee=node.expression;
    if(callee.kind===ts.SyntaxKind.ImportKeyword){const specifier=node.arguments?.[0];if(node.arguments?.length!==1||!specifier||!ts.isStringLiteral(specifier))throw new Error('source_account_unavailable');add(specifier.text);}
    if(ts.isIdentifier(callee)&&['eval','Function','require','fetch','WebSocket'].includes(callee.text))throw new Error('source_account_unavailable');
    if(ts.isPropertyAccessExpression(callee)&&ts.isIdentifier(callee.expression)&&['Bun','Deno'].includes(callee.expression.text)&&['spawn','spawnSync','serve','connect','listen','write','file'].includes(callee.name.text))throw new Error('source_account_unavailable');
   }
   ts.forEachChild(node,visit);
  };
  visit(ast);files.push({path,sha256:entry.sha256,imports:[...imports].sort()});
 }
 const account:HeadSourceAccount={schema:'head-test-source-account-v1',headSha:manifest.headSha,files:files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),packages:[...packages].sort(),selectors};
 return {account,sourceAccountId:headDigest(headTestCanonical(account))};
};
