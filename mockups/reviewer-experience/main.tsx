import React,{useCallback,useEffect,useLayoutEffect,useReducer,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ReactFlow,ReactFlowProvider,type Node,type NodeProps} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './style.css';
import fixture from './fixture.json' with {type:'json'};
import {account,codeAnchor,initialJourney,proseAnchor,transition,type Anchor,type Intent,type Journey,type SourceKey,type Side} from './journey.ts';

const labels:Record<SourceKey,string>={request:'Build request headers',helper:'Choose owner or credential headers',refresh:'Refresh the pinned review',gateway:'Derive the local owner',owner:'Owner capability',test:'Check credential-free access'};
const chapters=['Open the local review','Read the header change','Follow the owner decision','Read unchanged refresh','Challenge the credential boundary'];
type Dispatch=(a:Intent)=>void;
const readSelection=(element:HTMLElement):{start:number;end:number}|null=>{
 const selection=window.getSelection();if(!selection||selection.isCollapsed||selection.rangeCount===0)return null;
 const range=selection.getRangeAt(0);if(!element.contains(range.startContainer)||!element.contains(range.endContainer))return null;
 const prefix=range.cloneRange();prefix.selectNodeContents(element);prefix.setEnd(range.startContainer,range.startOffset);
 const start=prefix.toString().length;return {start,end:start+range.toString().length};
};
const anchorLabel=(a:Anchor)=>a.kind==='code'?`${a.side==='after'?'After':'Before'} · ${a.path}:${a.startLine}–${a.endLine}`:`Explanation v${a.version} · characters ${a.startOffset+1}–${a.endOffset}`;
const CommentAction=({dispatch}:{dispatch:Dispatch})=><button className="comment-action nodrag nopan" onClick={()=>dispatch({type:'comment'})}>＋ Comment on selection</button>;
const Source=({sourceKey,side,journey,dispatch}:{sourceKey:SourceKey;side:Side;journey:Journey;dispatch:Dispatch})=>{
 const source=fixture.sources[sourceKey][side];const code=useRef<HTMLElement>(null);const [from,setFrom]=useState(0);const [to,setTo]=useState(0);const [context,setContext]=useState(false);
 useEffect(()=>{setContext(false);setFrom(0);setTo(0);},[sourceKey]);
 if(!source)return <div className="absent"><span className="eyebrow">Before · {fixture.base.slice(0,7)}</span><p>{sourceKey==='helper'?'File absent in baseline.':'This supporting citation includes the head source only.'}</p></div>;
 const focusLine=sourceKey==='request'&&!context;const offset=focusLine?source.text.split('\n').slice(0,5).join('\n').length+1:0;const shown=focusLine?(source.text.split('\n')[5]??''):source.text.trimEnd();
 const selectNative=()=>{if(!code.current)return;const range=readSelection(code.current);if(range)dispatch({type:'select',anchor:codeAnchor(sourceKey,side,offset+range.start,offset+range.end)});};
 const selected=journey.selection?.kind==='code'&&journey.selection.source===sourceKey&&journey.selection.side===side;
 const textLines=source.text.trimEnd().split('\n');const start=from||source.startLine,end=to||start;
 const explicitRange=()=>{const offsets=textLines.map((_,index)=>textLines.slice(0,index).join('\n').length+(index?1:0));const i=Math.max(0,start-source.startLine),j=Math.max(i,end-source.startLine);const begin=offsets[i]??0,finish=(offsets[j]??0)+(textLines[j]?.length??0);if(finish>begin)dispatch({type:'select',anchor:codeAnchor(sourceKey,side,begin,finish)});};
 return <section className={`source-side ${side}`} aria-label={`${side} ${sourceKey}`}>
  <div className="source-heading"><strong>{side==='before'?'Before':'After'}</strong><span>{source.commit.slice(0,7)} · L{focusLine?source.startLine+5:source.startLine}{!focusLine?`–${source.endLine}`:' · changed'}</span></div>
  <div className="code-scroll wrapped nodrag nopan nowheel" tabIndex={0} aria-label={`${side} code, horizontally scrollable`}><pre className="line-numbers" aria-hidden="true">{textLines.map((_,i)=>source.startLine+i).join('\n')}</pre><pre><code ref={code} onMouseUp={selectNative} onTouchEnd={selectNative} onKeyUp={selectNative}>{shown}</code></pre></div>
  {sourceKey==='request'&&<button className="context-button nodrag nopan" onClick={()=>setContext(!context)}>{context?'Return to changed line':'More function context · retained excerpt'}</button>}
  {selected&&<CommentAction dispatch={dispatch}/>}
  {journey.draft.anchor?.kind==='code'&&journey.draft.anchor.source===sourceKey&&journey.draft.anchor.side===side&&<button className="thread-marker source-marker nodrag nopan" onClick={()=>dispatch({type:'openThread'})} aria-label="Scott, human, one local comment draft"><span className="avatar">S</span>♧ 1 <span>Scott · L{journey.draft.anchor.startLine} · local draft</span></button>}
  <details className="range-picker nodrag nopan"><summary>Select a line range · keyboard</summary><div><label>From <input aria-label={`${side} first line`} type="number" min={source.startLine} max={source.endLine} value={start} onChange={e=>setFrom(Number(e.target.value))}/></label><label>To <input aria-label={`${side} last line`} type="number" min={start} max={source.endLine} value={end} onChange={e=>setTo(Number(e.target.value))}/></label><button onClick={explicitRange}>Select lines</button></div></details>
  <details className="identity nodrag nopan"><summary>Exact source identity</summary><p>{source.path}</p><p>Commit {source.commit}</p><p>UTF-8 SHA-256 {source.contentHash}</p><p>Excerpt UTF-16 [{source.startOffset}, {source.endOffset}); source retained in this mock fixture.</p></details>
 </section>;
};
const Thread=({journey:s,dispatch}:{journey:Journey;dispatch:Dispatch})=>{
 const anchor=s.draft.anchor;const input=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{if(s.threadOpen)input.current?.focus({preventScroll:true});},[s.threadOpen]);
 if(!s.threadOpen||!anchor)return null;
 return <section className="thread nodrag nopan" aria-label="Contextual comment thread" onKeyDown={e=>{if(e.key==='Escape'){dispatch({type:'closeThread'});document.querySelector<HTMLButtonElement>('.thread-marker')?.focus();}}}>
  <div className="thread-heading"><strong>Comment on this {anchor.kind==='code'?'source':'explanation'}</strong><button aria-label="Close thread, keep draft" onClick={()=>dispatch({type:'closeThread'})}>×</button></div>
  <p className="anchor-label">{anchorLabel(anchor)}</p><blockquote>{anchor.quote}</blockquote>
  <p className="speaker"><span className="avatar">S</span><strong>Scott</strong><span>Human · local draft</span></p>
  <label className="composer-label" htmlFor="comment-draft">Your question <span className="composer-anchor">{anchor.kind==='code'?`${anchor.side==='after'?'After':'Before'} · ${anchor.path.split('/').at(-1)}:${anchor.startLine}`:`Explanation v${anchor.version} · local prose`}</span></label><textarea id="comment-draft" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();dispatch({type:'closeThread'});document.querySelector<HTMLButtonElement>('.thread-marker')?.focus();}}} ref={input} placeholder="What remains unclear about this change?" value={s.draft.text} onChange={e=>dispatch({type:'draft',text:e.target.value})}/>
  <p className="local-note">Local mock only · draft stays in this page. Nothing saved or sent.</p>
  {s.conflict&&<div role="alert"><p>Another anchor has your held draft.</p><button onClick={()=>dispatch({type:'keepDraft'})}>Keep current draft</button><button onClick={()=>dispatch({type:'replaceDraft'})}>Discard draft and use new anchor</button></div>}
  <div className="prepared-reply"><h4>Prepared example — not a reply to this draft</h4><p className="speaker"><span className="avatar agent">M</span><strong>Mira</strong><span>Agent · prepared example</span></p><p>An explicit credential takes its own path. Check the gateway branch and the invalid-credential test definition. The test is source evidence here, not a recorded passing run.</p><div className="thread-links"><button onClick={()=>dispatch({type:'inspect',source:'gateway'})}>Read gateway branch ↗</button><button onClick={()=>dispatch({type:'inspect',source:'test'})}>Read test definition ↗</button></div><small>Authored sample reply, not a received agent answer.</small></div>
  <details><summary>Delivery boundary</summary><p>No participant is attached in this mock; native delivery is unverified. Source inspection remains available.</p><button onClick={()=>dispatch({type:'unknown'})}>Preview unknown delivery</button>{s.delivery==='unknown'&&<p role="status">Demonstration: delivery unknown. Held draft unchanged; no request was sent.</p>}</details>
 </section>;
};
const Relationship=({journey:s,dispatch}:{journey:Journey;dispatch:Dispatch})=><div className="relationship nodrag nopan" aria-label="Source-backed relationship">
 <button className={`graph-card context ${s.frame.focus==='refresh'?'active':''}`} onClick={()=>dispatch({type:'inspect',source:'refresh'})}><span className="kind">○ Unchanged context</span><strong>refresh()</strong><span>Reads the pinned review</span><small>review.ts:35–45</small></button>
 <div className="edge"><span>calls request</span><b aria-hidden="true">→</b><small>source · L38</small></div>
 <button className={`graph-card modified ${s.frame.focus==='request'?'active':''}`} onClick={()=>dispatch({type:'inspect',source:'request'})}><span className="kind">~ Modified</span><strong>request()</strong><span>Bearer → header choice</span><small>review.ts:25–32</small></button>
 <div className="edge added"><span>now references</span><b aria-hidden="true">→</b><small>source · L30</small></div>
 <button className={`graph-card added ${s.frame.focus==='helper'?'active':''}`} onClick={()=>dispatch({type:'inspect',source:'helper'})}><span className="kind">＋ Added helper</span><strong>accessHeaders()</strong><span>Local owner → no Bearer<br/>Explicit credential → Bearer</span><small>local-access.ts:1–3</small></button>
 </div>;
const claims:Record<SourceKey,string>={request:'The direct Bearer header becomes accessHeaders(captured). The request path and cancellation guards stay in place.',helper:'local-owner:v1 → no Authorization header. A different credential → Bearer header. This illustrates the source branch; it is not recorded network traffic.',refresh:'This body is unchanged apart from its line position. It still passes the review ID, minimum revision and selected snapshot into request(). Its header policy changes through that dependency.',gateway:'No Authorization header selects store.localOwner. A supplied credential is authenticated separately. This is cited cross-layer explanation, not a browser-to-storage call edge.',owner:'The configured owner has user authority. This supporting source does not establish host/origin protection or complete agent capability enforcement.',test:'The test definition covers credential-free reads/writes and rejects explicit invalid credentials. Test definition only; not run by this mock.'};
type GroupData={journey:Journey;dispatch:Dispatch;width:number;onHeight:(height:number)=>void};
type GroupNode=Node<GroupData,'reviewGroup'>;
const ReviewGroup=({data}:NodeProps<GroupNode>)=>{
 const {journey:s,dispatch,width,onHeight}=data;const ref=useRef<HTMLDivElement>(null);const focus=s.frame.focus;
 useLayoutEffect(()=>{if(!ref.current)return;const observer=new ResizeObserver(entries=>{const e=entries[0];if(e)onHeight(Math.ceil(e.borderBoxSize[0]?.blockSize??e.contentRect.height)+32);});observer.observe(ref.current);return()=>observer.disconnect();},[onHeight]);
 return <div ref={ref} className="review-group" style={{width}}>
  <div className="group-heading"><div><span className="eyebrow">Open the local review</span><h2>Same refresh. A different header decision.</h2></div><span className="group-count">3 source locations</span></div>
  <Relationship journey={s} dispatch={dispatch}/>
  {!focus&&<div className="connected-explanation"><span className="explanation-line"/><p>Refresh still reads the same pinned review; its request now follows the new header rule. <button onClick={()=>dispatch({type:'step',step:1})}>Read the header change →</button></p></div>}
  {focus&&<section className="inline-reading" aria-label="Inline source reading">
   <div className="reading-cue"><span>Open the local review → {labels[focus]}</span><button className="nodrag nopan" onClick={()=>dispatch({type:'inspect',source:'request'})} hidden={focus==='request'}>↖ Request context</button></div>
   <div className="reading-title"><h3>{labels[focus]}</h3>{focus==='refresh'&&<span className="status">Unchanged body</span>}{focus==='test'&&<span className="warning">Test definition · unrun</span>}</div>
   <p className="claim">{claims[focus]}</p><p className="path">{fixture.sources[focus].after.path}</p>
   {s.unavailable?<div className="unavailable" role="alert"><strong>Requested source unavailable</strong><p>The exact excerpt could not be opened in this demonstration. Your reading frame and draft are retained; no replacement bytes or comment anchor were guessed.</p><button onClick={()=>dispatch({type:'inspect',source:focus})}>Retry this retained excerpt</button></div>:<div className={`source-pair ${focus==='request'||focus==='refresh'||focus==='helper'?'comparison':'single'}`}>
    {(focus==='request'||focus==='refresh'||focus==='helper')&&<Source sourceKey={focus} side="before" journey={s} dispatch={dispatch}/>}
    <Source sourceKey={focus} side="after" journey={s} dispatch={dispatch}/>
   </div>}
   <div className="reading-foot nodrag nopan"><span>{focus==='test'?'No execution result in this mock.':'Source observations, not runtime evidence.'}</span><details><summary>Source availability example</summary><button onClick={()=>dispatch({type:'missing'})}>Show requested-source unavailable</button></details></div>
  </section>}
  <div className="evidence-branch nodrag nopan"><span className="branch-mark" aria-hidden="true">└</span><p><strong>What stops an invalid credential becoming the owner?</strong><span>Authored cross-layer explanation · not a call edge</span></p><button onClick={()=>dispatch({type:'inspect',source:'gateway'})}>Gateway branch ↗</button><button onClick={()=>dispatch({type:'inspect',source:'test'})}>Test definition <small>unrun</small> ↗</button></div>
  {s.draft.anchor?.kind==='code'&&s.draft.anchor.source!==focus&&<div className="marker-lane nodrag nopan"><button className="thread-marker" onClick={()=>dispatch({type:'openThread'})} aria-label="Scott, human, one local comment draft"><span className="avatar">S</span>♧ 1 <span>Scott · {s.draft.anchor.kind==='code'?`${s.draft.anchor.path.split('/').at(-1)}:${s.draft.anchor.startLine}`:'explanation v1'} · local draft</span></button>{s.draft.anchor.kind==='code'&&s.draft.anchor.source!==focus&&<button onClick={()=>dispatch({type:'inspect',source:s.draft.anchor?.kind==='code'?s.draft.anchor.source:'request'})}>Locate anchor ↗</button>}</div>}
  <Thread journey={s} dispatch={dispatch}/>
 </div>;
};
const nodeTypes={reviewGroup:ReviewGroup};
const Canvas=({journey,dispatch}:{journey:Journey;dispatch:Dispatch})=>{
 const ref=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(900);const [height,setHeight]=useState(440);const onHeight=useCallback((h:number)=>setHeight(old=>old===h?old:h),[]);
 useLayoutEffect(()=>{if(!ref.current)return;const o=new ResizeObserver(([e])=>{if(e)setWidth(Math.max(250,e.contentRect.width-32));});o.observe(ref.current);return()=>o.disconnect();},[]);
 const nodes:GroupNode[]=[{id:'authored-pr25-group',type:'reviewGroup',position:{x:16,y:16},data:{journey,dispatch,width,onHeight},draggable:false,selectable:false,focusable:false,measured:{width,height:Math.max(1,height-32)}}];
 return <div ref={ref} className="canvas" aria-label="Persistent review canvas" style={{height:Math.max(height,390)}}><ReactFlowProvider><ReactFlow nodes={nodes} nodeTypes={nodeTypes} edges={[]} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag={false} panOnScroll={false} zoomOnScroll={false} zoomOnDoubleClick={false} zoomOnPinch={false} preventScrolling={false} minZoom={1} maxZoom={1} onNodeClick={()=>{}} defaultViewport={{x:0,y:0,zoom:1}} proOptions={{hideAttribution:true}}/></ReactFlowProvider></div>;
};
const App=()=>{
 const [s,dispatch]=useReducer(transition,undefined,initialJourney);const prose=useRef<HTMLParagraphElement>(null);const [scope,setScope]=useState(false);const [chaptersOpen,setChaptersOpen]=useState(false);
 const selectProse=()=>{if(prose.current){const range=readSelection(prose.current);if(range)dispatch({type:'select',anchor:proseAnchor(range.start,range.end)});}};
 return <>
 <header className="pr-strip"><strong>PR Reviewer</strong><span>scottchu / pr-reviewer <b>PR #25</b></span><span className="pr-name">Open the local review without a pasted token</span><button onClick={()=>setScope(!scope)} aria-expanded={scope}>Context & scope <span aria-hidden="true">⌄</span></button></header>
 {scope&&<aside className="scope" aria-label="PR context and complete scope"><h2>One connected part of PR25</h2><p>Prepared design story · author: mockup author · not native analysis or agent delivery. Product rationale: remove the owner credential-paste interruption under PR25’s single local owner requirement. No public anonymous-access claim.</p><p>Base {fixture.base} → head {fixture.head}. This chapter covers request headers, unchanged refresh and cited gateway/test support; it does not explain all {fixture.ledger.length} changed files.</p><div className="context-actions"><button onClick={()=>{dispatch({type:s.story?'sourceOnly':'story'});setScope(false);}}>{s.story?'View source without prepared explanation':'Open prepared explanation, paused'}</button><a href={fixture.prUrl} target="_blank" rel="noreferrer">Own PR25 ↗</a></div><details><summary>Complete changed-file ledger · {fixture.ledger.length} files</summary><ul>{fixture.ledger.map(f=><li key={f.path}><code>{f.path}</code><span>+{f.added} −{f.removed}</span></li>)}</ul></details></aside>}
 <main>
  <section className="question-context" aria-label="Current review question">
   <span className="eyebrow">Open the local review</span><h1>{s.story?'How can I open my local review without a token, while agent requests still have credentials?':'Request-header construction changed.'}</h1>
   {s.story?<><p ref={prose} className="answer" onMouseUp={selectProse} onTouchEnd={selectProse} onKeyUp={selectProse}>{account}</p><p className="attribution">Prepared explanation · source-backed design content</p>{s.selection?.kind==='prose'&&<CommentAction dispatch={dispatch}/>} {s.draft.anchor?.kind==='prose'&&<button className="thread-marker prose-marker" aria-label="Scott, human, one local comment draft" onClick={()=>dispatch({type:'openThread'})}><span className="avatar">S</span>♧ 1 <span>Scott · explanation v1 · local draft</span></button>}<details className="prose-comment"><summary>Comment on explanation · keyboard</summary><p>Select the first sentence as an exact local prose range.</p><button onClick={()=>dispatch({type:'select',anchor:proseAnchor(0,account.indexOf('.')+1)})}>Select first sentence</button></details></>:<><p className="answer">Inspect the pinned source change and its cited references now.</p><p className="warning">Explanation not available · no agent attached</p><p>No story is being generated. Questions cannot be delivered from this local mock.</p></>}
   <div className="orientation"><span className="focus-dot"/><div><strong>{s.frame.focus?labels[s.frame.focus]:'Headers and their unchanged consumer'}</strong><span>{s.returnFrame?'Exploring · saved story position held':'Source-backed relation · no runtime claim'}</span></div></div>
   <details className="limits"><summary>What is not established?</summary><p>Source shows header and credential branches. This mock does not prove network protection, complete agent authorization, test execution or native notification. All drafts are local and disappear on reload.</p></details>
   {(s.history.length>0||s.returnFrame)&&<nav className="return-actions" aria-label="Reading return"><button onClick={()=>dispatch({type:'back'})} disabled={!s.history.length}>← Back</button>{s.returnFrame&&<button onClick={()=>dispatch({type:'resume'})}>Resume step {s.returnFrame.step+1}</button>}</nav>}
  </section>
  <section className="canvas-area"><div className="canvas-heading"><h2>How the change fits together</h2><span>~ Modified <i>＋ Added</i> ○ Context</span></div><Canvas journey={s} dispatch={dispatch}/></section>
 </main>
 <footer className="mock-boundary">Design mockup · PR25 pinned source · local drafts only · no live agent or test run</footer>
 {s.story&&<nav className="player" aria-label="Paused story player"><span className="paused-indicator" title="Paused · explicit Next">Paused</span><button aria-label="Previous step" disabled={s.frame.step===0} onClick={()=>dispatch({type:'step',step:s.frame.step-1})}>←</button><div className="progress"><button aria-label="Story progress and chapters" aria-expanded={chaptersOpen} onClick={()=>setChaptersOpen(!chaptersOpen)}>{s.frame.step+1} / 5 <span>⌄</span></button>{chaptersOpen&&<div className="chapter-menu"><p>Prepared story · explicit Next · paused</p>{chapters.map((c,i)=><button key={c} onClick={()=>{dispatch({type:'step',step:i});setChaptersOpen(false);}} aria-current={i===s.frame.step?'step':undefined}>{i+1} · {c}</button>)}</div>}</div><span className="player-label">{chapters[s.frame.step]}</span><button aria-label="Next step" disabled={s.frame.step===4} onClick={()=>dispatch({type:'step',step:s.frame.step+1})}>→</button></nav>}
 </>;
};
const root=document.getElementById('root');if(root)createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
