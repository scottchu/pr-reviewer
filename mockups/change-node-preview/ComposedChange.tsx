import React, {useCallback, useRef, useState} from 'react';
import {FileDiffBody, fileDiffs, type DiffMode, type SourceRelation} from '../pr-file-tree/file-diff.tsx';
import type {FileReading, ReadingFocus} from '../pr-file-tree/reading.ts';
import type {ComposedPresentationState} from './presentation-state.ts';
import type {GraphEntity} from '../../src/review-graph/domain/types.ts';
import {assertionsFor, codePath, directTestReference, gatewayFunction, occurrences, sampleChange, sampleTests, sourceFocus, testPath} from './sample.ts';

export const SharedReader = ({path, focus, label, state}: {path: string; focus: ReadingFocus; label: string; state: ComposedPresentationState}) => {
    const identity = focus.id;
    const host = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<DiffMode>(() => state.reader(identity).mode);
    const reading = useRef<FileReading | undefined>(state.reader(identity).reading);
    const [inspected, setInspected] = useState<SourceRelation | null>(() => state.reader(identity).inspected);
    const save = useCallback((value: FileReading) => {
        if (!host.current?.getClientRects().length || host.current.closest('[inert],[aria-hidden="true"]')) return;
        reading.current = value; state.saveReader(identity, {reading: value});
    }, [state, identity]);
    const changeMode = (value: DiffMode) => {state.saveReader(identity, {mode: value}); setMode(value);};
    const inspect = (value: SourceRelation) => {state.saveReader(identity, {inspected: value}); setInspected(value);};
    const file = fileDiffs.get(path);
    if (!file) throw new Error('preview_source_file_missing:' + path);
    return <div ref={host} className="composed-reader nodrag nopan nowheel" aria-label={label}>
        <div role="group" aria-label={label + ' diff mode'} className="composed-modes">{(['unified', 'split'] as const).map(value =>
            <button type="button" key={value} aria-pressed={mode === value} onClick={() => changeMode(value)}>{value === 'unified' ? 'Unified' : 'Split'}</button>)}
        </div>
        <FileDiffBody file={file} mode={mode} fullscreen={false} width={760} onExplain={inspect}
            activeRelation={inspected} reading={reading.current} onReading={save} restoreVersion={0} focus={focus}/>
        {inspected && <p className="composed-source-caption" role="status">Selected source comparison {inspected.index + 1} · {inspected.side} · {path}</p>}
    </div>;
};
const TestProjection = ({test, onReflow, state}: {test: GraphEntity; onReflow: () => void; state: ComposedPresentationState}) => {
    const assertions = assertionsFor(test);
    const [selectedId, setSelectedId] = useState<string | null>(() => state.test(test.id).selectedId);
    const [open, setOpen] = useState(() => state.test(test.id).open);
    const selected = selectedId === test.id ? test : assertions.find(value => value.id === selectedId) ?? null;
    const select = (entity: GraphEntity) => {state.saveTest(test.id, {selectedId: entity.id}); setSelectedId(entity.id); onReflow();};
    const refs = directTestReference(test);
    const name = String(test.data.name);
    return <details className="composed-test" data-test-id={test.id} open={open} onToggle={event => {
        const next = event.currentTarget.open; if (next === open) return;
        state.saveTest(test.id, {open: next}); setOpen(next); onReflow();
    }}>
        <summary><span>{name}</span><small>{String(test.data.comparisonStatus)} source · {assertions.length} Assertions · not run</small></summary>
        <p className="composed-source-caption">Static source reference: {refs.map(value => value.side + ' L' + value.line).join(' / ')} → imported createGateway. Not a coverage claim.</p>
        <button type="button" onClick={() => select(test)}>Read Test source</button>
        <ol className="composed-assertions" aria-label={name + ' Assertions'}>{assertions.map(assertion =>
            <li key={assertion.id} data-assertion-id={assertion.id}><button type="button" onClick={() => select(assertion)}>{String(assertion.data.name)}</button></li>)}</ol>
        {open && selected && <div className="composed-test-reader"><p>{selected.kind === 'test' ? 'Test source' : 'Assertion source within its Test'}</p>
            <SharedReader state={state} key={selected.id} path={testPath} focus={selected.kind === 'test' ? sourceFocus(test, 'test') : {...sourceFocus(test, 'test'), ...{
                id: 'assertion:' + selected.id, preferredSide: sourceFocus(selected).preferredSide,
                before: sourceFocus(selected).before, after: sourceFocus(selected).after,
            }}} label={selected.kind === 'test' ? name : String(selected.data.name)}/></div>}
    </details>;
};
export const ComposedChange = ({entity, onReflow, state}: {entity: GraphEntity; onReflow: () => void; state: ComposedPresentationState}) => {
    if (entity.id !== sampleChange.id) return null;
    return <div className="composed-change" data-composed-change={entity.id}>
        <p className="composed-source-caption">Whole PR25 graph · composed projection preview · same canonical identities</p>
        <section aria-label="Explaining"><h3>Explaining</h3>
            <p>The gateway source distinguishes a missing Authorization value from explicitly supplied credentials. Compare the local-owner branch with the explicit credential checks, then inspect the added and unchanged gateway Tests.</p>
            <p className="composed-source-caption">Source-backed reading of the pinned change. Static test calls are evidence of association, not successful execution or complete coverage.</p>
        </section>
        <section aria-label="Diff"><h3>Diff</h3><SharedReader state={state} path={codePath} focus={sourceFocus(gatewayFunction)} label="createGateway change"/></section>
        <section aria-label="Tests"><h3>Tests</h3>
            {(['Changed', 'Unchanged'] as const).map(group => {
                const tests = sampleTests.filter(test => (test.data.comparisonStatus === 'no change') === (group === 'Unchanged'));
                return <div key={group} className="composed-test-group"><h4>{group} <small>{tests.length}{group === 'Changed' ? ' added' : ' unchanged'}</small></h4>
                    {tests.map(test => <TestProjection key={test.id} test={test} onReflow={onReflow} state={state}/>)}</div>;
            })}
        </section>
    </div>;
};
