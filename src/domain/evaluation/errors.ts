import { APICallError, NoObjectGeneratedError, RetryError } from "ai";

import { EvaluationOutputError } from "./normalize";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("GOOGLE_GENERATIVE_AI_API_KEY is not set");
    this.name = "AiNotConfiguredError";
  }
}

export type EvaluationErrorCode =
  | "not_configured"
  | "provider_auth"
  | "rate_limited"
  | "provider_error"
  | "timeout"
  | "invalid_output"
  | "unknown";

export type ClassifiedError = {
  code: EvaluationErrorCode;
  /** Safe to show the learner; never includes provider details. */
  userMessage: string;
  /** Worth one more immediate attempt within the same run. */
  retryInRun: boolean;
};

const SAVED = "Your submission is saved.";

/** Maps any failure from the evaluation run to a code and a user-safe message. */
export function classifyEvaluationError(error: unknown): ClassifiedError {
  const cause = RetryError.isInstance(error) ? error.lastError : error;

  if (cause instanceof AiNotConfiguredError) {
    return {
      code: "not_configured",
      userMessage: `AI evaluation is temporarily unavailable. ${SAVED} Please try again later.`,
      retryInRun: false,
    };
  }

  if (
    cause instanceof EvaluationOutputError ||
    NoObjectGeneratedError.isInstance(cause)
  ) {
    return {
      code: "invalid_output",
      userMessage: `The evaluator returned an incomplete result. ${SAVED} Please retry.`,
      retryInRun: true,
    };
  }

  if (APICallError.isInstance(cause)) {
    const status = cause.statusCode ?? 0;
    if (status === 429) {
      return {
        code: "rate_limited",
        userMessage: `The AI service is busy right now. ${SAVED} Please retry in a minute.`,
        retryInRun: false,
      };
    }
    if (status === 401 || status === 403) {
      return {
        code: "provider_auth",
        userMessage: `AI evaluation is temporarily unavailable. ${SAVED} Please try again later.`,
        retryInRun: false,
      };
    }
    return {
      code: "provider_error",
      userMessage: `The AI service had a problem. ${SAVED} Please retry.`,
      retryInRun: false,
    };
  }

  if (
    cause instanceof Error &&
    (cause.name === "AbortError" || cause.name === "TimeoutError")
  ) {
    return {
      code: "timeout",
      userMessage: `The evaluation took too long. ${SAVED} Please retry.`,
      retryInRun: false,
    };
  }

  return {
    code: "unknown",
    userMessage: `Something went wrong while evaluating. ${SAVED} Please retry.`,
    retryInRun: false,
  };
}
