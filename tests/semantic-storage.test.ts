import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/storage/public.ts";
import type { Snapshot } from "../src/domain/public.ts";
const snapshot: Snapshot = { snapshotId: "semantic", repository: "owner/repo", prUrl: "https://github.com/owner/repo/pull/1", prNumber: 1, baseSha: "a".repeat(40), headSha: "b".repeat(40), sources: [{ side: "head", path: "a.ts", content: "export const a=()=>1;\n", hash: createHash("sha256").update("export const a=()=>1;\n").digest("hex"), lineCount: 1 }] };
const setup = () => { const root = mkdtempSync(join(tmpdir(), "pr-reviewer-semantic-store-")), filename = join(root, "db.sqlite"), store = createStore(filename); store.prepare("r", snapshot); const token = store.issueUser(); return { root, filename, store, token, cleanup: () => { store.close(); rmSync(root, { recursive: true, force: true }); } }; };
const request = { type: "RequestAnalysis" as const, commandId: "request", reviewId: "r", snapshotId: snapshot.snapshotId, expectedAnalysisGeneration: 0, worktree: "/owner-only/task", sourceProject: "owner/repo" };
test("analysis generation/receipts are independent of questions and no private locator reaches query", () => {
    const f = setup();
    try {
        const result = f.store.analysis.command(f.token, request);
        assert.equal(result.state, "applied");
        assert.equal(result.analysisGeneration, 1);
        assert.equal(result.graphRevision, 0);
        assert.deepEqual(f.store.analysis.command(f.token, request), result);
        assert.equal(f.store.analysis.command(f.token, { ...request, worktree: "/changed" }).error, "command_conflict");
        assert.equal(f.store.analysis.command(f.token, { ...request, commandId: "stale" }).error, "analysis_generation_conflict");
        const view = f.store.analysis.query(f.token, { reviewId: "r", snapshotId: snapshot.snapshotId });
        assert.equal(view.jobs.length, 1);
        assert.equal(JSON.stringify(view).includes("/owner-only/task"), false);
        assert.equal(JSON.stringify(view).includes(f.token), false);
        f.store.command({ kind: "user", actorId: "local-user" }, { type: "AskQuestion", commandId: "ask", reviewId: "r", anchor: { snapshotId: snapshot.snapshotId, side: "head", path: "a.ts", startLine: 1, endLine: 1 }, text: "Still responsive" });
        assert.equal(f.store.analysis.query(f.token, { reviewId: "r", snapshotId: snapshot.snapshotId }).graphRevision, 0);
        assert.throws(() => f.store.analysis.query(f.token, { reviewId: "r", snapshotId: snapshot.snapshotId, minimumGraphRevision: 1 }), /revision_unavailable/);
    }
    finally {
        f.cleanup();
    }
});
test("analysis/import distinct grants share one lease, startup uncertainty prevents replay", () => {
    const f = setup();
    try {
        f.store.analysis.command(f.token, request);
        const owner = f.store.analysis.beginOwner(), imports = f.store.imports.beginOwner();
        const claim = f.store.analysis.claim(owner);
        assert.ok(claim);
        assert.equal(f.store.analysis.claim(owner), null);
        assert.throws(() => f.store.analysis.launchLimit({} as never), /stale_analysis_runner/);
        f.store.imports.command(f.token, { type: "RequestImport", commandId: "import", path: "/task" });
        assert.equal(f.store.imports.claim(imports), null);
        assert.equal(f.store.analysis.launchLimit(claim.grant), 2048);
        assert.throws(() => f.store.analysis.recordProcess(claim.grant, { ordinal: 1, executable: "node", state: "requested" }), /analysis_phase_conflict/);
        f.store.analysis.recordProcess(claim.grant, { ordinal: 1, executable: "git", state: "requested" });
        f.store.analysis.fail(claim.grant, "termination_unknown", false);
        assert.equal(f.store.imports.claim(imports), null);
        const replacement = f.store.analysis.beginOwner();
        assert.equal(f.store.analysis.unknown(replacement).length, 1);
        assert.equal(f.store.analysis.claim(replacement), null);
        assert.throws(() => f.store.analysis.cancelled(claim.grant), /stale_analysis_runner/);
        f.store.analysis.confirmQuiescent(replacement, claim.job.jobId);
        assert.ok(f.store.imports.claim(imports));
    }
    finally {
        f.cleanup();
    }
});
test("unclaimed phases survive DB restart and cancellation CAS is exact", () => {
    const f = setup();
    try {
        const created = f.store.analysis.command(f.token, request);
        f.store.close();
        const reopened = createStore(f.filename);
        const owner = reopened.analysis.beginOwner();
        const claim = reopened.analysis.claim(owner);
        assert.ok(claim);
        const view = reopened.analysis.query(f.token, { reviewId: "r", snapshotId: snapshot.snapshotId });
        const revision = view.jobs[0]!.jobRevision;
        assert.equal(reopened.analysis.command(f.token, { type: "CancelAnalysis", commandId: "stale-cancel", jobId: created.jobId!, expectedJobRevision: revision - 1 }).error, "analysis_job_conflict");
        const cancel = reopened.analysis.command(f.token, { type: "CancelAnalysis", commandId: "cancel", jobId: created.jobId!, expectedJobRevision: revision });
        assert.equal(cancel.state, "applied");
        assert.equal(reopened.analysis.cancelled(claim.grant), true);
        reopened.analysis.fail(claim.grant, "cancelled", true);
        assert.equal(reopened.analysis.query(f.token, { reviewId: "r", snapshotId: snapshot.snapshotId }).jobs[0]!.state, "cancelled");
        reopened.close();
    }
    finally {
        rmSync(f.root, { recursive: true, force: true });
    }
});

test("bounded pending choices and shared epoch cannot be reset by the other runner",()=>{
 const f=setup();try{
  for(let index=0;index<9;index++){
   const reviewId=`r${index}`;f.store.prepare(reviewId,snapshot);
   const receipt=f.store.analysis.command(f.token,{...request,reviewId,commandId:`queue-${index}`});assert.equal(receipt.state,index<8?"applied":"rejected");if(index===8)assert.equal(receipt.error,"analysis_queue_full");
  }
  const owner=f.store.analysis.beginOwner(),claim=f.store.analysis.claim(owner);assert.ok(claim);f.store.imports.beginOwner();assert.equal(f.store.analysis.cancelled(claim.grant),false);f.store.analysis.fail(claim.grant,"known_no_effect_failure",true);assert.ok(f.store.analysis.claim(owner));
 }finally{f.cleanup();}
});
