import { describe, expect, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import ts from "typescript-analysis";
import { analyzeNeighborhood, DEFAULT_BUDGETS, type AnalysisInput, type AnalysisResult, type Seed, type Side, type SourceEntry } from "../src/source-analysis/public.ts";

// Controlled synthetic source, never acquired Git or runtime provenance.
const hash = (content: string) => createHash("sha256").update(content).digest("hex");
const entry = (path: string, content: string, side: Side = "head", role: SourceEntry["role"] = "changed"): SourceEntry => ({
  side, path, commit: side === "base" ? "a".repeat(40) : "b".repeat(40), role, selected: true,
  source: { content, contentHash: hash(content) },
});
const seed = (source: SourceEntry, declaration: string): Seed => {
  const start = source.source!.content.indexOf(declaration);
  if (start < 0) throw new Error(`Missing fixture declaration: ${declaration}`);
  return { side: source.side, path: source.path, contentHash: source.source!.contentHash, start, end: start + declaration.length };
};
const input = (sources: readonly SourceEntry[], seeds: readonly Seed[] = []): AnalysisInput => ({
  contract: "source-neighborhood-v1", snapshotId: "synthetic-snapshot", change: { repository: "fixture/repo", provider: "fixture", changeId: "1" },
  commits: { base: "a".repeat(40), head: "b".repeat(40) },
  corpus: { base: { commit: "a".repeat(40), inventory: "selected-context", acquisition: "controlled-fixture" }, head: { commit: "b".repeat(40), inventory: "selected-context", acquisition: "controlled-fixture" } },
  // Fact-index fixtures still supply an explicit unsupported seed; no name guessing.
  sources, seeds: seeds.length ? seeds : [{ side: sources[0]?.side ?? "head", path: sources[0]?.path ?? "absent.ts", contentHash: sources[0]?.source?.contentHash ?? hash("absent"), start: 0, end: 1 }], profile: { name: "repository-static-v1" }, budgets: DEFAULT_BUDGETS,
});
const analyzed = (value: AnalysisInput) => {
  const result = analyzeNeighborhood(value);
  expect(result.status).toBe("analyzed");
  if (result.status !== "analyzed") throw new Error(JSON.stringify(result));
  return result;
};
const facts = (result: Extract<AnalysisResult, { status: "analyzed" }>) => result.edges.map(edge => {
  const caller = result.nodes.find(node => node.id === edge.caller)!;
  const callee = result.nodes.find(node => node.id === edge.callee)!;
  return `${caller.declaration.side}:${caller.declaration.path}:${caller.name}->${callee.declaration.path}:${callee.name}:${edge.sites.map(site => site.anchor.start).join(",")}`;
}).sort();
const reasons = (result: Extract<AnalysisResult, { status: "analyzed" }>): string[] => result.unresolved.map(site => site.reason).sort();
const siteFacts = (result: Extract<AnalysisResult, { status: "analyzed" }>, request: AnalysisInput) => result.edges.flatMap(edge => edge.sites.map(site => ({
  caller: result.nodes.find(node => node.id === edge.caller)!.name,
  callee: result.nodes.find(node => node.id === edge.callee)!.name,
  text: request.sources.find(source => source.side === site.anchor.side && source.path === site.anchor.path)!.source!.content.slice(site.anchor.start, site.anchor.end),
  side: site.anchor.side, path: site.anchor.path, start: site.anchor.start, end: site.anchor.end,
})));
const noGraph = (result: AnalysisResult, reason: Extract<AnalysisResult, { status: "unavailable" }>["reason"]) => {
  expect(result.status).toBe("unavailable");
  if (result.status === "unavailable") expect(result.reason).toBe(reason);
  expect("edges" in result).toBe(false);
  expect("nodes" in result).toBe(false);
};

describe("source-neighborhood-v1 fixed acceptance corpus", () => {
  test("P01 exact one-hop base/head relationships include unchanged callers and callees", () => {
    const sources = (["base", "head"] as const).flatMap(side => [
      entry("decide.ts", `import { normalize } from './normalize';\n${side === "head" ? 'const validate = () => true;\n' : ''}export const decide = () => { ${side === "head" ? 'validate(); ' : ''}return normalize(); };`, side),
      entry("review.ts", "import { decide } from './decide'; export const review = () => decide();", side, "context"),
      entry("normalize.ts", "export const normalize = () => 1;", side, "context"),
    ]);
    const selected = sources.filter(source => source.path === "decide.ts");
    const result = analyzed(input(sources, selected.map(source => seed(source, source.side === "head" ? "decide = () => { validate(); return normalize(); }" : "decide = () => { return normalize(); }"))));
    expect(facts(result)).toEqual([
      ...(["base", "head"] as const).flatMap(side => [
        `${side}:decide.ts:decide->normalize.ts:normalize:${sources.find(s => s.side === side && s.path === "decide.ts")!.source!.content.indexOf("normalize()")}`,
        `${side}:review.ts:review->decide.ts:decide:63`,
      ]), `head:decide.ts:decide->decide.ts:validate:${selected[1]!.source!.content.indexOf("validate()")}`,
    ].sort());
    expect(result.neighborhoods.map(n => [n.incoming.length, n.outgoing.length])).toEqual([[1, 1], [1, 2]]);
    expect(result.edges.every(edge => edge.target.side === edge.sites[0]!.anchor.side)).toBe(true);
  });

  test("P02 lexical shadowing/import rename exact facts, mutable and written bindings rejected", () => {
    const outer = entry("outer.ts", "export const format = () => 1;");
    const text = "import { format as imported } from './outer'; const other = () => imported(); const scope = () => { const format = () => 2; const inner = () => format(); return inner(); }; let mutable = () => 3; mutable(); const written = () => 4; written = () => 5; written();";
    const source = entry("scope.ts", text);
    const result = analyzed(input([outer, source]));
    expect(facts(result)).toEqual([
      `head:scope.ts:other->outer.ts:format:${text.indexOf("imported()")}`,
      `head:scope.ts:inner->scope.ts:format:${text.indexOf("format()")}`,
      `head:scope.ts:scope->scope.ts:inner:${text.indexOf("inner()")}`,
    ].sort());
    expect(reasons(result)).toEqual(["mutable_binding", "mutable_binding"]);
  });

  test("P02 assignments through destructuring/iteration and parameter shadowing never create false calls", () => {
    const source = entry("writes.ts", "const a = () => 1; const b = () => 2; const replacement = () => 3; ({ a } = { a: replacement }); for (b of [replacement]) {} a(); b(); const caller = (replacement: () => number) => replacement();");
    const result = analyzed(input([source]));
    expect(result.edges).toEqual([]);
    expect(reasons(result)).toEqual(["mutable_binding", "mutable_binding", "unsupported_binding"]);
    expect(result.unresolved.map(site => source.source!.content.slice(site.anchor.start, site.anchor.end))).toEqual(["a()", "b()", "replacement()"]);
  });

  test("P02 review regression: assertion/non-null assignment targets cannot retain definite bindings", () => {
    for (const target of ["(target as () => number)", "(<() => number>target)", "target!", "(target satisfies () => number)"]) {
      const source = entry("wrapped-write.ts", `function target() { return 1; } function replacement() { return 2; } ${target} = replacement; target(); replacement(); const untouched = () => { const target = () => 3; return target(); };`);
      const request = input([source]);
      const result = analyzed(request);
      expect(result.edges.map(edge => [result.nodes.find(node => node.id === edge.caller)!.name, edge.target.start, edge.sites.map(site => source.source!.content.slice(site.anchor.start, site.anchor.end))])).toEqual([
        ["<module>", source.source!.content.indexOf("function replacement"), ["replacement()"]],
        ["untouched", source.source!.content.indexOf("target = () => 3"), ["target()"]],
      ]);
      expect(result.unresolved.map(site => [source.source!.content.slice(site.anchor.start, site.anchor.end), site.reason])).toEqual([["target()", "mutable_binding"]]);
    }
  });

  test("P02/P03 review regression: namespace element writes remain uncertainty without object-method edges", () => {
    for (const target of ["ns['target']", "(ns as any)['target']", "ns[key]"]) {
      const implementation = entry("implementation.ts", "export function target() { return 1; }");
      const source = entry("namespace-write.ts", `import * as ns from './implementation'; const key = 'target'; function replacement() { return 2; } ${target} = replacement; ns.target(); const obj = { target: replacement }; obj['target'] = replacement; obj.target(); replacement();`);
      const request = input([implementation, source]);
      const result = analyzed(request);
      expect(siteFacts(result, request).map(fact => fact.text)).toEqual(["replacement()"]);
      expect(result.unresolved.map(site => [source.source!.content.slice(site.anchor.start, site.anchor.end), site.reason])).toEqual([["ns.target()", "mutable_binding"], ["obj.target()", "unsupported_dispatch"]]);
    }
  });

  test("P03 aliases/default/namespace and finite explicit reexports retain linkage; missing/declaration/star ambiguity stay unknown", () => {
    const impl = entry("impl.ts", "export const named = () => 1; export default function main() { return 2; }");
    const first = entry("first.ts", "export { named as middle } from './impl';");
    const second = entry("second.ts", "export { middle as final } from './first';");
    const source = entry("use.ts", "import main, { named as renamed } from './impl'; import * as ns from './impl'; import { final } from './second'; import { missing } from './impl'; import { declared } from './decl'; import { duplicate } from './star'; renamed(); main(); ns.named(); final(); missing(); declared(); duplicate();");
    const result = analyzed(input([impl, first, second, source, entry("decl.ts", "export declare function declared(): void;", "head", "declaration-only"), entry("star.ts", "export * from './x'; export * from './y';"), entry("x.ts", "export const duplicate = () => 1"), entry("y.ts", "export const duplicate = () => 2")]));
    expect(result.edges.flatMap(edge => edge.sites.map(site => source.source!.content.slice(site.anchor.start, site.anchor.end))).sort()).toEqual(["final()", "main()", "ns.named()", "renamed()"]);
    const final = result.edges.flatMap(edge => edge.sites).find(site => source.source!.content.slice(site.anchor.start, site.anchor.end) === "final()")!;
    expect(final.linkage.map(anchor => anchor.path)).toEqual(["use.ts", "second.ts", "first.ts"]);
    expect(reasons(result)).toEqual(["ambiguous_implementation", "declaration_only", "semantic_obstruction"].sort());
  });

  test("P04 supplied relative/substitution/pinned aliases only; missing config and external resolution explicit", () => {
    const lib = entry("lib/help.ts", "export const help = () => 1;");
    const source = entry("use.ts", "import { help as a } from './lib/help.ts'; import { help as b } from './lib/help.js'; import { help as c } from '@local/help'; import { help as d } from 'external'; import { help as e } from '#private'; a(); b(); c(); d(); e();");
    const request = input([source, lib]);
    const configured: AnalysisInput = { ...request, profile: { name: "repository-static-v1", configuration: { source: { snapshotId: request.snapshotId, side: "head", path: "tsconfig.json", contentHash: hash("config"), start: 0, end: 1, startLine: 1, endLine: 1 }, paths: { "@local/*": ["lib/*"] } } } };
    const result = analyzed(configured);
    expect(result.edges.flatMap(edge => edge.sites.map(site => source.source!.content.slice(site.anchor.start, site.anchor.end))).sort()).toEqual(["a()", "b()", "c()"]);
    expect(reasons(result)).toEqual(["alias_configuration_gap", "external_module"].sort());
    expect(reasons(analyzed(request))).toEqual(["external_module", "external_module", "alias_configuration_gap"].sort());
    const excluded = analyzed({ ...configured, sources: [source, { side: lib.side, path: lib.path, role: lib.role, selected: true, commit: lib.commit, exclusion: "excluded" }] });
    expect(reasons(excluded)).toEqual(["excluded_source", "excluded_source", "excluded_source", "external_module", "alias_configuration_gap"].sort());
    expect(excluded.edges).toEqual([]);
    for (const configuration of [
      { ...configured.profile.configuration!, paths: { "@local/*": ["../outside/*"] } },
      { ...configured.profile.configuration!, extends: ["./external.json"] },
      { ...configured.profile.configuration!, packageExports: true },
      { ...configured.profile.configuration!, packageImports: true },
    ]) {
      const blocked = analyzed({ ...configured, profile: { ...configured.profile, configuration } });
      expect(blocked.edges.flatMap(edge => edge.sites).length).toBe(2);
      expect(reasons(blocked)).toContain("alias_configuration_gap");
      expect(blocked.neighborhoods.every(neighborhood => neighborhood.outgoingAssessment === "not_fully_analyzed")).toBe(true);
    }
  });

  test("P05 overload calls map to unique body plus signatures; union/declaration-only/multiple bodies reject", () => {
    const text = "function overloaded(x: string): string; function overloaded(x: number): number; function overloaded(x: string | number) { return x; } const use = () => overloaded(1); declare function absent(x: string): string; absent('x'); const union: typeof overloaded | typeof absent = Math.random() ? overloaded : absent; union('x'); function duplicate() { return 1; } function duplicate() { return 2; } duplicate();";
    const result = analyzed(input([entry("overloads.ts", text)]));
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.target.start).toBe(text.indexOf("function overloaded(x: string | number)"));
    expect(result.edges[0]!.sites[0]!.signatures.map(a => [a.start, a.end])).toEqual([[0, text.indexOf(" function overloaded(x: number)")], [text.indexOf("function overloaded(x: number)"), text.indexOf(" function overloaded(x: string | number)")]]);
    expect(reasons(result)).toEqual(["declaration_only", "unsupported_dispatch", "unsupported_binding", "ambiguous_implementation"].sort());
  });

  test("P06 recursion/shared callee aggregate sites; cyclic and overlong reexports terminate", () => {
    const source = entry("main.ts", "const shared = () => 1; const a = () => { a(); a(); shared(); }; const b = () => shared();");
    const request = input([source], [seed(source, "a = () => { a(); a(); shared(); }"), seed(source, "b = () => shared()"), seed(source, "a = () => { a(); a(); shared(); }")]);
    const result = analyzed(request);
    expect(result.edges.map(edge => edge.sites.length).sort()).toEqual([1, 1, 2]);
    expect(result.neighborhoods).toHaveLength(2);
    const cyclic = analyzed(input([entry("use.ts", "import { f } from './a'; f();"), entry("a.ts", "export { f } from './b';"), entry("b.ts", "export { f } from './a';")]));
    expect(reasons(cyclic)).toEqual(["cyclic_resolution"]);
    const chain = input([entry("use.ts", "import { f } from './a'; f();"), entry("a.ts", "export { f } from './b';"), entry("b.ts", "export { f } from './c';"), entry("c.ts", "export const f = () => 1;")]);
    expect(analyzed(chain).edges).toHaveLength(1);
    expect(analyzed({ ...chain, budgets: { ...DEFAULT_BUDGETS, reExportLinks: 2 } }).edges).toHaveLength(1);
    expect(reasons(analyzed({ ...chain, budgets: { ...DEFAULT_BUDGETS, reExportLinks: 1 } }))).toEqual(["reexport_limit"]);
  });

  test("P07 nested and anonymous callback ownership; passing callbacks never invents invocation", () => {
    const text = "const helper = () => 1; const outer = (run: (f: () => void) => void) => { const nested = () => helper(); nested(); run(() => { helper(); }); };";
    const source = entry("nested.ts", text);
    const result = analyzed(input([source], [seed(source, "outer = (run: (f: () => void) => void) => { const nested = () => helper(); nested(); run(() => { helper(); }); }")]));
    expect(result.edges.map(edge => [result.nodes.find(n => n.id === edge.caller)!.kind, result.nodes.find(n => n.id === edge.callee)!.name]).sort()).toEqual([["callback", "helper"], ["const-arrow", "helper"], ["const-arrow", "nested"]].sort());
    expect(reasons(result)).toEqual(["unsupported_binding"]);
    expect(result.edges.flatMap(edge => edge.sites).map(site => text.slice(site.anchor.start, site.anchor.end)).sort()).toEqual(["helper()", "helper()", "nested()"]);
    expect(result.neighborhoods[0]!.outgoing).toHaveLength(1);
    expect(result.neighborhoods[0]!.unresolved).toHaveLength(1);
  });

  test("P07 declaration-header calls belong to source context, never the declared function body", () => {
    const source = entry("headers.ts", "const helper = () => 1; function target(value = helper()) { return value; } const outer = () => { class Inner { [helper()]() { return 1; } } return Inner; };");
    const request = input([source], [seed(source, "function target(value = helper()) { return value; }")]);
    const result = analyzed(request);
    expect(siteFacts(result, request).map(fact => [fact.caller, fact.callee, fact.text])).toEqual([["<module>", "helper", "helper()"], ["outer", "helper", "helper()"]]);
    expect(result.neighborhoods[0]!.outgoingAssessment).toBe("No explicit invocation sites in this function body under the supported syntax scan.");
  });

  test("P08 TSX helper call only, framework JSX and callback passing never static calls or leaf", () => {
    const source = entry("component.tsx", "const helper = () => 1; const Handler = () => 2; const Component = () => { helper(); return <Handler onClick={helper} />; }; const Empty = () => <div />;");
    const result = analyzed(input([source], [seed(source, "Component = () => { helper(); return <Handler onClick={helper} />; }"), seed(source, "Empty = () => <div />")]));
    expect(result.edges).toHaveLength(1);
    expect(result.nodes.find(n => n.id === result.edges[0]!.callee)!.name).toBe("helper");
    expect(result.neighborhoods.every(n => n.limitations.includes("framework-invocation-not-analyzed"))).toBe(true);
    expect(result.neighborhoods.map(n => n.outgoingAssessment)).toEqual(["invocations_present", "not_fully_analyzed"]);
  });

  test("P09 qualified outgoing leaf and incoming scope; unresolved member is never leaf", () => {
    const source = entry("leaf.ts", "const leaf = () => 1; const dynamic = (obj: { run(): void }) => obj.run();");
    const result = analyzed(input([source], [seed(source, "leaf = () => 1"), seed(source, "dynamic = (obj: { run(): void }) => obj.run()") ]));
    expect(result.neighborhoods[0]!.outgoingAssessment).toBe("No explicit invocation sites in this function body under the supported syntax scan.");
    expect(result.neighborhoods[1]!.outgoingAssessment).toBe("invocations_present");
    expect(result.neighborhoods.every(n => n.incomingAssessment === "No resolved callers found in these supplied files" && n.incomingScope === "supplied_files_only")).toBe(true);
    expect(reasons(result)).toEqual(["unsupported_dispatch"]);
  });

  test("P10 every unsupported invocation retains site with no guessed dispatch or leaf", () => {
    const body = "obj.run(); new Thing(); obj[key](); factory()(); fn.call(null); fn.apply(null, []); fn.bind(null); import('./target'); eval('x'); tag`x`;";
    const source = entry("dynamic.ts", `const fn = () => 1; const factory = () => fn; class Thing { run() {} }; const obj = { run: fn }; const tag = fn; const execute = () => { ${body} };`);
    const result = analyzed(input([source], [seed(source, `execute = () => { ${body} }`)]));
    expect(result.edges.flatMap(edge => edge.sites.map(site => source.source!.content.slice(site.anchor.start, site.anchor.end)))).toEqual(["factory()"]);
    expect(result.unresolved.map(site => source.source!.content.slice(site.anchor.start, site.anchor.end)).sort()).toEqual(["obj.run()", "new Thing()", "obj[key]()", "factory()()", "fn.call(null)", "fn.apply(null, [])", "fn.bind(null)", "import('./target')", "eval('x')", "tag`x`"].sort());
    expect(reasons(result)).toEqual(["unsupported_dispatch", "unsupported_dispatch", "unsupported_dispatch", "dynamic_invocation", "unsupported_dispatch", "unsupported_dispatch", "unsupported_dispatch", "dynamic_invocation", "dynamic_invocation", "dynamic_invocation"].sort());
    expect(result.neighborhoods[0]!.outgoingAssessment).toBe("invocations_present");
  });

  test("P11 direct optional lexical binding conditional; missing optional remains unresolved", () => {
    const source = entry("optional.ts", "const target = () => 1; const use = () => { target?.(); missing?.(); };");
    const result = analyzed(input([source]));
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.sites[0]!.conditional).toBe(true);
    expect(reasons(result)).toEqual(["missing_binding"]);
    expect(result.edges[0]!.certainty).toBe("resolved_static");
  });

  test("P12 malformed source never emits facts/leaf/imported edges; independent valid file remains", () => {
    const broken = entry("broken.ts", "export const broken = () => { return ; @@@");
    const valid = entry("valid.ts", "const good = () => 1; const use = () => good();");
    const result = analyzed(input([broken, valid, entry("importer.ts", "import { broken } from './broken'; broken();")], [seed(valid, "good = () => 1"), { side: "head", path: broken.path, contentHash: broken.source!.contentHash, start: 0, end: 20 }]));
    expect(result.edges).toHaveLength(1);
    expect(reasons(result)).toEqual(["parse_obstruction"]);
    expect(result.coverage.find(c => c.path === "broken.ts")!.status).toBe("parse_failed");
    expect(result.nodes.every(n => n.declaration.path !== "broken.ts")).toBe(true);
    expect(result.neighborhoods.find(n => n.seed.path === "broken.ts")!.nodeId).toBe(null);
    expect(result.neighborhoods.find(n => n.seed.path === "valid.ts")!.limitations).toContain("incomplete-incoming-source-scope");
    const newer = entry("newer.ts", "export const f = () => 1; const x = <T extends>(v: T) => v;");
    expect(analyzed(input([newer])).nodes).toEqual([]);
  });

  test("P13 exact UTF16/CRLF and two distinct sites on one line", () => {
    const text = "// 😀\r\nconst target = () => 1;\r\nconst caller = () => { target(); target(); };\r\n";
    const source = entry("unicode.ts", text);
    const result = analyzed(input([source], [seed(source, "caller = () => { target(); target(); }")]));
    const sites = result.edges[0]!.sites;
    expect(sites.map(s => [s.anchor.start, s.anchor.end, s.anchor.startLine, s.anchor.endLine])).toEqual([[55, 63, 3, 3], [65, 73, 3, 3]]);
    expect(result.edges[0]!.target).toEqual({ snapshotId: "synthetic-snapshot", side: "head", path: "unicode.ts", contentHash: hash(text), start: 13, end: 29, startLine: 2, endLine: 2 });
    expect(Buffer.byteLength(text.slice(0, sites[0]!.anchor.start))).not.toBe(sites[0]!.anchor.start);
  });

  test("P14 input ordering/seed dedup stable; content/config/side identity changes; inputs immutable", () => {
    const a = entry("a.ts", "export const target = () => 1;");
    const b = entry("b.ts", "import { target } from './a'; const use = () => { target(); target(); };");
    const request = input([a, b], [seed(b, "use = () => { target(); target(); }")]);
    const original = JSON.stringify(request);
    const result = analyzed(request);
    expect(analyzed({ ...request, sources: [b, a], seeds: [...request.seeds, ...request.seeds] })).toEqual(result);
    expect(JSON.stringify(request)).toBe(original);
    expect(result.parser).toBe("typescript@6.0.3");
    expect(result.analyzer).toBe("source-neighborhood-v1.0.1");
    expect(analyzed({ ...request, sources: [entry("a.ts", "export const target = () => 2;"), b] }).analysisId).not.toBe(result.analysisId);
    expect(analyzed(input([entry("a.ts", a.source!.content, "base"), entry("b.ts", b.source!.content, "base")])).analysisId).not.toBe(result.analysisId);
    expect(analyzed({ ...request, profile: { name: "repository-static-v1", configuration: { source: { snapshotId: request.snapshotId, side: "head", path: "config.json", contentHash: hash("x"), start: 0, end: 1, startLine: 1, endLine: 1 }, paths: {} } } }).analysisId).not.toBe(result.analysisId);
    expect(result.edges[0]!.sites).toHaveLength(2);
    expect(Object.isFrozen(result)).toBe(true);
  });

  test("P15 exact lowered preflight and runtime bounds yield no partial facts", () => {
    const source = entry("bounds.ts", "const f = () => 1; const g = () => f();");
    const request = input([source], [seed(source, "g = () => f()")]);
    const bytes = Buffer.byteLength(source.source!.content);
    for (const [key, limit] of [["filesPerSide", 1], ["fileBytes", bytes], ["totalBytes", bytes], ["seeds", 1], ["invocationSites", 1], ["outputSites", 1]] as const) {
      expect(analyzed({ ...request, budgets: { ...DEFAULT_BUDGETS, [key]: limit } }).edges).toHaveLength(1);
      const exceeded = analyzeNeighborhood({ ...request, budgets: { ...DEFAULT_BUDGETS, [key]: limit - 1 } });
      noGraph(exceeded, "budget_exceeded");
      if (["filesPerSide", "fileBytes", "totalBytes", "seeds"].includes(key)) {
        expect(exceeded.coverage.every(row => row.parseStatus === "not_parsed")).toBe(true);
        expect(exceeded.observed.astNodes).toBe(0);
      }
    }
    const unknown = entry("unknown.ts", "const f = () => absent();");
    expect(analyzed({ ...input([unknown]), budgets: { ...DEFAULT_BUDGETS, outputSites: 1 } }).unresolved).toHaveLength(1);
    noGraph(analyzeNeighborhood({ ...input([unknown]), budgets: { ...DEFAULT_BUDGETS, outputSites: 0 } }), "budget_exceeded");
    const baseline = analyzed(request);
    expect(analyzed({ ...request, budgets: { ...DEFAULT_BUDGETS, astNodes: baseline.observed.astNodes } }).edges).toHaveLength(1);
    noGraph(analyzeNeighborhood({ ...request, budgets: { ...DEFAULT_BUDGETS, astNodes: baseline.observed.astNodes - 1 } }), "budget_exceeded");
    expect(analyzed({ ...request, budgets: { ...DEFAULT_BUDGETS, outputNodes: baseline.nodes.length } }).nodes).toHaveLength(baseline.nodes.length);
    noGraph(analyzeNeighborhood({ ...request, budgets: { ...DEFAULT_BUDGETS, outputNodes: baseline.nodes.length - 1 } }), "budget_exceeded");
    noGraph(analyzeNeighborhood({ ...request, budgets: { ...DEFAULT_BUDGETS, filesPerSide: 129 } }), "invalid_input");
    const alias = { source: { snapshotId: request.snapshotId, side: "head" as const, path: "config.json", contentHash: hash("config"), start: 0, end: 1, startLine: 1, endLine: 1 }, paths: { "@a/*": ["src/*"] } };
    expect(analyzed({ ...request, profile: { name: "repository-static-v1", configuration: alias }, budgets: { ...DEFAULT_BUDGETS, aliasPatterns: 1, aliasTargets: 1 } }).status).toBe("analyzed");
    for (const key of ["aliasPatterns", "aliasTargets"] as const) noGraph(analyzeNeighborhood({ ...request, profile: { name: "repository-static-v1", configuration: alias }, budgets: { ...DEFAULT_BUDGETS, [key]: 0 } }), "budget_exceeded");
  });

  test("P16 identity-invalid corpus yields no graph; absent/hash/range/unsupported seeds explicit", () => {
    const source = entry("valid.ts", "const f = () => 1;");
    const request = input([source]);
    for (const sources of [[source, source], [{ ...source, source: { ...source.source!, contentHash: "0".repeat(64) } }], ...["/absolute.ts", "../escape.ts", "nested/../escape.ts", "nul\0.ts", "back\\slash.ts", "./relative.ts"].map(path => [{ ...source, path }]), [{ ...source, commit: "c".repeat(40) }]]) noGraph(analyzeNeighborhood({ ...request, sources }), "invalid_identity");
    noGraph(analyzeNeighborhood({ ...request, seeds: [] }), "invalid_input");
    noGraph(analyzeNeighborhood({ ...request, corpus: { ...request.corpus, head: { ...request.corpus.head, commit: "c".repeat(40) } } }), "invalid_identity");
    expect(analyzed(input([source, entry(source.path, source.source!.content, "base")])).status).toBe("analyzed");
    const result = analyzed({ ...request, seeds: [
      { side: "head", path: "absent.ts", contentHash: hash("absent"), start: 0, end: 1 },
      { ...seed(source, "f = () => 1"), contentHash: hash("wrong") },
      { ...seed(source, "f = () => 1"), end: 1000 },
      { ...seed(source, "f = () => 1"), start: 0 },
    ] });
    expect(result.neighborhoods.map(n => n.unresolvedSeed as string).sort()).toEqual(["source_unavailable", "hash_mismatch", "invalid_range", "unsupported_or_absent"].sort());
    expect(result.neighborhoods.every(n => n.nodeId === null && n.outgoingAssessment === "not_fully_analyzed")).toBe(true);
  });

  test("P15/P19 inventory bounds are separate from prepared text and preserve every coverage row", () => {
    const prepared = entry("prepared.ts", "const target = () => 1; const caller = () => target();");
    const exclusions: SourceEntry[] = Array.from({ length: 129 }, (_, index) => ({ side: "head", path: `excluded/${index}.ts`, commit: prepared.commit, role: "context", selected: false, exclusion: "excluded" }));
    const request = input([prepared, ...exclusions]);
    const result = analyzed(request);
    expect(result.coverage).toHaveLength(130);
    expect(result.coverage.filter(row => row.status === "excluded")).toHaveLength(129);
    expect(result.coverage.filter(row => row.prepared)).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
    const metadata = request.sources.map(source => ({ ...source, source: source.source ? { contentHash: source.source.contentHash, ...(source.source.objectId ? { objectId: source.source.objectId } : {}) } : null }));
    const bytes = Buffer.byteLength(JSON.stringify(metadata));
    expect(result.observed.inventoryBytes).toBe(bytes);
    expect(analyzed({ ...request, budgets: { ...DEFAULT_BUDGETS, inventoryPathsPerSide: 130, inventoryBytes: bytes, filesPerSide: 1 } }).coverage).toHaveLength(130);
    for (const budgets of [
      { ...DEFAULT_BUDGETS, inventoryPathsPerSide: 129 },
      { ...DEFAULT_BUDGETS, inventoryBytes: bytes - 1 },
    ]) {
      const exceeded = analyzeNeighborhood({ ...request, budgets });
      noGraph(exceeded, "budget_exceeded");
      expect(exceeded.coverage).toHaveLength(130);
      expect(exceeded.coverage.every(row => row.parseStatus === "not_parsed" && row.examined === null)).toBe(true);
    }
    const prepared129 = input(Array.from({ length: 129 }, (_, index) => ({ ...entry(`prepared/${index}.ts`, "const f = () => 1;"), selected: false })));
    const tooManyPrepared = analyzeNeighborhood(prepared129);
    noGraph(tooManyPrepared, "budget_exceeded");
    if (tooManyPrepared.status === "unavailable") expect(tooManyPrepared.limit).toBe("filesPerSide");
    expect(tooManyPrepared.coverage.every(row => row.parseStatus === "not_parsed")).toBe(true);
    for (const [name, value] of [["inventoryPathsPerSide", 4_097], ["inventoryBytes", 2 * 1024 * 1024 + 1]] as const) noGraph(analyzeNeighborhood({ ...request, budgets: { ...DEFAULT_BUDGETS, [name]: value } }), "invalid_input");
  });

  test("P17 unchanged/test callers require actual retained source; excluded caller remains scoped unknown", () => {
    const target = entry("target.ts", "export const target = () => 1;");
    const caller = entry("context.ts", "import { target } from './target'; const caller = () => target();", "head", "context");
    const tests = entry("target.test.ts", "import { target } from './target'; target();", "head", "context");
    const request = input([target, caller, tests], [seed(target, "target = () => 1")]);
    expect(analyzed(request).neighborhoods[0]!.incoming).toHaveLength(2);
    const excluded: SourceEntry = { side: caller.side, path: caller.path, commit: caller.commit, role: caller.role, selected: false, exclusion: "excluded" };
    const reduced = analyzed({ ...request, sources: [target, excluded, tests] });
    expect(reduced.neighborhoods[0]!.incoming).toHaveLength(1);
    expect(reduced.coverage.find(c => c.path === caller.path)).toMatchObject({ selected: false, prepared: false, status: "excluded", examined: null, resolved: null, unresolved: null });
    expect(reduced.neighborhoods[0]!.limitations).toContain("test-path-classification-is-not-execution-evidence");
    expect(reduced.corpus).toEqual(request.corpus);
  });

  test("P18 host refuses real-checkout dependency/default libs/config/package discovery without effects", () => {
    // src/domain/public.ts exists in this checkout. It is deliberately absent here.
    const source = entry("src/use.ts", "import { projectGraph } from './domain/public'; import { readFileSync } from 'node:fs'; const execute = () => { projectGraph(); readFileSync('secret'); fetch('https://example.com'); }; const lib = () => Math.random();");
    const before = process.cwd();
    const sentinels = [
      spyOn(ts.sys, "readFile").mockImplementation(() => { throw new Error("Forbidden real readFile"); }),
      spyOn(ts.sys, "fileExists").mockImplementation(() => { throw new Error("Forbidden real fileExists"); }),
      spyOn(ts.sys, "readDirectory").mockImplementation(() => { throw new Error("Forbidden real readDirectory"); }),
      spyOn(ts.sys, "directoryExists").mockImplementation(() => { throw new Error("Forbidden real directoryExists"); }),
      spyOn(ts.sys, "getCurrentDirectory").mockImplementation(() => { throw new Error("Forbidden real getCurrentDirectory"); }),
      spyOn(ts.sys, "writeFile").mockImplementation(() => { throw new Error("Forbidden emit"); }),
      spyOn(globalThis, "fetch").mockImplementation(Object.assign(() => { throw new Error("Forbidden network"); }, { preconnect: () => { throw new Error("Forbidden preconnect"); } })),
    ];
    let result: ReturnType<typeof analyzed>;
    try {
      result = analyzed(input([source]));
      expect(sentinels.map(sentinel => sentinel.mock.calls.length)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    } finally { for (const sentinel of sentinels) sentinel.mockRestore(); }
    expect(result.edges).toEqual([]);
    expect(reasons(result)).toEqual(["missing_module", "external_module", "missing_binding", "unsupported_dispatch"].sort());
    expect(process.cwd()).toBe(before);
    expect(result.diagnostics.some(d => d.code === "2307")).toBe(true);
  });

  test("P02/P03 close binding cases: named function-expression recursion/local/default exports/type-only refusals", () => {
    const implementation = entry("impl.ts", "const f = function recursive() { recursive(); }; export { f as named }; export default f;");
    const typeExport = entry("types.ts", "export type { named } from './impl';");
    const source = entry("use.ts", "import main, { named } from './impl'; import type { named as typeOnly } from './impl'; import { named as typeExport } from './types'; named(); main(); typeOnly(); typeExport();");
    const request = input([implementation, typeExport, source]);
    const result = analyzed(request);
    expect(siteFacts(result, request).map(fact => [fact.caller, fact.callee, fact.text])).toEqual([["f", "f", "recursive()"], ["<module>", "f", "named()"], ["<module>", "f", "main()"]]);
    expect(reasons(result)).toEqual(["unsupported_binding", "unsupported_binding"]);
    expect(result.edges.find(edge => edge.sites.some(site => site.anchor.path === "use.ts"))!.sites.map(site => site.linkage.map(link => link.path))).toEqual([["use.ts", "impl.ts"], ["use.ts", "impl.ts"]]);
  });

  test("P13/P16 valid BOM and immutable deeply frozen caller inputs", () => {
    const source = entry("bom.ts", "\uFEFFconst target = () => 1; const caller = () => target();");
    const request = input([source], [seed(source, "caller = () => target()")]);
    const deepFreeze = (value: unknown): void => { if (value && typeof value === "object") { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); } };
    deepFreeze(request);
    const result = analyzed(request);
    expect(siteFacts(result, request)).toEqual([{ caller: "caller", callee: "target", text: "target()", side: "head", path: "bom.ts", start: 46, end: 54 }]);
    expect(analyzed(request)).toEqual(result);
  });

  test("P19 ledger separates inventory/selection/preparation/parse/scan and exact budget trigger", () => {
    const selected = entry("a.ts", "const f = () => 1; f();");
    const notSelected = { ...entry("b.ts", "const b = () => 1;"), selected: false };
    const malformed = entry("c.ts", "const broken = () => { @");
    const context = entry("d.ts", "const context = () => 1;", "head", "context");
    const pending = entry("z.ts", "const z = () => 1; z();");
    const request = input([pending, malformed, notSelected, selected, context]);
    const full = analyzed(request);
    expect(full.coverage.map(c => [c.path, c.selected, c.prepared, c.status])).toEqual([["a.ts", true, true, "scanned"], ["b.ts", false, true, "not_selected"], ["c.ts", true, true, "parse_failed"], ["d.ts", true, true, "scanned"], ["z.ts", true, true, "scanned"]]);
    const limited = analyzeNeighborhood({ ...request, budgets: { ...DEFAULT_BUDGETS, invocationSites: 0 } });
    noGraph(limited, "budget_exceeded");
    expect(limited.coverage.find(c => c.path === "a.ts")).toMatchObject({ status: "budget_exceeded", examined: 1, resolved: null, unresolved: null });
    expect(limited.coverage.find(c => c.path === "z.ts")).toMatchObject({ status: "pending", examined: null, resolved: null, unresolved: null, reason: "not_scanned_after_invocationSites" });
    if (limited.status === "unavailable") expect(limited.triggeringSource).toEqual({ side: "head", path: "a.ts" });
  });
});
