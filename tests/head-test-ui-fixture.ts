import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createStore} from '../src/storage/public.ts';
import {createGateway} from '../src/server/public.ts';
import type {Snapshot} from '../src/domain/public.ts';
import {headPreparationFixture} from './head-test-preparation-fixture.ts';
export const headTestUiFixture=async(options:{failed?:true}={})=>{
 const input=await headPreparationFixture({testName:'inert <script>window.testOutputExecuted=true</script> 中🙂',...(options.failed?{assertionFailure:true as const}:{})}),artifactRoot=join(input.root,'artifacts');await mkdir(artifactRoot);
 const store=createStore(join(input.root,'review.sqlite'),{testOptions:{testOnlyExecution:true}}),content='export const value = 1;\n';
 const snapshot:Snapshot={snapshotId:'ui-head',repository:'scottchu/pr-reviewer',prUrl:'https://github.com/scottchu/pr-reviewer/pull/24',prNumber:24,baseSha:'a'.repeat(40),headSha:input.headSha,sources:[{side:'head',path:'value.ts',content,hash:createHash('sha256').update(content).digest('hex'),lineCount:1}]};
 store.prepare('review',snapshot);store.prepare('unavailable',{...snapshot,snapshotId:'ui-unavailable',repository:'another/repository',prUrl:'https://github.com/another/repository/pull/1',prNumber:1});
 let notifications=0;const gateway=createGateway(store,async()=>{notifications++;return {state:'unknown',reason:'test fixture'};},{testExecution:{executionRoot:input.executionRoot,artifactRoot,fixtureInputs:input}}),origin=`http://127.0.0.1:${await gateway.listen(0)}`;
 return {store,snapshot,origin,notifications:()=>notifications,close:async()=>{await gateway.close();store.close();await input.cleanup();}};
};
