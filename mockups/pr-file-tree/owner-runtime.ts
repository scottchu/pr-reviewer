import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createStore } from '../../src/storage/public.ts';
import { createGateway } from '../../src/server/public.ts';
import { storyCanonical } from '../../src/domain/public.ts';
import type { Snapshot } from '../../src/domain/public.ts';
import { dataRoot, files, writePrivate } from '../../scripts/local.ts';
import { prepareJourneyStory } from './journey-story.ts';

const root = dataRoot();
if (root !== '/tmp/pr-reviewer-reading-journey-owner-data'
  && root !== '/private/tmp/pr-reviewer-reading-journey-owner-data') {
  throw new Error('candidate_data_root_not_authorized');
}
const paths = files(root);
const snapshot = JSON.parse(readFileSync(paths.snapshot, 'utf8')) as Snapshot;
const store = createStore(paths.database);
const reviewId = 'pr-25';
const retained = store.review({ kind: 'user', actorId: 'local-user' }, reviewId).snapshot;
if (retained.snapshotId !== snapshot.snapshotId) {
  store.close();
  throw new Error('candidate_snapshot_conflict');
}
const story = prepareJourneyStory(retained);
const current = store.story.query(store.localOwner, { reviewId, snapshotId: retained.snapshotId });
if (current.version && storyCanonical(current.version.story) !== storyCanonical(story)) {
  store.close();
  throw new Error('candidate_story_conflict: preserve the retained version');
}
if (!current.version) {
  const digest = createHash('sha256').update(storyCanonical(story)).digest('hex');
  const receipt = store.story.command(store.localOwner, {
    type: 'PublishStory',
    commandId: `candidate-story-${digest}`,
    reviewId,
    snapshotId: retained.snapshotId,
    expectedStoryRevision: current.storyRevision,
    contextRevision: current.contextRevision,
    story,
  });
  if (receipt.state !== 'applied') {
    store.close();
    throw new Error(`candidate_story_rejected: ${receipt.error}`);
  }
  writePrivate(`${root}/candidate-story-receipt.json`, receipt);
}
const version = store.story.query(store.localOwner, { reviewId, snapshotId: retained.snapshotId }).version;
const gateway = createGateway(store, async () => ({
  state: 'failed',
  reason: 'Native participant delivery is not configured for this local candidate.',
}));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceDirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
const sourcePaths = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', 'src', 'scripts', 'mockups/pr-file-tree', 'package.json', 'bun.lock', 'tsconfig.json'], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean).sort();
const sourceInputs = sourcePaths.map(path => ({
  path,
  sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
}));
const sourceInputsDigest = createHash('sha256').update(JSON.stringify(sourceInputs)).digest('hex');
writePrivate(`${root}/candidate-source-inputs.json`, { sourceCommit, sourceDirty, sourceInputsDigest, sourceInputs });
const manifest = {
  kind: 'reading-journey-candidate',
  sourceCommit,
  sourceDirty,
  sourceInputsDigest,
  pid: process.pid,
  gatewayUrl: 'http://127.0.0.1:57944',
  uiUrl: 'http://127.0.0.1:57943/',
  reviewId,
  snapshotId: retained.snapshotId,
  storyVersionId: version?.versionId,
  actor: version?.author,
  startedAt: new Date().toISOString(),
  status: 'running',
  nativeDelivery: 'unavailable',
};
let closing = false;
const close = async () => {
  if (closing) {
    return;
  }
  closing = true;
  await gateway.close();
  store.close();
  writePrivate(`${root}/candidate-runtime.json`, { ...manifest, status: 'stopped' });
};
try {
  await gateway.listen(57944);
  writePrivate(`${root}/candidate-runtime.json`, manifest);
  console.log(JSON.stringify(manifest));
  process.once('SIGTERM', () => { void close(); });
  process.once('SIGINT', () => { void close(); });
} catch (error) {
  await gateway.close().catch(() => {});
  store.close();
  throw error;
}
