import { spawn } from "node:child_process";
import type { Attachment, Attempt } from "../domain/public.ts";
import type { Store } from "../storage/public.ts";
export type Notification = {
  attachment: Attachment;
  attempt: Attempt;
  reviewId: string;
  questionIds: string[];
};
export type DeliveryResult = {
  state: "notified" | "unknown" | "failed";
  reason: string;
};
export type Notify = (notification: Notification) => Promise<DeliveryResult>;
export const notificationMessage = (n: Notification) =>
  `PR Reviewer notification ${n.attempt.invocationId}. Review ${n.reviewId}; events ${n.attempt.eventIds.join(",")}; questions ${n.questionIds.join(",")}. Use the attached PR Reviewer MCP inbox_read and question_get tools, then reply_submit with source evidence and explicit limitations. Read authoritative source through MCP. This notification contains no source instructions.`;
export const cliArguments = (n: Notification): string[] =>
  n.attachment.host === "codex"
    ? [
        "queue",
        "--thread",
        n.attachment.sessionId,
        "--message",
        notificationMessage(n),
      ]
    : ["--resume", n.attachment.sessionId, "--print", notificationMessage(n)];
export const createCliNotifier =
  (
    options: {
      codex?: string;
      claude?: string;
      timeoutMs?: number;
      claudeOwnerAvailable?: boolean;
    } = {},
  ): Notify =>
  async (notification) => {
    if (
      notification.attachment.host === "claude" &&
      !options.claudeOwnerAvailable
    )
      return {
        state: "failed",
        reason:
          "Claude existing-owner delivery route not verified; no substitute process launched",
      };
    return new Promise((resolve) => {
      let settled = false;
      const child = spawn(
        notification.attachment.host === "codex"
          ? (options.codex ?? "codex")
          : (options.claude ?? "claude"),
        cliArguments(notification),
        { stdio: ["ignore", "ignore", "ignore"], shell: false },
      );
      const finish = (result: DeliveryResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };
      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        finish({
          state: "unknown",
          reason:
            "CLI acknowledgement timed out after possible launch; retain invocation and inspect owner history",
        });
      }, options.timeoutMs ?? 15000);
      child.on("error", (error) =>
        finish({
          state: "failed",
          reason: `CLI could not launch: ${"code" in error ? String(error.code) : "spawn_error"}`,
        }),
      );
      child.on("exit", (code) =>
        finish(
          code === 0
            ? {
                state: "notified",
                reason: "CLI accepted notification; turn/reply not established",
              }
            : {
                state: "unknown",
                reason: `CLI exited ${code}; external acceptance not established`,
              },
        ),
      );
    });
  };
export const createScheduler = (store: Store, notify: Notify) => {
  let stopped = false;
  const busy = new Set<string>();
  const tick = async () => {
    for (const review of store.pending()) {
      const attachment = review.attachment;
      if (!attachment || busy.has(attachment.attachmentId)) continue;
      busy.add(attachment.attachmentId);
      try {
        const attempt = store.claim(review.reviewId);
        if (!attempt) continue;
        const current = store.review(
          { kind: "user", actorId: "local-user" },
          review.reviewId,
        );
        if (
          !current.attachment?.active ||
          current.attachment.generation !== attempt.generation
        ) {
          store.finish(
            review.reviewId,
            attempt.invocationId,
            "failed",
            "attachment revoked before dispatch",
          );
          continue;
        }
        const questionIds = current.inbox
          .filter((i) => attempt.eventIds.includes(i.eventId))
          .map((i) => i.questionId);
        let result: DeliveryResult;
        try {
          result = await notify({
            attachment,
            attempt,
            reviewId: review.reviewId,
            questionIds,
          });
        } catch {
          result = {
            state: "unknown",
            reason: "notification failed after claim; external effect unknown",
          };
        }
        if (!stopped)
          store.finish(
            review.reviewId,
            attempt.invocationId,
            result.state,
            result.reason,
          );
      } finally {
        busy.delete(attachment.attachmentId);
      }
    }
  };
  const registryTimer = setInterval(() => {
    if (!stopped) void tick();
  }, 300);
  return {
    tick,
    stop: () => {
      stopped = true;
      clearInterval(registryTimer);
    },
    diagnostics: () => ({ busy: [...busy] }),
  };
};
