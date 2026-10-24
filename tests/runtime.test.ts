import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
test(
  "runtime preparation, owned stop, safe occupied-port failure and native metadata rejection",
  { timeout: 20000 },
  async () => {
    const root = mkdtempSync(join(tmpdir(), "pr-reviewer-runtime-"));
    const other = mkdtempSync(join(tmpdir(), "pr-reviewer-collision-"));
    const env = {
      ...process.env,
      REVIEW_DATA_DIR: root,
      REVIEW_UI_PORT: "5484",
      REVIEW_GATEWAY_PORT: "5485",
    };
    const child = spawn(process.execPath, ["scripts/dev.ts"], {
      env,
      stdio: "ignore",
    });
    try {
      for (let i = 0; i < 100 && !existsSync(join(root, "runtime.json")); i++)
        await delay(100);
      assert.equal(child.exitCode, null);
      const manifest = JSON.parse(
        readFileSync(join(root, "runtime.json"), "utf8"),
      ) as { status: string; pid: number };
      assert.equal(manifest.status, "running");
      assert.equal(manifest.pid, child.pid);
      assert.equal(existsSync(join(root,'local-user.json')),false,'startup does not create a human credential');
      assert.equal('userCredentialRef' in manifest,false);
      assert.equal((await fetch('http://127.0.0.1:5485/api/reviews')).status,200);
      const {get}=await import('node:http');
      const hostStatus=await new Promise<number|undefined>((resolve,reject)=>{get('http://127.0.0.1:5484/',{headers:{Host:'untrusted.example.invalid'}},response=>{response.resume();resolve(response.statusCode);}).on('error',reject);});
      assert.equal(hostStatus,403);
      assert.throws(() =>
        execFileSync(process.execPath, ["scripts/dev.ts"], {
          env: { ...env, REVIEW_DATA_DIR: other },
          stdio: "pipe",
        }),
      );
      assert.equal(child.exitCode, null);
      assert.equal((await fetch("http://127.0.0.1:5485/health")).ok, true);
      const metadata = join(root, "session.jsonl");
      writeFileSync(
        metadata,
        JSON.stringify({
          type: "session_meta",
          payload: {
            id: "actual",
            cwd: process.cwd(),
            originator: "controlled",
          },
        }) + "\n",
      );
      assert.throws(() =>
        execFileSync(process.execPath, ["scripts/pair.ts"], {
          env: {
            ...env,
            CODEX_THREAD_ID: "wrong",
            REVIEW_NATIVE_METADATA_REF: metadata,
            REVIEW_SESSION_CWD: process.cwd(),
          },
          stdio: "pipe",
        }),
      );
      execFileSync(process.execPath, ["scripts/stop.ts"], {
        env,
        stdio: "pipe",
      });
      for (let i = 0; i < 100 && child.exitCode === null; i++) await delay(50);
      assert.equal(child.exitCode, 0);
      const stopped = JSON.parse(
        readFileSync(join(root, "runtime.json"), "utf8"),
      ) as { status: string };
      assert.equal(stopped.status, "stopped");
      assert.ok(existsSync(join(root, "review.sqlite")));
      assert.ok(!existsSync(join(root, "runtime.lock")));
      // Existing legacy credentials are preserved but are no longer a startup prerequisite.
      const legacy='{"token":"retained-legacy-value"}\n';
      writeFileSync(join(root,'local-user.json'),legacy,{mode:0o600});
      const restarted=spawn(process.execPath,['scripts/dev.ts'],{env,stdio:'ignore'});
      try{
        let running=false;
        for(let i=0;i<100;i++){if(restarted.exitCode!==null)break;const current=JSON.parse(readFileSync(join(root,'runtime.json'),'utf8')) as {status:string;pid:number};if(current.status==='running'&&current.pid===restarted.pid){running=true;break;}await delay(50);}
        assert.equal(running,true,'restart must not authenticate the legacy owner credential');
        assert.equal(readFileSync(join(root,'local-user.json'),'utf8'),legacy);
        assert.equal((await fetch('http://127.0.0.1:5485/api/reviews')).status,200);
        execFileSync(process.execPath,['scripts/stop.ts'],{env,stdio:'pipe'});
        for(let i=0;i<100&&restarted.exitCode===null;i++)await delay(25);
        assert.equal(restarted.exitCode,0);
      }finally{if(restarted.exitCode===null)restarted.kill('SIGTERM');}
    } finally {
      if (child.exitCode === null) child.kill("SIGTERM");
      rmSync(root, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  },
);

test("preparation recovers database-commit/export failure and ignores orphan export", async () => {
  const { prepareSource } = await import("../scripts/prepare.ts");
  const { createStore } = await import("../src/storage/public.ts");
  const { mkdirSync } = await import("node:fs");
  const root = mkdtempSync(join(tmpdir(), "pr-reviewer-prepare-crash-"));
  try {
    mkdirSync(join(root, "snapshot.json"));
    assert.throws(() => prepareSource(root));
    const store = createStore(join(root, "review.sqlite"));
    const user = { kind: "user" as const, actorId: "local-user" };
    const before = store.review(user, "pr-14");
    const question = store.command(user, {
      type: "AskQuestion",
      commandId: "retained-question",
      reviewId: "pr-14",
      anchor: {
        snapshotId: before.snapshot.snapshotId,
        side: "head",
        path: "docs/README.md",
        startLine: 5,
        endLine: 13,
      },
      text: "Retain this across export repair",
    });
    assert.equal(question.state, "applied");
    store.close();
    rmSync(join(root, "snapshot.json"), { recursive: true });
    const snapshot = prepareSource(root);
    assert.equal(snapshot.snapshotId, before.snapshot.snapshotId);
    const reopened = createStore(join(root, "review.sqlite"));
    assert.equal(reopened.review(user, "pr-14").questions.length, 1);
    reopened.close();
    const orphan = mkdtempSync(join(tmpdir(), "pr-reviewer-orphan-export-"));
    try {
      writeFileSync(join(orphan, "snapshot.json"), "{}");
      prepareSource(orphan);
      assert.ok(existsSync(join(orphan, "review.sqlite")));
    } finally {
      rmSync(orphan, { recursive: true, force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("explicit owner manual PR19 specification pins one source and survives restart without its env reference", async () => {
  const { prepareSource } = await import("../scripts/prepare.ts");
  const root = mkdtempSync(join(tmpdir(), "pr-reviewer-manual-source-"));
  const previous = process.env.REVIEW_SOURCE_SPEC;
  try {
    const spec = join(root, "owner-selection.json");
    writeFileSync(
      spec,
      JSON.stringify({
        prNumber: 19,
        prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
        title: "Recovery review",
        baseSha: "cf179ac1eeb9073c08e4e82c950cb53bdc681c72",
        headSha: "4dae178a4302bfdd161fca5be78144c63f562c30",
        path: "docs/product/review-loop/contracts.md",
      }),
    );
    process.env.REVIEW_SOURCE_SPEC = spec;
    const snapshot = prepareSource(root);
    assert.equal(snapshot.prNumber, 19);
    assert.equal(
      snapshot.sources[1]?.path,
      "docs/product/review-loop/contracts.md",
    );
    assert.ok(
      snapshot.sources[1]?.content.includes(
        "new generation begins inbox reading at cursor zero",
      ),
    );
    delete process.env.REVIEW_SOURCE_SPEC;
    assert.deepEqual(prepareSource(root), snapshot);
    writeFileSync(
      spec,
      JSON.stringify({
        prNumber: 19,
        prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
        baseSha: "cf179ac1eeb9073c08e4e82c950cb53bdc681c72",
        headSha: "4dae178a4302bfdd161fca5be78144c63f562c30",
        path: "AGENTS.md",
      }),
    );
    process.env.REVIEW_SOURCE_SPEC = spec;
    assert.throws(() => prepareSource(root), /command_conflict/);
  } finally {
    if (previous === undefined) delete process.env.REVIEW_SOURCE_SPEC;
    else process.env.REVIEW_SOURCE_SPEC = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test("manual source rejects directory objects and malformed UTF8 before persistence", async () => {
  const { prepareSource } = await import("../scripts/prepare.ts");
  const { mkdirSync } = await import("node:fs");
  const previousSpec = process.env.REVIEW_SOURCE_SPEC,
    previousGit = process.env.GIT_DIR;
  const root = mkdtempSync(join(tmpdir(), "pr-reviewer-source-rejection-"));
  const fixture = mkdtempSync(join(tmpdir(), "pr-reviewer-invalid-utf8-git-"));
  try {
    const directory = join(root, "tree-case");
    mkdirSync(directory);
    const spec = join(root, "selection.json");
    writeFileSync(
      spec,
      JSON.stringify({
        prNumber: 19,
        prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
        baseSha: "cf179ac1eeb9073c08e4e82c950cb53bdc681c72",
        headSha: "4dae178a4302bfdd161fca5be78144c63f562c30",
        path: "docs/product/review-loop",
      }),
    );
    process.env.REVIEW_SOURCE_SPEC = spec;
    assert.throws(() => prepareSource(directory), /source_unavailable/);
    assert.equal(existsSync(join(directory, "review.sqlite")), false);
    execFileSync("git", ["init", fixture], { stdio: "pipe" });
    writeFileSync(join(fixture, "bad.txt"), Buffer.from([0xc3, 0x28]));
    execFileSync("git", ["-C", fixture, "add", "bad.txt"]);
    execFileSync(
      "git",
      [
        "-C",
        fixture,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-m",
        "Invalid UTF8 fixture",
      ],
      { stdio: "pipe" },
    );
    const sha = execFileSync("git", ["-C", fixture, "rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
    process.env.GIT_DIR = join(fixture, ".git");
    const invalid = join(root, "utf8-case");
    mkdirSync(invalid);
    writeFileSync(
      spec,
      JSON.stringify({
        prNumber: 19,
        prUrl: "https://github.com/scottchu/pr-reviewer/pull/19",
        baseSha: sha,
        headSha: sha,
        path: "bad.txt",
      }),
    );
    assert.throws(() => prepareSource(invalid), /source_unavailable/);
    assert.equal(existsSync(join(invalid, "review.sqlite")), false);
  } finally {
    if (previousSpec === undefined) delete process.env.REVIEW_SOURCE_SPEC;
    else process.env.REVIEW_SOURCE_SPEC = previousSpec;
    if (previousGit === undefined) delete process.env.GIT_DIR;
    else process.env.GIT_DIR = previousGit;
    rmSync(root, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("data root rejects another Git worktree and its metadata before creation", async () => {
  const { dataRoot } = await import("../scripts/local.ts");
  const root = mkdtempSync(join(tmpdir(), "pr-reviewer-foreign-git-"));
  const previous = process.env.REVIEW_DATA_DIR;
  try {
    execFileSync("git", ["init", root], { stdio: "pipe" });
    for (const path of [
      join(root, "runtime-data"),
      join(root, ".git", "runtime-data"),
    ]) {
      process.env.REVIEW_DATA_DIR = path;
      assert.throws(() => dataRoot(), /outside.*Git|Git repository/);
      assert.equal(existsSync(path), false);
    }
  } finally {
    if (previous === undefined) delete process.env.REVIEW_DATA_DIR;
    else process.env.REVIEW_DATA_DIR = previous;
    rmSync(root, { recursive: true, force: true });
  }
});

test('02-G multi-file preparation retains complete PR20 inventory and pinned document references',async()=>{
 const {buildSnapshot}=await import('../scripts/prepare.ts');
 const snapshot=buildSnapshot({prNumber:20,prUrl:'https://github.com/scottchu/pr-reviewer/pull/20',baseSha:'aeadce0ace7f509160d0630ee18c75d74e4537b2',headSha:'df171b2ce8aee0c2e72249fc68138cf2f0e507d6',paths:['docs/product/review-loop/runtime.md','docs/product/review-loop/README.md','docs/plans/480p/slices/01-review-loop/implementation-evidence.md']});
 assert.equal(snapshot.changedFiles?.length,3);
 assert.equal(snapshot.changedFiles?.flatMap(f=>f.dispositions).filter(d=>d.state==='prepared').length,6);
 assert.ok(snapshot.documentReferences?.some(r=>r.target));
 assert.ok(snapshot.documentReferences?.some(r=>r.reason==='external destination'));
 for(const r of snapshot.documentReferences??[]){assert.equal(r.source.snapshotId,snapshot.snapshotId);if(r.target)assert.equal(r.target.snapshotId,snapshot.snapshotId);}
 const partial=buildSnapshot({prNumber:20,prUrl:'https://github.com/scottchu/pr-reviewer/pull/20',baseSha:snapshot.baseSha,headSha:snapshot.headSha,paths:['docs/product/review-loop/runtime.md']});
 assert.equal(partial.changedFiles?.length,3);
 for(const disposition of partial.changedFiles?.flatMap(f=>f.dispositions)??[])assert.equal(disposition.state==='prepared',partial.sources.some(s=>s.path===disposition.path&&s.side===disposition.side));
});

test('multi-file DB-only recovery retains original owner selection and saved question after both export files are absent',async()=>{
 const {prepareSource}=await import('../scripts/prepare.ts');const {createStore}=await import('../src/storage/public.ts');
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-multi-db-recovery-')),previous=process.env.REVIEW_SOURCE_SPEC;
 try{
 const input=join(root,'owner.json');writeFileSync(input,JSON.stringify({prNumber:20,prUrl:'https://github.com/scottchu/pr-reviewer/pull/20',baseSha:'aeadce0ace7f509160d0630ee18c75d74e4537b2',headSha:'df171b2ce8aee0c2e72249fc68138cf2f0e507d6',paths:['docs/product/review-loop/runtime.md']}));process.env.REVIEW_SOURCE_SPEC=input;
 const original=prepareSource(root),owner={kind:'user' as const,actorId:'local-user'};const store=createStore(join(root,'review.sqlite'));
 const source=original.sources.find(s=>s.side==='head')!;store.command(owner,{type:'AskQuestion',commandId:'preserve-multi-question',reviewId:'pr-20',text:'Retain source and question',anchor:{snapshotId:original.snapshotId,side:source.side,path:source.path,startLine:1,endLine:1}});store.close();
 rmSync(join(root,'source-input.json'));rmSync(join(root,'snapshot.json'));delete process.env.REVIEW_SOURCE_SPEC;
 assert.deepEqual(prepareSource(root),original);const reopened=createStore(join(root,'review.sqlite'));assert.equal(reopened.review(owner,'pr-20').questions.length,1);reopened.close();
 // Simulate the pre-correction 02A database, which lacks atomic setup metadata.
 const {DatabaseSync}=await import('node:sqlite');const legacy=new DatabaseSync(join(root,'review.sqlite'));legacy.exec('DELETE FROM preparation_inputs');legacy.close();
 rmSync(join(root,'source-input.json'));rmSync(join(root,'snapshot.json'));assert.deepEqual(prepareSource(root),original);
 }finally{if(previous===undefined)delete process.env.REVIEW_SOURCE_SPEC;else process.env.REVIEW_SOURCE_SPEC=previous;rmSync(root,{recursive:true,force:true});}
});

test('manual source preparation never fetches a missing promisor object or executes configured upload-pack',async()=>{
 const {buildSnapshot}=await import('../scripts/prepare.ts');const root=mkdtempSync(join(tmpdir(),'pr-reviewer-preparation-promisor-')),oldGit=process.env.GIT_DIR;
 const git=(...args:string[])=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
 git('init','-q');writeFileSync(join(root,'a.md'),'# Source\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');const sha=git('rev-parse','HEAD'),blob=git('rev-parse',`${sha}:a.md`);
 const sentinel=join(root,'lazy-fetch-executed'),helper=join(root,'upload-pack-helper');writeFileSync(helper,`#!/bin/sh\nprintf invoked > '${sentinel}'\nexit 1\n`,{mode:0o700});
 git('config','remote.origin.url',root);git('config','remote.origin.promisor','true');git('config','remote.origin.partialclonefilter','blob:none');git('config','remote.origin.uploadpack',helper);
 rmSync(join(root,'.git','objects',blob.slice(0,2),blob.slice(2)));process.env.GIT_DIR=join(root,'.git');
 assert.throws(()=>buildSnapshot({prNumber:21,prUrl:'https://github.com/scottchu/pr-reviewer/pull/21',baseSha:sha,headSha:sha,path:'a.md'}),/source_unavailable/);
 assert.equal(existsSync(sentinel),false,'read-only preparation executed a lazy-fetch helper');
 }finally{if(oldGit===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=oldGit;rmSync(root,{recursive:true,force:true});}
});

test('literal encoded-hash Git target and fenced examples preserve exact document provenance',async()=>{
 const {buildSnapshot}=await import('../scripts/prepare.ts');const root=mkdtempSync(join(tmpdir(),'pr-reviewer-literal-link-')),oldGit=process.env.GIT_DIR;
 const git=(...args:string[])=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
 git('init','-q');writeFileSync(join(root,'a.md'),'# A\n');writeFileSync(join(root,'b'),'# Section\nwrong target\n');writeFileSync(join(root,'b#section'),'# Actual target\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','base');const baseSha=git('rev-parse','HEAD');
 writeFileSync(join(root,'a.md'),'# A\n````md\n```\n[fake](b)\n````\n[real](b%23section)\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','head');const headSha=git('rev-parse','HEAD');process.env.GIT_DIR=join(root,'.git');
 const snapshot=buildSnapshot({prNumber:21,prUrl:'https://github.com/scottchu/pr-reviewer/pull/21',baseSha,headSha,paths:['a.md']});
 assert.equal(snapshot.documentReferences?.length,1);assert.equal(snapshot.documentReferences[0]?.target?.path,'b#section');assert.ok(snapshot.sources.some(s=>s.path==='b#section'&&s.content==='# Actual target\n'));assert.equal(snapshot.sources.some(s=>s.path==='b'),false);
 }finally{if(oldGit===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=oldGit;rmSync(root,{recursive:true,force:true});}
});

test('pre-setup-record DB recovery retains explicitly selected unsupported sides',async()=>{
 const {buildSnapshot,prepareSource}=await import('../scripts/prepare.ts');const {createStore}=await import('../src/storage/public.ts');const {mkdirSync}=await import('node:fs');
 const root=mkdtempSync(join(tmpdir(),'pr-reviewer-legacy-unsupported-')),repo=join(root,'source'),data=join(root,'data'),oldGit=process.env.GIT_DIR,oldSpec=process.env.REVIEW_SOURCE_SPEC;mkdirSync(repo);mkdirSync(data);
 const git=(...args:string[])=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
 git('init','-q');writeFileSync(join(repo,'a.md'),'# Before\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','base');const baseSha=git('rev-parse','HEAD');writeFileSync(join(repo,'a.md'),'# After\n');writeFileSync(join(repo,'binary.bin'),Buffer.from([0,1]));git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','head');const headSha=git('rev-parse','HEAD');process.env.GIT_DIR=join(repo,'.git');delete process.env.REVIEW_SOURCE_SPEC;
 const snapshot=buildSnapshot({prNumber:21,prUrl:'https://github.com/scottchu/pr-reviewer/pull/21',baseSha,headSha,paths:['a.md','binary.bin']}),store=createStore(join(data,'review.sqlite')),owner={kind:'user' as const,actorId:'local-user'};store.prepare('pr-21',snapshot);store.command(owner,{type:'AskQuestion',commandId:'retain-legacy-unsupported',reviewId:'pr-21',text:'Keep this question',anchor:{snapshotId:snapshot.snapshotId,side:'head',path:'a.md',startLine:1,endLine:1}});store.close();
 assert.deepEqual(prepareSource(data),snapshot);const reopened=createStore(join(data,'review.sqlite'));assert.equal(reopened.review(owner,'pr-21').questions.length,1);reopened.close();
 }finally{if(oldGit===undefined)delete process.env.GIT_DIR;else process.env.GIT_DIR=oldGit;if(oldSpec===undefined)delete process.env.REVIEW_SOURCE_SPEC;else process.env.REVIEW_SOURCE_SPEC=oldSpec;rmSync(root,{recursive:true,force:true});}
});
