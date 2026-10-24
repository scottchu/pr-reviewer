import React, { useId } from 'react';

/** Available actions are supplied by the application; rendering grants no authority. */
export type ImportPanelAction = Readonly<{
  id: string;
  label: string;
  onInvoke: () => void;
  disabled?: boolean;
}>;

export type ImportPanelRequestAction = Readonly<{
  id: string;
  label: string;
  onInvoke: (path: string) => void;
  disabled?: boolean;
}>;

export type ImportPanelChoice = Readonly<{
  id: string;
  label: string;
  detail?: string;
  comparison?: string;
  href?: string;
  actions: readonly ImportPanelAction[];
}>;

export type ImportPanelJob = Readonly<{
  id: string;
  title: string;
  status: string;
  detail?: string;
  comparison?: string;
  choices?: readonly ImportPanelChoice[];
  actions: readonly ImportPanelAction[];
  evidence?: readonly string[];
}>;

export type ImportPanelProps = Readonly<{
  authenticated: boolean;
  path: string;
  onPathChange: (value: string) => void;
  requestActions: readonly ImportPanelRequestAction[];
  jobs: readonly ImportPanelJob[];
  error?: string;
  acknowledgementRecovery?: ImportPanelAction;
}>;

const ActionButton = ({ action }: { action: ImportPanelAction }) => (
  <button type="button" disabled={action.disabled} onClick={action.onInvoke}>
    {action.label}
  </button>
);

export const ImportPanel = ({
  authenticated, path, onPathChange, requestActions, jobs, error,
  acknowledgementRecovery,
}: ImportPanelProps) => {
  const id = useId();
  const firstRequest = requestActions[0];
  if (!authenticated) return null;
  return (
    <section className="imports" aria-labelledby={`${id}-title`}>
      <p className="eyebrow">Repository source</p>
      <h2 id={`${id}-title`}>Open a change from a repository</h2>
      <p id={`${id}-help`}>Use an existing local repository. Discovery reads its branch and remotes, then pins the provider’s comparison. Importing keeps the open review and any draft in place.</p>
      <form onSubmit={event => {
        event.preventDefault();
        if (firstRequest && !firstRequest.disabled) firstRequest.onInvoke(path);
      }}>
        <label htmlFor={`${id}-path`}>Repository path
        <input id={`${id}-path`} value={path} required
          onChange={event => onPathChange(event.target.value)}
          placeholder="/path/to/repository"
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
          aria-invalid={error ? true : undefined} />
        </label>
        {requestActions.map((action, index) => index === 0 ? (
          <button key={action.id} type="submit" disabled={action.disabled}>{action.label}</button>
        ) : (
          <button key={action.id} type="button" disabled={action.disabled}
            onClick={() => action.onInvoke(path)}>{action.label}</button>
        ))}
      </form>
      {error && <p id={`${id}-error`} role="alert">{error}</p>}
      {acknowledgementRecovery && <ActionButton action={acknowledgementRecovery} />}
      <ol className="import-jobs">
        {jobs.map(job => (
          <li key={job.id}>
            <article aria-labelledby={`${id}-job-${job.id}`}>
              <h3 id={`${id}-job-${job.id}`}>{job.title}</h3>
              <p role="status">{job.status}</p>
              {job.detail && <p>{job.detail}</p>}
              {job.comparison && <p className="sha">{job.comparison}</p>}
              {job.choices && job.choices.length > 0 && (
                <fieldset>
                  <legend>Choose the exact change and review target</legend>
                  {job.choices.map(choice => (
                    <div key={choice.id}>
                      <p>{choice.href ? <a href={choice.href} target="_blank" rel="noreferrer">{choice.label}</a> : choice.label}</p>
                      {choice.detail && <p>{choice.detail}</p>}
                      {choice.comparison && <p className="sha">{choice.comparison}</p>}
                      {choice.actions.map(action => <ActionButton key={action.id} action={action} />)}
                    </div>
                  ))}
                </fieldset>
              )}
              {job.actions.map(action => <ActionButton key={action.id} action={action} />)}
              {job.evidence && job.evidence.length > 0 && (
                <details>
                  <summary>Import evidence</summary>
                  {job.evidence.map((line, index) => <p key={index}>{line}</p>)}
                </details>
              )}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
};
