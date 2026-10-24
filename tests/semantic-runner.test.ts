import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createStore } from "../src/storage/public.ts";
import { createAnalysisRunner, runAnalysisWorker } from "../src/analysis-jobs/public.ts";
import { semanticFixture, eventually } from "./semantic-fixture.ts";
import type { AnalysisView } from "../src/domain/public.ts";
const declarations = (view: AnalysisView) => { const inventory = view.preparation?.inventory; assert.equal(inventory?.status, "available"); if (inventory?.status !== "available")
    throw new Error("missing_inventory"); return inventory.declarations.filter(item => item.name === "callee"); };
const select = (f: ReturnType<typeof semanticFixture>, view: AnalysisView) => { const job = view.jobs.at(-1)!; return f.store.analysis.command(f.token, { type: "SelectAnalysisDeclarations", commandId: "select", jobId: job.jobId, expectedJobRevision: job.jobRevision, corpusId: job.corpusId!, inventoryId: job.inventoryId!, declarationIds: declarations(view).map(item => item.id) }); };
test("owned context/inventory/compute admits exact both-side facts, clarification CAS and DB-only source readback", async () => {
    const f = semanticFixture(), runner = createAnalysisRunner(f.store);
    let closed = false;
    const query = () => f.store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId });
    try {
        const original = JSON.stringify(f.store.review({ kind: "user", actorId: "local-user" }, "r").snapshot);
        assert.equal(f.store.analysis.command(f.token, f.request).state, "applied");
        runner.wake();
        await eventually(() => query().jobs.at(-1)?.state === "awaiting_declarations");
        const choosing = query();
        assert.equal(choosing.preparation?.corpus?.accounts.base.enumeration, "complete");
        assert.ok(choosing.preparation?.corpus?.ledger.some(row => row.path === "caller.ts"));
        assert.equal(select(f, choosing).state, "applied");
        runner.wake();
        await eventually(() => query().jobs.at(-1)?.state === "admitted");
        const admitted = query(), analysis = admitted.analysis;
        assert.equal(analysis?.status, "analyzed");
        if (analysis?.status !== "analyzed")
            return;
        assert.equal(admitted.graphRevision, 1);
        assert.equal(admitted.jobs.at(-1)?.admission?.result.analysisId, analysis.analysisId);
        assert.ok(analysis.edges.some(edge => analysis.nodes.find(node => node.id === edge.caller)?.name === "caller"));
        assert.equal(JSON.stringify(f.store.review({ kind: "user", actorId: "local-user" }, "r").snapshot), original);
        const primary = analysis.nodes.find(node => node.name === "callee")!.declaration;
        const clarification = { type: "PutGraphClarification" as const, commandId: "clarify", reviewId: "r", snapshotId: f.snapshot.snapshotId, analysisId: analysis.analysisId, expectedGraphRevision: 1, text: "The unchanged caller receives the changed return value; runtime consequences still need evidence.", kind: "interpretation" as const, primary, evidence: [] };
        const first = f.store.analysis.command(f.token, clarification);
        assert.equal(first.state, "applied");
        assert.deepEqual(f.store.analysis.command(f.token, clarification), first);
        assert.equal(f.store.analysis.command(f.token, { ...clarification, commandId: "competing" }).error, "graph_conflict");
        assert.equal(query().clarifications.length, 1);
        assert.equal(f.store.analysis.command(f.token, { ...clarification, commandId: "wrong-anchor", expectedGraphRevision: 2, primary: { ...primary, contentHash: "f".repeat(64) } }).error, "invalid_analysis_anchor");
        const sourceMeta = admitted.corpus!.sources.find(item => item.path === "caller.ts")!, sourceInput = { reviewId: "r", snapshotId: f.snapshot.snapshotId, corpusId: admitted.corpus!.corpusId, side: sourceMeta.side, path: sourceMeta.path, contentHash: sourceMeta.contentHash };
        const source = f.store.analysis.source(f.token, sourceInput);
        assert.match(source.content, /callee\(\)/);
        const newRequest = f.store.analysis.command(f.token, { ...f.request, commandId: "new-generation", expectedAnalysisGeneration: 1 });
        assert.equal(newRequest.state, "applied");
        assert.equal(query().analysis?.analysisId, analysis.analysisId);
        assert.equal(query().preparation?.inventory, null);
        // Stop before the new context claim; already admitted evidence is independently durable.
        await runner.stop();
        f.store.close();
        closed = true;
        rmSync(join(f.root, ".git"), { recursive: true, force: true });
        writeFileSync(join(f.root, "caller.ts"), "dirty unrelated checkout");
        const reopened = createStore(f.filename);
        assert.equal(reopened.analysis.source(f.token, sourceInput).content, source.content);
        const restored = reopened.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId, analysisId: analysis.analysisId });
        assert.equal(restored.clarifications.length, 1);
        assert.equal(restored.graphRevision, 2);
        assert.equal(restored.analysis?.analysisId, analysis.analysisId);
        reopened.close();
    }
    finally {
        await runner.stop();
        if (!closed)
            f.store.close();
        rmSync(f.root, { recursive: true, force: true });
    }
});
test("cancel-before-admit rejects a valid terminated worker witness without partial graph mutation", async () => {
    const f = semanticFixture(), runner = createAnalysisRunner(f.store), query = () => f.store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId });
    try {
        f.store.analysis.command(f.token, f.request);
        runner.wake();
        await eventually(() => query().jobs.at(-1)?.state === "awaiting_declarations");
        await runner.stop();
        assert.equal(select(f, query()).state, "applied");
        const owner = f.store.analysis.beginOwner(), claim = f.store.analysis.claim(owner);
        assert.ok(claim);
        const request = f.store.analysis.workerRequest(claim.grant), outcome = await runAnalysisWorker(request, { recordProcess: observation => f.store.analysis.recordProcess(claim.grant, observation), cancelled: () => f.store.analysis.cancelled(claim.grant) });
        const job = query().jobs.at(-1)!;
        assert.equal(f.store.analysis.command(f.token, { type: "CancelAnalysis", commandId: "cancel", jobId: job.jobId, expectedJobRevision: job.jobRevision }).state, "applied");
        assert.throws(() => f.store.analysis.finishWorker(claim.grant, outcome.envelope, outcome.witness), /analysis_cancelled/);
        assert.equal(query().graphRevision, 0);
        assert.equal(query().analysis, null);
        f.store.analysis.fail(claim.grant, "analysis_cancelled", true);
        assert.equal(query().jobs.at(-1)?.state, "cancelled");
    }
    finally {
        await runner.stop();
        f.cleanup();
    }
});
test("context phase limit is unavailable with unknown unvisited coverage and releases only confirmed slot", async () => {
    const f = semanticFixture({ maxContextLaunches: 1 }), runner = createAnalysisRunner(f.store);
    try {
        f.store.analysis.command(f.token, f.request);
        runner.wake();
        await eventually(() => f.store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId }).jobs.at(-1)?.state === "unavailable");
        const view = f.store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId });
        assert.equal(view.jobs.at(-1)?.reason, "phase_limit");
        assert.equal(view.preparation?.corpus, null);
        assert.equal(view.analysis, null);
        assert.equal(view.graphRevision, 0);
        assert.equal(view.jobs[0]?.invocations[0]?.processes.length, 1);
        assert.equal(view.jobs[0]?.invocations[0]?.processes[0]?.state, "exited");
    }
    finally {
        await runner.stop();
        f.cleanup();
    }
});
