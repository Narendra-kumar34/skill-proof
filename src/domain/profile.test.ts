import { describe, expect, it } from "vitest";

import { detectGaps } from "./gaps";
import {
  buildSkillProfile,
  consistencyScore,
  type EvaluatedAttempt,
  latestPerChallenge,
  type ProfileSkill,
} from "./profile";

const skill: ProfileSkill = {
  id: "s",
  competencies: [
    { id: "clarity", label: "Instruction Clarity" },
    { id: "robust", label: "Robustness" },
    { id: "format", label: "Output Structuring" },
  ],
  challenges: [
    {
      id: "a",
      slug: "a",
      title: "A",
      difficulty: "beginner",
      competencyIds: ["clarity", "robust"],
    },
    {
      id: "b",
      slug: "b",
      title: "B",
      difficulty: "intermediate",
      competencyIds: ["clarity", "robust", "format"],
    },
    {
      id: "c",
      slug: "c",
      title: "C",
      difficulty: "advanced",
      competencyIds: ["robust", "format"],
    },
  ],
};

let n = 0;
const attempt = (
  challengeId: string,
  attemptNumber: number,
  overallScore: number,
  scores: Record<string, [number, number]>,
): EvaluatedAttempt => ({
  submissionId: `sub-${++n}`,
  challengeId,
  attemptNumber,
  submittedAt: new Date(2026, 0, n),
  overallScore,
  criterionScores: Object.entries(scores).map(
    ([competencyId, [score, weight]]) => ({
      competencyId,
      score,
      weight,
    }),
  ),
});

const history = [
  attempt("a", 1, 60, { clarity: [70, 1], robust: [40, 1] }),
  attempt("a", 2, 80, { clarity: [90, 1], robust: [50, 1] }),
  attempt("b", 1, 70, { clarity: [80, 2], robust: [44, 1], format: [85, 1] }),
];

describe("latestPerChallenge", () => {
  it("keeps only the highest attempt number per challenge", () => {
    const latest = latestPerChallenge(history);
    expect(latest.get("a")?.attemptNumber).toBe(2);
    expect(latest.size).toBe(2);
  });
});

describe("consistencyScore", () => {
  it("is null with fewer than two challenges and 100 with no spread", () => {
    expect(consistencyScore([80])).toBeNull();
    expect(consistencyScore([70, 70])).toBe(100);
  });

  it("drops as scores spread out", () => {
    // stddev of [60, 80] = 10 → 100 - 20
    expect(consistencyScore([60, 80])).toBe(80);
  });
});

describe("buildSkillProfile", () => {
  const profile = buildSkillProfile(skill, history);
  const comp = (id: string) => profile.competencies.find((c) => c.id === id)!;

  it("counts only the latest attempt per challenge", () => {
    expect(profile.attemptedChallenges).toBe(2);
    expect(profile.totalChallenges).toBe(3);
    expect(profile.score).toBe(75); // mean(80, 70)
  });

  it("weights competency scores by rubric weight", () => {
    // clarity: a#2 90×1 + b 80×2 → 250/3 = 83
    expect(comp("clarity").score).toBe(83);
    // robust: a#2 50, b 44 → 47
    expect(comp("robust").score).toBe(47);
  });

  it("links evidence to challenges and lists untested ones", () => {
    expect(
      comp("robust")
        .evidence.map((e) => e.challengeId)
        .sort(),
    ).toEqual(["a", "b"]);
    expect(comp("robust").untested.map((u) => u.challengeId)).toEqual(["c"]);
    expect(comp("format").evidence).toHaveLength(1);
  });

  it("reports improvement on retried challenges", () => {
    expect(profile.retryGain).toEqual({ challenges: 1, points: 20 });
  });

  it("handles a learner with no attempts", () => {
    const empty = buildSkillProfile(skill, []);
    expect(empty.score).toBeNull();
    expect(empty.consistency).toBeNull();
    expect(empty.competencies.every((c) => c.score === null)).toBe(true);
  });

  it("ignores attempts from other skills", () => {
    const other = buildSkillProfile(skill, [
      attempt("zzz", 1, 10, { clarity: [10, 1] }),
    ]);
    expect(other.attemptedChallenges).toBe(0);
  });
});

describe("detectGaps", () => {
  const profile = buildSkillProfile(skill, history);
  const latest = new Map([
    ["a", 80],
    ["b", 70],
  ]);

  it("flags a competency averaging under 60 across two or more challenges", () => {
    const gaps = detectGaps(skill, profile, latest);
    expect(gaps.map((g) => g.competencyId)).toEqual(["robust"]);
    expect(gaps[0]?.message).toBe(
      "You perform well on instruction clarity, but consistently lose points on robustness: it averages 47 across 2 challenges.",
    );
  });

  it("recommends an unattempted challenge that targets the gap first", () => {
    expect(
      detectGaps(skill, profile, latest)[0]?.recommendation?.challengeId,
    ).toBe("c");
  });

  it("does not flag a weak competency backed by a single challenge", () => {
    const one = buildSkillProfile(skill, [
      attempt("c", 1, 40, { robust: [30, 1], format: [50, 1] }),
    ]);
    expect(detectGaps(skill, one, new Map([["c", 40]]))).toEqual([]);
  });
});
