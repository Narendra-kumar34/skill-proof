import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { challenges, competencies, skills } from "@/db/schema";
import type { CriterionInput } from "@/domain/admin/schemas";
import {
  addCompetency,
  createChallenge,
  createSkill,
  deleteChallenge,
  deleteCompetency,
  deleteSkill,
  saveRubric,
  updateChallenge,
} from "@/server/admin/service";
import {
  runEvaluation,
  submitForEvaluation,
} from "@/server/evaluation/service";

import { ANSWER, cleanupTestUsers, createTestUser } from "./helpers";

const RUN = Date.now().toString(36);
let skillId: string;
let challengeId: string;
let compA: string;
let compB: string;

const challengeInput = {
  title: "Integration test challenge",
  slug: `integration-challenge-${RUN}`,
  summary: "A challenge created by the integration tests.",
  scenario:
    "A realistic scenario with enough detail to pass validation for this test.",
  task: "- Produce something testable",
  responseGuidance: "Anything goes for tests.",
  difficulty: "beginner" as const,
  estimatedMinutes: 10,
  status: "draft" as const,
};

const criterion = (
  key: string,
  competencyId: string,
  weight = 3,
): CriterionInput => ({
  key,
  label: `Label ${key}`,
  description: "What this criterion judges.",
  competencyId,
  weight,
  anchors: {
    strong: "Strong work.",
    adequate: "Adequate work.",
    weak: "Weak work.",
  },
});

beforeAll(async () => {
  skillId = await createSkill({
    name: "Integration Skill",
    slug: `integration-skill-${RUN}`,
    summary: "Created by the integration tests.",
    conceptBrief: "A concept brief long enough to be valid.",
    status: "draft",
    sortOrder: 999,
  });
  await addCompetency(skillId, {
    key: "alpha",
    label: "Alpha",
    description: "First competency.",
  });
  await addCompetency(skillId, {
    key: "beta",
    label: "Beta",
    description: "Second competency.",
  });
  const comps = await db.query.competencies.findMany({
    where: eq(competencies.skillId, skillId),
  });
  compA = comps.find((c) => c.key === "alpha")!.id;
  compB = comps.find((c) => c.key === "beta")!.id;
  challengeId = await createChallenge(skillId, challengeInput);
});

afterAll(async () => {
  await cleanupTestUsers();
  await db.delete(challenges).where(eq(challenges.skillId, skillId));
  await db.delete(skills).where(eq(skills.id, skillId));
});

describe("catalog administration", () => {
  it("refuses to publish a challenge without a complete rubric", async () => {
    await expect(
      updateChallenge(challengeId, { ...challengeInput, status: "published" }),
    ).rejects.toThrow(/at least 2 criteria/);
  });

  it("versions the rubric only when grading changes", async () => {
    const first = await saveRubric(challengeId, [
      criterion("one", compA),
      criterion("two", compB),
    ]);
    expect(first).toEqual({ version: 1, changed: false }); // first rubric is v1

    const saved = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
      with: { criteria: true },
    });
    const withIds = saved!.criteria
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({
        ...criterion(c.key, c.competencyId, c.weight),
        id: c.id,
      }));

    const reordered = await saveRubric(challengeId, [...withIds].reverse());
    expect(reordered).toEqual({ version: 1, changed: false });

    const reweighted = await saveRubric(challengeId, [
      { ...withIds[0]!, weight: 5 },
      withIds[1]!,
    ]);
    expect(reweighted).toEqual({ version: 2, changed: true });
  });

  it("rejects criteria mapped to another skill's competencies", async () => {
    const foreign = await db.query.competencies.findFirst();
    await expect(
      saveRubric(challengeId, [
        criterion("x1", foreign!.id),
        criterion("x2", compA),
      ]),
    ).rejects.toThrow(/competency of this challenge's skill/);
  });

  it("protects referenced data from deletion", async () => {
    // Competency used by a criterion.
    await expect(deleteCompetency(compA)).rejects.toThrow(
      /used by rubric criteria/,
    );
    // Skill that still has a challenge.
    await expect(deleteSkill(skillId)).rejects.toThrow(/still has challenges/);

    // Challenge with a learner attempt.
    await updateChallenge(challengeId, {
      ...challengeInput,
      status: "published",
    });
    const learner = await createTestUser();
    const id = await submitForEvaluation(learner, challengeId, ANSWER);
    await runEvaluation(id);
    await expect(deleteChallenge(challengeId)).rejects.toThrow(
      /Archive it instead/,
    );
  });
});
