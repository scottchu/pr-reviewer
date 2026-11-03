import React, {useEffect, useState} from 'react';
import {SharedDiff} from './SharedDiff.tsx';
import {RelatedTests} from './RelatedTests.tsx';
import {createComposedPresentationState} from '../change-node-preview/presentation-state.ts';
import sample from './change-sample.json' with {type: 'json'};

export const ChangeCard = ({onMounted}: {onMounted?: () => void}) => {
    useEffect(() => {onMounted?.();}, [onMounted]);
    const [readingState] = useState(createComposedPresentationState);
    const contextURL = `https://github.com/${sample.repository}/blob/${sample.context.commit}/${sample.context.path}#L${sample.context.startLine}-L${sample.context.endLine}`;
    return <article className="change-card" aria-labelledby="change-title" data-change-id={sample.id}>
        <header><p className="eyebrow">PR25 · one selected edit in createGateway</p><h1 id="change-title">{sample.selection.title}</h1></header>
        <p className="source-path">src/server/public.ts · Before L61–64 → After L61–67 · {sample.selection.added} added / {sample.selection.removed} removed</p>
        <section aria-label="Explaining"><h3>Explaining</h3>
            <p><strong>Source fact.</strong> Missing Authorization now selects store.localOwner before authentication. Explicit values still go through the format check and Bearer-token path shown below.</p>
            <p><strong>Context.</strong> The <a href={contextURL} target="_blank" rel="noreferrer">pinned runtime specification</a> calls for a single local owner without browser credentials.</p>
            <p><strong>Review question.</strong> Is missing-credential access constrained to the intended local-owner boundary? This excerpt and the declared tests do not establish that boundary.</p>
        </section>
        <SharedDiff state={readingState}/>
        <RelatedTests state={readingState}/>
        <details className="source-identity"><summary>Source identity</summary>
            <p>Enclosing Change: {sample.name}<br/><span className="source-id">{sample.id}</span></p>
            {sample.witnesses.map(witness => <p key={witness.id}>{witness.anchor.side === 'base' ? 'Before' : 'After'} commit: <span className="source-id">{witness.anchor.commit}</span></p>)}
            <p>The selected range is part of this existing Change; other edits in its native hunk are outside this card.</p>
        </details>
    </article>;
};
