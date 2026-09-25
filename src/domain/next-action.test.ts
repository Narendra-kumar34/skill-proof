import { describe, expect, it } from "vitest";

import { type NextActionInput, pickNextAction } from "./next-action";

const empty: NextActionInput = {
  gaps: [],
  latestRecommendation: null,
  drafts: [],
  firstUnattempted: null,
};

describe("pickNextAction", () => {
  it("prioritises a detected gap", () => {
    const action = pickNextAction({
      ...empty,
      gaps: [
        {
          label: "Robustness",
          score: 47,
          recommendation: {
            slug: "triage",
            title: "Triage",
            reason: "Targets it.",
          },
        },
      ],
      latestRecommendation: { slug: "other", title: "Other", reason: null },
      drafts: [{ slug: "d", title: "Draft" }],
    });
    expect(action).toMatchObject({ kind: "gap", slug: "triage" });
    expect(action?.reason).toContain("averaging 47");
  });

  it("falls back through recommendation, draft and first challenge", () => {
    expect(
      pickNextAction({
        ...empty,
        latestRecommendation: { slug: "r", title: "R", reason: null },
      })?.kind,
    ).toBe("recommended");
    expect(
      pickNextAction({ ...empty, drafts: [{ slug: "d", title: "D" }] })?.kind,
    ).toBe("continue-draft");
    expect(
      pickNextAction({ ...empty, firstUnattempted: { slug: "f", title: "F" } })
        ?.kind,
    ).toBe("start");
  });

  it("skips gaps that have no challenge left to recommend", () => {
    const action = pickNextAction({
      ...empty,
      gaps: [{ label: "X", score: 40, recommendation: null }],
      firstUnattempted: { slug: "f", title: "F" },
    });
    expect(action?.kind).toBe("start");
  });

  it("returns null when there is nothing to suggest", () => {
    expect(pickNextAction(empty)).toBeNull();
  });
});
