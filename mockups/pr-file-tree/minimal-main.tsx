import {sourceGraph} from './source-graph.ts';
import {mountReviewGraph} from '../../src/review-graph/ui/components/ReviewGraph.tsx';
const root=document.getElementById('root');
if(!root)throw new Error('minimal_root_missing');
mountReviewGraph(root,sourceGraph);
