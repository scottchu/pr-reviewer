import { test } from "node:test";
import assert from "node:assert/strict";
import { semanticFixture } from "./semantic-fixture.ts";
import { acquirePreparedContext } from "../src/source-preparation/public.ts";
import { createNodeEffects } from "../src/source-acquisition/public.ts";
import { semanticCanonical } from "../src/domain/public.ts";
import { createStore } from "../src/storage/public.ts";
import { rmSync } from "node:fs";
test("canonical semantic corpus quota admits exact boundary and rejects one byte over atomically", async () => {
    const f = semanticFixture();
    let closed = false;
    try {
        const review = f.store.review({ kind: "user", actorId: "local-user" }, "r"), probe = await acquirePreparedContext({ jobId: "probe", review, snapshotId: f.snapshot.snapshotId, worktree: f.root, sourceProject: f.request.sourceProject, priorityPaths: f.request.priorityPaths }, createNodeEffects());
        assert.equal(probe.kind, "prepared");
        if (probe.kind !== "prepared")
            return;
        const bytes = Buffer.byteLength(semanticCanonical({ corpus: probe.corpus, issues: probe.issues }), "utf8");
        f.store.close();
        closed = true;
        for (const limit of [bytes - 1, bytes]) {
            const store = createStore(f.filename, { analysisLimits: { maxRetainedBytes: limit } }), receipt = store.analysis.command(f.token, { ...f.request, commandId: `quota-${limit}`, expectedAnalysisGeneration: limit === bytes - 1 ? 0 : 1 }), owner = store.analysis.beginOwner(), claim = store.analysis.claim(owner);
            assert.ok(claim);
            assert.equal(receipt.state, "applied");
            const input = store.analysis.contextInput(claim.grant), prepared = await acquirePreparedContext(input, createNodeEffects());
            assert.equal(prepared.kind, "prepared");
            if (prepared.kind !== "prepared")
                throw new Error("fixture_context");
            if (limit < bytes) {
                assert.throws(() => store.analysis.finishContext(claim.grant, { corpus: prepared.corpus, issues: prepared.issues }, prepared.witness), /retained_semantic_limit/);
                assert.equal(store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId }).preparation?.corpus, null);
                store.analysis.fail(claim.grant, "retained_semantic_limit", true);
            }
            else {
                assert.throws(() => store.analysis.finishContext(claim.grant, { corpus: prepared.corpus, issues: prepared.issues }, {} as never), /source_identity_conflict/);
                store.analysis.finishContext(claim.grant, { corpus: prepared.corpus, issues: prepared.issues }, prepared.witness);
                assert.equal(store.analysis.query(f.token, { reviewId: "r", snapshotId: f.snapshot.snapshotId }).preparation?.corpus?.corpusId, probe.corpus.corpusId);
            }
            store.close();
        }
    }
    finally {
        if (!closed)
            f.store.close();
        rmSync(f.root, { recursive: true, force: true });
    }
});
