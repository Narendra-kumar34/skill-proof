import "server-only";

import { count, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  challenges,
  evaluations,
  type RubricSnapshot,
  submissions,
} from "@/db/schema";
import { demoAttempts } from "@/db/seed/content";
import { weightedOverall } from "@/domain/scoring";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Gives a fresh demo account a realistic, pre-evaluated history so the
 * dashboard, profile and gap analysis are meaningful on first load.
 * Idempotent: does nothing if the user already has submissions.
 */
export async function createDemoHistory(userId: string): Promise<void> {
  const [existing] = await db
    .select({ n: count() })
    .from(submissions)
    .where(eq(submissions.userId, userId));
  if ((existing?.n ?? 0) > 0) return;

  const slugs = [
    ...new Set(
      demoAttempts.flatMap((a) =>
        a.recommendedChallengeSlug
          ? [a.challengeSlug, a.recommendedChallengeSlug]
          : [a.challengeSlug],
      ),
    ),
  ];
  const rows = await db.query.challenges.findMany({
    where: inArray(challenges.slug, slugs),
    with: { criteria: true },
  });
  const bySlug = new Map(rows.map((c) => [c.slug, c]));

  // Oldest first so attempt numbers increase with time.
  const ordered = [...demoAttempts].sort((a, b) => b.daysAgo - a.daysAgo);
  const attemptCounts = new Map<string, number>();
  const now = Date.now();

  await db.transaction(async (tx) => {
    for (const attempt of ordered) {
      const challenge = bySlug.get(attempt.challengeSlug);
      if (!challenge) {
        throw new Error(
          `Demo challenge "${attempt.challengeSlug}" is not seeded`,
        );
      }

      const attemptNumber = (attemptCounts.get(challenge.id) ?? 0) + 1;
      attemptCounts.set(challenge.id, attemptNumber);
      const submittedAt = new Date(now - attempt.daysAgo * DAY_MS);

      const criterionScores = challenge.criteria.map((criterion) => {
        const result = attempt.scores[criterion.key];
        if (!result) {
          throw new Error(
            `Demo attempt for "${challenge.slug}" is missing a score for "${criterion.key}"`,
          );
        }
        return {
          criterionId: criterion.id,
          key: criterion.key,
          label: criterion.label,
          competencyId: criterion.competencyId,
          weight: criterion.weight,
          score: result.score,
          rationale: result.rationale,
        };
      });

      const rubricSnapshot: RubricSnapshot = {
        version: challenge.rubricVersion,
        criteria: challenge.criteria.map((c) => ({
          id: c.id,
          key: c.key,
          label: c.label,
          description: c.description,
          competencyId: c.competencyId,
          weight: c.weight,
          anchors: c.anchors,
        })),
      };

      const [submission] = await tx
        .insert(submissions)
        .values({
          userId,
          challengeId: challenge.id,
          content: attempt.content,
          status: "evaluated",
          attemptNumber,
          submittedAt,
          evaluationStartedAt: submittedAt,
          createdAt: submittedAt,
          updatedAt: submittedAt,
        })
        .returning({ id: submissions.id });

      await tx.insert(evaluations).values({
        submissionId: submission!.id,
        overallScore: weightedOverall(criterionScores),
        criterionScores,
        strengths: attempt.strengths,
        improvements: attempt.improvements,
        summary: attempt.summary,
        recommendedChallengeId: attempt.recommendedChallengeSlug
          ? (bySlug.get(attempt.recommendedChallengeSlug)?.id ?? null)
          : null,
        recommendationReason: attempt.recommendationReason,
        flags: { injectionSuspected: false, offTopic: false },
        rubricVersion: challenge.rubricVersion,
        rubricSnapshot,
        model: "demo-seed",
        promptVersion: "demo",
        createdAt: new Date(submittedAt.getTime() + 30_000),
      });
    }
  });
}
