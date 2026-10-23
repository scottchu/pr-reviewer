import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";
import { createStore } from "../src/storage/public.ts";
import { canonical } from "../src/domain/public.ts";
import { dataRoot, files, writePrivate } from "./local.ts";
import type { Snapshot } from "../src/domain/public.ts";
const inputSchema = z
  .object({
    prNumber: z.number().int().positive(),
    prUrl: z.url(),
    baseSha: z.string().regex(/^[a-f0-9]{40}$/),
    headSha: z.string().regex(/^[a-f0-9]{40}$/),
    path: z
      .string()
      .min(1)
      .max(1024)
      .refine(
        (path) =>
          !path.startsWith("/") &&
          !path.split("/").includes("..") &&
          !path.includes("\0"),
      ),
    title: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
const bootstrap: z.infer<typeof inputSchema> = {
  prNumber: 14,
  prUrl: "https://github.com/scottchu/pr-reviewer/pull/14",
  baseSha: "a6d63c1e46424cb979ee912aa993ad964835c287",
  headSha: "fd6c5fb26a325c8318087c0f058de247a55e6c07",
  path: "docs/README.md",
};
export const prepareSource = (root: string) => {
  const paths = files(root);
  let retained: z.infer<typeof inputSchema> | null = null;
  if (existsSync(paths.input))
    retained = inputSchema.parse(JSON.parse(readFileSync(paths.input, "utf8")));
  else if (existsSync(paths.database)) {
    const persisted = createStore(paths.database);
    try {
      const owner = { kind: "user" as const, actorId: "local-user" };
      const reviews = persisted.list(owner);
      if (reviews.length > 1)
        throw new Error(
          "command_conflict: data root has multiple prepared targets",
        );
      if (reviews[0]) {
        const snapshot = persisted.review(owner, reviews[0].reviewId).snapshot;
        retained = inputSchema.parse({
          prNumber: snapshot.prNumber,
          prUrl: snapshot.prUrl,
          baseSha: snapshot.baseSha,
          headSha: snapshot.headSha,
          path: snapshot.sources[0]?.path,
          ...(snapshot.title ? { title: snapshot.title } : {}),
        });
      }
    } finally {
      persisted.close();
    }
  }
  const spec = process.env.REVIEW_SOURCE_SPEC
    ? inputSchema.parse(
        JSON.parse(readFileSync(process.env.REVIEW_SOURCE_SPEC, "utf8")),
      )
    : (retained ?? bootstrap);
  if (
    spec.prUrl !==
    `https://github.com/scottchu/pr-reviewer/pull/${spec.prNumber}`
  )
    throw new Error(
      "invalid_request: only explicitly selected real project PRs",
    );
  if (retained && canonical(retained) !== canonical(spec))
    throw new Error(
      "command_conflict: use a fresh data root for another prepared target",
    );
  const { baseSha, headSha, path } = spec;
  const sources = (["base", "head"] as const).map((side) => {
    const sha = side === "base" ? baseSha : headSha;
    if (
      execFileSync("git", ["cat-file", "-t", sha], {
        encoding: "utf8",
      }).trim() !== "commit"
    )
      throw new Error("source_unavailable: pinned object must be a commit");
    const content = execFileSync("git", ["show", `${sha}:${path}`], {
      encoding: "utf8",
      maxBuffer: 1048576,
    });
    if (content.includes("\0"))
      throw new Error("source_unavailable: binary content");
    const lineCount = content.endsWith("\n")
      ? content.split("\n").length - 1
      : content.split("\n").length;
    if (!content || lineCount < 1)
      throw new Error("source_unavailable: empty content");
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
    prUrl: spec.prUrl,
    prNumber: spec.prNumber,
    baseSha,
    headSha,
    sources,
    ...(spec.title ? { title: spec.title } : {}),
  };
  const reviewId = `pr-${spec.prNumber}`;
  const store = createStore(paths.database);
  try {
    const existing = store.list({ kind: "user", actorId: "local-user" });
    if (existing.some((review) => review.reviewId !== reviewId))
      throw new Error("command_conflict: different target already prepared");
    store.prepare(reviewId, snapshot);
  } finally {
    store.close();
  }
  writePrivate(paths.input, spec);
  writePrivate(paths.snapshot, snapshot);
  return snapshot;
};
if (process.argv[1]?.endsWith("/prepare.ts")) {
  const snapshot = prepareSource(dataRoot());
  console.log(
    JSON.stringify(
      {
        reviewId: `pr-${snapshot.prNumber}`,
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
