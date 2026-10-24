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
  await older;assert.equal(bridge.getSnapshot().selecting,true,'older completion cannot release the newest read');pending.get('newest')!.resolve(Response.json(projection('newest')));await latest;
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
  await older;pending.get('newest')!.resolve(Response.json({error:'source_unavailable'},{status:404}));assert.match(String(await latest),/source_unavailable/);assert.equal(bridge.getSnapshot().selecting,false);
  defer=false;const dispose=bridge.connect();await new Promise(resolve=>setTimeout(resolve,10));dispose();
  assert.equal(requests.at(-1),'s');assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'s');
 }finally{globalThis.fetch=original;}
});

test('periodic polling cannot abort or replace an explicit slow history selection',async()=>{
 const original=globalThis.fetch;let targetReads=0,complete:((response:Response)=>void)|undefined;
 const requests:string[]=[];
 globalThis.fetch=(async(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>{
  const id=new URL(String(input),'http://localhost').searchParams.get('snapshotId')??'s';requests.push(id);
  if(id==='newest'&&++targetReads===1)return new Promise<Response>((resolve,reject)=>{complete=resolve;init?.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
  return Response.json({...review,snapshot:{...review.snapshot,snapshotId:id},currentSnapshotId:'newest'});
 }) as typeof fetch;
 let dispose:(()=>void)|undefined;
 try{
  const bridge=createReviewBridge('r');await bridge.login('token');dispose=bridge.connect();
  const choice=bridge.selectSnapshot('newest').then(()=>null,error=>error);
  assert.equal(bridge.getSnapshot().selecting,true);await assert.rejects(bridge.ask(anchor,'Cannot compose against an unresolved selection'),/selection_in_progress/);
  await new Promise(resolve=>setTimeout(resolve,800));complete!(Response.json({...review,snapshot:{...review.snapshot,snapshotId:'newest'},currentSnapshotId:'newest'}));
  assert.equal(await choice,null,'a polling interval must not turn a successful explicit read into source_unavailable');
  assert.equal(bridge.getSnapshot().selecting,false);
  assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'newest');
  await new Promise(resolve=>setTimeout(resolve,750));assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'newest');assert.equal(requests.at(-1),'newest');
 }finally{dispose?.();globalThis.fetch=original;}
});

test('disposing an in-flight source choice releases loading and remount observes the last displayed source',async()=>{
 const original=globalThis.fetch;const requests:string[]=[];
 globalThis.fetch=(async(input:Parameters<typeof fetch>[0],init?:Parameters<typeof fetch>[1])=>{
  const id=new URL(String(input),'http://localhost').searchParams.get('snapshotId')??'s';requests.push(id);
  if(id==='newest')return new Promise<Response>((_resolve,reject)=>{init?.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
  return Response.json(review);
 }) as typeof fetch;
 try{const bridge=createReviewBridge('r');await bridge.login('token');const dispose=bridge.connect();const choice=bridge.selectSnapshot('newest').then(()=>null,error=>error);dispose();assert.match(String(await choice),/selection_superseded/);assert.equal(bridge.getSnapshot().selecting,false);const remount=bridge.connect();await new Promise(resolve=>setTimeout(resolve,10));remount();assert.equal(requests.at(-1),'s');assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId,'s');}finally{globalThis.fetch=original;}
});

// Derives from presentation.md: foreground read ownership is separate from route timing.
for (const emission of ['connection', 'interval'] as const) {
  test(`background ${emission} preserves the explicit login result used by an imported-review handoff`, async (context) => {
    const original = globalThis.fetch;
    context.mock.timers.enable({ apis: ['setInterval'] });
    let reads = 0, complete!: (response: Response) => void;
    let loginSignal: AbortSignal | null | undefined;
    globalThis.fetch = (async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      if (++reads !== 1) return Response.json(review);
      loginSignal = init?.signal;
      return new Promise<Response>((resolve, reject) => {
        complete = resolve;
        loginSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      });
    }) as typeof fetch;
    const bridge = createReviewBridge('r');
    let dispose: (() => void) | undefined;
    try {
      if (emission === 'interval') dispose = bridge.connect();
      const login = bridge.login('user-token');
      if (emission === 'connection') dispose = bridge.connect();
      context.mock.timers.tick(1400);
      assert.equal(reads, 1, 'background emissions cannot start another read while login owns its request');
      assert.equal(loginSignal?.aborted, false);
      complete(Response.json(review));
      await login;
      assert.equal(bridge.getSnapshot().authenticated, true);
      assert.equal(bridge.getSnapshot().review?.snapshot.snapshotId, 's', 'login continuation can initialize the exact semantic scope');
      context.mock.timers.tick(700);
      assert.equal(reads, 2, 'polling resumes after the foreground request settles');
    } finally {
      dispose?.();
      assert.equal(bridge.diagnostics().length, 0);
      context.mock.timers.reset();
      globalThis.fetch = original;
    }
  });
}

test('background intervals preserve one slow background projection instead of repeatedly aborting it', async (context) => {
  const original = globalThis.fetch;
  context.mock.timers.enable({ apis: ['setInterval'] });
  let reads = 0, complete!: (response: Response) => void;
  let heldSignal: AbortSignal | null | undefined;
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    if (++reads === 1) return Response.json(review);
    heldSignal = init?.signal;
    return new Promise<Response>((resolve, reject) => {
      complete = resolve;
      heldSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  }) as typeof fetch;
  const bridge = createReviewBridge('r');
  let dispose: (() => void) | undefined;
  try {
    await bridge.login('user-token');
    dispose = bridge.connect();
    context.mock.timers.tick(2100);
    assert.equal(reads, 2);
    assert.equal(heldSignal?.aborted, false);
    const committed = new Promise<void>(resolve => {
      const unsubscribe = bridge.subscribe(() => {
        if (bridge.getSnapshot().review?.revision === 2) { unsubscribe(); resolve(); }
      });
    });
    complete(Response.json({ ...review, revision: 2 }));
    await committed;
    assert.equal(bridge.getSnapshot().review?.revision, 2);
  } finally {
    dispose?.();
    assert.equal(bridge.diagnostics().length, 0);
    context.mock.timers.reset();
    globalThis.fetch = original;
  }
});

test('background connection and timer preserve authoritative revocation receipt readback', async (context) => {
  const original = globalThis.fetch;
  context.mock.timers.enable({ apis: ['setInterval'] });
  const attachment = { attachmentId: 'a', actorId: 'agent', host: 'codex' as const, sessionId: 'session', connectionId: 'connection', generation: 1, active: true };
  let reads = 0, complete!: (response: Response) => void;
  let heldSignal: AbortSignal | null | undefined;
  let markRead!: () => void;
  const reading = new Promise<void>(resolve => { markRead = resolve; });
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    if (init?.method === 'POST') return Response.json({ state: 'applied', revision: 2 });
    if (++reads === 1) return Response.json({ ...review, attachment });
    heldSignal = init?.signal;
    markRead();
    return new Promise<Response>((resolve, reject) => {
      complete = resolve;
      heldSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  }) as typeof fetch;
  const bridge = createReviewBridge('r');
  let dispose: (() => void) | undefined;
  try {
    await bridge.login('user-token');
    const revoking = bridge.revoke();
    await reading;
    dispose = bridge.connect();
    context.mock.timers.tick(1400);
    assert.equal(reads, 2, 'receipt readback remains the only active projection');
    assert.equal(heldSignal?.aborted, false);
    complete(Response.json({ ...review, revision: 2, attachment: { ...attachment, active: false } }));
    await revoking;
    assert.equal(bridge.getSnapshot().review?.revision, 2);
    assert.equal(bridge.getSnapshot().review?.attachment?.active, false);
  } finally {
    dispose?.();
    assert.equal(bridge.diagnostics().length, 0);
    context.mock.timers.reset();
    globalThis.fetch = original;
  }
});

for (const obsoleteCompletion of ['before-new-read', 'after-new-read', 'failure-before-new-read'] as const) {
  test(`disposed ignored-abort read settles ${obsoleteCompletion} without owning the reconnected lifetime`, async (context) => {
    const original = globalThis.fetch;
    context.mock.timers.enable({ apis: ['setInterval'] });
    const calls: { signal: AbortSignal | null | undefined; credential: string; resolve: (value: Response) => void; reject: (error: Error) => void }[] = [];
    globalThis.fetch = ((_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => new Promise<Response>((resolve, reject) => {
      // Deliberately ignore abort: cancellation is not evidence that an obsolete transport settled.
      calls.push({ signal: init?.signal, credential: new Headers(init?.headers).get('Authorization') ?? '', resolve, reject });
    })) as typeof fetch;
    const bridge = createReviewBridge('r');
    let dispose: (() => void) | undefined;
    const flush = () => new Promise<void>(resolve => setImmediate(resolve));
    try {
      const initialLogin = bridge.login('old-credential');
      calls[0]!.resolve(Response.json(review));
      await initialLogin;
      dispose = bridge.connect();
      assert.equal(calls.length, 2);
      const obsolete = calls[1]!;
      dispose();
      assert.equal(obsolete.signal?.aborted, true);
      assert.equal(bridge.diagnostics().length, 0);
      dispose = bridge.connect();
      assert.equal(calls.length, 3, 'reconnect cannot wait for a canceled transport to settle');
      const fresh = bridge.login('fresh-credential');
      assert.equal(calls.length, 4, 'explicit credential intent supersedes the new background read');
      assert.equal(calls[2]!.signal?.aborted, true);
      assert.equal(calls[3]!.credential, 'Bearer fresh-credential');
      const settleObsolete = async () => {
        if (obsoleteCompletion === 'failure-before-new-read') obsolete.reject(new Error('obsolete transport failed'));
        else obsolete.resolve(Response.json({ ...review, revision: 99 }));
        // The reconnect read is also obsolete after the explicit credential intent.
        calls[2]!.resolve(Response.json({ ...review, revision: 88 }));
        await flush();
      };
      if (obsoleteCompletion !== 'after-new-read') {
        await settleObsolete();
        assert.equal(bridge.getSnapshot().review?.revision, 1);
        assert.equal(bridge.getSnapshot().error, '');
      }
      context.mock.timers.tick(2100);
      assert.equal(calls.length, 4, 'old finally cannot clear the active fresh-credential read slot');
      assert.equal(calls[3]!.signal?.aborted, false);
      calls[3]!.resolve(Response.json({ ...review, revision: 5 }));
      await fresh;
      if (obsoleteCompletion === 'after-new-read') await settleObsolete();
      assert.equal(bridge.getSnapshot().review?.revision, 5, 'obsolete success cannot replace the new authorized projection');
      assert.equal(bridge.getSnapshot().error, '');
      context.mock.timers.tick(700);
      assert.equal(calls.length, 5, 'a settled fresh request permits polling again');
    } finally {
      dispose?.();
      assert.equal(bridge.diagnostics().length, 0);
      context.mock.timers.reset();
      globalThis.fetch = original;
    }
  });
}
