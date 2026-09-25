import "server-only";

import { and, asc, avg, count, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  challenges,
  competencies,
  evaluationRuns,
  rubricCriteria,
  skills,
  submissions,
  user,
} from "@/db/schema";

/**
 * Admin reads. Deliberately uncached: admins must always see the current
 * state, including drafts. Callers must have passed `requireAdmin()`.
 */

export async function getAdminOverview() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [skillRows, challengeRows, learnerRows, submissionRows, runRows] =
    await Promise.all([
      db
        .select({ status: skills.status, n: count() })
        .from(skills)
        .groupBy(skills.status),
      db
        .select({ status: challenges.status, n: count() })
        .from(challenges)
        .groupBy(challenges.status),
      db
        .select({ isAnonymous: user.isAnonymous, n: count() })
        .from(user)
        .groupBy(user.isAnonymous),
      db
        .select({ n: count() })
        .from(submissions)
        .where(sql`${submissions.status} <> 'draft'`),
      db
        .select({
          outcome: evaluationRuns.outcome,
          n: count(),
          latency: avg(evaluationRuns.latencyMs),
        })
        .from(evaluationRuns)
        .where(gt(evaluationRuns.startedAt, since))
        .groupBy(evaluationRuns.outcome),
    ]);

  const byStatus = (rows: Array<{ status: string; n: number }>) =>
    Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<
      "draft" | "published" | "archived",
      number | undefined
    >;
  const runs = Object.fromEntries(runRows.map((r) => [r.outcome, r]));

  return {
    skills: byStatus(skillRows),
    challenges: byStatus(challengeRows),
    learners: learnerRows.find((r) => !r.isAnonymous)?.n ?? 0,
    demoAccounts: learnerRows.find((r) => r.isAnonymous)?.n ?? 0,
    attempts: submissionRows[0]?.n ?? 0,
    runs24h: {
      succeeded: runs.succeeded?.n ?? 0,
      failed: runs.failed?.n ?? 0,
      running: runs.running?.n ?? 0,
      avgLatencyMs: runs.succeeded?.latency
        ? Math.round(Number(runs.succeeded.latency))
        : null,
    },
  };
}

export async function listSkillsAdmin() {
  return db
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      status: skills.status,
      sortOrder: skills.sortOrder,
      updatedAt: skills.updatedAt,
      competencyCount: sql<number>`(select count(*)::int from ${competencies} where ${competencies.skillId} = ${skills.id})`,
      challengeCount: sql<number>`(select count(*)::int from ${challenges} where ${challenges.skillId} = ${skills.id})`,
    })
    .from(skills)
    .orderBy(asc(skills.sortOrder), asc(skills.name));
}

export async function getSkillAdmin(id: string) {
  const skill = await db.query.skills.findFirst({
    where: eq(skills.id, id),
    with: {
      competencies: { orderBy: (c) => asc(c.sortOrder) },
      challenges: {
        orderBy: (c) => asc(c.title),
        columns: { id: true, title: true, status: true, difficulty: true },
      },
    },
  });
  if (!skill) return null;

  const usage = await db
    .select({ competencyId: rubricCriteria.competencyId, n: count() })
    .from(rubricCriteria)
    .innerJoin(competencies, eq(competencies.id, rubricCriteria.competencyId))
    .where(eq(competencies.skillId, id))
    .groupBy(rubricCriteria.competencyId);
  const usageById = new Map(usage.map((u) => [u.competencyId, u.n]));

  return {
    ...skill,
    competencies: skill.competencies.map((c) => ({
      ...c,
      criteriaCount: usageById.get(c.id) ?? 0,
    })),
  };
}

export async function listChallengesAdmin(skillId?: string) {
  return db
    .select({
      id: challenges.id,
      title: challenges.title,
      slug: challenges.slug,
      status: challenges.status,
      difficulty: challenges.difficulty,
      rubricVersion: challenges.rubricVersion,
      updatedAt: challenges.updatedAt,
      skillId: skills.id,
      skillName: skills.name,
      criteriaCount: sql<number>`(select count(*)::int from ${rubricCriteria} where ${rubricCriteria.challengeId} = ${challenges.id})`,
      attemptCount: sql<number>`(select count(*)::int from ${submissions} where ${submissions.challengeId} = ${challenges.id} and ${submissions.status} <> 'draft')`,
    })
    .from(challenges)
    .innerJoin(skills, eq(skills.id, challenges.skillId))
    .where(skillId ? eq(challenges.skillId, skillId) : undefined)
    .orderBy(asc(skills.sortOrder), desc(challenges.updatedAt));
}

export async function getChallengeAdmin(id: string) {
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, id),
    with: {
      skill: {
        columns: { id: true, name: true, slug: true },
        with: { competencies: { orderBy: (c) => asc(c.sortOrder) } },
      },
      criteria: { orderBy: (c) => asc(c.sortOrder) },
    },
  });
  if (!challenge) return null;

  const [attempts] = await db
    .select({ n: count() })
    .from(submissions)
    .where(
      and(
        eq(submissions.challengeId, id),
        sql`${submissions.status} <> 'draft'`,
      ),
    );
  return { ...challenge, attemptCount: attempts?.n ?? 0 };
}

export async function listSkillOptions() {
  return db
    .select({ id: skills.id, name: skills.name })
    .from(skills)
    .orderBy(asc(skills.sortOrder), asc(skills.name));
}

export type SkillAdmin = NonNullable<Awaited<ReturnType<typeof getSkillAdmin>>>;
export type ChallengeAdmin = NonNullable<
  Awaited<ReturnType<typeof getChallengeAdmin>>
>;
