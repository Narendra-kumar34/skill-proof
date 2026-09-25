import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { evaluations, submissions } from "@/db/schema";
import { cacheTags } from "@/lib/cache-tags";
import { requireUser } from "@/server/session";

/**
 * Per-learner reads. Each exported getter resolves the signed-in user itself
 * and passes only the id into an unexported cached function, so a caller can
 * never request another learner's data by passing a different id.
 */

export async function getMyChallengeActivity(challengeId: string) {
  const user = await requireUser();
  return challengeActivity(user.id, challengeId);
}

async function challengeActivity(userId: string, challengeId: string) {
  "use cache";
  cacheTag(cacheTags.userActivity(userId));
  cacheLife("minutes");

  const rows = await db.query.submissions.findMany({
    where: and(
      eq(submissions.userId, userId),
      eq(submissions.challengeId, challengeId),
    ),
    orderBy: desc(submissions.createdAt),
    with: {
      evaluation: {
        with: {
          recommendedChallenge: {
            columns: { slug: true, title: true, difficulty: true },
          },
        },
      },
    },
  });

  const draft = rows.find((r) => r.status === "draft") ?? null;
  const attempts = rows
    .filter((r) => r.status !== "draft")
    .sort((a, b) => (b.attemptNumber ?? 0) - (a.attemptNumber ?? 0));
  return { draft, attempts };
}

export type ChallengeActivity = Awaited<ReturnType<typeof challengeActivity>>;
export type Attempt = ChallengeActivity["attempts"][number];

export type ChallengeStats = {
  attempts: number;
  bestScore: number | null;
  latestStatus: Attempt["status"] | null;
  hasDraft: boolean;
};

/** Per-challenge progress for the signed-in learner, keyed by challenge id. */
export async function getMyChallengeStats(): Promise<
  Record<string, ChallengeStats>
> {
  const user = await requireUser();
  return challengeStats(user.id);
}

async function challengeStats(
  userId: string,
): Promise<Record<string, ChallengeStats>> {
  "use cache";
  cacheTag(cacheTags.userActivity(userId));
  cacheLife("minutes");

  const rows = await db
    .select({
      challengeId: submissions.challengeId,
      status: submissions.status,
      attemptNumber: submissions.attemptNumber,
      score: evaluations.overallScore,
    })
    .from(submissions)
    .leftJoin(evaluations, eq(evaluations.submissionId, submissions.id))
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt));

  const stats: Record<string, ChallengeStats> = {};
  for (const row of rows) {
    const s = (stats[row.challengeId] ??= {
      attempts: 0,
      bestScore: null,
      latestStatus: null,
      hasDraft: false,
    });
    if (row.status === "draft") {
      s.hasDraft = true;
      continue;
    }
    s.attempts += 1;
    s.latestStatus ??= row.status; // rows are newest first
    if (row.score !== null) s.bestScore = Math.max(s.bestScore ?? 0, row.score);
  }
  return stats;
}
