import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStoryBridge,storyTransition,storyProjection,createAnalysisBridge} from '../src/application/public.ts';
import type {StoryState,StoryClock} from '../src/application/public.ts';
import type {StoryView,StoryContextView,StoryContent,AnalysisView} from '../src/domain/public.ts';
import {storyFixture} from './story-fixture.ts';
const deferredFetch=()=>{
 const original=globalThis.fetch;
 const calls:{url:string;options:RequestInit|undefined;resolve:(body:unknown)=>void}[]=[];
 globalThis.fetch=((url:string|URL|Request,options?:RequestInit)=>new Promise<Response>(resolve=>calls.push({url:String(url),options,resolve:body=>resolve(new Response(JSON.stringify(body),{status:200}))}))) as typeof fetch;
 return {calls,restore:()=>{globalThis.fetch=original;}};
};
const turn=()=>new Promise<void>(resolve=>setImmediate(resolve));
const manualClock=()=>{let now=0,serial=0;const timers=new Map<number,{callback:()=>void;period:number}>();const clock:StoryClock={now:()=>now,every:(callback,period)=>{const id=++serial;timers.set(id,{callback,period});return()=>{timers.delete(id);};}};return {clock,timers,advance:(ms:number)=>{now+=ms;for(const timer of [...timers.values()])if(timer.period===250)timer.callback();},poll:()=>{for(const timer of [...timers.values()])if(timer.period===700)timer.callback();}};};
const admittedView=():AnalysisView=> ({reviewId:'r',snapshotId:'snapshot',currentSnapshotId:'newer-source',analysisGeneration:2,graphRevision:7,selectedAnalysisId:'a'.repeat(64),jobs:[],preparation:null,corpus:null,inventory:null,clarifications:[],analysis:{analyzer:'source-neighborhood-v1.0.1',parser:'test-double',snapshotId:'snapshot',corpusDigest:'c'.repeat(64),analysisId:'a'.repeat(64),corpus:{base:{commit:'a'.repeat(40),inventory:'selected-context',acquisition:'test'},head:{commit:'b'.repeat(40),inventory:'selected-context',acquisition:'test'}},coverage:[],diagnostics:[],observed:{bytes:0,inventoryBytes:0,astNodes:0,invocationSites:0},status:'analyzed',nodes:[],edges:[],unresolved:[],neighborhoods:[]}});
const authored=(f:ReturnType<typeof storyFixture>)=>{
 const chapter=f.story.chapters[0]!,step=f.story.steps[0]!;
 const story:StoryContent={...f.story,chapters:[{...chapter,stepIds:['second','step']},{...chapter,id:'limits',title:'Remaining limits',stepIds:['last']}],steps:[step,{...step,id:'last',headline:'Limits remain'}, {...step,id:'second',headline:'Begin here'}]};
 assert.equal(f.store.story.command(f.token,f.publish({story})).state,'applied');
 return f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'});
};
const context=(f:ReturnType<typeof storyFixture>):StoryContextView=>f.store.story.context(f.token,{reviewId:'r',snapshotId:'snapshot',contextRevision:0});
const load=async(f:ReturnType<typeof storyFixture>,fetcher:ReturnType<typeof deferredFetch>,bridge:ReturnType<typeof createStoryBridge>,view:StoryView,token=f.token)=>{const offset=fetcher.calls.length,promise=bridge.login(token,f.snapshot);fetcher.calls[offset]!.resolve(view);await turn();fetcher.calls[offset+1]!.resolve(context(f));await promise;};
test('S07 pure traversal follows chapter order, visible time, pause, replay and a final nonlooping end',async()=>{const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 await load(f,fetcher,bridge,authored(f));let state=bridge.getSnapshot();assert.equal(state.mode,'paused');assert.equal(storyProjection(state)?.step.id,'second');
 const initial=state;state=storyTransition(state,{type:'replay'});state=storyTransition(state,{type:'tick',elapsedMs:7999});assert.equal(state.cursor?.stepId,'second');assert.equal(state.elapsedMs,7999);assert.equal(initial.elapsedMs,0);
 state=storyTransition(state,{type:'pause',reason:'reading'});assert.equal(storyTransition(state,{type:'tick',elapsedMs:90000}).elapsedMs,7999);
 state=storyTransition(state,{type:'replay'});assert.equal(state.elapsedMs,0);state=storyTransition(state,{type:'tick',elapsedMs:8000});assert.equal(state.cursor?.stepId,'step');assert.equal(state.mode,'playing');
 state=storyTransition(state,{type:'tick',elapsedMs:8000});assert.equal(state.cursor?.chapterId,'limits');state=storyTransition(state,{type:'tick',elapsedMs:8000});assert.equal(state.mode,'ended');assert.equal(state.cursor?.stepId,'last');assert.equal(storyTransition(state,{type:'tick',elapsedMs:8000}).mode,'ended');
 assert.equal(storyTransition(state,{type:'chapter',chapterId:'change'}).cursor?.stepId,'second');assert.equal(storyTransition(state,{type:'previous'}).cursor?.stepId,'step');
 }finally{bridge.logout();fetcher.restore();f.cleanup();}});
test('S08 one managed clock, reading/hidden/surface/disconnect pause without catch-up and reconnect returns route baseline',async()=>{const f=storyFixture(),fetcher=deferredFetch(),time=manualClock(),bridge=createStoryBridge('r',{clock:time.clock});let dispose=()=>{};try{
 await load(f,fetcher,bridge,authored(f));dispose=bridge.connect();assert.equal(bridge.diagnostics().length,2);assert.equal(time.timers.size,1);
 bridge.intent({type:'replay'});assert.equal(time.timers.size,2);time.advance(3500);assert.equal(bridge.getSnapshot().elapsedMs,3500);
 bridge.intent({type:'visibility',hidden:true});time.advance(100000);assert.equal(bridge.getSnapshot().elapsedMs,3500);assert.equal(bridge.getSnapshot().mode,'paused');assert.equal(time.timers.size,1);
 bridge.intent({type:'visibility',hidden:false});bridge.intent({type:'replay'});time.advance(1200);bridge.intent({type:'surface',surface:'diff'});assert.equal(bridge.getSnapshot().elapsedMs,1200);assert.equal(bridge.getSnapshot().mode,'paused');
 bridge.intent({type:'replay'});dispose();assert.equal(time.timers.size,0);assert.deepEqual(bridge.diagnostics(),[]);assert.equal(bridge.getSnapshot().mode,'paused');time.advance(50000);assert.equal(bridge.getSnapshot().elapsedMs,0);
 dispose=bridge.connect();assert.equal(time.timers.size,1);assert.equal(bridge.diagnostics().length,2);dispose();assert.equal(time.timers.size,0);
 }finally{dispose();bridge.logout();fetcher.restore();f.cleanup();}});
test('S10 publication markers keep exact cursor/evidence/context and foreground reads own the slot; late credential/disposal responses fence',async()=>{const f=storyFixture(),fetcher=deferredFetch(),time=manualClock(),bridge=createStoryBridge('r',{clock:time.clock});let dispose=()=>{};try{
 const view=authored(f);await load(f,fetcher,bridge,view);bridge.intent({type:'next'});const cursor=bridge.getSnapshot().cursor;dispose=bridge.connect();
 const start=fetcher.calls.length;const refresh=bridge.refresh();time.poll();assert.equal(fetcher.calls.length,start+1);assert.match(fetcher.calls[start]!.url,new RegExp(`versionId=${view.version!.versionId}`));
 fetcher.calls[start]!.resolve({...view,storyRevision:2,contextRevision:1,newerVersion:true,newerContext:true});await refresh;assert.deepEqual(bridge.getSnapshot().cursor,cursor);assert.equal(bridge.getSnapshot().view?.newerVersion,true);assert.equal(bridge.getSnapshot().context?.selectedRevision,0);
 const oldIndex=fetcher.calls.length,old=bridge.refresh();dispose();assert.equal(fetcher.calls[oldIndex]!.options?.signal?.aborted,true);fetcher.calls[oldIndex]!.resolve({...view,storyRevision:99});await old;assert.equal(bridge.getSnapshot().view?.storyRevision,2);
 const oldLoginIndex=fetcher.calls.length,oldLogin=bridge.login('old',f.snapshot),freshIndex=fetcher.calls.length,fresh=bridge.login('fresh',f.snapshot);fetcher.calls[freshIndex]!.resolve(view);await turn();fetcher.calls[freshIndex+1]!.resolve(context(f));await fresh;fetcher.calls[oldLoginIndex]!.resolve({...view,storyRevision:88});await oldLogin;assert.equal(bridge.getSnapshot().view?.storyRevision,1);
 }finally{dispose();bridge.logout();fetcher.restore();f.cleanup();}});
test('S07/S12 evidence retains LF snapshot and exact UTF-16 semantic coordinates, source hash failures stay explicit, player clamp is pure',async()=>{const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 await load(f,fetcher,bridge,authored(f));const source=storyProjection(bridge.getSnapshot())!.sources[0]!;assert.equal(source.text,'export const value = 2;');assert.equal(source.coordinates,'snapshot LF lines');
 await bridge.openEvidence({...f.source,contentHash:'f'.repeat(64)});assert.match(bridge.getSnapshot().evidenceText,/unavailable/i);
 let state:StoryState=storyTransition(bridge.getSnapshot(),{type:'resizePlayer',viewport:{width:390,height:844},size:{width:374,height:44}});state=storyTransition(state,{type:'movePlayer',x:9999,y:-9999});assert.equal(state.position.x,0);assert.equal(state.position.y,-784);assert.equal(state.mode,'paused');state=storyTransition(state,{type:'resetPlayer'});assert.deepEqual(state.position,{x:0,y:0});
 }finally{bridge.logout();fetcher.restore();f.cleanup();}});
test('S07/S10 exact semantic UTF-16 slices survive parser-line differences; old source and version reads cannot change a newer cursor',async()=>{const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');let dispose=()=>{};try{
 const view=authored(f),content='// 😀\u2028export const value = "😀";\r\n',start=content.indexOf('export'),end=content.indexOf(';')+1;
 const ref={type:'semantic_source' as const,corpusId:'c'.repeat(64),anchor:{snapshotId:'snapshot',side:'head' as const,path:'value.ts',contentHash:'d'.repeat(64),start,end,startLine:2,endLine:2}};
 const semantic={...view,version:{...view.version!,story:{...view.version!.story,analysisId:'e'.repeat(64),corpusId:ref.corpusId,steps:view.version!.story.steps.map(step=>({...step,focus:{type:'sources' as const,fileKey:f.fileKey,sources:[ref]}}))}}};
 await load(f,fetcher,bridge,semantic);dispose=bridge.connect();const first=fetcher.calls.at(-1)!;assert.equal(first.url,'/api/analysis/source');assert.equal(first.options?.method,'POST');assert.deepEqual(JSON.parse(String(first.options?.body)),{reviewId:'r',snapshotId:'snapshot',corpusId:ref.corpusId,side:'head',path:'value.ts',contentHash:ref.anchor.contentHash});
 first.resolve({...ref.anchor,corpusId:ref.corpusId,content,commit:'b'.repeat(40),role:'context',selected:true,objectId:'0'.repeat(40),lineCount:2});await turn();assert.equal(storyProjection(bridge.getSnapshot())!.sources[0]!.text,'export const value = "😀";');assert.equal(storyProjection(bridge.getSnapshot())!.sources[0]!.coordinates,'semantic UTF-16 offsets');
 const evidence=bridge.openEvidence({...ref,anchor:{...ref.anchor,contentHash:'f'.repeat(64)}}),late=fetcher.calls.at(-1)!;bridge.intent({type:'next'});late.resolve({...ref.anchor,corpusId:ref.corpusId,content:'WRONG',contentHash:'f'.repeat(64)});await evidence;assert.equal(bridge.getSnapshot().evidence,null);assert.equal(bridge.getSnapshot().cursor?.stepId,'step');
 const old=bridge.refresh(),oldCall=fetcher.calls.at(-1)!,open=bridge.openVersion();const newCall=fetcher.calls.at(-1)!;assert.equal(new URL(newCall.url,'http://local').searchParams.has('versionId'),false);newCall.resolve({...semantic,version:{...semantic.version,versionId:'new-version',storyRevision:2},storyRevision:2});await turn();fetcher.calls.at(-1)!.resolve(context(f));await open;oldCall.resolve({...semantic,storyRevision:99});await old;assert.equal(bridge.getSnapshot().cursor?.versionId,'new-version');assert.equal(bridge.getSnapshot().view?.storyRevision,2);
 }finally{dispose();bridge.logout();fetcher.restore();f.cleanup();}});
test('S08 scopes and repeated connections dispose exactly once; observers cannot create clocks or commands, no-op visibility cannot cause a render loop',async()=>{const f=storyFixture(),fetcher=deferredFetch(),time=manualClock(),bridge=createStoryBridge('r',{clock:time.clock});let dispose=()=>{};try{
 let notifications=0;const unsubscribe=bridge.subscribe(()=>notifications++),second=bridge.subscribe(()=>notifications++);assert.equal(time.timers.size,0);await load(f,fetcher,bridge,authored(f));dispose=bridge.connect();const oldDispose=dispose;dispose=bridge.connect();oldDispose();assert.equal(time.timers.size,1);assert.equal(bridge.diagnostics().length,2);const scope=JSON.parse(bridge.diagnostics()[0]!.scope) as {reviewId:string;snapshotId:string;generation:number};assert.equal(scope.reviewId,'r');assert.equal(scope.snapshotId,'snapshot');assert.equal(JSON.stringify(scope).includes(f.token),false);
 const before=notifications;bridge.intent({type:'visibility',hidden:false});bridge.intent({type:'reducedMotion',value:false});assert.equal(notifications,before);unsubscribe();second();dispose();assert.equal(time.timers.size,0);assert.equal(fetcher.calls.every(call=>!call.options?.body),true);
 }finally{dispose();bridge.logout();fetcher.restore();f.cleanup();}});

test('S07 managed semantic focus pins the exact admitted analysis, cannot apply a late cursor, and exposes no inspector/navigation or worker command route',async()=>{const f=storyFixture(),fetcher=deferredFetch();let release=()=>{},first=true;const calls:{snapshot:string;analysis:string|undefined}[]=[],focused:string[]=[];
 const semanticView=admittedView();
 const semantic={select:async(snapshot:string,analysis?:string)=>{calls.push({snapshot,analysis});if(first){first=false;await new Promise<void>(resolve=>{release=resolve;});}},focus:(id:string)=>{focused.push(id);},getSnapshot:()=>({...createAnalysisBridge('r').getSnapshot(),view:semanticView})};
 const bridge=createStoryBridge('r',{semantic});let dispose=()=>{};try{
  const view=authored(f),story={...view.version!.story,analysisId:'a'.repeat(64),corpusId:'c'.repeat(64),steps:view.version!.story.steps.map(step=>step.id==='second'?{...step,focus:{type:'semantic' as const,reference:{type:'static_node' as const,analysisId:'a'.repeat(64),factId:'exact-node'},sources:[f.source]}}:step)};
  await load(f,fetcher,bridge,{...view,version:{...view.version!,story}});dispose=bridge.connect();await turn();assert.deepEqual(calls,[{snapshot:'snapshot',analysis:'a'.repeat(64)}]);bridge.intent({type:'next'});await turn();release();await turn();assert.deepEqual(focused,[]);bridge.intent({type:'previous'});await turn();assert.deepEqual(focused,['exact-node']);assert.equal(bridge.diagnostics().find(route=>route.id==='story-focus-to-coordinated-view')!.cursor,3);assert.equal(fetcher.calls.every(call=>!call.options?.body),true);
 }finally{release();dispose();bridge.logout();fetcher.restore();f.cleanup();}});

test('S07 independent P2 regression: actual AnalysisBridge shares a delayed same-analysis selection and applies only the latest story cursor',async()=>{const f=storyFixture(),fetcher=deferredFetch(),semantic=createAnalysisBridge('r'),bridge=createStoryBridge('r',{semantic});let dispose=()=>{};try{
 const graphLogin=semantic.login(f.token,'snapshot');fetcher.calls.at(-1)!.resolve(admittedView());await graphLogin;
 const view=authored(f),story={...view.version!.story,analysisId:'a'.repeat(64),corpusId:'c'.repeat(64),steps:view.version!.story.steps.map(step=>({...step,focus:{type:'semantic' as const,reference:{type:'static_node' as const,analysisId:'a'.repeat(64),factId:`node-${step.id}`},sources:[f.source]}}))};
 await load(f,fetcher,bridge,{...view,version:{...view.version!,story}});dispose=bridge.connect();await turn();const pinned=fetcher.calls.at(-1)!;assert.match(pinned.url,/analysisId=aaaa/);bridge.intent({type:'next'});await turn();assert.equal(bridge.getSnapshot().cursor?.stepId,'step');assert.equal(bridge.getSnapshot().focusError,'');assert.equal(semantic.getSnapshot().focus,'');
 pinned.resolve(admittedView());await turn();await turn();assert.equal(semantic.getSnapshot().focus,'node-step');assert.equal(bridge.getSnapshot().focusError,'');assert.equal(fetcher.calls.filter(call=>call.url.startsWith('/api/analysis?')).length,2);assert.equal(fetcher.calls.every(call=>!call.options?.body),true);
 }finally{dispose();bridge.logout();semantic.logout();fetcher.restore();f.cleanup();}});
test('S10 independent P2 regression: delayed initial authored context cannot overwrite explicit current-context adoption',async()=>{const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 const view=authored(f),login=bridge.login(f.token,f.snapshot);fetcher.calls[0]!.resolve({...view,newerContext:true,contextRevision:1});await turn();const original=fetcher.calls.at(-1)!;assert.match(original.url,/contextRevision=0/);
 const current=bridge.openCurrentContext();fetcher.calls.at(-1)!.resolve({...context(f),currentContextRevision:1,selectedRevision:1});await current;assert.equal(bridge.getSnapshot().context?.selectedRevision,1);assert.equal(original.options?.signal?.aborted,true);
 original.resolve(context(f));await login;assert.equal(bridge.getSnapshot().context?.selectedRevision,1);assert.equal(bridge.getSnapshot().view?.version?.contextRevision,0);
 const old=bridge.openCurrentContext(),late=fetcher.calls.at(-1)!;bridge.logout();late.resolve({...context(f),currentContextRevision:9,selectedRevision:9});await old;assert.equal(bridge.getSnapshot().context,null);
 }finally{bridge.logout();fetcher.restore();f.cleanup();}});
test('same-selection readiness waiters reject failed/superseded reads and disposal releases them despite ignored transport abort',async()=>{const fetcher=deferredFetch(),semantic=createAnalysisBridge('r');try{
 const old=semantic.login('old','snapshot'),waiting=semantic.select('snapshot');semantic.logout();await assert.rejects(waiting,/selection_superseded/);fetcher.calls[0]!.resolve(admittedView());await old;assert.equal(semantic.getSnapshot().view,null);
 const bad=semantic.login('new','snapshot').catch(error=>error as Error),joining=semantic.select('snapshot');fetcher.calls.at(-1)!.resolve({...admittedView(),snapshotId:'foreign'});await assert.rejects(joining,/selection_mismatch/);assert.match(String(await bad),/selection_mismatch/);assert.equal(fetcher.calls.length,2);
 }finally{semantic.logout();fetcher.restore();}});
test('S07 explicit step/replay focus revision reestablishes the map while background views do not, including exact structural hunk identity',async()=>{const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 const view=authored(f),story={...view.version!.story,steps:view.version!.story.steps.map(step=>({...step,focus:{type:'structural' as const,fileKey:f.fileKey,hunkId:'retained-hunk-id'}}))};await load(f,fetcher,bridge,{...view,version:{...view.version!,story}});const initial=storyProjection(bridge.getSnapshot())!.graphFocus!;assert.equal(initial.hunkId,'retained-hunk-id');bridge.intent({type:'next'});const next=storyProjection(bridge.getSnapshot())!.graphFocus!;assert.notEqual(next.intentId,initial.intentId);assert.equal(next.fileKey,initial.fileKey);bridge.intent({type:'replay'});const replay=storyProjection(bridge.getSnapshot())!.graphFocus!;assert.notEqual(replay.intentId,next.intentId);const refresh=bridge.refresh();fetcher.calls.at(-1)!.resolve({...view,version:{...view.version!,story},newerContext:true});await refresh;assert.equal(storyProjection(bridge.getSnapshot())!.graphFocus!.intentId,replay.intentId);
 }finally{bridge.logout();fetcher.restore();f.cleanup();}});
test('S10 polling cannot cancel a pending explicit context selection after an older initial read settles',async()=>{const f=storyFixture(),fetcher=deferredFetch(),time=manualClock(),bridge=createStoryBridge('r',{clock:time.clock});let dispose=()=>{};try{
 const view=authored(f),login=bridge.login(f.token,f.snapshot);fetcher.calls[0]!.resolve({...view,newerContext:true,contextRevision:1});await turn();const original=fetcher.calls.at(-1)!;dispose=bridge.connect();const current=bridge.openCurrentContext(),currentRead=fetcher.calls.at(-1)!;original.resolve(context(f));await login;const before=fetcher.calls.length;time.poll();fetcher.calls.at(-1)!.resolve({...view,newerContext:true,contextRevision:1});await turn();assert.equal(fetcher.calls.length,before+1);assert.equal(currentRead.options?.signal?.aborted,false);assert.equal(bridge.getSnapshot().contextReading,true);currentRead.resolve({...context(f),currentContextRevision:1,selectedRevision:1});await current;assert.equal(bridge.getSnapshot().context?.selectedRevision,1);assert.equal(bridge.getSnapshot().contextReading,false);
 }finally{dispose();bridge.logout();fetcher.restore();f.cleanup();}});
for(const ending of ['edit','logout','dispose','new-source'] as const)test(`S12 actual semantic bridge cancels a restored inspector on ${ending} and never publishes its ignored-abort reply`,async()=>{
 const f=storyFixture(),original=globalThis.fetch,c='c'.repeat(64),graph={...admittedView(),corpus:{corpusId:c} as unknown as NonNullable<AnalysisView['corpus']>},content=f.snapshot.sources[0]!.content,anchor={snapshotId:'snapshot',side:'head' as const,path:'value.ts',contentHash:f.snapshot.sources[0]!.hash,start:0,end:content.length,startLine:1,endLine:1},reads:{signal:AbortSignal|null|undefined;resolve:(value:Response)=>void}[]=[];
 f.store.story.command(f.token,f.publish());globalThis.fetch=((input:Parameters<typeof fetch>[0],init?:RequestInit)=>{const url=new URL(String(input),'http://local');if(url.pathname==='/api/story')return Promise.resolve(Response.json(f.store.story.query(f.token,{reviewId:'r',snapshotId:'snapshot'})));if(url.pathname==='/api/story/context')return Promise.resolve(Response.json(context(f)));if(url.pathname==='/api/analysis')return Promise.resolve(Response.json(graph));if(url.pathname==='/api/analysis/source')return new Promise<Response>(resolve=>reads.push({signal:init?.signal,resolve}));throw new Error(String(input));}) as typeof fetch;
 const semantic=createAnalysisBridge('r'),bridge=createStoryBridge('r',{semantic}),disconnect=bridge.connect(),source={...anchor,corpusId:c,content,commit:f.snapshot.headSha,role:'changed',selected:true,objectId:'0'.repeat(40),lineCount:1};
 try{await semantic.login(f.token,'snapshot');await bridge.login(f.token,f.snapshot);bridge.updateGraphFrame('semantic',{analysisId:graph.analysis!.analysisId,focus:'',fullSource:false,viewport:{x:0,y:0,zoom:1},sourceAnchor:anchor,corpusId:c});bridge.enterExploration();bridge.editDraft('Exploration');const frame=bridge.getSnapshot().returnFrame,resuming=bridge.resumeStory().catch(error=>error);for(let i=0;i<12&&!reads.length;i++)await turn();assert.equal(reads.length,1);
  let newer:Promise<void>|undefined;const newerAnchor={...anchor,start:1};if(ending==='new-source')newer=semantic.openSource(newerAnchor);
  if(ending==='logout')bridge.logout();else if(ending==='dispose')disconnect();else bridge.editDraft('New exploration intent');assert.match(String(await resuming),/superseded/);assert.equal(reads[0]!.signal?.aborted,true);if(ending==='new-source'){assert.equal(reads[1]!.signal?.aborted,false);assert.equal(semantic.getSnapshot().sourceBusy,true);reads[1]!.resolve(Response.json(source));await newer;assert.deepEqual(semantic.getSnapshot().sourceAnchor,newerAnchor);}else assert.equal(semantic.getSnapshot().sourceBusy,false);
  reads[0]!.resolve(Response.json(source));await turn();if(ending==='new-source')assert.deepEqual(semantic.getSnapshot().sourceAnchor,newerAnchor);else assert.equal(semantic.getSnapshot().source,null);if(ending!=='logout')assert.equal(bridge.getSnapshot().returnFrame,frame);else assert.deepEqual(bridge.getSnapshot().drafts,[]);
 }finally{disconnect();bridge.logout();semantic.logout();globalThis.fetch=original;f.cleanup();}
});

// D1–D4: the authored account and explicit question intent stay application policy.
test('D1/D2 presentation deduplicates exact claim IDs and resolves complete scope through retained file identity',async()=>{
 const {storyPresentation}=await import('../src/application/public.ts');const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 await load(f,fetcher,bridge,authored(f));const presentation=storyPresentation(bridge.getSnapshot())!;
 assert.equal(presentation.details.filter(item=>item.claim.id==='what').length,0);
 assert.equal(presentation.details.filter(item=>item.claim.id==='why').length,1);
 assert.equal(presentation.groups.flatMap(group=>group.files).length,1);assert.equal(presentation.groups.at(-1)!.title,'Unexplained');assert.equal(presentation.groups.at(-1)!.files.length,0);
 assert.equal(presentation.groups[0]!.files[0]!.label,'value.ts');
 assert.equal(presentation.groups[0]!.files[0]!.account.fileKey,f.fileKey);
 const state=bridge.getSnapshot(),version=state.view!.version!,story={...version.story,scope:[...version.story.scope,{type:'unexplained' as const,fileKey:'unknown-exact-id',reason:'Not authored'}]};
 const unknown=storyPresentation({...state,view:{...state.view!,version:{...version,story}}})!.groups.at(-1)!;
 assert.equal(unknown.title,'Unexplained');assert.equal(unknown.files[0]!.label,'Retained file identity unavailable');
 const renamed={...f.snapshot,changedFiles:[{status:'renamed' as const,oldPath:'old.ts',newPath:'new.ts',dispositions:[]}]};
 const renamedKey=JSON.stringify([0,'old.ts','new.ts']),renamedStory={...version.story,scope:version.story.scope.map(account=>({...account,fileKey:renamedKey}))};
 const renamedGroup=storyPresentation({...state,snapshot:renamed,view:{...state.view!,version:{...version,story:renamedStory}}})!.groups[0]!;
 assert.equal(renamedGroup.files[0]!.label,'old.ts → new.ts');assert.equal(renamedGroup.files[0]!.status,'renamed');assert.equal(renamedGroup.files.length,1);
 }finally{bridge.logout();fetcher.restore();f.cleanup();}
});
test('D4 explicit evidence adoption previews mismatch, confirms nonempty draft, preserves parent and rejects stale/pending/submitted intents',async()=>{
 const {questionEvidenceProjection}=await import('../src/application/public.ts');const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 await load(f,fetcher,bridge,authored(f));bridge.setParentQuestion('parent');bridge.editDraft('Original preserved text');bridge.enterExploration();bridge.editDraft('Exploration retained text');
 const frame=bridge.getSnapshot().returnFrame,original=bridge.getSnapshot().drafts.find(d=>d.id===frame!.originalDraftId);
 await bridge.openEvidence(f.source);let ready=questionEvidenceProjection(bridge.getSnapshot());assert.equal(ready.kind,'ready');if(ready.kind!=='ready')throw new Error('ready required');
 const first=ready;assert.equal(first.confirmationRequired,true);assert.throws(()=>bridge.adoptEvidence(first),/confirmation_required/);
 bridge.editDraft('A newer exploration draft');assert.throws(()=>bridge.adoptEvidence(first,true),/superseded/);
 ready=questionEvidenceProjection(bridge.getSnapshot());if(ready.kind!=='ready')throw new Error('ready required');bridge.adoptEvidence(ready,true);
 assert.equal(bridge.activeDraft()!.text,'A newer exploration draft');assert.equal(bridge.activeDraft()!.parentQuestionId,'parent');assert.deepEqual(bridge.getSnapshot().returnFrame,frame);assert.deepEqual(bridge.getSnapshot().drafts.find(d=>d.id===original!.id),original);
 bridge.setQuestionGuard(true);assert.equal(questionEvidenceProjection(bridge.getSnapshot()).kind,'blocked');assert.throws(()=>bridge.adoptEvidence(ready,true),/submission_pending/);bridge.setQuestionGuard(false);
 bridge.confirmDraft(bridge.activeDraft()!.id);assert.equal(questionEvidenceProjection(bridge.getSnapshot()).kind,'blocked');
 }finally{bridge.logout();fetcher.restore();f.cleanup();}
});
test('D4 malformed, unmapped semantic, stale hash and unavailable snapshot evidence never become question anchors',async()=>{
 const {questionEvidenceProjection}=await import('../src/application/public.ts');const f=storyFixture(),fetcher=deferredFetch(),bridge=createStoryBridge('r');try{
 await load(f,fetcher,bridge,authored(f));await bridge.openEvidence({...f.source,contentHash:'f'.repeat(64)});assert.equal(questionEvidenceProjection(bridge.getSnapshot()).kind,'unavailable');
 const state=bridge.getSnapshot(),semantic={type:'semantic_source' as const,corpusId:'c'.repeat(64),anchor:{snapshotId:'snapshot',side:'head' as const,path:'value.ts',contentHash:f.source.contentHash,start:0,end:10,startLine:1,endLine:1}};
 assert.equal(questionEvidenceProjection({...state,evidence:semantic}).kind,'unavailable');
 assert.equal(questionEvidenceProjection({...state,evidence:{...f.source,anchor:{...f.source.anchor,endLine:999}}}).kind,'unavailable');
 }finally{bridge.logout();fetcher.restore();f.cleanup();}
});
