export type WeightedScore = { score: number; weight: number };

export const clampScore = (score: number): number =>
  Math.min(100, Math.max(0, Math.round(score)));

/**
 * Weighted mean of criterion scores, rounded to an integer 0-100.
 * The overall score is always computed here, never taken from the AI,
 * so it is consistent with the criterion scores shown to the learner.
 */
export function weightedOverall(scores: readonly WeightedScore[]): number {
  if (scores.length === 0) {
    throw new Error("Cannot compute an overall score without criteria");
  }

  let total = 0;
  let totalWeight = 0;
  for (const { score, weight } of scores) {
    if (!(weight > 0)) throw new Error(`Invalid criterion weight: ${weight}`);
    total += clampScore(score) * weight;
    totalWeight += weight;
  }

  return clampScore(total / totalWeight);
}
