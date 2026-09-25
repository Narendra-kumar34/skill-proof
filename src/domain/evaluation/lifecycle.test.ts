import { describe, expect, it } from "vitest";

import { canRetryEvaluation, isEditable, isStale } from "./lifecycle";

const STALE = 120_000;
const now = new Date("2026-01-01T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);

describe("isStale", () => {
  it("uses evaluationStartedAt for evaluating submissions", () => {
    const state = {
      status: "evaluating" as const,
      submittedAt: ago(10 * STALE),
      evaluationStartedAt: ago(1_000),
    };
    expect(isStale(state, now, STALE)).toBe(false);
    expect(
      isStale({ ...state, evaluationStartedAt: ago(STALE + 1) }, now, STALE),
    ).toBe(true);
  });

  it("uses submittedAt for submissions that never started", () => {
    const state = {
      status: "submitted" as const,
      submittedAt: ago(STALE + 1),
      evaluationStartedAt: null,
    };
    expect(isStale(state, now, STALE)).toBe(true);
  });

  it("restarts the clock when a retry is queued", () => {
    const state = {
      status: "submitted" as const,
      submittedAt: ago(10 * STALE),
      evaluationStartedAt: ago(1_000),
    };
    expect(isStale(state, now, STALE)).toBe(false);
  });
});

describe("canRetryEvaluation", () => {
  const state = (
    status: "draft" | "submitted" | "evaluating" | "evaluated" | "failed",
    age = 0,
  ) => ({
    status,
    submittedAt: ago(age),
    evaluationStartedAt: ago(age),
  });

  it("always allows retrying a failed evaluation", () => {
    expect(canRetryEvaluation(state("failed"), now, STALE)).toBe(true);
  });

  it("allows retrying in-flight work only once it is stale", () => {
    expect(canRetryEvaluation(state("evaluating", 5_000), now, STALE)).toBe(
      false,
    );
    expect(canRetryEvaluation(state("evaluating", STALE + 1), now, STALE)).toBe(
      true,
    );
  });

  it("never re-evaluates drafts or completed evaluations", () => {
    expect(canRetryEvaluation(state("draft", STALE * 10), now, STALE)).toBe(
      false,
    );
    expect(canRetryEvaluation(state("evaluated", STALE * 10), now, STALE)).toBe(
      false,
    );
  });
});

describe("isEditable", () => {
  it("only allows editing drafts", () => {
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("failed")).toBe(false);
    expect(isEditable("evaluated")).toBe(false);
  });
});
