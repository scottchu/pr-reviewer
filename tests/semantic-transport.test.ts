import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {runAnalysisWorker} from "../src/analysis-jobs/public.ts";
import type {WorkerRequest} from "../src/analysis-jobs/public.ts";
import type {DeclarationInventoryInput} from "../src/source-analysis/public.ts";
const content="export const answer=()=>1;\n",commit="a".repeat(40);
const input:DeclarationInventoryInput={contract:"source-neighborhood-v1",snapshotId:"transport-fixture",change:{repository:"owner/repo",provider:"github",changeId:"1"},commits:{base:commit,head:commit},corpus:{base:{commit,inventory:"selected-context",acquisition:"controlled-transport"},head:{commit,inventory:"selected-context",acquisition:"controlled-transport"}},sources:[{side:"head",path:"answer.ts",commit,role:"changed",selected:true,source:{content,contentHash:createHash("sha256").update(content).digest("hex")}}],profile:{name:"repository-static-v1"},budgets:{inventoryPathsPerSide:4096,inventoryBytes:2097152,filesPerSide:128,fileBytes:262144,totalBytes:4194304,seeds:64,astNodes:200000,invocationSites:10000,outputNodes:2000,outputSites:4000,aliasPatterns:32,aliasTargets:4,reExportLinks:32}};
const request:WorkerRequest={protocol:"analysis-worker-v1",invocationId:"transport-boundary",phase:"inventory",input};
const observations=()=>({recordProcess:()=>{},cancelled:()=>false});
test("production32MiB encoded input cap rejects before spawn without raising source/metadata budgets",async()=>{
 const sources=Array.from({length:8192},(_,index)=>({side:"head" as const,path:`${"\u0001".repeat(900)}${index}.ts`,commit,role:"context" as const,selected:false,exclusion:"excluded" as const}));const oversized={...request,input:{...input,sources}};assert.ok(Buffer.byteLength(JSON.stringify(oversized),"utf8")>32*1024*1024);let observations=0;
 await assert.rejects(runAnalysisWorker(oversized,{recordProcess:()=>{observations++;},cancelled:()=>false}),/analysis_worker_input_limit/);assert.equal(observations,0);assert.equal(oversized.input.budgets.inventoryBytes,2097152);assert.equal(oversized.input.budgets.totalBytes,4194304);
});
test("production16MiB output accepts exact framed bytes and rejects one byte over with confirmed owned exit",async()=>{
 const root=mkdtempSync(join(tmpdir(),"pr-reviewer-semantic-transport-"));try{
  const normal=await runAnalysisWorker(request,observations());assert.equal(normal.envelope.result.status,"available");
  for(const bytes of [16*1024*1024,16*1024*1024+1]){
   const path=join(root,`writer-${bytes}.mjs`);writeFileSync(path,`process.stdin.resume();process.stdin.once('end',()=>{const encoded=Buffer.from(${JSON.stringify(JSON.stringify(normal.envelope))});const body=Buffer.alloc(${bytes},32);encoded.copy(body);const header=Buffer.alloc(4);header.writeUInt32BE(body.length);process.stdout.write(Buffer.concat([header,body]));});`,{mode:0o600});
   const rows:{state:string;reason?:string}[]=[];const result=runAnalysisWorker(request,{recordProcess:row=>rows.push(row),cancelled:()=>false},{entryPath:path});
   if(bytes===16*1024*1024){assert.deepEqual((await result).envelope,normal.envelope);}else await assert.rejects(result,/analysis_worker_output_limit/);
   assert.equal(rows.at(-1)?.state,"exited");assert.notEqual(rows.at(-1)?.reason,"termination_unknown");
  }
 }finally{rmSync(root,{recursive:true,force:true});}
});
