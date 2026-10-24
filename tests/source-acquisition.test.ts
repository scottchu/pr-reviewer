import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRemote, discoverChange, lookupChange, importChange } from "../src/source-acquisition/public.ts";

test("remote identities redact secrets and reject unsafe project paths", () => {
  assert.deepEqual(parseRemote("https://user:secret@git.example.com/group/project.git"), { host: "git.example.com", project: "group/project" });
  assert.deepEqual(parseRemote("git@github.com:owner/repo.git"), { host: "github.com", project: "owner/repo" });
  assert.equal(parseRemote("https://github.com/a/../repo.git"), null);
  assert.equal(parseRemote("--upload-pack=evil"), null);
});

test("public preparation functions exist", () => {
  assert.equal(typeof discoverChange, "function");
  assert.equal(typeof lookupChange, "function");
  assert.equal(typeof importChange, "function");
});

const baseSha = "1".repeat(40), headSha = "2".repeat(40), mergeBase = "3".repeat(40);
const pull = (number = 1, source = "fork/repo", target = "team/repo", host = "github.com") => ({
  number, html_url: `https://${host}/${target}/pull/${number}`, state: "open", title: "Change",
  head: { ref: "feature", sha: headSha, repo: { full_name: source } },
  base: { ref: "main", sha: baseSha, repo: { full_name: target } },
});
type RunInput = { executable: "git" | "gh" | "glab"; args: readonly string[]; cwd: string; maxBytes: number; timeoutMs: number };
const ok = (value: string | object) => ({ kind: "ok" as const, stdout: Buffer.from(typeof value === "string" ? value : JSON.stringify(value)) });
const unavailable = (reason: "tool_missing" | "authentication" | "command_failed" = "command_failed") => ({ kind: "unavailable" as const, reason });
const fixture = (options: { numbers?: number[]; detached?: boolean; branch?: string; failure?: "tool_missing" | "authentication"; wrongHost?: boolean } = {}) => {
  const calls: RunInput[] = [];
  const effects = { run: async (input: RunInput) => {
    calls.push(input);
    if (input.executable === "git") {
      const args = input.args;
      if (args.includes("--show-toplevel")) return ok("/canonical/repo\n");
      if (args.includes("symbolic-ref")) return options.detached ? unavailable() : ok(`${options.branch ?? "feature"}\n`);
      if (args.includes("@{upstream}")) return ok("");
      if (args.includes("--get-regexp")) return ok("remote.origin.url\nhttps://token:secret@github.com/fork/repo.git\0remote.upstream.url\ngit@github.com:team/repo.git\0");
      return unavailable();
    }
    if (options.failure) return unavailable(options.failure);
    const endpoint = input.args.at(-1) ?? "";
    if (endpoint.includes("/compare/")) return ok({ merge_base_commit: { sha: mergeBase } });
    if (/\/pulls\/\d+$/.test(endpoint)) return ok(pull(Number(endpoint.split("/").at(-1)), "fork/repo", "team/repo", options.wrongHost ? "evil.example" : "github.com"));
    if (endpoint.includes("/pulls?")) return ok(endpoint.includes("repos/team/repo/") ? (options.numbers ?? [1]).map(n => pull(n)) : []);
    if (endpoint === "repos/fork/repo") return ok({ full_name: "fork/repo", default_branch: "main", parent: { full_name: "team/repo" } });
    if (endpoint === "repos/team/repo") return ok({ full_name: "team/repo", default_branch: "main" });
    return unavailable();
  }};
  return { effects, calls };
};

test("discovery matches fork source and target across remotes, pins merge base", async () => {
  const {effects,calls} = fixture();
  const result = await discoverChange("/input/repo", effects);
  assert.equal(result.kind, "unique");
  assert.equal(result.candidates[0]?.sourceProject, "fork/repo");
  assert.equal(result.candidates[0]?.targetProject, "team/repo");
  assert.equal(result.candidates[0]?.baseSha, mergeBase);
  assert.equal(result.candidates[0]?.targetTipSha, baseSha);
  assert.equal(JSON.stringify(result).includes("secret"), false);
  assert.ok(calls.every(c => Array.isArray(c.args)));
});

test("ambiguity, no matches, detached/default branch and unavailable routes remain explicit", async () => {
  assert.equal((await discoverChange("/repo", fixture({numbers:[1,2]}).effects)).kind, "ambiguous");
  assert.equal((await discoverChange("/repo", fixture({numbers:[]}).effects)).kind, "none");
  assert.equal((await discoverChange("/repo", fixture({detached:true}).effects)).kind, "none");
  assert.equal((await discoverChange("/repo", fixture({branch:"main",numbers:[]}).effects)).kind, "none");
  for (const failure of ["tool_missing", "authentication"] as const) {
    const result = await discoverChange("/repo", fixture({failure}).effects);
    assert.equal(result.kind, "unavailable");
    assert.ok(result.issues.some(i => i.reason === failure));
  }
});

test("provider URL wrong-host and branch/path injection cannot establish provenance", async () => {
  assert.equal((await discoverChange("/repo", fixture({wrongHost:true}).effects)).kind, "unavailable");
  const {effects,calls} = fixture({branch:"feature;$(touch /tmp/no)"});
  await discoverChange("/repo;$(no)", effects);
  assert.ok(calls.every(c => c.executable !== ("sh" as string)));
  assert.ok(calls.filter(c => c.executable === "gh").every(c => !c.args.some(a => a === "feature;$(touch /tmp/no)")));
  const bad = await lookupChange({provider:"github",host:"github.com",targetProject:"../escape",number:1}, effects, "/repo");
  assert.equal(bad.kind, "unavailable");
});

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createNodeEffects } from "../src/source-acquisition/public.ts";
import type { AcquisitionEffects, Candidate, Command } from "../src/source-acquisition/public.ts";

const gitFixture = () => {
  const root=mkdtempSync(join(tmpdir(),"pr-reviewer-source-fixture-"));
  const git=(...args:string[]) => execFileSync("git",args,{cwd:root,env:{...process.env,GIT_CONFIG_NOSYSTEM:"1",GIT_CONFIG_GLOBAL:"/dev/null",GIT_AUTHOR_NAME:"Fixture",GIT_AUTHOR_EMAIL:"fixture@example.invalid",GIT_COMMITTER_NAME:"Fixture",GIT_COMMITTER_EMAIL:"fixture@example.invalid"},encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
  git("init","--quiet");
  writeFileSync(join(root,"modify.txt"),"one\ntwo\nthree\nfour\nfive\n");
  writeFileSync(join(root,"deleted.txt"),"deleted\n");
  writeFileSync(join(root,"rename.txt"),"rename remains same\n".repeat(10));
  writeFileSync(join(root,"copy-source.txt"),"copy original\n".repeat(10));
  git("add",".");git("commit","--quiet","-m","base");
  const base=git("rev-parse","HEAD");
  writeFileSync(join(root,"modify.txt"),"one\nTWO\nthree\nfour\nFIVE\n");
  rmSync(join(root,"deleted.txt"));
  git("mv","rename.txt","renamed.txt");
  writeFileSync(join(root,"copy-destination.txt"),readFileSync(join(root,"copy-source.txt")));
  writeFileSync(join(root,"copy-source.txt"),"copy changed\n"+"copy original\n".repeat(9));
  writeFileSync(join(root,"added.txt"),"new\n");
  writeFileSync(join(root,"invalid.txt"),Buffer.from([0xff,0xfe,0x41]));
  writeFileSync(join(root,"binary.bin"),Buffer.from([0x61,0,0x62]));
  writeFileSync(join(root,"empty.txt"),"");
  symlinkSync("modify.txt",join(root,"link"));
  git("add",".");git("update-index","--add","--cacheinfo",`160000,${base},vendor`);git("commit","--quiet","-m","head");
  const head=git("rev-parse","HEAD");
  const candidate:Candidate={provider:"github",host:"github.com",sourceProject:"fork/repo",targetProject:"team/repo",number:1,url:"https://github.com/team/repo/pull/1",title:"Fixture",state:"open",sourceBranch:"feature",targetBranch:"main",baseSha:base,headSha:head,targetTipSha:base,baselineMethod:"github_compare_merge_base"};
  const real=createNodeEffects();
  const effects:AcquisitionEffects={run:async (command) => {
    if (command.executable === "git") return real.run(command);
    return command.args.at(-1)?.includes("/compare/") ? ok({merge_base_commit:{sha:base}}) : ok({...pull(),title:"Fixture",base:{ref:"main",sha:base,repo:{full_name:"team/repo"}},head:{ref:"feature",sha:head,repo:{full_name:"fork/repo"}}});
  }};
  return {root,git,candidate,effects,cleanup:()=>rmSync(root,{recursive:true,force:true})};
};

test("real pinned Git fixture accounts for added/deleted/rename/copy/binary/UTF8/submodule/symlink and hunks", async () => {
  const f=gitFixture();
  try {
    const sentinel=join(f.root,"executed");
    f.git("config","diff.external",`touch ${sentinel}`);
    f.git("config","diff.test.textconv",`touch ${sentinel}`);
    writeFileSync(join(f.root,".gitattributes"),"* diff=test\n");
    mkdirSync(join(f.root,".git/hooks"),{recursive:true});
    writeFileSync(join(f.root,".git/hooks/post-checkout"),`#!/bin/sh\ntouch '${sentinel}'\n`,{mode:0o755});
    writeFileSync(join(f.root,"untracked-user-file"),"preserve me");
    const before=f.git("status","--porcelain=v1");
    const result=await importChange({worktree:f.root,candidate:f.candidate},f.effects);
    assert.equal(result.kind,"imported");if(result.kind !== "imported") return;
    const {value}=result;
    assert.equal(value.counts.changedPaths,11);
    assert.equal(value.changedFiles.find(e=>e.newPath === "renamed.txt")?.status,"renamed");
    assert.equal(value.changedFiles.find(e=>e.newPath === "copy-destination.txt")?.status,"copied");
    assert.equal(value.changedFiles.find(e=>e.oldPath === "deleted.txt")?.status,"deleted");
    assert.equal(value.changedFiles.find(e=>e.newPath === "modify.txt")?.hunks.length,2);
    assert.equal(value.changedFiles.find(e=>e.newPath === "renamed.txt")?.hunks.length,0);
    assert.equal(value.changedFiles.find(e=>e.newPath === "invalid.txt")?.dispositions[0]?.reason,"invalid_utf8");
    assert.equal(value.changedFiles.find(e=>e.newPath === "binary.bin")?.dispositions[0]?.reason,"binary");
    assert.equal(value.changedFiles.find(e=>e.newPath === "vendor")?.dispositions[0]?.reason,"submodule");
    assert.equal(value.changedFiles.find(e=>e.newPath === "link")?.dispositions[0]?.reason,"symlink");
    assert.equal(value.sources.find(s=>s.path === "empty.txt")?.lineCount,0);
    assert.equal(value.counts.preparedSides+value.counts.unsupportedSides+value.counts.missingSides,value.changedFiles.reduce((n,f)=>n+f.dispositions.length,0));
    assert.ok(Object.isFrozen(value));assert.ok(Object.isFrozen(value.changedFiles));
    assert.equal(f.git("status","--porcelain=v1"),before);
    assert.equal(existsSync(sentinel),false);
    const second=await importChange({worktree:f.root,candidate:f.candidate},f.effects);
    assert.equal(second.kind === "imported" ? second.value.snapshotId : null,value.snapshotId);
  } finally {f.cleanup();}
});

test("real Git budgets retain every path and explicit per-side limits, never a truncated manifest", async () => {
  const f=gitFixture();
  try {
    const over=await importChange({worktree:f.root,candidate:f.candidate,budgets:{maxBlobBytes:32}},f.effects);
    // Commit read uses an independent hard bound; file budgets must not reject valid commit metadata.
    assert.equal(over.kind,"imported");
    if(over.kind === "imported") {assert.equal(over.value.counts.changedPaths,11);assert.ok(over.value.changedFiles.some(e=>e.dispositions.some(d=>d.reason === "blob_limit")));}
    const files=await importChange({worktree:f.root,candidate:f.candidate,budgets:{maxFiles:1}},f.effects);
    assert.equal(files.kind,"unavailable");
    const hunks=await importChange({worktree:f.root,candidate:f.candidate,budgets:{maxHunks:1}},f.effects);
    assert.equal(hunks.kind,"imported");if(hunks.kind === "imported") assert.ok(hunks.value.changedFiles.some(e=>e.dispositions.some(d=>d.reason === "hunk_limit")));
    const bytes=await importChange({worktree:f.root,candidate:f.candidate,budgets:{maxTotalBytes:10}},f.effects);
    assert.equal(bytes.kind,"imported");if(bytes.kind === "imported") assert.ok(bytes.value.changedFiles.some(e=>e.dispositions.some(d=>d.reason === "total_byte_limit")));
  } finally {f.cleanup();}
});

test("missing blobs, wrong object type, hash mismatch, stale metadata and noncommit pins are explicit", async () => {
  const f=gitFixture();
  try {
    const blob=f.git("rev-parse",`${f.candidate.headSha}:added.txt`);
    const altered=(alter:(c:Command)=>Promise<Awaited<ReturnType<AcquisitionEffects["run"]>>>):AcquisitionEffects=>({run:alter});
    for (const mode of ["missing","tree","hash"] as const) {
      const effects=altered(async c=>{
        if (c.executable === "git" && c.args.at(-1) === blob) {
          if (mode === "missing") return unavailable();
          if (mode === "tree" && c.args.includes("-t")) return ok("tree\n");
          if (mode === "hash" && c.args.includes("blob")) return ok("BAD\n");
        }
        return f.effects.run(c);
      });
      const result=await importChange({worktree:f.root,candidate:f.candidate},effects);
      assert.equal(result.kind,"imported");if(result.kind === "imported") assert.equal(result.value.changedFiles.find(e=>e.newPath === "added.txt")?.dispositions[0]?.reason,mode === "tree" ? "object_type" : "missing_object");
    }
    assert.equal((await importChange({worktree:f.root,candidate:{...f.candidate,headSha:"0".repeat(40)}},f.effects)).kind,"unavailable");
    const tree=f.git("rev-parse","HEAD^{tree}");
    const effects=altered(async c=>c.executable === "git" && c.args.at(-1) === f.candidate.headSha && c.args.includes("-t") ? ok("tree\n") : f.effects.run(c));
    assert.equal((await importChange({worktree:f.root,candidate:f.candidate},effects)).kind,"unavailable");
    assert.ok(tree);
  } finally {f.cleanup();}
});

test("self-hosted GitLab fork lookup retains both projects and provider diff baseline", async () => {
  const effects:AcquisitionEffects={run:async c=>{
    assert.equal(c.executable,"glab");assert.deepEqual(c.args.slice(0,3),["api","--hostname","git.example.com"]);
    const endpoint=c.args.at(-1);
    if(endpoint === "projects/team%2Frepo/merge_requests/7") return ok({iid:7,source_project_id:11,target_project_id:22,source_branch:"feature",target_branch:"main",web_url:"https://git.example.com/team/repo/-/merge_requests/7",title:"MR",state:"opened",diff_refs:{base_sha:mergeBase,head_sha:headSha,start_sha:baseSha}});
    if(endpoint === "projects/11") return ok({path_with_namespace:"fork/repo"});
    if(endpoint === "projects/22") return ok({path_with_namespace:"team/repo"});
    return unavailable();
  }};
  const result=await lookupChange({provider:"gitlab",host:"git.example.com",targetProject:"team/repo",number:7},effects,"/repo");
  assert.equal(result.kind,"resolved");if(result.kind === "resolved") {assert.equal(result.candidate.baseSha,mergeBase);assert.equal(result.candidate.sourceProject,"fork/repo");assert.equal(result.candidate.baselineMethod,"gitlab_diff_refs");}
});

test("lookup projects only declared provenance fields and never carries input extras", async () => {
  const reference={provider:"github" as const,host:"github.com",targetProject:"team/repo",number:1,credential:"must-not-leak"};
  const result=await lookupChange(reference,fixture().effects,"/repo");
  assert.equal(result.kind,"resolved");
  assert.equal(JSON.stringify(result).includes("must-not-leak"),false);
});

const effectsForCandidate = (candidate:Candidate):AcquisitionEffects => {
  const real=createNodeEffects();
  return {run:async c=>c.executable === "git" ? real.run(c) : ok(c.args.at(-1)?.includes("/compare/") ? {merge_base_commit:{sha:candidate.baseSha}} : {number:candidate.number,html_url:candidate.url,title:candidate.title,state:candidate.state,head:{ref:candidate.sourceBranch,sha:candidate.headSha,repo:{full_name:candidate.sourceProject}},base:{ref:candidate.targetBranch,sha:candidate.targetTipSha,repo:{full_name:candidate.targetProject}}})};
};

test("missing promisor blob never lazily fetches or executes a configured upload-pack helper", async () => {
  const f=gitFixture();
  try {
    const blob=f.git("rev-parse",`${f.candidate.headSha}:added.txt`);
    const sentinel=join(f.root,"lazy-fetch-executed");
    const helper=join(f.root,"fixture-upload-pack");
    writeFileSync(helper,`#!/bin/sh\nprintf invoked > '${sentinel}'\nexit 1\n`,{mode:0o755});
    f.git("config","remote.origin.url",f.root);
    f.git("config","remote.origin.promisor","true");
    f.git("config","remote.origin.partialclonefilter","blob:none");
    f.git("config","remote.origin.uploadpack",helper);
    const objectPath=join(f.root,".git","objects",blob.slice(0,2),blob.slice(2));
    rmSync(objectPath);
    const direct=await createNodeEffects().run({executable:"git",args:["cat-file","-t",blob],cwd:f.root,maxBytes:128,timeoutMs:2000});
    assert.equal(direct.kind,"unavailable");
    assert.equal(existsSync(sentinel),false,"the read-only runner lazily invoked the fixture fetch helper");
    const result=await importChange({worktree:f.root,candidate:f.candidate},f.effects);
    assert.equal(existsSync(sentinel),false,"read-only acquisition executed the fixture fetch helper");
    assert.equal(existsSync(objectPath),false,"read-only acquisition retrieved a missing object");
    assert.equal(result.kind,"imported");
    if(result.kind === "imported") assert.equal(result.value.changedFiles.find(e=>e.newPath === "added.txt")?.dispositions[0]?.reason,"missing_object");
  } finally {f.cleanup();}
});

test("added magic path names are literal and retain their complete added hunk", async () => {
  const f=gitFixture();
  try {
    const path=":(exclude)*";
    writeFileSync(join(f.root,path),"literal addition\n");
    f.git("add","--all");f.git("commit","--quiet","-m","magic path");
    const candidate={...f.candidate,headSha:f.git("rev-parse","HEAD")};
    const result=await importChange({worktree:f.root,candidate},effectsForCandidate(candidate));
    assert.equal(result.kind,"imported");
    if(result.kind === "imported") assert.deepEqual(result.value.changedFiles.find(e=>e.newPath === path)?.hunks.map(({oldStart,oldLines,newStart,newLines})=>({oldStart,oldLines,newStart,newLines})),[{oldStart:0,oldLines:0,newStart:1,newLines:1}]);
  } finally {f.cleanup();}
});

test("pinned text hunks and snapshot identity ignore worktree/info attributes and local diff configuration", async () => {
  const f=gitFixture();
  try {
    const clean=await importChange({worktree:f.root,candidate:f.candidate},f.effects);
    assert.equal(clean.kind,"imported");
    writeFileSync(join(f.root,".gitattributes"),"* -diff\n");
    writeFileSync(join(f.root,".git","info","attributes"),"* -diff\n");
    f.git("config","diff.context","9");
    f.git("config","diff.interHunkContext","99");
    f.git("config","diff.algorithm","histogram");
    f.git("config","diff.relative","true");
    const order=join(f.root,"fixture-diff-order");
    writeFileSync(order,"vendor\nmodify.txt\nadded.txt\n");
    f.git("config","diff.orderFile",order);
    const dirty=await importChange({worktree:f.root,candidate:f.candidate},f.effects);
    assert.equal(dirty.kind,"imported");
    if(clean.kind === "imported" && dirty.kind === "imported") {
      assert.equal(dirty.value.snapshotId,clean.value.snapshotId);
      assert.deepEqual(dirty.value.changedFiles,clean.value.changedFiles);
      assert.equal(dirty.value.changedFiles.find(e=>e.newPath === "added.txt")?.hunks.length,1);
      assert.equal(dirty.value.changedFiles.find(e=>e.newPath === "modify.txt")?.hunks.length,2);
    }
  } finally {f.cleanup();}
});


test("deleted magic path names retain their complete deleted hunk", async () => {
  const f=gitFixture();
  try {
    const path=":(exclude)*";
    writeFileSync(join(f.root,path),"literal deletion\n");
    f.git("add","--all");f.git("commit","--quiet","-m","magic baseline");
    const baseSha=f.git("rev-parse","HEAD");
    rmSync(join(f.root,path));
    f.git("add","--all");f.git("commit","--quiet","-m","magic deletion");
    const candidate={...f.candidate,baseSha,targetTipSha:baseSha,headSha:f.git("rev-parse","HEAD")};
    const result=await importChange({worktree:f.root,candidate},effectsForCandidate(candidate));
    assert.equal(result.kind,"imported");
    if(result.kind === "imported") assert.deepEqual(result.value.changedFiles.find(e=>e.oldPath === path)?.hunks.map(({oldStart,oldLines,newStart,newLines})=>({oldStart,oldLines,newStart,newLines})),[{oldStart:1,oldLines:1,newStart:0,newLines:0}]);
  } finally {f.cleanup();}
});

test("missing promised commits and trees stay unavailable without helper execution or retrieval", async () => {
  for(const kind of ["commit","tree"] as const) {
    const f=gitFixture();
    try {
      const oid=kind === "commit" ? f.candidate.headSha : f.git("rev-parse",`${f.candidate.headSha}^{tree}`);
      const sentinel=join(f.root,`lazy-${kind}-executed`);
      const helper=join(f.root,`fixture-${kind}-upload-pack`);
      writeFileSync(helper,`#!/bin/sh\nprintf invoked > '${sentinel}'\nexit 1\n`,{mode:0o755});
      f.git("config","remote.origin.url",f.root);
      f.git("config","remote.origin.promisor","true");
      f.git("config","remote.origin.partialclonefilter","blob:none");
      f.git("config","remote.origin.uploadpack",helper);
      const objectPath=join(f.root,".git","objects",oid.slice(0,2),oid.slice(2));
      rmSync(objectPath);
      const direct=await createNodeEffects().run({executable:"git",args:["cat-file","-t",oid],cwd:f.root,maxBytes:128,timeoutMs:2000});
      assert.equal(direct.kind,"unavailable");
      const result=await importChange({worktree:f.root,candidate:f.candidate},f.effects);
      assert.equal(result.kind,"unavailable");
      assert.equal(existsSync(sentinel),false,`missing ${kind} invoked the fixture fetch helper`);
      assert.equal(existsSync(objectPath),false,`missing ${kind} was retrieved`);
    } finally {f.cleanup();}
  }
});

test("unexpected empty text patches remain unsupported while genuine empty/rename spans stay valid", async () => {
  const f=gitFixture();
  try {
    const effects:AcquisitionEffects={run:async c=>c.executable === "git" && c.args.includes("diff") ? ok("") : f.effects.run(c)};
    const result=await importChange({worktree:f.root,candidate:f.candidate},effects);
    assert.equal(result.kind,"imported");
    if(result.kind === "imported") {
      assert.equal(result.value.changedFiles.find(e=>e.newPath === "modify.txt")?.coverage,"unsupported");
      assert.equal(result.value.changedFiles.find(e=>e.newPath === "added.txt")?.dispositions[0]?.reason,"patch_unavailable");
      assert.equal(result.value.changedFiles.find(e=>e.newPath === "empty.txt")?.coverage,"text");
      assert.equal(result.value.changedFiles.find(e=>e.newPath === "renamed.txt")?.coverage,"text");
    }
  } finally {f.cleanup();}
});
