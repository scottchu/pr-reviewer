import React from 'react';
import type {SourceSyntaxUI} from '../types.ts';
import './source-syntax.css';

export const SyntaxCode = ({path, side, line, text, syntax}: {
    path: string; side: 'before' | 'after'; line: number | null; text: string; syntax?: SourceSyntaxUI | undefined;
}) => {
    const proposed = syntax?.(path, side, line, text);
    const tokens = proposed?.map(token => token.text).join('') === text ? proposed : [{kind: 'plain', text}];
    return <>{tokens.map((token, index) => <span className={'syntax-' + token.kind} key={index}>{token.text}</span>)}</>;
};
