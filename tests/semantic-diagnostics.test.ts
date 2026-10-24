import {test} from "node:test";
import assert from "node:assert/strict";
import {semanticFixture,eventually} from "./semantic-fixture.ts";
import {createAnalysisRunner} from "../src/analysis-jobs/public.ts";
import {createStore} from "../src/storage/public.ts";
test("owner diagnostics distinguish route publication counts from committed revisions without source or secrets",async()=>{
 const f=semanticFixture(),runner=createAnalysisRunner(f.store);try{
  f.store.analysis.command(f.token,f.request);runner.wake();await eventually(()=>f.store.analysis.query(f.token,{reviewId:"r",snapshotId:f.snapshot.snapshotId}).jobs[0]?.state==="awaiting_declarations");
  const before=runner.diagnostics() as unknown as {id:string;cursor:number;cursorMeaning:string;disposition:string;failure:string|null;jobs:{reviewId:string;snapshotId:string;jobId:string;invocationId:string|null;analysisGeneration:number;jobRevision:number;graphRevision:number;phase:string;state:string;reason:string|null}[]}[];
  assert.ok(before.length>0);for(const route of before){assert.equal(route.cursorMeaning,"route_publications");assert.equal(route.disposition,"active");assert.equal(route.failure,null);assert.equal(route.jobs.length,1);assert.equal(route.jobs[0]!.state,"awaiting_declarations");assert.equal(route.jobs[0]!.analysisGeneration,1);assert.equal(route.jobs[0]!.graphRevision,0);assert.ok(route.jobs[0]!.jobRevision>1);assert.ok(route.jobs[0]!.invocationId);}
  const oldRevision=before[0]!.jobs[0]!.jobRevision,oldCursor=before.find(route=>route.id==="analysis-request-committed-to-owner")!.cursor;runner.wake();await runner.idle();const after=runner.diagnostics() as typeof before;assert.equal(after[0]!.jobs[0]!.jobRevision,oldRevision);assert.ok(after.find(route=>route.id==="analysis-request-committed-to-owner")!.cursor>oldCursor);
  const encoded=JSON.stringify(after);assert.equal(encoded.includes(f.root),false);assert.equal(encoded.includes(f.token),false);assert.equal(encoded.includes("credentialReference"),false);assert.equal(encoded.includes("export const"),false);
 }finally{await runner.stop();assert.deepEqual(runner.diagnostics(),[]);f.cleanup();}
});
test("fenced diagnostics retain bounded last-known context and a sanitized failure without old-owner reads",async()=>{
 const f=semanticFixture(),runner=createAnalysisRunner(f.store);let replacement:ReturnType<typeof createStore>|undefined;try{
  f.store.analysis.command(f.token,f.request);runner.wake();await eventually(()=>f.store.analysis.query(f.token,{reviewId:"r",snapshotId:f.snapshot.snapshotId}).jobs[0]?.state==="awaiting_declarations");const before=runner.diagnostics() as unknown as {jobs:{jobId:string;jobRevision:number}[]}[];assert.ok(before[0]?.jobs[0]);replacement=createStore(f.filename);
  const fenced=runner.diagnostics() as unknown as {disposition:string;failure:string;jobs:{jobId:string;jobRevision:number}[]}[];assert.ok(fenced.length>0);assert.equal(fenced[0]!.disposition,"fenced");assert.equal(fenced[0]!.failure,"stale_execution_owner");assert.deepEqual(fenced[0]!.jobs,before[0]!.jobs);assert.deepEqual((runner.diagnostics() as typeof fenced).map(({disposition,failure,jobs})=>({disposition,failure,jobs})),fenced.map(({disposition,failure,jobs})=>({disposition,failure,jobs})));
 }finally{await runner.stop();replacement?.close();f.cleanup();}
});

test("owner diagnostic projection keeps current uncertain effect plus latest queued job bounded and sanitized",()=>{
 const f=semanticFixture();try{
  f.store.analysis.command(f.token,f.request);const owner=f.store.analysis.beginOwner(),claim=f.store.analysis.claim(owner)!;f.store.analysis.fail(claim.grant,"private_source_identifier",false);f.store.analysis.command(f.token,{...f.request,commandId:"new-generation",expectedAnalysisGeneration:1});const rows=f.store.analysis.diagnostics(owner);assert.equal(rows.length,2);assert.equal(rows[0]!.state,"unknown");assert.equal(rows[0]!.reason,"analysis_failed");assert.equal(rows[1]!.state,"context_queued");assert.equal(rows[1]!.analysisGeneration,2);assert.equal(JSON.stringify(rows).includes(f.root),false);assert.equal(JSON.stringify(rows).includes("export const"),false);
 }finally{f.cleanup();}
});

for(const marker of ["private_source_identifier","analysis_worker_private_identifier"])test(`arbitrary identifier-like owner errors are sanitized in route failures: ${marker}`,async()=>{
 const f=semanticFixture(),runner=createAnalysisRunner(f.store);try{f.store.analysis.claim=()=>{throw new Error(marker);};runner.wake();await runner.idle().catch(()=>{});const diagnostics=runner.diagnostics();assert.ok(diagnostics.length);assert.equal(diagnostics[0]!.failure,"analysis_failed");assert.equal(JSON.stringify(diagnostics).includes(marker),false);}finally{await runner.stop();f.cleanup();}
});
