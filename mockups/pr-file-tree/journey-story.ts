import { graphFiles, validateAnchor, validateStoryStructure } from '../../src/domain/public.ts';
import type { Snapshot, StoryContent, StoryReference } from '../../src/domain/public.ts';
import { projectCalls } from './calls.ts';
import type { CallAnchor } from './calls.ts';
import { mapJourneySource } from './journey-source.ts';

type SourceReference = Extract<StoryReference, { type: 'snapshot_source' }>;
type Claim = StoryContent['claims'][number];

// This is authored content for the existing Story owner to admit later.
// It cannot publish, allocate a StoryVersion, change the graph or send a question.
export const prepareJourneyStory = (snapshot: Snapshot): StoryContent => {
  const clients = projectCalls('src/application/review.ts');
  const storage = projectCalls('src/storage/public.ts');
  const source = (anchor: CallAnchor): SourceReference => {
    const mapped = mapJourneySource(snapshot, anchor);
    if (mapped.status !== 'ready') {
      throw new Error(`story_source_unavailable: ${anchor.side}:${anchor.path}:${mapped.reason}`);
    }
    return mapped.reference;
  };
  const functionSource = (name: string, side: 'base' | 'head', group: typeof clients): SourceReference => {
    const node = group.nodes.find(item => item.name === name && item.declaration.side === side);
    if (!node) {
      throw new Error(`story_function_unavailable: ${side}:${name}`);
    }
    return source(node.declaration);
  };
  const before = functionSource('request', 'base', clients);
  const after = functionSource('request', 'head', clients);
  const headers = functionSource('accessHeaders', 'head', clients);
  const refreshBefore = functionSource('refresh', 'base', clients);
  const refreshAfter = functionSource('refresh', 'head', clients);
  const authenticateBefore = functionSource('authenticate', 'base', storage);
  const authenticateAfter = functionSource('authenticate', 'head', storage);
  const referenceHelper = functionSource('accessReference', 'head', storage);
  const principalHelper = functionSource('localPrincipal', 'head', storage);
  const runtimePath = 'docs/product/review-loop/runtime.md';
  const runtime = snapshot.sources.find(item => item.side === 'head' && item.path === runtimePath);
  const requirement: SourceReference = {
    type: 'snapshot_source',
    contentHash: runtime?.hash ?? '',
    anchor: {
      snapshotId: snapshot.snapshotId,
      side: 'head',
      path: runtimePath,
      startLine: 22,
      endLine: 26,
    },
  };
  if (!runtime || !validateAnchor(snapshot.snapshotId, snapshot.sources, requirement.anchor)) {
    throw new Error('story_requirement_unavailable');
  }
  const files = graphFiles(snapshot);
  const fileKey = (path: string) => {
    const file = files.find(item => item.newPath === path || item.oldPath === path);
    if (!file) {
      throw new Error(`story_file_unavailable: ${path}`);
    }
    return file.key;
  };
  const observation = (id: string, text: string, references: SourceReference[]): Claim => ({
    id,
    text,
    basis: 'source_observation',
    references,
  });
  const claims: Claim[] = [
    observation('requirement', 'The retained runtime requirement is to open the local review without pasting a credential, while explicit credentials retain their own identity.', [requirement]),
    observation('request-change', 'Before, request constructed Authorization directly. After, it delegates that header choice to accessHeaders.', [before, after, headers]),
    observation('header-choice', 'accessHeaders omits Authorization for the local-owner session scope and keeps Bearer for explicit credentials.', [headers]),
    observation('request-input', 'Consider an owner request and a request with an explicit participant credential.', [headers]),
    observation('request-before', 'The previous request implementation constructed a Bearer header directly.', [before]),
    observation('request-after', 'The new request delegates to the owner-versus-explicit-credential header choice.', [after, headers]),
    {
      id: 'refresh-consequence',
      text: 'refresh still calls request. Its unchanged source therefore reaches the changed request-header decision.',
      basis: 'inference',
      references: [refreshBefore, refreshAfter, after, headers],
      uncertainty: 'A source-derived consequence, not an executed request, security result or proof of behavior equivalence.',
    },
    observation('storage-change', 'Store authentication now recognizes local-owner access before credential lookup. Other credential references continue through lookup.', [authenticateBefore, authenticateAfter]),
    observation('capability', 'accessReference distinguishes the exact in-process owner capability from strings. localPrincipal recognizes the owner reference.', [referenceHelper, principalHelper]),
    observation('storage-input', 'Compare the trusted in-process owner capability with an explicit credential string.', [referenceHelper, principalHelper]),
    observation('storage-before', 'The earlier authenticate implementation looked up a credential reference.', [authenticateBefore]),
    observation('storage-after', 'The changed authenticate first checks for a local principal, then looks up other references.', [authenticateAfter, referenceHelper, principalHelper]),
    {
      id: 'storage-meaning',
      text: 'The request-header change and store authentication change serve different boundaries of the local-owner review path.',
      basis: 'inference',
      references: [requirement, after, headers, authenticateAfter],
      uncertainty: 'This source account does not establish an end-to-end run, multi-user authorization or safe native delivery.',
    },
  ];
  const story: StoryContent = {
    title: 'Review PR25: owner requests and the credential boundary',
    captureIds: [],
    chapters: [
      {
        id: 'requests',
        title: 'Why the request stops always sending Bearer',
        why: 'requirement',
        what: 'request-change',
        how: 'header-choice',
        example: {
          scenarioKind: 'source_derived',
          input: 'request-input',
          before: 'request-before',
          after: 'request-after',
        },
        stepIds: ['request', 'refresh'],
      },
      {
        id: 'storage',
        title: 'Where owner and explicit credentials diverge',
        why: 'storage-meaning',
        what: 'storage-change',
        how: 'capability',
        example: {
          scenarioKind: 'source_derived',
          input: 'storage-input',
          before: 'storage-before',
          after: 'storage-after',
        },
        stepIds: ['authentication'],
      },
    ],
    steps: [
      {
        id: 'request',
        headline: 'Compare the request and its exact header helper',
        claimIds: ['requirement', 'request-change', 'header-choice'],
        focus: {
          type: 'sources',
          fileKey: fileKey(after.anchor.path),
          sources: [before, after],
        },
      },
      {
        id: 'refresh',
        headline: 'Trace an unchanged caller into the changed decision',
        claimIds: ['refresh-consequence'],
        focus: {
          type: 'sources',
          fileKey: fileKey(refreshAfter.anchor.path),
          sources: [refreshBefore, refreshAfter],
        },
      },
      {
        id: 'authentication',
        headline: 'Compare owner recognition with credential lookup',
        claimIds: ['storage-change', 'capability', 'storage-meaning'],
        focus: {
          type: 'sources',
          fileKey: fileKey(authenticateAfter.anchor.path),
          sources: [authenticateBefore, authenticateAfter],
        },
      },
    ],
    claims,
    scope: files.map(file => {
      const path = file.newPath ?? file.oldPath;
      const chapterId = path === runtimePath || path === after.anchor.path || path === headers.anchor.path
        ? 'requests'
        : path === authenticateAfter.anchor.path || path === referenceHelper.anchor.path ? 'storage' : null;
      return chapterId ? {
        type: 'explained' as const,
        fileKey: file.key,
        chapterId,
        explanation: chapterId === 'requests' ? 'Prepared request/header account with its retained requirement.' : 'Prepared local-owner versus credential authentication account.',
        references: chapterId === 'requests' ? [requirement, before, after, headers] : [authenticateBefore, authenticateAfter, referenceHelper, principalHelper],
      } : {
        type: 'unexplained' as const,
        fileKey: file.key,
        reason: 'No prepared chapter for this file. Its exact source remains independently inspectable.',
      };
    }),
    limitations: [
      'Prepared source reading for PR25, not a published StoryVersion or runtime result.',
      'The rest of the 50-file PR remains directly navigable; these chapters do not establish whole-PR behavior coverage.',
      'Declared tests are source evidence only. No test execution, participant attachment or delivered reply is asserted.',
      'Source-unchanged callers retain independent before/after identities; unchanged bytes do not prove unchanged behavior.',
    ],
  };
  validateStoryStructure(story, snapshot);
  return story;
};
