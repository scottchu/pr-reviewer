import React from 'react';
import type { Node, NodeProps } from '@xyflow/react';
export type BehaviorNote = Node<{ label: string; detail?: string }, 'behaviorNote'>;
export const BehaviorNoteLabel = ({ data }: NodeProps<BehaviorNote>) => <div className="behavior-note">
  <strong>{data.label}</strong>
  {data.detail && <span>{data.detail}</span>}
</div>;

export const LensIcon = ({ files }: { files: boolean }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
  {files ? <><path d="M4 3v15h5M4 7h5M4 12h5" /><rect x="10" y="4" width="10" height="6" rx="1" /><rect x="10" y="14" width="10" height="6" rx="1" /></>
    : <><rect x="2" y="9" width="6" height="6" rx="1" /><rect x="16" y="2" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M8 12h4V5h4m-4 7v7h4m-3-16 3 2-3 2m0 10 3 2-3 2" /></>}
</svg>;

export const ActionIcon = ({ action }: { action: 'context' | 'story' | 'discussion' | 'source' | 'return' }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
  {action === 'context' ? <><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M9 4v16" /></>
    : action === 'story' ? <><path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15M6 8h3m-3 4h3m6-4h3m-3 4h3" /></>
      : action === 'discussion' ? <><path d="M3 4h18v13H9l-6 4zM7 8h10M7 12h7" /></>
        : action === 'source' ? <><path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-15-2 16" /></>
          : <><path d="m9 4-6 6 6 6M3 10h12a6 6 0 0 1 6 6v4" /></>}
</svg>;
