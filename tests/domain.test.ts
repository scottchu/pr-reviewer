import { test, expect } from "bun:test";
import {
  anchorSchema,
  canonical,
  validateAnchor,
  textValue,
} from "../src/domain/public.ts";
const source = {
  path: "docs/README.md",
  side: "head" as const,
  content: "one\ntwo\n",
  hash: "hash",
  lineCount: 2,
};
test("01-D anchor side/path/span is exact", () => {
  const anchor = anchorSchema.parse({
    snapshotId: "s",
    side: "head",
    path: source.path,
    startLine: 1,
    endLine: 2,
  });
  expect(validateAnchor("s", [source], anchor)).toBe(true);
  for (const changed of [
    { snapshotId: "wrong" },
    { side: "base" as const },
    { path: "missing" },
    { startLine: 0 },
    { endLine: 3 },
    { startLine: 2, endLine: 1 },
  ])
    expect(validateAnchor("s", [source], { ...anchor, ...changed })).toBe(
      false,
    );
});
test("01-C canonical payload ordering and text constraints", () => {
  expect(canonical({ b: 2, a: { d: 4, c: 3 } })).toBe(
    canonical({ a: { c: 3, d: 4 }, b: 2 }),
  );
  expect(textValue("  question ", 16)).toBe("question");
  expect(() => textValue(" ", 16)).toThrow();
  expect(() => textValue("🐱".repeat(5), 16)).toThrow();
});

test("source comparison preserves duplicate identities and labels replacement blocks", async () => {
  const { compareSources } = await import("../src/domain/public.ts");
  const source = (content: string, side: "base" | "head") => ({
    path: "x",
    content,
    side,
    hash: "h",
    lineCount: content.split("\n").length,
  });
  const [base, head] = compareSources(
    source("same\nrepeat\nrepeat\nold\nend", "base"),
    source("same\nrepeat\nnew\nend\nextra", "head"),
  );
  expect(base.lines.map((l) => l.status)).toEqual([
    "unchanged",
    "unchanged",
    "modified",
    "modified",
    "unchanged",
  ]);
  expect(head.lines.map((l) => l.status)).toEqual([
    "unchanged",
    "unchanged",
    "modified",
    "unchanged",
    "added",
  ]);
});
