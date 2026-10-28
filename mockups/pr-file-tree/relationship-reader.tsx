import React from 'react';
import type { ImportLink } from './imports.ts';
import { citationText } from './imports.ts';
import { explainRelationship } from './relationship.ts';
import type { SourceRelation } from './file-diff.tsx';
import { summaryFor } from './summaries.ts';
type Props = ({
  link: ImportLink;
} | {
  relation: SourceRelation;
}) & {
  onClose: () => void;
};
export const RelationshipReader = (props: Props) => {
  const link = 'link' in props ? props.link : null;
  const relation = 'relation' in props ? props.relation : null;
  const explanation = link ? explainRelationship(link) : null;
  const h = relation?.file.hunks[relation.index];
  const prepared = relation ? summaryFor(relation.file, relation.index) : null;
  const fact = prepared?.what ?? 'No prepared summary for this source region.';
  const why = prepared?.why ?? 'The exact source remains available. A change explanation has not been prepared for this region; author intent and runtime impact are unknown.';
  const citations = link ? citationText(link.citations) : relation && h ? `${relation.file.path}\n${h.header}\nBefore ${relation.file.before.commit}\nUTF-8 SHA-256 ${relation.file.before.hash ?? 'absent'}\nAfter ${relation.file.after.commit}\nUTF-8 SHA-256 ${relation.file.after.hash ?? 'absent'}` : '';
  const primary = explanation?.what ?? fact;
  return <section
    className="relationship-reader nodrag nopan nowheel"
    aria-label={link ? 'Import relationship explanation' : 'Source comparison explanation'}
    onWheel={e => e.stopPropagation()}
  >

    <div className="reader-heading">

      <strong>

        {link ? 'Module relation' : `Change ${(relation?.index ?? 0) + 1}`}

      </strong>

      <button
        onClick={props.onClose}
        aria-label="Close relationship explanation"
      >×</button>

    </div>

    <p className="reader-relation">

      {explanation?.from ?? relation?.file.path}

    </p>

    <p className="reader-primary">

      {primary}

    </p>

    <details>

      <summary>Why and source evidence</summary>

      <p>

        {explanation?.why ?? why}

      </p>

      <p>

        {explanation?.how ?? 'Exact pinned Before and After source, not a claim of execution or security.'}

      </p>

      <pre>

        {citations}

      </pre>

      <p className="reader-boundary">

        {explanation?.boundary ?? 'Prepared source explanation. Rationale beyond source facts is inference; runtime impact is unverified.'}

      </p>

    </details>

  </section>;
};
