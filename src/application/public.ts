import type { SourceView, SourceGraph } from "../domain/public.ts";
import type { Anchor, Review } from "../domain/public.ts";
export type View = {
  sources: SourceView[];
  graph: SourceGraph | null;
  initialSelection: Anchor | null;
  review: Review | null;
  error: string;
  busy: boolean;
  selecting: boolean;
  authenticated: boolean;
  recovery: import("./private-session.ts").QuestionRecovery;
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
export {createReviewBridge} from './review.ts';
export type {ReviewBridge} from './review.ts';
export {createPrivateSession,credentialScope} from './private-session.ts';
export type {PrivateSession,QuestionRecovery,QuestionDraft,StoryReturnFrame,GraphFrames,PrivateStoryView} from './private-session.ts';
export {createImportsBridge,describeImportJobs} from './imports.ts';
export type {ImportViewJob,ImportAction} from './imports.ts';
export {createAnalysisBridge,semanticProjection,semanticRelationshipProjection,semanticExcerpt,semanticSourceKey,semanticIssueProjection} from './analysis.ts';
export type {AnalysisBridge,SemanticView} from './analysis.ts';
export {createStoryBridge,storyTransition,storyProjection,storyPresentation,questionEvidenceProjection} from './story.ts';
export type {StoryBridge,StoryState,StoryIntent,StoryProjection,StoryExcerpt,StoryClock,StorySemanticPort,StoryGraphFocus,QuestionEvidenceIntent} from './story.ts';
export {createReviewWorkspace} from './workspace.ts';
export type {ReviewWorkspace} from './workspace.ts';

export {createHeadTestsBridge} from './head-tests.ts';
export type {HeadTestsBridge,HeadTestsState,TestArtifactState} from './head-tests.ts';
export {createSourceCanvas,createCanvasFrameValidator,canvasProjection} from './canvas.ts';
export type {SourceCanvas,SourceCanvasView,CanvasFrameValidationPort,CanvasFrame,CanvasReading,CanvasSide} from './canvas.ts';
