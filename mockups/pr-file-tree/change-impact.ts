import { graphFiles, storyContentSchema } from '../../src/domain/public.ts';
import type { Snapshot, StoryContent } from '../../src/domain/public.ts';
import type { CallAnchor } from './calls.ts';
import { mapJourneySource } from './journey-source.ts';

// Exact authored evidence over the existing pinned comparison, not new source IDs.
const evidence: readonly CallAnchor[] = [
  {
    "snapshotId": "pr25-pinned-impact-evidence",
    "side": "base",
    "path": "src/server/public.ts",
    "contentHash": "2bd6f01a2dd416ad1d95993d4fb14b79c56b46a6ce7b8dafb4e1d050a5a48964",
    "start": 2523,
    "end": 2736,
    "startLine": 61,
    "endLine": 64
  },
  {
    "snapshotId": "pr25-pinned-impact-evidence",
    "side": "head",
    "path": "src/server/public.ts",
    "contentHash": "20c22563be7da4c385eda772d5840d55f0993ddeebd85718b3605cddb76a0b0e",
    "start": 2523,
    "end": 2989,
    "startLine": 61,
    "endLine": 67
  },
  {
    "snapshotId": "pr25-pinned-impact-evidence",
    "side": "base",
    "path": "src/application/review.ts",
    "contentHash": "7953f0b8486ae475717bdc749e23a31f12351f41c11a473280de9a2420265477",
    "start": 2853,
    "end": 3773,
    "startLine": 24,
    "endLine": 32
  },
  {
    "snapshotId": "pr25-pinned-impact-evidence",
    "side": "head",
    "path": "src/application/review.ts",
    "contentHash": "dae210c79cb019d6edfdbfacfcf3da1e5773ceb4d15cf747df15ffa498c28e4e",
    "start": 2949,
    "end": 3861,
    "startLine": 25,
    "endLine": 33
  },
  {
    "snapshotId": "pr25-pinned-impact-evidence",
    "side": "head",
    "path": "src/application/local-access.ts",
    "contentHash": "811735e3599292c54af870134345249deed32f1d9b9705f8ca18fd086225d59d",
    "start": 0,
    "end": 266,
    "startLine": 1,
    "endLine": 3
  },
  {
    "snapshotId": "pr25-pinned-impact-evidence",
    "side": "head",
    "path": "docs/product/review-loop/runtime.md",
    "contentHash": "b5b390e291929162a7c8cd0225ddfae19651e3e335ccd3bfb73c3474c5744abd",
    "start": 1713,
    "end": 3394,
    "startLine": 22,
    "endLine": 26
  }
];

type ChangeFile = ReturnType<typeof graphFiles>[number];
export type ChangeImpact = Readonly<{
  status: 'ready';
  source: ChangeFile;
  target: ChangeFile;
  claim: StoryContent['claims'][number];
}> | Readonly<{ status: 'unavailable'; reason: string }>;

// Prepared read-only view content. It cannot publish or allocate a StoryVersion.
export const prepareChangeImpact = (snapshot: Snapshot): ChangeImpact => {
  const mapped = evidence.map(anchor => mapJourneySource(snapshot, anchor));
  const missing = mapped.find(item => item.status === 'unavailable');
  if (missing?.status === 'unavailable') return { status: 'unavailable', reason: missing.reason };
  const files = graphFiles(snapshot);
  const source = files.find(file => file.newPath === 'src/server/public.ts');
  const target = files.find(file => file.newPath === 'src/application/review.ts');
  if (!source || !target) return { status: 'unavailable', reason: 'existing_change_unavailable' };
  const claim = storyContentSchema.shape.claims.element.parse({
    id: 'owner-request-header-consequence',
    basis: 'inference',
    text: 'The gateway now treats a request without Authorization as the local owner, while explicit Bearer stays on credential lookup. The review request changes from always constructing Bearer to accessHeaders(captured), so owner requests can take the new gateway branch while explicit credentials keep their own path.',
    references: mapped.flatMap(item => item.status === 'ready' ? [item.reference] : []),
    uncertainty: 'A source-derived implementation consequence, not runtime proof, author edit order or causation, or a direct HTTP call relation. This is one explained dependency, not complete impact coverage.',
  });
  return { status: 'ready', source, target, claim };
};
