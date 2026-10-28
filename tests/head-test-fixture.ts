import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../src/storage/public.ts';
import type {Snapshot,HeadTestCommand} from '../src/domain/public.ts';
export const headTestFixture=(options:Parameters<typeof createStore>[1]={testOptions:{testOnlyAvailable:true}},snapshotOverrides:Partial<Snapshot>={})=>{
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-head-intent-')),filename=join(root,'review.sqlite');
 let store:ReturnType<typeof createStore>;try{store=createStore(filename,options);}catch(error){rmSync(root,{recursive:true,force:true});throw error;}const content='export const value = 1;\n';
 const snapshot:Snapshot={snapshotId:'head-snapshot',repository:'scottchu/pr-reviewer',prUrl:'https://github.com/scottchu/pr-reviewer/pull/24',prNumber:24,baseSha:'a'.repeat(40),headSha:'b'.repeat(40),sources:[{side:'head',path:'value.ts',content,hash:createHash('sha256').update(content).digest('hex'),lineCount:1}],...snapshotOverrides};
 store.prepare('review',snapshot);const token=store.issueUser();
 const request:HeadTestCommand={type:'RequestTest',commandId:'test-request',reviewId:'review',snapshotId:snapshot.snapshotId,targetId:'review-source-core-v1',expectedTargetRevision:2};
 return {root,filename,snapshot,token,request,get store(){return store;},restart:()=>{store.close();store=createStore(filename,options);},cleanup:()=>{store.close();rmSync(root,{recursive:true,force:true});}};
};
