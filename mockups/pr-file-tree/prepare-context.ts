import ts from 'typescript-analysis';
import { writeFileSync } from 'node:fs';
import source from './full-source.json' with { type: 'json' };
import diffs from './diffs.json' with { type: 'json' };
type Range = {
  start: number;
  end: number;
  startLine: number;
  endLine: number;
  kind: 'function' | 'statement';
  name: string;
};
const files = diffs.files.map(file => {
  const full = source.files.find(s => s.path === file.path)!;
  const collect = (side: 'before' | 'after') => {
    const text = full[side];
    if (text === null)
      return [];
    const ast = ts.createSourceFile(file.path, text, ts.ScriptTarget.Latest, true, file.path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const functions: Range[] = [];
    const properties: Range[] = [];
    const statements: Range[] = [];
    const make = (node: ts.Node, kind: Range['kind']): Range => {
      const start = node.getStart(ast);
      const end = node.getEnd();
      const name = 'name' in node && node.name && typeof node.name === 'object' && 'getText' in node.name ? (node.name as ts.Node).getText(ast) : kind;
      return {
        start,
        end,
        startLine: ast.getLineAndCharacterOfPosition(start).line + 1,
        endLine: ast.getLineAndCharacterOfPosition(Math.max(start, end - 1)).line + 1,
        kind,
        name
      };
    };
    const visit = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node))
        properties.push(make(node, 'statement'));
      if (ts.isFunctionLike(node) && 'body' in node && node.body) {
        let owner: ts.Node = node;
        if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isVariableDeclaration(node.parent))
          owner = ts.isVariableDeclarationList(node.parent.parent) && ts.isVariableStatement(node.parent.parent.parent) ? node.parent.parent.parent : node.parent;
        if ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isPropertyAssignment(node.parent))
          owner = node.parent;
        functions.push({
          ...make(owner, 'function'),
          name: ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(ast) : make(owner, 'function').name
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    ast.statements.forEach(s => statements.push(make(s, 'statement')));
    const offsets = [
      0
    ];
    for (let i = 0;i < text.length;i++)
      if (text[i] === '\n')
        offsets.push(i + 1);
    const selected: Range[] = [];
    for (const h of file.hunks) {
      let i = 0;
      while (i < h.rows.length) {
        if (h.rows[i]!.kind === 'context') {
          i++;
          continue;
        }
        const old: typeof h.rows = [];
        const next: typeof h.rows = [];
        while (i < h.rows.length && h.rows[i]!.kind !== 'context') {
          const r = h.rows[i++]!;
          (r.kind === 'removed' ? old : next).push(r);
        }
        const rows = side === 'before' ? old : next;
        for (const row of rows) {
          const line = side === 'before' ? row.beforeLine : row.afterLine;
          if (line === null)
            continue;
          let from = row.text.search(/\S/);
          let to = row.text.trimEnd().length;
          if (from < 0)
            continue;
          if (old.length === 1 && next.length === 1) {
            const a = old[0]!.text;
            const b = next[0]!.text;
            from = 0;
            while (from < Math.min(a.length, b.length) && a[from] === b[from])
              from++;
            let suffix = 0;
            while (suffix < Math.min(a.length, b.length) - from && a[a.length - 1 - suffix] === b[b.length - 1 - suffix])
              suffix++;
            to = Math.max(from, row.text.length - suffix);
          }
          const start = (offsets[line - 1] ?? 0) + from;
          const end = (offsets[line - 1] ?? 0) + Math.max(from + 1, to);
          const callable = functions.filter(f => f.start <= start && f.end > start).sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
          const statement = statements.find(s => s.start <= start && s.end >= Math.min(end, text.length));
          const property = properties.filter(s => s.start <= start && s.end > start).sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
          const chosen = callable ?? property ?? statement;
          if (chosen && !selected.some(s => s.start === chosen.start && s.end === chosen.end))
            selected.push(chosen);
        }
      }
    }
    return selected.sort((a, b) => a.start - b.start);
  };
  return {
    path: file.path,
    before: collect('before'),
    after: collect('after')
  };
});
writeFileSync(new URL('./function-context.json', import.meta.url), JSON.stringify({
  base: source.base,
  head: source.head,
  method: 'Existing TypeScript source ranges; exact single-row replacement prefix/suffix narrows the responsible callable, no counterpart/function alignment inferred',
  files
}));
console.log(JSON.stringify({
  files: files.length,
  ranges: files.reduce((n, f) => n + f.before.length + f.after.length, 0)
}));
