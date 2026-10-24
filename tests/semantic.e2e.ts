import {test,expect} from '@playwright/test';
import {spawn,execFileSync} from 'node:child_process';
import type {ChildProcess} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {semanticFixture} from './semantic-fixture.ts';
import {createGateway} from '../src/server/public.ts';
import {buildSnapshot} from '../src/source-preparation/public.ts';
import type {AnalysisView,Review,Snapshot} from '../src/domain/public.ts';
let fixture:ReturnType<typeof semanticFixture>,gateway:ReturnType<typeof createGateway>,ui:ChildProcess,uiUrl:string,gatewayUrl:string,snapshot:Snapshot,stderr='';
test.use({actionTimeout:10000,screenshot:'only-on-failure'});
test.describe.configure({mode:'serial'});
const reviewId='semantic-browser';
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const api=async(path:string,body?:unknown)=>{const response=await fetch(gatewayUrl+path,{headers:{Authorization:`Bearer ${fixture.token}`,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});const value=await response.json() as unknown;if(!response.ok)throw new Error(JSON.stringify(value));return value;};
const query=async(snapshotId=snapshot.snapshotId)=>await api(`/api/analysis?reviewId=${reviewId}&snapshotId=${snapshotId}`) as AnalysisView;
const until=async(check:()=>Promise<boolean>,timeout=12000)=>{const end=Date.now()+timeout;while(!await check()){if(Date.now()>end)throw new Error('semantic_browser_timeout');await pause(5);}};
const pinned=(baseSha:string,headSha:string)=>{const previous=process.env.GIT_DIR;process.env.GIT_DIR=join(fixture.root,'.git');try{return buildSnapshot({prNumber:1,prUrl:'https://github.com/scottchu/pr-reviewer/pull/1',baseSha,headSha,path:'callee.ts',title:'Controlled semantic navigation fixture'});}finally{if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;}};
test.beforeAll(async()=>{
 fixture=semanticFixture();
 writeFileSync(join(fixture.root,'helper.ts'),'export const helper = (value:number) => value + 10;\n');
 writeFileSync(join(fixture.root,'caller.ts'),'import {callee} from "./callee";\nexport const caller = (object:any) => callee(object);\n');
 writeFileSync(join(fixture.root,'inventory.ts'),Array.from({length:800},(_,i)=>`export const inventory${i} = (value:number) => { let result=value; ${"result=result+1;".repeat(8)} return result + ${i}; };`).join('\n')+'\n');
 const callee=(n:number)=>`import {helper} from "./helper";\nexport const callee = (object:any) => {\n  const value = helper(${n});\n  object.runtime();\n  return value;\n};\n`;
 writeFileSync(join(fixture.root,'callee.ts'),callee(1));fixture.git('add','.');fixture.git('commit','-qm','semantic base');const baseSha=fixture.git('rev-parse','HEAD');
 writeFileSync(join(fixture.root,'callee.ts'),callee(2));fixture.git('add','callee.ts');fixture.git('commit','-qm','semantic head');snapshot=pinned(baseSha,fixture.git('rev-parse','HEAD'));
 fixture.store.prepare(reviewId,snapshot);gateway=createGateway(fixture.store,async()=>({state:'unknown',reason:'No attached participant in this controlled browser fixture.'}));gatewayUrl=`http://127.0.0.1:${await gateway.listen(0)}`;
 const reservation=createServer();await new Promise<void>(resolve=>reservation.listen(0,'127.0.0.1',resolve));const address=reservation.address();if(!address||typeof address==='string')throw new Error('missing_ui_port');const port=address.port;await new Promise<void>(resolve=>reservation.close(()=>resolve()));
 ui=spawn('/Users/scottchu/.asdf/shims/bun',['scripts/ui.ts'],{cwd:process.cwd(),env:{...process.env,REVIEW_UI_PORT:String(port),REVIEW_GATEWAY_URL:gatewayUrl},stdio:['ignore','pipe','pipe']});
 ui.stderr?.on('data',data=>{stderr+=String(data);});let ready=false;ui.stdout?.on('data',data=>{if(String(data).includes('PR_REVIEWER_UI_READY'))ready=true;});await until(async()=>{if(ui.exitCode!==null)throw new Error(stderr);return ready;});uiUrl=`http://127.0.0.1:${port}/?reviewId=${reviewId}`;
});
test.afterAll(async()=>{if(ui&&ui.exitCode===null)await new Promise<void>(resolve=>{ui.once('exit',()=>resolve());ui.kill('SIGTERM');});if(gateway)await gateway.close();fixture?.cleanup();});
test('real React, Git, SQLite and Node worker: explicit both-side neighbors, exact context evidence, notes, draft return and immutable history',async({page},testInfo)=>{
 const browserModules:string[]=[];page.on('request',request=>browserModules.push(request.url()));
 test.setTimeout(90000);await page.setViewportSize({width:1600,height:1100});await page.goto(uiUrl);await page.getByLabel('Local access token').fill(fixture.token);await page.getByRole('button',{name:'Open review',exact:true}).click();
 const panel=page.getByRole('region',{name:'Function neighborhoods'});
 await expect(panel).toBeVisible();await panel.getByText('Acquire verified pinned context',{exact:true}).click();await panel.getByLabel('Source worktree locator').fill(fixture.root);await panel.getByLabel('Declared source project').fill('scottchu/pr-reviewer');await panel.getByRole('button',{name:'Prepare declarations',exact:true}).click();
 await until(async()=>(await query()).jobs.at(-1)?.state==='awaiting_declarations');await expect(panel.getByLabel('Before declaration')).toBeVisible();
 const available=(await query()).preparation!.inventory!;expect(available.status).toBe('available');if(available.status!=='available')throw new Error('inventory_unavailable');
 for(const side of ['base','head'] as const){const declaration=available.declarations.find(item=>item.name==='callee'&&item.declaration.side===side)!;await panel.getByLabel(side==='base'?'Before declaration':'After declaration',{exact:true}).selectOption(declaration.id);}
 await page.getByLabel('Your question').fill('Question saved while the real semantic worker is outstanding.');
 await panel.getByRole('button',{name:'Analyze selected declarations',exact:true}).focus();await page.keyboard.press('Enter');
 await until(async()=>{const job=(await query()).jobs.at(-1);return job?.state==='compute_running'&&job.invocations.at(-1)?.processes.some(process=>process.state==='started')===true;});
 const outstanding=await query(),startedObservedAt=new Date().toISOString(),processBefore=outstanding.jobs.at(-1)!.invocations.at(-1)!.processes.at(-1)!;
 const ps=(pid:number)=>execFileSync('ps',['-p',String(pid),'-o','pid=,ppid=,lstart=,command='],{encoding:'utf8'}).trim();
 const startIdentity=(pid:number)=>execFileSync('/bin/ps',['-p',String(pid),'-o','lstart=','-o','pgid='],{encoding:'utf8',env:{}}).trim();
 const identityBefore=ps(processBefore.pid!);expect(identityBefore).toContain('analysis-jobs/worker-entry.ts');expect(startIdentity(processBefore.pid!)).toBe(processBefore.startIdentity);
 await page.getByRole('button',{name:'Save question',exact:true}).click();await expect(page.getByText('1 saved question · 0 answers')).toBeVisible();
 const questionReadableAt=new Date().toISOString(),during=await query(),reviewDuring=await api(`/api/reviews/${reviewId}`) as Review,question=reviewDuring.questions[0]!;
 expect(during.jobs.at(-1)?.state).toBe('compute_running');const processDuring=during.jobs.at(-1)!.invocations.at(-1)!.processes.at(-1)!;expect(processDuring.pid).toBe(processBefore.pid);expect(processDuring.startIdentity).toBe(processBefore.startIdentity);expect(processDuring.state).toBe('started');
 const identityDuring=ps(processDuring.pid!),liveAfterCommitAt=new Date().toISOString();expect(identityDuring).toBe(identityBefore);expect(startIdentity(processDuring.pid!)).toBe(processBefore.startIdentity);expect(question.createdAt>=startedObservedAt).toBe(true);expect(question.createdAt<=questionReadableAt).toBe(true);
 await until(async()=>(await query()).jobs.at(-1)?.state==='admitted');const admitted=await query(),exitObservedAt=new Date().toISOString(),facts=admitted.analysis!;expect(admitted.jobs.at(-1)!.invocations.at(-1)!.processes.at(-1)!.state).toBe('exited');expect(facts.status).toBe('analyzed');if(facts.status!=='analyzed')throw new Error('analysis_unavailable');
 expect(facts.edges.filter(edge=>facts.nodes.find(node=>node.id===edge.caller)?.name==='caller')).toHaveLength(2);expect(facts.edges.filter(edge=>facts.nodes.find(node=>node.id===edge.callee)?.name==='helper')).toHaveLength(2);
 await expect(panel.getByRole('heading',{name:'Admitted static neighborhood'})).toBeVisible();await expect(panel.locator('.semantic-canvas .react-flow__node')).toHaveCount(6);expect(await panel.locator('.semantic-canvas .react-flow__node').count()).toBeLessThanOrEqual(12);
 await expect(panel.locator('.semantic-node pre').filter({hasText:'helper(2)'})).toHaveCount(1);await expect(panel.getByText(/unsupported_dispatch/).first()).toBeVisible();
 await page.getByLabel('Your question').fill('UNSENT original source draft');const selection=await page.getByLabel('Source file').inputValue();
 for(const side of ['base','head'] as const){
  const caller=facts.nodes.find(node=>node.name==='caller'&&node.declaration.side===side)!,helper=facts.nodes.find(node=>node.name==='helper'&&node.declaration.side===side)!;
  await panel.getByText(`All admitted function nodes (${facts.nodes.length})`,{exact:true}).click();
  await panel.getByRole('listitem',{name:`Function ${side} caller const-arrow`,exact:true}).getByRole('button',{name:/Inspect full body/}).click();
  const inspector=panel.getByRole('region',{name:'Retained semantic source'});await expect(inspector.getByLabel('Exact retained source')).toContainText('callee(object)');await expect(inspector.getByText(/Role: context/)).toBeVisible();await expect(page.getByLabel('Your question')).toHaveValue('UNSENT original source draft');await expect(page.getByLabel('Source file')).toHaveValue(selection);await inspector.getByRole('button',{name:'Return to function neighborhood'}).click();
  await panel.getByRole('listitem',{name:`Function ${side} helper const-arrow`,exact:true}).getByRole('button',{name:/Inspect full body/}).click();await expect(inspector.getByLabel('Exact retained source')).toContainText('value + 10');await inspector.getByRole('button',{name:'Use selected source as clarification evidence'}).click();await inspector.getByRole('button',{name:'Return to function neighborhood'}).click();
  await panel.getByText(`All admitted function nodes (${facts.nodes.length})`,{exact:true}).click();
  expect(caller.role).toBe('context');expect(helper.role).toBe('context');
 }
 await panel.getByLabel('Graph clarification',{exact:true}).fill('The unchanged caller receives helper(1) before and helper(2) after; dynamic runtime dispatch remains unresolved.');await panel.getByRole('button',{name:'Save graph clarification',exact:true}).click();await expect(panel.getByText('Graph clarification saved.',{exact:true})).toBeVisible();expect((await query()).graphRevision).toBe(admitted.graphRevision+1);await expect(panel.getByText(/interpretation · user local-user · clarification revision 1/)).toBeVisible();await expect(panel.getByText(/Preparation: admitted.*graph revision 2/)).toBeVisible();expect((await api(`/api/reviews/${reviewId}`) as Review).questions).toHaveLength(1);expect((await api(`/api/reviews/${reviewId}`) as Review).revision).toBe(reviewDuring.revision);
 await panel.getByText('Complete context inventory, coverage and limitations',{exact:true}).click();await expect(panel.getByText('head caller.ts · context · prepared true · selected true · parsed · scanned',{exact:false})).toBeVisible();await panel.getByText('Complete context inventory, coverage and limitations',{exact:true}).click();
 await page.screenshot({path:testInfo.outputPath('semantic-both-side-neighborhood.png'),fullPage:true});await panel.locator('.semantic-canvas').screenshot({path:testInfo.outputPath('semantic-readable-canvas.png')});
 // A newer preparation cannot erase the old admitted graph or move the held draft.
 await panel.getByRole('button',{name:'Prepare declarations',exact:true}).click();await until(async()=>(await query()).jobs.at(-1)?.state==='awaiting_declarations');await expect(panel.getByText(/previous admitted facts and notes remain below/)).toBeVisible();await expect(panel.getByText(/The unchanged caller receives helper/)).toBeVisible();await expect(page.getByLabel('Your question')).toHaveValue('UNSENT original source draft');
 // Owner-controlled manual pinned source addition, not provider discovery/live GitHub evidence.
 writeFileSync(join(fixture.root,'callee.ts'),'import {helper} from "./helper";\nexport const callee = (object:any) => helper(3);\n');fixture.git('add','callee.ts');fixture.git('commit','-qm','new source head');const next=pinned(snapshot.baseSha,fixture.git('rev-parse','HEAD'));
 const previous=process.env.GIT_DIR;process.env.GIT_DIR=join(fixture.root,'.git');try{const added=await api('/api/commands',{type:'AddSnapshot',commandId:'semantic-browser-new-head',reviewId,expectedCurrentSnapshotId:snapshot.snapshotId,identityScheme:'manual_git_v1',snapshot:next}) as {state:string};expect(added.state).toBe('applied');}finally{if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;}
 await expect(page.getByRole('combobox',{name:'Snapshot',exact:true})).toHaveValue(snapshot.snapshotId);await expect(page.getByLabel('Your question')).toHaveValue('UNSENT original source draft');await expect(panel.getByText(/The unchanged caller receives helper/)).toBeVisible();
 await page.getByLabel('Your question').fill('');await page.getByRole('combobox',{name:'Snapshot',exact:true}).selectOption(next.snapshotId);await expect(panel.getByText('No admitted static facts for this selection.',{exact:false})).toBeVisible();await page.getByRole('combobox',{name:'Snapshot',exact:true}).selectOption(snapshot.snapshotId);await expect(panel.getByText(/The unchanged caller receives helper/)).toBeVisible();
 await page.reload();await page.getByLabel('Local access token').fill(fixture.token);await page.getByRole('button',{name:'Open review',exact:true}).click();await expect(panel.getByText(/The unchanged caller receives helper/)).toBeVisible();expect((await query()).analysis?.analysisId).toBe(facts.analysisId);
 await panel.getByText(`All admitted function nodes (${facts.nodes.length})`,{exact:true}).click();await panel.getByRole('listitem',{name:'Function head helper const-arrow',exact:true}).getByRole('button',{name:/Inspect full body/}).click();await expect(panel.getByRole('region',{name:'Retained semantic source'}).getByLabel('Exact retained source')).toContainText('value + 10');
 expect(browserModules.filter(url=>/\/src\/(?:source-analysis|analysis-jobs)\/|node_modules\/(?:\.vite\/deps\/)?typescript[-_]analysis/.test(url))).toEqual([]);
 writeFileSync(testInfo.outputPath('semantic-candidate-evidence.json'),JSON.stringify({provenance:'Controlled synthetic real Git, actual Node gateway/SQLite/TypeScript6 child and Chrome React. Manual pinned AddSnapshot history; not live provider, actual ownPR or native session acceptance.',candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).split('\n').some(line=>line&&line.slice(3)!=='node_modules'),reviewId,original:snapshot.snapshotId,current:next.snapshotId,analysisId:facts.analysisId,graphRevision:(await query()).graphRevision,overlap:{startedObservedAt,questionCreatedAt:question.createdAt,questionReadableAt,liveAfterCommitAt,exitObservedAt,processBefore,processDuring,identityBefore,identityDuring},observedOutstanding:outstanding.jobs.at(-1),retainedNotes:(await query()).clarifications,browserModules},null,2));
});
test('actual React history navigation fences delayed graph, annotation and source responses; exact annotation retry stays in its original scope',async({page},testInfo)=>{
 test.setTimeout(60000);await page.setViewportSize({width:1600,height:1100});await page.goto(`${uiUrl}&snapshotId=${snapshot.snapshotId}`);await page.getByLabel('Local access token').fill(fixture.token);await page.getByRole('button',{name:'Open review',exact:true}).click();
 const panel=page.getByRole('region',{name:'Function neighborhoods'}),snapshots=page.getByRole('combobox',{name:'Snapshot',exact:true});await expect(panel.getByRole('heading',{name:'Admitted static neighborhood'})).toBeVisible();
 const current=(await api(`/api/reviews/${reviewId}`) as Review).currentSnapshotId!;
 let graphCaptured=false,releaseGraph=()=>{};const graphGate=new Promise<void>(resolve=>{releaseGraph=resolve;});
 await page.route('**/api/analysis?*',async route=>{
  if(!graphCaptured&&new URL(route.request().url()).searchParams.get('snapshotId')===snapshot.snapshotId){graphCaptured=true;const response=await route.fetch();await graphGate;try{await route.fulfill({response});}catch{/* Aborted private read is expected. */}}
  else await route.continue();
 });
 await until(async()=>graphCaptured);await snapshots.selectOption(current);await expect(panel.getByText('No admitted static facts for this selection.',{exact:false})).toBeVisible();releaseGraph();await page.unroute('**/api/analysis?*');await expect(snapshots).toHaveValue(current);await expect(panel.getByRole('heading',{name:'Admitted static neighborhood'})).toHaveCount(0);
 await snapshots.selectOption(snapshot.snapshotId);await expect(panel.getByRole('heading',{name:'Admitted static neighborhood'})).toBeVisible();
 let annotationCaptured=false,releaseAnnotation=()=>{};const annotationGate=new Promise<void>(resolve=>{releaseAnnotation=resolve;}),commands:unknown[]=[];
 await page.route('**/api/analysis/commands',async route=>{
  const command=route.request().postDataJSON() as {type:string};if(command.type!=='PutGraphClarification'){await route.continue();return;}commands.push(command);
  if(!annotationCaptured){const response=await route.fetch();annotationCaptured=true;await annotationGate;try{await route.fulfill({response});}catch{/* Navigation fences a command whose commit remains durable. */}}
  else await route.continue();
 });
 await panel.getByLabel('Graph clarification',{exact:true}).fill('Delayed browser clarification belongs only to the retained historical analysis.');await panel.getByRole('button',{name:'Save graph clarification',exact:true}).click();await until(async()=>annotationCaptured);
 await snapshots.selectOption(current);await expect(panel.getByText('No admitted static facts for this selection.',{exact:false})).toBeVisible();releaseAnnotation();await expect(panel.getByRole('button',{name:'Retry unchanged semantic intent'})).toBeVisible();await panel.getByRole('button',{name:'Retry unchanged semantic intent'}).click();await expect(panel.getByRole('button',{name:'Retry unchanged semantic intent'})).toHaveCount(0);expect(commands).toHaveLength(2);expect(commands[1]).toEqual(commands[0]);await expect(snapshots).toHaveValue(current);await expect(panel.getByRole('heading',{name:'Admitted static neighborhood'})).toHaveCount(0);await page.unroute('**/api/analysis/commands');
 await snapshots.selectOption(snapshot.snapshotId);await expect(panel.getByText('Delayed browser clarification belongs only to the retained historical analysis.',{exact:true})).toBeVisible();const before=await query();expect(before.clarifications.filter(note=>note.history.some(revision=>revision.text==='Delayed browser clarification belongs only to the retained historical analysis.'))).toHaveLength(1);
 await expect(panel.locator('.semantic-node pre').filter({hasText:'Source excerpt loading'})).toHaveCount(0);
 let sourceCaptured=false,releaseSource=()=>{};const sourceGate=new Promise<void>(resolve=>{releaseSource=resolve;});await page.route('**/api/analysis/source',async route=>{
  const source=route.request().postDataJSON() as {path:string;side:string};if(!sourceCaptured&&source.path==='caller.ts'&&source.side==='head'){const response=await route.fetch();sourceCaptured=true;await sourceGate;try{await route.fulfill({response});}catch{/* Aborted exact evidence read is expected. */}}else await route.continue();
 });
 await panel.getByText(/All admitted function nodes/).click();await panel.getByRole('listitem',{name:'Function head caller const-arrow',exact:true}).getByRole('button',{name:/Inspect full body/}).click();await until(async()=>sourceCaptured);await snapshots.selectOption(current);await expect(panel.getByText('No admitted static facts for this selection.',{exact:false})).toBeVisible();releaseSource();await page.unroute('**/api/analysis/source');await expect(panel.getByRole('region',{name:'Retained semantic source'})).toHaveCount(0);await expect(snapshots).toHaveValue(current);
 writeFileSync(testInfo.outputPath('semantic-delayed-response-evidence.json'),JSON.stringify({provenance:'Actual Chrome route-delayed responses from the real gateway. Commands committed once and exact original command was retried; no fake graph/result values.',snapshot:snapshot.snapshotId,current,annotationCommandIds:commands.map(command=>(command as {commandId:string}).commandId),historicalGraphRevision:before.graphRevision,notes:before.clarifications.length},null,2));
});
