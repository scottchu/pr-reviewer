import React, {useCallback, useMemo, useRef, useState} from 'react';
import {FileDiffBody, fileDiffs, type DiffMode, type SourceRelation} from '../pr-file-tree/file-diff.tsx';
import type {FileReading, ReadingFocus} from '../pr-file-tree/reading.ts';
import sample from './change-sample.json' with {type: 'json'};
import '../pr-file-tree/source-reader.css';

export const SharedDiff = ({initialMode = 'unified'}: {initialMode?: DiffMode}) => {
    const [mode, setMode] = useState<DiffMode>(initialMode);
    const reading = useRef<FileReading | undefined>(undefined);
    const [selected, setSelected] = useState<SourceRelation | null>(null);
    const save = useCallback((value: FileReading) => {reading.current = value;}, []);
    const focus = useMemo<ReadingFocus>(() => ({
        id: sample.id, path: sample.witnesses[0]!.anchor.path, name: sample.name,
        before: sample.witnesses.filter(value => value.anchor.side === 'base').map(value => ({startLine: value.anchor.startLine, endLine: value.anchor.endLine})),
        after: sample.witnesses.filter(value => value.anchor.side === 'head').map(value => ({startLine: value.anchor.startLine, endLine: value.anchor.endLine})),
        preferredSide: 'after',
    }), []);
    const file = fileDiffs.get(focus.path);
    if (!file) throw new Error('stage2_pinned_diff_missing');
    return <section className="stage2-diff" aria-label="Diff">
        <h3>Diff</h3>
        <div className="stage2-reader">
            <div className="reader-modes" role="group" aria-label="Diff mode">{(['unified', 'split'] as const).map(value =>
                <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'unified' ? 'Unified' : 'Split'}</button>)}</div>
            <FileDiffBody file={file} mode={mode} fullscreen={false} width={760} onExplain={setSelected}
                activeRelation={selected} reading={reading.current} onReading={save} restoreVersion={0} focus={focus}/>
        </div>
        {selected && <p role="status">Selected source comparison {selected.index + 1} · {selected.side} · {file.path}</p>}
    </section>;
};
