import React, {useCallback, useRef, useState} from 'react';
import {FileDiffBody, fileDiffs, type DiffMode} from '../pr-file-tree/file-diff.tsx';
import type {FileReading, ReadingFocus} from '../pr-file-tree/reading.ts';
import {createComposedPresentationState, type ComposedPresentationState} from '../change-node-preview/presentation-state.ts';
import sample from './change-sample.json' with {type: 'json'};
import '../pr-file-tree/source-reader.css';

export const editFocus: ReadingFocus = {
    id: sample.id + ':selected-auth-edit', path: sample.witnesses[0]!.anchor.path, name: sample.selection.title,
    before: sample.selection.before, after: sample.selection.after, preferredSide: 'after', scope: 'selection',
};
export const SharedDiff = ({initialMode, focus = editFocus, label = 'Diff', state}: {initialMode?: DiffMode; focus?: ReadingFocus; label?: string; state?: ComposedPresentationState}) => {
    const [owned] = useState(createComposedPresentationState);
    const cache = state ?? owned;
    const host = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<DiffMode>(() => initialMode ?? cache.reader(focus.id).mode);
    const reading = useRef<FileReading | undefined>(cache.reader(focus.id).reading);
    const save = useCallback((value: FileReading) => {
        if (!host.current?.getClientRects().length) return;
        reading.current = value; cache.saveReader(focus.id, {reading:value});
    }, [cache, focus.id]);
    const file = fileDiffs.get(focus.path);
    if (!file) throw new Error('selected_pinned_diff_missing');
    return <section className="stage2-diff" aria-label={label}>
        <h3>{label}</h3>
        <div ref={host} className="stage2-reader single-selection">
            <div className="reader-modes" role="group" aria-label={label + ' mode'}>{(['unified', 'split'] as const).map(value =>
                <button key={value} type="button" aria-pressed={mode === value} onClick={() => {cache.saveReader(focus.id, {mode:value}); setMode(value);}}>{value === 'unified' ? 'Unified' : 'Split'}</button>)}</div>
            <FileDiffBody file={file} mode={mode} fullscreen={false} width={760} onExplain={() => {}}
                activeRelation={null} reading={reading.current} onReading={save} restoreVersion={0} focus={focus}/>
        </div>
    </section>;
};
