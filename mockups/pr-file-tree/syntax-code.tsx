import React from 'react';
import { syntaxLine } from './syntax.ts';
import {SyntaxCode as SharedSyntaxCode} from '../../src/review-graph/ui/components/SyntaxCode.tsx';
export const SyntaxCode = (props: {path: string; side: 'before' | 'after'; line: number | null; text: string}) =>
  <SharedSyntaxCode {...props} syntax={syntaxLine}/>;
