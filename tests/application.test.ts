import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createReviewBridge,
  questionStatus,
} from "../src/application/public.ts";
import type { Review, Anchor } from "../src/domain/public.ts";
const review: Review = {
  reviewId: "r",
  snapshot: {
    snapshotId: "s",
    repository: "r",
    prUrl: "url",
    prNumber: 14,
    baseSha: "a",
    headSha: "b",
    sources: [
      { side: "base", path: "d", content: "before", lineCount: 1, hash: "h" },
      { side: "head", path: "d", content: "after", lineCount: 1, hash: "h" },
    ],
  },
  revision: 1,
  attachment: null,
  questions: [],
  replies: [],
  inbox: [],
  attempts: [],
};
const anchor: Anchor = {
  snapshotId: "s",
  side: "head",
  path: "d",
  startLine: 1,
  endLine: 1,
};
test("application preserves unknown command identity, reads accepted revision and disposes/remounts routes", async () => {
  const original = globalThis.fetch;
  let failures = 1;
  const ids: string[] = [];
  globalThis.fetch = (async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    if (init?.method === "POST") {
      const command = JSON.parse(String(init.body)) as { commandId: string };
      ids.push(command.commandId);
      if (failures-- > 0) throw new Error("lost_ack");
      return Response.json({
        commandId: command.commandId,
        state: "applied",
        revision: 1,
        result: {},
      });
    }
    return Response.json(review);
  }) as typeof fetch;
  try {
    const bridge = createReviewBridge("r");
    let updates = 0;
    const unsubscribe = bridge.subscribe(() => updates++);
    await bridge.login("user-token");
    assert.equal(bridge.getSnapshot().authenticated, true);
    await assert.rejects(bridge.ask(anchor, "Question"), /lost_ack/);
    await assert.rejects(bridge.ask(anchor, "Changed"), /submission_unknown/);
    await bridge.ask(anchor, "Question");
    assert.equal(ids.length, 2);
    assert.equal(ids[0], ids[1]);
    const dispose = bridge.connect();
    assert.equal(bridge.diagnostics().length, 1);
    assert.throws(() => bridge.connect(), /duplicate_route/);
    dispose();
    assert.equal(bridge.diagnostics().length, 0);
    const second = bridge.connect();
    second();
    unsubscribe();
    assert.ok(updates > 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("presentation separates answered/read state from unknown notification history", () => {
  const r: Review = {
    ...review,
    questions: [
      {
        questionId: "q",
        anchor,
        text: "Q",
        actorId: "u",
        revision: 1,
        createdAt: "now",
        working: false,
      },
    ],
    inbox: [
      {
        questionId: "q",
        eventId: "e",
        attachmentId: "a",
        generation: 1,
        cursor: 1,
        read: false,
      },
    ],
    attempts: [
      {
        invocationId: "i",
        attachmentId: "a",
        generation: 1,
        eventIds: ["e"],
        state: "unknown",
        reason: "lost",
      },
    ],
  };
  assert.equal(questionStatus(r, "q"), "Delivery unknown");
  assert.equal(
    questionStatus(
      { ...r, questions: r.questions.map((q) => ({ ...q, working: true })) },
      "q",
    ),
    "Working",
  );
  assert.equal(
    questionStatus(
      {
        ...r,
        replies: [
          {
            replyId: "reply",
            questionId: "q",
            body: "A",
            evidence: [anchor],
            limitations: "doc",
            actorId: "agent",
            attachmentId: "a",
            generation: 1,
            revision: 2,
          },
        ],
      },
      "q",
    ),
    "Answered",
  );
  assert.equal(r.attempts[0]?.state, "unknown");
});

test("definitive HTTP rejection allows corrected submission; pending readback retains retry", async () => {
  const original = globalThis.fetch;
  let reject = true,
    blockReadback = false;
  const ids: string[] = [];
  globalThis.fetch = (async (
    _input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1],
  ) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { commandId: string };
      ids.push(body.commandId);
      if (reject) {
        reject = false;
        return Response.json({ error: "invalid_request" }, { status: 400 });
      }
      return Response.json({
        commandId: body.commandId,
        state: "applied",
        revision: 2,
        result: {},
      });
    }
    if (blockReadback)
      return Response.json({ error: "projection_pending" }, { status: 409 });
    return Response.json({ ...review, revision: 2 });
  }) as typeof fetch;
  try {
    const bridge = createReviewBridge("r");
    await bridge.login("token");
    await assert.rejects(
      bridge.ask(anchor, "Invalid envelope"),
      /invalid_request/,
    );
    await bridge.ask(anchor, "Corrected");
    assert.notEqual(ids[0], ids[1]);
    blockReadback = true;
    await assert.rejects(
      bridge.ask(anchor, "Wait for accepted readback"),
      /readback_pending/,
    );
    blockReadback = false;
    await bridge.ask(anchor, "Wait for accepted readback");
    assert.equal(ids[2], ids[3]);
  } finally {
    globalThis.fetch = original;
  }
});

test('history selection remains pinned through new current and unresolved submissions block source switching',async()=>{
 const original=globalThis.fetch;let current='s',lost=false;const requested:string[]=[];
 globalThis.fetch=(async(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>{
  if(init?.method==='POST'){if(lost)throw new Error('lost_ack');return Response.json({state:'applied',revision:1});}
  const url=new URL(String(input),'http://localhost');requested.push(url.searchParams.get('snapshotId')??'default');const id=url.searchParams.get('snapshotId')??current;
  return Response.json({...review,snapshot:{...review.snapshot,snapshotId:id},currentSnapshotId:current,snapshotSummaries:[{snapshotId:'s',baseSha:'a',headSha:'b'},{snapshotId:'new',baseSha:'a',headSha:'c'}]});
 }) as typeof fetch;
 try{const bridge=createReviewBridge('r');await bridge.login('token');current='new';const dispose=bridge.connect();await new Promise(resolve=>setTimeout(resolve,10));dispose();assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'s');assert.equal(bridge.getSnapshot().review?.currentSnapshotId,'new');await bridge.selectSnapshot('new');assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'new');lost=true;await assert.rejects(bridge.ask({...anchor,snapshotId:'new'},'Held'),/lost_ack/);await assert.rejects(bridge.selectSnapshot('s'),/submission_pending/);assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'new');assert.ok(requested.includes('s'));}finally{globalThis.fetch=original;}
});

test('superseded history choices cannot roll back a newer displayed selection or later poll',async()=>{
 const original=globalThis.fetch;
 const pending=new Map<string,{resolve:(response:Response)=>void}>();let defer=true;
 const requests:string[]=[];
 const projection=(snapshotId:string)=>({...review,snapshot:{...review.snapshot,snapshotId},currentSnapshotId:'newest'});
 globalThis.fetch=(async(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>{
  const id=new URL(String(input),'http://localhost').searchParams.get('snapshotId')??'s';requests.push(id);
  if(!defer||id==='s')return Response.json(projection(id));
  return new Promise<Response>((resolve,reject)=>{pending.set(id,{resolve});init?.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 }) as typeof fetch;
 try{
  const bridge=createReviewBridge('r');await bridge.login('token');
  const older=bridge.selectSnapshot('older').then(()=>null,error=>error);
  const latest=bridge.selectSnapshot('newest');
  await older;pending.get('newest')!.resolve(Response.json(projection('newest')));await latest;
  assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'newest');
  defer=false;const dispose=bridge.connect();await new Promise(resolve=>setTimeout(resolve,10));dispose();
  assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'newest');assert.equal(requests.at(-1),'newest');
 }finally{globalThis.fetch=original;}
});

test('a failed latest history choice restores the displayed snapshot, not a superseded target',async()=>{
 const original=globalThis.fetch;
 const pending=new Map<string,{resolve:(response:Response)=>void}>();let defer=true;
 const requests:string[]=[];
 globalThis.fetch=(async(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>{
  const id=new URL(String(input),'http://localhost').searchParams.get('snapshotId')??'s';requests.push(id);
  if(!defer||id==='s')return Response.json({...review,snapshot:{...review.snapshot,snapshotId:id}});
  return new Promise<Response>((resolve,reject)=>{pending.set(id,{resolve});init?.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 }) as typeof fetch;
 try{
  const bridge=createReviewBridge('r');await bridge.login('token');
  const older=bridge.selectSnapshot('older').then(()=>null,error=>error);
  const latest=bridge.selectSnapshot('newest').then(()=>null,error=>error);
  await older;pending.get('newest')!.resolve(Response.json({error:'source_unavailable'},{status:404}));assert.match(String(await latest),/source_unavailable/);
  defer=false;const dispose=bridge.connect();await new Promise(resolve=>setTimeout(resolve,10));dispose();
  assert.equal(requests.at(-1),'s');assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'s');
 }finally{globalThis.fetch=original;}
});
