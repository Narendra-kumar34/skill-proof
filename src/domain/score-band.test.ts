import { describe, expect, it } from "vitest";

import { formatDelta, scoreBand } from "./score-band";

describe("scoreBand", () => {
  it.each([
    [100, "strong"],
    [80, "strong"],
    [79, "adequate"],
    [50, "adequate"],
    [49, "weak"],
    [0, "weak"],
  ])("%i → %s", (score, band) => {
    expect(scoreBand(score)).toBe(band);
  });
});

describe("formatDelta", () => {
  it("signs changes", () => {
    expect(formatDelta(19)).toBe("+19");
    expect(formatDelta(-4)).toBe("−4");
    expect(formatDelta(0)).toBe("±0");
  });
});
