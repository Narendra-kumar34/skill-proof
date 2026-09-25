import { describe, expect, it } from "vitest";

import { clampScore, weightedOverall } from "./scoring";

describe("clampScore", () => {
  it("rounds and clamps into 0-100", () => {
    expect(clampScore(72.6)).toBe(73);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(140)).toBe(100);
  });
});

describe("weightedOverall", () => {
  it("returns the plain mean when weights are equal", () => {
    expect(
      weightedOverall([
        { score: 80, weight: 1 },
        { score: 60, weight: 1 },
      ]),
    ).toBe(70);
  });

  it("weights heavier criteria more", () => {
    // (90*3 + 50*1) / 4 = 80
    expect(
      weightedOverall([
        { score: 90, weight: 3 },
        { score: 50, weight: 1 },
      ]),
    ).toBe(80);
  });

  it("clamps out-of-range criterion scores before averaging", () => {
    expect(
      weightedOverall([
        { score: 150, weight: 1 },
        { score: 50, weight: 1 },
      ]),
    ).toBe(75);
  });

  it("rejects empty input and non-positive weights", () => {
    expect(() => weightedOverall([])).toThrow();
    expect(() => weightedOverall([{ score: 50, weight: 0 }])).toThrow();
  });
});
