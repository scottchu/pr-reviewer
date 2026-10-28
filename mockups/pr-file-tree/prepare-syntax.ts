import ts from 'typescript-analysis';
import source from './full-source.json' with { type: 'json' };
import { writeFileSync } from 'node:fs';

type Token = { kind: string; text: string };
const output: Record<string, Token[][]> = {};
for (const file of source.files) {
  if (!/\.(?:[cm]?[jt]sx?|json)$/.test(file.path)) continue;
  for (const side of ['before', 'after'] as const) {
    const text = file[side];
    if (text === null) continue;
    const rows: Token[][] = [[]];
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
      const kind = token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia ? 'comment'
        : token >= ts.SyntaxKind.FirstKeyword && token <= ts.SyntaxKind.LastKeyword ? 'keyword'
        : [ts.SyntaxKind.StringLiteral, ts.SyntaxKind.NoSubstitutionTemplateLiteral, ts.SyntaxKind.TemplateHead, ts.SyntaxKind.TemplateMiddle, ts.SyntaxKind.TemplateTail].includes(token) ? 'string'
        : token === ts.SyntaxKind.NumericLiteral || token === ts.SyntaxKind.BigIntLiteral ? 'number' : 'plain';
      const parts = scanner.getTokenText().split('\n');
      for (const [index, part] of parts.entries()) {
        if (index) rows.push([]);
        if (part) rows.at(-1)!.push({ kind, text: part });
      }
    }
    if (rows.map(row => row.map(token => token.text).join('')).join('\n') !== text) throw new Error(`syntax_bytes_changed:${file.path}:${side}`);
    output[`${file.path}:${side}`] = rows;
  }
}
writeFileSync(new URL('./syntax.json', import.meta.url), JSON.stringify(output));
console.log(`Prepared exact lexical colors for ${Object.keys(output).length} source sides`);
