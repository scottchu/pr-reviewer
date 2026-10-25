import React from 'react';
import diffs from './diffs.json' with {type:'json'};
export type FileDiff=typeof diffs.files[number];
export const fileDiffs=new Map(diffs.files.map(file=>[file.path,file]));
export const FileDiffBody=({file}:{file:FileDiff})=><div className="source-diff nodrag nopan nowheel" tabIndex={0} role="region" aria-label={`Pinned diff for ${file.path}`} onWheel={event=>event.stopPropagation()}>
 <div className="diff-origin">{file.path}</div>
 {file.hunks.map((h,index)=><section className="diff-hunk" key={`${h.header}:${index}`} aria-label={h.header}><div className="hunk-heading">{h.header}</div><div className="diff-columns">
 {(['before','after'] as const).map(side=>{const source=file[side],rows=h.rows.filter(row=>side==='before'?row.beforeLine!==null:row.afterLine!==null),start=side==='before'?h.beforeStart:h.afterStart,count=side==='before'?h.beforeCount:h.afterCount;return <section className={`diff-side ${side}`} key={side} aria-label={`${side} source`}><div className="side-heading" title={`${file.path}\n${source.commit}\nFull-source UTF-8 SHA-256 ${source.hash??'absent side'}`}><strong>{side==='before'?'Before':'After'}</strong><span>{source.commit.slice(0,7)} · {count?`L${start}–${start+count-1}`:'absent'}</span></div>{!source.available?<p className="absent-side">File absent on this side.</p>:<pre><code>{rows.map((row,i)=><span className={`diff-line ${row.kind}`} key={i} data-line={side==='before'?row.beforeLine:row.afterLine} data-mark={row.kind==='removed'?'−':row.kind==='added'?'+':' '} data-source-text={row.text}>{row.text}</span>)}</code></pre>}</section>;})}
 </div></section>)}
 </div>;
