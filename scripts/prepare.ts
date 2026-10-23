import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createStore } from "../src/storage/public.ts";
import { dataRoot, files, writePrivate } from "./local.ts";
import type { Snapshot } from "../src/domain/public.ts";
export const prepareSource = (root: string) => {
  const paths = files(root);
  const baseSha = "a6d63c1e46424cb979ee912aa993ad964835c287",
    headSha = "fd6c5fb26a325c8318087c0f058de247a55e6c07",
    path = "docs/README.md";
  const sources = (["base", "head"] as const).map((side) => {
    const sha = side === "base" ? baseSha : headSha;
    const content = execFileSync("git", ["show", `${sha}:${path}`], {
      encoding: "utf8",
      maxBuffer: 1048576,
    });
    if (content.includes("\0"))
      throw new Error("source_unavailable: binary content");
    const lineCount = content.endsWith("\n")
      ? content.split("\n").length - 1
      : content.split("\n").length;
    if (lineCount < (side === "head" ? 25 : 15))
      throw new Error(
        "source_unavailable: unexpected historical source bounds",
      );
    return {
      path,
      side,
      content,
      lineCount,
      hash: createHash("sha256").update(content, "utf8").digest("hex"),
    };
  });
  const snapshot: Snapshot = {
    snapshotId: createHash("sha256")
      .update(JSON.stringify({ baseSha, headSha, sources }))
      .digest("hex"),
    repository: "scottchu/pr-reviewer",
    prUrl: "https://github.com/scottchu/pr-reviewer/pull/14",
    prNumber: 14,
    baseSha,
    headSha,
    sources,
  };
  const store = createStore(paths.database);
  try {
    store.prepare("pr-14", snapshot);
  } finally {
    store.close();
  }
  writePrivate(paths.snapshot, snapshot);
  return snapshot;
};
if (process.argv[1]?.endsWith("/prepare.ts")) {
  const snapshot = prepareSource(dataRoot());
  console.log(
    JSON.stringify(
      {
        reviewId: "pr-14",
        snapshotId: snapshot.snapshotId,
        sources: snapshot.sources.map(({ path, side, hash, lineCount }) => ({
          path,
          side,
          hash,
          lineCount,
        })),
      },
      null,
      2,
    ),
  );
}
