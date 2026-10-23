import { DatabaseSync } from "node:sqlite";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { applyCommand, canonical, normalizeCommand } from "../domain/public.ts";
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
export const createStore = (filename: string) => {
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, actor TEXT NOT NULL, fingerprint TEXT NOT NULL, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS credentials(hash TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, body TEXT NOT NULL);",
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
  const save = (review: Review) => {
    db.prepare("INSERT OR REPLACE INTO reviews VALUES (?,?)").run(
      review.reviewId,
      JSON.stringify(review),
    );
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
  const command = (principal: Principal, input: Command): Receipt =>
    tx(() => {
      if (principal.kind === "bootstrap") throw new Error("unauthorized");
      let normalized: Command = input;
      let normalizationError = false;
      try {
        normalized = normalizeCommand(input);
      } catch {
        normalizationError = true;
      }
      const fingerprint = hash(canonical(normalized));
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
  return {
    close: () => db.close(),
    issueUser: () => issue({ kind: "user", actorId: "local-user" }),
    authenticate: (token: string): Principal => {
      const row = db
        .prepare("SELECT body FROM credentials WHERE hash=?")
        .get(hash(token)) as { body: string } | undefined;
      if (!row) throw new Error("unauthorized");
      return JSON.parse(row.body) as Principal;
    },
    prepare: (reviewId: string, snapshot: Snapshot) =>
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
        if (db.prepare("SELECT id FROM reviews WHERE id=?").get(reviewId))
          throw new Error("command_conflict");
        save({
          reviewId,
          snapshot,
          revision: 1,
          attachment: null,
          questions: [],
          replies: [],
          inbox: [],
          attempts: [],
        });
      }),
    list: (principal: Principal) => {
      if (principal.kind !== "user") throw new Error("unauthorized");
      return (
        db.prepare("SELECT id FROM reviews").all() as { id: string }[]
      ).map((r) => ({ reviewId: r.id, prUrl: load(r.id).snapshot.prUrl }));
    },
    review: (principal: Principal, id: string, minimumRevision = 0) => {
      const review = load(id);
      authorize(principal, review);
      if (review.revision < minimumRevision)
        throw new Error("projection_pending");
      return review;
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
        const inbox = [
          ...review.inbox,
          ...unaddressed.map((q) => ({
            eventId: randomUUID(),
            questionId: q.questionId,
            attachmentId: attachment.attachmentId,
            generation: attachment.generation,
            cursor: ++cursor,
            read: false,
          })),
        ];
        save({ ...review, revision: cursor, attachment, inbox });
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
