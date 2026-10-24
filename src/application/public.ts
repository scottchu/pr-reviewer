import { sourceViews, projectGraph } from "../domain/public.ts";
import type { SourceView, SourceGraph } from "../domain/public.ts";
import type { Anchor, Receipt, Review } from "../domain/public.ts";
import { createRegistry } from "../integration/registry.ts";
export type View = {
  sources: SourceView[];
  graph: SourceGraph | null;
  initialSelection: Anchor | null;
  review: Review | null;
  error: string;
  busy: boolean;
  selecting: boolean;
  authenticated: boolean;
};
export const questionStatus = (review: Review, questionId: string) => {
  if (review.replies.some((r) => r.questionId === questionId))
    return "Answered";
  const q = review.questions.find((q) => q.questionId === questionId);
  const item = review.inbox.find((i) => i.questionId === questionId);
  const attempt = review.attempts.find(
    (a) => item && a.eventIds.includes(item.eventId),
  );
  if (q?.working) return "Working";
  if (attempt?.state === "unknown") return "Delivery unknown";
  if (attempt?.state === "notified") return "Notified";
  if (attempt?.state === "failed") return "Delivery requires attention";
  if (item) return "Delivery pending";
  return "Saved · attach a session to enable delivery";
};
export const createReviewBridge = (reviewId: string, initialSnapshotId?:string) => {
  let token = "";
  let selectedSnapshotId:string|null=initialSnapshotId??null;
  let state: View = {
    sources: [],
    graph: null,
    initialSelection: null,
    review: null,
    error: "",
    busy: false,
    selecting: false,
    authenticated: false,
  };
  const listeners = new Set<() => void>();
  const registry = createRegistry();
  let pending: { commandId: string; fingerprint: string } | null = null;
  let generation = 0;
  let inflight: AbortController | null = null;
  const publish = (next: View) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const interruptSelection=()=>{
    if(state.selecting){
      selectedSnapshotId=state.review?.snapshot.snapshotId??selectedSnapshotId;
      publish({...state,selecting:false});
    }
  };
  const request = async (
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ) => {
    const response = await fetch(path, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });
    const value = (await response.json()) as unknown;
    if (!response.ok)
      throw Object.assign(
        new Error(
          String((value as { error?: string }).error ?? "request_failed"),
        ),
        { definitive: [400, 401, 403].includes(response.status) },
      );
    return value;
  };
  const refresh = async (minimumRevision = 0) => {
    const expected = generation;
    if (inflight) inflight.abort();
    const controller = new AbortController();
    inflight = controller;
    try {
      const review = (await request(
        `/api/reviews/${encodeURIComponent(reviewId)}?minimumRevision=${minimumRevision}${selectedSnapshotId?`&snapshotId=${encodeURIComponent(selectedSnapshotId)}`:""}`,
        undefined,
        controller.signal,
      )) as Review;
      if (expected === generation && !controller.signal.aborted){
        selectedSnapshotId??=review.snapshot.snapshotId;
        publish({
          ...state,
          review,
          sources: state.review?.snapshot.snapshotId===review.snapshot.snapshotId?state.sources:sourceViews(review.snapshot),
          graph: state.review?.snapshot.snapshotId===review.snapshot.snapshotId?state.graph:projectGraph(review.snapshot),
          error: "",
          initialSelection: (() => {
            const source=review.snapshot.sources.find(s=>s.side==="head"&&s.lineCount>0)??review.snapshot.sources.find(s=>s.lineCount>0);
            return source?{snapshotId:review.snapshot.snapshotId,side:source.side,path:source.path,startLine:1,endLine:1}:null;
          })(),
          authenticated: true,
        });
      }
      if (expected === generation && !controller.signal.aborted) return review;
    } catch (error) {
      if (expected === generation && !controller.signal.aborted)
        publish({
          ...state,
          error: error instanceof Error ? error.message : "request_failed",
        });
    } finally {
      if (inflight === controller) inflight = null;
    }
  };
  const connect = () => {
    const route = registry.register(
      "review-committed-to-view",
      reviewId,
      () => Boolean(token) && !state.busy && !state.selecting,
      () => {
        void refresh();
      },
    );
    const timer = setInterval(() => route.emit(), 700);
    route.emit();
    return () => {
      clearInterval(timer);
      route.dispose();
      generation++;
      interruptSelection();
      inflight?.abort();
    };
  };
  return {
    canLeaveReview:()=>!state.busy&&!state.selecting&&!pending,
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    connect,
    login: async (value: string) => {
      token = value.trim();
      generation++;
      interruptSelection();
      await refresh();
    },
    selectSnapshot:async(snapshotId:string)=>{
      if(state.busy||pending)throw new Error("submission_pending: reconcile the question before changing snapshots");
      const previous=state.review?.snapshot.snapshotId??selectedSnapshotId;
      selectedSnapshotId=snapshotId;
      const expected=++generation;
      publish({...state,selecting:true});
      try{
        const review=await refresh();
        if(expected!==generation)throw new Error("selection_superseded");
        if(!review){selectedSnapshotId=previous;throw new Error(state.error||"source_unavailable");}
        return review;
      }finally{
        if(expected===generation)publish({...state,selecting:false});
      }
    },
    ask: async (anchor: Anchor, text: string, parentQuestionId?:string): Promise<Receipt> => {
      if(state.selecting)throw new Error("selection_in_progress");
      if (state.busy) throw new Error("submission_in_progress");
      const fingerprint = JSON.stringify({ anchor, text,...(parentQuestionId?{parentQuestionId}:{}) });
      if (pending && pending.fingerprint !== fingerprint)
        throw new Error(
          "submission_unknown: retry the unchanged question to reconcile",
        );
      pending ??= { commandId: crypto.randomUUID(), fingerprint };
      publish({ ...state, busy: true, error: "" });
      try {
        const receipt = (await request("/api/commands", {
          type: "AskQuestion",
          commandId: pending.commandId,
          reviewId,
          anchor,
          text,
          ...(parentQuestionId?{parentQuestionId}:{}),
        })) as Receipt;
        if (receipt.state === "rejected") {
          pending = null;
          throw new Error(receipt.error ?? "rejected");
        }
        const readback = await refresh(receipt.revision);
        if (!readback || readback.revision < receipt.revision)
          throw new Error(
            "readback_pending: retry unchanged question to confirm accepted revision",
          );
        pending = null;
        return receipt;
      } catch (error) {
        if (
          error instanceof Error &&
          "definitive" in error &&
          error.definitive === true
        )
          pending = null;
        publish({
          ...state,
          error: error instanceof Error ? error.message : "request_failed",
        });
        throw error;
      } finally {
        publish({ ...state, busy: false });
      }
    },
    revoke: async () => {
      const attachment = state.review?.attachment;
      if (!attachment) return;
      const receipt = (await request("/api/commands", {
        type: "RevokeAttachment",
        commandId: crypto.randomUUID(),
        reviewId,
        attachmentId: attachment.attachmentId,
      })) as Receipt;
      await refresh(receipt.revision);
    },
    diagnostics: () => registry.diagnostics(),
  };
};
export {createImportsBridge,describeImportJobs} from './imports.ts';
export type {ImportViewJob,ImportAction} from './imports.ts';
export {createAnalysisBridge,semanticProjection,semanticExcerpt,semanticSourceKey} from './analysis.ts';
export type {AnalysisBridge,SemanticView} from './analysis.ts';
