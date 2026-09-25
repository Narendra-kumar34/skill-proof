import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { challenges, user } from "@/db/schema";
import type { CurrentUser } from "@/server/session";

const created: string[] = [];

/** Inserts a throwaway learner and returns it in the session shape. */
export async function createTestUser(
  overrides: Partial<CurrentUser> = {},
): Promise<CurrentUser> {
  const id = randomUUID();
  const u: CurrentUser = {
    id,
    name: "Integration Tester",
    email: `${id}@example.test`,
    role: "learner",
    isAnonymous: false,
    ...overrides,
  };
  await db.insert(user).values({
    id,
    name: u.name,
    email: u.email,
    role: u.role,
    isAnonymous: u.isAnonymous,
  });
  created.push(id);
  return u;
}

/** Removes every user created by `createTestUser` (cascades to their data). */
export async function cleanupTestUsers() {
  if (created.length === 0) return;
  await db.delete(user).where(inArray(user.id, created.splice(0)));
}

export async function getSeededChallenge(slug: string) {
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.slug, slug),
    with: { criteria: true },
  });
  if (!challenge) {
    throw new Error(`Seeded challenge "${slug}" missing. Run npm run db:seed.`);
  }
  return challenge;
}

export const ANSWER =
  "You are a feedback classifier. Assign exactly one category from Bug, Feature request, Usability, Pricing or Praise. Return JSON with category and confidence. If the input is unclear, return needs_review.";
