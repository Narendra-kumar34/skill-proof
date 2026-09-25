import type {
  CriterionScore,
  EvaluationFlags,
  ImprovementPoint,
} from "@/db/schema/domain";
import { clampScore, weightedOverall } from "@/domain/scoring";

import type { EvaluationOutput } from "./output-schema";

export class EvaluationOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationOutputError";
  }
}

export type NormalizeContext = {
  criteria: Array<{
    id: string;
    key: string;
    label: string;
    competencyId: string;
    weight: number;
  }>;
  /** Alias shown to the model → challenge id. */
  candidates: Array<{ alias: string; challengeId: string }>;
  /** Deterministic recommendation used when the model's pick is unusable. */
  fallback: { challengeId: string; reason: string } | null;
};

export type NormalizedEvaluation = {
  overallScore: number;
  criterionScores: CriterionScore[];
  strengths: string[];
  improvements: ImprovementPoint[];
  summary: string;
  recommendedChallengeId: string | null;
  recommendationReason: string | null;
  flags: EvaluationFlags;
};

const OFF_TOPIC_SCORE_CAP = 20;
const MAX_TEXT = 600;

const clean = (text: string, max = MAX_TEXT) =>
  text.replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Turns raw model output into a trustworthy evaluation: every rubric criterion
 * scored exactly once, scores clamped, lists bounded, recommendation resolved
 * to a real challenge, and the overall score computed here from the weights.
 */
export function normalizeEvaluation(
  output: EvaluationOutput,
  ctx: NormalizeContext,
): NormalizedEvaluation {
  const byKey = new Map<string, EvaluationOutput["criteria"][number]>();
  for (const item of output.criteria) {
    const key = item.key.trim().toLowerCase();
    if (!byKey.has(key)) byKey.set(key, item); // first wins on duplicates
  }

  const missing = ctx.criteria.filter((c) => !byKey.has(c.key.toLowerCase()));
  if (missing.length > 0) {
    throw new EvaluationOutputError(
      `Model omitted criteria: ${missing.map((c) => c.key).join(", ")}`,
    );
  }

  const offTopic = output.flags.offTopic;
  const criterionScores: CriterionScore[] = ctx.criteria.map((c) => {
    const item = byKey.get(c.key.toLowerCase())!;
    let score = Number.isFinite(item.score) ? clampScore(item.score) : 0;
    // Safety net: a non-attempt can never score well, whatever the model said.
    if (offTopic) score = Math.min(score, OFF_TOPIC_SCORE_CAP);
    return {
      criterionId: c.id,
      key: c.key,
      label: c.label,
      competencyId: c.competencyId,
      weight: c.weight,
      score,
      rationale: clean(item.rationale) || "No rationale provided.",
    };
  });

  const summary = clean(output.summary, 1000);
  if (!summary) throw new EvaluationOutputError("Model returned no summary");

  const strengths = [
    ...new Set(output.strengths.map((s) => clean(s)).filter(Boolean)),
  ].slice(0, 4);

  const improvements = output.improvements
    .map((i) => ({ issue: clean(i.issue), suggestion: clean(i.suggestion) }))
    .filter((i) => i.issue && i.suggestion)
    .slice(0, 3);

  const picked = ctx.candidates.find(
    (c) =>
      c.alias.toLowerCase() ===
      output.recommendation.candidateId?.trim().toLowerCase(),
  );
  const reason = clean(output.recommendation.reason, 300);

  return {
    overallScore: weightedOverall(criterionScores),
    criterionScores,
    strengths,
    improvements,
    summary,
    recommendedChallengeId:
      picked?.challengeId ?? ctx.fallback?.challengeId ?? null,
    recommendationReason: picked
      ? reason || null
      : (ctx.fallback?.reason ?? null),
    flags: {
      injectionSuspected: output.flags.injectionSuspected,
      offTopic,
    },
  };
}
