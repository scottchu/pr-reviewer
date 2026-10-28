import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {spawn} from 'node:child_process';
import type {ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {headTestUiFixture} from './head-test-ui-fixture.ts';
import {headTestFixture} from './head-test-fixture.ts';
import {createGateway} from '../src/server/public.ts';
import type {HeadTestView,HeadTestReceipt,Review} from '../src/domain/public.ts';
const launchUi=async(origin:string)=>{
 const socket=createServer();await new Promise<void>(resolve=>socket.listen(0,'127.0.0.1',resolve));const address=socket.address();if(!address||typeof address==='string')throw new Error('port_unavailable');const port=address.port;await new Promise<void>(resolve=>socket.close(()=>resolve()));
 const process=spawn('/Users/scottchu/.asdf/installs/bun/1.4.2/bin/bun',['scripts/ui.ts'],{cwd:globalThis.process.cwd(),env:{...globalThis.process.env,REVIEW_UI_PORT:String(port),REVIEW_GATEWAY_URL:origin},stdio:['ignore','pipe','pipe']});let stderr='';process.stderr?.on('data',data=>{stderr+=String(data);});
 await new Promise<void>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(stderr||'ui_start_timeout')),10000);process.stdout?.on('data',data=>{if(String(data).includes('PR_REVIEWER_UI_READY')){clearTimeout(timeout);resolve();}});process.once('exit',()=>{clearTimeout(timeout);reject(new Error(stderr||'ui_exit'));});});
 return {url:`http://127.0.0.1:${port}`,close:()=>new Promise<void>(resolve=>{if(process.exitCode!==null){resolve();return;}process.once('exit',()=>resolve());process.kill('SIGTERM');})};
};
const post=async(origin:string,path:string,body:unknown)=>{const response=await fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});expect(response.ok).toBe(true);return response.json() as Promise<unknown>;};
const open=async(page:Page,url:string,reviewId='review',snapshotId='ui-head')=>{await page.goto(`${url}/?reviewId=${reviewId}&snapshotId=${snapshotId}`);await expect(page.getByLabel('Your question')).toBeVisible();await expect(page.getByRole('region',{name:'Head tests',exact:true})).toBeVisible();};
const record=(path:string,values:object)=>writeFileSync(path,JSON.stringify({candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0,provenance:'Actual Chrome React/public gateway and controlled fixed-target execution fixture, not own-PR or production qualification',...values},null,2));
test.describe.configure({mode:'serial'});
for(const failed of [false,true])test.describe(failed?'failed fixture':'passed fixture',()=>{
 let fixture:Awaited<ReturnType<typeof headTestUiFixture>>,ui:Awaited<ReturnType<typeof launchUi>>;
 test.beforeAll(async()=>{fixture=await headTestUiFixture(failed?{failed:true}:{});ui=await launchUi(fixture.origin);});
 test.afterAll(async()=>{await ui?.close();await fixture?.close();});
 test(failed?'actual assertion failure remains failed with observed counts':'actual run retains job/result/artifact, independent question and reload recovery',async({page},info)=>{
  await page.setViewportSize({width:1440,height:1080});await open(page,ui.url);const panel=page.getByRole('region',{name:'Head tests',exact:true});
  const states:string[]=[],commands:string[]=[];page.on('response',response=>{if(response.url().endsWith('/api/tests/jobs'))void response.json().then((view:HeadTestView)=>{for(const job of view.jobs)states.push(job.state);}).catch(()=>{});});
  let receipt:HeadTestReceipt|undefined;
  if(!failed)await page.route('**/api/commands',async route=>{const body=route.request().postDataJSON() as {type:string};if(body.type!=='RequestTest'){await route.continue();return;}commands.push(route.request().postData()!);if(commands.length===1){const response=await route.fetch();receipt=await response.json() as HeadTestReceipt;await route.abort('failed');}else await route.continue();});
  await expect(panel.getByText('Controlled test fixture · no production qualification')).toBeVisible();
  await page.getByLabel('Your question').fill(failed?'Independent failed-run draft':'Independent run draft');
  await panel.getByRole('button',{name:'Run head tests',exact:true}).click();
  if(!failed){
   await expect(panel.getByRole('button',{name:'Retry unchanged test request'})).toBeEnabled();await expect.poll(()=>Boolean(receipt)).toBe(true);
   const observed=await post(fixture.origin,'/api/tests/jobs',{reviewId:'review',snapshotId:'ui-head',jobId:receipt!.jobId}) as HeadTestView;
   // Submit immediately after genuine active-state observation; no manufactured delay/lease.
   const overlap=['preparing','running'].includes(observed.selectedJob!.state);
   await page.getByRole('button',{name:'Save question',exact:true}).click();await expect(page.getByLabel('Your question')).toHaveValue('');
   await page.reload();await expect(panel.getByRole('button',{name:'Retry unchanged test request'})).toBeVisible();expect(commands.length).toBe(1);
   await panel.getByRole('button',{name:'Retry unchanged test request'}).click();await expect(panel.getByRole('heading',{name:'Stored result',exact:true})).toBeVisible();expect(commands.length).toBe(2);expect(commands[1]).toBe(commands[0]);
   const view=await post(fixture.origin,'/api/tests/jobs',{reviewId:'review',snapshotId:'ui-head',jobId:receipt!.jobId}) as HeadTestView;
   expect(view.selectedJob!.state).toBe('passed');expect(view.selectedJob!.provenance).toBe('test_only_execution');expect(view.jobs.length).toBe(1);expect(view.selectedJob!.jobId).toBe(receipt!.jobId);
   await expect(panel.getByText('4 passed · 0 failed · 4 total')).toBeVisible();const output=view.selectedJob!.result!.artifacts.find(item=>item.label==='test_root.stderr')!;
   await panel.getByRole('button',{name:`${output.label} · ${output.bytes} bytes`,exact:true}).click();const text=panel.getByLabel('Plain artifact text');await expect(text).toContainText('中🙂');await expect(text).toContainText('<script>window.testOutputExecuted=true</script>');expect(await page.evaluate(()=>Reflect.get(window,'testOutputExecuted'))).toBeUndefined();
   const review=await (await fetch(`${fixture.origin}/api/reviews/review`)).json() as Review;expect(review.questions).toHaveLength(1);expect(fixture.notifications()).toBe(0);await expect(page.getByText('Independent run draft',{exact:true})).toBeVisible();
   await page.screenshot({path:info.outputPath('head-tests-desktop.png'),fullPage:true});await panel.screenshot({path:info.outputPath('head-tests-desktop-panel.png')});await page.setViewportSize({width:390,height:844});await panel.scrollIntoViewIfNeeded();await expect(text).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('head-tests-narrow.png'),fullPage:true});await panel.screenshot({path:info.outputPath('head-tests-narrow-panel.png')});
   await panel.getByRole('button',{name:'Refresh tests'}).focus();await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.tagName)).toBe('BUTTON');
   record(info.outputPath('head-tests-evidence.json'),{gateway:fixture.origin,ui:ui.url,states,receipt,job:view.selectedJob,resultId:view.selectedJob!.result!.resultId,artifact:output,unchangedRetries:commands.length,questionIds:review.questions.map(q=>q.questionId),overlapAttemptObservedState:observed.selectedJob!.state,questionSubmissionAfterActiveRead:overlap,notifications:fixture.notifications()});
  }else{
   await expect(panel.getByText('0 passed · 4 failed · 4 total')).toBeVisible();await expect(panel.getByRole('heading',{name:'Selected job · failed'})).toBeVisible();await expect(page.getByLabel('Your question')).toHaveValue('Independent failed-run draft');record(info.outputPath('head-tests-failure.json'),{states,view:await post(fixture.origin,'/api/tests/jobs',{reviewId:'review',snapshotId:'ui-head'})});
  }
 });
 test('repository without configuration shows unavailable and disables Run',async({page})=>{await open(page,ui.url,'unavailable','ui-unavailable');const panel=page.getByRole('region',{name:'Head tests',exact:true});await expect(panel.getByText('Unavailable · repository not configured')).toBeVisible();await expect(panel.getByRole('button',{name:'Run head tests'})).toBeDisabled();});
});
test.describe('queued cancellation and unknown history',()=>{
 let fixture:ReturnType<typeof headTestFixture>,gateway:ReturnType<typeof createGateway>,ui:Awaited<ReturnType<typeof launchUi>>,origin:string;
 test.beforeAll(async()=>{fixture=headTestFixture({testOptions:{testOnlyExecution:true}});gateway=createGateway(fixture.store,async()=>({state:'unknown',reason:'fixture'}));origin=`http://127.0.0.1:${await gateway.listen(0)}`;ui=await launchUi(origin);});test.afterAll(async()=>{await ui?.close();await gateway?.close();fixture?.cleanup();});
 test('queued cancel and owner-loss unknown remain distinct historical identities',async({page},info)=>{
  await open(page,ui.url,'review','head-snapshot');const panel=page.getByRole('region',{name:'Head tests',exact:true});await panel.getByRole('button',{name:'Run head tests'}).click();await expect(panel.getByRole('button',{name:'Request test cancellation'})).toBeVisible();await panel.getByRole('button',{name:'Request test cancellation'}).click();await expect(panel.getByRole('heading',{name:'Selected job · cancelled'})).toBeVisible();
  const scope={reviewId:'review',snapshotId:'head-snapshot'},cancelled=fixture.store.tests.query(fixture.store.localOwner,scope).jobs[0]!;
  await panel.getByRole('button',{name:'Run head tests'}).click();await expect(panel.getByRole('heading',{name:'Selected job · queued'})).toBeVisible();const owner=fixture.store.tests.beginOwner(),claim=fixture.store.tests.claim(owner)!;fixture.store.tests.recordProcess(claim.grant,{ordinal:1,role:'git_prepare',state:'requested',intentDigest:'a'.repeat(64),inputCount:0,inputBytes:0});fixture.store.tests.beginOwner();
  await expect(panel.getByRole('heading',{name:'Selected job · unknown'})).toBeVisible();await expect(panel.getByText(/Execution outcome is unknown/)).toBeVisible();await expect(panel.getByRole('button',{name:'Request test cancellation'})).toHaveCount(0);await expect(panel.getByText('No invocation is automatically retried',{exact:false})).toBeVisible();
  await page.reload();await expect(panel.getByRole('button',{name:new RegExp(cancelled.jobId)})).toBeVisible();await panel.getByRole('button',{name:new RegExp(cancelled.jobId)}).click();await expect(panel.getByRole('heading',{name:'Selected job · cancelled'})).toBeVisible();record(info.outputPath('head-tests-unknown-cancel.json'),{view:fixture.store.tests.query(fixture.store.localOwner,scope),cancelledJobId:cancelled.jobId,unknownJobId:claim.job.jobId});
 });
});
