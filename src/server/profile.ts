import "server-only";

import { detectGaps, type SkillGap } from "@/domain/gaps";
import {
  buildSkillProfile,
  type EvaluatedAttempt,
  latestPerChallenge,
  type SkillProfile,
} from "@/domain/profile";
import {
  type ActivityItem,
  getMyActivityOverview,
} from "@/server/queries/activity";
import { type CatalogSkill, getProfileCatalog } from "@/server/queries/catalog";

export type SkillSummary = {
  skill: CatalogSkill;
  profile: SkillProfile;
  gaps: SkillGap[];
  latestScores: Map<string, number>;
};

export function toEvaluatedAttempts(
  activity: readonly ActivityItem[],
): EvaluatedAttempt[] {
  return activity.flatMap((a) =>
    a.status === "evaluated" && a.evaluation && a.attemptNumber && a.submittedAt
      ? [
          {
            submissionId: a.id,
            challengeId: a.challengeId,
            attemptNumber: a.attemptNumber,
            submittedAt: a.submittedAt,
            overallScore: a.evaluation.overallScore,
            criterionScores: a.evaluation.criterionScores,
          },
        ]
      : [],
  );
}

export function summarizeSkills(
  catalog: readonly CatalogSkill[],
  activity: readonly ActivityItem[],
): SkillSummary[] {
  const attempts = toEvaluatedAttempts(activity);
  const latest = latestPerChallenge(attempts);
  const latestScores = new Map(
    [...latest].map(([id, a]) => [id, a.overallScore]),
  );

  return catalog.map((skill) => {
    const profile = buildSkillProfile(skill, attempts);
    return {
      skill,
      profile,
      gaps: detectGaps(skill, profile, latestScores),
      latestScores,
    };
  });
}

/** Everything the dashboard and skill pages need for the signed-in learner. */
export async function getMySkillSummaries() {
  const [catalog, activity] = await Promise.all([
    getProfileCatalog(),
    getMyActivityOverview(),
  ]);
  return { catalog, activity, summaries: summarizeSkills(catalog, activity) };
}
