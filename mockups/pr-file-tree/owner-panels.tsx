import React, { useLayoutEffect, useRef, useState } from 'react';
import { questionEvidenceProjection, questionStatus, storyPresentation, storyProjection } from '../../src/application/public.ts';
import type { QuestionEvidenceIntent, ReviewWorkspace, StoryIntent, StoryState, View } from '../../src/application/public.ts';
import type { Anchor, StoryReference } from '../../src/domain/public.ts';

export type OwnerPanel = 'story' | 'discussion';
type Props = {
  panel: OwnerPanel;
  narrow: boolean;
  workspace: ReviewWorkspace;
  story: StoryState;
  review: View;
  busy: boolean;
  scroll: React.RefObject<Record<OwnerPanel, number>>;
  onClose: () => void;
  onInspect: (reference: StoryReference, keyboard: boolean) => Promise<void>;
  onNavigate: (intent: StoryIntent) => void;
  run: (operation: () => unknown) => void;
};

export const anchorLabel = (anchor: Anchor | null) => anchor
  ? `${anchor.side} · ${anchor.path}:${anchor.startLine}–${anchor.endLine}`
  : 'No source range selected';

export const OwnerPanels = ({ panel, narrow, workspace, story, review, busy, scroll, onClose, onInspect, onNavigate, run }: Props) => {
  const element = useRef<HTMLElement>(null);
  const [confirmation, setConfirmation] = useState<QuestionEvidenceIntent | null>(null);
  const projection = storyProjection(story);
  const presentation = storyPresentation(story);
  const version = story.view?.version;
  const draft = story.drafts.find(item => item.id === story.activeDraftId);
  const proposal = questionEvidenceProjection(story);
  useLayoutEffect(() => {
    const surface = element.current;
    if (!surface) return;
    surface.scrollTop = scroll.current[panel];
    if (narrow) surface.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    return () => { scroll.current[panel] = surface.scrollTop; };
  }, [panel, narrow, scroll]);
  const sourceButton = (reference: StoryReference, index: number) => reference.type === 'snapshot_source'
    ? <button key={index} className="owner-citation" disabled={busy} onClick={event => run(() => onInspect(reference, event.detail === 0))}>
      Inspect {reference.anchor.side} {reference.anchor.path} L{reference.anchor.startLine}–{reference.anchor.endLine}
    </button> : null;
  const claim = (item: NonNullable<typeof projection>['claims'][number], label?: string) => <section key={item.id} className="owner-claim">
    {label && <h3>{label}</h3>}
    <small>{item.basis === 'inference' ? 'Inference' : item.basis === 'source_observation' ? 'Source reading' : item.basis}</small>
    <p>{item.text}</p>
    {item.uncertainty && <p className="owner-limit">{item.uncertainty}</p>}
    {item.references.map(sourceButton)}
  </section>;
  return <aside
    ref={element}
    className={`owner-panel owner-${panel}${narrow ? ' owner-modal' : ''}`}
    role={narrow ? 'dialog' : 'complementary'}
    aria-modal={narrow ? true : undefined}
    aria-label={panel === 'story' ? 'Story reader' : 'Discussion reader'}
    onScroll={event => { scroll.current[panel] = event.currentTarget.scrollTop; }}
    onKeyDown={event => {
      if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      if (narrow && event.key === 'Tab') {
        const actions = Array.from(element.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea:not(:disabled),input:not(:disabled),select:not(:disabled),summary') ?? []);
        const first = actions[0];
        const last = actions.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement?.tagName === 'H2')) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }}
  >
    <div className="owner-heading">
      <h2 tabIndex={-1}>{panel === 'story' ? 'Prepared source account' : 'Source discussion'}</h2>
      <button aria-label={panel === 'story' ? 'Close prepared story' : 'Close discussion'} onClick={onClose}>Close</button>
    </div>
    {busy && <p role="status">Validating source or restoring the saved reading…</p>}
    {panel === 'story' ? <section role="region" aria-label="Prepared story">
      {!version || !projection ? <p role="status">{story.error || 'Reading retained story…'}</p> : <>
        <p className="owner-identity">Published by {version.author.actorId} · version <span title={version.versionId}>{version.versionId.slice(0, 8)}</span></p>
        <nav className="owner-story-controls" aria-label="Story steps">
          <button aria-label="Previous story step" disabled={busy || projection.index === 0 || Boolean(story.returnFrame)} onClick={() => onNavigate({ type: 'previous' })}>Previous</button>
          <span>{projection.index + 1} / {projection.total}</span>
          <button aria-label="Next story step" disabled={busy || projection.index + 1 === projection.total || Boolean(story.returnFrame)} onClick={() => onNavigate({ type: 'next' })}>Next</button>
        </nav>
        <h3 className="owner-step">{projection.step.headline}</h3>
        {projection.claims.map(item => claim(item))}
        {presentation?.details.map(({ label, claim: item }) => claim(item, label))}
        <details><summary>Scope and limits</summary>
          <p>{version.story.scope.filter(item => item.type === 'unexplained').length} files remain unexplained. All 50 files remain on the canvas.</p>
          {version.story.limitations.map(text => <p key={text}>{text.includes('not a published StoryVersion')
            ? 'This prepared account is published to the local candidate store as shown above. Publication does not establish a runtime result.'
            : text}</p>)}
        </details>
      </>}
    </section> : <section role="region" aria-label="Source discussion">
      <details className="owner-delivery"><summary>{review.review?.attachment?.active ? 'Native notification unavailable' : 'No participant attached'}</summary><p className="owner-limit">Saved questions use the retained review. {review.review?.attachment?.active
        ? `Attached participant: ${review.review.attachment.actorId} (${review.review.attachment.host}). Native notification is not configured for this candidate; inspect actual delivery status below.`
        : 'No native participant is attached; a reply is unavailable until a responsible session is attached through its existing authorized path.'}</p></details>
      {story.drafts.length > 1 && <label>Question draft<select value={story.activeDraftId} disabled={Boolean(story.returnFrame) || story.questionLocked} onChange={event => run(() => workspace.story.chooseDraft(event.target.value))}>
        {story.drafts.map((item, index) => <option key={item.id} value={item.id}>{index === 0 ? 'Original' : 'Supporting source'}{item.submitted ? ' · submitted' : ''}</option>)}
      </select></label>}
      {draft?.submitted && <button onClick={() => run(() => workspace.story.editDraft(''))}>New question</button>}
      <p>Question range: <strong>{anchorLabel(draft?.anchor ?? null)}</strong></p>
      {story.evidence && <div className="owner-adoption">
        <p>Inspected: {story.evidence.type === 'snapshot_source' ? anchorLabel(story.evidence.anchor) : 'Supporting evidence'}. Inspection keeps your question unchanged.</p>
        {proposal.kind === 'ready' ? <button disabled={busy} onClick={() => {
          if (proposal.confirmationRequired) setConfirmation(proposal);
          else run(() => workspace.story.adoptEvidence(proposal));
        }}>Use inspected range for question</button> : <p role="status">{proposal.reason}</p>}
        {confirmation && <div role="group" aria-label="Confirm question range">
          <p>Keep the draft text and replace {anchorLabel(confirmation.draft.anchor)} with {anchorLabel(confirmation.anchor)}?</p>
          <button onClick={() => run(() => { workspace.story.adoptEvidence(confirmation, true); setConfirmation(null); })}>Replace question range</button>
          <button onClick={() => setConfirmation(null)}>Keep current range</button>
        </div>}
      </div>}
      <form onSubmit={event => { event.preventDefault(); run(() => workspace.ask()); }}>
        <label htmlFor="owner-question">Your question</label>
        <textarea id="owner-question" rows={3} value={draft?.text ?? ''} disabled={!draft || story.questionLocked || review.busy} onChange={event => run(() => workspace.story.editDraft(event.target.value))} required />
        <button disabled={!draft?.anchor || !draft.text.trim() || story.questionLocked || review.busy}>Save question</button>
      </form>
      {review.recovery.state !== 'none' && <section role="status">
        <p>{review.recovery.message}</p>
        <button disabled={!['awaiting_ack', 'accepted_awaiting_readback'].includes(review.recovery.state)} onClick={() => run(() => workspace.review.recoverPendingQuestion())}>Recover saved command</button>
      </section>}
      {story.viewRecoveryMessage && <p role="status">{story.viewRecoveryMessage}</p>}
      {review.review?.questions.map(question => <article key={question.questionId} data-saved-question={question.questionId}>
        <p className="owner-identity">{question.actorId} · {anchorLabel(question.anchor)}</p>
        <p>{question.text}</p>
        <small>{questionStatus(review.review!, question.questionId)}</small>
        {review.review?.replies.filter(reply => reply.questionId === question.questionId).map(reply => <section key={reply.replyId}>
          <p className="owner-identity">{reply.actorId} · reply revision {reply.revision} · attachment {reply.attachmentId}</p>
          <p>{reply.body}</p><p>{reply.limitations}</p>
          {reply.evidence.map((anchor, index) => {
            const source = story.snapshot?.sources.find(source => source.side === anchor.side && source.path === anchor.path && anchor.snapshotId === story.snapshotId);
            return source ? sourceButton({ type: 'snapshot_source', contentHash: source.hash, anchor }, index) : <p key={index}>Exact reply evidence unavailable: {anchorLabel(anchor)}</p>;
          })}
        </section>)}
      </article>)}
    </section>}
  </aside>;
};
