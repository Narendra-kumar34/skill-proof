type Difficulty = "beginner" | "intermediate" | "advanced";

const LEVEL: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export type CandidateChallenge = {
  id: string;
  title: string;
  difficulty: Difficulty;
  competencyIds: string[];
};

export type RankInput = {
  current: { id: string; difficulty: Difficulty; overallScore: number };
  /** Criterion scores from the evaluation just produced. */
  criterionScores: Array<{ competencyId: string; score: number }>;
  /** Published challenges in the same skill (including the current one). */
  challenges: CandidateChallenge[];
  /** Learner's best overall score per challenge id, from past evaluations. */
  bestScores: ReadonlyMap<string, number>;
};

export type RankedCandidate = CandidateChallenge & { reason: string };

const WEAK_THRESHOLD = 70;
const MASTERED_THRESHOLD = 80;

/**
 * Deterministically ranks next-step challenges. The model picks from the top
 * of this list (and the first entry is the fallback), so a recommendation is
 * always a real, sensible challenge even if the model misbehaves.
 */
export function rankNextChallenges(
  input: RankInput,
  limit: number,
): RankedCandidate[] {
  const { current, criterionScores, challenges, bestScores } = input;

  // Weak competencies from this attempt, weakest first.
  const weak = [...criterionScores]
    .filter((c) => c.score < WEAK_THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .map((c) => c.competencyId)
    .filter((id, i, all) => all.indexOf(id) === i);
  const weakest = weak[0];

  // Step up after a strong attempt, step down after a weak one.
  const targetLevel =
    LEVEL[current.difficulty] +
    (current.overallScore >= 75 ? 1 : current.overallScore < 50 ? -1 : 0);

  const scored = challenges
    .filter((c) => {
      if (c.id === current.id) return current.overallScore < WEAK_THRESHOLD;
      return (bestScores.get(c.id) ?? 0) < MASTERED_THRESHOLD;
    })
    .map((c) => {
      const hitsWeakest = weakest ? c.competencyIds.includes(weakest) : false;
      const otherWeak = c.competencyIds.filter(
        (id) => id !== weakest && weak.includes(id),
      ).length;
      const unattempted = !bestScores.has(c.id) && c.id !== current.id;
      const levelGap = Math.abs(LEVEL[c.difficulty] - targetLevel);

      const points =
        (hitsWeakest ? 3 : 0) +
        otherWeak +
        (unattempted ? 2 : 0) +
        (levelGap === 0 ? 2 : levelGap === 1 ? 1 : 0) -
        (c.id === current.id ? 1 : 0);

      const reason =
        c.id === current.id
          ? "Retry this challenge to apply the feedback while it is fresh."
          : hitsWeakest
            ? "Targets the area where you lost the most points."
            : unattempted
              ? "A new scenario that builds on this skill."
              : "Revisit this challenge to push your score higher.";

      return { challenge: c, points, reason };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        LEVEL[a.challenge.difficulty] - LEVEL[b.challenge.difficulty] ||
        a.challenge.title.localeCompare(b.challenge.title),
    );

  return scored
    .slice(0, limit)
    .map(({ challenge, reason }) => ({ ...challenge, reason }));
}
