import {readHeadTestConfiguration,readHeadTestArtifact} from '../test-jobs/public.ts';
import type {HeadTestConfiguration} from '../test-jobs/public.ts';
import {createHeadTestOwnerStore} from './head-test-owner.ts';
import type {HeadTestStoredJob as StoredJob} from './head-test-contracts.ts';
import {createHash, randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {headTestEffectOccupiesSlot, headTestCanonical, headTestCommandSchema, headTestDefinition, HEAD_TEST_DEFINITION_DIGEST, headTestQuerySchema, headTestScopeSchema,headTestArtifactQuerySchema} from '../domain/public.ts';
import type {HeadTestArtifactQuery, HeadTestArtifactView, HeadTestCommand, HeadTestJob, HeadTestQuery, HeadTestReceipt, HeadTestScope, HeadTestTargets, HeadTestTarget, HeadTestView, Principal, Review, Snapshot} from '../domain/public.ts';
import type {ExecutionLease} from './execution.ts';

export type HeadTestOptions = Readonly<{testOnlyAvailable?: true; testOnlyExecution?: true; configuration?: HeadTestConfiguration; maxPending?: number; maxJobsPerReview?: number; maxRetainedBytes?: number}>;
type Ports = Readonly<{db: DatabaseSync; tx: <T>(operation: () => T) => T; load: (id: string) => Review; authenticate: (token: string) => Principal; authorize: (principal: Principal, review: Review) => void; execution: ExecutionLease; options?: HeadTestOptions}>;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const reserveBytes = 2 * 1024 * 1024;
const terminal = new Set<HeadTestJob['state']>(['cancelled', 'passed', 'failed', 'timed_out', 'unavailable', 'error']);
const publicJob = ({credentialReference: _credential, reservedBytes: _reserved, retainedBytes: _retained, stopReason: _stop, artifactLocations: _locations, cleanupLocation:_cleanupLocation,cleanupAfter:_cleanupAfter, invocations, ...job}: StoredJob): HeadTestJob => ({...job,invocations:invocations.map(({invocationId,phase,state,quiescence,processes})=>({invocationId,phase,state,quiescence,...(processes?{processCount:processes.length}:{})}))});
const target = (): HeadTestTarget => ({targetId: 'review-source-core-v1', revision: 2, digest: HEAD_TEST_DEFINITION_DIGEST, definition: headTestDefinition()});
const configuredRepository = (snapshot: Snapshot): boolean => {
  const url = new URL(snapshot.prUrl), candidate = snapshot.candidate;
  return snapshot.repository === 'scottchu/pr-reviewer' && url.protocol === 'https:' && url.host === 'github.com' && url.pathname === `/scottchu/pr-reviewer/pull/${snapshot.prNumber}` && !url.username && !url.password &&
    (!candidate || candidate.provider === 'github' && candidate.host === 'github.com' && candidate.sourceProject === 'scottchu/pr-reviewer' && candidate.targetProject === snapshot.repository && candidate.headSha === snapshot.headSha && candidate.baseSha === snapshot.baseSha && candidate.number === snapshot.prNumber && candidate.url === snapshot.prUrl);
};

export const validateHeadTestOptions=(options:HeadTestOptions={})=>{
 if(options.configuration&&!readHeadTestConfiguration(options.configuration)||options.configuration&&(options.testOnlyExecution||options.testOnlyAvailable)||options.testOnlyAvailable&&options.testOnlyExecution||options.testOnlyAvailable!==undefined&&options.testOnlyAvailable!==true||options.testOnlyExecution!==undefined&&options.testOnlyExecution!==true)throw new Error('invalid_test_configuration');
 for(const [value,ceiling] of [[options.maxPending??8,8],[options.maxJobsPerReview??256,256],[options.maxRetainedBytes??64*1024*1024,64*1024*1024]] as const)if(!Number.isSafeInteger(value)||value<1||value>ceiling)throw new Error('invalid_test_limit');
};

export const createHeadTestStore = ({db, tx, load, authenticate, authorize, execution, options = {}}: Ports) => {
  const configuration=options.configuration?readHeadTestConfiguration(options.configuration):null;
  if(options.configuration&&!configuration||configuration&&(options.testOnlyExecution||options.testOnlyAvailable))throw new Error('invalid_test_configuration');
  const fixtureExecution = options.testOnlyExecution === true, testOnlyAvailable = options.testOnlyAvailable === true || fixtureExecution;
  const maxPending = options.maxPending ?? 8, maxJobs = options.maxJobsPerReview ?? 256, quota = options.maxRetainedBytes ?? 64 * 1024 * 1024;
  for (const [value, ceiling] of [[maxPending, 8], [maxJobs, 256], [quota, 64 * 1024 * 1024]] as const)
    if (!Number.isSafeInteger(value) || value < 1 || value > ceiling) throw new Error('invalid_test_limit');
  if (options.testOnlyAvailable && options.testOnlyExecution || options.testOnlyExecution !== undefined && options.testOnlyExecution !== true || options.testOnlyAvailable !== undefined && options.testOnlyAvailable !== true) throw new Error('invalid_test_configuration');
  db.exec('CREATE TABLE IF NOT EXISTS test_jobs(id TEXT PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS test_receipts(id TEXT PRIMARY KEY,actor TEXT NOT NULL,fingerprint TEXT NOT NULL,body TEXT NOT NULL);');
  const rows = () => (db.prepare('SELECT rowid AS sequence,body FROM test_jobs ORDER BY rowid').all() as {sequence: number; body: string}[]).map(row => ({sequence: row.sequence, job: JSON.parse(row.body) as StoredJob}));
  const put = (job: StoredJob) => db.prepare('INSERT INTO test_jobs VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(job.jobId, headTestCanonical(job));
  const get = (jobId: string): StoredJob => {
    const row = db.prepare('SELECT body FROM test_jobs WHERE id=?').get(jobId) as {body: string} | undefined;
    if (!row) throw new Error('test_job_unavailable');
    return JSON.parse(row.body) as StoredJob;
  };
  const auth = (token: string, scope: HeadTestScope) => {
    execution.assertCurrent();
    const principal = authenticate(token), review = load(scope.reviewId); authorize(principal, review);
    const snapshot = (review.snapshots ?? [review.snapshot]).find(item => item.snapshotId === scope.snapshotId);
    if (!snapshot) throw new Error('source_unavailable');
    return {principal, snapshot};
  };
  // No runner exists here. Recovery retains interrupted intent and the shared exclusion.
  tx(() => {
    execution.assertCurrent();
    for (const {job} of rows()) {
      const invocation = job.invocations.at(-1);
      const interrupted = ['preparing', 'running', 'cancel_requested'].includes(job.state) || invocation?.state === 'running';
      const unresolved = headTestEffectOccupiesSlot(job);
      const normalize = interrupted || unresolved && (job.state !== 'unknown' || job.effectDisposition !== 'unresolved');
      if (unresolved) {
        const next: StoredJob = normalize ? {...job, state: 'unknown', reason: 'interrupted_test_invocation', effectDisposition: 'unresolved', jobRevision: job.jobRevision + 1, updatedAt: new Date().toISOString(), invocations: job.invocations.map(item => item.state === 'running' ? {...item, state: 'unknown', quiescence: 'unresolved'} : item)} : job;
        if (normalize) put(next);
        if (invocation) execution.retain({kind: 'test', jobId: job.jobId, invocationId: invocation.invocationId, phase: invocation.phase});
      } else if (job.state === 'unknown' && job.effectDisposition === 'quiescent' && invocation?.quiescence === 'confirmed') {
        execution.clearQuiescent('test', job.jobId, invocation.invocationId);
      }
    }
  });
  const targets = (token: string, input: HeadTestScope): HeadTestTargets => {
    const scope = headTestScopeSchema.parse(input), {snapshot} = auth(token, scope), configured = configuredRepository(snapshot);
    return {...scope, headSha: snapshot.headSha, targets: [{...target(), availability: configured && (testOnlyAvailable||configuration?.qualification.headSha===snapshot.headSha) ? 'available' : 'unavailable', reason: !configured ? 'repository_not_configured' : fixtureExecution ? 'test_only_execution' : testOnlyAvailable ? 'test_only_configuration' : configuration?.qualification.headSha===snapshot.headSha ? 'qualified_local_configuration' : configuration ? 'qualification_required' : 'execution_not_configured'}]};
  };
  const command = (token: string, input: HeadTestCommand): HeadTestReceipt => {
    const parsed = headTestCommandSchema.parse(input), fingerprint = hash(headTestCanonical(parsed));
    return tx(() => {
      execution.assertCurrent();
      const previous = parsed.type === 'CancelTest' ? get(parsed.jobId) : undefined;
      const scope = parsed.type === 'RequestTest' ? {reviewId: parsed.reviewId, snapshotId: parsed.snapshotId} : {reviewId: previous!.reviewId, snapshotId: previous!.snapshotId};
      const {principal, snapshot} = auth(token, scope);
      if (principal.kind !== 'user' || previous && previous.actorId !== principal.actorId) throw new Error('unauthorized');
      const old = db.prepare('SELECT actor,fingerprint,body FROM test_receipts WHERE id=?').get(parsed.commandId) as {actor: string; fingerprint: string; body: string} | undefined;
      if (old) {
        if (old.actor !== principal.actorId || old.fingerprint !== fingerprint) throw new Error('command_conflict');
        return JSON.parse(old.body) as HeadTestReceipt;
      }
      for (const table of ['receipts', 'import_receipts', 'analysis_receipts', 'story_receipts'])
        if (db.prepare(`SELECT id FROM ${table} WHERE id=?`).get(parsed.commandId)) throw new Error('command_conflict');
      let job: StoredJob, disposition: HeadTestReceipt['result']['disposition'];
      if (parsed.type === 'RequestTest') {
        if (parsed.targetId !== 'review-source-core-v1') throw new Error('test_target_unavailable');
        if (parsed.expectedTargetRevision !== 2) throw new Error('test_target_conflict');
        if (!configuredRepository(snapshot)) throw new Error('repository_not_configured');
        if (!testOnlyAvailable && !configuration) throw new Error('execution_not_configured');
        if (!testOnlyAvailable && configuration?.qualification.headSha!==snapshot.headSha) throw new Error('qualification_required');
        const existing = rows().map(row => row.job), sameReview = existing.filter(item => item.reviewId === scope.reviewId);
        if (existing.filter(item => headTestEffectOccupiesSlot(item) || !terminal.has(item.state) && item.state !== 'unknown').length >= maxPending) throw new Error('test_queue_full');
        if (sameReview.length >= maxJobs) throw new Error('test_history_limit');
        if (sameReview.reduce((bytes, item) => bytes + item.reservedBytes + item.retainedBytes, 0) + reserveBytes > quota) throw new Error('test_storage_limit');
        const now = new Date().toISOString();
        job = {schema: 'head-test-job-v1', jobId: randomUUID(), ...scope, repository: snapshot.repository, sourceProject: snapshot.candidate?.sourceProject ?? snapshot.repository, baseSha: snapshot.baseSha, headSha: snapshot.headSha, actorId: principal.actorId, credentialReference: hash(token), target: target(), provenance: fixtureExecution ? 'test_only_execution' : testOnlyAvailable ? 'test_only_configuration' : 'qualified_local_configuration', ...(!testOnlyAvailable&&configuration?{qualificationId:configuration.qualificationId}:{}), createdAt: now, updatedAt: now, jobRevision: 1, state: 'queued', reason: null, effectDisposition: 'none', cancellation: null, invocations: [], reservedBytes: reserveBytes, retainedBytes: 0};
        disposition = 'queued'; put(job);
      } else {
        job = previous!;
        if (parsed.expectedJobRevision !== job.jobRevision) throw new Error('test_job_conflict');
        if (terminal.has(job.state)) disposition = 'already_terminal';
        else if (job.cancellation) disposition = 'cancel_requested';
        else {
          const now = new Date().toISOString(), noLaunch = job.state === 'queued' && job.invocations.length === 0 && job.effectDisposition === 'none';
          job = {...job, state: noLaunch ? 'cancelled' : job.state === 'unknown' ? 'unknown' : 'cancel_requested', jobRevision: job.jobRevision + 1, updatedAt: now, cancellation: {commandId: parsed.commandId, actorId: principal.actorId, requestedAt: now}};
          if (noLaunch) job = {...job, reservedBytes: 0, retainedBytes: Buffer.byteLength(headTestCanonical(publicJob(job)), 'utf8')};
          disposition = noLaunch ? 'cancelled' : 'cancel_requested'; put(job);
        }
      }
      const receipt: HeadTestReceipt = {commandId: parsed.commandId, actorId: principal.actorId, ...scope, jobId: job.jobId, jobRevision: job.jobRevision, state: 'applied', result: {disposition}};
      db.prepare('INSERT INTO test_receipts VALUES (?,?,?,?)').run(parsed.commandId, principal.actorId, fingerprint, headTestCanonical(receipt));
      return receipt;
    });
  };
  const query = (token: string, input: HeadTestQuery): HeadTestView => {
    const parsed = headTestQuerySchema.parse(input), scope = {reviewId: parsed.reviewId, snapshotId: parsed.snapshotId}; auth(token, scope);
    if (parsed.jobId) {
      const job = get(parsed.jobId);
      if (job.reviewId !== scope.reviewId || job.snapshotId !== scope.snapshotId) throw new Error('test_job_unavailable');
      if (job.jobRevision < (parsed.minimumJobRevision ?? 0)) throw new Error('revision_unavailable');
      const view = publicJob(job); return {...scope, jobs: [view], selectedJob: view, nextCursor: null};
    }
    let after = 0;
    if (parsed.cursor) {
      try {
        const cursor = JSON.parse(Buffer.from(parsed.cursor, 'base64url').toString('utf8')) as {v: number; reviewId: string; snapshotId: string; after: number};
        if (cursor.v !== 1 || cursor.reviewId !== scope.reviewId || cursor.snapshotId !== scope.snapshotId || !Number.isSafeInteger(cursor.after) || cursor.after < 1 || Object.keys(cursor).sort().join(',') !== 'after,reviewId,snapshotId,v' || Buffer.from(headTestCanonical(cursor)).toString('base64url') !== parsed.cursor) throw new Error('invalid_test_cursor');
        after = cursor.after;
      } catch {throw new Error('invalid_test_cursor');}
    }
    const matching = (db.prepare("SELECT rowid AS sequence,body FROM test_jobs WHERE rowid>? AND json_extract(body,'$.reviewId')=? AND json_extract(body,'$.snapshotId')=? ORDER BY rowid LIMIT 33").all(after, scope.reviewId, scope.snapshotId) as {sequence: number; body: string}[]).map(row => ({sequence: row.sequence, job: JSON.parse(row.body) as StoredJob})), page = matching.slice(0, 32);
    return {...scope, jobs: page.map(row => publicJob(row.job)), selectedJob: null, nextCursor: matching.length > 32 ? Buffer.from(headTestCanonical({v: 1, ...scope, after: page.at(-1)!.sequence})).toString('base64url') : null};
  };
  const artifact=async(token:string,input:HeadTestArtifactQuery):Promise<HeadTestArtifactView>=>{
   const parsed=headTestArtifactQuerySchema.parse(input),scope={reviewId:parsed.reviewId,snapshotId:parsed.snapshotId};const {principal}=auth(token,scope),job=get(parsed.jobId);
   if(job.reviewId!==scope.reviewId||job.snapshotId!==scope.snapshotId||principal.kind==='user'&&principal.actorId!==job.actorId)throw new Error('test_job_unavailable');
   const descriptor=job.result?.artifacts.find(item=>item.artifactId===parsed.artifactId),location=job.artifactLocations?.find(item=>item.artifactId===parsed.artifactId);if(!descriptor||!location)throw new Error('test_artifact_unavailable');
   const bytes=await readHeadTestArtifact(location,descriptor);auth(token,scope);const offset=parsed.offset??0;if(offset>bytes.length)throw new Error('invalid_artifact_offset');const end=Math.min(bytes.length,offset+(parsed.length??65536)),chunk=bytes.subarray(offset,end);
   return {jobId:job.jobId,artifactId:descriptor.artifactId,sha256:descriptor.sha256,totalBytes:bytes.length,offset,bytes:chunk.length,complete:end===bytes.length,nextOffset:end,encoding:'base64',data:chunk.toString('base64')};
  };
  return {targets, command, query, artifact, ...createHeadTestOwnerStore({db,tx,load,authorize,execution,rows,get,put,publicJob,fixtureExecution,configuration})};
};
