import './change-edit-code.css';
import React from 'react';
import {SyntaxCode} from './SyntaxCode.tsx';
import type {SourceEditNodeUI, SourceSyntaxUI} from '../types.ts';

export const SourceEditCode = ({edit, syntax, ...scroll}: {edit: SourceEditNodeUI; syntax?: SourceSyntaxUI | undefined} & Pick<React.ComponentProps<'div'>, 'ref' | 'onScroll'>) =>
    <><div {...scroll} className="change-source-edit-code source-code nodrag nopan nowheel" data-reader-kind="source-edit"
        tabIndex={0} aria-label={edit.kind === 'remove' ? 'Removed code' : 'Added code'}>
        {edit.rows.map((row, index) => {
            const ending = row.text.endsWith('\r\n') ? '\r\n' : row.text.endsWith('\n') ? '\n' : '';
            const text = ending ? row.text.slice(0, -ending.length) : row.text;
            return <div className="source-edit-row" key={row.hunkIndex + ':' + row.line + ':' + index}>
                <span className="source-edit-line" aria-hidden="true">L{row.line}</span>
                <code data-source-line={row.line} data-source-hunk={row.hunkIndex}>
                    <SyntaxCode path={row.witness.path} side={edit.kind === 'remove' ? 'before' : 'after'} line={row.line} text={text} syntax={syntax}/>{ending}
                </code>
            </div>;
        })}
    </div>
    {edit.relationships?.map(({reference,line})=><p key={reference.id} className="source-edit-reference"
        data-source-relationship={reference.relation} data-source-line={line} data-source-side={reference.source.side}
        data-relation-ids={JSON.stringify(reference.relationIds)} data-target-id={reference.targetId}
        title={reference.source.commit+' · '+reference.source.path+' · L'+reference.source.startLine+'–'+reference.source.endLine+' · SHA256 '+reference.source.contentHash}
        aria-label={(reference.source.side==='base'?'Before':'After')+' source '+reference.relation+' '+reference.targetLabel+' · L'+line+'; source evidence, not execution'}>
        {reference.source.side==='base'?'Before':'After'} · {reference.relation} → {reference.targetLabel} · L{line}
    </p>)}
    </>;
