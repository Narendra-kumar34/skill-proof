import { describe, expect, it } from "vitest";

import { rubricChanged } from "./rubric-diff";
import {
  fieldErrors,
  rubricErrorMessages,
  rubricInputSchema,
  skillInputSchema,
  slugSchema,
} from "./schemas";

const criterion = (key: string, overrides = {}) => ({
  key,
  label: "Clarity",
  description: "Is the prompt clear enough?",
  competencyId: "11111111-1111-4111-8111-111111111111",
  weight: 3,
  anchors: {
    strong: "Every category is defined precisely.",
    adequate: "Most categories are defined.",
    weak: "Categories are only named.",
  },
  ...overrides,
});

describe("slugSchema", () => {
  it("normalises case and accepts kebab-case", () => {
    expect(slugSchema.parse("  Prompt-Engineering ")).toBe(
      "prompt-engineering",
    );
  });

  it.each([
    "a",
    "has space",
    "double--hyphen",
    "-leading",
    "trailing-",
    "émoji",
  ])("rejects %j", (value) => {
    expect(slugSchema.safeParse(value).success).toBe(false);
  });
});

describe("skillInputSchema", () => {
  it("coerces form values and reports field errors", () => {
    const result = skillInputSchema.safeParse({
      name: "X",
      slug: "ok-slug",
      summary: "short",
      conceptBrief: "A brief that is long enough to pass.",
      status: "published",
      sortOrder: "2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(Object.keys(errors).sort()).toEqual(["name", "summary"]);
    }
  });
});

describe("rubricInputSchema", () => {
  it("accepts a valid rubric", () => {
    expect(
      rubricInputSchema.safeParse([criterion("key-a"), criterion("key-b")])
        .success,
    ).toBe(true);
  });

  it("requires at least two criteria and unique keys", () => {
    expect(rubricInputSchema.safeParse([criterion("key-a")]).success).toBe(
      false,
    );
    const dup = rubricInputSchema.safeParse([
      criterion("key-a"),
      criterion("key-a"),
    ]);
    expect(dup.success).toBe(false);
    if (!dup.success) {
      expect(rubricErrorMessages(dup.error)).toEqual([
        'Criterion 2 · key: Duplicate key "key-a"',
      ]);
    }
  });

  it("bounds weights to 1-5", () => {
    expect(
      rubricInputSchema.safeParse([
        criterion("key-a", { weight: 6 }),
        criterion("key-b"),
      ]).success,
    ).toBe(false);
  });
});

describe("rubricChanged", () => {
  const base = [criterion("key-a"), criterion("key-b")];

  it("ignores reordering and surrounding whitespace", () => {
    expect(
      rubricChanged(base, [
        criterion("key-b"),
        criterion("key-a", { label: " Clarity " }),
      ]),
    ).toBe(false);
  });

  it.each([
    ["weight", { weight: 5 }],
    ["label", { label: "Precision" }],
    ["competency", { competencyId: "22222222-2222-4222-8222-222222222222" }],
    [
      "anchors",
      {
        anchors: {
          strong: "x".repeat(12),
          adequate: "y".repeat(12),
          weak: "z".repeat(12),
        },
      },
    ],
  ])("detects a %s change", (_, overrides) => {
    expect(
      rubricChanged(base, [criterion("key-a", overrides), criterion("key-b")]),
    ).toBe(true);
  });

  it("detects added or removed criteria", () => {
    expect(rubricChanged(base, [...base, criterion("key-c")])).toBe(true);
    expect(rubricChanged(base, [criterion("key-a")])).toBe(true);
  });
});
