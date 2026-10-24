import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createNodeEffects, loadSourceContext, DEFAULT_CONTEXT_BUDGETS } from "../src/source-acquisition/public.ts";
import type { AcquisitionEffects, ContextInput } from "../src/source-acquisition/public.ts";

const fixture = () => {
  const root=mkdtempSync(join(tmpdir(),"pr-reviewer-context-"));
  const git=(...args:string[]) => execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"],env:{...process.env,GIT_CONFIG_NOSYSTEM:"1",GIT_CONFIG_GLOBAL:"/dev/null",GIT_AUTHOR_NAME:"Context fixture",GIT_AUTHOR_EMAIL:"fixture@example.invalid",GIT_COMMITTER_NAME:"Context fixture",GIT_COMMITTER_EMAIL:"fixture@example.invalid"}}).trim();
  git("init","--quiet");mkdirSync(join(root,"src"));mkdirSync(join(root,"types"));
  writeFileSync(join(root,"src/caller.ts"),'\uFEFFimport { callee } from "./callee";\r\nexport const caller = () => callee();\r\n');
  writeFileSync(join(root,"src/callee.ts"),'export const callee = () => 1;\n');
  writeFileSync(join(root,"src/view.tsx"),'export const View = () => <p>unchanged</p>;\n');
  writeFileSync(join(root,"types/api.d.ts"),'export declare const external: () => void;\n');
  writeFileSync(join(root,"binary.ts"),Buffer.from([0x61,0,0x62]));
  writeFileSync(join(root,"bad.ts"),Buffer.from([0xff,0xfe]));
  writeFileSync(join(root,"empty.ts"),"");
  writeFileSync(join(root,"README.md"),"Not a TypeScript source\n");
  symlinkSync("/unavailable/private/source",join(root,"link.ts"));
  git("add","--all");git("commit","-qm","initial");
  const seed=git("rev-parse","HEAD");
  git("update-index","--add","--cacheinfo",`160000,${seed},vendor`);git("commit","-qm","base");
  const base=git("rev-parse","HEAD");
  writeFileSync(join(root,"src/callee.ts"),'export const callee = () => 2;\n');
  writeFileSync(join(root,"z-new.ts"),'export const added = () => "😀";\n');
  git("add","--all");git("commit","-qm","head");
  const head=git("rev-parse","HEAD");
  const input:ContextInput={worktree:root,snapshotId:"context-snapshot",identity:{provider:"github",host:"github.com",sourceProject:"owner/repo",targetProject:"owner/repo",number:1},commits:{base,head},priorityPaths:{base:["src/callee.ts"],head:["src/callee.ts"]}};
  return {root,git,input,effects:createNodeEffects(),cleanup:()=>rmSync(root,{recursive:true,force:true})};
};

test("retains unchanged callers, TSX and declaration-only source with exact side/commit/hash identity", async () => {
  const f=fixture();
  try {
    const result=await loadSourceContext(f.input,f.effects);
    assert.equal(result.kind,"prepared");if(result.kind !== "prepared") return;
    const {corpus}=result;
    const callers=corpus.sources.filter(s=>s.path === "src/caller.ts");
    assert.equal(callers.length,2);assert.deepEqual(callers.map(s=>s.side),["base","head"]);
    assert.equal(callers[0]?.content,callers[1]?.content);assert.equal(callers[0]?.objectId,callers[1]?.objectId);
    assert.notEqual(callers[0]?.commit,callers[1]?.commit);
    assert.equal(callers[0]?.contentHash,createHash("sha256").update(readFileSync(join(f.root,"src/caller.ts"))).digest("hex"));
    assert.ok(callers[0]?.content.includes("\r\n"));assert.ok(callers[0]?.content.startsWith("\uFEFF"));
    assert.equal(corpus.ledger.find(e=>e.path === "types/api.d.ts")?.role,"declaration-only");
    assert.equal(corpus.ledger.find(e=>e.path === "src/caller.ts")?.change,"unchanged");
    assert.equal(corpus.ledger.find(e=>e.path === "src/callee.ts")?.change,"changed");
    assert.ok(corpus.sources.some(s=>s.path === "src/view.tsx"));
    assert.equal(corpus.accounts.base.enumeration,"complete");assert.equal(corpus.accounts.head.unvisitedPaths,0);
    assert.ok(Object.isFrozen(corpus));assert.ok(Object.isFrozen(corpus.sources));assert.equal(Object.isFrozen(f.input),false);
    assert.equal(JSON.stringify(corpus).includes(f.root),false);
  } finally {f.cleanup();}
});

test("binary, malformed UTF8, symlink and submodule remain distinct known exclusions", async () => {
  const f=fixture();
  try {
    const result=await loadSourceContext(f.input,f.effects);
    assert.equal(result.kind,"prepared");if(result.kind !== "prepared") return;
    for(const [path,reason] of [["binary.ts","binary"],["bad.ts","invalid_utf8"],["link.ts","symlink"],["vendor","submodule"]]) assert.equal(result.corpus.ledger.find(e=>e.path === path)?.reason,reason);
    assert.equal(result.corpus.sources.find(s=>s.path === "empty.ts")?.content,"");
    assert.equal(result.corpus.sources.some(s=>s.path === "link.ts"),false);
  } finally {f.cleanup();}
});

test("canonical priorities/digest are invariant to input ordering and dirty/untracked checkout text", async () => {
  const f=fixture();
  try {
    const input={...f.input,priorityPaths:{base:["src/caller.ts","src/callee.ts","src/caller.ts"],head:["src/view.tsx","src/callee.ts"]}};
    const first=await loadSourceContext(input,f.effects);
    writeFileSync(join(f.root,"src/caller.ts"),"dirty checkout must not enter corpus\n");
    writeFileSync(join(f.root,"untracked.ts"),"not committed\n");writeFileSync(join(f.root,"tsconfig.json"),'{"compilerOptions":{"plugins":[{"name":"never execute"}]}}');
    const second=await loadSourceContext({...input,priorityPaths:{base:["src/callee.ts","src/caller.ts"],head:["src/callee.ts","src/view.tsx"]}},f.effects);
    assert.equal(first.kind,"prepared");assert.equal(second.kind,"prepared");
    if(first.kind === "prepared" && second.kind === "prepared") assert.deepEqual(second.corpus,first.corpus);
    assert.equal(readFileSync(join(f.root,"src/caller.ts"),"utf8"),"dirty checkout must not enter corpus\n");
  } finally {f.cleanup();}
});

test("lowered source quotas prioritize explicit seeds; required paths never silently substitute", async () => {
  const f=fixture();
  try {
    const result=await loadSourceContext({...f.input,budgets:{filesPerSide:1}},f.effects);
    assert.equal(result.kind,"prepared");if(result.kind === "prepared") {
      assert.deepEqual(result.corpus.sources.map(s=>[s.side,s.path]),[["base","src/callee.ts"],["head","src/callee.ts"]]);
      assert.ok(result.corpus.ledger.some(e=>e.reason === "source_limit"));
      assert.equal(result.corpus.accounts.head.enumeration,"complete");
    }
    for(const path of ["absent.ts","link.ts","binary.ts"]) {
      const missing=await loadSourceContext({...f.input,priorityPaths:{head:[path]}},f.effects);
      assert.equal(missing.kind,"unavailable");assert.ok(missing.issues.some(i=>i.reason === "required_source_unavailable" && i.path === path));
    }
    const raised=await loadSourceContext({...f.input,budgets:{filesPerSide:DEFAULT_CONTEXT_BUDGETS.filesPerSide+1}},f.effects);
    assert.equal(raised.kind,"unavailable");assert.equal(raised.corpus,null);
  } finally {f.cleanup();}
});

test("enumeration limits never label a prefix complete or invent an unvisited count", async () => {
  const f=fixture();
  try {
    for(const budgets of [{inventoryEntriesPerSide:1},{treeObjectsPerSide:1},{treeBytesPerSide:1},{inventoryMetadataBytes:32}]) {
      const result=await loadSourceContext({...f.input,budgets},f.effects);
      assert.equal(result.kind,"unavailable");assert.ok(result.corpus);
      if(result.corpus) {
        assert.equal(result.corpus.accounts.head.enumeration,"incomplete");
        assert.equal(result.corpus.accounts.head.unvisitedPaths,null);
        assert.equal(result.corpus.accounts.head.inventory,"selected-context");
        assert.ok(result.corpus.observed.ledgerMetadataBytes <= (budgets.inventoryMetadataBytes ?? DEFAULT_CONTEXT_BUDGETS.inventoryMetadataBytes));
      }
      assert.ok(result.issues.some(i=>i.limit));
    }
  } finally {f.cleanup();}
});

test("file/combined byte limits retain explicit reasons and cannot displace required paths", async () => {
  const f=fixture();
  try {
    for(const [budgets,reason] of [[{fileBytes:1},"file_limit"],[{totalBytes:1},"total_byte_limit"]] as const) {
      const result=await loadSourceContext({...f.input,budgets},f.effects);
      assert.equal(result.kind,"unavailable");
      assert.equal(result.corpus?.ledger.find(e=>e.side === "head" && e.path === "src/callee.ts")?.reason,reason);
      assert.ok(result.issues.some(i=>i.reason === "required_source_unavailable"));
      assert.ok((result.corpus?.observed.sourceBytes ?? 0) <= (budgets.totalBytes ?? DEFAULT_CONTEXT_BUDGETS.totalBytes));
    }
    const noPriorities=await loadSourceContext({...f.input,priorityPaths:{},budgets:{filesPerSide:1}},f.effects);
    assert.equal(noPriorities.kind,"prepared");
    if(noPriorities.kind === "prepared") {
      assert.equal(noPriorities.corpus.sources.length,2);
      assert.equal(noPriorities.corpus.ledger.find(e=>e.path === "bad.ts")?.preparation,"unsupported");
      assert.ok(noPriorities.corpus.accounts.base.knownSourcePaths > 1);
    }
  } finally {f.cleanup();}
});

test("promised missing commits, trees and blobs never fetch or execute configured helpers", async () => {
  for(const kind of ["commit","tree","blob"] as const) {
    const f=fixture();
    try {
      const oid=kind === "commit" ? f.input.commits.head : f.git("rev-parse",kind === "tree" ? `${f.input.commits.head}:src` : `${f.input.commits.head}:src/caller.ts`);
      const sentinel=join(f.root,"fetch-executed"),helper=join(f.root,"fixture-upload-pack");
      writeFileSync(helper,`#!/bin/sh\nprintf invoked > '${sentinel}'\nexit 1\n`,{mode:0o755});
      f.git("config","remote.origin.url",f.root);f.git("config","remote.origin.promisor","true");
      f.git("config","remote.origin.partialclonefilter","blob:none");f.git("config","remote.origin.uploadpack",helper);
      const objectPath=join(f.root,".git/objects",oid.slice(0,2),oid.slice(2));rmSync(objectPath);
      const result=await loadSourceContext(f.input,f.effects);
      assert.equal(existsSync(sentinel),false);assert.equal(existsSync(objectPath),false);
      assert.equal(result.kind,kind === "blob" ? "prepared" : "unavailable");
      if(kind === "blob") assert.equal(result.corpus?.ledger.find(e=>e.path === "src/caller.ts")?.reason,"missing_object");
      if(kind === "tree") {
        assert.equal(result.corpus?.ledger.find(e=>e.side === "head" && e.path === "src")?.reason,"missing_object");
        assert.equal(result.corpus?.accounts.head.unvisitedPaths,null);
      }
    } finally {f.cleanup();}
  }
});

test("blob type/hash failures and required absent sources remain explicit", async () => {
  const f=fixture();
  try {
    const oid=f.git("rev-parse",`${f.input.commits.head}:src/callee.ts`);
    for(const reason of ["object_type","hash_mismatch"] as const) {
      const effects:AcquisitionEffects={run:async c=>{
        if(c.executable === "git" && c.args.at(-1) === oid) {
          if(reason === "object_type" && c.args.includes("-t")) return {kind:"ok",stdout:Buffer.from("tree\n")};
          if(reason === "hash_mismatch" && c.args.includes("blob")) {
            const original=await f.effects.run(c);
            if(original.kind === "ok") return {kind:"ok",stdout:Buffer.alloc(original.stdout.length,0x61)};
          }
        }
        return f.effects.run(c);
      }};
      const result=await loadSourceContext(f.input,effects);
      assert.equal(result.kind,"unavailable");
      assert.equal(result.corpus?.ledger.find(e=>e.side === "head" && e.path === "src/callee.ts")?.reason,reason);
    }
  } finally {f.cleanup();}
});

test("raw tree bytes are hash-verified and invalid input is rejected before effects", async () => {
  const f=fixture();
  try {
    const tree=f.git("rev-parse",`${f.input.commits.head}:src`);
    const effects:AcquisitionEffects={run:async c=>{
      const result=await f.effects.run(c);
      if(c.args.includes("tree") && c.args.at(-1) === tree && result.kind === "ok") return {kind:"ok",stdout:Buffer.alloc(result.stdout.length,0x61)};
      return result;
    }};
    const result=await loadSourceContext(f.input,effects);
    assert.equal(result.kind,"unavailable");
    assert.equal(result.corpus?.ledger.find(e=>e.side === "head" && e.path === "src")?.reason,"hash_mismatch");
    const forbidden:AcquisitionEffects={run:async ()=>{assert.fail("invalid input invoked Git");}};
    for(const input of [{...f.input,commits:{base:"main",head:f.input.commits.head}},{...f.input,priorityPaths:{head:["../secret.ts"]}},{...f.input,budgets:{totalBytes:DEFAULT_CONTEXT_BUDGETS.totalBytes+1}}]) {
      const invalid=await loadSourceContext(input,forbidden);
      assert.equal(invalid.kind,"unavailable");assert.equal(invalid.corpus,null);assert.ok(Object.isFrozen(invalid));
    }
  } finally {f.cleanup();}
});

test("noncanonical raw Git tree modes cannot prepare regular source text", async () => {
  const f=fixture();
  try {
    const blob=f.git("rev-parse",`${f.input.commits.head}:src/callee.ts`);
    const rawGit=(args:string[],input:Buffer)=>execFileSync("git",args,{cwd:f.root,input,encoding:"utf8",stdio:["pipe","pipe","pipe"],env:{...process.env,GIT_CONFIG_NOSYSTEM:"1",GIT_CONFIG_GLOBAL:"/dev/null",GIT_NO_LAZY_FETCH:"1"}}).trim();
    for(const mode of ["120001","100600","040001"]) {
      const path=`invalid-${mode}.ts`;
      const tree=rawGit(["hash-object","--literally","-t","tree","-w","--stdin"],Buffer.concat([Buffer.from(`${mode} ${path}\0`),Buffer.from(blob,"hex")]));
      const head=rawGit(["hash-object","--literally","-t","commit","-w","--stdin"],Buffer.from(`tree ${tree}\nparent ${f.input.commits.base}\nauthor Fixture <fixture@example.invalid> 1 +0000\ncommitter Fixture <fixture@example.invalid> 1 +0000\n\nInvalid source mode fixture\n`));
      const input={...f.input,commits:{base:f.input.commits.base,head},priorityPaths:{}};
      const result=await loadSourceContext(input,f.effects);
      assert.equal(result.kind,"prepared");
      assert.equal(result.corpus?.sources.some(s=>s.side === "head" && s.path === path),false);
      const row=result.corpus?.ledger.find(e=>e.side === "head" && e.path === path);
      assert.equal(row?.preparation,"unsupported");assert.equal(row?.reason,"object_type");
      assert.equal(result.corpus?.accounts.head.preparedSources,0);
      assert.equal(result.corpus?.accounts.head.unsupportedSources,1);
      const required=await loadSourceContext({...input,priorityPaths:{head:[path]}},f.effects);
      assert.equal(required.kind,"unavailable");assert.ok(required.issues.some(i=>i.reason === "required_source_unavailable" && i.path === path));
    }
  } finally {f.cleanup();}
});

test("metadata caps below serialized empty ledger reject before effects, while the minimum remains bounded", async () => {
  const f=fixture();
  try {
    let effects=0;
    const observed:AcquisitionEffects={run:async c=>{effects++;return f.effects.run(c);}};
    const tiny=await loadSourceContext({...f.input,priorityPaths:{},budgets:{inventoryMetadataBytes:1}},observed);
    assert.equal(tiny.kind,"unavailable");assert.equal(tiny.corpus,null);assert.equal(effects,0);
    const minimum=await loadSourceContext({...f.input,priorityPaths:{},budgets:{inventoryMetadataBytes:2}},f.effects);
    assert.equal(minimum.kind,"prepared");assert.equal(minimum.corpus?.observed.ledgerMetadataBytes,2);
    assert.equal(minimum.corpus?.ledger.length,0);assert.equal(minimum.corpus?.accounts.base.unvisitedPaths,null);
  } finally {f.cleanup();}
});
