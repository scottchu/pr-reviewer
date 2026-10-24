import {createStoryStore} from './story.ts';
import type {StoryLimits} from './story.ts';
import {storyEvidenceQuerySchema,storyCanonical,validateSemanticAnchor} from '../domain/public.ts';
import type {StoryEvidenceQuery,StoryEvidence,StoryReference,SemanticAnchor,AnalysisView,SemanticSource} from '../domain/public.ts';
import {createAnalysisStore} from "./analysis.ts";
import type {AnalysisLimits} from "./analysis.ts";
import {createExecutionLease} from "./execution.ts";
import type {ImportLimits} from "./imports.ts";
import {createImportStore} from "./imports.ts";
import {isPreparedSnapshotWitness,validateProviderSnapshot} from "../source-preparation/public.ts";
import type {PreparedSnapshotWitness} from "../source-preparation/public.ts";
import { DatabaseSync } from "node:sqlite";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { applyCommand, canonical, normalizeCommand, snapshotSchema, validateAnchor } from "../domain/public.ts";
import type {
  Review,
  Snapshot,
  Principal,
  Command,
  Receipt,
  Attachment,
  Attempt,
} from "../domain/public.ts";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const secret = () => randomBytes(32).toString("hex");
const equal = (left: string, right: string) =>
  left.length === right.length &&
  timingSafeEqual(Buffer.from(left), Buffer.from(right));
type Connection = {
  host: "codex" | "claude";
  sessionId: string;
  connectionId: string;
  corroborated: boolean;
};
export const createStore = (filename: string,options:{importLimits?:ImportLimits;analysisLimits?:AnalysisLimits;storyLimits?:StoryLimits}={}) => {
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA busy_timeout=3000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, actor TEXT NOT NULL, fingerprint TEXT NOT NULL, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS credentials(hash TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS preparation_inputs(review_id TEXT PRIMARY KEY REFERENCES reviews(id), body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS review_import_identities(review_id TEXT PRIMARY KEY REFERENCES reviews(id),provider TEXT NOT NULL,host TEXT NOT NULL,target_project TEXT NOT NULL,change_number INTEGER NOT NULL,current_snapshot_id TEXT NOT NULL);",
  );
  const tx = <T>(operation: () => T): T => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  const load = (id: string): Review => {
    const row = db.prepare("SELECT body FROM reviews WHERE id=?").get(id) as
      | { body: string }
      | undefined;
    if (!row) throw new Error("source_unavailable");
    return JSON.parse(row.body) as Review;
  };
  const indexReview=(review:Review)=>{
    const snapshot=review.snapshot,candidate=snapshot.candidate;let host:string;try{host=candidate?.host??new URL(snapshot.prUrl).host;}catch{db.prepare('DELETE FROM review_import_identities WHERE review_id=?').run(review.reviewId);return;}
    db.prepare('INSERT INTO review_import_identities VALUES (?,?,?,?,?,?) ON CONFLICT(review_id) DO UPDATE SET provider=excluded.provider,host=excluded.host,target_project=excluded.target_project,change_number=excluded.change_number,current_snapshot_id=excluded.current_snapshot_id').run(review.reviewId,candidate?.provider??'github',host,candidate?.targetProject??snapshot.repository,candidate?.number??snapshot.prNumber,review.currentSnapshotId??snapshot.snapshotId);
  };
  const save = (review: Review) => {
    db.prepare("INSERT OR REPLACE INTO reviews VALUES (?,?)").run(
      review.reviewId,
      JSON.stringify(review),
    );
    indexReview(review);
  };
  const authorize = (principal: Principal, review: Review) => {
    if (principal.kind === "bootstrap") throw new Error("unauthorized");
    if (
      principal.kind === "agent" &&
      (principal.reviewId !== review.reviewId ||
        !review.attachment?.active ||
        principal.attachmentId !== review.attachment.attachmentId ||
        principal.generation !== review.attachment.generation ||
        principal.actorId !== review.attachment.actorId)
    )
      throw new Error("stale_attachment");
  };
  const issue = (principal: Principal) => {
    const token = secret();
    db.prepare("INSERT INTO credentials VALUES (?,?)").run(
      hash(token),
      JSON.stringify(principal),
    );
    return token;
  };
  const validateSnapshot=(snapshot:Snapshot) => {
    if(snapshot.candidate){validateProviderSnapshot(snapshot);return;}
    if(!snapshotSchema.safeParse(snapshot).success||Buffer.byteLength(JSON.stringify(snapshot),"utf8")>8*1024*1024)throw new Error("source_unavailable");
    const keys=new Set<string>();
    for(const source of snapshot.sources){
      const key=JSON.stringify([source.side,source.path]);
      const bytes=Buffer.from(source.content,"utf8");
      if(keys.has(key)||hash(source.content)!==source.hash||new TextDecoder("utf-8",{fatal:true,ignoreBOM:true}).decode(bytes)!==source.content||source.content.includes("\0")||source.lineCount!==(source.content.endsWith("\n")?source.content.split("\n").length-1:source.content.split("\n").length))throw new Error("source_unavailable");
      keys.add(key);
    }
    const url=new URL(snapshot.prUrl);
    if(url.username||url.password)throw new Error("source_unavailable");
    for(const reference of snapshot.documentReferences??[])if(!validateAnchor(snapshot.snapshotId,snapshot.sources,reference.source)||(reference.target&&!validateAnchor(snapshot.snapshotId,snapshot.sources,reference.target)))throw new Error("source_unavailable");
    for(const file of snapshot.changedFiles??[])for(const disposition of file.dispositions)if(disposition.state==="prepared"&&!snapshot.sources.some(source=>source.path===disposition.path&&source.side===disposition.side))throw new Error("source_unavailable");
  };
  const command = (principal: Principal, input: Command, witness?:PreparedSnapshotWitness): Receipt => {
    // Acquisition and content validation never hold the database transaction.
    let invalidSnapshot=input.type==="AddSnapshot"&&!isPreparedSnapshotWitness(witness,input.reviewId,input.snapshot);
    if(input.type==="AddSnapshot"&&principal.kind==="user")try{validateSnapshot(input.snapshot);}catch{invalidSnapshot=true;}
    return tx(() => {
      if (principal.kind === "bootstrap") throw new Error("unauthorized");
      let normalized: Command = input;
      let normalizationError = false;
      try {
        normalized = normalizeCommand(input);
      } catch {
        normalizationError = true;
      }
      const fingerprint = hash(canonical(normalized));
      if(db.prepare('SELECT id FROM story_receipts WHERE id=?').get(input.commandId))return {commandId:input.commandId,actorId:principal.actorId,state:'rejected',revision:0,cursor:0,result:{},error:'command_conflict'};
      const old = db
        .prepare("SELECT actor,fingerprint,body FROM receipts WHERE id=?")
        .get(input.commandId) as
        | { actor: string; fingerprint: string; body: string }
        | undefined;
      if (old) {
        if (old.actor === principal.actorId && old.fingerprint === fingerprint)
          return JSON.parse(old.body) as Receipt;
        return {
          commandId: input.commandId,
          actorId: principal.actorId,
          state: "rejected",
          revision: 0,
          cursor: 0,
          result: {},
          error: "command_conflict",
        };
      }
      const review = load(input.reviewId);
      let receipt: Receipt;
      try {
        if (normalizationError) throw new Error("invalid_request");
        const next = applyCommand(
          review,
          principal,
          normalized,
          { entity: randomUUID(), event: randomUUID() },
          new Date().toISOString(),
        );
        if(invalidSnapshot&&next.result.alreadyRetained!==true)throw new Error("source_unavailable");
        save(next.review);
        receipt = {
          commandId: input.commandId,
          actorId: principal.actorId,
          state: "applied",
          revision: next.review.revision,
          cursor: next.review.revision,
          result: next.result,
        };
      } catch (error) {
        receipt = {
          commandId: input.commandId,
          actorId: principal.actorId,
          state: "rejected",
          revision: review.revision,
          cursor: review.revision,
          result: {},
          error: error instanceof Error ? error.message : "invalid_request",
        };
      }
      db.prepare("INSERT INTO receipts VALUES (?,?,?,?)").run(
        input.commandId,
        principal.actorId,
        fingerprint,
        JSON.stringify(receipt),
      );
      return receipt;
    });
  };
  try{
    tx(()=>{
      for(const row of db.prepare("SELECT id,body FROM reviews").all() as {id:string;body:string}[]){
        const review=JSON.parse(row.body) as Review;
        const snapshots=review.snapshots??[review.snapshot];
        const currentSnapshotId=review.currentSnapshotId??review.snapshot.snapshotId;
        if(!snapshots.length||new Set(snapshots.map(snapshot=>snapshot.snapshotId)).size!==snapshots.length||!snapshots.some(snapshot=>snapshot.snapshotId===currentSnapshotId))throw new Error("source_unavailable");
        if(!review.snapshots||!review.currentSnapshotId)save({...review,snapshots,currentSnapshotId});else indexReview(review);
      }
    });
  }catch(error){db.close();throw error;}
  const execution=createExecutionLease(db);
  let imports:ReturnType<typeof createImportStore>;
  try{imports=createImportStore({db,tx,load,save,execution,...(options.importLimits?{limits:options.importLimits}:{})});}catch(error){db.close();throw error;}
  const analysis=createAnalysisStore({db,tx,load,authorize,execution,...(options.analysisLimits?{limits:options.analysisLimits}:{})});
  const authenticate = (token: string): Principal => {
    const row=db.prepare("SELECT body FROM credentials WHERE hash=?").get(hash(token)) as {body:string}|undefined;
    if(!row)throw new Error("unauthorized");return JSON.parse(row.body) as Principal;
  };
  let story:ReturnType<typeof createStoryStore>;
  const storyEvidence=(token:string,input:StoryEvidenceQuery):StoryEvidence=>{
    const query=storyEvidenceQuerySchema.parse(input),principal=authenticate(token),review=load(query.reviewId);authorize(principal,review);
    const snapshot=(review.snapshots??[review.snapshot]).find(item=>item.snapshotId===query.snapshotId);if(!snapshot)throw new Error('source_unavailable');
    const references=[...new Map(query.references.map(ref=>[storyCanonical(ref),ref])).values()];
    const selected=analysis.query(token,{reviewId:query.reviewId,snapshotId:query.snapshotId}).selectedAnalysisId;
    let view:AnalysisView|undefined,basisUnavailable=false;
    if(query.analysisId)try{view=analysis.query(token,{reviewId:query.reviewId,snapshotId:query.snapshotId,analysisId:query.analysisId});if(view.analysis?.status!=='analyzed'||view.analysis.analysisId!==query.analysisId||view.corpus?.corpusId!==query.corpusId)throw new Error('story_reference_invalid');}catch{basisUnavailable=true;}
    const sourceMap=new Map(snapshot.sources.map(source=>[JSON.stringify([source.side,source.path]),source]));
    const nodes=new Map(view?.analysis?.status==='analyzed'?view.analysis.nodes.map(node=>[node.id,node]):[]),edges=new Map(view?.analysis?.status==='analyzed'?view.analysis.edges.map(edge=>[edge.id,edge]):[]);
    const sourceCache=new Map<string,SemanticSource|null>(),valid:StoryReference[]=[],invalid:StoryEvidence['invalid']=[],facts:StoryEvidence['facts']=[];
    for(const reference of references)try{
      switch(reference.type){
        case 'snapshot_source':{const source=sourceMap.get(JSON.stringify([reference.anchor.side,reference.anchor.path]));if(!source||source.hash!==reference.contentHash||hash(source.content)!==source.hash||!validateAnchor(query.snapshotId,[source],reference.anchor))throw new Error('source_unavailable');break;}
        case 'semantic_source':{if(basisUnavailable||!query.analysisId||query.corpusId!==reference.corpusId||reference.anchor.snapshotId!==query.snapshotId)throw new Error('story_reference_invalid');const key=JSON.stringify([reference.corpusId,reference.anchor.side,reference.anchor.path,reference.anchor.contentHash]);if(!sourceCache.has(key)){let source:SemanticSource|null=null;try{source=analysis.source(token,{reviewId:query.reviewId,snapshotId:query.snapshotId,corpusId:reference.corpusId,side:reference.anchor.side,path:reference.anchor.path,contentHash:reference.anchor.contentHash});}catch{}sourceCache.set(key,source);}const source=sourceCache.get(key);if(!source||hash(source.content)!==source.contentHash||!validateSemanticAnchor(source,reference.anchor))throw new Error('source_unavailable');break;}
        case 'static_node':case 'static_edge':{if(basisUnavailable||!query.analysisId||reference.analysisId!==query.analysisId)throw new Error('story_reference_invalid');const node=reference.type==='static_node'?nodes.get(reference.factId):undefined,edge=reference.type==='static_edge'?edges.get(reference.factId):undefined;if(!node&&!edge)throw new Error('story_reference_invalid');const anchors:SemanticAnchor[]=node?[node.declaration,node.body]:edge?[edge.target,...edge.sites.flatMap(site=>[site.anchor,...site.linkage,...site.signatures])]:[];facts.push({reference,anchors});break;}
        case 'capture':{const capture=story.context(token,{reviewId:query.reviewId,snapshotId:query.snapshotId,captureId:reference.captureId}).captures[0];if(!capture||capture.contentHash!==reference.contentHash||hash(capture.text)!==capture.contentHash||reference.start!==undefined&&reference.end!>capture.text.length)throw new Error('story_context_unavailable');break;}
        case 'metadata':{const value=snapshot[reference.field];if(value===undefined||value==='')throw new Error('source_unavailable');break;}
        case 'clarification':{if(basisUnavailable||reference.analysisId!==query.analysisId||!view?.clarifications.some(item=>item.clarificationId===reference.clarificationId&&item.analysisId===reference.analysisId&&item.history.some(revision=>revision.revision===reference.revision)))throw new Error('story_reference_invalid');break;}
      }valid.push(reference);
    }catch(error){invalid.push({reference,reason:error instanceof Error?error.message:'story_reference_invalid'});}
    return {reviewId:query.reviewId,snapshotId:query.snapshotId,selectedAnalysisId:selected,valid,invalid,facts,basisUnavailable};
  };
  story=createStoryStore({db,tx,load,authenticate,authorize,resolveEvidence:storyEvidence,...(options.storyLimits?{limits:options.storyLimits}:{})});
  return {
    imports,
    story,
    storyEvidence,
    analysis,
    close: () => db.close(),
    issueUser: () => issue({ kind: "user", actorId: "local-user" }),
    authenticate: (token: string): Principal => {
      const row = db
        .prepare("SELECT body FROM credentials WHERE hash=?")
        .get(hash(token)) as { body: string } | undefined;
      if (!row) throw new Error("unauthorized");
      return JSON.parse(row.body) as Principal;
    },
    preparedInput: (reviewId:string):unknown|null => {
      const row=db.prepare("SELECT body FROM preparation_inputs WHERE review_id=?").get(reviewId) as {body:string}|undefined;
      return row?JSON.parse(row.body):null;
    },
    prepare: (reviewId: string, snapshot: Snapshot, sourceInput?:unknown) =>
      tx(() => {
        for (const source of snapshot.sources) {
          const lines = source.content.endsWith("\n")
            ? source.content.split("\n").length - 1
            : source.content.split("\n").length;
          if (
            hash(source.content) !== source.hash ||
            lines !== source.lineCount ||
            source.content.includes("\0")
          )
            throw new Error("source_unavailable");
        }
        if (db.prepare("SELECT id FROM reviews WHERE id=?").get(reviewId)) {
          if (canonical((load(reviewId).snapshots??[load(reviewId).snapshot]).find(retained=>retained.snapshotId===snapshot.snapshotId)) !== canonical(snapshot))
            throw new Error("command_conflict");
          if(sourceInput!==undefined)db.prepare("INSERT OR IGNORE INTO preparation_inputs VALUES (?,?)").run(reviewId,JSON.stringify(sourceInput));
          return;
        }
        save({
          reviewId,
          snapshot,
          snapshots:[snapshot],
          currentSnapshotId:snapshot.snapshotId,
          revision: 1,
          attachment: null,
          questions: [],
          replies: [],
          inbox: [],
          attempts: [],
        });
        if(sourceInput!==undefined)db.prepare("INSERT INTO preparation_inputs VALUES (?,?)").run(reviewId,JSON.stringify(sourceInput));
      }),
    list: (principal: Principal) => {
      if (principal.kind !== "user") throw new Error("unauthorized");
      return (
        db.prepare("SELECT id FROM reviews").all() as { id: string }[]
      ).map((r) => ({ reviewId: r.id, prUrl: load(r.id).snapshot.prUrl }));
    },
    review: (principal: Principal, id: string, minimumRevision = 0, snapshotId?:string):Review => {
      const review = load(id);
      authorize(principal, review);
      if (review.revision < minimumRevision)
        throw new Error("projection_pending");
      const snapshots=review.snapshots??[review.snapshot];
      const selected=snapshots.find(snapshot=>snapshot.snapshotId===(snapshotId??review.currentSnapshotId??review.snapshot.snapshotId));
      if(!selected)throw new Error("source_unavailable");
      const {snapshots:_sources,...projection}=review;
      return {...projection,snapshot:selected,currentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId,snapshotSummaries:snapshots.map(({snapshotId,baseSha,headSha,title})=>({snapshotId,baseSha,headSha,...(title?{title}:{})}))};
    },
    command,
    registerConnection: (principal: Principal, connection: Connection) =>
      tx(() => {
        if (principal.kind !== "user") throw new Error("unauthorized");
        const bootstrap: Principal = {
          kind: "bootstrap",
          actorId: principal.actorId,
          ...connection,
        };
        return { principal: bootstrap, token: issue(bootstrap) };
      }),
    challenge: (
      principal: Principal,
      reviewId: string,
      host: Connection["host"],
      sessionId: string,
      connectionId: string,
      ttl = 300000,
    ) =>
      tx(() => {
        if (principal.kind !== "user") throw new Error("unauthorized");
        load(reviewId);
        const challengeId = randomUUID(),
          proof = secret();
        db.prepare("INSERT INTO challenges VALUES (?,?)").run(
          challengeId,
          JSON.stringify({
            reviewId,
            host,
            sessionId,
            connectionId,
            owner: principal.actorId,
            proofHash: hash(proof),
            expiry: Date.now() + ttl,
            consumed: false,
          }),
        );
        return {
          challengeId,
          proof,
          expiresAt: new Date(Date.now() + ttl).toISOString(),
        };
      }),
    attach: (principal: Principal, challengeId: string, proof: string) =>
      tx(() => {
        if (principal.kind !== "bootstrap") throw new Error("unauthorized");
        const row = db
          .prepare("SELECT body FROM challenges WHERE id=?")
          .get(challengeId) as { body: string } | undefined;
        if (!row) throw new Error("unauthorized");
        const c = JSON.parse(row.body) as {
          reviewId: string;
          host: string;
          sessionId: string;
          connectionId: string;
          owner: string;
          proofHash: string;
          expiry: number;
          consumed: boolean;
        };
        if (
          c.consumed ||
          c.expiry <= Date.now() ||
          c.owner !== principal.actorId ||
          c.host !== principal.host ||
          c.sessionId !== principal.sessionId ||
          c.connectionId !== principal.connectionId ||
          !equal(c.proofHash, hash(proof))
        )
          throw new Error("unauthorized");
        if (!principal.corroborated) throw new Error("identity_pending");
        const review = load(c.reviewId);
        const attachment: Attachment = {
          attachmentId: randomUUID(),
          actorId: randomUUID(),
          host: principal.host,
          sessionId: principal.sessionId,
          connectionId: principal.connectionId,
          generation: (review.attachment?.generation ?? 0) + 1,
          active: true,
        };
        const unaddressed = review.questions.filter(
          (q) => !review.inbox.some((i) => i.questionId === q.questionId),
        );
        let cursor = review.revision + 1;
        const unanswered = new Set(
          review.questions
            .filter(
              (q) =>
                !review.replies.some(
                  (reply) => reply.questionId === q.questionId,
                ),
            )
            .map((q) => q.questionId),
        );
        const inbox = [
          ...review.inbox.map((item) =>
            unanswered.has(item.questionId)
              ? {
                  ...item,
                  attachmentId: attachment.attachmentId,
                  generation: attachment.generation,
                  read: false,
                }
              : item,
          ),
          ...unaddressed.map((q) => ({
            eventId: randomUUID(),
            questionId: q.questionId,
            attachmentId: attachment.attachmentId,
            generation: attachment.generation,
            cursor: ++cursor,
            read: false,
          })),
        ];
        save({
          ...review,
          revision: cursor,
          attachment,
          inbox,
          questions: review.questions.map((q) =>
            unanswered.has(q.questionId) ? { ...q, working: false } : q,
          ),
        });
        db.prepare("UPDATE challenges SET body=? WHERE id=?").run(
          JSON.stringify({ ...c, consumed: true }),
          challengeId,
        );
        const token = issue({
          kind: "agent",
          actorId: attachment.actorId,
          reviewId: review.reviewId,
          attachmentId: attachment.attachmentId,
          generation: attachment.generation,
        });
        const receipt: Receipt = {
          commandId: `attach:${challengeId}`,
          actorId: principal.actorId,
          state: "applied",
          revision: cursor,
          cursor,
          result: {
            attachmentId: attachment.attachmentId,
            generation: attachment.generation,
          },
        };
        db.prepare("INSERT INTO receipts VALUES (?,?,?,?)").run(
          receipt.commandId,
          principal.actorId,
          hash(
            canonical({ challengeId, connectionId: principal.connectionId }),
          ),
          JSON.stringify(receipt),
        );
        return { attachment, token, receipt };
      }),
    inbox: (principal: Principal, cursor = 0, limit = 20) =>
      tx(() => {
        if (principal.kind !== "agent") throw new Error("unauthorized");
        const review = load(principal.reviewId);
        authorize(principal, review);
        const items = review.inbox
          .filter(
            (i) =>
              i.attachmentId === principal.attachmentId &&
              i.generation === principal.generation &&
              i.cursor > cursor,
          )
          .slice(0, Math.min(100, Math.max(1, limit)));
        const ids = new Set(items.map((i) => i.eventId));
        save({
          ...review,
          inbox: review.inbox.map((i) =>
            ids.has(i.eventId) ? { ...i, read: true } : i,
          ),
          questions: review.questions.map((q) =>
            items.some((i) => i.questionId === q.questionId)
              ? { ...q, working: true }
              : q,
          ),
        });
        return { items, nextCursor: items.at(-1)?.cursor ?? cursor };
      }),
    pending: () =>
      (db.prepare("SELECT body FROM reviews").all() as { body: string }[])
        .map((row) => JSON.parse(row.body) as Review)
        .filter((r) => r.attachment?.active),
    claim: (reviewId: string): Attempt | null =>
      tx(() => {
        const review = load(reviewId);
        const a = review.attachment;
        if (!a?.active) return null;
        const addressed = new Set(
          review.attempts.flatMap((attempt) => attempt.eventIds),
        );
        const items = review.inbox.filter(
          (i) =>
            i.attachmentId === a.attachmentId &&
            i.generation === a.generation &&
            !addressed.has(i.eventId),
        );
        if (!items.length) return null;
        const attempt: Attempt = {
          invocationId: randomUUID(),
          attachmentId: a.attachmentId,
          generation: a.generation,
          eventIds: items.map((i) => i.eventId),
          state: "notifying",
          reason: "durable claim before CLI spawn",
        };
        save({ ...review, attempts: [...review.attempts, attempt] });
        return attempt;
      }),
    finish: (
      reviewId: string,
      invocationId: string,
      state: Attempt["state"],
      reason: string,
    ) =>
      tx(() => {
        const review = load(reviewId);
        save({
          ...review,
          attempts: review.attempts.map((a) =>
            a.invocationId === invocationId
              ? { ...a, state, reason: reason.slice(0, 512) }
              : a,
          ),
        });
      }),
    recover: () =>
      tx(() => {
        for (const row of db.prepare("SELECT body FROM reviews").all() as {
          body: string;
        }[]) {
          const review = JSON.parse(row.body) as Review;
          save({
            ...review,
            attempts: review.attempts.map((a) =>
              a.state === "notifying"
                ? {
                    ...a,
                    state: "unknown",
                    reason:
                      "process restarted after durable claim; no blind replay",
                  }
                : a,
            ),
          });
        }
      }),
  };
};
export type Store = ReturnType<typeof createStore>;
export type {ImportOwner,ImportGrant} from './imports.ts';

export type {AnalysisOwner,AnalysisGrant,AnalysisLimits} from './analysis.ts';

export type {StoryLimits} from './story.ts';
export type {StoryContent,StoryCommand} from '../domain/public.ts';
