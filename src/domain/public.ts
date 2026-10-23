import { z } from "zod";
export const anchorSchema = z
  .object({
    snapshotId: z.string().min(1),
    side: z.enum(["base", "head"]),
    path: z.string().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive(),
  })
  .strict();
export type Anchor = z.infer<typeof anchorSchema>;
export type Source = {
  path: string;
  side: "base" | "head";
  content: string;
  hash: string;
  lineCount: number;
};
export type Snapshot = {
  title?: string;
  snapshotId: string;
  repository: string;
  prUrl: string;
  prNumber: number;
  baseSha: string;
  headSha: string;
  sources: Source[];
};
export type Attachment = {
  attachmentId: string;
  actorId: string;
  host: "codex" | "claude";
  sessionId: string;
  connectionId: string;
  generation: number;
  active: boolean;
};
export type Question = {
  questionId: string;
  anchor: Anchor;
  text: string;
  actorId: string;
  revision: number;
  createdAt: string;
  working: boolean;
};
export type Reply = {
  replyId: string;
  questionId: string;
  body: string;
  evidence: Anchor[];
  limitations: string;
  actorId: string;
  attachmentId: string;
  generation: number;
  revision: number;
};
export type InboxItem = {
  eventId: string;
  questionId: string;
  attachmentId: string;
  generation: number;
  cursor: number;
  read: boolean;
};
export type Attempt = {
  invocationId: string;
  eventIds: string[];
  attachmentId: string;
  generation: number;
  state: "requested" | "notifying" | "notified" | "unknown" | "failed";
  reason: string;
};
export type Review = {
  reviewId: string;
  snapshot: Snapshot;
  revision: number;
  attachment: Attachment | null;
  questions: Question[];
  replies: Reply[];
  inbox: InboxItem[];
  attempts: Attempt[];
};
export type Principal =
  | { kind: "user"; actorId: string }
  | {
      kind: "agent";
      actorId: string;
      reviewId: string;
      attachmentId: string;
      generation: number;
    }
  | {
      kind: "bootstrap";
      actorId: string;
      host: "codex" | "claude";
      sessionId: string;
      connectionId: string;
      corroborated: boolean;
    };
export type Receipt = {
  commandId: string;
  actorId: string;
  state: "applied" | "rejected";
  revision: number;
  cursor: number;
  result: Record<string, unknown>;
  error?: string;
};
export const commandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("AskQuestion"),
      commandId: z.string().min(1).max(128),
      reviewId: z.string(),
      anchor: anchorSchema,
      text: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal("SubmitReply"),
      commandId: z.string().min(1).max(128),
      reviewId: z.string(),
      questionId: z.string(),
      generation: z.number().int(),
      body: z.string(),
      evidence: z.array(anchorSchema).min(1).max(20),
      limitations: z.string(),
    })
    .strict(),
  z
    .object({
      type: z.literal("RevokeAttachment"),
      commandId: z.string().min(1).max(128),
      reviewId: z.string(),
      attachmentId: z.string(),
    })
    .strict(),
]);
export type Command = z.infer<typeof commandSchema>;
export const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item: unknown) =>
    item !== null && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );
export const textValue = (value: string, max: number): string => {
  const text = value.trim();
  if (!text || Buffer.byteLength(text, "utf8") > max)
    throw new Error("invalid_request");
  return text;
};
export const validateAnchor = (
  snapshotId: string,
  sources: Source[],
  anchor: Anchor,
): boolean =>
  anchor.snapshotId === snapshotId &&
  sources.some(
    (s) =>
      s.path === anchor.path &&
      s.side === anchor.side &&
      Number.isInteger(anchor.startLine) &&
      Number.isInteger(anchor.endLine) &&
      anchor.startLine >= 1 &&
      anchor.endLine >= anchor.startLine &&
      anchor.endLine <= s.lineCount,
  );
export const normalizeCommand = (command: Command): Command =>
  command.type === "AskQuestion"
    ? { ...command, text: textValue(command.text, 16384) }
    : command.type === "SubmitReply"
      ? {
          ...command,
          body: textValue(command.body, 65536),
          limitations: textValue(command.limitations, 8192),
        }
      : command;
export const applyCommand = (
  review: Review,
  principal: Principal,
  command: Command,
  ids: { entity: string; event: string },
  now: string,
): { review: Review; result: Record<string, unknown> } => {
  if (principal.kind === "bootstrap") throw new Error("unauthorized");
  if (
    principal.kind === "agent" &&
    (principal.reviewId !== review.reviewId ||
      !review.attachment?.active ||
      review.attachment.attachmentId !== principal.attachmentId ||
      review.attachment.generation !== principal.generation ||
      review.attachment.actorId !== principal.actorId)
  )
    throw new Error("stale_attachment");
  const revision = review.revision + 1;
  if (command.type === "AskQuestion") {
    if (principal.kind !== "user") throw new Error("unauthorized");
    if (
      !validateAnchor(
        review.snapshot.snapshotId,
        review.snapshot.sources,
        command.anchor,
      )
    )
      throw new Error("invalid_anchor");
    const question: Question = {
      questionId: ids.entity,
      anchor: command.anchor,
      text: command.text,
      actorId: principal.actorId,
      revision,
      createdAt: now,
      working: false,
    };
    const attachment = review.attachment;
    const inbox = attachment?.active
      ? [
          ...review.inbox,
          {
            eventId: ids.event,
            questionId: ids.entity,
            attachmentId: attachment.attachmentId,
            generation: attachment.generation,
            cursor: revision,
            read: false,
          },
        ]
      : review.inbox;
    return {
      review: {
        ...review,
        revision,
        questions: [...review.questions, question],
        inbox,
      },
      result: {
        questionId: ids.entity,
        eventId: attachment?.active ? ids.event : null,
      },
    };
  }
  if (command.type === "SubmitReply") {
    if (principal.kind !== "agent") throw new Error("unauthorized");
    if (command.generation !== principal.generation)
      throw new Error("stale_attachment");
    if (!review.questions.some((q) => q.questionId === command.questionId))
      throw new Error("invalid_request");
    if (
      !command.evidence.every((a) =>
        validateAnchor(review.snapshot.snapshotId, review.snapshot.sources, a),
      )
    )
      throw new Error("invalid_anchor");
    const reply: Reply = {
      replyId: ids.entity,
      questionId: command.questionId,
      body: command.body,
      evidence: command.evidence,
      limitations: command.limitations,
      actorId: principal.actorId,
      attachmentId: principal.attachmentId,
      generation: principal.generation,
      revision,
    };
    return {
      review: { ...review, revision, replies: [...review.replies, reply] },
      result: { replyId: ids.entity },
    };
  }
  if (principal.kind !== "user") throw new Error("unauthorized");
  if (
    !review.attachment ||
    review.attachment.attachmentId !== command.attachmentId
  )
    throw new Error("stale_attachment");
  return {
    review: {
      ...review,
      revision,
      attachment: {
        ...review.attachment,
        active: false,
        generation: review.attachment.generation + 1,
      },
    },
    result: { attachmentId: command.attachmentId },
  };
};

export type LineStatus = "unchanged" | "removed" | "added" | "modified";
export type SourceView = Source & {
  lines: { number: number; text: string; status: LineStatus }[];
};
export const compareSources = (
  base: Source,
  head: Source,
): [SourceView, SourceView] => {
  const split = (source: Source) =>
    source.content.replace(/\n$/, "").split("\n");
  const a = split(base),
    b = split(head);
  if (a.length * b.length > 1000000) throw new Error("source_unavailable");
  const grid = Array.from(
    { length: a.length + 1 },
    () => new Uint32Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      grid[i]![j] =
        a[i] === b[j]
          ? 1 + grid[i + 1]![j + 1]!
          : Math.max(grid[i + 1]![j]!, grid[i]![j + 1]!);
  const left: LineStatus[] = Array(a.length).fill("unchanged") as LineStatus[],
    right: LineStatus[] = Array(b.length).fill("unchanged") as LineStatus[];
  let i = 0,
    j = 0;
  let removed: number[] = [],
    added: number[] = [];
  const flush = () => {
    for (const index of removed)
      left[index] = added.length ? "modified" : "removed";
    for (const index of added)
      right[index] = removed.length ? "modified" : "added";
    removed = [];
    added = [];
  };
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flush();
      i++;
      j++;
    } else if (
      i < a.length &&
      (j === b.length || grid[i + 1]![j]! >= grid[i]![j + 1]!)
    ) {
      removed.push(i++);
    } else {
      added.push(j++);
    }
  }
  flush();
  const view = (
    source: Source,
    lines: string[],
    statuses: LineStatus[],
  ): SourceView => ({
    ...source,
    lines: lines.map((text, index) => ({
      number: index + 1,
      text,
      status: statuses[index]!,
    })),
  });
  return [view(base, a, left), view(head, b, right)];
};
