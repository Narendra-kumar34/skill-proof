/** Tunables for the AI evaluation pipeline, in one place. */
export const evaluationConfig = {
  /** Bump when the prompt changes materially; stored on every evaluation. */
  promptVersion: "eval-v1",

  submission: {
    minLength: 80,
    maxLength: 12_000,
  },

  /** Hard ceiling on a single model call. */
  aiTimeoutMs: 45_000,
  /** SDK-level retries for transient provider errors (429/5xx). */
  aiMaxRetries: 2,

  /**
   * A run still "evaluating" after this long is considered dead (the function
   * was killed or crashed) and may be retried. Must exceed the route's
   * maxDuration so a live run is never mistaken for a stuck one.
   */
  staleAfterMs: 2 * 60 * 1000,

  rateLimits: {
    /** Evaluation runs per user per rolling hour. */
    perUserPerHour: 10,
    /** Tighter limit for throwaway demo accounts. */
    perDemoUserPerHour: 5,
    /** Protects the shared (free-tier) API key from runaway usage. */
    globalPerDay: 400,
  },

  /** Max recommendation candidates offered to the model. */
  maxRecommendationCandidates: 4,
} as const;
