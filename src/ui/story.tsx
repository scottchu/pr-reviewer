import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {storyProjection,storyPresentation,questionEvidenceProjection} from '../application/public.ts';
import type {StoryBridge,StoryState,QuestionEvidenceIntent} from '../application/public.ts';
import type {StoryReference,StoryContent} from '../domain/public.ts';
import './story.css';
const referenceLabel=(reference:StoryReference)=>{
 switch(reference.type){
  case 'snapshot_source':return `${reference.anchor.side==='base'?'Before':'After'} ${reference.anchor.path}:${reference.anchor.startLine}–${reference.anchor.endLine} · snapshot lines`;
  case 'semantic_source':return `${reference.anchor.side==='base'?'Before':'After'} ${reference.anchor.path} · UTF-16 ${reference.anchor.start}–${reference.anchor.end}`;
  case 'capture':return `Supplied context · ${reference.captureId}`;
  case 'metadata':return `Retained PR ${reference.field}`;
  case 'clarification':return `Attributed clarification · revision ${reference.revision}`;
  case 'static_node':return 'Retained static function';
  case 'static_edge':return 'Retained static relationship';
 }
};
const basisLabels:Record<StoryContent['claims'][number]['basis'],string>={source_observation:'Source-linked observation',static_relationship:'Static relationship · not execution',supplied_rationale:'Supplied rationale',inference:'Inference',unknown:'Unknown'};
const Claim=({claim,bridge,author,onInspect}:{claim:StoryContent['claims'][number]|undefined;bridge:StoryBridge;author:string;onInspect?:((reference:StoryReference)=>Promise<void>)|undefined})=>claim?<div className={`story-claim basis-${claim.basis}`}>
 <span className="story-basis">{basisLabels[claim.basis]}{claim.attribution?` · ${author}`:''}</span><p>{claim.text}</p>{claim.uncertainty&&<p className="story-uncertainty">Uncertainty: {claim.uncertainty}</p>}
 <div className="story-reference-list">{claim.references.map((ref,index)=><button type="button" className="quiet" key={index} onClick={()=>{void (onInspect?onInspect(ref):bridge.openEvidence(ref)).catch(()=>{});}}>{referenceLabel(ref)}</button>)}</div>
</div>:null;
const anchorLabel=(anchor:import('../domain/public.ts').Anchor|null)=>anchor?`${anchor.snapshotId} · ${anchor.side==='base'?'Before':'After'} ${anchor.path}:${anchor.startLine}–${anchor.endLine}`:'No question anchor selected';
export const QuestionEvidenceStatus=({bridge}:{bridge:StoryBridge})=>{
 const state=useSyncExternalStore(bridge.subscribe,bridge.getSnapshot),intent=questionEvidenceProjection(state),draft=state.drafts.find(draft=>draft.id===state.activeDraftId);
 if(!state.evidence)return null;
 return <div className="story-question-anchors" aria-label="Inspected and question anchors"><p><strong>Inspecting:</strong> snapshot {state.evidence.type==='snapshot_source'||state.evidence.type==='semantic_source'?state.evidence.anchor.snapshotId:state.snapshotId} · {referenceLabel(state.evidence)}</p><p><strong>Question anchor:</strong> {anchorLabel(draft?.anchor??null)}</p><p>{intent.kind==='ready'?(intent.mismatch?'Inspected evidence differs from your question anchor. Use the explicit range action to change it.':'Inspected range matches your question anchor.'):'Inspection leaves your question source and draft unchanged.'}</p></div>;
};
const StoryPlayer=({bridge,state}:{bridge:StoryBridge;state:StoryState})=>{
 const element=useRef<HTMLElement>(null),drag=useRef<{pointer:number;x:number;y:number;originX:number;originY:number}|null>(null),projection=storyProjection(state);
 useEffect(()=>{
  const update=()=>{const box=element.current?.getBoundingClientRect();if(box)bridge.intent({type:'resizePlayer',viewport:{width:window.visualViewport?.width??window.innerWidth,height:window.visualViewport?.height??window.innerHeight},size:{width:box.width,height:box.height}});};
  const observer=new ResizeObserver(update);if(element.current)observer.observe(element.current);window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);update();
  return()=>{observer.disconnect();window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);};
 },[bridge]);
 if(!projection)return null;
 return <nav ref={element} className="story-player" aria-label="Story playback" style={{transform:`translate(calc(-50% + ${state.position.x}px), ${state.position.y}px)`}}>
  <button type="button" className="story-drag" aria-label="Move story player" title="Drag or use arrow keys to move. Home resets position." aria-describedby="story-move-help"
   onPointerDown={event=>{if(event.button!==0)return;bridge.intent({type:'pause',reason:'drag'});drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY,originX:state.position.x,originY:state.position.y};event.currentTarget.setPointerCapture(event.pointerId);}}
   onPointerMove={event=>{const start=drag.current;if(start?.pointer===event.pointerId)bridge.intent({type:'movePlayer',x:start.originX+event.clientX-start.x,y:start.originY+event.clientY-start.y});}}
   onPointerUp={event=>{if(drag.current?.pointer===event.pointerId){drag.current=null;event.currentTarget.releasePointerCapture(event.pointerId);}}} onPointerCancel={()=>{drag.current=null;}}
   onKeyDown={event=>{const key=event.key;if(key==='Home'){event.preventDefault();bridge.intent({type:'resetPlayer'});}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){event.preventDefault();bridge.intent({type:'movePlayer',x:state.position.x+(key==='ArrowLeft'?-16:key==='ArrowRight'?16:0),y:state.position.y+(key==='ArrowUp'?-16:key==='ArrowDown'?16:0)});}}}>⠿</button>
  <span id="story-move-help" className="story-sr-only">Arrow keys move the player. Home resets it. Position stays inside the viewport.</span>
  <button type="button" aria-label="Previous story step" title="Previous step" disabled={projection.index===0||state.mode==='exploring'} onClick={()=>bridge.intent({type:'previous'})}>←</button>
  <button type="button" disabled={state.mode==='exploring'} aria-label={state.mode==='playing'?'Pause story':'Replay story step'} title={state.mode==='playing'?'Pause':'Replay this step from the start'} onClick={()=>bridge.intent(state.mode==='playing'?{type:'pause',reason:'control'}:{type:'replay'})}>{state.mode==='playing'?'Ⅱ':'▶'}</button>
  <button type="button" aria-label="Next story step" title="Next step" disabled={projection.index===projection.total-1||state.mode==='exploring'} onClick={()=>bridge.intent({type:'next'})}>→</button>
  <output aria-label="Story step" className="story-step-count">{projection.index+1}/{projection.total}</output>
  <select disabled={state.mode==='exploring'} aria-label="Story chapter" value={projection.chapter.id} onChange={event=>bridge.intent({type:'chapter',chapterId:event.target.value})}>{state.view!.version!.story.chapters.map(chapter=><option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select>
 </nav>;
};
export const StoryPanel=({bridge,onInspect}:{bridge:StoryBridge;onInspect?:((reference:StoryReference)=>Promise<void>)|undefined})=>{
 const [interactionError,setInteractionError]=useState(''),[anchorConfirmation,setAnchorConfirmation]=useState<QuestionEvidenceIntent|null>(null);
 const run=(action:()=>unknown)=>{try{const result=action();if(result instanceof Promise)void result.catch(error=>setInteractionError(error instanceof Error?error.message:'interaction_failed'));setInteractionError('');}catch(error){setInteractionError(error instanceof Error?error.message:'interaction_failed');}};
 const state=useSyncExternalStore(bridge.subscribe,bridge.getSnapshot),projection=storyProjection(state),version=state.view?.version,presentation=storyPresentation(state),questionIntent=questionEvidenceProjection(state);
 useEffect(()=>bridge.connect(),[bridge]);
 useEffect(()=>{
  const visibility=()=>bridge.intent({type:'visibility',hidden:document.hidden}),media=window.matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>bridge.intent({type:'reducedMotion',value:media.matches});visibility();reduced();document.addEventListener('visibilitychange',visibility);media.addEventListener('change',reduced);
  return()=>{document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',reduced);};
 },[bridge]);
 const reading=()=>bridge.intent({type:'pause',reason:'reading'});
 return <section className={`story-panel story-surface-${state.surface}${state.reducedMotion?' story-reduced-motion':''}`} aria-label="Change explanation">
  <header className="story-heading"><div><p className="eyebrow">Authored understanding · pinned source</p><h2>{version?.story.title??'Change explanation'}</h2></div>{version&&<div className="story-surfaces" role="group" aria-label="Story view"><button type="button" aria-pressed={state.surface==='flow'} onClick={()=>bridge.intent({type:'surface',surface:'flow'})}>Flow</button><button type="button" aria-pressed={state.surface==='diff'} onClick={()=>bridge.intent({type:'surface',surface:'diff'})}>Diff</button></div>}</header>
  {interactionError&&<p role="alert">{interactionError}</p>}{state.viewRecoveryMessage&&<p role="status">{state.viewRecoveryMessage} <button type="button" onClick={()=>run(()=>bridge.resetPrivateView())}>Reset ordinary saved view</button></p>}
  {state.error&&<p role="alert">Story unavailable: {state.error}</p>}
  {(version||state.returnFrame)&&<>   <div className="story-exploration-controls">{state.returnFrame?<><p role="status">Exploring supporting source. The original story cursor and draft are saved.</p><button type="button" disabled={state.questionLocked} onClick={()=>run(()=>bridge.resumeStory())}>Resume story</button></>:<button type="button" disabled={state.questionLocked} onClick={()=>run(()=>bridge.enterExploration())}>Explore supporting source</button>}<button type="button" disabled={state.questionLocked||!projection} onClick={()=>run(()=>bridge.askAboutStep())}>Ask about this step</button></div></>}
  {!version&&<p role="status">{state.reading?'Loading the retained explanation…':'No story has been published for this snapshot. The change map, source and questions remain available.'}</p>}
  {version&&projection&&<>

   <p className="story-provenance">By {version.author.actorId} · {version.author.kind} · story revision {version.storyRevision} · context revision {version.contextRevision} · {version.createdAt}</p>
   <p className="story-play-state" role="status">{state.mode==='playing'?'Playing':state.mode==='ended'?'Story ended':state.mode==='exploring'?'Exploring':'Paused'} · Step {projection.index+1} of {projection.total} · {projection.chapter.title} · {(state.elapsedMs/1000).toFixed(1)} / 8 seconds</p>
   <div className="story-markers" aria-live="polite">{state.view?.newerVersion&&<p>A newer story is available. <button type="button" onClick={()=>run(()=>bridge.openVersion())}>Open newer story</button></p>}{state.view?.newerContext&&<p>Newer supplied context is available; this story keeps its authored basis. <button type="button" onClick={()=>run(()=>bridge.openCurrentContext())}>Inspect current context</button></p>}{state.view?.currentSnapshotId!==state.snapshotId&&<p>A newer source snapshot is available. This story stays on its retained source.</p>}{state.view?.historicalAnalysis&&<p>Historical static analysis basis. Current analysis does not replace this account.</p>}{!state.view?.staticNeighborhoodAvailable&&<p>Static neighborhood unavailable for this story; source structure remains separate evidence.</p>}{state.view?.basisUnavailable&&<p>Authored analysis evidence is unavailable. No newer evidence has been substituted.</p>}</div>
   {!!state.view?.brokenEvidence.length&&<details className="story-broken"><summary>Unavailable evidence ({state.view.brokenEvidence.length})</summary><ul>{state.view.brokenEvidence.map((issue,index)=><li key={index}>{referenceLabel(issue.reference)}: {issue.reason}</li>)}</ul></details>}
   {state.focusError&&<p role="status">Graph focus limitation: {state.focusError}</p>}
   <h3 className="story-account-heading">{projection.step.headline}</h3>
   <div className="story-content">
    <div className="story-narration" tabIndex={0} onFocusCapture={reading} onPointerDown={reading} onScrollCapture={reading} aria-label="Authored understanding">
     <div className="story-step-claims">{projection.claims.map(item=><Claim key={item.id} claim={item} bridge={bridge} author={version.author.actorId} onInspect={onInspect}/>)}</div>
     <details onToggle={event=>{if(event.currentTarget.open)reading();}}><summary>Why, what, how and a concrete example</summary><p>Claims already shown above are not repeated here.</p><h4>Example · {projection.chapter.example.scenarioKind==='illustrative'?'Illustrative':'Source-derived authored account'} · not an execution result</h4>{presentation?.details.map(({label,claim})=><section key={claim.id}><h4>{label}</h4><Claim claim={claim} bridge={bridge} author={version.author.actorId} onInspect={onInspect}/></section>)}</details>
    </div>
    <aside className="story-context" aria-label="Supplied context" tabIndex={0} onFocusCapture={reading} onPointerDown={reading} onScrollCapture={reading}>
     <h3>Supplied context</h3><p>Retained owner captures, separate from authored understanding. Links are not fetched.</p>{state.context?<><p>Viewing context revision {state.context.selectedRevision}; story authored at {version.contextRevision}.</p>{state.context.missingKinds.map(kind=><p key={kind}>{kind} body not supplied.</p>)}{state.context.captures.map(capture=><details key={capture.captureId}><summary>{capture.kind} · {capture.title}</summary><p>{capture.actorId} · {capture.createdAt} · freshness {capture.freshness}</p>{capture.originUrl&&<a href={capture.originUrl} target="_blank" rel="noreferrer">Supplied origin</a>}<pre>{capture.text}</pre><small>SHA-256 {capture.contentHash}</small>{capture.supersedesCaptureId&&<p>Supersedes capture {capture.supersedesCaptureId}.</p>}</details>)}</>:<p>Loading the exact authored context…</p>}
    </aside>
   </div>
   <div className="story-focus" aria-label="Current story focus" data-step={projection.step.id}>
    <div className="story-focus-heading"><strong>Evidence focus</strong><span>{projection.step.focus.type==='semantic'?'Admitted static relationship':projection.step.focus.type==='structural'?'Source structure':projection.step.focus.type==='sources'?'Exact retained source':'Explicit unknown · no source highlight'}</span></div>
    <p className="story-change-legend"><span className="story-delete">− Delete / before</span><span className="story-add">+ Add / after</span><span className="story-modify">∼ Modify</span></p>
    <p className="story-focus-ranges">{projection.sources.map(source=>referenceLabel(source.reference)).join(' · ')||'No authored source span for this step.'}</p>
    <details className="story-source-disclosure" key={projection.step.id} onToggle={event=>{if(event.currentTarget.open)reading();}}><summary>Before / after evidence · inspect selected ranges</summary><div className="story-source-pair" onFocusCapture={reading} onScrollCapture={reading} onPointerDown={reading} onKeyDown={reading}>
     {(['base','head'] as const).map(side=>{const source=projection.sources.find(source=>source.reference.anchor.side===side);return <section key={side} className={`story-source story-source-${side}`} aria-label={`${side==='base'?'Before':'After'} story evidence`}><h4>{side==='base'?'Before':'After'}</h4>{source?<><p>{source.reference.anchor.path} · {source.coordinates}</p><pre tabIndex={0}>{source.text}</pre><button type="button" className="quiet" onClick={()=>{run(()=>onInspect?onInspect(source.reference):bridge.openEvidence(source.reference));}}>Inspect exact {side==='base'?'before':'after'} evidence</button></>:<p>{projection.step.focus.type==='structural'?`Structural focus: ${projection.step.focus.fileKey}${projection.step.focus.hunkId?` · ${projection.step.focus.hunkId}`:''}. Inspect the change map for available source.`:'No authored source highlight on this side.'}</p>}</section>;})}
    </div></details>
   </div>
   {state.evidence&&<section className="story-evidence-inspector" aria-label="Selected story evidence" tabIndex={0} onFocusCapture={reading} onScrollCapture={reading}><h3>{referenceLabel(state.evidence)}</h3><pre>{state.evidenceBusy?'Loading exact retained evidence…':state.evidenceText}</pre><QuestionEvidenceStatus bridge={bridge}/>{questionIntent.kind==='ready'?<><button type="button" onClick={()=>{if(questionIntent.confirmationRequired)setAnchorConfirmation(questionIntent);else run(()=>bridge.adoptEvidence(questionIntent));}}>Use this range for question</button>{anchorConfirmation&&<div className="story-anchor-confirm" role="group" aria-label="Confirm question range"><p>Keep this draft text and parent question, and replace its anchor?</p><p>From {anchorLabel(anchorConfirmation.draft.anchor)} to {anchorLabel(anchorConfirmation.anchor)}</p><button type="button" onClick={()=>run(()=>{bridge.adoptEvidence(anchorConfirmation,true);setAnchorConfirmation(null);})}>Confirm question range</button><button type="button" className="quiet" onClick={()=>setAnchorConfirmation(null)}>Keep current question range</button></div>}</>:<p role="status">{questionIntent.reason}</p>}</section>}
   <details className="story-scope" onToggle={event=>{if(event.currentTarget.open)reading();}}><summary>Whole-change account ({version.story.scope.length} primary files)</summary>{presentation?.groups.map(group=><details key={group.id}><summary>{group.title} · {group.files.length} {group.files.length===1?'file':'files'}</summary>{group.meaning&&<Claim claim={group.meaning} bridge={bridge} author={version.author.actorId} onInspect={onInspect}/>}<ul>{group.files.map(({account,label,status})=><li key={account.fileKey}><strong>{label}</strong><span> · {status}</span><p>{account.type==='explained'?account.explanation:`Unexplained: ${account.reason}`}</p>{account.type==='explained'&&account.references.map((ref,index)=><button type="button" className="quiet" key={index} onClick={()=>{void (onInspect?onInspect(ref):bridge.openEvidence(ref)).catch(()=>{});}}>{referenceLabel(ref)}</button>)}<details><summary>Technical file identity</summary><code>{account.fileKey}</code></details></li>)}</ul></details>)}</details>
   <details><summary>Story history ({state.view!.versions.length})</summary><ul>{state.view!.versions.map(item=><li key={item.versionId}><button type="button" disabled={Boolean(state.returnFrame)||item.versionId===version.versionId} onClick={()=>run(()=>bridge.openVersion(item.versionId))}>Revision {item.storyRevision} · {item.title} · {item.author.actorId}</button></li>)}</ul></details>
   <div className="story-limits"><strong>Limits</strong><ul>{version.story.limitations.map((limit,index)=><li key={index}>{limit}</li>)}</ul><p>Attributed claims and source presence do not establish execution or an independently verified explanation.</p></div>
   <StoryPlayer bridge={bridge} state={state}/>
  </>}
 </section>;
};
