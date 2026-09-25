export type QuotaInput = {
  userRunsLastHour: number;
  globalRunsToday: number;
  isAnonymous: boolean;
};

export type QuotaLimits = {
  perUserPerHour: number;
  perDemoUserPerHour: number;
  globalPerDay: number;
};

export type QuotaDecision =
  | { allowed: true }
  | { allowed: false; reason: "user" | "global"; message: string };

export function checkEvaluationQuota(
  input: QuotaInput,
  limits: QuotaLimits,
): QuotaDecision {
  if (input.globalRunsToday >= limits.globalPerDay) {
    return {
      allowed: false,
      reason: "global",
      message:
        "Evaluations are paused for today due to high demand. Your work is saved; please try again tomorrow.",
    };
  }

  const perHour = input.isAnonymous
    ? limits.perDemoUserPerHour
    : limits.perUserPerHour;
  if (input.userRunsLastHour >= perHour) {
    return {
      allowed: false,
      reason: "user",
      message: `You've reached the limit of ${perHour} evaluations per hour. Your work is saved; please try again later.`,
    };
  }

  return { allowed: true };
}
