import React, {useMemo, useState} from 'react';
import type {ReadingFocus} from '../pr-file-tree/reading.ts';
import related from './related-tests.json' with {type: 'json'};
import {createComposedPresentationState, type ComposedPresentationState} from '../change-node-preview/presentation-state.ts';
import {SharedDiff} from './SharedDiff.tsx';

type RelatedTest = typeof related.tests[number];
type SourceSubject = {id: string; name: string; occurrences: RelatedTest['occurrences']};
const Test = ({test, state}: {test: RelatedTest; state: ComposedPresentationState}) => {
    const [selected, setSelected] = useState<SourceSubject | null>(null);
    const focus = useMemo<ReadingFocus | null>(() => selected ? {
        id: selected.id, name: selected.name, path: selected.occurrences[0]!.anchor.path,
        before: selected.occurrences.filter(value => value.anchor.side === 'base').map(value => ({startLine:value.anchor.startLine,endLine:value.anchor.endLine})),
        after: selected.occurrences.filter(value => value.anchor.side === 'head').map(value => ({startLine:value.anchor.startLine,endLine:value.anchor.endLine})),
        preferredSide: selected.occurrences.some(value => value.anchor.side === 'head') ? 'after' : 'before', scope:'selection',
    } : null, [selected]);
    return <details className="related-test" data-test-id={test.id}>
        <summary>{test.name}<small>{test.status === 'add' ? 'Added' : 'Unchanged'} source · {test.assertions.length} Assertions</small></summary>
        <button type="button" onClick={() => setSelected(test)}>Read Test source</button>
        <ol aria-label={test.name + ' Assertions'}>{test.assertions.map(assertion => <li key={assertion.id} data-assertion-id={assertion.id}>
            <button type="button" onClick={() => setSelected(assertion)}>{assertion.name}</button>
        </li>)}</ol>
        {focus && <SharedDiff key={focus.id} state={state} focus={focus} label={selected?.id === test.id ? 'Test source' : 'Assertion source line'}/>}
    </details>;
};
export const RelatedTests = ({state}: {state?: ComposedPresentationState}) => {
    const [owned] = useState(createComposedPresentationState);
    const cache = state ?? owned;
    return <section aria-label="Tests" className="related-tests">
    <h3>Tests</h3>
    <p className="evidence-note">These Tests call the enclosing createGateway function. This is a source association; it does not establish coverage of this edit. No execution result is supplied.</p>
    {related.tests.filter(test => test.status === 'add').map(test => <Test key={test.id} state={cache} test={test}/>)}
    <details className="unchanged-tests"><summary>Unchanged Tests ({related.tests.filter(test => test.status === 'no change').length})</summary>
        {related.tests.filter(test => test.status === 'no change').map(test => <Test key={test.id} state={cache} test={test}/>)}</details>
</section>;
};
