export type SubmissionStatus =
  "draft" | "submitted" | "evaluating" | "evaluated" | "failed";

type SubmissionState = {
  status: SubmissionStatus;
  submittedAt: Date | null;
  evaluationStartedAt: Date | null;
};

/**
 * A run that has been in flight longer than `staleAfterMs` is presumed dead.
 * `evaluationStartedAt` is set when a run starts and when a retry is queued,
 * so a freshly retried submission is not immediately considered stale.
 */
export function isStale(
  state: SubmissionState,
  now: Date,
  staleAfterMs: number,
): boolean {
  const since =
    state.status === "evaluating"
      ? state.evaluationStartedAt
      : state.status === "submitted"
        ? (state.evaluationStartedAt ?? state.submittedAt)
        : null;
  return since !== null && now.getTime() - since.getTime() > staleAfterMs;
}

/**
 * Whether the learner may (re)trigger evaluation. Failed runs are always
 * retryable; in-flight states only once they are stale. Evaluated submissions
 * are final: improving means a new attempt, which keeps the evidence honest.
 */
export function canRetryEvaluation(
  state: SubmissionState,
  now: Date,
  staleAfterMs: number,
): boolean {
  if (state.status === "failed") return true;
  if (state.status === "submitted" || state.status === "evaluating") {
    return isStale(state, now, staleAfterMs);
  }
  return false;
}

/** Only drafts can be edited or deleted; submitted work is immutable evidence. */
export const isEditable = (status: SubmissionStatus) => status === "draft";
