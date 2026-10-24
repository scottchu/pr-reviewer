import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { analysisCommandSchema } from "../src/domain/public.ts";
import { createStore } from "../src/storage/public.ts";
import { acquirePreparedContext, contextAnalysisInput } from "../src/source-preparation/public.ts";
import { createNodeEffects } from "../src/source-acquisition/public.ts";
import type { ContextLedgerEntry } from "../src/source-acquisition/public.ts";
import { semanticFixture } from "./semantic-fixture.ts";
import { eventually } from "./semantic-fixture.ts";
import { createAnalysisRunner } from "../src/analysis-jobs/public.ts";
import { createGateway } from "../src/server/public.ts";

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

test("actual owned inventory remains unavailable at10001 sites; explicit required cap admits truthful scoped facts on the same snapshot", async () => {
  const f = semanticFixture();
  writeFileSync(join(f.root, "unknown.ts"), 'import {caller} from "./caller";\nexport const many = () => {\n' + "caller();\n".repeat(11000) + "};\n");
  f.git("add", "unknown.ts"); f.git("commit", "-qm", "many real invocation sites");
  const headSha = f.git("rev-parse", "HEAD");
  const snapshot = { ...f.snapshot, headSha, snapshotId: createHash("sha256").update(JSON.stringify({ baseSha: f.snapshot.baseSha, headSha, sources: f.snapshot.sources })).digest("hex") };
  f.store.prepare("bounded", snapshot);
  const request = { ...f.request, reviewId: "bounded", snapshotId: snapshot.snapshotId }, query = () => f.store.analysis.query(f.token, { reviewId: "bounded", snapshotId: snapshot.snapshotId });
  const original = JSON.stringify(f.store.review({ kind: "user", actorId: "local-user" }, "bounded").snapshot), runner = createAnalysisRunner(f.store);
  try {
    assert.equal(f.store.analysis.command(f.token, request).state, "applied"); runner.wake();
    await eventually(() => query().jobs[0]?.state === "unavailable", 10000);
    const unavailable = query(), inventory = unavailable.preparation!.inventory!;
    assert.equal(inventory.status, "unavailable");
    if (inventory.status !== "unavailable") throw Error("expected_inventory_limit");
    assert.equal(inventory.reason, "budget_exceeded"); assert.equal(inventory.limit, "invocationSites"); assert.equal(inventory.observed.invocationSites, 10001);
    assert.equal("declarations" in inventory, false); assert.equal(unavailable.analysis, null); assert.equal(unavailable.graphRevision, 0);
    assert.equal(unavailable.jobs[0]!.invocations.at(-1)!.processes[0]!.state, "exited");
    const capped = { ...request, commandId: "explicit-cap", expectedAnalysisGeneration: 1, contextFilesPerSide: 2, priorityPaths: { base: ["callee.ts", "caller.ts"], head: ["caller.ts", "callee.ts"] } };
    assert.equal(f.store.analysis.command(f.token, capped).state, "applied"); runner.wake();
    await eventually(() => query().jobs.at(-1)?.state === "awaiting_declarations", 10000);
    const choosing = query(), prepared = choosing.preparation!, available = prepared.inventory!, job = choosing.jobs.at(-1)!;
    assert.equal(available.status, "available"); if (available.status !== "available") throw Error("expected_scoped_inventory");
    assert.equal(job.contextFilesPerSide, 2); assert.equal(prepared.corpus!.budgets.filesPerSide, 2);
    assert.notEqual(prepared.corpus!.corpusId, unavailable.preparation!.corpus!.corpusId);
    const choices = available.declarations.filter(item => item.name === "caller").map(item => item.id); assert.equal(choices.length, 2);
    assert.equal(f.store.analysis.command(f.token, { type: "SelectAnalysisDeclarations", commandId: "capped-choice", jobId: job.jobId, expectedJobRevision: job.jobRevision, corpusId: job.corpusId!, inventoryId: job.inventoryId!, declarationIds: choices }).state, "applied"); runner.wake();
    await eventually(() => query().jobs.at(-1)?.state === "admitted", 10000);
    const view = query(), facts = view.analysis!; assert.equal(facts.status, "analyzed"); if (facts.status !== "analyzed") throw Error("analysis_unavailable");
    assert.equal(view.jobs[0]!.state, "unavailable"); assert.equal(view.jobs[0]!.inventoryId, inventory.inventoryId);
    assert.equal(view.jobs[1]!.contextFilesPerSide, 2); assert.equal(view.jobs[1]!.generation, 2); assert.equal(view.graphRevision, 1);
    assert.equal(facts.edges.length, 2); assert.equal(facts.coverage.length, 6);
    for (const row of facts.coverage.filter(row => row.path === "unknown.ts")) { assert.equal(row.selected, false); assert.equal(row.prepared, false); assert.equal(row.status, "excluded"); assert.equal(row.examined, null); }
    for (const neighborhood of facts.neighborhoods) { assert.equal(neighborhood.incomingAssessment, "No resolved callers found in these supplied files"); assert.equal(neighborhood.incomingScope, "supplied_files_only"); assert.ok(neighborhood.limitations.includes("incomplete-incoming-source-scope")); assert.equal(neighborhood.outgoingAssessment, "invocations_present"); }
    const primary = facts.nodes.find(node => node.name === "caller" && node.declaration.side === "head")!.declaration;
    assert.match(f.store.analysis.source(f.token, { reviewId: "bounded", snapshotId: snapshot.snapshotId, corpusId: view.corpus!.corpusId, side: primary.side, path: primary.path, contentHash: primary.contentHash }).content, /callee/);
    const next = { ...request, commandId: "cancelled-cap", expectedAnalysisGeneration: 2, contextFilesPerSide: 1, priorityPaths: { base: ["callee.ts"], head: ["callee.ts"] } };
    const nextReceipt = f.store.analysis.command(f.token, next), pending = query().jobs.at(-1)!;
    assert.equal(nextReceipt.state, "applied"); assert.equal(pending.contextFilesPerSide, 1); assert.equal(pending.invocations.length, 0);
    assert.equal(query().analysis!.analysisId, facts.analysisId);
    assert.equal(f.store.analysis.command(f.token, { type: "CancelAnalysis", commandId: "cancel-cap-before-effect", jobId: pending.jobId, expectedJobRevision: pending.jobRevision }).state, "applied");
    assert.equal(query().jobs.at(-1)!.state, "cancelled"); assert.equal(query().jobs.at(-1)!.contextFilesPerSide, 1); assert.equal(query().jobs.at(-1)!.invocations.length, 0);
    assert.equal(query().analysis!.analysisId, facts.analysisId); assert.equal(query().graphRevision, 1); assert.equal(query().currentSnapshotId, snapshot.snapshotId);
    assert.deepEqual(f.store.analysis.command(f.token, next), nextReceipt);
    assert.equal(JSON.stringify(f.store.review({ kind: "user", actorId: "local-user" }, "bounded").snapshot), original);
  } finally { await runner.stop(); f.cleanup(); }
});

test("actual HTTP validates cap before effects, preserves owner-only context authority and returns exact public cap", async () => {
  const f = semanticFixture(), gateway = createGateway(f.store, async () => ({ state: "unknown", reason: "controlled" })), port = await gateway.listen(0);
  const call = async (input: unknown, token = f.token) => { const response = await fetch(`http://127.0.0.1:${port}/api/analysis/commands`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) }); return { status: response.status, body: await response.json() as { state?: string; error?: string } }; };
  const query = () => f.store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId });
  try {
    for (const cap of [0, 129, 1.5, "2", null]) assert.equal((await call({ ...f.request, contextFilesPerSide: cap })).status, 400);
    assert.equal((await call({ ...f.request, contextFilesPerSide: 1, priorityPaths: { head: ["callee.ts", "caller.ts"] } })).status, 400);
    assert.equal(query().analysisGeneration, 0); assert.equal(query().jobs.length, 0);
    const user = { kind: "user" as const, actorId: "local-user" }, connection = f.store.registerConnection(user, { host: "codex", sessionId: "cap-session", connectionId: "cap-connection", corroborated: true }), challenge = f.store.challenge(user, "r", "codex", "cap-session", "cap-connection"), attached = f.store.attach(f.store.authenticate(connection.token), challenge.challengeId, challenge.proof);
    const request = { ...f.request, contextFilesPerSide: 2, priorityPaths: { base: ["callee.ts", "caller.ts"], head: ["callee.ts", "caller.ts"] } };
    assert.equal((await call(request, attached.token)).status, 401); assert.equal(query().jobs.length, 0);
    assert.equal((await call(request)).body.state, "applied");
    await eventually(() => query().jobs[0]?.state === "awaiting_declarations");
    assert.equal(query().jobs[0]!.contextFilesPerSide, 2); assert.equal(query().preparation!.corpus!.accounts.head.excludedSources, 1);
  } finally { await gateway.close(); f.cleanup(); }
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
