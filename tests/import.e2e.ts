import {test,expect} from '@playwright/test';
import {spawn,execFileSync} from 'node:child_process';
import type {ChildProcess} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reserveBrowserPorts} from './browser-ports.ts';
import {providerFixture} from './provider-fixture.ts';
import type {Review,ImportJob} from '../src/domain/public.ts';
let root:string,child:ChildProcess,uiUrl:string,gatewayUrl:string,fixture:ReturnType<typeof providerFixture>,providerState:string;let stderr='',uiPort=0,gatewayPort=0;
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const start=async()=>{
 child=spawn(process.execPath,['--experimental-strip-types','scripts/dev.ts'],{env:{...process.env,PATH:`${join(root,'bin')}:${process.env.PATH??''}`,REVIEW_DATA_DIR:root,REVIEW_UI_PORT:String(uiPort),REVIEW_GATEWAY_PORT:String(gatewayPort)},stdio:['ignore','pipe','pipe']});child.stderr?.on('data',data=>{stderr+=String(data);});
 for(let i=0;i<150;i++){if(child.exitCode!==null)throw new Error(stderr);if(existsSync(join(root,'runtime.json'))){const runtime=JSON.parse(readFileSync(join(root,'runtime.json'),'utf8'));if(runtime.status==='running'){uiUrl=runtime.uiUrl;gatewayUrl=runtime.gatewayUrl;return;}}await delay(100);}throw new Error('candidate startup timeout');
};
const stop=async()=>{if(child.exitCode!==null)return;await new Promise<void>(resolve=>{child.once('exit',()=>resolve());child.kill('SIGTERM');});};
const api=async(path:string,body?:unknown)=>{const response=await fetch(`${gatewayUrl}${path}`,{headers:{'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});const value=await response.json() as unknown;expect(response.ok,JSON.stringify(value)).toBe(true);return value;};
const jobs=async()=>await api('/api/imports') as Omit<ImportJob,'credentialReference'>[];
test.beforeAll(async()=>{
 const ports=await reserveBrowserPorts();uiPort=ports[0];gatewayPort=ports[1];
 root=mkdtempSync(join(tmpdir(),'pr-reviewer-import-browser-'));fixture=providerFixture();providerState=join(root,'provider-state.json');writeFileSync(providerState,JSON.stringify({...fixture.candidate,delay:0}));mkdirSync(join(root,'bin'),{mode:0o700});
 writeFileSync(join(root,'bin','gh'),`#!${process.execPath}\nconst {readFileSync}=require('node:fs');const candidate=JSON.parse(readFileSync(${JSON.stringify(providerState)},'utf8'));const endpoint=process.argv.at(-1);const pull={number:candidate.number,html_url:candidate.url,title:candidate.title,state:candidate.state,head:{ref:candidate.sourceBranch,sha:candidate.headSha,repo:{full_name:candidate.sourceProject}},base:{ref:candidate.targetBranch,sha:candidate.targetTipSha,repo:{full_name:candidate.targetProject}}};const value=endpoint.includes('/compare/')?{merge_base_commit:{sha:candidate.baseSha}}:endpoint.includes('/pulls?')?[pull]:endpoint==='repos/team/repo'?{full_name:'team/repo',default_branch:'main'}:pull;setTimeout(()=>process.stdout.write(JSON.stringify(value)),candidate.delay);\n`,{mode:0o700});await start();
});
test.afterAll(async()=>{await stop();rmSync(root,{recursive:true,force:true});rmSync(fixture.root,{recursive:true,force:true});});
test('03 controlled provider + real Git: path discovery, complete copy/empty/binary ledger, background continuation and immutable source after restart',async({page},testInfo)=>{
 await page.setViewportSize({width:1600,height:1200});await page.goto(uiUrl);
 await expect(page.getByRole('heading',{name:'Open a change from a repository'})).toBeVisible();await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Import review',exact:true}).click();
 await expect.poll(async()=>(await jobs())[0]?.state).toBe('admitted');const imported=(await jobs())[0]!;
 // Hold the real imported-review login result across bridge mount and a 700ms poll.
 // Controlled provider metadata remains separate from the actual React/gateway authorization handoff.
 const importedReview=await api(`/api/reviews/${imported.reviewId}`) as Review;
 let reviewReads=0,held=false,release=()=>{};
 const gate=new Promise<void>(resolve=>{release=resolve;});
 const requests:{url:string;status:number}[]=[];
 page.on('response',response=>{if(response.url().includes('/api/analysis?'))requests.push({url:response.url(),status:response.status()});});
 await page.route(`**/api/reviews/${imported.reviewId}?*`,async route=>{
  reviewReads++;
  if(reviewReads===1){const response=await route.fetch();held=true;await gate;try{await route.fulfill({response});}catch{/* An aborted login is the failing-first regression. */}}
  else await route.continue();
 });
 try{
  await page.getByRole('button',{name:'Open imported review',exact:true}).click();
  await expect.poll(()=>held).toBe(true);
  await delay(850);
  expect(reviewReads,'mount/timer background routes must preserve the held explicit login').toBe(1);
 }finally{release();}
 await expect(page).toHaveURL(new RegExp(imported.reviewId));
 const panel=page.getByRole('region',{name:'Function neighborhoods'});
 await panel.getByText('Acquire verified pinned context',{exact:true}).click();
 await expect(panel.getByRole('button',{name:'Prepare declarations',exact:true})).toBeEnabled();
 await expect.poll(()=>requests.filter(request=>{
  const url=new URL(request.url);return request.status===200&&url.searchParams.get('reviewId')===imported.reviewId&&url.searchParams.get('snapshotId')===importedReview.snapshot.snapshotId;
 }).length).toBeGreaterThan(0);
 await page.unroute(`**/api/reviews/${imported.reviewId}?*`);
 writeFileSync(testInfo.outputPath('imported-review-semantic-authorization.json'),JSON.stringify({provenance:'Controlled provider metadata; actual React and gateway. The real workspace-open response is held across mount and timer; no fake review/analysis result.',candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0,reviewId:imported.reviewId,snapshotId:importedReview.snapshot.snapshotId,requests,heldAcrossPollMs:850,prepared:false},null,2));

 const canvas=page.getByRole('region',{name:'Review canvas',exact:true});
 await canvas.getByText('Complete changed-path ledger (4)',{exact:true}).click();const ledger=canvas.locator('details').filter({has:page.getByText('Complete changed-path ledger (4)',{exact:true})});await expect(ledger.locator(':scope > ul > li')).toHaveCount(4);
 await canvas.getByRole('navigation',{name:'Prepared changed files'}).getByRole('button',{name:'Focus b',exact:true}).click();await expect(canvas.locator('.react-flow__node')).toHaveCount(3);await canvas.getByRole('button',{name:'Focus source',exact:true}).click();await expect(canvas.getByRole('region',{name:'Before source',exact:true}).locator('code').first()).toHaveText('original');
 await canvas.getByRole('region',{name:'Before source',exact:true}).getByRole('button',{name:'Inspect base line 2',exact:true}).click();await expect(canvas.getByRole('region',{name:'After source',exact:true}).locator('code').first()).toHaveText('original');await canvas.getByRole('button',{name:'Ask about selected lines',exact:true}).click();await expect(page.getByLabel('Source file')).toHaveValue('a');await expect(page.getByLabel('Start line')).toHaveValue('2');
 await ledger.getByRole('button',{name:'Focus empty',exact:true}).click();await expect(canvas.locator('.react-flow__node')).toHaveCount(3);await expect(canvas.getByRole('button',{name:'Focus source',exact:true})).toBeDisabled();await expect(canvas.getByRole('region',{name:'After overview',exact:true})).toContainText('No prepared selectable source');await ledger.getByRole('button',{name:'Focus binary',exact:true}).click();await expect(canvas.getByRole('button',{name:'Focus source',exact:true})).toBeDisabled();
 await expect(ledger.getByText('head binary: unsupported · binary',{exact:true})).toBeVisible();await expect(ledger.getByText('head empty: prepared · empty',{exact:true})).toBeVisible();
 await canvas.getByRole('navigation',{name:'Prepared changed files'}).getByRole('button',{name:'Focus a',exact:true}).click();await canvas.getByRole('button',{name:'Focus source',exact:true}).click();await canvas.getByRole('button',{name:'Ask about selected lines',exact:true}).click();await page.getByLabel('Your question').fill('Why did this pinned original line change?');await page.getByRole('button',{name:'Save question'}).click();await expect(page.getByText('1 saved question · 0 answers')).toBeVisible();
 const first=await api(`/api/reviews/${imported.reviewId}`) as Review,question=first.questions[0]!;expect(first.snapshot.snapshotId).toBe('f83c2d2727683f93ac10768b28b9f3791163d21da53774136fca55ac71e90dbb');expect(question.anchor.snapshotId).toBe(first.snapshot.snapshotId);
 const git=(...args:string[])=>execFileSync('git',['-C',fixture.root,'-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false',...args],{encoding:'utf8'}).trim();writeFileSync(join(fixture.root,'a'),'Third revision\n'+'original\n'.repeat(9));git('add','a');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','next');const nextHead=git('rev-parse','HEAD');writeFileSync(providerState,JSON.stringify({...fixture.candidate,headSha:nextHead,delay:350}));
 await page.getByLabel('Repository path').fill(fixture.root);await page.getByLabel('Your question').fill('UNSENT draft stays on the original snapshot');await page.getByRole('button',{name:'Import into this review'}).click();await expect.poll(async()=>(await jobs())[1]?.invocations.at(-1)?.processes.some(process=>process.state==='started')).toBe(true);
 // An actual owned provider child is running. A question commit/read is independent of the import transaction.
 await page.getByLabel('Your question').fill('A question saved while the provider process was actually running');await page.getByRole('button',{name:'Save question'}).click();await expect(page.getByText('2 saved questions · 0 answers')).toBeVisible();expect((await api(`/api/reviews/${imported.reviewId}`) as Review).snapshot.snapshotId).toBe(first.snapshot.snapshotId);
 await page.getByLabel('Your question').fill('UNSENT continuation guard');await expect.poll(async()=>(await jobs())[1]?.state).toBe('admitted');await expect(page.getByRole('combobox',{name:'Snapshot',exact:true})).toHaveValue(first.snapshot.snapshotId);await expect(page.getByLabel('Your question')).toHaveValue('UNSENT continuation guard');await expect(page.getByRole('button',{name:'Open imported review'}).last()).toBeDisabled();
 const current=await api(`/api/reviews/${imported.reviewId}`) as Review;expect(current.snapshot.headSha).toBe(nextHead);expect(current.snapshotSummaries).toHaveLength(2);expect(current.questions[0]?.anchor).toEqual(question.anchor);expect(current.questions.every(saved=>saved.anchor.snapshotId===first.snapshot.snapshotId)).toBe(true);expect(current.attempts).toHaveLength(0);const concurrentQuestion=current.questions[1]!;expect((await jobs())[1]!.invocations.flatMap(invocation=>invocation.processes).some(observation=>observation.startedAt&&observation.endedAt&&concurrentQuestion.createdAt>=observation.startedAt&&concurrentQuestion.createdAt<=observation.endedAt)).toBe(true);
 await page.screenshot({path:join(process.env.REVIEW_E2E_ARTIFACT_DIR!,'controlled-import-continuation.png'),fullPage:true});writeFileSync(join(process.env.REVIEW_E2E_ARTIFACT_DIR!,'controlled-import-identity.json'),JSON.stringify({provenance:'Controlled GitHub CLI metadata; real disposable Git and actual React/gateway/processes. Not live provider/own-PR acceptance.',build:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirty:true,reviewId:imported.reviewId,original:first.snapshot.snapshotId,current:current.snapshot.snapshotId,jobs:await jobs()},null,2));
 await page.getByLabel('Your question').fill('');await stop();await start();await page.reload();await expect(page.getByText('2 saved questions · 0 answers')).toBeVisible();await expect(page.getByRole('combobox',{name:'Snapshot',exact:true})).toHaveValue(first.snapshot.snapshotId);expect((await jobs()).map(job=>job.state)).toEqual(['admitted','admitted']);
});
