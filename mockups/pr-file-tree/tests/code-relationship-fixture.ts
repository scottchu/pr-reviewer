import {createHash} from 'node:crypto';
import type {GraphEntity,SourceAnchor,SourceGraph} from '../../../src/review-graph/domain/types.ts';
import type {EditComposition} from '../../../src/review-graph/domain/edit-composition.ts';

/** Authored source and canonical evidence, independent of PR25 aliases/preparation. */
export const relationshipFixture=(kind:'function'|'test'='function'):SourceGraph=>{
    const repository='fixture/repo',base='before',head='after',path='src/change.ts',targetPath='src/access.ts';
    const before=(kind==='test'?"test('sample', () => {\n":"const subject = () => {\n")+'  const headers = {Authorization: token};\n'+(kind==='test'?' });\n':'};\n');
    const after=(kind==='test'?"test('sample', () => {\n":"const subject = () => {\n")+'  const headers = accessHeaders(token);\n'+(kind==='test'?' });\n':'};\n');
    const target='export const accessHeaders = token => ({Authorization:token});\n';
    const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
    const anchor=(side:'base'|'head',text:string,start:number,end:number,sourcePath=path):SourceAnchor=>({repository,side,commit:side==='base'?base:head,path:sourcePath,contentHash:hash(text),start,end,startLine:text.slice(0,start).split('\n').length,endLine:text.slice(0,Math.max(start,end-1)).split('\n').length});
    const ba=anchor('base',before,0,before.length),ha=anchor('head',after,0,after.length);
    const property='Authorization: token',callText='accessHeaders(token)';
    const propertyAnchor=anchor('base',before,before.indexOf(property),before.indexOf(property)+property.length);
    const callAnchor=anchor('head',after,after.indexOf(callText),after.indexOf(callText)+callText.length);
    const removed=before.split('\n')[1]+'\n',added=after.split('\n')[1]+'\n';
    const rows=[{kind:'remove' as const,text:removed,beforeLine:2,afterLine:null},{kind:'add' as const,text:added,beforeLine:null,afterLine:2}];
    const edit:EditComposition={status:'change',scope:'file',removed:1,added:1,rows,hunks:[{index:1,header:'@@ -2 +2 @@',rows,before:{side:'base',commit:base,path,contentHash:hash(before),startLine:2,endLine:2,text:removed},after:{side:'head',commit:head,path,contentHash:hash(after),startLine:2,endLine:2,text:added}}]};
    const file=(id:string,p:string,b:string,h:string):GraphEntity=>({id,kind:'file',data:{repository,path:p,comparisonStatus:id==='file'?'change':'no change',comparisonBasis:'Pinned native diff',sourceEvidence:[{side:'base',commit:base,available:true,contentHash:hash(b)},{side:'head',commit:head,available:true,contentHash:hash(h)}],...(id==='file'?{editComposition:edit}:{})}});
    const subject:GraphEntity={id:'subject',kind,data:{name:'subject',comparisonStatus:'change',comparisonBasis:'Admitted qualified source correspondence',sourceWitnesses:[{id:'subject-before',anchor:ba},{id:'subject-after',anchor:ha}],editComposition:{...edit,scope:'source unit'}}};
    const calls=[{id:'site-occurrence',site:{sourceText:callText,anchor:callAnchor}}];
    const callData={method:'mechanically-supported-lexical-binding',sourceCalls:calls};
    return {entities:[file('file',path,before,after),file('target-file',targetPath,target,target),{id:'change',kind:'change',data:{name:'source change'},nodes:[subject,{id:'property',kind:'header',data:{name:'Authorization',sourceWitnesses:[{id:'property-before',anchor:propertyAnchor}]}},{id:'site',kind:'callsite',data:{value:callText,occurrences:[callAnchor]}}]},{id:'target',kind:'function',data:{name:'accessHeaders()',comparisonStatus:'no change',sourceWitnesses:[{id:'target-after',anchor:anchor('head',target,0,target.length,targetPath)}]}}],relations:[
        {id:'construct',from:'subject',to:'property',relation:'constructs',version:'before',data:{sourceEvidence:propertyAnchor}},
        {id:'contains-site',from:'subject',to:'site',relation:'contains_call',version:'after',data:callData},
        {id:'calls-target',from:'site',to:'target',relation:'calls',version:'after',data:callData},
        {id:'site-home',from:'site',to:'file',relation:'located_in',version:'after',data:{commit:head,sourceHash:hash(after),range:{startLine:2,endLine:2},sourceEvidence:callAnchor}},
    ],fileUnits:{file:['subject']},groupFor:{subject:'change'},initialVisible:['change','target'],unresolved:[],provenance:{repository,base,head}};
};
