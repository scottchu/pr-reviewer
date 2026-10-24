import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createStore } from "../src/storage/public.ts";
import type { AnalysisLimits } from "../src/storage/public.ts";
import type { Snapshot } from "../src/domain/public.ts";
export const semanticFixture = (limits?: AnalysisLimits) => {
    const root = mkdtempSync(join(tmpdir(), "pr-reviewer-semantic-fixture-"));
    const git = (...args: string[]) => execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", "-c", "commit.gpgsign=false", ...args], { env: { ...process.env, GIT_AUTHOR_NAME: "Semantic fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid", GIT_COMMITTER_NAME: "Semantic fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git("init", "-q");
    const baseText = '\uFEFFexport const callee = () => "😀1";\r\n', headText = '\uFEFFexport const callee = () => "😀2";\r\n';
    writeFileSync(join(root, "callee.ts"), baseText);
    writeFileSync(join(root, "caller.ts"), 'import {callee} from "./callee";\nexport const caller = () => callee();\n');
    writeFileSync(join(root, "unknown.ts"), 'export const unknown = (object:any) => object.runtime();\n');
    git("add", ".");
    git("commit", "-qm", "base");
    const baseSha = git("rev-parse", "HEAD");
    writeFileSync(join(root, "callee.ts"), headText);
    git("add", ".");
    git("commit", "-qm", "head");
    const headSha = git("rev-parse", "HEAD");
    const sources = (["base", "head"] as const).map(side => { const content = side === "base" ? baseText : headText; return { side, path: "callee.ts", content, hash: createHash("sha256").update(content).digest("hex"), lineCount: 1 }; });
    const snapshot: Snapshot = { snapshotId: createHash("sha256").update(JSON.stringify({ baseSha, headSha, sources })).digest("hex"), repository: "scottchu/pr-reviewer", prUrl: "https://github.com/scottchu/pr-reviewer/pull/1", prNumber: 1, baseSha, headSha, sources };
    const filename = join(root, "review.sqlite"), store = createStore(filename, limits ? { analysisLimits: limits } : {});
    store.prepare("r", snapshot);
    const token = store.issueUser();
    const request = { type: "RequestAnalysis" as const, commandId: "request", reviewId: "r", snapshotId: snapshot.snapshotId, expectedAnalysisGeneration: 0, worktree: root, sourceProject: "scottchu/pr-reviewer", priorityPaths: { base: ["callee.ts"], head: ["callee.ts"] } };
    return { root, git, filename, store, token, snapshot, request, cleanup: () => { store.close(); rmSync(root, { recursive: true, force: true }); } };
};
export const eventually = async (check: () => boolean, timeout = 5000) => { const deadline = Date.now() + timeout; while (!check()) {
    if (Date.now() > deadline)
        throw new Error("fixture_timeout");
    await new Promise(resolve => setTimeout(resolve, 15));
} };
