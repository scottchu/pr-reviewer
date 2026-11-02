import React, {useEffect, useState} from 'react';
import sample from './change-sample.json' with {type: 'json'};

/** Presentation of one retained canonical Change; later reader/graph stages are absent. */
export const ChangeCard = ({onMounted}: {onMounted?: () => void}) => {
    useEffect(() => {onMounted?.();}, [onMounted]);
    const [responses, setResponses] = useState(0);
    return <article className="change-card" aria-labelledby="change-title" data-change-id={sample.id}>
        <header><p className="eyebrow">PR25 · source change</p><h2 id="change-title">{sample.name}</h2></header>
        <p className="source-path">{sample.witnesses[0]!.anchor.path}</p>
        <p>{sample.added} added · {sample.removed} removed lines in this source unit.</p>
        <p>No intent or runtime conclusion is supplied by these source facts.</p>
        <dl className="witnesses">{sample.witnesses.map(witness => <div key={witness.id}>
            <dt>{witness.anchor.side === 'base' ? 'Before' : 'After'}</dt>
            <dd>{witness.anchor.commit.slice(0, 7)} · L{witness.anchor.startLine}–{witness.anchor.endLine}</dd>
        </div>)}</dl>
        <details><summary>Source identity</summary>
            <p>Canonical Change: <span className="source-id">{sample.id}</span></p>
            <p>Repository: {sample.repository}</p>
            {sample.witnesses.map(witness => <p key={witness.id}>{witness.anchor.side === 'base' ? 'Before' : 'After'} commit: <span className="source-id">{witness.anchor.commit}</span></p>)}
        </details>
        <div className="response-check"><button type="button" onClick={() => setResponses(value => value + 1)}>Check card response</button>
            <p role="status">Card responses: {responses}</p></div>
    </article>;
};
