import { describe, expect, it } from "vitest";

import { demoAttempts, seedSkills } from ".";

const allChallenges = seedSkills.flatMap((s) => s.challenges);
const challengeBySlug = new Map(allChallenges.map((c) => [c.slug, c]));

describe("seed catalog", () => {
  it("has unique skill and challenge slugs", () => {
    const skillSlugs = seedSkills.map((s) => s.slug);
    expect(new Set(skillSlugs).size).toBe(skillSlugs.length);
    expect(challengeBySlug.size).toBe(allChallenges.length);
  });

  describe.each(seedSkills.map((s) => [s.name, s] as const))(
    "%s",
    (_, skill) => {
      const competencyKeys = new Set(skill.competencies.map((c) => c.key));

      it("maps every criterion to one of the skill's competencies", () => {
        for (const challenge of skill.challenges) {
          for (const criterion of challenge.criteria) {
            expect(
              competencyKeys,
              `${challenge.slug}/${criterion.key}`,
            ).toContain(criterion.competency);
          }
        }
      });

      it("assesses every competency in at least two challenges", () => {
        // Gap detection needs evidence from 2+ challenges per competency.
        for (const key of competencyKeys) {
          const n = skill.challenges.filter((ch) =>
            ch.criteria.some((cr) => cr.competency === key),
          ).length;
          expect(n, key).toBeGreaterThanOrEqual(2);
        }
      });

      it("uses unique criterion keys and weights between 1 and 5", () => {
        for (const challenge of skill.challenges) {
          const keys = challenge.criteria.map((c) => c.key);
          expect(new Set(keys).size, challenge.slug).toBe(keys.length);
          for (const { weight } of challenge.criteria) {
            expect(weight).toBeGreaterThanOrEqual(1);
            expect(weight).toBeLessThanOrEqual(5);
          }
        }
      });
    },
  );
});

describe("demo history", () => {
  it.each(demoAttempts.map((a, i) => [i, a] as const))(
    "attempt %i references real challenges and scores every criterion",
    (_, attempt) => {
      const challenge = challengeBySlug.get(attempt.challengeSlug);
      expect(challenge).toBeDefined();
      if (attempt.recommendedChallengeSlug) {
        expect(challengeBySlug.has(attempt.recommendedChallengeSlug)).toBe(
          true,
        );
      }

      const expectedKeys = challenge!.criteria.map((c) => c.key).sort();
      expect(Object.keys(attempt.scores).sort()).toEqual(expectedKeys);
      for (const { score } of Object.values(attempt.scores)) {
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    },
  );
});
