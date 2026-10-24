import {readFileSync,existsSync} from "node:fs";
import {z} from "zod";
import {createStore} from "../src/storage/public.ts";
import {canonical} from "../src/domain/public.ts";
import {manualSourceInputSchema as inputSchema,buildSnapshot,manualInputFor} from "../src/source-preparation/public.ts";
import {dataRoot,files,writePrivate} from "./local.ts";
export {buildSnapshot} from "../src/source-preparation/public.ts";
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
        const projection=persisted.review(owner,reviews[0].reviewId);
        const originalId=projection.snapshotSummaries?.[0]?.snapshotId??projection.snapshot.snapshotId;
        const snapshot=persisted.review(owner,reviews[0].reviewId,0,originalId).snapshot;
        const stored=persisted.preparedInput(reviews[0].reviewId);
        retained = inputSchema.parse(stored??manualInputFor(snapshot));
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
  let snapshot = buildSnapshot(spec);
  const reviewId = `pr-${spec.prNumber}`;
  const store = createStore(paths.database);
  try {
    const existing = store.list({ kind: "user", actorId: "local-user" });
    if (existing.some((review) => review.reviewId !== reviewId))
      throw new Error("command_conflict: different target already prepared");
    store.prepare(reviewId, snapshot, spec);
    snapshot=store.review({kind:"user",actorId:"local-user"},reviewId).snapshot;
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
