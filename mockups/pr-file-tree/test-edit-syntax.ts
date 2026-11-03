import index from './test-edit-syntax.json' with {type: 'json'};
import type {SourceSyntaxUI} from '../../src/review-graph/ui/types.ts';
const rows = index as Readonly<Record<string, ReturnType<SourceSyntaxUI>>>;
export const testEditSyntaxLine: SourceSyntaxUI = (path, side, line, text) =>
    (line === null ? undefined : rows[`${path}:${side}:${line}`]) ?? [{kind: 'plain', text}];
