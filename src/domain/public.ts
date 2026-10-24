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
const repositoryPathSchema=z.string().min(1).max(1024).refine(path=>!path.startsWith("/")&&!path.split("/").includes("..")&&!path.includes("\0"));
const shaSchema=z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
export const sourceSchema=z.object({path:repositoryPathSchema,side:z.enum(["base","head"]),content:z.string().min(1),hash:z.string().regex(/^[a-f0-9]{64}$/),lineCount:z.number().int().positive(),objectId:shaSchema.optional()}).strict();
export type Source=z.infer<typeof sourceSchema>;
export const sourceDispositionSchema=z.object({side:z.enum(["base","head"]),path:repositoryPathSchema,state:z.enum(["prepared","unprepared","unsupported","missing"]),reason:z.string(),objectId:z.string().optional()}).strict();
export type SourceDisposition=z.infer<typeof sourceDispositionSchema>;
export const changedFileSchema=z.object({status:z.enum(["modified","added","deleted","renamed","copied","type_changed"]),oldPath:repositoryPathSchema.nullable(),newPath:repositoryPathSchema.nullable(),dispositions:z.array(sourceDispositionSchema),oldMode:z.string().optional(),newMode:z.string().optional(),hunks:z.array(z.object({id:z.string().min(1),oldStart:z.number().int().nonnegative(),oldLines:z.number().int().nonnegative(),newStart:z.number().int().nonnegative(),newLines:z.number().int().nonnegative()}).strict()).optional(),coverage:z.enum(["text","unsupported"]).optional()}).strict();
export type ChangedFile=z.infer<typeof changedFileSchema>;
export const documentReferenceSchema=z.object({destination:z.string(),source:anchorSchema,target:anchorSchema.nullable(),method:z.literal("inline_markdown_link"),reason:z.string().nullable()}).strict();
export type DocumentReference=z.infer<typeof documentReferenceSchema>;
export const providerCandidateSchema=z.object({provider:z.enum(["github","gitlab"]),host:z.string().min(1),sourceProject:z.string().min(1),targetProject:z.string().min(1),number:z.number().int().positive(),url:z.url(),title:z.string(),state:z.string(),sourceBranch:z.string(),targetBranch:z.string(),baseSha:shaSchema,headSha:shaSchema,targetTipSha:shaSchema,baselineMethod:z.enum(["github_compare_merge_base","gitlab_diff_refs"])}).strict();
export type ProviderCandidate=z.infer<typeof providerCandidateSchema>;
export const snapshotSchema=z.object({title:z.string().optional(),snapshotId:z.string().min(1),repository:z.string().min(1),prUrl:z.url(),prNumber:z.number().int().positive(),baseSha:shaSchema,headSha:shaSchema,sources:z.array(sourceSchema).min(1).max(512),changedFiles:z.array(changedFileSchema).optional(),documentReferences:z.array(documentReferenceSchema).optional(),candidate:providerCandidateSchema.optional(),counts:z.object({changedPaths:z.number().int().nonnegative(),preparedSides:z.number().int().nonnegative(),unsupportedSides:z.number().int().nonnegative(),missingSides:z.number().int().nonnegative(),hunks:z.number().int().nonnegative(),bytes:z.number().int().nonnegative()}).strict().optional()}).strict();
export type Snapshot=z.infer<typeof snapshotSchema>;
export type SnapshotSummary=Pick<Snapshot,"snapshotId"|"baseSha"|"headSha"|"title">;
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
  parentQuestionId?: string;
  anchor: Anchor;
  text: string;
  actorId: string;
  revision: number;
  createdAt: string;
  working: boolean;
};
export type Reply = {
  snapshotId?: string;
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
  currentSnapshotId?: string;
  snapshots?: Snapshot[];
  snapshotSummaries?: SnapshotSummary[];
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
  z.object({type:z.literal("AddSnapshot"),commandId:z.string().min(1).max(128),reviewId:z.string(),expectedCurrentSnapshotId:z.string().min(1),identityScheme:z.literal("manual_git_v1"),snapshot:snapshotSchema}).strict(),
  z
    .object({
      type: z.literal("AskQuestion"),
      commandId: z.string().min(1).max(128),
      reviewId: z.string(),
      anchor: anchorSchema,
      text: z.string(),
      parentQuestionId: z.string().min(1).optional(),
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
  if(command.reviewId!==review.reviewId)throw new Error("unauthorized");
  if(command.type==="AddSnapshot"){
    if(principal.kind!=="user")throw new Error("unauthorized");
    const snapshots=review.snapshots??[review.snapshot];
    if(snapshotReviewIdentity(review.snapshot)!==snapshotReviewIdentity(command.snapshot))throw new Error("review_identity_conflict");
    const existing=snapshots.find(snapshot=>snapshot.snapshotId===command.snapshot.snapshotId);
    if(existing){if(canonical(existing)!==canonical(command.snapshot))throw new Error("snapshot_conflict");return {review,result:{snapshotId:existing.snapshotId,currentSnapshotId:review.currentSnapshotId??review.snapshot.snapshotId,alreadyRetained:true}};}
    if((review.currentSnapshotId??review.snapshot.snapshotId)!==command.expectedCurrentSnapshotId)throw new Error("current_snapshot_conflict");
    return {review:{...review,snapshot:command.snapshot,snapshots:[...snapshots,command.snapshot],currentSnapshotId:command.snapshot.snapshotId,revision:review.revision+1},result:{snapshotId:command.snapshot.snapshotId,currentSnapshotId:command.snapshot.snapshotId}};
  }
  const revision = review.revision + 1;
  if (command.type === "AskQuestion") {
    if (principal.kind !== "user") throw new Error("unauthorized");
    if (
      !snapshotFor(review,command.anchor.snapshotId) || !validateAnchor(command.anchor.snapshotId,snapshotFor(review,command.anchor.snapshotId)!.sources,command.anchor)
    )
      throw new Error("invalid_anchor");
    if(command.parentQuestionId&&!review.questions.some(question=>question.questionId===command.parentQuestionId))throw new Error("invalid_parent_question");
    const question: Question = {
      questionId: ids.entity,
      ...(command.parentQuestionId?{parentQuestionId:command.parentQuestionId}:{}),
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
    const question=review.questions.find(q=>q.questionId===command.questionId);
    if(!question)throw new Error("invalid_request");
    const sourceSnapshot=snapshotFor(review,question.anchor.snapshotId);
    if(!sourceSnapshot)throw new Error("source_unavailable");
    if (
      !command.evidence.every((a) =>
        validateAnchor(sourceSnapshot.snapshotId, sourceSnapshot.sources, a),
      )
    )
      throw new Error("invalid_anchor");
    const reply: Reply = {
      snapshotId:sourceSnapshot.snapshotId,
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

export type LineStatus = "unchanged" | "removed" | "added" | "modified" | "not_analyzed";
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

export { projectGraph, sourceViews } from "./graph.ts";
export type { SourceGraph, GraphNode, GraphEdge } from "./graph.ts";

export { inlineDocumentLinks, resolveDocumentDestination, documentHeadingLine } from "./markdown.ts";

export const snapshotFor=(review:Review,snapshotId:string):Snapshot|undefined=>(review.snapshots??[review.snapshot]).find(snapshot=>snapshot.snapshotId===snapshotId);
export const snapshotReviewIdentity=(snapshot:Snapshot):string=>canonical(snapshot.candidate?{provider:snapshot.candidate.provider,host:snapshot.candidate.host,targetProject:snapshot.candidate.targetProject,number:snapshot.candidate.number,url:snapshot.candidate.url}:{provider:"github",host:new URL(snapshot.prUrl).host,targetProject:snapshot.repository,number:snapshot.prNumber,url:snapshot.prUrl});
