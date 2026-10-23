import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { createReviewBridge, questionStatus } from "../application/public.ts";
import type { Anchor, Review, SourceView } from "../domain/public.ts";
import "./style.css";
const bridge = createReviewBridge(
  new URLSearchParams(window.location.search).get("reviewId") ?? "pr-14",
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
        <h2>{source.side === "base" ? "Before" : "After"}</h2>
        <span>
          {source.side === "base"
            ? "− removals · ∼ modifications"
            : "＋ additions · ∼ modifications"}
        </span>
      </header>
      <div className="source-scroll">
        <ol>
          {source.lines.map(({ text: line, number, status }) => {
            const changed = status !== "unchanged",
              active =
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
                  {status === "modified"
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
  const state = useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
  const [credential, setCredential] = useState(""),
    [draft, setDraft] = useState(""),
    [selected, setSelected] = useState<Anchor | null>(null);
  useEffect(() => bridge.connect(), []);
  useEffect(() => {
    if (state.initialSelection && !selected)
      setSelected(state.initialSelection);
  }, [state.initialSelection, selected]);
  const review = state.review;
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
            void bridge.login(credential);
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
  return (
    <main>
      <header className="identity">
        <div>
          <p className="eyebrow">Pinned source · documentation review</p>
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
      <section className="source-identity">
        <h2>{selected?.path ?? state.sources[0]?.path}</h2>
        <p>
          Read the fixed before and after. Select a line or specify an inclusive
          range below.
        </p>
      </section>
      {selected && (
        <>
          <div className="source-grid">
            {state.sources.map((source) => (
              <SourcePane
                key={source.side + source.path}
                source={source}
                review={review}
                selected={selected}
                onSelect={setSelected}
              />
            ))}
          </div>
          <section className="conversation">
            <div className="composer">
              <p className="eyebrow">Ask about this source</p>
              <h2>One question, grounded in the change</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void bridge
                    .ask(selected, draft)
                    .then(() => setDraft(""))
                    .catch(() => {});
                }}
              >
                <div className="range">
                  <label>
                    Source side
                    <select
                      value={selected.side}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          side: e.target.value as "base" | "head",
                        })
                      }
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
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          startLine: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    End line
                    <input
                      type="number"
                      min={selected.startLine}
                      value={selected.endLine}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          endLine: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <p className="selection" id="selection">
                  {selected.side} · {selected.path}:{selected.startLine}–
                  {selected.endLine}
                </p>
                <label htmlFor="question">Your question</label>
                <textarea
                  id="question"
                  aria-describedby="selection question-help"
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  required
                />
                <p id="question-help">
                  The answer must cite this pinned source and state its limits.
                </p>
                <button disabled={state.busy || !draft.trim()}>
                  {state.busy ? "Saving question…" : "Save question"}
                </button>
                {state.error && <p role="alert">{state.error}</p>}
              </form>
            </div>
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
              {review.questions.map((question) => {
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
                    <p className="body">{question.text}</p>
                    <a
                      href={`#source-${question.anchor.side}-${question.anchor.startLine}`}
                      onClick={() => setSelected(question.anchor)}
                    >
                      {question.anchor.side} · {question.anchor.path}:
                      {question.anchor.startLine}–{question.anchor.endLine}
                    </a>
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
                                onClick={() => setSelected(anchor)}
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
        </>
      )}
      <footer>
        Manual immutable source preparation · no general import or repository
        execution
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
