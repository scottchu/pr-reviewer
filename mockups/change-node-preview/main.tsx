import React from 'react';
import '../pr-file-tree/style.css';
import '../pr-file-tree/minimal.css';
import {mountReviewGraph} from '../../src/review-graph/ui/components/ReviewGraph.tsx';
import {createGraphSession} from '../../src/review-graph/ui/session.ts';
import {sourceGraph} from '../pr-file-tree/source-graph.ts';
import {ComposedChange} from './ComposedChange.tsx';
import {sampleChange, sampleSession} from './sample.ts';
import './preview.css';
const root = document.getElementById('root');
if (!root) throw new Error('change_preview_root_missing');
const session = sampleSession().reduce((state, id) => state.expand(id, false), createGraphSession(sourceGraph));
mountReviewGraph(root, session, {
    initialFocusId: sampleChange.id,
    renderChangeBody: (entity, onReflow) => entity.id === sampleChange.id ? <ComposedChange entity={entity} onReflow={onReflow}/> : null,
});
