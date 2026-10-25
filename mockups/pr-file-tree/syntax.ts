import syntax from './syntax.json' with { type: 'json' };
export type SyntaxToken = Readonly<{ kind: string; text: string }>;
const colors = syntax as Readonly<Record<string, readonly (readonly SyntaxToken[])[]>>;
export const syntaxLine = (path: string, side: 'before' | 'after', line: number | null, text: string): readonly SyntaxToken[] => {
  const tokens = line ? colors[`${path}:${side}`]?.[line - 1] : undefined;
  return tokens?.map(token => token.text).join('') === text ? tokens : [{ kind: 'plain', text }];
};
