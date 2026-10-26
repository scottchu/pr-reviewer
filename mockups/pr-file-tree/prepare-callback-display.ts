import ts from 'typescript-analysis';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { CallbackDisplay, DisplayTarget } from './callback-display.ts';

type Source = { path: string; before: string | null; after: string | null };
export const prepareCallbackDisplays = (nodes: readonly DisplayTarget[], sources: readonly Source[]): CallbackDisplay[] => {
  const result: CallbackDisplay[] = [];
  for (const source of sources) for (const side of ['base', 'head'] as const) {
    const text = side === 'base' ? source.before : source.after;
    if (text === null) continue;
    const hash = createHash('sha256').update(text).digest('hex');
    const targets = nodes.filter(node => node.declaration.path === source.path && node.declaration.side === side
      && node.declaration.contentHash === hash && node.name === `<callback@${node.declaration.start}>`);
    if (!targets.length) continue;
    const ast = ts.createSourceFile(source.path, text, ts.ScriptTarget.Latest, true,
      source.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const candidates: { node: ts.Node; property: string }[] = [];
    const visit = (node: ts.Node): void => {
      const assignment = (ts.isArrowFunction(node) || ts.isFunctionExpression(node))
        && ts.isPropertyAssignment(node.parent) && node.parent.initializer === node
        && ts.isObjectLiteralExpression(node.parent.parent) ? node.parent : null;
      const method = ts.isMethodDeclaration(node) && node.body && ts.isObjectLiteralExpression(node.parent) ? node : null;
      const name = assignment?.name ?? method?.name;
      if (name && ts.isIdentifier(name)) candidates.push({ node, property: name.text });
      ts.forEachChild(node, visit);
    };
    visit(ast);
    for (const target of targets) {
      const exact = candidates.find(candidate => candidate.node.getStart(ast) === target.declaration.start
        && candidate.node.end === target.declaration.end);
      if (!exact || candidates.filter(candidate => candidate.property === exact.property).length !== 1) continue;
      const qualifier = source.path.split('/').at(-1)!.replace(/\.[^.]+$/, '');
      result.push({ id: target.id, canonicalName: target.name,
        displayName: `${qualifier}.${exact.property}`, propertyName: exact.property,
        basis: 'static-object-property', declaration: { ...target.declaration } });
    }
  }
  return result;
};

// Explicit preparation only; imports in normal tests never rewrite artifacts.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const json = (name: string): unknown => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
  const packets = ['calls-clients.json', 'calls-storage.json', 'calls-scope.json'].map(name => json(name) as {
    nodes: DisplayTarget[]; seeds: DisplayTarget[]; contextDeclarations: DisplayTarget[];
  });
  const nodes = [...new Map(packets.flatMap(packet => [...packet.nodes, ...packet.seeds, ...packet.contextDeclarations])
    .map(node => [node.id, node])).values()];
  const sources = json('full-source.json') as { files: Source[] };
  writeFileSync(new URL('callback-display.json', import.meta.url), `${JSON.stringify({ records: prepareCallbackDisplays(nodes, sources.files) }, null, 2)}\n`);
}
