import { createHash } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/storage/public.ts";
import { createGateway } from "../src/server/public.ts";
test("authenticated HTTP owner/bootstrap/agent boundary and managed shutdown", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pr-reviewer-http-"));
  const store = createStore(join(dir, "db"));
  store.prepare("r", {
    snapshotId: "s",
    repository: "r",
    prUrl: "url",
    prNumber: 14,
    baseSha: "a",
    headSha: "b",
    sources: [],
  });
  const token = store.issueUser();
  const gateway = createGateway(store, async () => ({
    state: "unknown",
    reason: "test",
  }));
  const port = await gateway.listen(0);
  const call = async (path: string, bearer = token, body?: unknown) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    return {
      status: response.status,
      body: (await response.json()) as Record<string, unknown>,
    };
  };
  try {
    assert.equal((await call("/api/reviews", "wrong")).status, 401);
    const connection = await call("/api/connections", token, {
      host: "codex",
      sessionId: "exact",
      connectionId: "launch",
      corroborated: true,
    });
    const bootstrap = String(connection.body.token);
    assert.equal((await call("/api/reviews/r", bootstrap)).status, 401);
    const c = await call("/api/challenges", token, {
      reviewId: "r",
      host: "codex",
      sessionId: "exact",
      connectionId: "launch",
    });
    const attached = await call("/api/session-attach", bootstrap, {
      challengeId: c.body.challengeId,
      proof: c.body.proof,
    });
    assert.equal(attached.status, 200);
    assert.equal(
      (await call("/api/reviews/r", String(attached.body.token))).status,
      200,
    );
    assert.equal(
      (await call("/api/inbox?limit=1000", String(attached.body.token))).status,
      400,
    );
  } finally {
    await gateway.close();
    assert.deepEqual(gateway.diagnostics(), []);
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('history HTTP admits verified bounded large manifest, rejects oversized encoded request and preserves historical question source',async()=>{
 const {buildSnapshot}=await import('../src/source-preparation/public.ts');const {execFileSync}=await import('node:child_process');const {mkdirSync,writeFileSync}=await import('node:fs');
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-http-history-')),repo=join(root,'source'),previous=process.env.GIT_DIR;mkdirSync(repo);
 const git=(...args:string[])=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git('init','-q');writeFileSync(join(repo,'a.md'),'Old source\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','base');const baseSha=git('rev-parse','HEAD');writeFileSync(join(repo,'a.md'),'new\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','initial');const oldHead=git('rev-parse','HEAD');writeFileSync(join(repo,'a.md'),'x'.repeat(180000)+'\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','large');const headSha=git('rev-parse','HEAD');process.env.GIT_DIR=join(repo,'.git');
 const spec={prNumber:21,prUrl:'https://github.com/scottchu/pr-reviewer/pull/21',baseSha,path:'a.md'},old=buildSnapshot({...spec,headSha:oldHead}),next=buildSnapshot({...spec,headSha}),store=createStore(join(root,'db'));store.prepare('r',old);const owner={kind:'user' as const,actorId:'local-user'},token=store.issueUser(),question=store.command(owner,{type:'AskQuestion',commandId:'http-old-q',reviewId:'r',text:'Old source?',anchor:{snapshotId:old.snapshotId,path:'a.md',side:'head',startLine:1,endLine:1}});const gateway=createGateway(store,async()=>({state:'unknown',reason:'controlled'})),port=await gateway.listen(0);
 const request=async(path:string,body?:unknown)=>{const response=await fetch(`http://127.0.0.1:${port}${path}`,{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{method:'POST',body:JSON.stringify(body)}:{})});return{status:response.status,body:await response.json() as Record<string,unknown>};};
 try{
 const add={type:'AddSnapshot',identityScheme:'manual_git_v1',commandId:'http-new',reviewId:'r',expectedCurrentSnapshotId:old.snapshotId,snapshot:next};const admitted=await request('/api/commands',add);assert.equal(admitted.body.state,'applied');assert.equal((await request(`/api/reviews/r?snapshotId=${old.snapshotId}`)).status,200);const read=await request(`/api/questions/${String(question.result.questionId)}?reviewId=r`);assert.equal((read.body.snapshot as {snapshotId:string}).snapshotId,old.snapshotId);
 const oversized=await request('/api/commands',{...add,commandId:'too-big',snapshot:{...next,sources:[{...next.sources[0],content:'x'.repeat(8*1024*1024)}]}});assert.equal(oversized.status,400);assert.equal(oversized.body.error,'invalid_request');assert.equal(store.review(owner,'r').currentSnapshotId,next.snapshotId);assert.equal(store.review(owner,'r').snapshotSummaries?.length,2);
 }finally{await gateway.close();store.close();if(previous===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=previous;rmSync(root,{recursive:true,force:true});}
});
