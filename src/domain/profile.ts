import { clampScore } from "./scoring";

/**
 * Skill profile: turns a learner's evaluations into evidence per competency.
 *
 * Policy: only the LATEST evaluated attempt on each challenge counts, so the
 * profile reflects current ability and retries visibly move it. Every score is
 * traceable to the challenges behind it.
 */

export type ProfileSkill = {
  id: string;
  competencies: Array<{ id: string; label: string }>;
  challenges: Array<{
    id: string;
    slug: string;
    title: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    competencyIds: string[];
  }>;
};

export type EvaluatedAttempt = {
  submissionId: string;
  challengeId: string;
  attemptNumber: number;
  submittedAt: Date;
  overallScore: number;
  criterionScores: Array<{
    competencyId: string;
    score: number;
    weight: number;
  }>;
};

export type CompetencyEvidence = {
  challengeId: string;
  slug: string;
  title: string;
  /** Weighted score for this competency on the latest attempt. */
  score: number;
  submissionId: string;
};

export type CompetencyProfile = {
  id: string;
  label: string;
  /** Weighted mean across evidence; null when not yet assessed. */
  score: number | null;
  evidence: CompetencyEvidence[];
  /** Challenges that assess this competency but haven't been attempted. */
  untested: Array<{ challengeId: string; slug: string; title: string }>;
};

export type SkillProfile = {
  /** Mean of the latest overall score on each attempted challenge. */
  score: number | null;
  attemptedChallenges: number;
  totalChallenges: number;
  /** 0-100: how steady performance is across challenges; null if < 2. */
  consistency: number | null;
  /** Summed gain from first to latest attempt on retried challenges. */
  retryGain: { challenges: number; points: number } | null;
  competencies: CompetencyProfile[];
  lastActivity: Date | null;
};

/** Latest evaluated attempt per challenge. */
export function latestPerChallenge(
  attempts: readonly EvaluatedAttempt[],
): Map<string, EvaluatedAttempt> {
  const latest = new Map<string, EvaluatedAttempt>();
  for (const a of attempts) {
    const current = latest.get(a.challengeId);
    if (!current || a.attemptNumber > current.attemptNumber) {
      latest.set(a.challengeId, a);
    }
  }
  return latest;
}

function weightedMean(
  items: Array<{ score: number; weight: number }>,
): number | null {
  const totalWeight = items.reduce((n, i) => n + i.weight, 0);
  if (totalWeight <= 0) return null;
  return clampScore(
    items.reduce((n, i) => n + i.score * i.weight, 0) / totalWeight,
  );
}

/** Population standard deviation mapped to 0-100 (0 spread → 100). */
export function consistencyScore(scores: readonly number[]): number | null {
  if (scores.length < 2) return null;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((n, s) => n + (s - mean) ** 2, 0) / scores.length;
  return clampScore(100 - 2 * Math.sqrt(variance));
}

export function buildSkillProfile(
  skill: ProfileSkill,
  attempts: readonly EvaluatedAttempt[],
): SkillProfile {
  const challengeIds = new Set(skill.challenges.map((c) => c.id));
  const relevant = attempts.filter((a) => challengeIds.has(a.challengeId));
  const latest = latestPerChallenge(relevant);
  const latestScores = [...latest.values()].map((a) => a.overallScore);

  const competencies: CompetencyProfile[] = skill.competencies.map((comp) => {
    const evidence: CompetencyEvidence[] = [];
    const untested: CompetencyProfile["untested"] = [];

    for (const ch of skill.challenges) {
      if (!ch.competencyIds.includes(comp.id)) continue;
      const attempt = latest.get(ch.id);
      const items = attempt?.criterionScores.filter(
        (c) => c.competencyId === comp.id,
      );
      const score = items ? weightedMean(items) : null;
      if (attempt && score !== null) {
        evidence.push({
          challengeId: ch.id,
          slug: ch.slug,
          title: ch.title,
          score,
          submissionId: attempt.submissionId,
        });
      } else {
        untested.push({ challengeId: ch.id, slug: ch.slug, title: ch.title });
      }
    }

    // Competency score weights every contributing criterion by its rubric weight.
    const allItems = [...latest.values()].flatMap((a) =>
      a.criterionScores.filter((c) => c.competencyId === comp.id),
    );
    return {
      id: comp.id,
      label: comp.label,
      score: weightedMean(allItems),
      evidence: evidence.sort((a, b) => b.score - a.score),
      untested,
    };
  });

  // Improvement on retried challenges: first attempt vs latest.
  let retried = 0;
  let gain = 0;
  for (const [challengeId, last] of latest) {
    const first = relevant
      .filter((a) => a.challengeId === challengeId)
      .reduce(
        (min, a) => (a.attemptNumber < min.attemptNumber ? a : min),
        last,
      );
    if (first !== last) {
      retried += 1;
      gain += last.overallScore - first.overallScore;
    }
  }

  const lastActivity = relevant.reduce<Date | null>(
    (max, a) => (!max || a.submittedAt > max ? a.submittedAt : max),
    null,
  );

  return {
    score:
      latestScores.length > 0
        ? clampScore(
            latestScores.reduce((a, b) => a + b, 0) / latestScores.length,
          )
        : null,
    attemptedChallenges: latest.size,
    totalChallenges: skill.challenges.length,
    consistency: consistencyScore(latestScores),
    retryGain: retried > 0 ? { challenges: retried, points: gain } : null,
    competencies,
    lastActivity,
  };
}
