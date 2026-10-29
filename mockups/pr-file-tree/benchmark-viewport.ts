/** Node-only reproducible workload; timings are descriptive, never browser/FPS evidence. */
import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import {createSceneIndex} from '../../src/review-graph/ui/scene-index.ts';
import {sceneGeometry} from '../../src/review-graph/ui/scene-geometry.ts';
import {initialLayout, automaticRoutes} from '../../src/review-graph/ui/graph-geometry.ts';
import {readingBands, filePaths, documentPaths} from '../../src/review-graph/ui/entity-presentation.ts';
import {projectExperience} from '../../src/review-graph/ui/projection.ts';
import {experienceService} from '../../src/review-graph/experience/service.ts';
import {omittedStructuralEdge} from '../../src/review-graph/ui/content.ts';
import type {SourceGraph} from '../../src/review-graph/domain/types.ts';
import type {SceneSnapshotUI, ViewportQueryUI} from '../../src/review-graph/ui/types.ts';
const graph=JSON.parse(readFileSync(new URL('./generated-source-graph.json',import.meta.url),'utf8')) as SourceGraph;
const state=experienceService.openComparison(graph),ms:number[]=[];
const coldStart=performance.now();
let view=projectExperience(state);
const coldProjectionMs=performance.now()-coldStart;
for(let i=0;i<20;i++){const start=performance.now();view=projectExperience(state);ms.push(performance.now()-start);}
const benchmark=(scene:SceneSnapshotUI)=>{
    const start=performance.now(),index=createSceneIndex(scene),indexMs=performance.now()-start;
    const q:ViewportQueryUI={comparison:scene.comparison,revision:scene.revision,request:1,x:0,y:0,zoom:1,width:900,height:700,pixelRatio:1,overscan:0,pinnedNodes:[],pinnedRoutes:[]};
    const begin=performance.now();let visited=0,branches=0,last=index.query(q);
    for(let i=0;i<100;i++){last=index.query({...q,request:i+1});visited+=last.visited;branches+=last.visitedBranches;}
    return {n:scene.nodes.length,routes:scene.routes.length,indexMs,queries:100,queryTotalMs:performance.now()-begin,leafItemsTested:visited,branchBoundsTested:branches,selectedNodes:last.nodeIds.length,selectedRoutes:last.routeIds.length,metadataNodes:last.metadataNodeIds.length,sceneBytes:JSON.stringify(scene).length,queryBytes:JSON.stringify(q).length,resultBytes:JSON.stringify(last).length,
        retainedWrappers:scene.nodes.length,heavyContents:last.nodeIds.length,relationDOM:last.routeIds.length};
};
const readingStart=performance.now();let sourceRows=0;
for(const entity of view.entities)for(const pane of entity.ui.sourceReading?.panes??[])sourceRows+=pane.rows.length;
const allSourceReadingDemandMs=performance.now()-readingStart;
const workloads=[1000,10000,50000].map(n=>benchmark({comparison:'synthetic',revision:1,nodes:Array.from({length:n},(_,i)=>({id:String(i),bounds:{x:i*1000,y:0,width:100,height:100}})),routes:[]}));
const relations=view.relations.filter(edge=>!omittedStructuralEdge(edge,view.entities));
const links=relations.map(edge=>({id:edge.id,source:edge.from,target:edge.to}));
const layoutStart=performance.now();
const nodes=initialLayout(view.nodes.map(entity=>({id:entity.id,position:{x:0,y:0},measured:{width:300,height:90},...(()=>{const parent=view.nodes.find(n=>n.nodes?.some(child=>child.id===entity.id));return parent?{parentId:parent.id}:{};})()})),links,'pr25',readingBands(view.entities,relations),{},filePaths(view.entities),documentPaths(view.entities));
const sizes=Object.fromEntries(links.map(edge=>[edge.id,{width:240,height:75}]));
const placements=automaticRoutes(nodes,links,sizes,{});
const layoutRoutingMs=performance.now()-layoutStart;
const real=benchmark(sceneGeometry({comparison:state.comparisonId,revision:1},nodes,links.map(edge=>({...edge,routed:placements.get(edge.id)!})),sizes));
console.log(JSON.stringify({note:'Node timings descriptive. Synthetic separated-scene operation counts are regression acceptance. Real corpus uses fixed synthetic dimensions, NOT DOM measurements; no device/FPS/memory claim. Canonical JSON still fully downloaded/parsed; all node wrappers/ports retained.',projection:{coldProjectionMs,allSourceReadingDemandMs,sourceRows,entities:view.entities.length,nodes:view.nodes.length,relations:view.relations.length,ms},workloads,real:{...real,layoutRoutingMs,dimensionBasis:'300x90 nodes, 240x75 labels, unchanged layout/routing algorithms'}},null,2));
