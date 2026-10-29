import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSceneIndex, viewportBounds} from '../../../src/review-graph/ui/scene-index.ts';
import {sceneGeometry} from '../../../src/review-graph/ui/scene-geometry.ts';
import {createViewportWorker, type SceneWorkerPort} from '../../../src/review-graph/integration/viewport-worker.ts';
import type {SceneSnapshotUI, ViewportQueryUI, SceneWorkerInputUI, SceneWorkerOutputUI, SceneSelectionUI, SceneBoxUI} from '../../../src/review-graph/ui/types.ts';
const scene: SceneSnapshotUI = {comparison: 'a', revision: 1, nodes: [
    {id:'root', bounds:{x:-300,y:-400,width:10,height:10}},
    {id:'nested',parentId:'root',bounds:{x:-280,y:-360,width:20,height:30}},
    {id:'left',bounds:{x:-1000,y:40,width:10,height:20}},
    {id:'right',bounds:{x:1000,y:40,width:10,height:20}},
    {id:'boundary',bounds:{x:200,y:0,width:20,height:20}},
],routes:[{id:'crossing',source:'left',target:'right',bounds:{x:-1000,y:40,width:2010,height:20},labelBounds:{x:40,y:40,width:20,height:20}},
    {id:'label-only',source:'left',target:'right',bounds:{x:500,y:500,width:50,height:50},labelBounds:{x:50,y:30,width:10,height:10}}]};
const query = (extra: Partial<ViewportQueryUI> = {}): ViewportQueryUI => ({comparison:'a',revision:1,request:1,x:0,y:0,zoom:1,width:100,height:100,pixelRatio:1,overscan:0,pinnedNodes:[],pinnedRoutes:[],...extra});
// Independent brute-force oracle. It deliberately does not share index helpers/traversal.
const brute = (s: SceneSnapshotUI, q: ViewportQueryUI) => {
    const lowX=(-q.x-q.overscan)/q.zoom, lowY=(-q.y-q.overscan)/q.zoom;
    const highX=(q.width-q.x+q.overscan)/q.zoom, highY=(q.height-q.y+q.overscan)/q.zoom;
    const hit=(b:SceneBoxUI)=>b.x+b.width>=lowX&&b.x<=highX&&b.y+b.height>=lowY&&b.y<=highY;
    const nodeIds=new Set(s.nodes.filter(n=>hit(n.bounds)||q.pinnedNodes.includes(n.id)).map(n=>n.id));
    const routeIds=s.routes.filter(r=>hit(r.bounds)||hit(r.labelBounds)||q.pinnedRoutes.includes(r.id)).map(r=>r.id);
    const metadata=new Set(nodeIds);
    for(const route of s.routes.filter(r=>routeIds.includes(r.id))){metadata.add(route.source);metadata.add(route.target);}
    for(const id of metadata){let parent=s.nodes.find(n=>n.id===id)?.parentId;while(parent){metadata.add(parent);parent=s.nodes.find(n=>n.id===parent)?.parentId;}}
    return {nodeIds:[...nodeIds].sort(),routeIds:routeIds.sort(),metadataNodeIds:[...metadata].sort()};
};

test('indexed selection matches independent brute-force oracle across negative, nested, resize, zoom, overscan and crossing geometry',()=>{
    const index=createSceneIndex(structuredClone(scene));
    for(const zoom of [0.0001,0.25,1,2,1000])for(const x of [-1000,-100,0,300])for(const overscan of [0,100]) {
        const q=query({zoom,x,y:x/2,overscan,width:x===0?100:390,pixelRatio:3,pinnedNodes:['nested'],pinnedRoutes:['label-only']});
        const result=index.query(q), expected=brute(scene,q);
        assert.deepEqual({nodeIds:result.nodeIds,routeIds:result.routeIds,metadataNodeIds:result.metadataNodeIds},expected);
    }
    const result=index.query(query());assert.deepEqual(result.routeIds,['crossing','label-only']);
    assert.deepEqual(result.metadataNodeIds,['left','right']);assert.deepEqual(result.nodeIds,[]);
    assert.ok(index.query(query({overscan:100})).nodeIds.includes('boundary'));
    assert.deepEqual(viewportBounds(query({pixelRatio:3})),viewportBounds(query({pixelRatio:1})));
});

test('complete nested measured/manual geometry and quadratic hull include every sampled stroke and label',()=>{
    const nodes=[{id:'parent',position:{x:-500,y:-700},measured:{width:500,height:600}},
        {id:'child',parentId:'parent',position:{x:40,y:120},measured:{width:100,height:50}},
        {id:'far',position:{x:1000,y:800},measured:{width:100,height:50}}];
    const snapshot=sceneGeometry({comparison:'a',revision:1},nodes,[{id:'r',source:'child',target:'far',routed:{sourceSide:'right',targetSide:'left',offset:{x:-900,y:900},label:{x:0,y:0}}}],{r:{width:280,height:130}});
    assert.deepEqual(snapshot.nodes.find(n=>n.id==='child')!.bounds,{x:-460,y:-580,width:100,height:50});
    const r=snapshot.routes[0]!,start={x:-360,y:-555},end={x:1000,y:825};
    const middle={x:(start.x+end.x)/2-900,y:(start.y+end.y)/2+900};
    const control={x:2*middle.x-(start.x+end.x)/2,y:2*middle.y-(start.y+end.y)/2};
    for(let i=0;i<=100;i++){const t=i/100;const x=(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*end.x;const y=(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*end.y;assert.ok(x>=r.bounds.x&&x<=r.bounds.x+r.bounds.width&&y>=r.bounds.y&&y<=r.bounds.y+r.bounds.height);}
    assert.deepEqual(r.labelBounds,{x:middle.x-140,y:middle.y-65,width:280,height:130});
});

test('index rejects invalid geometry/identity/ancestry and invalid viewport instead of hiding content',()=>{
    for(const zoom of [0,-1,NaN,Infinity])assert.throws(()=>createSceneIndex(scene).query(query({zoom})));
    for(const extra of [{width:0},{height:-1},{pixelRatio:0},{overscan:-1},{x:Infinity},{revision:2}])assert.throws(()=>createSceneIndex(scene).query(query(extra)));
    assert.throws(()=>createSceneIndex({...scene,nodes:[{id:'bad',bounds:{x:NaN,y:0,width:1,height:1}}]}));
    assert.throws(()=>createSceneIndex({...scene,nodes:[{id:'bad',parentId:'bad',bounds:{x:0,y:0,width:1,height:1}}]}));
    assert.throws(()=>createSceneIndex({...scene,nodes:[...scene.nodes,scene.nodes[0]!]}));
});

test('separated-scene candidate visits grow logarithmically rather than scanning all items',()=>{
    for(const n of [1000,10000,50000]){
        const s={comparison:'a',revision:1,nodes:Array.from({length:n},(_,i)=>({id:String(i),bounds:{x:i*1000,y:0,width:100,height:100}})),routes:[]};
        const index=createSceneIndex(s),result=index.query(query({width:900}));
        assert.deepEqual(result.nodeIds,['0']);assert.ok(result.visitedBranches<40);assert.ok(result.visited<=16,`${n}: visited ${result.visited}`);
    }
});

const fakePort = () => {
    const listeners=new Map<string,Set<(event: MessageEvent<SceneWorkerOutputUI>)=>void>>();
    const sent:SceneWorkerInputUI[]=[];let terminated=0;
    const port:SceneWorkerPort={postMessage:message=>{sent.push(structuredClone(message));},addEventListener:(type,listener)=>{const set=listeners.get(type)??new Set();set.add(listener);listeners.set(type,set);},removeEventListener:(type,listener)=>{listeners.get(type)?.delete(listener);},terminate:()=>{terminated++;}};
    const reply=(message:SceneWorkerOutputUI)=>{for(const listener of listeners.get('message')??[])listener({data:structuredClone(message)} as MessageEvent<SceneWorkerOutputUI>);};
    const fault=(type:string)=>{for(const listener of listeners.get(type)??[])listener({} as MessageEvent<SceneWorkerOutputUI>);};
    return {port,sent,reply,fault,terminated:()=>terminated,listeners:()=>[...listeners.values()].reduce((n,set)=>n+set.size,0)};
};
const ready={type:'ready',comparison:'a',revision:1} as const;

test('bridge serializes transport, coalesces rapid camera requests and ignores out-of-order replies',()=>{
    const fake=fakePort(),published:(SceneSelectionUI|null)[]=[];
    const owner=createViewportWorker(()=>fake.port,s=>published.push(s));owner.replace(scene);
    for(let request=1;request<=100;request++)owner.query(query({request}));
    assert.equal(fake.sent.length,1);fake.reply(ready);assert.equal(fake.sent.length,2);
    const last=fake.sent[1]!;assert.equal(last.type,'query');if(last.type!=='query')throw Error();assert.equal(last.query.request,100);
    fake.reply({type:'selection',selection:createSceneIndex(scene).query(query({request:99}))});assert.equal(published.length,0);
    fake.reply({type:'selection',selection:createSceneIndex(scene).query(last.query)});assert.equal(published.length,1);
    owner.query(query({request:101}));owner.query(query({request:102,x:-10000}));assert.equal(published.at(-1),null);
    fake.reply({type:'selection',selection:createSceneIndex(scene).query(query({request:101}))});assert.equal(published.at(-1),null);
    assert.equal(fake.sent.length,4);owner.dispose();assert.equal(fake.terminated(),1);assert.equal(fake.listeners(),0);
});

test('replacement, changed pins and late pre-movement reply cannot revive old selection',()=>{
    const fake=fakePort(),published:(SceneSelectionUI|null)[]=[];const owner=createViewportWorker(()=>fake.port,s=>published.push(s));
    owner.replace(scene);owner.query(query());fake.reply(ready);fake.reply({type:'selection',selection:createSceneIndex(scene).query(query())});
    owner.query(query({request:2,pinnedNodes:['nested']}));assert.equal(published.at(-1),null);
    owner.replace({...scene,revision:2});owner.query(query({revision:2,request:3,pinnedNodes:['right']}));
    fake.reply({type:'selection',selection:createSceneIndex(scene).query(query({request:2,pinnedNodes:['nested']}))});assert.equal(published.at(-1),null);
    assert.equal(fake.sent.at(-1)!.type,'replace');fake.reply({...ready,revision:2});
    fake.reply({type:'selection',selection:createSceneIndex({...scene,revision:2}).query(query({revision:2,request:3,pinnedNodes:['right']}))});
    assert.equal(published.at(-1)?.revision,2);assert.ok(published.at(-1)?.nodeIds.includes('right'));owner.dispose();
});

test('worker unavailable, errors, timeout, post failure and disposal retain full-render fallback',async()=>{
    for(const fault of ['error','messageerror','worker-error','timeout','post']){
        const fake=fakePort(),published:(SceneSelectionUI|null)[]=[];
        const port=fault==='post'?{...fake.port,postMessage:()=>{throw Error('transport');}}:fake.port;
        const owner=createViewportWorker(()=>port,s=>published.push(s),5);owner.replace(scene);owner.query(query());
        if(fault==='worker-error')fake.reply({type:'error',message:'failed'});
        else if(fault==='timeout')await new Promise(resolve=>setTimeout(resolve,15));
        else if(fault!=='post')fake.fault(fault);
        assert.equal(fake.terminated(),1);assert.equal(fake.listeners(),0);owner.query(query({request:2}));owner.dispose();assert.ok(published.every(s=>s===null));
    }
    const owner=createViewportWorker(()=>{throw Error('unsupported');},()=>{throw Error('must stay full fallback');});owner.replace(scene);owner.query(query());owner.dispose();
    const fake=fakePort();const disposed=createViewportWorker(()=>fake.port,()=>{throw Error('disposed publication');});disposed.replace(scene);disposed.query(query());disposed.dispose();fake.reply(ready);assert.equal(fake.sent.length,1);
});

test('actual worker entry accepts serializable scene/query and returns dedicated-thread indexed result',async()=>{
    const {Worker}=await import('node:worker_threads');
    const entry=new URL('../../../src/review-graph/ui/scene.worker.ts',import.meta.url).href;
    const worker=new Worker(`import {parentPort} from 'node:worker_threads';globalThis.postMessage=message=>parentPort.postMessage(message);await import(${JSON.stringify(entry)});parentPort.on('message',data=>globalThis.onmessage({data}));`,{eval:true});
    try {
        const next=()=>new Promise<SceneWorkerOutputUI>((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);});
        const ready=next();worker.postMessage({type:'replace',scene} satisfies SceneWorkerInputUI);assert.deepEqual(await ready,{type:'ready',comparison:'a',revision:1});
        const response=next();worker.postMessage({type:'query',query:query()} satisfies SceneWorkerInputUI);
        const message=await response;assert.equal(message.type,'selection');if(message.type!=='selection')throw Error();assert.deepEqual(message.selection,createSceneIndex(scene).query(query()));
    } finally {await worker.terminate();}
});

test('active UI membership applies present focus/native-reader/inspection pins to old responses, and falls back for new geometry',async()=>{
    const {sceneMembership}=await import('../../../src/review-graph/ui/scene-membership.ts');
    const result=createSceneIndex(scene).query(query());
    const membership=sceneMembership(scene,result,{nodes:['nested'],routes:['offscreen-focused-route']},['right']);
    assert.deepEqual([...membership!.nodes].sort(),['nested','right']);
    assert.ok(membership!.routes.has('offscreen-focused-route'));
    assert.equal(sceneMembership({...scene,revision:2},result,{nodes:[],routes:[]},[]),null);
    assert.equal(sceneMembership(null,result,{nodes:[],routes:[]},[]),null);
});

test('comparison-lifetime projection reuses unaffected UI identities and prepares source rows only on demand',async()=>{
    const {projectExperience}=await import('../../../src/review-graph/ui/projection.ts');
    const {experienceService}=await import('../../../src/review-graph/experience/service.ts');
    const {createGraphSession}=await import('../../../src/review-graph/ui/session.ts');
    let rowReads=0;
    const composition={status:'change',scope:'source unit',added:1,removed:1,get rows(){rowReads++;return [{kind:'add',beforeLine:null,afterLine:2,text:'exact source'}];},hunks:[]};
    const graph={entities:[{id:'a',kind:'function',data:{name:'a()',editComposition:composition}},{id:'b',kind:'function',data:{name:'b()'}}],relations:[],initialVisible:['a','b'],fileUnits:{},groupFor:{},unresolved:[],provenance:{repository:'r',base:'a'.repeat(40),head:'b'.repeat(40)}};
    const state=experienceService.openComparison(graph),first=projectExperience(state),again=projectExperience(state);
    assert.equal(rowReads,0);assert.equal(first.entities[0],again.entities[0]);assert.equal(first.entities[1],again.entities[1]);
    const opened=projectExperience({...state,sourceDisclosure:{a:true}});
    assert.equal(rowReads,0);assert.equal(first.entities[1],opened.entities[1]);assert.notEqual(first.entities[0],opened.entities[0]);
    const reading=opened.entities[0]!.ui.sourceReading!;assert.equal(reading.panes[1]!.rows[0]!.text,'exact source');assert.equal(rowReads,2);
    assert.equal(opened.entities[0]!.ui.sourceReading,reading);assert.equal(first.entities[0]!.ui.sourceReading,reading);assert.equal(rowReads,2);
    const session=createGraphSession(graph);assert.equal(session.layoutRelations,session.inspect('a',true).layoutRelations);
});
