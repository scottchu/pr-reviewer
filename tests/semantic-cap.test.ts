import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { analysisCommandSchema } from "../src/domain/public.ts";
import { createStore } from "../src/storage/public.ts";
import { acquirePreparedContext, contextAnalysisInput } from "../src/source-preparation/public.ts";
import { createNodeEffects } from "../src/source-acquisition/public.ts";
import type { ContextLedgerEntry } from "../src/source-acquisition/public.ts";
import { semanticFixture } from "./semantic-fixture.ts";

test("context cap is strict, defaults by absence and counts unique required paths without normalizing retry input", () => {
  const f = semanticFixture();
  try {
    const priorities = { base: ["callee.ts", "callee.ts"], head: ["callee.ts"] };
    const parsed = analysisCommandSchema.parse({ ...f.request, contextFilesPerSide: 1, priorityPaths: priorities });
    assert.equal(parsed.type, "RequestAnalysis");
    if (parsed.type !== "RequestAnalysis") throw Error("wrong_command");
    assert.equal(parsed.contextFilesPerSide, 1);
    assert.deepEqual(parsed.priorityPaths, priorities);
    assert.equal("contextFilesPerSide" in analysisCommandSchema.parse(f.request), false);
    assert.equal(analysisCommandSchema.safeParse({ ...f.request, contextFilesPerSide: 128 }).success, true);
    for (const cap of [0, 129, 1.5, "2", null, false, {}, NaN, Infinity]) assert.equal(analysisCommandSchema.safeParse({ ...f.request, contextFilesPerSide: cap }).success, false);
    assert.equal(analysisCommandSchema.safeParse({ ...f.request, contextFilesPerSide: 1, priorityPaths: { head: ["callee.ts", "caller.ts"] } }).success, false);
    assert.equal(analysisCommandSchema.safeParse({ ...f.request, contextFilesPerSide: 2, budgets: { filesPerSide: 2 } }).success, false);
  } finally { f.cleanup(); }
});

test("cap validation precedes intent effects; exact retry, changed cap/order and queued restart preserve identity", () => {
  const f = semanticFixture(); let reopened: ReturnType<typeof createStore> | undefined;
  try {
    const scope = { reviewId: "r", snapshotId: f.snapshot.snapshotId };
    assert.throws(() => f.store.analysis.command(f.token, { ...f.request, contextFilesPerSide: 1, priorityPaths: { head: ["callee.ts", "caller.ts"] } }));
    assert.equal(f.store.analysis.query(f.token, scope).analysisGeneration, 0);
    assert.equal(f.store.analysis.query(f.token, scope).jobs.length, 0);
    const request = { ...f.request, contextFilesPerSide: 2, priorityPaths: { head: ["callee.ts", "caller.ts", "callee.ts"] } };
    const receipt = f.store.analysis.command(f.token, request);
    assert.equal(receipt.state, "applied");
    assert.deepEqual(f.store.analysis.command(f.token, request), receipt);
    assert.equal(f.store.analysis.command(f.token, { ...request, contextFilesPerSide: 3 }).error, "command_conflict");
    assert.equal(f.store.analysis.command(f.token, { ...request, priorityPaths: { head: ["caller.ts", "callee.ts", "callee.ts"] } }).error, "command_conflict");
    assert.equal(f.store.analysis.query(f.token, scope).jobs[0]!.contextFilesPerSide, 2);
    f.store.close(); reopened = createStore(f.filename);
    assert.deepEqual(reopened.analysis.command(f.token, request), receipt);
    const owner = reopened.analysis.beginOwner(), claimed = reopened.analysis.claim(owner)!;
    assert.equal(reopened.analysis.contextInput(claimed.grant).contextFilesPerSide, 2);
    assert.equal(reopened.analysis.query(f.token, scope).jobs[0]!.contextFilesPerSide, 2);
    reopened.analysis.fail(claimed.grant, "analysis_failed", true);
    const defaultReceipt = reopened.analysis.command(f.token, { ...f.request, commandId: "default", expectedAnalysisGeneration: 1 });
    assert.equal(defaultReceipt.state, "applied");
    assert.equal("contextFilesPerSide" in reopened.analysis.query(f.token, scope).jobs[1]!, false);
    assert.equal(reopened.analysis.command(f.token, { ...f.request, commandId: "default", expectedAnalysisGeneration: 1, contextFilesPerSide: 128 }).error, "command_conflict");
  } finally { if (reopened) { reopened.close(); rmSync(f.root, { recursive: true, force: true }); } else f.cleanup(); }
});

test("trusted lower cap retains full known ledger, exact required priorities and independent analyzer limits", async () => {
  const f = semanticFixture();
  try {
    const review = f.store.review({ kind: "user", actorId: "local-user" }, "r"), original = JSON.stringify(review.snapshot);
    const common = { jobId: "cap-context", review, snapshotId: f.snapshot.snapshotId, worktree: f.root, sourceProject: "scottchu/pr-reviewer" };
    const priorities = { base: ["caller.ts", "callee.ts", "caller.ts"], head: ["callee.ts", "caller.ts"] };
    const capped = await acquirePreparedContext({ ...common, contextFilesPerSide: 2, priorityPaths: priorities }, createNodeEffects());
    assert.equal(capped.kind, "prepared"); if (capped.kind !== "prepared") throw Error("context_unavailable");
    const omitted = await acquirePreparedContext(common, createNodeEffects());
    const explicit = await acquirePreparedContext({ ...common, contextFilesPerSide: 128 }, createNodeEffects());
    assert.equal(omitted.kind, "prepared"); assert.equal(explicit.kind, "prepared");
    if (omitted.kind !== "prepared" || explicit.kind !== "prepared") throw Error("default_context_unavailable");
    assert.equal(omitted.corpus.corpusId, explicit.corpus.corpusId);
    assert.notEqual(capped.corpus.corpusId, omitted.corpus.corpusId);
    assert.equal(capped.corpus.budgets.filesPerSide, 2);
    for (const side of ["base", "head"] as const) {
      assert.equal(capped.corpus.accounts[side].enumeration, "complete");
      assert.equal(capped.corpus.accounts[side].knownSourcePaths, 3);
      assert.equal(capped.corpus.accounts[side].preparedSources, 2);
      assert.equal(capped.corpus.accounts[side].excludedSources, 1);
      assert.deepEqual(capped.corpus.priorityPaths[side], ["callee.ts", "caller.ts"]);
      const excluded: ContextLedgerEntry = capped.corpus.ledger.find(row => row.side === side && row.path === "unknown.ts")!;
      assert.equal(excluded.preparation, "excluded"); assert.equal(excluded.reason, "source_limit"); assert.equal(excluded.selected, false);
    }
    const input = contextAnalysisInput(capped.corpus);
    assert.equal(input.sources.length, 6);
    assert.equal(input.budgets.filesPerSide, 128); assert.equal(input.budgets.invocationSites, 10000);
    assert.equal(input.sources.find(row => row.path === "unknown.ts")!.exclusion, "excluded");
    assert.equal(JSON.stringify(review.snapshot), original);
    let effects = 0;
    const invalid = await acquirePreparedContext({ ...common, contextFilesPerSide: 1, priorityPaths: { head: ["callee.ts", "caller.ts"] } }, { run: async () => { effects++; throw Error("unexpected_effect"); } });
    assert.equal(invalid.kind, "unavailable"); assert.equal(effects, 0);
    const missing = await acquirePreparedContext({ ...common, contextFilesPerSide: 1, priorityPaths: { head: ["absent.ts"] } }, createNodeEffects());
    assert.equal(missing.kind, "unavailable"); assert.ok(missing.issues.some(issue => issue.reason === "required_source_unavailable" && issue.path === "absent.ts"));
  } finally { f.cleanup(); }
});
