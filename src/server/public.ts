import {createTestRunner} from '../test-jobs/public.ts';
import type {HeadTestRunnerOptions} from '../test-jobs/public.ts';
import {createAnalysisRunner} from "../analysis-jobs/public.ts";
import {createImportRunner} from "../import-jobs/public.ts";
import type {ImportArtifacts} from "../import-artifacts/public.ts";
import {verifyPreparedSnapshot} from "../source-preparation/public.ts";
import type {PreparedSnapshotWitness} from "../source-preparation/public.ts";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { headTestArtifactQuerySchema,headTestCommandSchema,headTestScopeSchema,headTestQuerySchema,commandSchema,importCommandSchema,storyCommandSchema,storyQuerySchema,storyContextQuerySchema,analysisCommandSchema,analysisQuerySchema,semanticSourceQuerySchema } from "../domain/public.ts";
import type { Principal } from "../domain/public.ts";
import type { Store } from "../storage/public.ts";
import { createScheduler } from "../delivery/public.ts";
import type { Notify } from "../delivery/public.ts";
import { createRegistry } from "../integration/registry.ts";
const readBody = async (req: IncomingMessage): Promise<unknown> => {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req.iterator({destroyOnReturn:false})) {
    const buffer = Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > 8*1024*1024){req.resume();throw new Error("invalid_request");}
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new Error("invalid_request");
  }
};
const send = (res: ServerResponse, status: number, value: unknown) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(value));
};
export const createGateway = (store: Store, notify: Notify, options:{importArtifacts?:ImportArtifacts;testExecution?:HeadTestRunnerOptions}={}) => {
  const importRunner=options.importArtifacts?createImportRunner(store,options.importArtifacts):null;
  const analysisRunner=createAnalysisRunner(store);
  const testRunner=options.testExecution?createTestRunner(store,options.testExecution):null;
  const scheduler = createScheduler(store, notify);
  const registry = createRegistry();
  const deliveryRoute = registry.register(
    "addressed-question-committed",
    "gateway",
    () => true,
    () => {
      void scheduler.tick();
    },
  );
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(
        req.url ?? "/",
        `http://${req.headers.host ?? "127.0.0.1"}`,
      );
      if (url.pathname === "/health") {
        send(res, 200, { ok: true, product: "pr-reviewer" });
        return;
      }
      const authorization = req.headers.authorization;
      if (authorization!==undefined&&!authorization.startsWith("Bearer "))
        throw new Error("unauthorized");
      // Network reachability is the established single-owner boundary. Explicit
      // participant credentials never fall back to that owner's authority.
      const access=authorization===undefined?store.localOwner:authorization.slice(7);
      const principal = store.authenticate(access);
      const user = () => {
        if (principal.kind !== "user") throw new Error("unauthorized");
      };
      if(req.method==='POST'&&url.pathname==='/api/tests/targets'){
        send(res,200,store.tests.targets(access,headTestScopeSchema.parse(await readBody(req))));return;
      }
      if(req.method==='POST'&&url.pathname==='/api/tests/artifact'){
        send(res,200,await store.tests.artifact(access,headTestArtifactQuerySchema.parse(await readBody(req))));return;
      }
      if(req.method==='POST'&&url.pathname==='/api/tests/jobs'){
        send(res,200,store.tests.query(access,headTestQuerySchema.parse(await readBody(req))));return;
      }
      if(req.method==='POST'&&url.pathname==='/api/story/commands'){
        const command=storyCommandSchema.parse(await readBody(req));
        send(res,200,store.story.command(access,command));return;
      }
      if(req.method==='GET'&&url.pathname==='/api/story'){
        const values=Object.fromEntries(url.searchParams);
        send(res,200,store.story.query(access,storyQuerySchema.parse({...values,...(values.minimumStoryRevision!==undefined?{minimumStoryRevision:Number(values.minimumStoryRevision)}:{}),...(values.minimumContextRevision!==undefined?{minimumContextRevision:Number(values.minimumContextRevision)}:{})})));return;
      }
      if(req.method==='GET'&&url.pathname==='/api/story/context'){
        const values=Object.fromEntries(url.searchParams);
        send(res,200,store.story.context(access,storyContextQuerySchema.parse({...values,...(values.contextRevision!==undefined?{contextRevision:Number(values.contextRevision)}:{})})));return;
      }
      if(req.method==="POST"&&url.pathname==="/api/analysis/commands"){
        const input=analysisCommandSchema.parse(await readBody(req));
        if(input.type!=="PutGraphClarification")user();
        const receipt=store.analysis.command(access,input);
        if(receipt.state==="applied"&&input.type!=="PutGraphClarification")analysisRunner.wake();
        send(res,200,receipt);return;
      }
      if(req.method==="GET"&&url.pathname==="/api/analysis"){
        const values=Object.fromEntries(url.searchParams),query=analysisQuerySchema.parse({...values,...(values.minimumGraphRevision!==undefined?{minimumGraphRevision:Number(values.minimumGraphRevision)}:{}),...(values.minimumJobRevision!==undefined?{minimumJobRevision:Number(values.minimumJobRevision)}:{})});
        send(res,200,store.analysis.query(access,query));return;
      }
      if(req.method==="POST"&&url.pathname==="/api/analysis/source"){
        send(res,200,store.analysis.source(access,semanticSourceQuerySchema.parse(await readBody(req))));return;
      }
      if(req.method==="GET"&&url.pathname==="/api/imports"){user();send(res,200,store.imports.list(access));return;}
      if(req.method==="POST"&&url.pathname==="/api/imports/commands"){
        user();if(!importRunner)throw new Error("source_unavailable");
        const receipt=store.imports.command(access,importCommandSchema.parse(await readBody(req)));
        if(receipt.state==="applied")importRunner.wake();send(res,200,receipt);return;
      }
      if (req.method === "GET" && url.pathname === "/api/reviews") {
        send(res, 200, store.list(principal));
        return;
      }
      if (req.method === "GET" && url.pathname.startsWith("/api/reviews/")) {
        const id = decodeURIComponent(
          url.pathname.slice("/api/reviews/".length),
        );
        const revision = Number(url.searchParams.get("minimumRevision") ?? 0);
        if (!Number.isSafeInteger(revision) || revision < 0)
          throw new Error("invalid_request");
        send(res, 200, store.review(principal, id, revision,url.searchParams.get("snapshotId")??undefined));
        return;
      }
      if (req.method === "GET" && url.pathname.startsWith("/api/questions/")) {
        const reviewId =
          url.searchParams.get("reviewId") ??
          (principal.kind === "agent" ? principal.reviewId : "");
        const review = store.review(principal, reviewId);
        const question = review.questions.find(
          (q) =>
            q.questionId ===
            decodeURIComponent(url.pathname.slice("/api/questions/".length)),
        );
        if (!question) throw new Error("invalid_request");
        send(res, 200, {
          question,
          snapshot: store.review(principal,reviewId,0,question.anchor.snapshotId).snapshot,
          replies: review.replies.filter(
            (r) => r.questionId === question.questionId,
          ),
        });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/inbox") {
        const cursor = Number(url.searchParams.get("cursor") ?? 0),
          limit = Number(url.searchParams.get("limit") ?? 20);
        if (
          !Number.isSafeInteger(cursor) ||
          cursor < 0 ||
          !Number.isSafeInteger(limit) ||
          limit < 1 ||
          limit > 100
        )
          throw new Error("invalid_request");
        send(res, 200, store.inbox(principal, cursor, limit));
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/self") {
        if (principal.kind === "bootstrap")
          send(res, 200, {
            kind: "bootstrap",
            identity: principal.corroborated ? "corroborated" : "pending",
          });
        else send(res, 200, principal);
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/commands") {
        const input = await readBody(req);
        if (input !== null && typeof input === 'object' && 'type' in input && (input.type === 'RequestTest' || input.type === 'CancelTest')) {
          const receipt=store.tests.command(access,headTestCommandSchema.parse(input));testRunner?.wake();send(res,200,receipt);return;
        }
        const command = commandSchema.parse(input);
        let witness:PreparedSnapshotWitness|undefined;
        if(command.type==="AddSnapshot"&&command.identityScheme==="manual_git_v1"&&principal.kind==="user")try{witness=verifyPreparedSnapshot(command.reviewId,command.snapshot,command.identityScheme);}catch{}
        const receipt = store.command(principal, command,witness);
        if (receipt.state === "applied") {
          if (command.type === "AskQuestion") deliveryRoute.emit();
          if (command.type === "RevokeAttachment")
            registry.revoke(command.attachmentId);
        }
        send(res, 200, receipt);
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/challenges") {
        user();
        const input = z
          .object({
            reviewId: z.string(),
            host: z.enum(["codex", "claude"]),
            sessionId: z.string().min(1),
            connectionId: z.string().min(1),
          })
          .strict()
          .parse(await readBody(req));
        send(
          res,
          200,
          store.challenge(
            principal,
            input.reviewId,
            input.host,
            input.sessionId,
            input.connectionId,
          ),
        );
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/connections") {
        user();
        const input = z
          .object({
            host: z.enum(["codex", "claude"]),
            sessionId: z.string().min(1),
            connectionId: z.string().min(1),
            corroborated: z.boolean(),
          })
          .strict()
          .parse(await readBody(req));
        const binding = store.registerConnection(principal, input);
        send(res, 200, { token: binding.token });
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/session-attach") {
        const input = z
          .object({ challengeId: z.string(), proof: z.string() })
          .strict()
          .parse(await readBody(req));
        send(res, 200, store.attach(principal, input.challengeId, input.proof));
        return;
      }
      send(res, 404, { error: "invalid_request" });
    } catch (error) {
      const name =
        error instanceof z.ZodError
          ? "invalid_request"
          : error instanceof Error
            ? error.message
            : "invalid_request";
      const known = [
        "test_artifact_unavailable","artifact_integrity_error","invalid_artifact_offset","qualification_required","test_job_unavailable","test_target_unavailable","test_target_conflict","repository_not_configured","execution_not_configured",
        "test_queue_full","test_history_limit","test_storage_limit","test_job_conflict","invalid_test_cursor","stale_execution_owner",
        "story_version_unavailable","story_context_unavailable","story_author_conflict","command_conflict",
        "revision_unavailable","analysis_record_unavailable","analysis_job_unavailable",
        "unauthorized",
        "stale_attachment",
        "invalid_request",
        "source_unavailable",
        "projection_pending",
        "identity_pending",
      ];
      send(
        res,
        name === "unauthorized"
          ? 401
          : name === "projection_pending"
            ? 409
            : 400,
        { error: known.includes(name) ? name : "invalid_request" },
      );
    }
  });
  return {
    server,
    listen: async (port: number) => {
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", () => {
          server.off("error", reject);
          resolve();
        });
      });
      return (server.address() as { port: number }).port;
    },
    close: async () => {
      scheduler.stop();
      const importsStopped=importRunner?.stop(),analysisStopped=analysisRunner.stop(),testsStopped=testRunner?.stop();
      await Promise.all([importsStopped,analysisStopped,testsStopped]);
      registry.dispose();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
    diagnostics: () => registry.diagnostics(),
    analysisDiagnostics:()=>analysisRunner.diagnostics(),
    testDiagnostics:()=>testRunner?.diagnostics()??[],
  };
};
