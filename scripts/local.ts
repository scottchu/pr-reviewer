import {
  mkdirSync,
  realpathSync,
  statSync,
  writeFileSync,
  renameSync,
  openSync,
  closeSync,
  readFileSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, sep, join, dirname } from "node:path";
const rejectGitRoot = (path: string) => {
  let parent = path;
  while (!existsSync(parent)) {
    const next = dirname(parent);
    if (next === parent) break;
    parent = next;
  }
  parent = realpathSync(parent);
  const env = { ...process.env };
  for (const key of [
    "GIT_DIR",
    "GIT_WORK_TREE",
    "GIT_COMMON_DIR",
    "GIT_CEILING_DIRECTORIES",
    "GIT_DISCOVERY_ACROSS_FILESYSTEM",
  ])
    delete env[key];
  let inside = false;
  try {
    execFileSync("git", ["-C", parent, "rev-parse", "--absolute-git-dir"], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    inside = true;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("status" in error) ||
      error.status !== 128
    )
      throw error;
  }
  if (inside)
    throw new Error("REVIEW_DATA_DIR must be outside every Git repository");
};
export const dataRoot = () => {
  const value = process.env.REVIEW_DATA_DIR;
  if (!value)
    throw new Error(
      "REVIEW_DATA_DIR must name a unique task-owned directory outside Git and .decompozr",
    );
  const root = resolve(value),
    cwd = realpathSync(process.cwd());
  if (
    root === cwd ||
    root.startsWith(cwd + sep) ||
    root.split(sep).includes(".decompozr")
  )
    throw new Error("REVIEW_DATA_DIR must be outside Git and .decompozr");
  rejectGitRoot(root);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const real = realpathSync(root);
  if (
    real === cwd ||
    real.startsWith(cwd + sep) ||
    real.split(sep).includes(".decompozr")
  )
    throw new Error("unsafe data root");
  rejectGitRoot(real);
  if ((statSync(root).mode & 0o077) !== 0)
    throw new Error("data root must be private to its owner (mode 0700)");
  if (statSync(root).uid !== process.getuid?.())
    throw new Error("data root is not owned by this user");
  return real;
};
export const writePrivate = (path: string, value: unknown) => {
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  renameSync(temp, path);
};
export const files = (root: string) => ({
  database: join(root, "review.sqlite"),
  runtime: join(root, "runtime.json"),
  user: join(root, "local-user.json"),
  snapshot: join(root, "snapshot.json"),
  input: join(root, "source-input.json"),
});
export type Runtime = {
  pid: number;
  processStart: string;
  instanceId: string;
  gatewayUrl: string;
  uiUrl: string;
  userCredentialRef?: string; // Legacy manifests only; preserved, never required.
  sourceCommit: string;
  sourceDirty: boolean;
  reviewId: string;
  startedAt: string;
  status: "running" | "stopped";
};

export const acquireRuntime = (root: string) => {
  const lock = join(root, "runtime.lock");
  const claim = () => {
    const fd = openSync(lock, "wx", 0o600);
    writeFileSync(fd, JSON.stringify({ pid: process.pid }));
    closeSync(fd);
  };
  try {
    claim();
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "EEXIST"
    )
      throw error;
    const old = JSON.parse(readFileSync(lock, "utf8")) as { pid: number };
    try {
      process.kill(old.pid, 0);
      throw new Error(
        "data root already has an active or uncertain runtime owner",
      );
    } catch (probe) {
      if (
        !(probe instanceof Error) ||
        !("code" in probe) ||
        probe.code !== "ESRCH"
      )
        throw probe;
    }
    unlinkSync(lock);
    claim();
  }
  return () => {
    const current = JSON.parse(readFileSync(lock, "utf8")) as { pid: number };
    if (current.pid === process.pid) unlinkSync(lock);
  };
};
