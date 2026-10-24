import React, { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { createReviewWorkspace, createImportsBridge, storyProjection, questionStatus } from "../application/public.ts";
import {sourceComparison} from "../domain/public.ts";
import type { Anchor, Review, SourceView } from "../domain/public.ts";
import "./style.css";
import { ReviewGraph } from "./graph.tsx";
import {Imports} from "./imports.tsx";
import {StoryPanel} from "./story.tsx";
import {SemanticPanel} from "./semantic-panel.tsx";
const initialWorkspace = () => createReviewWorkspace(
  new URLSearchParams(window.location.search).get("reviewId") ?? "pr-14",
  new URLSearchParams(window.location.search).get("snapshotId")??undefined,
);
const SourcePane = ({
  source,
  review,
  selected,
  onSelect,
}: {
  source: SourceView;
  review: Review;
  selected: Anchor;
  onSelect: (anchor: Anchor) => void;
}) => {
  return (
    <section
      className="source-pane"
      aria-label={`${source.side === "base" ? "Before" : "After"} source`}
    >
      <header>
        <h2>{source.side === "base" ? "Before" : "After"}</h2><span>{source.path}</span>
        <span>
          {source.side === "base"
            ? "− removals · ∼ modifications"
            : "＋ additions · ∼ modifications"}
        </span>
      </header>
      {source.lines.some(line=>line.status==="not_analyzed")&&<p className="comparison-unknown">Comparison not analyzed: the opposite source is unavailable or exceeds the comparison budget. These lines are not labeled additions/removals.</p>}
      <div className="source-scroll">
        <ol>
          {source.lines.map(({ text: line, number, status }) => {
            const changed = status !== "unchanged" && status !== "not_analyzed",
              active =
                selected.path === source.path &&
                selected.side === source.side &&
                number >= selected.startLine &&
                number <= selected.endLine;
            return (
              <li
                key={number}
                id={`source-${source.side}-${number}`}
                className={`${status} ${active ? "selected" : ""}`}
              >
                <button
                  type="button"
                  aria-label={`Select ${source.side} line ${number}`}
                  aria-pressed={active}
                  onClick={() =>
                    onSelect({
                      snapshotId: review.snapshot.snapshotId,
                      path: source.path,
                      side: source.side,
                      startLine: number,
                      endLine: number,
                    })
                  }
                >
                  {number}
                </button>
                <span className="change-marker" aria-label={`${status} line`}>
                  {status === "not_analyzed" ? "?" : status === "modified"
                    ? "∼"
                    : changed
                      ? source.side === "base"
                        ? "−"
                        : "+"
                      : " "}
                </span>
                <code>{line || " "}</code>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
const App = () => {
  const [workspace,setWorkspace]=useState(initialWorkspace);
  const {review:bridge,analysis:analysisBridge,story:storyBridge}=workspace;
  const [importsBridge]=useState(createImportsBridge);
  const storyState=useSyncExternalStore(storyBridge.subscribe,storyBridge.getSnapshot);
  const storyFocus=storyProjection(storyState),activeDraft=storyState.drafts.find(draft=>draft.id===storyState.activeDraftId);
  const selected=activeDraft?.anchor??null,draft=activeDraft?.text??'',comparisonKey=activeDraft?.comparisonKey,parentQuestionId=activeDraft?.parentQuestionId;
  const state=useSyncExternalStore(bridge.subscribe,bridge.getSnapshot);
  const [credential,setCredential]=useState(''),[onlySelectedDiscussion,setOnlySelectedDiscussion]=useState(false),[interactionError,setInteractionError]=useState('');
  const act=(action:()=>unknown)=>{try{const result=action();if(result instanceof Promise)void result.catch(error=>setInteractionError(error instanceof Error?error.message:'interaction_failed'));setInteractionError('');}catch(error){setInteractionError(error instanceof Error?error.message:'interaction_failed');}};
  useEffect(()=>workspace.connect(),[workspace]);
  useEffect(()=>{const scroll=()=>storyBridge.setPageScroll(window.scrollY);window.addEventListener('scroll',scroll,{passive:true});return()=>window.removeEventListener('scroll',scroll);},[storyBridge]);
  useEffect(()=>{if(storyState.mapRestoreId)requestAnimationFrame(()=>window.scrollTo({top:storyState.pageScroll}));},[storyBridge,storyState.mapRestoreId]);
  const captureStructural=useCallback((frame:import('../application/public.ts').GraphFrames['structural'])=>workspace.captureMap('structural',state.review?.snapshot.snapshotId??null,frame),[workspace,state.review?.snapshot.snapshotId,storyState.snapshotId]);
  const captureSemantic=useCallback((frame:import('../application/public.ts').GraphFrames['semantic'],snapshotId:string|null)=>workspace.captureMap('semantic',snapshotId,frame),[workspace,storyState.snapshotId]);
  const review=state.review;
  if (!state.authenticated || !review)
    return (
      <main className="login">
        <p className="eyebrow">Local review workspace</p>
        <h1>PR Reviewer</h1>
        <p>
          Open the local-user credential reference printed by the runtime. Enter
          its token to access this task’s review.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            act(()=>workspace.login(credential));void importsBridge.login(credential);
          }}
        >
          <label htmlFor="credential">Local access token</label>
          <input
            id="credential"
            type="password"
            autoComplete="off"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
          />
          <button>Open review</button>
        </form>
        {state.error && <p role="alert">{state.error}</p>}
      </main>
    );
  const attachment = review.attachment;
  const chooseSnapshot=async(snapshotId:string)=>{
    try{await workspace.selectSnapshot(snapshotId);const url=new URL(window.location.href);url.searchParams.set("snapshotId",snapshotId);window.history.replaceState(null,"",url);}catch{}
  };
  const pauseStory=()=>storyBridge.intent({type:"pause",reason:"reading"});
  const openSource=async(anchor:Anchor,fileKey?:string)=>{
    pauseStory();try{await workspace.openSource(anchor,fileKey);}catch(error){setInteractionError(error instanceof Error?error.message:'source_unavailable');return;}
    const url=new URL(window.location.href);url.searchParams.set('snapshotId',anchor.snapshotId);url.hash=`source-${anchor.side}-${anchor.startLine}`;window.history.replaceState(null,'',url);
    requestAnimationFrame(()=>document.getElementById(`source-${anchor.side}-${anchor.startLine}`)?.scrollIntoView({block:'center'}));
  };
  return (
    <main>
      <Imports bridge={importsBridge} review={review} canOpen={workspace.canLeaveReview()} onOpen={reviewId=>{
        if(!workspace.canLeaveReview())return;const next=createReviewWorkspace(reviewId);workspace.logout();setWorkspace(next);act(()=>next.login(credential));
        const url=new URL(window.location.href);url.searchParams.set('reviewId',reviewId);url.searchParams.delete('snapshotId');url.hash='';window.history.replaceState(null,'',url);
      }}/>
      <header className="identity">
        <div>
          <p className="eyebrow">Pinned source · source structure review</p>
          <h1>
            <a href={review.snapshot.prUrl} target="_blank" rel="noreferrer">
              PR {review.snapshot.prNumber}
            </a>{" "}
            <span>{review.snapshot.title ?? "Pinned source review"}</span>
          </h1>
          <p className="sha">
            Base {review.snapshot.baseSha} → Head {review.snapshot.headSha}
          </p>
          <p className="sha">Snapshot {review.snapshot.snapshotId}</p>
        </div>
        <div className="attachment">
          <strong>
            {attachment?.active
              ? "Session attached"
              : attachment
                ? "Session revoked"
                : "Attachment pending"}
          </strong>
          {attachment?.active ? (
            <>
              <span>
                {attachment.host} · {attachment.sessionId}
              </span>
              <span>Generation {attachment.generation}</span>
              <button
                className="quiet"
                onClick={() => {
                  void bridge.revoke();
                }}
              >
                Revoke attachment
              </button>
            </>
          ) : (
            <p>
              Run the task-local owner pairing setup, then call session_attach
              from the initiating session. Questions remain saved.
            </p>
          )}
        </div>
      </header>
      <section className="snapshot-selection" aria-label="Snapshot history"><label>Snapshot<select value={review.snapshot.snapshotId} disabled={Boolean(draft.trim())||state.busy||storyState.questionLocked} onChange={event=>{void chooseSnapshot(event.target.value);}}>{(review.snapshotSummaries??[{snapshotId:review.snapshot.snapshotId,baseSha:review.snapshot.baseSha,headSha:review.snapshot.headSha}]).map(snapshot=><option key={snapshot.snapshotId} value={snapshot.snapshotId}>{snapshot.snapshotId===(review.currentSnapshotId??review.snapshot.snapshotId)?"Current":"History"} · {snapshot.headSha.slice(0,12)} · {snapshot.snapshotId.slice(0,12)}</option>)}</select></label><p role="status">{review.snapshot.snapshotId===(review.currentSnapshotId??review.snapshot.snapshotId)?"Viewing current snapshot":"Viewing historical snapshot"}. Selection is private and does not move saved source or discussion.</p>{state.error&&<p role="alert">{state.error}</p>}</section>
      {state.selecting&&<p role="status">Opening the selected snapshot. Question composition is held until its source is ready.</p>}
      {interactionError&&<p role="alert">{interactionError}</p>}
      {state.recovery.state!=='none'&&<section className="question-recovery" aria-label="Question recovery"><h2>Unresolved question</h2><p role="status">{state.recovery.message}</p>{state.recovery.commandId&&<p>Original source: {state.recovery.snapshotId} · saved command {state.recovery.commandId}</p>}{['awaiting_ack','accepted_awaiting_readback','storage_unavailable'].includes(state.recovery.state)&&<button disabled={state.busy} onClick={()=>act(()=>bridge.recoverPendingQuestion())}>Recover saved question</button>}</section>}
      <button type="button" className="quiet" onClick={()=>{workspace.logout();setCredential('');}}>Log out</button>
      <StoryPanel key={`story:${review.reviewId}`} bridge={storyBridge}/>
      <div onFocusCapture={pauseStory} onPointerDownCapture={pauseStory} onScrollCapture={pauseStory}><SemanticPanel key={`semantic:${review.reviewId}`} bridge={analysisBridge} onGraphState={captureSemantic} graphRestore={storyState.maps.semantic?{id:storyState.mapRestoreId,frame:storyState.maps.semantic}:undefined}/></div>
      {state.graph && <div onFocusCapture={pauseStory} onPointerDownCapture={pauseStory}><ReviewGraph graph={state.graph} selectedPath={storyFocus?.sources[0]?.reference.anchor.path??selected?.path??""} selectedFileKey={storyFocus?.comparisonKey??comparisonKey} storyFocus={storyFocus?.graphFocus} onStateChange={captureStructural} restore={storyState.maps.structural?{id:storyState.mapRestoreId,frame:storyState.maps.structural}:undefined} onOpen={openSource}/></div>}
      <section className="source-identity" onFocusCapture={pauseStory}>
        <h2>{selected?.path ?? state.sources[0]?.path}</h2>
        <p>
          Read the fixed before and after. Select a line or specify an inclusive
          range below.
        </p>
        <a href="#graph-title" onClick={()=>document.getElementById("graph-title")?.focus()}>Return to change map</a>
        {draft.trim()&&<p role="status">Source selection is held while your question draft is nonempty. Save or clear it before navigating.</p>}
        <label>Source file<select value={selected?.path??""} disabled={Boolean(draft.trim())||storyState.questionLocked} onChange={e=>act(()=>workspace.openPath(e.target.value))}>{[...new Set(state.sources.filter(s=>s.lineCount>0).map(s=>s.path))].map(path=><option key={path}>{path}</option>)}</select></label>
      </section>
      {selected && <div className="source-grid" onFocusCapture={pauseStory} onPointerDownCapture={pauseStory} onScrollCapture={pauseStory}>
            {(["base", "head"] as const).map(side => {
              const source = sourceComparison(review.snapshot,selected,comparisonKey).find(item=>item.side===side);
              return source ? <SourcePane key={side} source={source} review={review} selected={selected} onSelect={anchor=>{void openSource(anchor,comparisonKey);}} /> : <section key={side} className="source-pane"><header><h2>{side === "base" ? "Before" : "After"}</h2></header><p>This side has no prepared source for {selected.path}. {review.snapshot.changedFiles?.find(file => file.oldPath === selected.path || file.newPath === selected.path)?.dispositions.find(item => item.side === side)?.reason ?? "Absent from the pinned change or not prepared; no selectable anchor."}</p></section>;
            })}
          </div>}
          <section className="conversation" onFocusCapture={pauseStory}>
            {selected?<div className="composer">
              <p className="eyebrow">Ask about this source</p>
              {storyState.drafts.length>1&&<label>Active question draft<select value={storyState.activeDraftId} disabled={Boolean(storyState.returnFrame)||storyState.questionLocked} onChange={event=>act(()=>storyBridge.chooseDraft(event.target.value))}>{storyState.drafts.map((item,index)=><option key={item.id} value={item.id}>{index===0?'Original draft':'Exploration draft'}{item.submitted?' · submitted':''}</option>)}</select></label>}
              <h2>One question, grounded in the change</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  act(()=>workspace.ask());
                }}
              >
                <div className="range">
                  <label>
                    Source side
                    <select
                      value={selected.side}
                      onChange={e=>act(()=>storyBridge.setQuestionRange({side:e.target.value as "base"|"head"}))}
                    >
                      <option value="base">Before (base)</option>
                      <option value="head">After (head)</option>
                    </select>
                  </label>
                  <label>
                    Start line
                    <input
                      type="number"
                      min="1"
                      value={selected.startLine}
                      onChange={e=>act(()=>storyBridge.setQuestionRange({startLine:Number(e.target.value)}))}
                    />
                  </label>
                  <label>
                    End line
                    <input
                      type="number"
                      min={selected.startLine}
                      value={selected.endLine}
                      onChange={e=>act(()=>storyBridge.setQuestionRange({endLine:Number(e.target.value)}))}
                    />
                  </label>
                </div>
                <p className="selection" id="selection">
                  {selected.side} · {selected.path}:{selected.startLine}–
                  {selected.endLine}
                </p>
                {parentQuestionId&&<p className="follow-up">Follow-up to question {parentQuestionId} · original snapshot {review.questions.find(question=>question.questionId===parentQuestionId)?.anchor.snapshotId}. New source: {selected.snapshotId}. <button type="button" onClick={()=>act(()=>storyBridge.setParentQuestion(undefined))} disabled={Boolean(draft.trim())||storyState.questionLocked}>Cancel follow-up</button></p>}
                <label htmlFor="question">Your question</label>
                <textarea
                  id="question"
                  disabled={state.selecting||storyState.questionLocked||state.busy}
                  aria-describedby="selection question-help"
                  rows={4}
                  value={draft}
                  onChange={(e) => act(()=>storyBridge.editDraft(e.target.value))}
                  required
                />
                <p id="question-help">
                  The answer must cite this pinned source and state its limits.
                </p>
                <button disabled={storyState.questionLocked || state.busy || state.selecting || !draft.trim()}>
                  {state.busy ? "Saving question…" : "Save question"}
                </button>
                {state.error && <p role="alert">{state.error}</p>}
              </form>
            </div>:<p>No selectable source lines in this snapshot. Inspect the complete ledger; historical discussion remains available.</p>}
            <section aria-label="Discussion" className="discussion">
              <h2>Discussion</h2>
              <div aria-live="polite" className="status-summary">
                {review.questions.length} saved question
                {review.questions.length === 1 ? "" : "s"} ·{" "}
                {review.replies.length} answer
                {review.replies.length === 1 ? "" : "s"}
              </div>
              {!review.questions.length && (
                <p className="empty">
                  Your question and the agent’s source-backed answer will appear
                  here.
                </p>
              )}
              <label className="discussion-filter"><input type="checkbox" checked={onlySelectedDiscussion} onChange={event=>setOnlySelectedDiscussion(event.target.checked)}/> Only selected snapshot discussion</label>
              {review.questions.filter(question=>!onlySelectedDiscussion||question.anchor.snapshotId===review.snapshot.snapshotId).map((question) => {
                const item = review.inbox.find(
                    (i) => i.questionId === question.questionId,
                  ),
                  attempt = review.attempts.find(
                    (a) => item && a.eventIds.includes(item.eventId),
                  );
                return (
                  <article key={question.questionId}>
                    <div className="message-heading">
                      <strong>{question.actorId}</strong>
                      <span className="status" role="status">
                        {questionStatus(review, question.questionId)}
                      </span>
                    </div>
                    <p className="discussion-source">{question.anchor.snapshotId===review.snapshot.snapshotId?"Selected source":"Other snapshot"} · snapshot {question.anchor.snapshotId}{question.parentQuestionId?` · follow-up to ${question.parentQuestionId}`:""}</p>
                    <p className="body">{question.text}</p>
                    <a
                      href={`#source-${question.anchor.side}-${question.anchor.startLine}`}
                      onClick={event => {event.preventDefault();void openSource(question.anchor);}}
                    >
                      {question.anchor.side} · {question.anchor.path}:
                      {question.anchor.startLine}–{question.anchor.endLine}
                    </a>
                    <button type="button" className="quiet" disabled={Boolean(draft.trim())||state.busy||storyState.questionLocked} onClick={()=>{act(()=>storyBridge.setParentQuestion(question.questionId));document.getElementById("question")?.focus();}}>Follow up</button>
                    {attempt && (
                      <details>
                        <summary>Notification: {attempt.state}</summary>
                        <p>{attempt.reason}</p>
                        <code>{attempt.invocationId}</code>
                      </details>
                    )}
                    {review.replies
                      .filter(
                        (reply) => reply.questionId === question.questionId,
                      )
                      .map((reply) => (
                        <div className="reply" key={reply.replyId}>
                          <strong>Agent · {reply.actorId}</strong>
                          <p className="body">{reply.body}</p>
                          <div className="evidence">
                            {reply.evidence.map((anchor, index) => (
                              <a
                                key={index}
                                href={`#source-${anchor.side}-${anchor.startLine}`}
                                onClick={event => {event.preventDefault();void openSource(anchor);}}
                              >
                                Source: {anchor.side} {anchor.path}:
                                {anchor.startLine}–{anchor.endLine}
                              </a>
                            ))}
                          </div>
                          <p className="limits">
                            <strong>Limits:</strong> {reply.limitations}
                          </p>
                          <small>
                            Attachment {reply.attachmentId} · generation{" "}
                            {reply.generation} · revision {reply.revision}
                          </small>
                        </div>
                      ))}
                  </article>
                );
              })}
            </section>
          </section>
      <footer>
        Immutable source review · bounded read-only acquisition · no target program execution
      </footer>
    </main>
  );
};
const root = document.getElementById("root");
if (!root) throw new Error("missing_root");
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
