import ts from 'typescript-analysis';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import source from './full-source.json' with { type: 'json' };
import type { CallAnchor } from './calls.ts';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
// Deliberately bounded source observation, not a new semantic analyzer. Only
// three named top-level arrows in the pinned private-scope source are admitted.
export const prepareBehaviorContext = (files: typeof source.files) => {
  const path = 'src/application/private-session.ts';
  const file = files.find(file => file.path === path);
  if (!file) throw new Error('scope_source_missing');
  const names = ['credentialScope', 'requestFingerprint', 'encodedBytes'];
  const records = (['base', 'head'] as const).flatMap(side => {
    const text = side === 'base' ? file.before : file.after;
    if (!text) throw new Error('scope_side_missing');
    const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const anchor = (node: ts.Node): CallAnchor => ({
      snapshotId: 'pr25-pinned-scope-evidence', side, path, contentHash: hash(text),
      start: node.getStart(ast), end: node.getEnd(),
      startLine: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      endLine: ast.getLineAndCharacterOfPosition(node.getEnd() - 1).line + 1,
    });
    const arrows = ast.statements.flatMap(statement => ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.flatMap(declaration => ts.isIdentifier(declaration.name)
        && names.includes(declaration.name.text) && declaration.initializer && ts.isArrowFunction(declaration.initializer)
        ? [{ statement, declaration, arrow: declaration.initializer }] : []) : []);
    if (arrows.length !== names.length) throw new Error('scope_declaration_ambiguous');
    const nodes = arrows.map(({ statement, declaration, arrow }) => {
      const name = declaration.name.getText(ast);
      const declarationAnchor = anchor(statement);
      const body = anchor(arrow.body);
      return { id: hash(JSON.stringify({ name, declarationAnchor })), name, declaration: declarationAnchor, body,
        exactBodySHA256: hash(text.slice(body.start, body.end)) };
    });
    const caller = nodes.find(node => node.name === 'credentialScope')!;
    const arrow = arrows.find(item => item.declaration.name.getText(ast) === caller.name)!.arrow;
    const sites = new Map<string, { anchor: CallAnchor; sourceText: string }[]>();
    const visit = (node: ts.Node) => {
      if ((ts.isParameter(node) || ts.isVariableDeclaration(node)) && names.includes(node.name.getText(ast))) {
        throw new Error('scope_lexical_shadowing');
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && names.includes(node.expression.text)) {
        const values = sites.get(node.expression.text) ?? [];
        values.push({ anchor: anchor(node), sourceText: node.getText(ast) });
        sites.set(node.expression.text, values);
      }
      ts.forEachChild(node, visit);
    };
    visit(arrow);
    const calls = [...sites].map(([name, sites]) => {
      const callee = nodes.find(node => node.name === name)!;
      return { id: hash(`${caller.id}:${callee.id}`), caller: caller.id, callee: callee.id,
        target: callee.declaration, sites, certainty: 'source_observed_manual' as const,
        method: 'bounded_same_file_lexical_observation',
        analyzerDisposition: { reason: 'Supplemental pinned source observation; no semantic analyzer admission is asserted.' } };
    });
    if (calls.length !== 2) throw new Error('scope_call_frontier_changed');
    return [{ nodes, calls }];
  });
  const nodes = records.flatMap(record => record.nodes);
  const unchanged = nodes.filter(node => nodes.some(other => other.declaration.side !== node.declaration.side
    && other.name === node.name && other.exactBodySHA256 === node.exactBodySHA256));
  return { format: 'bounded-private-scope-source-context-v1',
    scope: { paths: [path], wholePRCoverage: false, boundary: 'Only the three named lexical declarations and direct calls; platform calls and other callers are unresolved.' },
    seeds: nodes.filter(node => node.name === 'credentialScope'), nodes,
    contextDeclarations: unchanged, edges: [], sourceObservedCalls: records.flatMap(record => record.calls) };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('./calls-scope.json', import.meta.url), JSON.stringify(prepareBehaviorContext(source.files), null, 2) + '\n');
  const document = readFileSync(new URL('../../docs/product/pr25-whole-change-graph.md', import.meta.url), 'utf8');
  const paths = [...document.matchAll(/^\| (G[1-8]) \| `([^`]+)` \|/gm)].map(match => ({ group: match[1]!, path: match[2]! }));
  if (paths.length !== 50 || new Set(paths.map(item => item.path)).size !== 50) throw new Error('whole_scope_ledger_invalid');
  writeFileSync(new URL('./behavior-groups.json', import.meta.url), JSON.stringify(paths, null, 2) + '\n');
}
