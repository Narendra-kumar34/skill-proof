import type { ProfileSkill, SkillProfile } from "./profile";

/** A competency below this average, across enough challenges, is a gap. */
export const GAP_THRESHOLD = 60;
export const GAP_MIN_EVIDENCE = 2;
const STRENGTH_THRESHOLD = 70;
const MASTERED = 80;

export type SkillGap = {
  competencyId: string;
  label: string;
  score: number;
  evidenceCount: number;
  /** Plain-language explanation built from the evidence. */
  message: string;
  recommendation: {
    challengeId: string;
    slug: string;
    title: string;
    reason: string;
  } | null;
};

const LEVEL = { beginner: 0, intermediate: 1, advanced: 2 } as const;

/**
 * Detects consistent weak spots deterministically (not by AI), so every gap
 * is explainable: "averaging N across these challenges".
 */
export function detectGaps(
  skill: ProfileSkill,
  profile: SkillProfile,
  latestScoreByChallenge: ReadonlyMap<string, number>,
): SkillGap[] {
  // A strength claim needs the same evidence bar as a gap claim, so
  // well-evidenced competencies win over a single high score.
  const wellEvidenced = (c: { evidence: unknown[] }) =>
    c.evidence.length >= GAP_MIN_EVIDENCE ? 1 : 0;
  const strongest = profile.competencies
    .filter((c) => c.score !== null && c.score >= STRENGTH_THRESHOLD)
    .sort(
      (a, b) =>
        wellEvidenced(b) - wellEvidenced(a) || (b.score ?? 0) - (a.score ?? 0),
    )[0];

  return profile.competencies
    .filter(
      (c) =>
        c.score !== null &&
        c.score < GAP_THRESHOLD &&
        c.evidence.length >= GAP_MIN_EVIDENCE,
    )
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .map((c) => {
      const score = c.score ?? 0;
      const contrast = strongest
        ? `You perform well on ${strongest.label.toLowerCase()}, but consistently lose points on ${c.label.toLowerCase()}`
        : `You consistently lose points on ${c.label.toLowerCase()}`;
      const message = `${contrast}: it averages ${score} across ${c.evidence.length} challenges.`;

      // Prefer an unattempted challenge that assesses this competency, then
      // the weakest non-mastered one; easier first.
      const options = skill.challenges
        .filter((ch) => ch.competencyIds.includes(c.id))
        .filter((ch) => (latestScoreByChallenge.get(ch.id) ?? 0) < MASTERED)
        .sort((a, b) => {
          const aTried = latestScoreByChallenge.has(a.id) ? 1 : 0;
          const bTried = latestScoreByChallenge.has(b.id) ? 1 : 0;
          return (
            aTried - bTried ||
            (latestScoreByChallenge.get(a.id) ?? 0) -
              (latestScoreByChallenge.get(b.id) ?? 0) ||
            LEVEL[a.difficulty] - LEVEL[b.difficulty]
          );
        });
      const pick = options[0];

      return {
        competencyId: c.id,
        label: c.label,
        score,
        evidenceCount: c.evidence.length,
        message,
        recommendation: pick
          ? {
              challengeId: pick.id,
              slug: pick.slug,
              title: pick.title,
              reason: latestScoreByChallenge.has(pick.id)
                ? `Retry it and focus on ${c.label.toLowerCase()}.`
                : `A new scenario that puts ${c.label.toLowerCase()} front and centre.`,
            }
          : null,
      };
    });
}
