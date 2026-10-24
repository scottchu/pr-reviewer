import ts from "typescript-analysis";
import { createHash } from "node:crypto";
import { DEFAULT_BUDGETS, type AnalysisBudgets, type AnalysisDiagnostic, type AnalysisInput, type AnalysisMetadata, type AnalysisResult, type Anchor, type CallEdge, type FunctionNode, type Neighborhood, type Seed, type Side, type SourceCoverage, type SourceEntry, type UnresolvedReason, type UnresolvedSite } from "./public.ts";

const ANALYZER = "source-neighborhood-v1.0.1" as const;
const PARSER = `typescript@${ts.version}`;
const ROOT = "/repository/";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => compare(a, b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
};
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const key = (side: Side, path: string) => `${side}:${path}`;
const sourceOrder = (a: Pick<SourceEntry, "side" | "path">, b: Pick<SourceEntry, "side" | "path">) => compare(key(a.side, a.path), key(b.side, b.path));
const anchorOrder = (a: Anchor, b: Anchor) => sourceOrder(a, b) || a.start - b.start || a.end - b.end;
const validPath = (path: string) => typeof path === "string" && path.length > 0 && !/[\\\0:]/.test(path) && !path.startsWith("/") && path.split("/").every(part => part !== "" && part !== "." && part !== "..");
const hashLike = (value: string) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const commitLike = (value: string) => typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
// Copy caller values before freezing: the public port never freezes or mutates an input.
const copy = <T>(value: T): T => structuredClone(value);
const seedKey = (seed: Seed) => `${key(seed.side, seed.path)}:${seed.contentHash}:${seed.start}:${seed.end}`;
const supportedExtension = (path: string) => /\.tsx?$/.test(path);
const initialCoverage = (source: SourceEntry): MutableCoverage => ({
  side: source.side, path: source.path, role: source.role, selected: source.selected,
  prepared: !!source.source, status: source.exclusion ?? (!supportedExtension(source.path) ? "unsupported" : !source.selected ? "not_selected" : !source.source ? "missing" : "pending"),
  parseStatus: "not_parsed", examined: null, resolved: null, unresolved: null,
  ...(source.exclusion ? { reason: source.exclusion } : {}),
});
type MutableCoverage = { -readonly [K in keyof SourceCoverage]: SourceCoverage[K] };
type FunctionInfo = { value: FunctionNode; body: ts.ConciseBody | ts.SourceFile; declaration: ts.Node; jsx: boolean; invocations: number };
type Site = { node: ts.CallExpression | ts.NewExpression | ts.TaggedTemplateExpression | ts.Decorator; owner: FunctionInfo; source: SourceEntry; file: ts.SourceFile };
type Binding = { target: FunctionInfo; linkage: Anchor[]; signatures: Anchor[] } | { reason: UnresolvedReason; candidates: Anchor[] };
type Failure = { reason: "invalid_identity" | "invalid_input" | "budget_exceeded" | "parser_failure"; detail: string; limit?: keyof AnalysisBudgets; triggeringSource?: { side: Side; path: string } };
const failed = (reason: UnresolvedReason, candidates: Anchor[] = []): Binding => ({ reason, candidates });

export const analyzeNeighborhood = (input: AnalysisInput): AnalysisResult => {
  const sources = [...input.sources].sort(sourceOrder);
  const seeds = [...new Map(input.seeds.map(seed => [seedKey(seed), seed])).values()].sort((a, b) => sourceOrder(a, b) || a.start - b.start || a.end - b.end || compare(a.contentHash, b.contentHash));
  const coverage = sources.map(initialCoverage);
  const ledger = new Map(coverage.map(row => [key(row.side, row.path), row]));
  const diagnostics: AnalysisDiagnostic[] = [];
  const sourceMetadata = sources.map(source => ({ ...source, source: source.source ? { contentHash: source.source.contentHash, ...(source.source.objectId ? { objectId: source.source.objectId } : {}) } : null }));
  const observed = { bytes: 0, inventoryBytes: Buffer.byteLength(stable(sourceMetadata), "utf8"), astNodes: 0, invocationSites: 0 };
  const corpusDigest = digest(stable({ sources: sourceMetadata, corpus: input.corpus, profile: input.profile }));
  const analysisId = digest(stable({ contract: input.contract, analyzer: ANALYZER, parser: PARSER, snapshotId: input.snapshotId, change: input.change, commits: input.commits, corpusDigest, profile: input.profile, seeds, budgets: input.budgets }));
  const metadata = (): AnalysisMetadata => ({ analyzer: ANALYZER, parser: PARSER, snapshotId: input.snapshotId, corpusDigest, analysisId, corpus: copy(input.corpus), coverage, diagnostics: diagnostics.sort((a, b) => sourceOrder(a, b) || a.start - b.start || compare(a.code, b.code) || compare(a.message, b.message)), observed });
  const unavailable = (failure: Failure): AnalysisResult => freeze({ ...metadata(), status: "unavailable", ...failure });
  const invalid = (detail: string) => unavailable({ reason: "invalid_identity", detail });
  const budget = (limit: keyof AnalysisBudgets, source?: SourceEntry): AnalysisResult => {
    if (source) {
      const row = ledger.get(key(source.side, source.path))!;
      row.status = "budget_exceeded";
      row.reason = limit;
    }
    for (const row of coverage) if (row.status === "pending") row.reason = `not_scanned_after_${limit}`;
    return unavailable({ reason: "budget_exceeded", detail: `Exceeded ${limit} limit ${input.budgets[limit]}`, limit, ...(source ? { triggeringSource: { side: source.side, path: source.path } } : {}) });
  };
  if (input.contract !== "source-neighborhood-v1" || input.profile.name !== "repository-static-v1" || !input.snapshotId || !input.change.repository || !input.change.provider || !input.change.changeId) return invalid("Invalid request identity/profile");
  if (ts.version !== "6.0.3") return unavailable({ reason: "parser_failure", detail: `Expected TypeScript 6.0.3, received ${ts.version}` });
  for (const side of ["base", "head"] as const) if (!commitLike(input.commits[side]) || input.corpus[side].commit !== input.commits[side] || !["changed-only", "selected-context", "repository-enumeration"].includes(input.corpus[side].inventory) || !input.corpus[side].acquisition) return invalid(`Invalid ${side} corpus identity`);
  for (const name of Object.keys(DEFAULT_BUDGETS) as (keyof AnalysisBudgets)[]) if (!Number.isSafeInteger(input.budgets[name]) || input.budgets[name] < 0 || input.budgets[name] > DEFAULT_BUDGETS[name]) return unavailable({ reason: "invalid_input", detail: `Invalid budget ${name}` });
  const seen = new Set<string>();
  for (const source of sources) {
    const identity = key(source.side, source.path);
    if (!["base", "head"].includes(source.side) || !validPath(source.path) || seen.has(identity) || source.commit !== input.commits[source.side] || !["changed", "context", "declaration-only"].includes(source.role) || typeof source.selected !== "boolean") return invalid(`Invalid or duplicate source ${identity}`);
    seen.add(identity);
    if (source.source) {
      if (!hashLike(source.source.contentHash) || digest(source.source.content) !== source.source.contentHash || new TextDecoder("utf-8", { ignoreBOM: true }).decode(new TextEncoder().encode(source.source.content)) !== source.source.content || (source.source.objectId !== undefined && !commitLike(source.source.objectId))) return invalid(`Invalid source hash/bytes/object ${identity}`);
      observed.bytes += Buffer.byteLength(source.source.content, "utf8");
    }
    if (source.exclusion && !["excluded", "missing", "unsupported"].includes(source.exclusion)) return invalid(`Invalid source disposition ${identity}`);
  }
  for (const seed of seeds) if (!["base", "head"].includes(seed.side) || !validPath(seed.path) || !hashLike(seed.contentHash)) return invalid("Invalid seed identity");
  const config = input.profile.configuration;
  if (config && (!hashLike(config.source.contentHash) || !validPath(config.source.path) || config.source.snapshotId !== input.snapshotId || !["base", "head"].includes(config.source.side) || !Number.isSafeInteger(config.source.start) || !Number.isSafeInteger(config.source.end) || config.source.start < 0 || config.source.end <= config.source.start || config.source.startLine < 1 || config.source.endLine < config.source.startLine)) return invalid("Invalid pinned configuration source");
  if (!input.seeds.length) return unavailable({ reason: "invalid_input", detail: "At least one declaration seed is required" });
  if (input.seeds.length > input.budgets.seeds) return budget("seeds");
  for (const side of ["base", "head"] as const) {
    const sideSources = sources.filter(source => source.side === side);
    if (sideSources.length > input.budgets.inventoryPathsPerSide) return budget("inventoryPathsPerSide", sideSources[input.budgets.inventoryPathsPerSide]);
    const prepared = sideSources.filter(source => !!source.source);
    if (prepared.length > input.budgets.filesPerSide) return budget("filesPerSide", prepared[input.budgets.filesPerSide]);
  }
  if (observed.inventoryBytes > input.budgets.inventoryBytes) return budget("inventoryBytes");
  for (const source of sources) if (source.source && Buffer.byteLength(source.source.content, "utf8") > input.budgets.fileBytes) return budget("fileBytes", source);
  let accumulatedBytes = 0;
  for (const source of sources) {
    accumulatedBytes += source.source ? Buffer.byteLength(source.source.content, "utf8") : 0;
    if (accumulatedBytes > input.budgets.totalBytes) return budget("totalBytes", source);
  }
  if (config && Object.keys(config.paths).length > input.budgets.aliasPatterns) return budget("aliasPatterns");
  if (config && Object.values(config.paths).some(targets => targets.length > input.budgets.aliasTargets)) return budget("aliasTargets");
  const wildcardCount = (value: string) => [...value].filter(char => char === "*").length;
  const safeAlias = (value: string) => validPath(value) && wildcardCount(value) <= 1;
  const blockedConfiguration = !!config && (!!config.extends?.length || !!config.packageImports || !!config.packageExports || Object.entries(config.paths).some(([pattern, targets]) => !safeAlias(pattern) || targets.length === 0 || targets.some(target => !safeAlias(target))));
  if (blockedConfiguration) diagnostics.push({ side: config!.source.side, path: config!.source.path, start: config!.source.start, code: "unsupported_configuration", message: "Path aliases require explicit in-root paths without inherited or package configuration" });

  const nodes: FunctionInfo[] = [];
  const infoByDeclaration = new Map<ts.Node, FunctionInfo>();
  const sites: Site[] = [];
  const unresolved: UnresolvedSite[] = [];
  const edgeMap = new Map<string, { id: string; caller: string; callee: string; target: Anchor; sites: Array<CallEdge["sites"][number]>; method: "ts-static-binding-v1"; certainty: "resolved_static" }>();
  const sourceMap = new Map(sources.map(source => [key(source.side, source.path), source]));
  const functionsBySide = new Map<Side, { program: ts.Program; checker: ts.TypeChecker; files: Map<string, ts.SourceFile>; resolve: (name: string, containing: string) => string | undefined; resolveKnown: (name: string, containing: string) => string | undefined; syntactic: Map<ts.SourceFile, readonly ts.Diagnostic[]>; semantic: Map<ts.SourceFile, readonly ts.Diagnostic[]>; writes: Set<ts.Symbol> }>();
  const anchor = (source: SourceEntry, file: ts.SourceFile, node: ts.Node): Anchor => {
    const start = node === file ? 0 : node.getStart(file);
    const end = node.end;
    return { snapshotId: input.snapshotId, side: source.side, path: source.path, contentHash: source.source!.contentHash, start, end, startLine: file.getLineAndCharacterOfPosition(start).line + 1, endLine: file.getLineAndCharacterOfPosition(Math.max(start, end - 1)).line + 1 };
  };
  const addInfo = (source: SourceEntry, file: ts.SourceFile, declaration: ts.Node, body: ts.ConciseBody | ts.SourceFile, kind: FunctionNode["kind"], name: string): FunctionInfo => {
    const declarationAnchor = anchor(source, file, declaration);
    const value: FunctionNode = { id: digest(stable([input.snapshotId, declarationAnchor, kind])), name, kind, declaration: declarationAnchor, body: anchor(source, file, body), role: source.role };
    const info = { value, body, declaration, jsx: false, invocations: 0 };
    nodes.push(info);
    infoByDeclaration.set(declaration, info);
    return info;
  };
  try {
    // No ts.sys/createCompilerHost/default host. Every callback is backed by this request.
    for (const side of ["base", "head"] as const) {
      const sideSources = sources.filter(source => source.side === side && source.selected && source.source && !source.exclusion && supportedExtension(source.path));
      const virtual = new Map(sideSources.map(source => [ROOT + source.path, source]));
      const files = new Map<string, ts.SourceFile>();
      const directories = new Set<string>([ROOT.slice(0, -1)]);
      for (const fileName of virtual.keys()) for (let slash = fileName.lastIndexOf("/"); slash >= ROOT.length - 1; slash = fileName.lastIndexOf("/", slash - 1)) directories.add(fileName.slice(0, slash));
      const options: ts.CompilerOptions = { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.Preserve, noEmit: true, noLib: true, types: [], strict: true, allowImportingTsExtensions: true, resolvePackageJsonExports: false, resolvePackageJsonImports: false, ...(config && !blockedConfiguration ? { baseUrl: ROOT, paths: Object.fromEntries(Object.entries(config.paths).map(([pattern, targets]) => [pattern, [...targets]])) } : {}) };
      const moduleHost: ts.ModuleResolutionHost = { fileExists: name => virtual.has(name), readFile: name => virtual.get(name)?.source?.content, directoryExists: name => directories.has(name), getCurrentDirectory: () => ROOT, realpath: name => name };
      const known = new Set(sources.filter(source => source.side === side && supportedExtension(source.path)).map(source => ROOT + source.path));
      const knownDirectories = new Set<string>([ROOT.slice(0, -1)]);
      for (const fileName of known) for (let slash = fileName.lastIndexOf("/"); slash >= ROOT.length - 1; slash = fileName.lastIndexOf("/", slash - 1)) knownDirectories.add(fileName.slice(0, slash));
      const knownHost: ts.ModuleResolutionHost = { fileExists: name => known.has(name), readFile: () => undefined, directoryExists: name => knownDirectories.has(name), getCurrentDirectory: () => ROOT, realpath: name => name };
      const resolveWith = (name: string, containing: string, host: ts.ModuleResolutionHost, present: (name: string) => boolean): string | undefined => {
        // Bare packages are never available. Explicit aliases alone may match them.
        const relative = name.startsWith("./") || name.startsWith("../");
        const aliasMatch = config && !blockedConfiguration && Object.keys(config.paths).some(pattern => {
          const [before, after] = pattern.split("*");
          return pattern.includes("*") ? name.startsWith(before!) && name.endsWith(after!) && name.length >= before!.length + after!.length : name === pattern;
        });
        if (!relative && !aliasMatch) return undefined;
        const resolved = ts.resolveModuleName(name, containing, options, host).resolvedModule;
        return resolved && present(resolved.resolvedFileName) && supportedExtension(resolved.resolvedFileName) ? resolved.resolvedFileName : undefined;
      };
      const resolve = (name: string, containing: string) => resolveWith(name, containing, moduleHost, fileName => virtual.has(fileName));
      const resolveKnown = (name: string, containing: string) => resolveWith(name, containing, knownHost, fileName => known.has(fileName));
      const host: ts.CompilerHost = {
        ...moduleHost, fileExists: moduleHost.fileExists, readFile: moduleHost.readFile,
        getSourceFile: (name, languageVersion) => {
          const source = virtual.get(name);
          if (!source?.source) return undefined;
          const existing = files.get(name);
          if (existing) return existing;
          const file = ts.createSourceFile(name, source.source.content, languageVersion, true, name.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
          files.set(name, file);
          ledger.get(key(side, source.path))!.parseStatus = "parsed";
          return file;
        },
        getDefaultLibFileName: () => "", writeFile: () => {}, getCurrentDirectory: () => ROOT,
        getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true, getNewLine: () => "\n",
        resolveModuleNames: (names, containing) => names.map(name => {
          const fileName = resolve(name, containing);
          return fileName ? { resolvedFileName: fileName, extension: fileName.endsWith(".tsx") ? ts.Extension.Tsx : ts.Extension.Ts, isExternalLibraryImport: false } : undefined;
        }),
      };
      const program = ts.createProgram([...virtual.keys()], options, host);
      const syntactic = new Map([...files.values()].map(file => [file, program.getSyntacticDiagnostics(file)]));
      for (const [file, errors] of syntactic) ledger.get(key(side, file.fileName.slice(ROOT.length)))!.parseStatus = errors.length ? "failed" : "parsed";
      functionsBySide.set(side, { program, checker: program.getTypeChecker(), files, resolve, resolveKnown, syntactic, semantic: new Map(), writes: new Set() });
    }
    // Scan all supplied selected files before binding. Nested bodies have their own owners.
    for (const source of sources) {
      const row = ledger.get(key(source.side, source.path))!;
      if (row.status !== "pending") continue;
      const state = functionsBySide.get(source.side)!;
      const file = state.files.get(ROOT + source.path)!;
      if (state.syntactic.get(file)!.length) {
        row.status = "parse_failed";
        row.reason = "parse_obstruction";
        for (const diagnostic of state.syntactic.get(file)!) diagnostics.push({ side: source.side, path: source.path, start: diagnostic.start ?? 0, code: String(diagnostic.code), message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") });
        continue;
      }
      row.examined = 0;
      const module = addInfo(source, file, file, file, "module", "<module>");
      let exceeded: keyof AnalysisBudgets | undefined;
      const unwrapTarget = (node: ts.Node): ts.Node => ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node) ? unwrapTarget(node.expression) : node;
      const write = (wrapped: ts.Node): void => {
        const node = unwrapTarget(wrapped);
        if (ts.isIdentifier(node)) {
          const symbol = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
            ? state.checker.getShorthandAssignmentValueSymbol(node.parent)
            : state.checker.getSymbolAtLocation(node);
          if (symbol) state.writes.add(symbol);
        } else if (ts.isArrayLiteralExpression(node)) node.elements.forEach(write);
        else if (ts.isObjectLiteralExpression(node)) for (const property of node.properties) {
          if (ts.isShorthandPropertyAssignment(property)) write(property.name);
          else if (ts.isPropertyAssignment(property)) write(property.initializer);
          else if (ts.isSpreadAssignment(property)) write(property.expression);
        }
        else if (ts.isSpreadElement(node)) write(node.expression);
        else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) write(node.left);
        else if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
          const base = unwrapTarget(node.expression);
          const namespace = ts.isIdentifier(base) ? state.checker.getSymbolAtLocation(base) : undefined;
          if (!namespace?.declarations?.some(ts.isNamespaceImport)) return;
          const namespaceType = state.checker.getTypeAtLocation(base);
          const member = ts.isPropertyAccessExpression(node) ? node.name.text
            : ts.isStringLiteralLike(node.argumentExpression) ? node.argumentExpression.text : undefined;
          if (member !== undefined) {
            const symbol = namespaceType.getProperty(member);
            if (symbol) state.writes.add(symbol);
          } else {
            // The computed name is unknown: no member of this namespace remains certain.
            state.writes.add(namespace);
            for (const symbol of namespaceType.getProperties()) state.writes.add(symbol);
          }
        }
      };
      const visit = (node: ts.Node, owner: FunctionInfo): void => {
        if (exceeded) return;
        observed.astNodes++;
        if (observed.astNodes > input.budgets.astNodes) { exceeded = "astNodes"; return; }
        let current = owner;
        if (ts.isFunctionDeclaration(node) && node.body) current = addInfo(source, file, node, node.body, node.name ? "function" : "callback", node.name?.text ?? `<callback@${node.getStart(file)}>`);
        else if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isVariableDeclaration(node.parent) && node.parent.initializer === node && ts.isIdentifier(node.parent.name) && ts.isVariableDeclarationList(node.parent.parent) && (node.parent.parent.flags & ts.NodeFlags.Const)) {
          current = addInfo(source, file, node.parent, node.body, ts.isArrowFunction(node) ? "const-arrow" : "const-function", node.parent.name.text);
        } else if (ts.isFunctionLike(node) && "body" in node && node.body && (ts.isBlock(node.body as ts.Node) || ts.isExpression(node.body as ts.Node))) {
          current = addInfo(source, file, node, node.body as ts.ConciseBody, "callback", `<callback@${node.getStart(file)}>`);
        }
        if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) current.jsx = true;
        if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) write(node.left);
        if ((ts.isForInStatement(node) || ts.isForOfStatement(node)) && !ts.isVariableDeclarationList(node.initializer)) write(node.initializer);
        if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)) write(node.operand);
        if (ts.isCallExpression(node) || ts.isNewExpression(node) || ts.isTaggedTemplateExpression(node) || ts.isDecorator(node)) {
          observed.invocationSites++;
          row.examined!++;
          current.invocations++;
          if (observed.invocationSites > input.budgets.invocationSites) { exceeded = "invocationSites"; return; }
          sites.push({ node, owner: current, source, file });
        }
        // Ownership follows function bodies, not declaration headers/computed names.
        ts.forEachChild(node, child => visit(child, current !== owner && child !== current.body ? owner : current));
      };
      visit(file, module);
      if (exceeded) return budget(exceeded, source);
      row.status = "scanned";
    }

    for (const [side, state] of functionsBySide) for (const [fileName, file] of state.files) {
      const source = sourceMap.get(key(side, fileName.slice(ROOT.length)))!;
      if (state.syntactic.get(file)!.length) continue;
      const semantic = state.program.getSemanticDiagnostics(file);
      state.semantic.set(file, semantic);
      for (const diagnostic of semantic) diagnostics.push({ side, path: source.path, start: diagnostic.start ?? 0, code: String(diagnostic.code), message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n") });
    }
    const nodeAnchor = (node: ts.Node, side: Side) => anchor(sourceMap.get(key(side, node.getSourceFile().fileName.slice(ROOT.length)))!, node.getSourceFile(), node);
    const intersects = (diagnostic: ts.Diagnostic, start: number, end: number) => diagnostic.start !== undefined && diagnostic.start < end && diagnostic.start + Math.max(diagnostic.length ?? 0, 1) > start;
    const semanticBlocks = (node: ts.Node, side: Side, end = node.end) => functionsBySide.get(side)!.semantic.get(node.getSourceFile())?.some(diagnostic => intersects(diagnostic, node.getStart(), end)) ?? false;
    const moduleSpecifier = (node: ts.Node): ts.StringLiteralLike | undefined => {
      for (let current: ts.Node | undefined = node; current; current = current.parent) if ((ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) && current.moduleSpecifier && ts.isStringLiteralLike(current.moduleSpecifier)) return current.moduleSpecifier as ts.StringLiteralLike;
      return undefined;
    };
    const classifyMissingModule = (name: string, from: ts.SourceFile, side: Side): UnresolvedReason => {
      if (functionsBySide.get(side)!.resolveKnown(name, from.fileName)) return "excluded_source";
      if (!name.startsWith(".")) return name.startsWith("#") || blockedConfiguration || (!!config && Object.keys(config.paths).some(pattern => name.startsWith(pattern.split("*")[0]!))) ? "alias_configuration_gap" : "external_module";
      return "missing_module";
    };
    const resolveExport = (moduleName: string, exported: string, from: ts.SourceFile, side: Side, linkage: Anchor[], visited: Set<string>, links: number): Binding => {
      const state = functionsBySide.get(side)!;
      const targetName = state.resolve(moduleName, from.fileName);
      if (!targetName) return failed(classifyMissingModule(moduleName, from, side));
      const targetFile = state.files.get(targetName)!;
      if (state.syntactic.get(targetFile)!.length) return failed("parse_obstruction");
      const identity = `${targetName}:${exported}`;
      if (visited.has(identity)) return failed("cyclic_resolution");
      const nextVisited = new Set([...visited, identity]);
      const moduleSymbol = state.checker.getSymbolAtLocation(targetFile);
      const exportedSymbol = moduleSymbol ? state.checker.getExportsOfModule(moduleSymbol).find(symbol => symbol.name === exported) : undefined;
      const explicit = targetFile.statements.some(statement => {
        if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) return statement.exportClause.elements.some(element => element.name.text === exported);
        if (ts.isExportAssignment(statement)) return exported === "default";
        if (ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
          if (ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) return exported === "default";
          if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name?.text === exported) return true;
          if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.some(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === exported);
        }
        return false;
      });
      if (!explicit && targetFile.statements.some(statement => ts.isExportDeclaration(statement) && !statement.exportClause)) return failed("ambiguous_implementation");
      if (!exportedSymbol) return failed("semantic_obstruction");
      return resolveSymbol(exportedSymbol, side, linkage, nextVisited, links);
    };
    const resolveSymbol = (symbol: ts.Symbol, side: Side, linkage: Anchor[] = [], visited = new Set<string>(), links = 0): Binding => {
      const state = functionsBySide.get(side)!;
      const declarations = symbol.declarations ?? [];
      if (state.writes.has(symbol)) return failed("mutable_binding", declarations.map(declaration => nodeAnchor(declaration, side)));
      if (!declarations.length) return failed("missing_binding");
      const declaration = declarations[0]!;
      if (ts.isImportSpecifier(declaration) || ts.isImportClause(declaration)) {
        if (ts.isImportSpecifier(declaration) && (declaration.isTypeOnly || (ts.isImportClause(declaration.parent.parent) && declaration.parent.parent.isTypeOnly)) || ts.isImportClause(declaration) && declaration.isTypeOnly) return failed("unsupported_binding");
        const specifier = moduleSpecifier(declaration);
        if (!specifier) return failed("unsupported_binding");
        const exported = ts.isImportSpecifier(declaration) ? (declaration.propertyName ?? declaration.name).text : "default";
        return resolveExport(specifier.text, exported, declaration.getSourceFile(), side, [...linkage, nodeAnchor(declaration, side)], visited, links);
      }
      if (ts.isExportSpecifier(declaration)) {
        if (declaration.isTypeOnly || ts.isExportDeclaration(declaration.parent.parent) && declaration.parent.parent.isTypeOnly) return failed("unsupported_binding");
        const nextLinkage = [...linkage, nodeAnchor(declaration, side)];
        const specifier = moduleSpecifier(declaration);
        if (specifier) {
          if (links >= input.budgets.reExportLinks) return failed("reexport_limit");
          return resolveExport(specifier.text, (declaration.propertyName ?? declaration.name).text, declaration.getSourceFile(), side, nextLinkage, visited, links + 1);
        }
        const local = state.checker.getExportSpecifierLocalTargetSymbol(declaration);
        return local && local !== symbol ? resolveSymbol(local, side, nextLinkage, visited, links) : failed("cyclic_resolution");
      }
      if (ts.isExportAssignment(declaration) && ts.isIdentifier(declaration.expression)) {
        const local = state.checker.getSymbolAtLocation(declaration.expression);
        return local && local !== symbol ? resolveSymbol(local, side, [...linkage, nodeAnchor(declaration, side)], visited, links) : failed("cyclic_resolution");
      }
      if (ts.isFunctionExpression(declaration) && ts.isVariableDeclaration(declaration.parent)) {
        const target = infoByDeclaration.get(declaration.parent);
        if (target && ts.isVariableDeclarationList(declaration.parent.parent) && declaration.parent.parent.flags & ts.NodeFlags.Const) return { target, linkage, signatures: [] };
      }
      const implementations = declarations.filter(item => ts.isFunctionDeclaration(item) && item.body);
      if (implementations.length > 1) return failed("ambiguous_implementation", implementations.map(item => nodeAnchor(item, side)));
      if (declarations.some(ts.isFunctionDeclaration)) {
        if (!implementations.length) return failed("declaration_only", declarations.map(item => nodeAnchor(item, side)));
        const implementation = implementations[0]!;
        const target = infoByDeclaration.get(implementation);
        if (!target || target.value.kind === "callback") return failed("unsupported_binding");
        if (semanticBlocks(implementation, side, target.body.getStart())) return failed("semantic_obstruction");
        return { target, linkage, signatures: declarations.filter(item => ts.isFunctionDeclaration(item) && !item.body).map(item => nodeAnchor(item, side)) };
      }
      if (ts.isVariableDeclaration(declaration)) {
        if (!ts.isVariableDeclarationList(declaration.parent) || !(declaration.parent.flags & ts.NodeFlags.Const)) return failed("mutable_binding", [nodeAnchor(declaration, side)]);
        if (declarations.length !== 1) return failed("ambiguous_implementation", declarations.map(item => nodeAnchor(item, side)));
        const target = infoByDeclaration.get(declaration);
        if (!target) return failed(!declaration.initializer && (declaration.getSourceFile().isDeclarationFile || sourceMap.get(key(side, declaration.getSourceFile().fileName.slice(ROOT.length)))?.role === "declaration-only") ? "declaration_only" : "unsupported_binding", [nodeAnchor(declaration, side)]);
        if (semanticBlocks(declaration, side, target.body.getStart())) return failed("semantic_obstruction");
        return { target, linkage, signatures: [] };
      }
      return failed("unsupported_binding", declarations.map(item => nodeAnchor(item, side)));
    };
    for (const site of sites.sort((a, b) => sourceOrder(a.source, b.source) || a.node.getStart() - b.node.getStart() || a.node.end - b.node.end)) {
      const { node, source, owner, file } = site;
      const state = functionsBySide.get(source.side)!;
      const row = ledger.get(key(source.side, source.path))!;
      const siteAnchor = anchor(source, file, node);
      let binding: Binding;
      if (!ts.isCallExpression(node)) binding = failed(ts.isNewExpression(node) ? "unsupported_dispatch" : "dynamic_invocation");
      else if (ts.isIdentifier(node.expression)) {
        if (node.expression.text === "eval") binding = failed("dynamic_invocation");
        else {
          const symbol = state.checker.getSymbolAtLocation(node.expression);
          binding = symbol ? resolveSymbol(symbol, source.side) : failed("missing_binding");
        }
      } else if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
        const symbol = state.checker.getSymbolAtLocation(node.expression.expression);
        const namespace = symbol?.declarations?.find(ts.isNamespaceImport);
        const specifier = namespace ? moduleSpecifier(namespace) : undefined;
        binding = namespace && specifier && ts.isImportClause(namespace.parent) && !namespace.parent.isTypeOnly
          ? state.writes.has(symbol!) ? failed("mutable_binding") : resolveExport(specifier.text, node.expression.name.text, namespace.getSourceFile(), source.side, [nodeAnchor(namespace, source.side)], new Set(), 0)
          : failed("unsupported_dispatch");
      } else binding = failed(node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isCallExpression(node.expression) ? "dynamic_invocation" : "unsupported_dispatch");
      if ("target" in binding && (semanticBlocks(node, source.side) || binding.linkage.some(link => {
        const linkFile = state.files.get(ROOT + link.path);
        return linkFile && state.semantic.get(linkFile)?.some(diagnostic => intersects(diagnostic, link.start, link.end));
      }))) binding = failed("semantic_obstruction", [binding.target.value.declaration]);
      if ("reason" in binding) {
        unresolved.push({ id: digest(stable([owner.value.id, siteAnchor, binding.reason])), caller: owner.value.id, anchor: siteAnchor, syntax: ts.SyntaxKind[node.kind]!, reason: binding.reason, candidates: binding.candidates.sort(anchorOrder) });
        row.unresolved = (row.unresolved ?? 0) + 1;
      } else {
        const id = digest(stable([owner.value.id, binding.target.value.id]));
        const edge = edgeMap.get(id) ?? { id, caller: owner.value.id, callee: binding.target.value.id, target: binding.target.value.declaration, sites: [], method: "ts-static-binding-v1", certainty: "resolved_static" };
        edge.sites.push({ anchor: siteAnchor, conditional: ts.isCallExpression(node) && (!!node.questionDotToken || ts.isPropertyAccessExpression(node.expression) && !!node.expression.questionDotToken), linkage: binding.linkage, signatures: binding.signatures.sort(anchorOrder) });
        edgeMap.set(id, edge);
        row.resolved = (row.resolved ?? 0) + 1;
      }
    }
    for (const row of coverage) if (row.status === "scanned") { row.resolved ??= 0; row.unresolved ??= 0; }
    if (nodes.length > input.budgets.outputNodes) return budget("outputNodes");
    const edges = [...edgeMap.values()].sort((a, b) => {
      const left = nodes.find(info => info.value.id === a.caller)!.value;
      const right = nodes.find(info => info.value.id === b.caller)!.value;
      return anchorOrder(left.declaration, right.declaration) || anchorOrder(a.target, b.target);
    });
    if (edges.reduce((count, edge) => count + edge.sites.length, unresolved.length) > input.budgets.outputSites) return budget("outputSites");
    const incomplete = (side: Side) => coverage.some(row => row.side === side && row.status !== "scanned") || input.corpus[side].inventory !== "repository-enumeration";
    const neighborhoods: Neighborhood[] = seeds.map(seed => {
      const source = sourceMap.get(key(seed.side, seed.path));
      let unresolvedSeed: Neighborhood["unresolvedSeed"] = null;
      let info: FunctionInfo | undefined;
      if (!source?.source || !source.selected || source.exclusion || ledger.get(key(seed.side, seed.path))?.status !== "scanned") unresolvedSeed = "source_unavailable";
      else if (source.source.contentHash !== seed.contentHash) unresolvedSeed = "hash_mismatch";
      else if (!Number.isSafeInteger(seed.start) || !Number.isSafeInteger(seed.end) || seed.start < 0 || seed.end <= seed.start || seed.end > source.source.content.length) unresolvedSeed = "invalid_range";
      else {
        info = nodes.find(candidate => candidate.value.kind !== "module" && candidate.value.kind !== "callback" && candidate.value.declaration.side === seed.side && candidate.value.declaration.path === seed.path && candidate.value.declaration.start === seed.start && candidate.value.declaration.end === seed.end);
        if (!info) unresolvedSeed = "unsupported_or_absent";
      }
      const incoming = info ? edges.filter(edge => edge.callee === info!.value.id).map(edge => edge.id) : [];
      const outgoing = info ? edges.filter(edge => edge.caller === info!.value.id).map(edge => edge.id) : [];
      const unknown = info ? unresolved.filter(site => site.caller === info!.value.id).map(site => site.id) : [];
      return { seed: copy(seed), nodeId: info?.value.id ?? null, unresolvedSeed, incoming, outgoing, unresolved: unknown,
        outgoingAssessment: !info || blockedConfiguration || info.jsx && !info.invocations ? "not_fully_analyzed" : info.invocations ? "invocations_present" : "No explicit invocation sites in this function body under the supported syntax scan.",
        incomingAssessment: incoming.length ? "resolved_callers_found" : "No resolved callers found in these supplied files", incomingScope: "supplied_files_only",
        limitations: ["static-binding-is-not-runtime-execution", "test-path-classification-is-not-execution-evidence", ...(incomplete(seed.side) ? ["incomplete-incoming-source-scope"] : []), ...(info?.jsx ? ["framework-invocation-not-analyzed"] : [])],
      };
    });
    return freeze({ ...metadata(), status: "analyzed", nodes: nodes.map(info => info.value).sort((a, b) => anchorOrder(a.declaration, b.declaration) || compare(a.kind, b.kind)), edges, unresolved: unresolved.sort((a, b) => anchorOrder(a.anchor, b.anchor) || compare(a.syntax, b.syntax)), neighborhoods });
  } catch (error) {
    return unavailable({ reason: "parser_failure", detail: error instanceof Error ? error.message : String(error) });
  }
};
