import { compareSources } from "../domain/public.ts";
import type { SourceView } from "../domain/public.ts";
import type { Anchor, Receipt, Review } from "../domain/public.ts";
import { createRegistry } from "../integration/registry.ts";
export type View = {
  sources: SourceView[];
  initialSelection: Anchor | null;
  review: Review | null;
  error: string;
  busy: boolean;
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
export const createReviewBridge = (reviewId: string) => {
  let token = "";
  let state: View = {
    sources: [],
    initialSelection: null,
    review: null,
    error: "",
    busy: false,
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
        `/api/reviews/${encodeURIComponent(reviewId)}?minimumRevision=${minimumRevision}`,
        undefined,
        controller.signal,
      )) as Review;
      if (expected === generation && !controller.signal.aborted)
        publish({
          ...state,
          review,
          sources: compareSources(
            review.snapshot.sources.find((s) => s.side === "base")!,
            review.snapshot.sources.find((s) => s.side === "head")!,
          ),
          error: "",
          initialSelection: {
            snapshotId: review.snapshot.snapshotId,
            side: "head",
            path: review.snapshot.sources.find((s) => s.side === "head")!.path,
            startLine: 1,
            endLine: 1,
          },
          authenticated: true,
        });
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
      () => Boolean(token) && !state.busy,
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
      inflight?.abort();
    };
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    connect,
    login: async (value: string) => {
      token = value.trim();
      generation++;
      await refresh();
    },
    ask: async (anchor: Anchor, text: string): Promise<Receipt> => {
      if (state.busy) throw new Error("submission_in_progress");
      const fingerprint = JSON.stringify({ anchor, text });
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
