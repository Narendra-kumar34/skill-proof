import "server-only";

import { and, count, eq, inArray, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { challenges, competencies, rubricCriteria, skills } from "@/db/schema";
import { rubricChanged } from "@/domain/admin/rubric-diff";
import type {
  ChallengeInput,
  CompetencyInput,
  CriterionInput,
  SkillInput,
} from "@/domain/admin/schemas";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  UserFacingError,
} from "@/server/errors";

/**
 * Catalog mutations. Inputs arrive already validated by the admin actions;
 * this layer enforces the rules that need the database (publishing
 * requirements, ownership of competencies, referential integrity).
 */

async function translateConstraintErrors<T>(
  fn: () => Promise<T>,
  messages: { unique?: string; foreignKey?: string },
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (messages.unique && isUniqueViolation(error)) {
      throw new UserFacingError(messages.unique);
    }
    if (messages.foreignKey && isForeignKeyViolation(error)) {
      throw new UserFacingError(messages.foreignKey);
    }
    throw error;
  }
}

// --- Skills -----------------------------------------------------------------

export async function createSkill(input: SkillInput): Promise<string> {
  if (input.status === "published") {
    throw new UserFacingError(
      "Add at least one competency before publishing. Save it as a draft first.",
    );
  }
  const [row] = await translateConstraintErrors(
    () => db.insert(skills).values(input).returning({ id: skills.id }),
    { unique: "That slug is already used by another skill." },
  );
  return row!.id;
}

export async function updateSkill(id: string, input: SkillInput) {
  if (input.status === "published") {
    const [c] = await db
      .select({ n: count() })
      .from(competencies)
      .where(eq(competencies.skillId, id));
    if (!c?.n) {
      throw new UserFacingError(
        "Add at least one competency before publishing this skill.",
      );
    }
  }
  const updated = await translateConstraintErrors(
    () =>
      db
        .update(skills)
        .set(input)
        .where(eq(skills.id, id))
        .returning({ id: skills.id }),
    { unique: "That slug is already used by another skill." },
  );
  if (updated.length === 0) throw new UserFacingError("Skill not found.");
}

export async function deleteSkill(id: string) {
  await translateConstraintErrors(
    () => db.delete(skills).where(eq(skills.id, id)),
    {
      foreignKey:
        "This skill still has challenges. Delete or move them first, or archive the skill instead.",
    },
  );
}

// --- Competencies -----------------------------------------------------------

export async function addCompetency(skillId: string, input: CompetencyInput) {
  const [max] = await db
    .select({
      n: sql<number>`coalesce(max(${competencies.sortOrder}), -1)::int`,
    })
    .from(competencies)
    .where(eq(competencies.skillId, skillId));
  await translateConstraintErrors(
    () =>
      db
        .insert(competencies)
        .values({ skillId, ...input, sortOrder: (max?.n ?? -1) + 1 }),
    {
      unique: "This skill already has a competency with that key.",
      foreignKey: "Skill not found.",
    },
  );
}

export async function updateCompetency(id: string, input: CompetencyInput) {
  const updated = await translateConstraintErrors(
    () =>
      db
        .update(competencies)
        .set(input)
        .where(eq(competencies.id, id))
        .returning({ id: competencies.id }),
    { unique: "This skill already has a competency with that key." },
  );
  if (updated.length === 0) throw new UserFacingError("Competency not found.");
}

export async function deleteCompetency(id: string) {
  await translateConstraintErrors(
    () => db.delete(competencies).where(eq(competencies.id, id)),
    {
      foreignKey:
        "This competency is used by rubric criteria. Reassign those criteria first.",
    },
  );
}

// --- Challenges -------------------------------------------------------------

/** New challenges always start as drafts: they have no rubric yet. */
export async function createChallenge(
  skillId: string,
  input: ChallengeInput,
): Promise<string> {
  const [row] = await translateConstraintErrors(
    () =>
      db
        .insert(challenges)
        .values({ skillId, ...input, status: "draft" })
        .returning({ id: challenges.id }),
    {
      unique: "That slug is already used by another challenge.",
      foreignKey: "Skill not found.",
    },
  );
  return row!.id;
}

export async function updateChallenge(id: string, input: ChallengeInput) {
  if (input.status === "published") {
    const [c] = await db
      .select({ n: count() })
      .from(rubricCriteria)
      .where(eq(rubricCriteria.challengeId, id));
    if ((c?.n ?? 0) < 2) {
      throw new UserFacingError(
        "A challenge needs a rubric with at least 2 criteria before it can be published.",
      );
    }
  }
  const updated = await translateConstraintErrors(
    () =>
      db
        .update(challenges)
        .set(input)
        .where(eq(challenges.id, id))
        .returning({ id: challenges.id }),
    { unique: "That slug is already used by another challenge." },
  );
  if (updated.length === 0) throw new UserFacingError("Challenge not found.");
}

export async function deleteChallenge(id: string) {
  await translateConstraintErrors(
    () => db.delete(challenges).where(eq(challenges.id, id)),
    {
      foreignKey:
        "Learners have attempted this challenge, so deleting it would erase their evidence. Archive it instead.",
    },
  );
}

/**
 * Replaces a challenge's rubric in one transaction and bumps the rubric
 * version when grading-relevant content changed. Past evaluations keep their
 * own snapshot, so their scores still make sense.
 */
export async function saveRubric(
  challengeId: string,
  criteria: CriterionInput[],
): Promise<{ version: number; changed: boolean }> {
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    columns: { id: true, skillId: true, rubricVersion: true },
    with: { criteria: true },
  });
  if (!challenge) throw new UserFacingError("Challenge not found.");

  // Competencies must belong to this challenge's skill.
  const allowed = await db
    .select({ id: competencies.id })
    .from(competencies)
    .where(
      and(
        eq(competencies.skillId, challenge.skillId),
        inArray(
          competencies.id,
          criteria.map((c) => c.competencyId),
        ),
      ),
    );
  const allowedIds = new Set(allowed.map((a) => a.id));
  if (criteria.some((c) => !allowedIds.has(c.competencyId))) {
    throw new UserFacingError(
      "Each criterion must map to a competency of this challenge's skill.",
    );
  }

  // Existing ids must belong to this challenge (no cross-challenge edits).
  const existingIds = new Set(challenge.criteria.map((c) => c.id));
  if (criteria.some((c) => c.id && !existingIds.has(c.id))) {
    throw new UserFacingError("Rubric is out of date. Reload and try again.");
  }

  // The first rubric for a challenge is version 1; only later edits bump it
  // (nothing can have been graded against an empty rubric).
  const changed =
    challenge.criteria.length > 0 &&
    rubricChanged(challenge.criteria, criteria);
  const version = challenge.rubricVersion + (changed ? 1 : 0);

  await translateConstraintErrors(
    () =>
      db.transaction(async (tx) => {
        const keptIds = criteria.flatMap((c) => (c.id ? [c.id] : []));
        // Delete removed criteria first so their keys can be reused.
        await tx
          .delete(rubricCriteria)
          .where(
            and(
              eq(rubricCriteria.challengeId, challengeId),
              keptIds.length > 0
                ? notInArray(rubricCriteria.id, keptIds)
                : undefined,
            ),
          );
        // Park kept rows on temporary keys so renames/swaps can't collide.
        for (const id of keptIds) {
          await tx
            .update(rubricCriteria)
            .set({ key: sql`'__tmp_' || ${rubricCriteria.id}` })
            .where(eq(rubricCriteria.id, id));
        }
        for (const [i, c] of criteria.entries()) {
          const values = {
            key: c.key,
            label: c.label,
            description: c.description,
            competencyId: c.competencyId,
            weight: c.weight,
            anchors: c.anchors,
            sortOrder: i,
          };
          if (c.id) {
            await tx
              .update(rubricCriteria)
              .set(values)
              .where(eq(rubricCriteria.id, c.id));
          } else {
            await tx.insert(rubricCriteria).values({ challengeId, ...values });
          }
        }
        if (changed) {
          await tx
            .update(challenges)
            .set({ rubricVersion: version })
            .where(eq(challenges.id, challengeId));
        }
      }),
    { unique: "Criterion keys must be unique within the rubric." },
  );

  return { version, changed };
}
