import {reportPreviewDiagnostic} from './diagnostics.ts';
import React from 'react';
import '../pr-file-tree/style.css';
import '../pr-file-tree/minimal.css';
import {mountReviewGraph} from '../../src/review-graph/ui/components/ReviewGraph.tsx';
import {createGraphSession} from '../../src/review-graph/ui/session.ts';
import {sourceGraph} from '../pr-file-tree/source-graph.ts';
import {ComposedChange} from './ComposedChange.tsx';
import {sampleChange, sampleSession} from './sample.ts';
import {createComposedPresentationState} from './presentation-state.ts';
import './preview.css';
const state = createComposedPresentationState();
const root = document.getElementById('root');
if (!root) throw new Error('change_preview_root_missing');
const session = sampleSession().reduce((state, id) => state.expand(id, false), createGraphSession(sourceGraph));
reportPreviewDiagnostic({stage: 'session', nodes: session.view.nodes.length, entities: session.view.entities.length, edges: session.view.relations.length});
mountReviewGraph(root, session, {
    ...(new URLSearchParams(location.search).get('camera') === 'manual' ? {} : {initialFocusId: sampleChange.id}),
    diagnostic: reportPreviewDiagnostic,
    readerPins: [sampleChange.id],
    renderChangeBody: (entity, onReflow) => entity.id === sampleChange.id ? <ComposedChange entity={entity} onReflow={onReflow} state={state}/> : null,
});
