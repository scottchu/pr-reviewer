import React, { useLayoutEffect, useRef } from 'react';
import fixture from './paths.json' with { type: 'json' };

export type ContextEvidence = 'requirement' | 'request' | 'rationale';

export const ReviewContext = ({ narrow, scrollTop, onScroll, onClose, onEvidence }: {
  narrow: boolean;
  scrollTop: number;
  onScroll: (top: number) => void;
  onClose: () => void;
  onEvidence: (target: ContextEvidence, keyboard: boolean) => void;
}) => {
  const panel = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = panel.current;
    if (element) {
      element.scrollTop = scrollTop;
    }
    if (narrow) {
      panel.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    }
    return () => {
      if (element) {
        onScroll(element.scrollTop);
      }
    };
  }, [narrow]);

  return <aside
    ref={panel}
    onScroll={event => onScroll(event.currentTarget.scrollTop)}
    className={`review-context ${narrow ? 'context-modal' : ''}`}
    role={narrow ? 'dialog' : 'complementary'}
    aria-modal={narrow ? true : undefined}
    aria-label="Review context"
    onKeyDown={event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      if (narrow && event.key === 'Tab') {
        const actions = panel.current?.querySelectorAll<HTMLButtonElement>('button');
        const first = actions?.[0];
        const last = actions?.[actions.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }}
  >
    <div className="context-heading">
      <span>Context · PR #25</span>
      <button aria-label="Close review context" title="Close context" onClick={onClose}>×</button>
    </div>
    <h1>Open your own review, without a login step.</h1>
    <section aria-label="Captured requirement">
      <h2>Captured requirement</h2>
      <p>PR Reviewer is the owner’s single-user local tool, but its token form put a credential-entry step between opening the existing URL and returning to retained reviews. The owner should be able to open that URL and immediately see the review, history and graph. This change removes that extra step; it does not introduce a replacement login.</p>
      <p>Agents remain separately attached participants, so their explicit credentials still identify the responsible session and attachment generation.</p>
      <button className="context-citation" onClick={event => onEvidence('rationale', event.detail === 0)} aria-label="Read the documented opening rationale">Opening requirement · After L11–13</button>
      <button className="context-citation" onClick={event => onEvidence('requirement', event.detail === 0)}
        aria-label="Read the captured runtime requirement">
        Runtime specification · After L22–26
      </button>
      <small>Project requirement retained in this PR, not a measured runtime outcome.</small>
    </section>
    <section aria-label="Prepared source account">
      <h2>How the code changes</h2>
      <p>Before, the review request always built a Bearer header. After, it delegates to a helper that distinguishes owner requests from explicit credentials.</p>
      <dl>
        <dt>Local owner</dt><dd>No Authorization header.</dd>
        <dt>Explicit credential</dt><dd>Bearer header retained.</dd>
      </dl>
      <button className="context-citation" onClick={event => onEvidence('request', event.detail === 0)}
        aria-label="Inspect the changed request">
        request → accessHeaders · inspect source
      </button>
      <small>Prepared source reading, not an execution result. Follow the function's test icon for relevant declared assertions.</small>
    </section>
    <section aria-label="Scope and uncertainty">
      <h2>Keep the wider change in view</h2>
      <p>The 50-file change also touches other clients, gateway/storage ownership, recovery, tools, tests and documentation. This account explains one path; some connections have not been mapped yet.</p>
      <p>Test source does not prove a passing run. This account does not establish security or native agent delivery.</p>
    </section>
    <small className="context-comparison" title={`${fixture.base} → ${fixture.head}`}>
      Comparison {fixture.base.slice(0, 7)} → {fixture.head.slice(0, 7)}
    </small>
  </aside>;
};
