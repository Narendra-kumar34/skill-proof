import { describe, expect, it } from "vitest";

import {
  EvaluationOutputError,
  normalizeEvaluation,
  type NormalizeContext,
} from "./normalize";
import type { EvaluationOutput } from "./output-schema";

const ctx: NormalizeContext = {
  criteria: [
    {
      id: "cr1",
      key: "clarity",
      label: "Clarity",
      competencyId: "k1",
      weight: 3,
    },
    {
      id: "cr2",
      key: "robust",
      label: "Robustness",
      competencyId: "k2",
      weight: 1,
    },
  ],
  candidates: [
    { alias: "C1", challengeId: "ch-a" },
    { alias: "C2", challengeId: "ch-b" },
  ],
  fallback: { challengeId: "ch-a", reason: "Fallback reason." },
};

const output = (
  overrides: Partial<EvaluationOutput> = {},
): EvaluationOutput => ({
  criteria: [
    { key: "clarity", score: 90, rationale: "Clear." },
    { key: "robust", score: 50, rationale: "No fallbacks." },
  ],
  strengths: ["Good structure"],
  improvements: [{ issue: "No fallback", suggestion: "Add one" }],
  summary: "Solid attempt.",
  recommendation: { candidateId: "C2", reason: "Targets robustness." },
  flags: { injectionSuspected: false, offTopic: false },
  ...overrides,
});

describe("normalizeEvaluation", () => {
  it("computes the weighted overall score in code", () => {
    // (90*3 + 50*1) / 4 = 80
    expect(normalizeEvaluation(output(), ctx).overallScore).toBe(80);
  });

  it("orders criterion scores by the rubric and attaches metadata", () => {
    const result = normalizeEvaluation(
      output({
        criteria: [
          { key: "ROBUST", score: 50, rationale: "r" },
          { key: "clarity", score: 90, rationale: "c" },
        ],
      }),
      ctx,
    );
    expect(result.criterionScores.map((c) => c.criterionId)).toEqual([
      "cr1",
      "cr2",
    ]);
    expect(result.criterionScores[1]).toMatchObject({
      competencyId: "k2",
      weight: 1,
    });
  });

  it("clamps out-of-range and non-finite scores", () => {
    const result = normalizeEvaluation(
      output({
        criteria: [
          { key: "clarity", score: 140, rationale: "c" },
          { key: "robust", score: Number.NaN, rationale: "r" },
        ],
      }),
      ctx,
    );
    expect(result.criterionScores.map((c) => c.score)).toEqual([100, 0]);
  });

  it("rejects output that omits a rubric criterion", () => {
    expect(() =>
      normalizeEvaluation(
        output({ criteria: [{ key: "clarity", score: 80, rationale: "c" }] }),
        ctx,
      ),
    ).toThrow(EvaluationOutputError);
  });

  it("ignores unknown criteria and keeps the first duplicate", () => {
    const result = normalizeEvaluation(
      output({
        criteria: [
          { key: "clarity", score: 70, rationale: "first" },
          { key: "clarity", score: 10, rationale: "second" },
          { key: "robust", score: 60, rationale: "r" },
          { key: "made-up", score: 100, rationale: "x" },
        ],
      }),
      ctx,
    );
    expect(result.criterionScores[0]).toMatchObject({
      score: 70,
      rationale: "first",
    });
    expect(result.criterionScores).toHaveLength(2);
  });

  it("caps every score for off-topic submissions", () => {
    const result = normalizeEvaluation(
      output({ flags: { injectionSuspected: false, offTopic: true } }),
      ctx,
    );
    expect(Math.max(...result.criterionScores.map((c) => c.score))).toBe(20);
    expect(result.flags.offTopic).toBe(true);
  });

  it("maps the chosen alias to a real challenge id", () => {
    const result = normalizeEvaluation(output(), ctx);
    expect(result.recommendedChallengeId).toBe("ch-b");
    expect(result.recommendationReason).toBe("Targets robustness.");
  });

  it.each([["C9"], [null], ["ch-b"]])(
    "falls back when the model picks %j",
    (candidateId) => {
      const result = normalizeEvaluation(
        output({ recommendation: { candidateId, reason: "x" } }),
        ctx,
      );
      expect(result.recommendedChallengeId).toBe("ch-a");
      expect(result.recommendationReason).toBe("Fallback reason.");
    },
  );

  it("trims, de-duplicates and bounds feedback lists", () => {
    const result = normalizeEvaluation(
      output({
        strengths: [" A ", "A", "B", "", "C", "D", "E"],
        improvements: [
          { issue: "1", suggestion: "a" },
          { issue: "", suggestion: "dropped" },
          { issue: "2", suggestion: "b" },
          { issue: "3", suggestion: "c" },
          { issue: "4", suggestion: "d" },
        ],
      }),
      ctx,
    );
    expect(result.strengths).toEqual(["A", "B", "C", "D"]);
    expect(result.improvements.map((i) => i.issue)).toEqual(["1", "2", "3"]);
  });

  it("rejects an empty summary", () => {
    expect(() => normalizeEvaluation(output({ summary: "   " }), ctx)).toThrow(
      EvaluationOutputError,
    );
  });
});
