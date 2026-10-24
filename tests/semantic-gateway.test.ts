import {test} from "node:test";
import assert from "node:assert/strict";
import {semanticFixture,eventually} from "./semantic-fixture.ts";
import {createGateway} from "../src/server/public.ts";
import type {AnalysisView} from "../src/domain/public.ts";
test("actual gateway analysis ports stay responsive, enforce user locator authority and tear down routes",async()=>{
 const f=semanticFixture();let notifications=0;const gateway=createGateway(f.store,async()=>{notifications++;return {state:"unknown",reason:"controlled"};}),port=await gateway.listen(0);
 const call=async(path:string,body?:unknown,token=f.token)=>{const response=await fetch(`http://127.0.0.1:${port}${path}`,{headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},...(body?{method:"POST",body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json() as Record<string,unknown>};};
 const query=()=>f.store.analysis.query(f.token,{reviewId:"r",snapshotId:f.snapshot.snapshotId});
 try{
  const bootstrap=f.store.registerConnection({kind:"user",actorId:"local-user"},{host:"codex",sessionId:"semantic-test",connectionId:"semantic-connection",corroborated:true});
  assert.equal((await call(`/api/analysis?reviewId=r&snapshotId=${f.snapshot.snapshotId}`,undefined,bootstrap.token)).status,401);
  const challenge=f.store.challenge({kind:"user",actorId:"local-user"},"r","codex","semantic-test","semantic-connection"),agent=f.store.attach(f.store.authenticate(bootstrap.token),challenge.challengeId,challenge.proof);
  assert.equal((await call("/api/analysis/commands",f.request,agent.token)).status,401);
  const requested=await call("/api/analysis/commands",f.request);assert.equal(requested.body.state,"applied");await eventually(()=>query().jobs[0]?.state==="context_running"||query().jobs[0]?.state==="inventory_running");
  const question=await call("/api/commands",{type:"AskQuestion",commandId:"during-work",reviewId:"r",anchor:{snapshotId:f.snapshot.snapshotId,side:"head",path:"callee.ts",startLine:1,endLine:1},text:"Question remains usable during context/worker activity"});assert.equal(question.body.state,"applied");
  await eventually(()=>query().jobs[0]?.state==="awaiting_declarations");
  const choosing=query(),inventory=choosing.preparation?.inventory;assert.equal(inventory?.status,"available");if(inventory?.status!=="available")return;
  const job=choosing.jobs[0]!;assert.equal((await call("/api/analysis/commands",{type:"SelectAnalysisDeclarations",commandId:"select-http",jobId:job.jobId,expectedJobRevision:job.jobRevision,corpusId:job.corpusId,inventoryId:job.inventoryId,declarationIds:[inventory.declarations.find(item=>item.name==="callee"&&item.declaration.side==="head")!.id]})).body.state,"applied");await eventually(()=>query().jobs[0]?.state==="admitted");
  const admitted=query(),analysis=admitted.analysis;assert.equal(analysis?.status,"analyzed");if(analysis?.status!=="analyzed")return;
  const primary=analysis.nodes.find(node=>node.name==="callee")!.declaration,clarify={type:"PutGraphClarification",commandId:"agent-clarification",reviewId:"r",snapshotId:f.snapshot.snapshotId,analysisId:analysis.analysisId,expectedGraphRevision:admitted.graphRevision,text:"Attributed interpretation, requiring runtime evidence.",kind:"interpretation",primary,evidence:[]};
  assert.equal((await call("/api/analysis/commands",clarify,agent.token)).body.state,"applied");
  const author=query().clarifications[0]!.authorId,clarificationId=query().clarifications[0]!.clarificationId,corrected=await call("/api/analysis/commands",{...clarify,commandId:"user-correction",clarificationId,expectedGraphRevision:query().graphRevision,kind:"correction",text:"User correction preserves the original author history."});assert.equal(corrected.body.state,"applied");assert.equal(query().clarifications[0]!.authorId,author);assert.equal(query().clarifications[0]!.history.length,2);
  f.store.command({kind:"user",actorId:"local-user"},{type:"RevokeAttachment",commandId:"revoke",reviewId:"r",attachmentId:agent.attachment.attachmentId});
  const replay=await call("/api/analysis/commands",clarify,agent.token);assert.equal(replay.status,400);assert.equal(replay.body.error,"stale_attachment");assert.equal((await call(`/api/analysis?reviewId=r&snapshotId=${f.snapshot.snapshotId}`,undefined,agent.token)).body.error,"stale_attachment");
  const source=admitted.corpus!.sources.find(item=>item.path==="caller.ts")!;const opened=await call("/api/analysis/source",{reviewId:"r",snapshotId:f.snapshot.snapshotId,corpusId:admitted.corpus!.corpusId,side:source.side,path:source.path,contentHash:source.contentHash});assert.match(String(opened.body.content),/callee/);assert.equal((await call(`/api/analysis?reviewId=r&snapshotId=${f.snapshot.snapshotId}&minimumGraphRevision=999`)).body.error,"revision_unavailable");
  // The only notification opportunity was the explicitly addressed question, not analysis/clarification completion.
  assert.ok(notifications<=1);
 }finally{await gateway.close();assert.deepEqual(gateway.analysisDiagnostics(),[]);f.cleanup();}
});
