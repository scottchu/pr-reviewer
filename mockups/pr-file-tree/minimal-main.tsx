import {createGraphSession} from '../../src/review-graph/ui/session.ts';
import {sourceGraph} from './source-graph.ts';
import {mountReviewGraph} from '../../src/review-graph/ui/components/ReviewGraph.tsx';
import {testEditSyntaxLine} from './test-edit-syntax.ts';
const root=document.getElementById('root');
if(!root)throw new Error('minimal_root_missing');
mountReviewGraph(root,createGraphSession(sourceGraph),testEditSyntaxLine);
