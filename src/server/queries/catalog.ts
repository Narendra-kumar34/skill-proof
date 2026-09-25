import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { challenges, skills } from "@/db/schema";
import { cacheTags } from "@/lib/cache-tags";

/**
 * Published catalog reads. Shared by every learner, so they are cached on the
 * server and invalidated by tag when an admin edits content.
 */

export async function getPublishedSkills() {
  "use cache";
  cacheTag(cacheTags.catalog);
  cacheLife("hours");

  return db.query.skills.findMany({
    where: eq(skills.status, "published"),
    orderBy: asc(skills.sortOrder),
    columns: { id: true, slug: true, name: true, summary: true },
    with: {
      competencies: {
        orderBy: (c) => asc(c.sortOrder),
        columns: { id: true, label: true },
      },
      challenges: {
        where: (c) => eq(c.status, "published"),
        columns: { id: true, difficulty: true, estimatedMinutes: true },
      },
    },
  });
}

export async function getSkillBySlug(slug: string) {
  "use cache";
  cacheTag(cacheTags.catalog);
  cacheLife("hours");

  const skill = await db.query.skills.findFirst({
    where: and(eq(skills.slug, slug), eq(skills.status, "published")),
    with: {
      competencies: { orderBy: (c) => asc(c.sortOrder) },
      challenges: {
        where: (c) => eq(c.status, "published"),
        orderBy: (c) => [asc(c.estimatedMinutes)],
        columns: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          difficulty: true,
          estimatedMinutes: true,
        },
        with: { criteria: { columns: { competencyId: true } } },
      },
    },
  });
  if (!skill) return null;

  const order = { beginner: 0, intermediate: 1, advanced: 2 } as const;
  return {
    ...skill,
    challenges: [...skill.challenges].sort(
      (a, b) => order[a.difficulty] - order[b.difficulty],
    ),
  };
}

export async function getChallengeBySlug(slug: string) {
  "use cache";
  cacheTag(cacheTags.catalog);
  cacheLife("hours");

  const challenge = await db.query.challenges.findFirst({
    where: and(eq(challenges.slug, slug), eq(challenges.status, "published")),
    with: {
      skill: { columns: { id: true, slug: true, name: true } },
      criteria: {
        orderBy: (c) => asc(c.sortOrder),
        with: { competency: { columns: { id: true, label: true } } },
      },
    },
  });
  return challenge ?? null;
}

export type SkillDetail = NonNullable<
  Awaited<ReturnType<typeof getSkillBySlug>>
>;
export type ChallengeDetail = NonNullable<
  Awaited<ReturnType<typeof getChallengeBySlug>>
>;
