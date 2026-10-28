import React from 'react';
import { syntaxLine } from './syntax.ts';
export const SyntaxCode = ({ path, side, line, text }: { path: string; side: 'before' | 'after'; line: number | null; text: string }) => <>
  {syntaxLine(path, side, line, text).map((token, index) => <span className={`syntax-${token.kind}`} key={index}>{token.text}</span>)}
</>;
