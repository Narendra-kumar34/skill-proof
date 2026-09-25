import { describe, expect, it } from "vitest";

import { type CandidateChallenge, rankNextChallenges } from "./recommend";

const challenges: CandidateChallenge[] = [
  {
    id: "cur",
    title: "Current",
    difficulty: "beginner",
    competencyIds: ["clarity", "robust"],
  },
  {
    id: "rob",
    title: "Robust advanced",
    difficulty: "advanced",
    competencyIds: ["robust"],
  },
  {
    id: "rob-mid",
    title: "Robust mid",
    difficulty: "intermediate",
    competencyIds: ["robust", "format"],
  },
  {
    id: "fmt",
    title: "Format mid",
    difficulty: "intermediate",
    competencyIds: ["format"],
  },
];

const base = {
  current: { id: "cur", difficulty: "beginner" as const, overallScore: 72 },
  criterionScores: [
    { competencyId: "clarity", score: 90 },
    { competencyId: "robust", score: 40 },
  ],
  challenges,
  bestScores: new Map<string, number>([["cur", 72]]),
};

describe("rankNextChallenges", () => {
  it("prefers an unattempted challenge that targets the weakest competency at a sensible level", () => {
    const [first] = rankNextChallenges(base, 3);
    expect(first?.id).toBe("rob-mid");
    expect(first?.reason).toMatch(/lost the most points/);
  });

  it("excludes the current challenge after a decent attempt", () => {
    expect(rankNextChallenges(base, 10).map((c) => c.id)).not.toContain("cur");
  });

  it("offers a retry of the current challenge after a weak attempt", () => {
    const ranked = rankNextChallenges(
      { ...base, current: { ...base.current, overallScore: 45 } },
      10,
    );
    expect(ranked.map((c) => c.id)).toContain("cur");
  });

  it("skips challenges the learner has already mastered", () => {
    const ranked = rankNextChallenges(
      {
        ...base,
        bestScores: new Map([
          ["cur", 72],
          ["rob-mid", 85],
        ]),
      },
      10,
    );
    expect(ranked.map((c) => c.id)).not.toContain("rob-mid");
  });

  it("respects the limit and returns nothing when there are no options", () => {
    expect(rankNextChallenges(base, 1)).toHaveLength(1);
    expect(
      rankNextChallenges({ ...base, challenges: [challenges[0]!] }, 3),
    ).toEqual([]);
  });
});
