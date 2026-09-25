import { describe, expect, it } from "vitest";

import { checkEvaluationQuota } from "./quota";

const limits = { perUserPerHour: 10, perDemoUserPerHour: 5, globalPerDay: 400 };

describe("checkEvaluationQuota", () => {
  it("allows usage under every limit", () => {
    expect(
      checkEvaluationQuota(
        { userRunsLastHour: 9, globalRunsToday: 399, isAnonymous: false },
        limits,
      ),
    ).toEqual({ allowed: true });
  });

  it("applies the tighter limit to demo accounts", () => {
    const input = { userRunsLastHour: 5, globalRunsToday: 0 };
    expect(
      checkEvaluationQuota({ ...input, isAnonymous: false }, limits).allowed,
    ).toBe(true);
    expect(
      checkEvaluationQuota({ ...input, isAnonymous: true }, limits),
    ).toMatchObject({
      allowed: false,
      reason: "user",
    });
  });

  it("enforces the global daily cap first", () => {
    expect(
      checkEvaluationQuota(
        { userRunsLastHour: 0, globalRunsToday: 400, isAnonymous: false },
        limits,
      ),
    ).toMatchObject({ allowed: false, reason: "global" });
  });
});
