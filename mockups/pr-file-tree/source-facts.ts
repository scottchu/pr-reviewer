import ts from 'typescript-analysis';
import {createHash} from 'node:crypto';

export const sourceFactsParserVersion = ts.version;

export type SourceInput = Readonly<{
  repository: string; side: 'base' | 'head'; commit: string; path: string;
  content: string; contentHash: string; gitBlob: string;
}>;
export type SourceAnchor = Readonly<{
  repository: string; side: 'base' | 'head'; commit: string; path: string;
  contentHash: string; start: number; end: number; startLine: number; endLine: number;
}>;
export type StructuralUnit = Readonly<{
  id: string; kind: 'function' | 'callsite' | 'test' | 'assertion';
  name: string; sourceText: string; anchor: SourceAnchor; ownerId?: string;
  basis: string; diagnostic?: string;
}>;
export const sourceHash = (value: string): string => createHash('sha256').update(value).digest('hex');
const frameworks = new Set(['node:test', 'bun:test', '@playwright/test']);
const assertions = new Set(['node:assert', 'node:assert/strict', 'assert', 'assert/strict']);

/** Exact syntactic facts only. Cross-file binding, matching and intent are separate. */
export const extractSourceFacts = (input: SourceInput): readonly StructuralUnit[] => {
  if (sourceHash(input.content) !== input.contentHash) throw new Error('source_facts_hash_mismatch');
  if (!/\.(?:ts|tsx|mts|cts)$/.test(input.path)) return [];
  const fileName = '/' + input.path;
  const ast = ts.createSourceFile(fileName, input.content, ts.ScriptTarget.Latest, true,
    input.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const host: ts.CompilerHost = {
    getSourceFile: name => name === fileName ? ast : undefined,
    getDefaultLibFileName: () => '', writeFile: () => {}, getCurrentDirectory: () => '/',
    getDirectories: () => [], fileExists: name => name === fileName,
    readFile: name => name === fileName ? input.content : undefined,
    getCanonicalFileName: name => name, useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  };
  const program = ts.createProgram([fileName], {noLib: true, noResolve: true, target: ts.ScriptTarget.Latest}, host);
  if (program.getSyntacticDiagnostics(ast).length) throw new Error('source_facts_syntax_unavailable');
  const checker = program.getTypeChecker();
  const imports = new Map<ts.Symbol, {module: string; name: string}>();
  for (const statement of ast.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const module = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const retain = (name: ts.Identifier, imported: string) => {
      const symbol = checker.getSymbolAtLocation(name);
      if (symbol) imports.set(symbol, {module, name: imported});
    };
    if (clause.name) retain(clause.name, 'default');
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const binding of clause.namedBindings.elements) {
        if (!binding.isTypeOnly) retain(binding.name, binding.propertyName?.text ?? binding.name.text);
      }
    } else if (clause.namedBindings) retain(clause.namedBindings.name, '*');
  }
  const imported = (node: ts.Expression) => ts.isIdentifier(node)
    ? imports.get(checker.getSymbolAtLocation(node)!) : undefined;
  const root = (node: ts.Expression): ts.Expression => ts.isPropertyAccessExpression(node)
    ? root(node.expression) : node;
  const isTest = (call: ts.CallExpression): boolean => {
    const expression = call.expression;
    const binding = imported(root(expression));
    if (!binding || !frameworks.has(binding.module)) return false;
    if (!['test', 'it', 'default'].includes(binding.name)) return false;
    if (ts.isPropertyAccessExpression(expression) && !['only', 'skip', 'todo'].includes(expression.name.text)) return false;
    return Boolean(call.arguments[0] && (ts.isStringLiteralLike(call.arguments[0]) || ts.isTemplateExpression(call.arguments[0])));
  };
  const assertMethods = new Set(['ok','fail','equal','notEqual','strictEqual','notStrictEqual','deepEqual','notDeepEqual','deepStrictEqual','notDeepStrictEqual','partialDeepStrictEqual','throws','doesNotThrow','rejects','doesNotReject','ifError','match','doesNotMatch']);
  const matchers = new Set(['toBe','toEqual','toStrictEqual','toBeTruthy','toBeFalsy','toBeNull','toBeUndefined','toBeDefined','toContain','toContainEqual','toHaveLength','toMatch','toMatchObject','toThrow','toBeGreaterThan','toBeGreaterThanOrEqual','toBeLessThan','toBeLessThanOrEqual','toHaveCount','toHaveText','toContainText','toHaveValue','toHaveValues','toHaveAttribute','toHaveCSS','toHaveClass','toHaveURL','toHaveTitle','toBeVisible','toBeHidden','toBeAttached','toBeEnabled','toBeDisabled','toBeChecked','toHaveJSProperty','toBeFocused','toBeEditable','toBeEmpty','toBeInViewport','toMatchSnapshot']);
  const propertyParts = (node: ts.Expression): {root: ts.Expression; names: string[]} => {
    if (!ts.isPropertyAccessExpression(node)) return {root: node, names: []};
    const prior = propertyParts(node.expression);
    return {root: prior.root, names: [...prior.names, node.name.text]};
  };
  const assertionKind = (call: ts.CallExpression): 'assertion' | 'unsupported' | null => {
    const parts = propertyParts(call.expression);
    const binding = imported(parts.root);
    if (binding && assertions.has(binding.module)) {
      const names = parts.names.filter((name, index) => !(index === 0 && name === 'strict'));
      const direct = names.length === 0 && ['default','*','strict',...assertMethods].includes(binding.name);
      return direct || (['default','*','strict'].includes(binding.name) && names.length === 1 && assertMethods.has(names[0]!)) ? 'assertion' : 'unsupported';
    }
    if (!ts.isCallExpression(parts.root)) return null;
    const expect = imported(parts.root.expression);
    if (!expect || !frameworks.has(expect.module) || expect.name !== 'expect') return null;
    const matcher = parts.names.at(-1);
    return matcher && matchers.has(matcher) && parts.names.slice(0,-1).every(name => ['not','resolves','rejects'].includes(name)) ? 'assertion' : 'unsupported';
  };
  const units: StructuralUnit[] = [];
  const anchor = (node: ts.Node): SourceAnchor => {
    const start = node.getStart(ast), end = node.getEnd();
    return {
      repository: input.repository, side: input.side, commit: input.commit, path: input.path,
      contentHash: input.contentHash, start, end,
      startLine: ast.getLineAndCharacterOfPosition(start).line + 1,
      endLine: ast.getLineAndCharacterOfPosition(Math.max(start, end - 1)).line + 1,
    };
  };
  const add = (node: ts.Node, kind: StructuralUnit['kind'], name: string, ownerId?: string) => {
    const location = anchor(node);
    const id = sourceHash(JSON.stringify({kind, ...location}));
    units.push({id, kind, name, sourceText: input.content.slice(location.start, location.end),
      anchor: location, ...(ownerId ? {ownerId} : {}),
      basis: kind === 'callsite' ? 'AST invocation syntax; target binding not established' :
        kind === 'test' || kind === 'assertion' ? 'AST syntax with exact imported lexical binding; not execution' : 'AST declaration/body syntax'});
    return id;
  };
  const functionName = (node: ts.FunctionLikeDeclaration): string => {
    if (node.name) return node.name.getText(ast);
    if (ts.isVariableDeclaration(node.parent) || ts.isPropertyAssignment(node.parent)) return node.parent.name.getText(ast);
    if (ts.isConstructorDeclaration(node)) return 'constructor';
    return 'anonymous function';
  };
  const visit = (node: ts.Node, ownerId?: string, testId?: string): void => {
    let owner = ownerId;
    let test = testId;
    if (ts.isFunctionLike(node) && 'body' in node && node.body) {
      owner = add(node, 'function', functionName(node as ts.FunctionLikeDeclaration), ownerId);
    }
    if (ts.isCallExpression(node)) {
      if (isTest(node)) {
        const title = node.arguments[0]!;
        test = add(node, 'test', ts.isStringLiteralLike(title) ? title.text : title.getText(ast), ownerId);
      }
      const assertion = testId ? assertionKind(node) : null;
      if (assertion === 'assertion') add(node, 'assertion', node.getText(ast), testId);
      const siteId = add(node, 'callsite', node.expression.getText(ast), owner);
      if (assertion === 'unsupported') {
        const index = units.findIndex(unit => unit.id === siteId);
        units[index] = {...units[index]!, diagnostic: 'Unsupported imported assertion API/matcher; no Assertion fact admitted'};
      }
    }
    ts.forEachChild(node, child => visit(child, owner, test));
  };
  visit(ast);
  return units.sort((a, b) => a.anchor.start - b.anchor.start || a.kind.localeCompare(b.kind));
};
